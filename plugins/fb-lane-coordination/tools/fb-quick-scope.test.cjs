#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const { captureQuickCandidateScope, collectQuickCandidateChanges, assertQuickCandidateUnchanged } = require('./fb-lane.cjs');

const record = 'docs/handoffs/TASK-Q-9001.md';
function fixture(t, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-owned-candidate-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const write = (name, value) => { fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); fs.writeFileSync(path.join(root, name), value); };
  git('init', '-b', 'codex/quick-fixture');
  git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  write('src/app.js', 'module.exports = 1;\n'); write('README.md', '# App\n');
  git('add', '.'); git('commit', '-m', 'base');
  if (options.dirt !== false) write('auth/private-draft.md', 'Unrelated existing work\n');
  function create(legacy = false) {
    const snapshot = legacy ? null : captureQuickCandidateScope(root, 'src/app.js', record);
    const markdown = `---\ntype: fb-quick-record\ntask: TASK-Q-9001\n---\nLocked files: src/app.js\n${snapshot ? `Scope baseline: ${JSON.stringify(snapshot)}\n` : ''}`;
    write(record, markdown); git('add', record); git('commit', '-m', 'record');
    return markdown;
  }
  return { root, git, write, create };
}

test('owned candidate excludes unchanged pre-existing unrelated dirt, not its source diff', t => {
  const f = fixture(t); const markdown = f.create();
  f.write('src/app.js', 'module.exports = 2;\n'); f.git('add', 'src/app.js'); f.git('commit', '-m', 'fix');
  const result = collectQuickCandidateChanges(f.root, record, markdown);
  assert.deepEqual(result.changedPaths, [record, 'src/app.js']);
  assert.deepEqual(result.preservedPaths, ['auth/private-draft.md']);
  assert.equal(fs.readFileSync(path.join(f.root, 'auth/private-draft.md'), 'utf8'), 'Unrelated existing work\n');
});

test('new or modified unrelated work stops for reconciliation instead of silently disappearing', t => {
  const f = fixture(t); const markdown = f.create();
  f.write('auth/private-draft.md', 'Changed by another task\n');
  assert.throws(() => collectQuickCandidateChanges(f.root, record, markdown), /outside.*scope|unrelated.*changed/i);
  f.write('auth/private-draft.md', 'Unrelated existing work\n');
  f.write('new.js', 'new work');
  assert.throws(() => collectQuickCandidateChanges(f.root, record, markdown), /outside.*scope|unrelated.*changed/i);
});

test('unrelated committed changes after the baseline require reconciliation', t => {
  const f = fixture(t); const markdown = f.create();
  f.write('README.md', '# Different task\n'); f.git('add', 'README.md'); f.git('commit', '-m', 'unrelated');
  assert.throws(() => collectQuickCandidateChanges(f.root, record, markdown), /outside.*scope|unrelated.*changed/i);
});

test('staged files cannot be accidentally included in Quick closeout', t => {
  const f = fixture(t); const markdown = f.create();
  f.git('add', 'auth/private-draft.md');
  assert.throws(() => collectQuickCandidateChanges(f.root, record, markdown), /staged/i);
});

test('capture rejects dirty owned files and unrelated staged work before writing a record', t => {
  const f = fixture(t);
  f.write('src/app.js', 'uncommitted pre-existing source\n');
  assert.throws(() => captureQuickCandidateScope(f.root, 'src/app.js', record), /pre-existing|already.*dirty/i);
  f.git('restore', 'src/app.js'); f.git('add', 'auth/private-draft.md');
  assert.throws(() => captureQuickCandidateScope(f.root, 'src/app.js', record), /staged/i);
});

test('baseline and lock edits cannot grant broader scope than the committed original record', t => {
  const f = fixture(t); const markdown = f.create();
  const broadened = markdown.replace('Locked files: src/app.js', 'Locked files: src/app.js, README.md');
  f.write(record, broadened);
  assert.throws(() => collectQuickCandidateChanges(f.root, record, broadened), /scope.*changed|baseline.*changed/i);
});

test('unsafe paths and branch drift fail closed', t => {
  const f = fixture(t);
  assert.throws(() => captureQuickCandidateScope(f.root, '../outside', record), /safe|relative/i);
  const markdown = f.create(); f.git('switch', '-c', 'codex/other');
  assert.throws(() => collectQuickCandidateChanges(f.root, record, markdown), /branch/i);
});

test('owned symlinks cannot be accepted as verified source', t => {
  const f = fixture(t); const markdown = f.create();
  fs.unlinkSync(path.join(f.root, 'src/app.js'));
  fs.symlinkSync('../README.md', path.join(f.root, 'src/app.js'));
  f.git('add', 'src/app.js'); f.git('commit', '-m', 'unexpected symlink');
  assert.throws(() => collectQuickCandidateChanges(f.root, record, markdown), /symlink/i);
});

test('a check or hook changing candidate content invalidates previous proof even with identical paths', t => {
  const f = fixture(t); const markdown = f.create();
  f.write('src/app.js', 'module.exports = 2;\n');
  const before = collectQuickCandidateChanges(f.root, record, markdown);
  assert.doesNotThrow(() => assertQuickCandidateUnchanged(before, collectQuickCandidateChanges(f.root, record, markdown)));
  f.write('src/app.js', 'module.exports = 3;\n');
  assert.throws(() => assertQuickCandidateUnchanged(before, collectQuickCandidateChanges(f.root, record, markdown)), /changed.*verification|verification.*changed/i);
});

test('legacy records retain conservative whole-candidate classification without inventing a baseline', t => {
  const f = fixture(t); const markdown = f.create(true);
  const result = collectQuickCandidateChanges(f.root, record, markdown);
  assert.equal(result.legacy, true);
  assert.ok(result.changedPaths.includes('auth/private-draft.md'));
  assert.deepEqual(result.preservedPaths, []);
});

test('owned deleted paths remain in the candidate proof', t => {
  const f = fixture(t); const markdown = f.create();
  fs.unlinkSync(path.join(f.root, 'src/app.js'));
  assert.ok(collectQuickCandidateChanges(f.root, record, markdown).changedPaths.includes('src/app.js'));
});
