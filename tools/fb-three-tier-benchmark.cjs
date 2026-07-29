'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'fb-three-tier-benchmark', 'tasks.json');
const TASK_056_DECLARATION = path.join(REPO_ROOT, 'docs', 'benchmarks', 'repair-efficiency', 'declaration.json');
const TASK_056_RESULTS = path.join(REPO_ROOT, 'docs', 'benchmarks', 'repair-efficiency', 'results.json');

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function loadTierRegistry() {
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
}

function totalUsage(...passes) {
  const usage = {inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0};
  for (const pass of passes.filter(Boolean)) {
    for (const key of Object.keys(usage)) usage[key] += pass.usage[key];
  }
  usage.authoritative = passes.filter(Boolean).every(pass => pass.usage.authoritative === true);
  return usage;
}

function buildReuseReceipts() {
  const results = JSON.parse(fs.readFileSync(TASK_056_RESULTS, 'utf8'));
  const reusedIds = new Set(loadTierRegistry()
    .filter(task => task.reuse === 'TASK-056')
    .map(task => task.id));
  const originalResultHash = sha256File(TASK_056_RESULTS);
  const declarationHash = sha256File(TASK_056_DECLARATION);
  return results.results
    .filter(result => reusedIds.has(result.taskId))
    .map(result => ({
      originalResultHash,
      declarationHash,
      taskId: result.taskId,
      arm: result.arm,
      providerUsage: totalUsage(result.firstPass, result.repair),
      wallTimeMs: result.firstPass.wallTimeMs + (result.repair?.wallTimeMs || 0),
      acceptance: result.finalPass,
      readiness: result.finalGrade.readiness,
    }));
}

function buildThreeTierSchedule(tasks = loadTierRegistry()) {
  return tasks
    .filter(task => task.reuse !== 'TASK-056')
    .flatMap((task, pairIndex) => {
      const arms = pairIndex % 2 ? ['efficient-graph', 'vanilla'] : ['vanilla', 'efficient-graph'];
      return arms.map((arm, orderWithinPair) => ({
        runId: `${task.id}-${arm}`,
        taskId: task.id,
        tier: task.tier,
        arm,
        pairIndex,
        orderWithinPair,
        counted: true,
      }));
    });
}

module.exports = {loadTierRegistry, buildReuseReceipts, buildThreeTierSchedule};
