'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const benchmark = require('./fb-preventive-context-benchmark.cjs');

test('classifies exactly 264 deliverables and 24 intentional blockers across four product-work families', () => {
  const classification = benchmark.classifyFixture();

  assert.deepEqual(classification.families, ['bugs', 'design', 'features', 'tech']);
  assert.deepEqual(classification.familyCaseCounts, {
    bugs: 24,
    design: 24,
    features: 24,
    tech: 24,
  });
  assert.equal(classification.deliverableCaseCount, 88);
  assert.equal(classification.intentionalBlockerCaseCount, 8);
  assert.equal(classification.deliverableObservationCount, 264);
  assert.equal(classification.intentionalBlockerObservationCount, 24);
  assert.equal(classification.totalObservationCount, 288);
});

test('first-pass scoring never credits a repair and keeps blockers separate', () => {
  const result = benchmark.runControlledDiagnostic();

  assert.equal(result.records.length, 864);
  for (const row of result.records) {
    assert.equal(row.firstPassReady, row.accepted && !row.repairAttempted);
    assert.equal(row.repairCredited, false);
    assert.equal(row.firstPassCalls.diagnosis, 0);
    assert.equal(row.firstPassCalls.repair, 0);
    assert(row.firstPassModeledTokenUnits <= row.modeledTokenUnits);
    assert(row.firstPassModeledMinutes <= row.modeledMinutes);
  }
  assert.deepEqual(result.summary.arms.map(arm => ({
    arm: arm.arm,
    firstPassReady: arm.firstPassReady,
  })), [
    { arm: 'process-all', firstPassReady: 183 },
    { arm: 'full-fb', firstPassReady: 195 },
    { arm: 'graduated-fb', firstPassReady: 197 },
  ]);
  for (const arm of result.summary.arms) {
    assert.equal(arm.deliverableCount, 264);
    assert.equal(arm.intentionalBlockerCount, 24);
    assert.equal(arm.correctBlockers, 24);
  }
});

test('sensitivity curve derives both milestones without assuming prevention accuracy', () => {
  const curve = benchmark.preventionSensitivity({
    baselineReady: 231,
    deliverableCount: 264,
    rates: [0, 0.25, 0.5, 0.75, 0.91, 0.95, 0.99, 1],
  });

  assert.deepEqual(curve.milestones, {
    readiness91: {
      requiredReady: 241,
      additionalReady: 10,
      minimumPreventionRate: 10 / 33,
    },
    readiness99: {
      requiredReady: 262,
      additionalReady: 31,
      minimumPreventionRate: 31 / 33,
    },
  });
  assert.deepEqual(curve.points.map(point => point.rate), [
    0, 0.25, 0.5, 0.75, 0.91, 0.95, 0.99, 1,
  ]);
  assert.equal(curve.assumedObservedPreventionRate, null);
});

test('sensitivity never relabels the 24 intentional blockers', () => {
  const curve = benchmark.preventionSensitivity({
    baselineReady: 231,
    deliverableCount: 264,
    rates: [0, 1],
  });

  assert.equal(curve.points[1].ready, 264);
  assert.equal(curve.points[1].correctBlockers, 24);
  assert.equal(curve.points[1].totalResolvedOutcomes, 288);
});

test('frozen declaration binds runner, fixtures, milestones, and no-assumption policy', () => {
  assert.equal(benchmark.validateFrozenDeclaration(), true);
});

test('writes one immutable diagnostic and validates exact recomputation', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-preventive-'));
  const written = benchmark.writeDiagnostic({ outputDirectory: directory });

  assert.equal(written.bundle.sensitivity.milestones.readiness91.additionalReady, 44);
  assert.equal(
    written.bundle.sensitivity.milestones.readiness91.minimumPreventionRate,
    44 / 67,
  );
  assert.equal(written.bundle.sensitivity.milestones.readiness99.additionalReady, 65);
  assert.equal(
    written.bundle.sensitivity.milestones.readiness99.minimumPreventionRate,
    65 / 67,
  );
  assert.equal(benchmark.validateBundle(JSON.parse(fs.readFileSync(written.resultPath))), true);
  assert.throws(
    () => benchmark.writeDiagnostic({ outputDirectory: directory }),
    /already exists/,
  );
  const mutated = structuredClone(written.bundle);
  mutated.sensitivity.points[0].ready += 1;
  assert.throws(() => benchmark.validateBundle(mutated), /sensitivity/i);
});
