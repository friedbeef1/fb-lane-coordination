#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const benchmark = require('./fb-context-efficiency-benchmark.cjs');
const reviewedPath = path.join(root, 'docs', 'benchmarks', 'control-loop', 'graduated-results.json');

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

function fixture() {
  const declaration = benchmark.buildFrozenDeclaration({ root, reviewedPath });
  return {
    declaration,
    reviewed: readJson(reviewedPath),
    result: benchmark.runExperiment({ root, reviewedPath, declaration }),
  };
}

test('reproduces every one of the 864 reviewed first-three-arm records exactly', () => {
  const reviewed = readJson(reviewedPath);
  const reproduced = benchmark.reproduceReviewedRecords({ root, reviewedPath });
  assert.equal(reproduced.length, 864);
  assert.deepEqual(reproduced, reviewed.rawRecords);
  assert.equal(benchmark.canonicalHash(reproduced), benchmark.canonicalHash(reviewed.rawRecords));
});

test('candidate reuses each Graduated FB outcome, call set, public observation, and common draw', () => {
  const { reviewed, result } = fixture();
  const source = new Map(reviewed.rawRecords
    .filter(row => row.arm === 'graduated-fb')
    .map(row => [`${row.seed}:${row.scenarioId}:${row.caseId}`, row]));
  assert.equal(result.candidateRecords.length, 288);
  for (const candidate of result.candidateRecords) {
    const prior = source.get(`${candidate.seed}:${candidate.scenarioId}:${candidate.caseId}`);
    assert.ok(prior);
    for (const field of [
      'phase', 'executionLevel', 'transition', 'currentPublicFloor',
      'stepDownEligible', 'disposition', 'accepted', 'deliveredArtifact',
      'worseCandidateAttempt', 'routerError', 'comparisonError', 'gateError',
      'diagnosisError', 'diagnosedFailure', 'repairAttempted',
      'unresolvedFailure', 'visibleSafetyTrigger', 'safetyTriggerResponded',
      'componentDraws', 'result', 'calls', 'minimumRequiredLevel',
      'graduationExact', 'falseGraduation', 'missedGraduation',
      'stepDownOpportunity', 'stepDownSuccess', 'reworkAvoided',
    ]) assert.deepEqual(candidate[field], prior[field], `${field} changed for ${candidate.caseId}`);
  }
});

test('cost-only model is derived from the implemented excerpt fraction and preserves core work', () => {
  const { declaration, reviewed, result } = fixture();
  const model = declaration.candidateModel;
  assert.equal(model.contextCost.excerptFraction, 0.75);
  assert.deepEqual(model.contextCost.unchangedCalls, ['process', 'humanDecision']);
  assert.deepEqual(model.repairReuse.proofRerunCallsRemoved, []);
  assert.equal(model.repairReuse.passedProofRerunCost, 0);
  const expectedCosts = {
    focused: { tokenUnits: 68, minutes: 0.075 },
    route: { tokenUnits: 60, minutes: 0.06 },
    comparison: { tokenUnits: 135, minutes: 0.15 },
    qa: { tokenUnits: 113, minutes: 0.1125 },
    safety: { tokenUnits: 75, minutes: 0.075 },
    diagnosis: { tokenUnits: 165, minutes: 0.1875 },
    repair: { tokenUnits: 600, minutes: 1.125 },
  };
  for (const [call, expected] of Object.entries(expectedCosts)) {
    assert.equal(model.costModel[call].tokenUnits, expected.tokenUnits);
    assert.equal(model.costModel[call].minutes, expected.minutes);
  }
  for (const call of model.contextCost.unchangedCalls) {
    assert.deepEqual(model.costModel[call], reviewed.costModel[call]);
  }
  assert.ok(result.candidateRecords.every(row => row.workUnits
    === reviewed.rawRecords.find(priorRow =>
      priorRow.arm === 'graduated-fb'
      && priorRow.seed === row.seed
      && priorRow.scenarioId === row.scenarioId
      && priorRow.caseId === row.caseId).workUnits));
});

test('recomputation yields the hand-derived raw-first candidate totals and rejection', () => {
  const { declaration, result } = fixture();
  const summary = benchmark.recomputeCandidate(result.candidateRecords);
  assert.deepEqual(summary, result.candidateSummary);
  assert.equal(summary.caseCount, 288);
  assert.equal(summary.modeledTokenUnits, 310358);
  assert.equal(summary.modeledMinutes, 555.375);
  assert.equal(summary.productReadyCount, 231);
  assert.equal(summary.productReadyRate, 231 / 288);
  assert.equal(summary.modeledTokenUnitsPerAccepted, 310358 / 231);
  assert.equal(summary.unresolvedFailures, 57);
  assert.equal(summary.missedRequiredControls, 0);
  assert.equal(summary.safetyTriggerResponseRate, 1);
  assert.equal(result.adoption.decision, 'reject');
  assert.deepEqual(result.adoption.failedPredicates, ['modeledTokenUnits']);
  assert.equal(result.task4Eligible, false);
  assert.equal(result.activeGuidanceChanged, false);
  assert.equal(declaration.thresholds.modeledTokenUnitsMaximum, 298080);
});

