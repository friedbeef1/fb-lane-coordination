#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const pilotModule = path.join(__dirname, 'fb-project-graph-pilot.cjs');
assert.ok(fs.existsSync(pilotModule), 'fb-project-graph-pilot.cjs must implement the visible pilot');

const {
  createScenario,
  runPilot,
  verifyStoredResults,
} = require(pilotModule);

test('visible examples cover Level 1, Level 2 recommendation, and safe fallback', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-graph-pilot-'));
  const results = await runPilot({ root, repositoryRoot: path.resolve(__dirname, '..'), includeUnmirror: false });
  assert.strictEqual(results.newProject.level, 1);
  assert.strictEqual(results.growingProject.graduation.action, 'recommend-scoped-level-2');
  assert.strictEqual(results.growingProject.semanticExtractionRan, false);
  assert.strictEqual(results.damagedGraph.route, 'normalized-record-fallback');
});

test('both comparison arms start six logical workstreams concurrently and preserve correctness', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-graph-concurrent-'));
  const results = await runPilot({ root, repositoryRoot: path.resolve(__dirname, '..'), includeUnmirror: false });
  for (const arm of [results.concurrent.normalized, results.concurrent.graphAssisted]) {
    assert.strictEqual(arm.workstreamsStarted, 6);
    assert.strictEqual(arm.maxConcurrent, 6);
    assert.strictEqual(arm.correctAnswers, 6);
    assert.strictEqual(arm.incorrectAssumptions, 0);
    assert.strictEqual(arm.missingDependencies, 0);
    assert.ok(arm.responseBytes > 0);
    assert.ok(arm.navigationBytes >= arm.bytesRead);
  }
  assert.ok(results.concurrent.graphAssisted.repeatedFileReads < results.concurrent.normalized.repeatedFileReads);
  assert.ok(results.concurrent.graphAssisted.oneTimeGraphBuildSourceBytes > 0);
  assert.ok(results.concurrent.graphAssisted.graphArtifactBytes > 0);
  assert.strictEqual(
    results.concurrent.graphAssisted.firstRunTotalBytes,
    results.concurrent.graphAssisted.navigationBytes
      + results.concurrent.graphAssisted.oneTimeGraphBuildSourceBytes
      + results.concurrent.graphAssisted.graphArtifactBytes,
  );
});

test('scenario inputs contain all six distinct workstreams and no answer-key field', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-graph-fixture-'));
  const scenario = createScenario(root, 'six-workstream');
  assert.deepStrictEqual(scenario.workstreams.map(item => item.workstream), [
    'Product/User', 'Business', 'Design', 'Tech', 'Discovery', 'Bugs',
  ]);
  assert.strictEqual(new Set(scenario.workstreams.map(item => item.task)).size, 6);
  assert.ok(!JSON.stringify(scenario.inputs).includes('expectedSources'));
});

test('stored pilot results recompute and canonical consumer input hashes remain unchanged', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-graph-recompute-'));
  const results = await runPilot({ root, repositoryRoot: path.resolve(__dirname, '..'), includeUnmirror: false });
  const resultPath = path.join(root, '.fb', 'graph', 'pilot-results.json');
  assert.ok(fs.existsSync(resultPath));
  assert.deepStrictEqual(verifyStoredResults(resultPath), { valid: true, hash: results.resultHash });
});
