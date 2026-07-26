#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const benchmark = require('./fb-graduated-control-benchmark.cjs');
const truthPath = path.join(root, 'tools', 'fixtures', 'fb-graduated-control-truth.json');
const settingsPath = path.join(root, 'tools', 'fixtures', 'fb-graduated-control-settings.json');

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

test('frozen study has four explicit scenario-specific workflows, 24 sequential cases each, seven phases, and three seeds', () => {
  const source = readJson(truthPath);
  const truth = benchmark.expandTruth(source);
  const settings = readJson(settingsPath);
  assert.deepEqual(settings.seeds, [11, 29, 47]);
  assert.equal(source.caseBlueprints, undefined, 'one shared rotated blueprint is forbidden');
  assert.equal(truth.scenarios.length, 4);
  const signatures = new Set();
  const domainEvents = new Set();
  for (const scenario of truth.scenarios) {
    assert.equal(scenario.cases.length, 24);
    assert.equal(new Set(scenario.cases.map(row => row.sequence)).size, 24);
    assert.deepEqual([...new Set(scenario.cases.map(row => row.phase))], settings.phases);
    signatures.add(scenario.cases.map(row => row.kind).join('|'));
    for (const row of scenario.cases) {
      assert.match(row.visible.domainEvent, new RegExp(`^${scenario.id}:`));
      assert.equal(domainEvents.has(row.visible.domainEvent), false, `duplicate domain event ${row.visible.domainEvent}`);
      domainEvents.add(row.visible.domainEvent);
    }
  }
  assert.equal(signatures.size, 4, 'scenario condition sequences must be structurally distinct');
  assert.equal(domainEvents.size, 96);
});

test('fixtures cover light, improvement, preservation, regression, ambiguity, repeated failure, safety, repair, unresolved and stable work', () => {
  const truth = benchmark.expandTruth(readJson(truthPath));
  const conditions = new Set(truth.scenarios.flatMap(s => s.cases.flatMap(row => row.hidden.conditions)));
  for (const condition of [
    'light', 'worth-processing', 'already-good', 'regression', 'ambiguous-route',
    'repeated-failure', 'sensitive', 'repair-success', 'repair-unresolved',
    'post-repair-stable',
  ]) assert.ok(conditions.has(condition), `missing ${condition}`);
});

test('arm projection excludes hidden truth and hidden changes cannot affect execution', () => {
  const truth = benchmark.expandTruth(readJson(truthPath));
  const settings = readJson(settingsPath);
  const item = truth.scenarios[0].cases[8];
  const publicItem = benchmark.projectPublicCase(item);
  assert.equal(publicItem.hidden, undefined);
  assert.doesNotMatch(JSON.stringify(publicItem), /expectedDisposition|failureClass|conditions/);
  const first = benchmark.executeCase('graduated-fb', publicItem, benchmark.initialState(), settings, 11);
  const changed = structuredClone(item);
  changed.hidden.expectedDisposition = changed.hidden.expectedDisposition === 'skip' ? 'process' : 'skip';
  changed.hidden.failureClass = 'Other';
  const second = benchmark.executeCase('graduated-fb', benchmark.projectPublicCase(changed), benchmark.initialState(), settings, 11);
  assert.deepEqual(first, second);
});

test('all three arms execute every case exactly once for every seed', () => {
  const result = benchmark.runExperiment({ truthPath, settingsPath });
  assert.equal(result.rawRecords.length, 4 * 24 * 3 * 3);
  const keys = new Set(result.rawRecords.map(row => `${row.scenarioId}:${row.caseId}:${row.seed}:${row.arm}`));
  assert.equal(keys.size, 864);
  assert.deepEqual([...new Set(result.rawRecords.map(row => row.arm))].sort(),
    ['full-fb', 'graduated-fb', 'process-all']);
});

test('process-all pays for exactly one final QA per case and no FB focused stage', () => {
  const result = benchmark.runExperiment({ truthPath, settingsPath });
  const rows = result.rawRecords.filter(row => row.arm === 'process-all');
  assert.equal(rows.length, 288);
  assert.ok(rows.every(row => row.calls.process === 1));
  assert.ok(rows.every(row => row.calls.qa === 1));
  assert.ok(rows.every(row => row.calls.focused === 0));
  assert.equal(rows.reduce((sum, row) => sum + row.calls.qa, 0), 288);
});