test('frozen hashes bind the model, thresholds, runner/grader, reviewed evidence, and declaration', () => {
  const { declaration, result } = fixture();
  assert.doesNotThrow(() => benchmark.validateBundle(result, {
    root, reviewedPath, declaration,
  }));
  for (const field of [
    'candidateModel', 'thresholds', 'runnerGraderImplementation',
    'reviewedEvidence', 'declaration',
  ]) assert.match(result.hashes[field], /^[a-f0-9]{64}$/);
  assert.equal(result.hashes.candidateModel, benchmark.canonicalHash(declaration.candidateModel));
  assert.equal(result.hashes.thresholds, benchmark.canonicalHash(declaration.thresholds));
  assert.equal(result.hashes.reviewedEvidence, benchmark.canonicalHash(declaration.reviewedEvidence));
  assert.equal(result.hashes.declaration, benchmark.canonicalHash(declaration));
});

test('validation rejects evidence, draw, cost, summary, hash, boundary, threshold, and rerun-policy mutations', () => {
  const { declaration, result } = fixture();
  const cases = [
    {
      mutateBundle: bundle => { bundle.candidateRecords[0].accepted = !bundle.candidateRecords[0].accepted; },
    },
    {
      mutateBundle: bundle => { bundle.candidateRecords[0].componentDraws.route = 0.123; },
    },
    {
      mutateBundle: bundle => { bundle.candidateRecords[0].modeledTokenUnits += 1; },
    },
    {
      mutateBundle: bundle => { bundle.candidateSummary.modeledTokenUnits += 1; },
    },
    {
      mutateBundle: bundle => { bundle.hashes.candidateModel = '0'.repeat(64); },
    },
    {
      mutateBundle: bundle => { bundle.boundaries.privacyPreserved = false; },
    },
    {
      mutateDeclaration: frozen => { frozen.thresholds.modeledTokenUnitsMaximum += 1; },
    },
    {
      mutateDeclaration: frozen => { frozen.publicationDeclaration.selectiveRerunsAllowed = true; },
    },
    {
      mutateDeclaration: frozen => { frozen.runnerGrader.sha256 = '0'.repeat(64); },
    },
  ];
  for (const item of cases) {
    const alteredBundle = structuredClone(result);
    const alteredDeclaration = structuredClone(declaration);
    item.mutateBundle?.(alteredBundle);
    item.mutateDeclaration?.(alteredDeclaration);
    assert.throws(() => benchmark.validateBundle(alteredBundle, {
      root, reviewedPath, declaration: alteredDeclaration,
    }));
  }
});

test('threshold logic requires every predicate and never converts rejection to adoption', () => {
  const { declaration, result } = fixture();
  const passing = {
    ...result.candidateSummary,
    modeledTokenUnits: 298080,
    modeledMinutes: 557.3,
    productReadyRate: 0.792,
    missedRequiredControls: 0,
    safetyTriggerResponseRate: 1,
    unresolvedFailures: 57,
  };
  assert.equal(benchmark.evaluateAdoption(
    passing, declaration.thresholds, result.boundaries,
  ).decision, 'adopt');
  for (const change of [
    { modeledTokenUnits: 298081 },
    { modeledMinutes: 557.31 },
    { productReadyRate: 0.791 },
    { missedRequiredControls: 1 },
    { safetyTriggerResponseRate: 0.99 },
    { unresolvedFailures: 58 },
  ]) {
    assert.equal(benchmark.evaluateAdoption(
      { ...passing, ...change }, declaration.thresholds, result.boundaries,
    ).decision, 'reject');
  }
  assert.equal(benchmark.evaluateAdoption(
    passing, declaration.thresholds, { ...result.boundaries, releasePreserved: false },
  ).decision, 'reject');
});

test('writer preserves an unfavorable result and refuses an in-place rerun', () => {
  const { declaration, result } = fixture();
  const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-context-efficiency-'));
  try {
    const written = benchmark.writeEvidence(result, {
      root, reviewedPath, declaration, outputDirectory,
    });
    const stored = readJson(written.resultPath);
    const report = fs.readFileSync(written.reportPath, 'utf8');
    assert.equal(stored.adoption.decision, 'reject');
    assert.deepEqual(stored.adoption.failedPredicates, ['modeledTokenUnits']);
    assert.match(report, /Raw modeled token units[\s\S]*Raw modeled minutes[\s\S]*Readiness[\s\S]*Tokens per ready outcome/);
    assert.match(report, /rejected/i);
    assert.match(report, /Task 4 is not eligible/i);
    assert.match(report, /no selective rerun/i);
    assert.throws(() => benchmark.writeEvidence(result, {
      root, reviewedPath, declaration, outputDirectory,
    }), /already exists|refus/i);
  } finally {
    fs.rmSync(outputDirectory, { recursive: true, force: true });
  }
});
