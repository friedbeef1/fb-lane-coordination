#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { assertFullBfmChangelog } = require('./fb-changelog-closeout.cjs');
const { verificationBudget } = require('./fb-efficiency.cjs');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log(`  ✓ ${name}`); }
function git(cwd, args) { return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim(); }
function fixture({ expectation = 'required', receipt = 'updated — [CHANGELOG.md](../../CHANGELOG.md#fb-031-beta)', fields = true, change = true, entryOverride = '' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-changelog-'));
  git(root, ['init']); git(root, ['config', 'user.email', 'fb@example.com']); git(root, ['config', 'user.name', 'FB Test']);
  fs.mkdirSync(path.join(root, 'docs', 'handoffs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'CHANGELOG.md'), '# Changelog\n');
  fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-031.md'), '# Task\n');
  git(root, ['add', '.']); git(root, ['commit', '-m', 'base']);
  const baseCommit = git(root, ['rev-parse', 'HEAD']);
  const entry = entryOverride || (fields ? '\n## FB 0.3.1-beta\n\n**What changed:** Full BFM now records a changelog decision.\n\n**Why it matters:** Users get a clear release history.\n\n**Compatibility:** Existing Quick and Normal work remain unchanged.\n\n**Installation or upgrade:** Upgrade the fb-lane marketplace plugin after release.\n' : '\n## FB 0.3.1-beta\n\nIncomplete.\n');
  if (change) fs.writeFileSync(path.join(root, 'CHANGELOG.md'), `# Changelog\n${entry}`);
  fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-031.md'), `# Task\n\n## Build Brief\n\nChangelog expectation: ${expectation}\n\n## Task Receipt\n\nChangelog: ${receipt}\n`);
  git(root, ['add', '.']); git(root, ['commit', '-m', 'candidate']);
  return { repoRoot: root, handoffPath: 'docs/handoffs/TASK-031.md', baseCommit, candidateCommit: git(root, ['rev-parse', 'HEAD']) };
}

check('valid required decision resolves candidate-matched entry with four user fields', () => {
  const fx = fixture();
  assert.strictEqual(assertFullBfmChangelog(fx).decision, 'updated');
});

check('internal-only decision requires matching concrete reasons', () => {
  const fx = fixture({ expectation: 'not expected — internal refactor only; no user-visible behavior changed', receipt: 'not required — internal refactor only; no user-visible behavior changed', change: false });
  assert.strictEqual(assertFullBfmChangelog(fx).decision, 'not required');
  const placeholder = fixture({ expectation: 'not expected — TBD', receipt: 'not required — TBD', change: false });
  assert.throws(() => assertFullBfmChangelog(placeholder), /concrete|placeholder/i);
  const mismatch = fixture({ expectation: 'not expected — internal refactor only; no user-visible behavior changed', receipt: 'not required — test fixture cleanup only; no shipped behavior changed', change: false });
  assert.throws(() => assertFullBfmChangelog(mismatch), /reasons must agree/i);
});

check('concrete reasons and changelog fields require Unicode content', () => {
  const punctuation = fixture({ expectation: `not expected — ${'-'.repeat(24)}`, receipt: `not required — ${'-'.repeat(24)}`, change: false });
  assert.throws(() => assertFullBfmChangelog(punctuation), /concrete/i);
  const punctuationFields = fixture({ entryOverride: `\n## FB 0.3.1-beta\n\n**What changed:** ${'-'.repeat(24)}\n\n**Why it matters:** ${'!'.repeat(24)}\n\n**Compatibility:** ${'.'.repeat(24)}\n\n**Installation or upgrade:** ${'_'.repeat(24)}\n` });
  assert.throws(() => assertFullBfmChangelog(punctuationFields), /user-facing fields/i);
});

check('reason agreement is Unicode-aware and punctuation/case tolerant', () => {
  const chinese = '仅内部重构不会改变任何用户可见行为并且不影响安装升级';
  assert.strictEqual(assertFullBfmChangelog(fixture({ expectation: `not expected — ${chinese}。`, receipt: `not required — ${chinese}`, change: false })).decision, 'not required');
  assert.strictEqual(assertFullBfmChangelog(fixture({ expectation: 'not expected — INTERNAL refactor; no user-visible behavior changed!', receipt: 'not required — internal refactor no user visible behavior changed', change: false })).decision, 'not required');
  assert.throws(() => assertFullBfmChangelog(fixture({ expectation: `not expected — ${chinese}`, receipt: 'not required — 仅测试清理不会改变任何已发布行为并且不会影响现有用户', change: false })), /reasons must agree/i);
});

for (const [name, options, pattern] of [
  ['mismatched expectations block', { expectation: 'required', receipt: 'not required — internal refactor only; no user-visible behavior changed' }, /agree|mismatch/i],
  ['unresolved changelog links block', { receipt: 'updated — [CHANGELOG.md](../../CHANGELOG.md#missing-entry)' }, /anchor|resolve/i],
  ['missing user-facing fields block', { fields: false }, /What changed|fields/i],
  ['unchanged changelog blocks required decisions', { change: false }, /candidate range|changed/i],
]) check(name, () => { const fx = fixture(options); assert.throws(() => assertFullBfmChangelog(fx), pattern); });

check('Quick and Normal execution are explicitly exempt', () => {
  assert.deepStrictEqual(assertFullBfmChangelog({ executionMode: 'quick' }), { decision: 'exempt', mode: 'quick' });
  assert.deepStrictEqual(assertFullBfmChangelog({ executionMode: 'normal' }), { decision: 'exempt', mode: 'normal' });
});

check('release checkpoint requires passing candidate-matched changelog evidence', () => {
  assert.throws(() => assertFullBfmChangelog({ releaseCheckpoint: true, changelogEvidence: null }), /release checkpoint.*changelog/i);
  assert.strictEqual(assertFullBfmChangelog({ releaseCheckpoint: true, changelogEvidence: { result: 'passed', candidateCommit: 'a'.repeat(40) }, candidateCommit: 'a'.repeat(40) }).decision, 'verified');
});

check('v3 release budget and runtime entry points enforce the same changelog gate', () => {
  const candidateCommit = 'a'.repeat(40);
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-release-handoff-'));
  fs.mkdirSync(path.join(repoRoot, 'docs', 'handoffs'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'handoffs', 'TASK-031.md'), '---\nfb_harness: v3\n---\n');
  fs.writeFileSync(path.join(repoRoot, 'docs', 'handoffs', 'TASK-LEGACY.md'), '---\nfb_harness: v2\n---\n');
  const base = { requestedBy: 'Product', handoffPath: 'docs/handoffs/TASK-031.md', candidateCommit, initialPass: 'pending' };
  assert.match(verificationBudget(['tools/fb-lane.cjs'], { repoRoot, finalRuntimeCheckpoint: true, releaseCheckpoint: base }).blockedReason, /changelog/i);
  assert.strictEqual(verificationBudget(['tools/fb-lane.cjs'], { repoRoot, finalRuntimeCheckpoint: true, releaseCheckpoint: { ...base, changelogVerification: { result: 'passed', candidateCommit } } }).runFullValidator, true);
  assert.strictEqual(verificationBudget(['tools/fb-lane.cjs'], { repoRoot, finalRuntimeCheckpoint: true, releaseCheckpoint: { ...base, handoffPath: 'docs/handoffs/TASK-LEGACY.md' } }).runFullValidator, true);
  const sessionSource = fs.readFileSync(path.join(__dirname, 'fb-session.cjs'), 'utf8');
  const laneSource = fs.readFileSync(path.join(__dirname, 'fb-lane.cjs'), 'utf8');
  assert.match(sessionSource, /assertCompletedEvidence[\s\S]*fb_harness:\\s\*v3[\s\S]*assertFullBfmChangelog/);
  assert.match(laneSource, /performAutomatedSubmission[\s\S]*assertFullBfmChangelog[\s\S]*changelogVerification/);
});

check('major-release guidance requires explicit user approval of drafted changelog wording', () => {
  const containingRoot = path.resolve(__dirname, '..');
  const packageContext = path.basename(containingRoot) === 'fb-lane-coordination'
    && path.basename(path.dirname(containingRoot)) === 'plugins';
  const repoRoot = packageContext ? path.resolve(containingRoot, '..', '..') : containingRoot;
  const surfaceRoot = packageContext ? containingRoot : repoRoot;
  for (const relative of [
    'docs/fb/workflow.md',
    'docs/fb/evidence.md',
    'docs/fb/sessions.md',
    'skills/fb-product/SKILL.md',
    'skills/bfm/SKILL.md',
    'skills/fb-lane-coordination/SKILL.md',
  ]) {
    const source = fs.readFileSync(path.join(surfaceRoot, relative), 'utf8');
    assert.match(source, /major\s+user-visible release/i);
    assert.match(source, /changelog\s+approval/i);
    assert.match(source, /before\s+\*\*Ready to ship\*\*|cannot reach \*\*Ready to\s*ship\*\*|Checking — changelog approval needed/i);
  }
  const handoff = fs.readFileSync(path.join(repoRoot, 'docs/handoffs/TASK-049.md'), 'utf8');
  assert.match(handoff, /Changelog approval:\s*approved — James, originating conversation, 2026-07-26/i);
});

check('unanswered changelog approval persists into later documentation reviews', () => {
  const repoRoot = path.resolve(__dirname, '..');
  for (const relative of [
    'docs/fb/workflow.md',
    'docs/fb/evidence.md',
    'docs/fb/sessions.md',
    'skills/fb-product/SKILL.md',
    'skills/bfm/SKILL.md',
    'skills/fb-lane-coordination/SKILL.md',
    'skills/fb-business/SKILL.md',
  ]) {
    const source = fs.readFileSync(path.join(repoRoot, relative), 'utf8');
    assert.match(source, /Changelog approval:\s*pending|changelog approval as pending|pending changelog approval/i);
    assert.match(source, /every later\s+documentation|at every later\s+documentation|later documentation-review/i);
    assert.match(source, /approves?, rejects?, or explicitly\s+defers?/i);
    assert.match(source, /silently\s+(?:dropped|clear)|never\s+silently\s+clear/i);
  }
});

console.log(`\n✅ ${passed} focused changelog-closeout checks passed.`);
