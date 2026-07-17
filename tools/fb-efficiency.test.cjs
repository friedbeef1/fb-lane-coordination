#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  classifyExecutionMode,
  renderQuickRecord,
  parseQuickRecord,
  findQuickRecord,
  closeQuickRecord,
  classifyChangedSurface,
  verificationBudget,
  evaluateRunBudget,
  hasMaterialProgress,
  minimalWorkerContext,
  renderEfficiencyReceipt,
  validateQuickRecordForSubmit,
} = require('./fb-efficiency.cjs');

const bounded = {
  id: 'TASK-Q-1001',
  area: 'Quick-Fix',
  owner: 'FB-Tech',
  scope: 'Correct the status copy',
  locks: 'src/status.js',
  successCriteria: 'Focused status contract passes',
  details: { approval: 'approved' },
  approvalReference: 'USER-APPROVAL-001',
};

test('mode router gives safety and ambiguity precedence', () => {
  assert.deepStrictEqual(classifyExecutionMode({ scope: 'Rename a local variable', owner: 'FB-Tech' }), {
    mode: 'Normal Codex', reason: 'clear isolated low-risk work needs no durable FB record',
  });
  assert.strictEqual(classifyExecutionMode(bounded).mode, 'Quick BFM');
  assert.strictEqual(classifyExecutionMode({ ...bounded, scope: '' }).mode, 'Full BFM');
  assert.strictEqual(classifyExecutionMode({ ...bounded, owner: 'FB-Tech + FB-Product' }).mode, 'Full BFM');
  assert.strictEqual(classifyExecutionMode(bounded, { lockConflict: true }).mode, 'Full BFM');
  for (const scope of [
    'change authentication', 'collect private analytics', 'rotate secrets', 'add payments',
    'delete production data', 'change provider state', 'deploy a release', 'publish externally',
    'change core architecture', 'redesign the core product flow',
  ]) assert.strictEqual(classifyExecutionMode({ ...bounded, scope }).mode, 'Full BFM', scope);
});
test('one Quick Record is parseable, findable, and closes in place with one reviewer', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-efficiency-'));
  const markdown = renderQuickRecord({
    ...bounded,
    approvedCorrection: bounded.scope,
    verificationPlan: 'node tools/status.test.cjs',
    branch: 'quick/TASK-Q-1001-status-copy',
    worktree: '/repo/.worktrees/status-copy',
    brief: '.superpowers/sdd/task-1-brief.md',
    candidate: 'abc1234',
    feedback: 'Correct the stale label.',
    requiredEvidence: 'Focused status contract.',
    elapsedLimitMinutes: 30,
  });
  const dir = path.join(root, 'docs', 'handoffs');
  fs.mkdirSync(dir, { recursive: true });
  const recordPath = path.join(dir, 'TASK-Q-1001.md');
  fs.writeFileSync(recordPath, markdown);
  assert.strictEqual(findQuickRecord(root, 'TASK-Q-1001'), recordPath);
  assert.strictEqual(parseQuickRecord(markdown).mode, 'Quick BFM');
  assert.match(markdown, /Current brief: \.superpowers\/sdd\/task-1-brief\.md/);
  assert.doesNotMatch(markdown, /transcript|conversation history/i);

  const closed = closeQuickRecord(markdown, {
    result: 'Status copy corrected.',
    reviewer: 'FB-Product',
    reviewerDecision: 'approved',
    focusedEvidence: 'node tools/status.test.cjs passed',
    metrics: { elapsedUserWait: '4m', toolCalls: 8, focusedChecks: ['status'], broadValidatorRuns: 0, repeatedChecks: 0, repairLoops: 0, reviewers: 1, approximateTokens: 'unavailable', circuitBreakerTriggered: false },
  });
  assert.match(closed, /Status: complete/);
  assert.match(closed, /Reviewer: FB-Product/);
  assert.strictEqual((closed.match(/^## Closeout$/gm) || []).length, 1);
  assert.throws(() => closeQuickRecord(markdown, { reviewer: ['one', 'two'], focusedEvidence: 'pass', metrics: {} }), /one reviewer/i);
});

test('verification class and budget are proportional', () => {
  const fixtures = [
    [['PROJECT_BOARD.md', 'docs/handoffs/TASK-Q-1.md'], 'coordination'],
    [['docs/why-fb.md'], 'documentation'],
    [['tools/fb-lane.test.cjs'], 'test'],
    [['tools/fb-lane.cjs'], 'runtime'],
    [['supabase/migrations/001.sql'], 'sensitive'],
  ];
  for (const [paths, expected] of fixtures) assert.strictEqual(classifyChangedSurface(paths), expected);
  assert.deepStrictEqual(verificationBudget(['docs/why-fb.md'], {}), {
    level: 'focused check',
    focused: ['documentation-contract'], runFullValidator: false, reuseCheckpoint: false, blockedReason: null,
  });
  assert.strictEqual(verificationBudget(['PROJECT_BOARD.md'], { broadValidatorPassed: true }).reuseCheckpoint, true);
  assert.strictEqual(verificationBudget(['tools/fb-lane.cjs'], { broadValidatorRuns: 0, finalRuntimeCheckpoint: true }).runFullValidator, false);
  assert.strictEqual(verificationBudget(['tools/fb-lane.cjs'], { broadValidatorRuns: 1 }).runFullValidator, false);
});

test('runtime candidates use focused and immediate-safety gates unless Product requests a release checkpoint', () => {
  const runtime = ['tools/fb-lane.cjs'];
  assert.deepStrictEqual(verificationBudget(runtime, { finalRuntimeCheckpoint: true }), {
    level: 'focused check',
    focused: ['runtime-focused'],
    runFullValidator: false,
    reuseCheckpoint: false,
    blockedReason: null,
  });
  assert.deepStrictEqual(verificationBudget(runtime, {
    finalRuntimeCheckpoint: true,
    releaseCheckpoint: { requestedBy: 'Product', handoffPath: 'docs/handoffs/TASK-100.md', initialPass: 'pending' },
  }), {
    level: 'release checkpoint',
    focused: ['runtime-focused'],
    runFullValidator: true,
    reuseCheckpoint: false,
    blockedReason: null,
  });
  const immediateSafety = verificationBudget(['supabase/migrations/001.sql'], {});
  assert.strictEqual(immediateSafety.level, 'immediate safety gate');
  assert.match(immediateSafety.blockedReason, /safety and approval/i);
});

test('sensitive triggers take precedence even inside coordination handoffs', () => {
  const budget = verificationBudget(['docs/handoffs/TASK-RELEASE-AUTH.md'], {});
  assert.strictEqual(budget.level, 'immediate safety gate');
  assert.match(budget.blockedReason, /safety and approval/i);
});

test('release checkpoint lifecycle requires a Product-owned handoff and permits only initial then proven final passes', () => {
  const runtime = ['tools/fb-lane.cjs'];
  const request = {
    requestedBy: 'Product',
    handoffPath: 'docs/handoffs/TASK-100.md',
    initialPass: 'pending',
  };
  const unproven = verificationBudget(runtime, { finalRuntimeCheckpoint: true, releaseCheckpointRequested: true });
  assert.strictEqual(unproven.runFullValidator, false);
  assert.match(unproven.blockedReason, /Product-owned handoff/i);
  assert.deepStrictEqual(verificationBudget(runtime, { finalRuntimeCheckpoint: true, releaseCheckpoint: request }), {
    level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: true, reuseCheckpoint: false, blockedReason: null,
  });
  assert.match(verificationBudget(runtime, { finalRuntimeCheckpoint: true, releaseCheckpoint: { ...request, initialPass: 'passed' } }).blockedReason, /already passed/i);
  assert.deepStrictEqual(verificationBudget(runtime, {
    finalRuntimeCheckpoint: true,
    releaseCheckpoint: { ...request, initialPass: 'failed', consolidatedMaterialRepairBatch: true, finalPass: 'pending' },
  }), {
    level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: true, reuseCheckpoint: false, blockedReason: null,
  });
  for (const checkpoint of [
    { ...request, initialPass: 'failed' },
    { ...request, initialPass: 'failed', consolidatedMaterialRepairBatch: true, finalPass: 'passed' },
    { ...request, initialPass: 'failed', consolidatedMaterialRepairBatch: true, finalPass: 'failed' },
  ]) assert.match(verificationBudget(runtime, { finalRuntimeCheckpoint: true, releaseCheckpoint: checkpoint }).blockedReason, /repair batch|final pass|Product direction/i);
});

test('run budget blocks repeated or exhausted work and requires material progress', () => {
  const base = { iterations: 0, repairLoops: 0, broadValidatorRuns: 0, startedAt: 0, elapsedLimitMinutes: 30 };
  assert.strictEqual(evaluateRunBudget(base, { type: 'repair', now: 1, materialProgress: true }).blocked, false);
  assert.strictEqual(evaluateRunBudget({ ...base, repairLoops: 1 }, { type: 'repair', now: 1, materialProgress: true }).blocked, false);
  assert.match(evaluateRunBudget({ ...base, repairLoops: 2 }, { type: 'repair', now: 1, materialProgress: true }).reason, /third repair/i);
  assert.strictEqual(evaluateRunBudget(base, { type: 'broad-validator', now: 1, materialProgress: true }).blocked, false);
  assert.match(evaluateRunBudget({ ...base, broadValidatorRuns: 1 }, { type: 'broad-validator', now: 1, materialProgress: true }).reason, /repeated broad/i);
  assert.match(evaluateRunBudget(base, { type: 'worker', now: 1, materialProgress: false }).reason, /no material progress/i);
  assert.match(evaluateRunBudget({ ...base, iterations: 5 }, { type: 'worker', now: 1, materialProgress: true }).reason, /sixth/i);
  assert.match(evaluateRunBudget({ ...base, startedAt: 0 }, { type: 'worker', now: 31 * 60_000, materialProgress: true }).reason, /elapsed/i);
  assert.match(evaluateRunBudget({ ...base, tokenLimit: 100 }, { type: 'worker', now: 1, materialProgress: true, authoritativeTokens: 100 }).reason, /token/i);
  assert.match(evaluateRunBudget({ ...base, costLimit: 2 }, { type: 'worker', now: 1, materialProgress: true, authoritativeCost: 2 }).reason, /cost/i);
  assert.strictEqual(evaluateRunBudget({ ...base, tokenLimit: 100 }, { type: 'worker', now: 1, materialProgress: true }).blocked, false);
  assert.strictEqual(hasMaterialProgress({ source: 'a' }, { source: 'b' }), true);
  assert.strictEqual(hasMaterialProgress({ report: 'a' }, { report: 'b' }), false);
});

test('worker context is minimal and receipts reject private inputs', () => {
  assert.deepStrictEqual(minimalWorkerContext({ brief: 'brief.md', candidate: 'abc', feedback: 'fix', requiredEvidence: 'test', unrelated: 'drop' }), {
    brief: 'brief.md', candidate: 'abc', feedback: 'fix', requiredEvidence: 'test',
  });
  for (const key of ['transcript', 'conversationHistory', 'privateReasoning']) {
    assert.throws(() => minimalWorkerContext({ brief: 'x', [key]: 'secret' }), /history|transcript|private reasoning/i);
  }
  const receipt = renderEfficiencyReceipt({ elapsedUserWait: '5m', toolCalls: 4, focusedChecks: ['sync', 'syntax'], broadValidatorRuns: 0, repeatedChecks: 0, repairLoops: 1, reviewers: 1, approximateTokens: 'unavailable', circuitBreakerTriggered: false });
  for (const label of ['Elapsed user wait', 'Tool calls', 'Focused checks', 'Broad validator runs', 'Repeated checks', 'Repair loops', 'Reviewers', 'Approximate tokens', 'Circuit breaker triggered']) assert.match(receipt, new RegExp(label));
  assert.throws(() => renderEfficiencyReceipt({ transcript: 'secret' }), /private|transcript/i);
});

test('Quick submit lifecycle enforces evidence, progress, and declared run budgets', () => {
  const markdown = renderQuickRecord({
    ...bounded,
    approvedCorrection: bounded.scope,
    verificationPlan: 'node tools/status.test.cjs',
    startedAt: 1_000_000,
    elapsedLimitMinutes: 30,
  })
    .replace('Reviewer: pending', 'Reviewer: FB-Product')
    .replace('Reviewer decision: pending', 'Reviewer decision: approved')
    .replace('Focused evidence: pending', 'Focused evidence: Focused status contract passed')
    .replace('Reviewers: 0', 'Reviewers: 1');

  assert.doesNotThrow(() => validateQuickRecordForSubmit(markdown, { now: 1_001_000 }));
  const invalid = [
    [markdown.replace('Agent iterations: 1', 'Agent iterations: 6'), /sixth|iteration/i],
    [markdown.replace('Repair loops: 0', 'Repair loops: 3'), /third repair/i],
    [markdown.replace('Broad validator runs: 0', 'Broad validator runs: 2'), /repeated broad/i],
    [markdown.replace('No-progress cycles: 0', 'No-progress cycles: 1'), /no material progress|no-progress/i],
    [markdown.replace('Started at epoch ms: 1000000', 'Started at epoch ms: 0'), /elapsed/i],
    [markdown.replace('Token limit: unavailable', 'Token limit: 100').replace('Authoritative tokens: unavailable', 'Authoritative tokens: 100'), /token/i],
    [markdown.replace('Cost limit: unavailable', 'Cost limit: 2').replace('Authoritative cost: unavailable', 'Authoritative cost: 2'), /cost/i],
    [markdown.replace('Agent iterations: 1', 'Agent iterations: 2').replace('Material progress: initial execution', 'Material progress: none'), /material progress/i],
    [markdown.replace('Reviewers: 1', 'Reviewers: 2'), /one reviewer/i],
    [markdown.replace('Approval reference: USER-APPROVAL-001', 'Approval reference: pending'), /approval reference/i],
    [markdown.replace('Reviewer decision: approved', 'Reviewer decision: pending'), /reviewer decision|approved/i],
    [markdown.replace('Reviewer decision: approved', 'Reviewer decision: rejected'), /reviewer decision|approved/i],
    [markdown.replace(/^Reviewer decision: approved\n/m, ''), /reviewer decision|approved/i],
    [markdown.replace('Focused evidence: Focused status contract passed', 'Focused evidence: pending'), /focused evidence/i],
  ];
  for (const [candidate, pattern] of invalid) {
    assert.throws(() => validateQuickRecordForSubmit(candidate, { now: 2_000_000 }), pattern);
  }
});
