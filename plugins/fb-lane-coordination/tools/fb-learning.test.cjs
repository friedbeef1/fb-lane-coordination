#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const {
  validateLearningReceipt,
  recordLearningObservation,
  readLearningObservations,
  readLearningRegistry,
  writeLearningRegistry,
  selectApplicableLessons,
  evaluateLearningTransition,
  validateAutomaticTreatment,
  assertLearningBudget,
  upsertLearningRegistry,
  applyLearningObservation,
  assertLearningCloseoutMarkdown,
  collectLearningDoctorChecks,
} = require('./fb-learning.cjs');

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function createRepo() {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-learning-test-'));
  const repo = path.join(parent, 'repo');
  fs.mkdirSync(repo);
  git(repo, ['init', '-q', '-b', 'main']);
  git(repo, ['config', 'user.email', 'learning@example.test']);
  git(repo, ['config', 'user.name', 'Learning Test']);
  fs.writeFileSync(path.join(repo, 'README.md'), 'fixture\n');
  git(repo, ['add', 'README.md']);
  git(repo, ['commit', '-qm', 'fixture']);
  return { parent, repo, cleanup() { fs.rmSync(parent, { recursive: true, force: true }); } };
}

function receipt(overrides = {}) {
  return {
    lessonId: 'LESSON-TECH-CACHE-001',
    runId: 'run-001',
    taskId: 'TASK-001',
    state: 'provisional',
    signature: { category: 'build', surface: 'cache', criterion: 'invalidation' },
    workTypes: ['tech:cache'],
    cause: 'Mutation did not invalidate the derived cache.',
    currentRepair: 'Invalidate the derived cache after the mutation.',
    treatment: { type: 'select_existing_check', value: 'cache-invalidation' },
    evidenceRefs: ['docs/qa/TASK-001.md#cache-regression'],
    owningRecord: 'docs/handoffs/TASK-001.md#project-learning',
    safetyClass: 'ordinary',
    applications: [],
    revisionCount: 0,
    active: true,
    ...overrides,
  };
}

function observation(result, runId, overrides = {}) {
  return {
    result,
    runId,
    kind: 'quality',
    comparable: true,
    acceptedOutcome: true,
    safetyPassed: true,
    mustPassPassed: true,
    evidenceRefs: [`docs/qa/${runId}.md#learning-result`],
    ...overrides,
  };
}

test('records one privacy-safe provisional lesson and selects only matching work', () => {
  const fixture = createRepo();
  try {
    const lesson = validateLearningReceipt(receipt());
    recordLearningObservation(fixture.repo, lesson);
    assert.equal(readLearningObservations(fixture.repo).length, 1);
    writeLearningRegistry(fixture.repo, [lesson]);
    assert.equal(readLearningRegistry(fixture.repo)[0].lessonId, lesson.lessonId);
    assert.deepEqual(selectApplicableLessons([lesson], { workTypes: ['tech:cache'] }).map(item => item.lessonId), [lesson.lessonId]);
    assert.deepEqual(selectApplicableLessons([lesson], { workTypes: ['design:navigation'] }), []);
  } finally {
    fixture.cleanup();
  }
});

test('rejects unsafe fields, secrets, unknown treatments, and duplicate active signatures', () => {
  assert.throws(() => validateLearningReceipt(receipt({ lessonId: '../escape' })), /lesson|safe/i);
  assert.throws(() => validateLearningReceipt(receipt({ cause: 'Use api_key=private-credential-value' })), /secret|credential|private/i);
  assert.throws(() => validateLearningReceipt(receipt({ treatment: { type: 'execute_command', value: 'npm test' } })), /treatment/i);
  const fixture = createRepo();
  try {
    writeLearningRegistry(fixture.repo, [receipt(), receipt({ lessonId: 'LESSON-TECH-CACHE-002' })]);
    assert.fail('duplicate active signatures must fail');
  } catch (error) {
    assert.match(error.message, /duplicate|signature|active/i);
  } finally {
    fixture.cleanup();
  }
});

test('concurrent observation writers leave complete JSONL records', async () => {
  const fixture = createRepo();
  try {
    const modulePath = path.join(__dirname, 'fb-learning.cjs');
    const script = `const m=require(process.argv[1]);m.recordLearningObservation(process.argv[2],JSON.parse(process.argv[3]));`;
    const children = Array.from({ length: 12 }, (_, index) => new Promise((resolve, reject) => {
      const input = receipt({ lessonId: `LESSON-TECH-CACHE-${String(index + 1).padStart(3, '0')}`, runId: `run-${index + 1}` });
      const child = spawn(process.execPath, ['-e', script, modulePath, fixture.repo, JSON.stringify(input)], { stdio: 'ignore' });
      child.on('error', reject);
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(`writer exited ${code}`)));
    }));
    await Promise.all(children);
    const observations = readLearningObservations(fixture.repo);
    assert.equal(observations.length, 12);
    assert.equal(new Set(observations.map(item => item.runId)).size, 12);
  } finally {
    fixture.cleanup();
  }
});

