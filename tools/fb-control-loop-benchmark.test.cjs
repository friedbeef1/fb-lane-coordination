#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const benchmark = require('./fb-control-loop-benchmark.cjs');
const truthPath = path.join(root, 'tools', 'fixtures', 'fb-control-loop-benchmark-truth.json');
const settingsPath = path.join(root, 'tools', 'fixtures', 'fb-control-loop-benchmark-settings.json');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

test('frozen fixtures cover decision-relevant and unfavorable cases', () => {
  const truth = loadJson(truthPath);
  assert.equal(truth.cases.length, 8);
  const categories = new Set(truth.cases.map(item => item.category));
  for (const category of [
    'already-good', 'needs-processing', 'degraded-by-processing', 'repairable',
    'unresolved', 'ambiguous-route', 'safety-triggered', 'misleading-candidate',
  ]) assert.ok(categories.has(category), `missing ${category}`);
  assert.ok(truth.cases.some(item => item.fbExpectedToLose === true), 'fixture must preserve a valid unfavorable FB case');
});

test('both arms consume the same frozen truth and produce deterministic raw records', () => {
  const first = benchmark.runExperiment({ truthPath, settingsPath });
  const second = benchmark.runExperiment({ truthPath, settingsPath });
  assert.deepEqual(first, second);
  assert.equal(first.rawRecords.length, 16);
  for (const caseId of first.inputs.caseIds) {
    assert.deepEqual(
      first.rawRecords.filter(row => row.caseId === caseId).map(row => row.arm).sort(),
      ['baseline', 'fb-control-loop'],
    );
  }
});

test('baseline is process-all plus one final QA while FB routes and uses distinct gates', () => {
  const result = benchmark.runExperiment({ truthPath, settingsPath });
  const baseline = result.rawRecords.filter(row => row.arm === 'baseline');
  const fb = result.rawRecords.filter(row => row.arm === 'fb-control-loop');
  assert.ok(baseline.every(row => row.calls.process === 1 && row.calls.qa === 1));
  assert.ok(baseline.every(row => row.calls.comparison === 0 && row.calls.safety === 0 && row.calls.diagnosis === 0));
  assert.ok(fb.some(row => row.disposition === 'skip' && row.calls.process === 0));
  assert.ok(fb.some(row => row.calls.comparison === 1));
  assert.ok(fb.some(row => row.calls.safety === 1));
  assert.ok(fb.some(row => row.calls.diagnosis === 1 && row.calls.repair === 1));
});

test('aggregates recompute from raw records and detect selective or altered results', () => {
  const result = benchmark.runExperiment({ truthPath, settingsPath });
  assert.deepEqual(benchmark.recompute(result.rawRecords, result.costModel), result.summary);
  assert.doesNotThrow(() => benchmark.validateBundle(result));
  const missing = structuredClone(result);
  missing.rawRecords.pop();
  assert.throws(() => benchmark.validateBundle(missing), /missing|expected|records/i);
  const altered = structuredClone(result);
  altered.summary.arms.baseline.acceptedCount += 1;
  assert.throws(() => benchmark.validateBundle(altered), /recompute|summary/i);
  const rewritten = structuredClone(result);
  rewritten.rawRecords[0].accepted = !rewritten.rawRecords[0].accepted;
  rewritten.summary = benchmark.recompute(rewritten.rawRecords, rewritten.costModel);
  assert.throws(() => benchmark.validateBundle(rewritten), /raw|frozen|outcome/i);
});

test('hash validation rejects changed truth, settings, grader, or non-finite metrics', () => {
  const result = benchmark.runExperiment({ truthPath, settingsPath });
  for (const key of ['truth', 'settings', 'costModel', 'grader', 'seeds']) {
    const altered = structuredClone(result);
    altered.hashes[key] = '0'.repeat(64);
    assert.throws(() => benchmark.validateBundle(altered), /hash/i);
  }
  const nonFinite = structuredClone(result);
  nonFinite.rawRecords[0].workUnits = Infinity;
  assert.throws(() => benchmark.validateBundle(nonFinite), /finite/i);
  const changedCost = structuredClone(result);
  changedCost.costModel.process.tokenUnits += 1;
  changedCost.summary = benchmark.recompute(changedCost.rawRecords, changedCost.costModel);
  assert.throws(() => benchmark.validateBundle(changedCost), /hash|cost/i);
});

test('privacy validation rejects credentials and private reasoning material', () => {
  const result = benchmark.runExperiment({ truthPath, settingsPath });
  const credential = structuredClone(result);
  credential.rawRecords[0].result = 'token=supersecret123456';
  assert.throws(() => benchmark.validateBundle(credential), /private|credential|forbidden/i);
  const reasoning = structuredClone(result);
  reasoning.rawRecords[0].privateReasoning = 'hidden';
  assert.throws(() => benchmark.validateBundle(reasoning), /private|forbidden/i);
});

test('sensitivity is pre-registered, complete, and retains every seed outcome', () => {
  const result = benchmark.runExperiment({ truthPath, settingsPath });
  const settings = loadJson(settingsPath);
  const expected = settings.sensitivity.goodShares.length
    * settings.sensitivity.transformationReliabilities.length
    * settings.seeds.length
    * 2;
  assert.equal(result.sensitivity.raw.length, expected);
  assert.equal(result.sensitivity.summary.length,
    settings.sensitivity.goodShares.length * settings.sensitivity.transformationReliabilities.length * 2);
  assert.ok(result.sensitivity.summary.every(row => Number.isFinite(row.medianAcceptedRate)));
  assert.ok(result.sensitivity.summary.every(row => row.rangeAcceptedRate.length === 2));
});

test('writer emits validated machine results and a transparent readable report', () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-control-loop-benchmark-'));
  try {
    const written = benchmark.runAndWrite({ root, truthPath, settingsPath, outputDirectory: output });
    assert.ok(fs.existsSync(written.resultPath));
    assert.ok(fs.existsSync(written.reportPath));
    const report = fs.readFileSync(written.reportPath, 'utf8');
    assert.match(report, /directly observed deterministic counts/i);
    assert.match(report, /modeled token units/i);
    assert.match(report, /does not establish actual Codex token savings/i);
    assert.match(report, /unfavourable|unfavorable/i);
    assert.match(report, /## Raw case outcomes/);
    assert.match(report, /## Fixed cost assumptions/);
    assert.match(report, /## Pre-registered sensitivity results/);
    assert.match(report, /25% already-good.*95% reliability[\s\S]*50% already-good.*95% reliability/i);
    assert.match(report, /SHA-256/);
    assert.match(report, /\[machine-readable result\]\(results\.json\)/);
    assert.doesNotThrow(() => benchmark.validateBundle(loadJson(written.resultPath)));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test('canonical documentation links quantified results and labels modeled values', () => {
  const controlLoop = fs.readFileSync(path.join(root, 'docs', 'fb', 'control-loop.md'), 'utf8');
  assert.match(controlLoop, /Quantified control-loop experiment/);
  assert.match(controlLoop, /modeled, not observed Codex usage/i);
  assert.match(controlLoop, /https:\/\/github\.com\/friedbeef1\/fb-lane-coordination\/blob\/main\/docs\/benchmarks\/control-loop\/README\.md/);
});
