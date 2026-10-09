'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { evaluateBfmRecovery } = require('./fb-efficiency.cjs');

const attempt = (number, overrides = {}) => ({
  issueId: 'missing-result', approach: `correction-${number}`,
  evidenceRef: `qa/attempt-${number}`, deltaRef: `candidate-${number}`,
  outcome: 'failed', ...overrides,
});

test('five distinct failed recoveries stop and a sixth is not recorded', () => {
  assert.equal(typeof evaluateBfmRecovery, 'function');
  let state;
  for (let number = 1; number <= 5; number++) {
    const result = evaluateBfmRecovery(state, attempt(number));
    assert.equal(result.action, number < 5 ? 'continue' : 'stop');
    state = JSON.parse(JSON.stringify(result.state));
  }
  const sixth = evaluateBfmRecovery(state, attempt(6));
  assert.equal(sixth.action, 'stop');
  assert.equal(sixth.state.issues['missing-result'].attempts.length, 5);
  assert.match(sixth.note, /5 unsuccessful/);
  assert.match(sixth.note, /qa\/attempt-5/);
});

test('success finishes immediately, even on the fifth attempt', () => {
  assert.equal(typeof evaluateBfmRecovery, 'function');
  let state;
  for (let n = 1; n < 5; n++) state = evaluateBfmRecovery(state, attempt(n)).state;
  const passed = evaluateBfmRecovery(state, attempt(5, { outcome: 'passed' }));
  assert.equal(passed.action, 'complete');
  const again = evaluateBfmRecovery(passed.state, attempt(6));
  assert.equal(again.action, 'complete');
  assert.equal(again.state.issues['missing-result'].attempts.length, 5);
});

test('unchanged retry or missing evidence stops without inventing an attempt', () => {
  assert.equal(typeof evaluateBfmRecovery, 'function');
  const first = evaluateBfmRecovery(undefined, attempt(1));
  for (const change of [{ approach: 'correction-1' }, { deltaRef: 'candidate-1' }, { evidenceRef: '' }]) {
    const result = evaluateBfmRecovery(first.state, attempt(2, change));
    assert.equal(result.action, 'stop');
    assert.equal(result.state.issues['missing-result'].attempts.length, 1);
  }
});

test('an external gate stops immediately despite remaining attempts or full access', () => {
  assert.equal(typeof evaluateBfmRecovery, 'function');
  for (const gate of ['permission denied', 'Push Live absent', 'privacy approval missing', 'spend ceiling reached']) {
    const result = evaluateBfmRecovery(undefined, attempt(1, { blockingGate: gate, fullAccess: true }));
    assert.equal(result.action, 'stop');
    assert.match(result.note, new RegExp(gate));
    assert.deepEqual(result.state.issues, {});
  }
});

test('corrupt ledgers fail closed and separate issues retain independent counts', () => {
  assert.equal(typeof evaluateBfmRecovery, 'function');
  assert.equal(evaluateBfmRecovery({ version: 999, issues: {} }, attempt(1)).action, 'stop');
  const first = evaluateBfmRecovery(undefined, attempt(1));
  const second = evaluateBfmRecovery(first.state, attempt(1, { issueId: 'distinct-defect' }));
  assert.equal(second.state.issues['missing-result'].attempts.length, 1);
  assert.equal(second.state.issues['distinct-defect'].attempts.length, 1);
  assert.equal(first.state.issues['distinct-defect'], undefined);
});

test('fresh and repeated bootstrap delivers autonomy guidance without replacing project work', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-autonomy-'));
  try {
    const cli = path.join(__dirname, 'fb-lane.cjs');
    execFileSync(process.execPath, [cli, 'bootstrap'], { cwd: root, stdio: 'pipe' });
    const rule = fs.readFileSync(path.join(root, 'docs/fb/autonomy.md'), 'utf8');
    assert.match(rule, /five unsuccessful attempts/);
    assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /docs\/fb\/autonomy\.md/);
    fs.writeFileSync(path.join(root, 'project-note.md'), 'Project-owned work stays intact.');
    execFileSync(process.execPath, [cli, 'bootstrap'], { cwd: root, stdio: 'pipe' });
    assert.equal(fs.readFileSync(path.join(root, 'project-note.md'), 'utf8'), 'Project-owned work stays intact.');
    assert.equal(fs.readFileSync(path.join(root, 'docs/fb/autonomy.md'), 'utf8'), rule);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