test('confirms after two helpful applications and allows only one revision', () => {
  const provisional = receipt();
  const first = evaluateLearningTransition({ lesson: provisional, observation: observation('helped', 'run-002') });
  assert.equal(first.state, 'provisional');
  assert.deepEqual(first.applications, ['run-002']);
  const second = evaluateLearningTransition({ lesson: first, observation: observation('helped', 'run-003') });
  assert.equal(second.state, 'confirmed');
  const revised = evaluateLearningTransition({ lesson: provisional, observation: observation('incomplete', 'run-002') });
  assert.equal(revised.state, 'revised');
  assert.equal(revised.revisionCount, 1);
  const rejected = evaluateLearningTransition({ lesson: revised, observation: observation('incomplete', 'run-003') });
  assert.equal(rejected.state, 'rejected');
  assert.equal(rejected.active, false);
});

test('rejects safety regressions, failed proofs, duplicate runs, and weak efficiency gains', () => {
  const provisional = receipt();
  assert.equal(evaluateLearningTransition({ lesson: provisional, observation: observation('safety_regression', 'run-002', { safetyPassed: false }) }).state, 'rejected');
  assert.equal(evaluateLearningTransition({ lesson: provisional, observation: observation('failed', 'run-002', { mustPassPassed: false }) }).state, 'rejected');
  const once = evaluateLearningTransition({ lesson: provisional, observation: observation('helped', 'run-002') });
  assert.throws(() => evaluateLearningTransition({ lesson: once, observation: observation('helped', 'run-002') }), /distinct|already|run/i);
  const weak = observation('helped', 'run-002', {
    kind: 'efficiency',
    metrics: { baselineTokens: 1000, candidateTokens: 950, baselineWallMs: 1000, candidateWallMs: 950 },
  });
  assert.equal(evaluateLearningTransition({ lesson: provisional, observation: weak }).state, 'rejected');
  const strong = observation('helped', 'run-002', {
    kind: 'efficiency',
    metrics: { baselineTokens: 1000, candidateTokens: 850, baselineWallMs: 1000, candidateWallMs: 1000 },
  });
  assert.equal(evaluateLearningTransition({ lesson: provisional, observation: strong }).state, 'provisional');
});

test('automatic treatments are allowlisted and learning cannot reset repair budgets', () => {
  assert.deepEqual(validateAutomaticTreatment({ type: 'add_context_ref', value: 'decision-auth' }), { type: 'add_context_ref', value: 'decision-auth' });
  assert.throws(() => validateAutomaticTreatment({ type: 'change_source', value: 'src/auth.js' }), /allow|treatment/i);
  assert.deepEqual(assertLearningBudget({
    runId: 'run-001',
    signature: { category: 'build', surface: 'cache', criterion: 'invalidation' },
    repairBudget: { before: 1, after: 1, limit: 2 },
    activeLessons: [],
  }), { valid: true, remainingRepairs: 1 });
  assert.throws(() => assertLearningBudget({
    runId: 'run-001',
    signature: { category: 'build', surface: 'cache', criterion: 'invalidation' },
    repairBudget: { before: 1, after: 0, limit: 2 },
    activeLessons: [],
  }), /reset|budget/i);
  assert.throws(() => assertLearningBudget({
    runId: 'run-001',
    signature: { category: 'build', surface: 'cache', criterion: 'invalidation' },
    repairBudget: { before: 1, after: 1, limit: 2 },
    activeLessons: [receipt(), receipt({ lessonId: 'LESSON-TECH-CACHE-002' })],
  }), /one active|signature/i);
});

test('upserts and transitions one durable lesson without executing its treatment', () => {
  const fixture = createRepo();
  try {
    const created = upsertLearningRegistry(fixture.repo, receipt());
    assert.equal(created.lessonId, 'LESSON-TECH-CACHE-001');
    const applied = applyLearningObservation(fixture.repo, created.lessonId, observation('helped', 'run-002'));
    assert.equal(applied.state, 'provisional');
    assert.deepEqual(applied.applications, ['run-002']);
    assert.equal(readLearningRegistry(fixture.repo).length, 1);
    assert.equal(readLearningObservations(fixture.repo).length, 1);
    assert.deepEqual(fs.readdirSync(fixture.repo).sort(), ['.git', 'README.md', 'docs']);
  } finally {
    fixture.cleanup();
  }
});

