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
const cliPath = path.join(__dirname, 'fb-lane.cjs');
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

console.log('handoff index');
function writeDoctorFixture(root, handoffCount = 4) {
  fs.mkdirSync(path.join(root, 'docs', 'handoffs'), { recursive: true });
  fs.mkdirSync(path.join(root, '.codex'), { recursive: true });
  fs.mkdirSync(path.join(root, 'tools'), { recursive: true });
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Agents\n');
  fs.writeFileSync(path.join(root, '.codex', 'rules.md'), '# Rules\n');
  fs.writeFileSync(path.join(root, '.mcp.json'), JSON.stringify({ mcpServers: { 'fb-lane': {} } }, null, 2));
  fs.writeFileSync(path.join(root, 'tools', 'fb-lane.cjs'), '// fixture\n');
  fs.writeFileSync(path.join(root, 'PROJECT_BOARD.md'), `# Project Board

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-001 | Ready | FB-Tech | Test | Test task | (None) | [Handoff](docs/handoffs/TASK-001.md) |

### TASK-001 - Test task
* **Status**: Ready
* **Goal Alignment Session**:
  * **Objective**: Keep handoff lookup cheap.
  * **Key Results**:
    * Agents can find the active handoff from an index.
  * **Definition of Done**: Doctor reports the index state.
  * **Gate / Review Point**: Product review.
  * **Approval**: approved
  * **Justification**: The task has multiple handoffs.
`);
  for (let i = 1; i <= handoffCount; i += 1) {
    const name = i === 1 ? 'TASK-001.md' : `TASK-${String(i).padStart(3, '0')}.md`;
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', name), `# ${name}

## Goal Alignment Session

Lane OKR Fit: aligned
Mini-loop Evidence: fixture evidence
Evidence Against Product OKR: None identified
`);
  }
}

test('bootstrap creates docs/handoffs/index.md', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-bootstrap-'));
  try {
    execFileSync('node', [cliPath, 'bootstrap', '--platform', 'codex'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const indexPath = path.join(root, 'docs', 'handoffs', 'index.md');
    assert.ok(fs.existsSync(indexPath), 'expected bootstrap to create docs/handoffs/index.md');
    assert.match(fs.readFileSync(indexPath, 'utf8'), /type: fb-lane-handoff-index/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor warns when many handoffs have no index', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 1);
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.match(output, /Handoff index/);
    assert.match(output, /docs\/handoffs\/index\.md/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor warns when index lacks dependency gate columns', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'index.md'), `---
type: fb-lane-handoff-index
status: active
---

# Handoff Index

| Task / Topic | Lane | Status | Fit | Detail |
|---|---|---|---|---|
| TASK-001 | FB-Tech | Ready | aligned | [TASK-001.md](TASK-001.md) |
`);
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.match(output, /old-style/);
    assert.match(output, /Depends \/ Blocks \/ Gate/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor accepts non-quick handoffs with compact index columns', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 4);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'index.md'), `---
type: fb-lane-handoff-index
status: active
---

# Handoff Index

| Task / Topic | Lane | Status | Depends / Blocks / Gate | Checks / Evidence | Detail |
|---|---|---|---|---|---|
| TASK-001 | FB-Tech | Ready | Product gate | Doctor fixture | [TASK-001.md](TASK-001.md) |
`);
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.match(output, /Handoff index/);
    assert.doesNotMatch(output, /Missing docs\/handoffs\/index\.md/);
    assert.doesNotMatch(output, /old-style/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor does not require an index for quick-only handoffs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 0);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-Q-1234.md'), '# quick\n');
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.match(output, /Handoff lookup is present or not needed yet/);
    assert.doesNotMatch(output, /Missing docs\/handoffs\/index\.md/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

console.log(`\n✅ ${passed} checks passed.`);
