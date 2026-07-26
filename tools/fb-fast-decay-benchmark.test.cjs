#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const candidate = require('./fb-fast-decay-benchmark.cjs');
const prior = require('./fb-graduated-control-benchmark.cjs');
const truthPath = path.join(__dirname, 'fixtures', 'fb-graduated-control-truth.json');
const settingsPath = path.join(__dirname, 'fixtures', 'fb-fast-decay-settings.json');
const priorResultPath = path.join(root, 'docs', 'benchmarks', 'control-loop', 'graduated-results.json');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

test('four-arm run has 1,152 records and reproduces all reviewed v1 records exactly', () => {
  const result = candidate.runExperiment({ truthPath, settingsPath });
  const reviewed = readJson(priorResultPath);
  assert.equal(result.rawRecords.length, 1152);
  assert.deepEqual([...new Set(result.rawRecords.map(row => row.arm))].sort(),
    ['fast-decay-v2', 'full-fb', 'graduated-fb', 'process-all']);
  assert.deepEqual(
    result.rawRecords.filter(row => row.arm !== 'fast-decay-v2'),
    reviewed.rawRecords,
  );
  assert.deepEqual(
    result.summary.aggregate.filter(row => row.arm !== 'fast-decay-v2'),
    reviewed.summary.aggregate,
  );
});

test('candidate sees public projection only and hidden truth changes cannot affect it', () => {
  const truth = candidate.expandTruth(readJson(truthPath));
  const settings = readJson(settingsPath);
  const item = truth.scenarios[0].cases[7];
  const publicItem = candidate.projectPublicCase(item);
  assert.equal(publicItem.hidden, undefined);
  const one = candidate.executeFastDecayCase(publicItem, candidate.initialFastDecayState(), settings, 11, 'media');
  const changed = structuredClone(item);
  changed.hidden.minimumRequiredLevel = 4;
  changed.hidden.failureClass = 'Other';
  const two = candidate.executeFastDecayCase(candidate.projectPublicCase(changed), candidate.initialFastDecayState(), settings, 11, 'media');
  assert.deepEqual(one, two);
});

test('single non-safety evidence raises only the current item', () => {
  const settings = readJson(settingsPath);
  const state = candidate.initialFastDecayState();
  const regression = candidate.makePublicProbe({ regression: true });
  const first = candidate.chooseFastDecayLevel(state, regression, settings.fastDecayPolicy);
  assert.equal(first.level, 2);
  assert.equal(first.persistentLevel, 0);
  candidate.updateFastDecayState(state, regression, { accepted: true, worseCandidateAttempt: false }, first, settings.fastDecayPolicy);
  const clean = candidate.chooseFastDecayLevel(state, candidate.makePublicProbe(), settings.fastDecayPolicy);
  assert.equal(clean.level, 0);
});

test('two like observations in six cases create persistent routing, comparison and diagnosis floors', () => {
  const settings = readJson(settingsPath);
  for (const [probe, expected] of [
    [{ preserve: true }, 1],
    [{ regression: true }, 2],
    [{ failure: 'output_defect' }, 3],
  ]) {
    const state = candidate.initialFastDecayState();
    for (let sequence = 1; sequence <= 2; sequence += 1) {
      const item = candidate.makePublicProbe({ ...probe, sequence });
      const choice = candidate.chooseFastDecayLevel(state, item, settings.fastDecayPolicy);
      candidate.updateFastDecayState(state, item, { accepted: false, worseCandidateAttempt: Boolean(probe.regression) }, choice, settings.fastDecayPolicy);
    }
    assert.equal(state.persistentLevel, expected);
  }
});

test('rolling evidence expires and two clean outcomes permit direct multi-level decay', () => {
  const settings = readJson(settingsPath);
  const state = candidate.initialFastDecayState();
  state.persistentLevel = 3;
  state.evidenceWindow = [
    { sequence: 1, kind: 'diagnosis', unresolved: false },
    { sequence: 2, kind: 'diagnosis', unresolved: false },
  ];
  state.seen = 7;
  state.cleanStreak = 2;
  const item = candidate.makePublicProbe({ sequence: 8 });
  const choice = candidate.chooseFastDecayLevel(state, item, settings.fastDecayPolicy);
  assert.equal(choice.level, 0);
  assert.deepEqual(choice.transition, {
    direction: 'down', from: 3, to: 0,
    reason: 'expired corroboration after two clean outcomes',
  });
});