test('prospective closeout requires a concrete none reason or a recorded lesson link', () => {
  const fixture = createRepo();
  try {
    const header = '---\nlearning_contract: v1\n---\n\n# TASK-001\n';
    assert.throws(() => assertLearningCloseoutMarkdown(header, fixture.repo), /Project Learning|Learning decision/i);
    assert.throws(
      () => assertLearningCloseoutMarkdown(`${header}\n## Project Learning\n\nLearning: none — TBD\n`, fixture.repo),
      /concrete|reason/i,
    );
    assert.equal(
      assertLearningCloseoutMarkdown(`${header}\n## Project Learning\n\nLearning: none — No reusable failure pattern emerged from the verified candidate.\n`, fixture.repo).decision,
      'none',
    );

    upsertLearningRegistry(fixture.repo, receipt());
    const recorded = `${header}\n## Project Learning\n\nLearning: recorded — LESSON-TECH-CACHE-001\nRegistry: [LESSON-TECH-CACHE-001](../learning/index.md#lesson-tech-cache-001)\nEvidence: [Cache regression](../qa/TASK-001.md#cache-regression)\nRepair budget: unchanged — learning did not add a repair attempt.\n`;
    assert.equal(assertLearningCloseoutMarkdown(recorded, fixture.repo).lessonId, 'LESSON-TECH-CACHE-001');
    assert.throws(
      () => assertLearningCloseoutMarkdown(recorded.replace('LESSON-TECH-CACHE-001', 'LESSON-MISSING-001'), fixture.repo),
      /recorded|registry|lesson/i,
    );
  } finally {
    fixture.cleanup();
  }
});

test('doctor accepts portable durable lessons and validates clone-local observations when present', () => {
  const fixture = createRepo();
  try {
    fs.mkdirSync(path.join(fixture.repo, 'docs', 'learning'), { recursive: true });
    fs.writeFileSync(path.join(fixture.repo, 'docs', 'learning', 'index.md'), '# FB Project Learning\n\nNo lessons recorded yet.\n');
    let checks = collectLearningDoctorChecks(fixture.repo);
    assert.deepEqual(checks.map(check => check.level), ['ok']);
    assert.doesNotMatch(checks[0].detail, /Mutation did not|Invalidate the derived/);

    upsertLearningRegistry(fixture.repo, receipt());
    checks = collectLearningDoctorChecks(fixture.repo);
    assert.equal(checks[0].level, 'ok');
    assert.match(checks[0].detail, /1 durable lesson\(s\); 0 clone-local observation\(s\)/);
    assert.match(checks[0].detail, /fresh clones remain valid/i);

    recordLearningObservation(fixture.repo, receipt());
    checks = collectLearningDoctorChecks(fixture.repo);
    assert.equal(checks[0].level, 'ok');
    assert.match(checks[0].detail, /1 durable lesson\(s\); 1 clone-local observation\(s\)/);

    const common = git(fixture.repo, ['rev-parse', '--git-common-dir']);
    fs.appendFileSync(path.resolve(fixture.repo, common, 'fb-lane', 'learning', 'observations.jsonl'), '{broken-json}\n');
    checks = collectLearningDoctorChecks(fixture.repo);
    assert.equal(checks[0].level, 'fail');
    assert.match(checks[0].detail, /invalid at line 2/i);
  } finally {
    fixture.cleanup();
  }
});

test('learning CLI records, filters, and applies evidence without granting release authority', () => {
  const fixture = createRepo();
  const cli = path.join(__dirname, 'fb-lane.cjs');
  try {
    const receiptPath = path.join(fixture.parent, 'receipt.json');
    const observationPath = path.join(fixture.parent, 'observation.json');
    fs.writeFileSync(receiptPath, JSON.stringify(receipt()));
    fs.writeFileSync(observationPath, JSON.stringify(observation('helped', 'run-002')));
    const recorded = JSON.parse(execFileSync(process.execPath, [cli, 'learning', 'record', receiptPath], { cwd: fixture.repo, encoding: 'utf8' }));
    assert.deepEqual(recorded, { recorded: 'LESSON-TECH-CACHE-001', state: 'provisional', releaseAuthorized: false });
    const matching = JSON.parse(execFileSync(process.execPath, [cli, 'learning', 'status', 'tech:cache'], { cwd: fixture.repo, encoding: 'utf8' }));
    const unrelated = JSON.parse(execFileSync(process.execPath, [cli, 'learning', 'status', 'design:navigation'], { cwd: fixture.repo, encoding: 'utf8' }));
    assert.equal(matching.count, 1);
    assert.equal(unrelated.count, 0);
    const applied = JSON.parse(execFileSync(process.execPath, [cli, 'learning', 'apply', 'LESSON-TECH-CACHE-001', observationPath], { cwd: fixture.repo, encoding: 'utf8' }));
    assert.equal(applied.state, 'provisional');
    assert.equal(applied.releaseAuthorized, false);
  } finally {
    fixture.cleanup();
  }
});

(async () => {
  let passed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      passed += 1;
      console.log(`ok ${passed} - ${name}`);
    } catch (error) {
      console.error(`not ok - ${name}`);
      console.error(error.stack || error.message);
      process.exitCode = 1;
      return;
    }
  }
  console.log(`FB project learning tests passed (${passed}/${tests.length}).`);
})();
