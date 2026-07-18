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

const passedAutomatedEvidence = {
  status: 'passed',
  baseCommit: '0123456789abcdef0123456789abcdef01234567',
  candidateCommit: 'fedcba9876543210fedcba9876543210fedcba98',
  checkedAt: '2026-07-17T00:00:00.000Z',
  checks: [{ id: 'structure-and-links', result: 'passed' }],
  changedPaths: ['docs/fb/workflow.md'],
  checkManifest: [{ id: 'structure-and-links', command: process.execPath, args: ['tools/fb-lane.cjs', 'doctor'] }],
  safetyGate: { result: 'not-applicable', approvalRef: '' },
  optionalLinks: [],
};
assert.deepStrictEqual(
  verificationReuseDecision(['docs/handoffs/TASK-100.md', 'PROJECT_BOARD.md'], passedAutomatedEvidence),
  { reuse: true, reason: 'coordination-only changes after passed automated verification' }
);
assert.strictEqual(verificationReuseDecision(['src/app.js'], passedAutomatedEvidence).reuse, false);
assert.strictEqual(verificationReuseDecision(['docs/README.md'], false).reuse, false);

const readHarness = page => fs.readFileSync(path.join(surfaceRoot, 'docs', 'fb', page), 'utf8');
const overview = readHarness('README.md');
assert.match(overview, /Start with the matching workstream/);
assert.match(overview, /risk and execution classification internal/);
assert.match(overview, /user never chooses a mode/);
assert.doesNotMatch(overview, /Normal Codex|Quick BFM|Full BFM|TASK-Q-/);

const workflow = readHarness('workflow.md');
for (const mode of ['Quick BFM', 'Full BFM']) assert.match(workflow, new RegExp(mode));
assert.match(workflow, /Agents classify clear isolated low-risk work/);
assert.match(workflow, /exactly one committed[\s\S]*`docs\/handoffs\/TASK-Q-\*\.md` Quick Record/);
assert.match(workflow, /ambiguous or material-risk work internally/);
assert.match(workflow, /Sensitive[\s\S]*Full-BFM safety\/release gates/);
assert.match(workflow, /Quick BFM/);
assert.match(workflow, /ambiguity/i);
assert.match(workflow, /<primary>\/\.worktrees\//);
for (const contract of ['5 minutes', '15 minutes', 'two total agent\\s+iterations', 'three total agent\\s+iterations', 'one consolidated repair', 'zero reviewers', 'exactly one reviewer', 'hooks\\.focusedTest', '10 minutes', 'no implementation subagent', 'current brief', 'candidate\/diff', 'specific feedback', 'required evidence']) assert.match(workflow, new RegExp(contract, 'i'));
for (const contract of ['per execution slice', 'dependency graph', 'independent[\\s\\S]{0,100}slices[\\s\\S]{0,100}parallel', 'dependent[\\s\\S]{0,80}sequential', 'shared-file[\\s\\S]{0,80}sequential', 'res(?:plit|lice)', 'integration or\\s+release checkpoint']) assert.match(workflow, new RegExp(contract, 'i'));
assert.match(workflow, /at most one full validator/);

const sessions = readHarness('sessions.md');
for (const contract of ['Efficiency Receipt', 'without requiring\\s+a board row', 'transcripts', 'unavailable']) assert.match(sessions, new RegExp(contract, 'i'));

const guardrails = readHarness('guardrails.md');
assert.match(guardrails, /hooks\.preflight/);
assert.match(guardrails, /no global Node version/i);
for (const contract of ['one consolidated repair', 'repeated broad', 'fb-package-sync\\.cjs[\\s\\S]{0,30}--check', 'after[\\s\\S]{0,80}review', 'release checkpoint', 'explicitly\\s+requests']) assert.match(guardrails, new RegExp(contract, 'i'));

const cliSource = fs.readFileSync(path.join(surfaceRoot, 'tools', 'fb-lane.cjs'), 'utf8');
assert.match(cliSource, /diff['"],\s*['"]--name-only['"],\s*`\$\{baseCommit\}\.\.HEAD`/);
assert.match(cliSource, /runQuickSubmissionChecks\(markdown,\s*changedPaths,\s*workspaceRoot\)/);
assert.match(cliSource, /runAutomatedCheck\(check,\s*workspaceRoot\)/);

const evidence = readHarness('evidence.md');
for (const contract of ['System verification: passed', 'Your input needed: none', 'smoke/result/evidence', 'Blocked — no review environment yet', 'Product/BFM owns review-access recovery']) assert.match(evidence, new RegExp(contract, 'i'));

console.log('BFM two-speed efficiency contract passed.');