test('like-for-like fallibility uses common random numbers independent of arm', () => {
  const result = benchmark.runExperiment({ truthPath, settingsPath });
  for (const component of ['route', 'comparison', 'gate', 'diagnosis', 'repair']) {
    const grouped = new Map();
    for (const row of result.rawRecords.filter(row => row.componentDraws[component] !== undefined)) {
      const key = `${row.seed}:${row.scenarioId}:${row.caseId}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row.componentDraws[component]);
    }
    assert.ok([...grouped.values()].some(values => values.length > 1), `no shared ${component} calls`);
    assert.ok([...grouped.values()].every(values => values.every(value => value === values[0])),
      `${component} draws differ by arm`);
  }
});

test('graduated transitions use visible evidence, safety escalates immediately, and step-down is truly eligible and safe', () => {
  const result = benchmark.runExperiment({ truthPath, settingsPath });
  const rows = result.rawRecords.filter(row => row.arm === 'graduated-fb');
  assert.ok(rows.some(row => row.transition?.to > row.transition?.from));
  const sensitive = rows.filter(row => row.visibleSafetyTrigger);
  assert.ok(sensitive.length > 0);
  assert.ok(sensitive.every(row => row.executionLevel === 4 && row.safetyTriggerResponded));
  const demotions = rows.filter(row => row.transition?.direction === 'down');
  assert.ok(demotions.length > 0);
  assert.ok(demotions.every(row =>
    row.stepDownOpportunity
    && row.transition.from - row.transition.to === 1
    && row.transition.evidence.cleanStreak >= 3));
  assert.ok(rows.filter(row =>
    row.currentPublicFloor > 0 || row.visibleSafetyTrigger).every(row =>
    row.transition?.direction !== 'down' || row.executionLevel >= row.currentPublicFloor));
  assert.ok(rows.filter(row => row.stepDownSuccess).every(row =>
    !row.missedGraduation && row.executionLevel >= row.minimumRequiredLevel));
  assert.ok(rows.every(row =>
    Number(row.graduationExact) + Number(row.falseGraduation) + Number(row.missedGraduation) === 1));
});

test('frozen declared thresholds, costs, and actual executable grader are hash-bound without claiming external preregistration', () => {
  const result = benchmark.runExperiment({ truthPath, settingsPath });
  assert.equal(result.inputs.policy.level1MinimumVolume, 4);
  assert.equal(result.inputs.policy.level2ObservedRegressions, 1);
  assert.equal(result.inputs.policy.level3ClassifiableFailures, 2);
  assert.equal(result.inputs.policy.stepDownCleanWindow, 3);
  for (const key of ['truth', 'settings', 'policy', 'costModel', 'graderImplementation', 'seeds']) {
    assert.match(result.hashes[key], /^[a-f0-9]{64}$/);
  }
  assert.equal(result.hashes.grader, undefined);
  assert.match(result.graderEvidence.limitation, /does not prove.*pre.?registration/i);
  assert.match(result.graderEvidence.executableContract, /gradeRecord/);
});

test('full and graduated controls are fallible and preserve unfavorable outcomes', () => {
  const result = benchmark.runExperiment({ truthPath, settingsPath });
  assert.ok(result.rawRecords.some(row => row.arm !== 'process-all' && row.routerError));
  assert.ok(result.rawRecords.some(row => row.arm !== 'process-all' && row.comparisonError));
  assert.ok(result.rawRecords.some(row => row.arm !== 'process-all' && row.gateError));
  assert.ok(result.rawRecords.some(row => row.arm !== 'process-all' && row.diagnosisCorrect === false));
  assert.ok(result.rawRecords.some(row => row.arm !== 'process-all' && row.repairAttempted && !row.accepted));
  assert.ok(result.rawRecords.some(row =>
    row.arm !== 'process-all'
    && (row.routerError || row.comparisonError || row.gateError || row.diagnosisError)
    && !row.accepted), 'fallible controls must preserve at least one unfavorable outcome');
});

test('recomputed aggregates cover aggregate, scenario, phase, seed, level and signed comparisons', () => {
  const result = benchmark.runExperiment({ truthPath, settingsPath });
  assert.deepEqual(benchmark.recompute(result.rawRecords), result.summary);
  assert.equal(result.summary.scenarioSeed.length, 12);
  assert.equal(result.summary.byScenario.length, 4 * 3);
  assert.equal(result.summary.bySeed.length, 3 * 3);
  assert.ok(result.summary.byPhase.length >= 6 * 3);
  assert.equal(result.summary.seedRanges.length, 3);
  assert.equal(result.summary.scenarioSeedRanges.length, 4 * 3);
  assert.ok(result.summary.phaseSeedRanges.length >= 6 * 3);
  assert.ok(result.summary.seedRanges.every(row =>
    row.productReadyRate.range.length === 2
    && Number.isFinite(row.productReadyRate.median)));
  assert.ok(result.summary.levelUse.some(row => row.arm === 'graduated-fb' && row.level === 0));
  assert.ok(result.summary.levelUse.some(row => row.arm === 'graduated-fb' && row.level === 4));
  assert.ok(result.summary.signedDifferences.graduatedMinusProcessAll);
  assert.ok(result.summary.signedDifferences.graduatedMinusFullFb);
});

test('validation rejects missing, duplicate, selective, altered, non-finite, private and hash-inconsistent evidence', () => {
  const result = benchmark.runExperiment({ truthPath, settingsPath });
  assert.doesNotThrow(() => benchmark.validateBundle(result));
  const mutations = [
    bundle => bundle.rawRecords.pop(),
    bundle => bundle.rawRecords.push(structuredClone(bundle.rawRecords[0])),
    bundle => { bundle.summary.aggregate[0].productReadyCount += 1; },
    bundle => { bundle.rawRecords[0].accepted = !bundle.rawRecords[0].accepted; bundle.summary = benchmark.recompute(bundle.rawRecords); },
    bundle => { bundle.rawRecords[0].workUnits = Infinity; },
    bundle => { bundle.rawRecords[0].privateReasoning = 'hidden'; },
    bundle => { bundle.hashes.policy = '0'.repeat(64); },
  ];
  for (const mutate of mutations) {
    const altered = structuredClone(result);
    mutate(altered);
    assert.throws(() => benchmark.validateBundle(altered));
  }
});

test('a run is deterministic and declares no selective rerun while admitting historical execution is not bundle-verifiable', () => {
  const first = benchmark.runExperiment({ truthPath, settingsPath });
  const second = benchmark.runExperiment({ truthPath, settingsPath });
  assert.deepEqual(first, second);
  assert.equal(first.runDeclaration.selectiveRerunsAllowed, false);
  assert.equal(first.runDeclaration.postResultTuningPerformed, false);
  assert.match(first.runDeclaration.limitation, /cannot independently prove/i);
  assert.equal(first.runPolicy, undefined);
});

test('writer emits validated machine evidence and a report with scenario, phase, seed and limitation tables', () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-graduated-control-'));
  try {
    const written = benchmark.runAndWrite({ root, truthPath, settingsPath, outputDirectory: output });
    const report = fs.readFileSync(written.reportPath, 'utf8');
    assert.match(report, /three-arm graduated-control benchmark/i);
    assert.match(report, /Process-all[\s\S]*Full FB[\s\S]*Graduated FB/);
    assert.match(report, /## Scenario results/);
    assert.match(report, /## Phase results/);
    assert.match(report, /## Seed ranges/);
    assert.match(report, /modeled, not observed Codex usage/i);
    assert.match(report, /fixed-treatment benchmark/);
    assert.match(report, /unfavourable|unfavorable/i);
    assert.match(report, /frozen declared settings/i);
    assert.match(report, /no external preregistration/i);
    assert.match(report, /supersedes/i);
    assert.doesNotMatch(report, /\bpre-registered\b/i);
    assert.doesNotThrow(() => benchmark.validateBundle(readJson(written.resultPath)));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test('canonical and packaged pages link both fixed and graduated evidence', () => {
  const canonical = fs.readFileSync(path.join(root, 'docs', 'fb', 'control-loop.md'), 'utf8');
  const packaged = fs.readFileSync(path.join(root, 'plugins', 'fb-lane-coordination', 'docs', 'fb', 'control-loop.md'), 'utf8');
  assert.equal(canonical, packaged);
  assert.match(canonical, /fixed-treatment benchmark/i);
  assert.match(canonical, /graduated benchmark/i);
  assert.match(canonical, /graduated\.md/);
});
