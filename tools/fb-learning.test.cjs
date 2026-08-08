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
