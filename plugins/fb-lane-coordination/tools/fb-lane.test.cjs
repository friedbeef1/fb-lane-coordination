#!/usr/bin/env node
'use strict';

// Regression tests for the fb-lane CLI hardening.
//
// These cover the command-injection fix: runGit must never hand
// caller-supplied data to a shell, and task IDs / lane names that flow into
// branch names are validated up front. Run with:  node tools/fb-lane.test.cjs
//
// No external test runner or dependencies — just node's built-in assert.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const {
  runGit,
  assertSafeTaskId,
  assertSafeLane,
  assertSafeBranchName,
} = require('./fb-lane.cjs');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log('assertSafeTaskId');
test('accepts conventional task IDs', () => {
  ['TASK-001', 'TASK-Q-5624', 'task_42', 'A.1'].forEach(id =>
    assert.strictEqual(assertSafeTaskId(id), id)
  );
});
test('rejects shell metacharacters', () => {
  ['TASK; rm -rf ~', 'a$(touch x)', 'a`id`', 'a&&b', 'a|b', 'a b', '', '--upload-pack=x']
    .forEach(id => assert.throws(() => assertSafeTaskId(id), /Invalid task ID/));
});
test('rejects non-strings', () => {
  [undefined, null, 42, {}].forEach(id =>
    assert.throws(() => assertSafeTaskId(id), /Invalid task ID/));
});

console.log('assertSafeLane');
test('accepts the known lanes', () => {
  ['Tech', 'Design', 'Business', 'Product', 'tech'].forEach(l =>
    assert.strictEqual(assertSafeLane(l), l));
});
test('rejects injection payloads', () => {
  ['tech; rm -rf ~ #', 'a/b', 'a b', '1tech', '', '-x']
    .forEach(l => assert.throws(() => assertSafeLane(l), /Invalid lane/));
});

console.log('assertSafeBranchName');
test('rejects empty or option-like names', () => {
  ['', '-d', '--force'].forEach(b =>
    assert.throws(() => assertSafeBranchName(b), /unsafe branch name/));
  assert.strictEqual(assertSafeBranchName('tech/TASK-001-fix'), 'tech/TASK-001-fix');
});

console.log('runGit (no shell)');
// Build a throwaway git repo so runGit has something real to talk to.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-test-'));
const prevCwd = process.cwd();
try {
  process.chdir(tmp);
  execFileSync('git', ['init', '-q'], { stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 't@t'], { stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 't'], { stdio: 'ignore' });
  fs.writeFileSync(path.join(tmp, 'f'), 'x');
  execFileSync('git', ['add', 'f'], { stdio: 'ignore' });
  execFileSync('git', ['commit', '-qm', 'init'], { stdio: 'ignore' });

  test('runs a normal command via an args array', () => {
    assert.strictEqual(runGit(['rev-parse', '--is-inside-work-tree']), 'true');
  });

  test('a string of literal args still works', () => {
    assert.strictEqual(runGit('rev-parse --is-inside-work-tree'), 'true');
  });

  test('shell metacharacters in an argument are NOT executed', () => {
    const sentinel = path.join(tmp, 'PWNED');
    // If a shell were involved, "; touch PWNED" would create the sentinel.
    // With execFileSync the whole string is one git revision argument, so git
    // simply fails to resolve it and the sentinel is never created.
    assert.throws(() => runGit(['rev-parse', '--verify', 'HEAD; touch PWNED']));
    assert.ok(!fs.existsSync(sentinel), 'expected no shell-created sentinel file');
  });

  test('command-substitution payloads are inert', () => {
    const sentinel = path.join(tmp, 'SUBST');
    assert.throws(() => runGit(['rev-parse', '--verify', '$(touch SUBST)']));
    assert.ok(!fs.existsSync(sentinel), 'expected no command-substitution side effect');
  });
} finally {
  process.chdir(prevCwd);
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\n✅ ${passed} checks passed.`);
