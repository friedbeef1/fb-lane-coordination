#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  classifyBfmClass,
  parseWorktreePorcelain,
  resolveWorktreePlan,
  renderQueueSummary,
} = require('./fb-lane.cjs');
const {
  verificationReuseDecision,
} = require('./fb-session.cjs');
const containingRoot = path.resolve(__dirname, '..');
const isPackagedCopy = path.basename(containingRoot) === 'fb-lane-coordination'
  && path.basename(path.resolve(containingRoot, '..')) === 'plugins';
const repoRoot = isPackagedCopy ? path.resolve(__dirname, '..', '..', '..') : containingRoot;
const surfaceRoot = isPackagedCopy ? containingRoot : repoRoot;

const approvedPatch = {
  id: 'TASK-100',
  status: 'Ready',
  area: 'Quick-Fix',
  owner: 'FB-Tech',
  scope: 'Correct the status label typo',
  locks: 'src/status.js',
  details: { approval: 'approved' },
};

assert.strictEqual(classifyBfmClass(approvedPatch), 'Quick BFM Patch');
for (const scope of [
  'Add a payment provider',
  'Change authentication and privacy',
  'Redesign the core flow',
  'Coordinate Product and Tech lanes',
  'Change the launch OKR',
]) {
  assert.strictEqual(classifyBfmClass({ ...approvedPatch, scope }), 'Full BFM', scope);
}
assert.strictEqual(classifyBfmClass({ ...approvedPatch, details: {} }), 'Full BFM');
assert.strictEqual(classifyBfmClass(approvedPatch, { lockConflict: true }), 'Full BFM');

const primary = path.resolve('/repo');
const linked = path.resolve('/repo/.worktrees/current');
const porcelain = `worktree ${primary}\nHEAD aaaaa\nbranch refs/heads/main\n\nworktree ${linked}\nHEAD bbbbb\nbranch refs/heads/tech/TASK-100-correct-label\n`;
const records = parseWorktreePorcelain(porcelain);
assert.deepStrictEqual(records.map(item => item.path), [primary, linked]);
assert.deepStrictEqual(
  resolveWorktreePlan(records, 'tech/TASK-100-correct-label'),
  { path: linked, reuse: true, primary }
);
const planned = resolveWorktreePlan(records, 'tech/TASK-200-new-fix');
assert.strictEqual(planned.reuse, false);
assert.strictEqual(planned.primary, primary);
assert.strictEqual(planned.path, path.join(primary, '.worktrees', 'tech-TASK-200-new-fix'));
assert.ok(!planned.path.startsWith(`${linked}${path.sep}`), 'new worktree must never nest below the linked worktree');

const queue = renderQueueSummary([
  { id: 'TASK-100', status: 'In Progress', scope: 'Current fix' },
  { id: 'TASK-101', status: 'Ready', scope: 'Next fix' },
  { id: 'TASK-102', status: 'Blocked', scope: 'Provider setup', details: { blockers: 'Waiting for provider access' } },
], 'TASK-100');
assert.match(queue, /^Current: TASK-100 — Current fix$/m);
assert.match(queue, /^Next ready: TASK-101 — Next fix$/m);
assert.match(queue, /^External blocks: TASK-102 — Waiting for provider access$/m);
assert.match(renderQueueSummary([], ''), /^Current: None$/m);
assert.match(renderQueueSummary([], ''), /^Next ready: None$/m);
assert.match(renderQueueSummary([], ''), /^External blocks: None$/m);

assert.deepStrictEqual(
  verificationReuseDecision(['docs/handoffs/TASK-100.md', 'PROJECT_BOARD.md'], true),
  { reuse: true, reason: 'coordination-only changes after a verification checkpoint' }
);
assert.strictEqual(verificationReuseDecision(['src/app.js'], true).reuse, false);
assert.strictEqual(verificationReuseDecision(['docs/README.md'], false).reuse, false);

const readHarness = page => fs.readFileSync(path.join(surfaceRoot, 'docs', 'fb', page), 'utf8');
const overview = readHarness('README.md');
for (const mode of ['Normal Codex', 'Quick BFM', 'Full BFM']) assert.match(overview, new RegExp(mode));
assert.match(overview, /one `TASK-Q-\*` Quick Record/);
assert.match(overview, /Auth,[\s\S]*ambiguity[\s\S]*Full BFM/i);

const workflow = readHarness('workflow.md');
assert.match(workflow, /Quick BFM/);
assert.match(workflow, /ambiguity/i);
assert.match(workflow, /<primary>\/\.worktrees\//);
for (const contract of ['five total agent iterations', 'two repair loops', 'one reviewer', 'no-progress cycle', 'current brief', 'candidate\/diff', 'specific feedback', 'required evidence']) assert.match(workflow, new RegExp(contract, 'i'));
assert.match(workflow, /at most one full validator/);

const sessions = readHarness('sessions.md');
for (const contract of ['Efficiency Receipt', 'without requiring\\s+a board row', 'transcripts', 'unavailable']) assert.match(sessions, new RegExp(contract, 'i'));

const guardrails = readHarness('guardrails.md');
assert.match(guardrails, /hooks\.preflight/);
assert.match(guardrails, /no global Node version/i);
for (const contract of ['third repair', 'repeated broad', 'sixth agent iteration', 'fb-package-sync\\.cjs[\\s\\S]{0,30}--check']) assert.match(guardrails, new RegExp(contract, 'i'));

console.log('BFM two-speed efficiency contract passed.');