test('unresolved diagnosis holds Level 3 until accepted classified repair and clean decay', () => {
  const settings = readJson(settingsPath);
  const state = candidate.initialFastDecayState();
  state.seen = 20;
  state.evidenceWindow = [{ sequence: 1, kind: 'diagnosis', unresolved: true }];
  const ordinary = candidate.chooseFastDecayLevel(state, candidate.makePublicProbe({ sequence: 21 }), settings.fastDecayPolicy);
  assert.equal(ordinary.evidenceWindow.length, 1);
  assert.equal(ordinary.persistentLevel, 3);
  assert.equal(ordinary.level, 3);
  const safety = candidate.chooseFastDecayLevel(state, candidate.makePublicProbe({ sequence: 21, safety: 'privacy' }), settings.fastDecayPolicy);
  assert.equal(safety.level, 4);
  assert.equal(safety.temporaryEscalation, true);
  assert.equal(safety.persistentLevel, 3);
  const repaired = candidate.makePublicProbe({ sequence: 21, failure: 'output_defect' });
  const repairedChoice = candidate.chooseFastDecayLevel(state, repaired, settings.fastDecayPolicy);
  candidate.updateFastDecayState(state, repaired,
    { accepted: true, worseCandidateAttempt: false }, repairedChoice, settings.fastDecayPolicy);
  assert.ok(state.evidenceWindow.every(entry => entry.unresolved === false));
  for (const sequence of [22, 23]) {
    const clean = candidate.makePublicProbe({ sequence });
    const cleanChoice = candidate.chooseFastDecayLevel(state, clean, settings.fastDecayPolicy);
    candidate.updateFastDecayState(state, clean,
      { accepted: true, worseCandidateAttempt: false }, cleanChoice, settings.fastDecayPolicy);
  }
  const decayed = candidate.chooseFastDecayLevel(state,
    candidate.makePublicProbe({ sequence: 24 }), settings.fastDecayPolicy);
  assert.equal(decayed.level, 0);
});

test('common component draws match v1 and fast decay for like-for-like calls', () => {
  const result = candidate.runExperiment({ truthPath, settingsPath });
  for (const component of ['route', 'comparison', 'gate', 'diagnosis', 'repair']) {
    const groups = new Map();
    for (const row of result.rawRecords.filter(row => row.componentDraws[component] !== undefined)) {
      const key = `${row.seed}:${row.scenarioId}:${row.caseId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row.componentDraws[component]);
    }
    assert.ok([...groups.values()].every(values => values.every(value => value === values[0])));
  }
});

test('candidate records floors, evidence, transition events and excess-control measures', () => {
  const result = candidate.runExperiment({ truthPath, settingsPath });
  const rows = result.rawRecords.filter(row => row.arm === 'fast-decay-v2');
  assert.equal(rows.length, 288);
  assert.ok(rows.every(row => Number.isInteger(row.currentItemFloor)));
  assert.ok(rows.every(row => Number.isInteger(row.persistentLevel)));
  assert.ok(rows.every(row => Array.isArray(row.evidenceWindow)));
  assert.ok(rows.some(row => row.transitionEvent?.direction === 'up'));
  assert.ok(rows.some(row => row.transitionEvent?.direction === 'down'));
  const summary = result.summary.aggregate.find(row => row.arm === 'fast-decay-v2');
  for (const key of ['excessControlCases', 'excessLevelUnits', 'persistentPromotionEvents',
    'falsePersistentPromotions', 'temporaryEscalations']) assert.ok(Number.isFinite(summary[key]), key);
});

test('all adoption predicates are mechanical and internally consistent', () => {
  const result = candidate.runExperiment({ truthPath, settingsPath });
  assert.deepEqual(candidate.evaluateAdoption(result.summary), result.adoption);
  assert.equal(typeof result.adoption.passed, 'boolean');
  assert.equal(Object.values(result.adoption.predicates).every(row =>
    typeof row.passed === 'boolean' && typeof row.actual !== 'undefined'), true);
});

test('bundle rejects alteration, hidden/private fields, missing records and invalid recomputation', () => {
  const result = candidate.runExperiment({ truthPath, settingsPath });
  assert.doesNotThrow(() => candidate.validateBundle(result));
  for (const mutate of [
    bundle => bundle.rawRecords.pop(),
    bundle => { bundle.rawRecords[0].privateReasoning = 'hidden'; },
    bundle => { bundle.rawRecords.at(-1).accepted = !bundle.rawRecords.at(-1).accepted; },
    bundle => { bundle.adoption.passed = !bundle.adoption.passed; },
  ]) {
    const changed = structuredClone(result);
    mutate(changed);
    assert.throws(() => candidate.validateBundle(changed));
  }
});

test('writer emits one reviewed-history-preserving report and valid evidence', () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-fast-decay-'));
  try {
    const written = candidate.runAndWrite({ root, truthPath, settingsPath, outputDirectory: output });
    const report = fs.readFileSync(written.reportPath, 'utf8');
    assert.match(report, /four-arm fast-decay benchmark/i);
    assert.match(report, /adoption gate/i);
    assert.match(report, /modeled, not observed Codex usage/i);
    assert.match(report, /cannot independently prove absence of tuning/i);
    assert.match(report, /supersedes invalid result/i);
    assert.doesNotThrow(() => candidate.validateBundle(readJson(written.resultPath)));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test('checked report is exactly rendered from the authoritative machine bundle', () => {
  const bundle = readJson(path.join(root, 'docs', 'benchmarks', 'control-loop', 'fast-decay-results.json'));
  const report = fs.readFileSync(path.join(root, 'docs', 'benchmarks', 'control-loop', 'fast-decay.md'), 'utf8');
  assert.equal(report, candidate.reportMarkdown(bundle));
});

test('replacement discloses the invalidated evidence and development-history boundary', () => {
  const settings = readJson(settingsPath);
  assert.equal(settings.supersedesFastDecay.resultSha256,
    'fef75ab0e470a0007f74210c34cea94aa1e936cd1c0818ee26c97b13931d3915');
  assert.equal(settings.supersedesFastDecay.sourceCommit,
    'ebe22ed402cff2632d836be39e7ea69b5f30a42f');
  const bundle = candidate.runExperiment({ truthPath, settingsPath });
  assert.match(bundle.runDeclaration.developmentHistory, /pre-authoritative probe/i);
  assert.match(bundle.runDeclaration.developmentHistory, /invalidated/i);
  assert.match(bundle.runDeclaration.limitation, /cannot independently prove/i);
});

test('rejected evidence is linked while canonical guidance and skills remain unchanged', () => {
  for (const relative of [
    'docs/benchmarks/control-loop/fast-decay.md',
    'docs/benchmarks/control-loop/fast-decay-results.json',
  ]) assert.ok(fs.existsSync(path.join(root, relative)), relative);
  for (const relative of [
    'docs/fb/control-loop.md',
    'skills/bfm/SKILL.md',
    'skills/fb-product/SKILL.md',
    'skills/fb-lane-coordination/SKILL.md',
  ]) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, relative), 'utf8'), /fast-decay-v2/i);
  }
  assert.match(fs.readFileSync(path.join(root, 'docs/benchmarks/control-loop/README.md'), 'utf8'),
    /\[four-arm fast-decay experiment\]\(fast-decay\.md\)/);
  assert.match(fs.readFileSync(path.join(root, 'docs/qa/TASK-050.md'), 'utf8'),
    /\[fast-decay report\]\(\.\.\/benchmarks\/control-loop\/fast-decay\.md\)/);
});

test('reviewed Task 5 evidence remains immutable', () => {
  const reviewed = readJson(priorResultPath);
  const rerun = prior.runExperiment({ truthPath, settingsPath: path.join(__dirname, 'fixtures', 'fb-graduated-control-settings.json') });
  assert.deepEqual(rerun, reviewed);
});
