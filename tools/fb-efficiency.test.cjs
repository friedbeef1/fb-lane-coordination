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
  selectAutomatedChecks,
  automatedVerificationDecision,
  quickPolicyForPaths,
  runAutomatedCheck,
  runQuickSubmissionChecks,
  planExecutionSlices,
  createDeltaRepairPacket,
  evaluateRepairOutcome,
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

function releaseHandoffFixture(version = 'v2') {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-release-budget-'));
  fs.mkdirSync(path.join(repoRoot, 'docs', 'handoffs'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'handoffs', 'TASK-100.md'), `---\nfb_harness: ${version}\n---\n`);
  return repoRoot;
}

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
test('mode routing ignores negated risk and lock names but retains affirmative safety evidence', () => {
  for (const scope of [
    'Correct a typo; no deployment',
    'Repair status copy without release',
    'Fix no-deployment wording in docs/auth-guide.md',
    'Fix typo in lane guidance',
    'Correct release notes copy',
  ]) assert.strictEqual(classifyExecutionMode({ ...bounded, scope, locks: 'tools/fb-lane.cjs' }).mode, 'Quick BFM', scope);
  assert.strictEqual(classifyExecutionMode({ ...bounded, scope: 'No deployment, but change authentication' }).mode, 'Full BFM');
  assert.strictEqual(classifyExecutionMode({ ...bounded, scope: 'No release but deploy the candidate' }).mode, 'Full BFM');
  assert.strictEqual(classifyExecutionMode({ ...bounded, scope: 'Fix typo, then deploy release' }).mode, 'Full BFM');
  assert.strictEqual(classifyExecutionMode({ ...bounded, scope: 'Change the multi-lane model' }).mode, 'Full BFM');
  assert.strictEqual(classifyExecutionMode({ ...bounded, scope: 'Correct copy; no deployment', safetySignals: ['authentication'] }).mode, 'Full BFM');
  assert.strictEqual(classifyExecutionMode({ ...bounded, scope: 'Correct copy; no deployment', sensitivity: 'sensitive' }).mode, 'Full BFM');
  assert.strictEqual(classifyExecutionMode({ ...bounded, scope: 'Correct copy; no deployment', safetySignals: ['no release'] }).mode, 'Quick BFM');
  assert.strictEqual(classifyExecutionMode({ ...bounded, scope: 'Correct copy; no deployment', safetySignals: ['no release', 'authentication'] }).mode, 'Full BFM');
});
test('inline code operations and affirmative cross-lane coordination retain Full BFM gates', () => {
  for (const scope of [
    'Fix `authentication` bypass',
    'Correct configuration then `deploy` to production',
    'Coordinate Product and Tech lanes',
    'coordinate lanes',
    'coordinate all workstreams',
  ]) assert.strictEqual(classifyExecutionMode({ ...bounded, scope }).mode, 'Full BFM', scope);
  assert.strictEqual(classifyExecutionMode({ ...bounded, scope: 'Fix wording in `docs/auth-guide.md`; no deployment' }).mode, 'Quick BFM');
});
test('unassessed safety signals are unresolved rather than explicit exclusions', () => {
  for (const safetySignals of ['not assessed', 'no assessment performed', 'authentication not assessed']) {
    assert.strictEqual(classifyExecutionMode({ ...bounded, safetySignals }).mode, 'Full BFM', safetySignals);
  }
  for (const safetySignals of ['no release', 'without deployment', 'none', false]) {
    assert.strictEqual(classifyExecutionMode({ ...bounded, safetySignals }).mode, 'Quick BFM', String(safetySignals));
  }
});
test('runtime Quick Records use focused evidence without a slice reviewer and legacy records keep their reviewer rule', () => {
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
  assert.strictEqual(parseQuickRecord(markdown).reviewRequired, false);
  assert.match(markdown, /Review required: no/);
  assert.match(markdown, /Quick policy version: 3/);
  assert.match(markdown, /Slice elapsed limit minutes: 15/);
  assert.match(markdown, /Current brief: \.superpowers\/sdd\/task-1-brief\.md/);
  assert.doesNotMatch(markdown, /transcript|conversation history/i);

  const closed = closeQuickRecord(markdown, {
    result: 'Status copy corrected.',
    focusedEvidence: 'node tools/status.test.cjs passed',
    metrics: { elapsedUserWait: '4m', toolCalls: 8, focusedChecks: ['status'], broadValidatorRuns: 0, repeatedChecks: 0, repairLoops: 0, reviewers: 0, approximateTokens: 'unavailable', circuitBreakerTriggered: false },
  });
  assert.match(closed, /Status: complete/);
  assert.match(closed, /Reviewer: not required/);
  assert.match(closed, /Reviewers: 0/);
  assert.strictEqual((closed.match(/^## Closeout$/gm) || []).length, 1);
  assert.throws(() => closeQuickRecord(markdown, { reviewer: 'slice-reviewer', focusedEvidence: 'pass', metrics: {} }), /slice|zero reviewers/i);

  const legacy = closed.replace(/^Quick policy version: 3\n/m, '')
    .replace(/^Review required: no\n/m, '')
    .replace('Reviewer: not required', 'Reviewer: FB-Product')
    .replace('Reviewer decision: not required', 'Reviewer decision: approved')
    .replace('Reviewers: 0', 'Reviewers: 1');
  assert.doesNotThrow(() => validateQuickRecordForSubmit(legacy));
  const priorThirtyMinuteRecord = legacy
    .replace(/^Execution slice: 1 of 1\n/m, '')
    .replace('Slice elapsed limit minutes: 15', 'Elapsed limit minutes: 30')
    .replace(/^Slice started at epoch ms: \d+$/m, 'Started at epoch ms: 1000000');
  assert.doesNotThrow(() => validateQuickRecordForSubmit(priorThirtyMinuteRecord, {
    now: 2_000_000,
    changedPaths: ['src/status.js'],
  }));
});

test('documentation and coordination Quick Records close with zero reviewers', () => {
  for (const changedPaths of [['docs/fb/workflow.md'], ['PROJECT_BOARD.md']]) {
    const markdown = renderQuickRecord({
      ...bounded,
      locks: changedPaths.join(', '),
      changedPaths,
      approvedCorrection: bounded.scope,
      verificationPlan: 'focused contract',
    });
    assert.strictEqual(parseQuickRecord(markdown).reviewRequired, false);
    assert.match(markdown, /Review required: no/);
    assert.match(markdown, /Slice elapsed limit minutes: 5/);
    const closed = closeQuickRecord(markdown, {
      result: 'Focused checks passed.',
      focusedEvidence: 'focused contract passed',
      metrics: { reviewers: 1 },
    });
    assert.match(closed, /Reviewer: not required/);
    assert.match(closed, /Reviewer decision: not required/);
    assert.match(closed, /Reviewers: 0/);
    assert.doesNotThrow(() => validateQuickRecordForSubmit(closed, { changedPaths }));
  }
});

test('Quick policy is centralized, bounded by surface, and conservative', () => {
  assert.deepStrictEqual(quickPolicyForPaths(['docs/fb/workflow.md']), {
    surface: 'documentation', mode: 'Quick BFM', elapsedLimitMinutes: 5,
    maxIterations: 2, maxRepairs: 1, reviewers: 0, budgetScope: 'execution-slice',
  });
  for (const changedPaths of [['src/app.js'], ['tools/fb-lane.test.cjs'], ['docs/fb/workflow.md', 'app.js'], ['unknown.bin']]) {
    assert.deepStrictEqual(quickPolicyForPaths(changedPaths), {
      surface: classifyChangedSurface(changedPaths), mode: 'Quick BFM', elapsedLimitMinutes: 15,
      maxIterations: 3, maxRepairs: 1, reviewers: 0, budgetScope: 'execution-slice',
    });
  }
  assert.deepStrictEqual(quickPolicyForPaths(['auth/config.js']), {
    surface: 'sensitive', mode: 'Full BFM', elapsedLimitMinutes: null,
    maxIterations: null, maxRepairs: null, reviewers: null, budgetScope: 'execution-slice',
  });
});

test('BFM plans bounded execution slices up front and parallelizes only independent work', () => {
  const plan = planExecutionSlices([
    { id: 'api', outcome: 'API ready', paths: ['src/api.js'], completionCriteria: 'API contract passes', safetyTriggers: [], focusedCheck: 'node test/api.cjs' },
    { id: 'copy', outcome: 'Copy ready', paths: ['docs/copy.md'], completionCriteria: 'Copy contract passes', safetyTriggers: [], focusedCheck: 'node test/copy.cjs' },
    { id: 'ui', outcome: 'UI ready', paths: ['src/ui.js'], dependsOn: ['api'], completionCriteria: 'UI contract passes', safetyTriggers: [], focusedCheck: 'node test/ui.cjs' },
    { id: 'api-tests', outcome: 'Regression proof ready', paths: ['src/api.js'], completionCriteria: 'API regression passes', safetyTriggers: [], focusedCheck: 'node test/api.cjs' },
  ]);
  assert.deepStrictEqual(plan.waves.map(wave => wave.map(slice => slice.id)), [
    ['api', 'copy'],
    ['ui', 'api-tests'],
  ]);
  assert.strictEqual(plan.slices[0].elapsedLimitMinutes, 15);
  assert.strictEqual(plan.slices[1].elapsedLimitMinutes, 5);
  assert.deepStrictEqual(plan.slices[3].dependsOn, ['api']);
  assert.strictEqual(plan.slices[0].outcome, 'API ready');
  assert.strictEqual(plan.slices[0].completionCriteria, 'API contract passes');
  assert.deepStrictEqual(plan.slices[0].safetyTriggers, []);
  assert.throws(() => planExecutionSlices([
    { id: 'a', outcome: 'A', paths: ['src/a.js'], dependsOn: ['missing'], completionCriteria: 'done', safetyTriggers: [], focusedCheck: 'test' },
  ]), /unknown dependency/i);
  assert.throws(() => planExecutionSlices([
    { id: 'a', outcome: 'A', paths: ['src/a.js'], completionCriteria: 'done', safetyTriggers: [], focusedCheck: 'test' },
    { id: 'a', outcome: 'B', paths: ['src/b.js'], completionCriteria: 'done', safetyTriggers: [], focusedCheck: 'test' },
  ]), /unique/i);
});

test('repair workers receive one fresh criterion-specific delta packet', () => {
  const packet = createDeltaRepairPacket({
    objective: 'Preserve the selected session during laptop continuation.',
    candidateRef: 'candidate-abc1234',
    changedPaths: ['src/pairing.js', 'tests/pairing.test.js'],
    failedCriteria: [{
      id: 'continuation',
      expected: 'Laptop continuation preserves the exact session and mode.',
      observed: 'The focused continuation assertion failed.',
    }],
    relevantDecisions: ['Continue on the same session and selected mode.'],
    proofOutput: 'FAIL continuation: expected room-2, received room-1',
    correction: 'Correct continuation state transfer in src/pairing.js.',
  });

  assert.deepStrictEqual(packet, {
    action: 'repair',
    contextMode: 'fresh-delta',
    objective: 'Preserve the selected session during laptop continuation.',
    candidateRef: 'candidate-abc1234',
    changedPaths: ['src/pairing.js', 'tests/pairing.test.js'],
    failedCriteria: [{
      id: 'continuation',
      expected: 'Laptop continuation preserves the exact session and mode.',
      observed: 'The focused continuation assertion failed.',
    }],
    relevantDecisions: ['Continue on the same session and selected mode.'],
    proofOutput: 'FAIL continuation: expected room-2, received room-1',
    correction: 'Correct continuation state transfer in src/pairing.js.',
    repairLimit: 1,
    rerun: 'failed proof only',
  });
  assert.doesNotMatch(JSON.stringify(packet), /transcript|conversation history|rawRecords|allAcceptanceCriteria/i);
});

test('repair stops before another agent when no concrete correction exists', () => {
  const packet = createDeltaRepairPacket({
    objective: 'Preserve session state.',
    candidateRef: 'candidate-abc1234',
    changedPaths: ['src/pairing.js'],
    failedCriteria: [{ id: 'continuation', expected: 'preserved', observed: 'failed' }],
    relevantDecisions: ['Keep the exact session.'],
    proofOutput: 'FAIL continuation',
    correction: '',
  });
  assert.deepStrictEqual(packet, {
    action: 'stop',
    reason: 'no-concrete-correction',
    failedCriterionIds: ['continuation'],
  });
});

test('repair outcome treats no source or readiness improvement as a harness failure', () => {
  assert.deepStrictEqual(evaluateRepairOutcome({
    beforeCandidateSha: 'same',
    afterCandidateSha: 'same',
    beforeReadiness: 0.5,
    afterReadiness: 0.5,
    passed: false,
  }), {
    status: 'harness-failure',
    reason: 'no-candidate-change',
    continue: false,
  });
  assert.deepStrictEqual(evaluateRepairOutcome({
    beforeCandidateSha: 'before',
    afterCandidateSha: 'after',
    beforeReadiness: 0.5,
    afterReadiness: 0.5,
    passed: false,
  }), {
    status: 'harness-failure',
    reason: 'no-readiness-improvement',
    continue: false,
  });
  assert.deepStrictEqual(evaluateRepairOutcome({
    beforeCandidateSha: 'before',
    afterCandidateSha: 'after',
    beforeReadiness: 0.5,
    afterReadiness: 1,
    passed: true,
  }), {
    status: 'passed',
    reason: 'success-predicates-passed',
    continue: false,
  });
});

test('canonical workflow and BFM skill require delta repair context and no-progress stop', () => {
  const repoRoot = path.resolve(__dirname, '..');
  for (const relative of ['docs/fb/workflow.md', 'docs/fb/guardrails.md', 'skills/bfm/SKILL.md']) {
    const content = fs.readFileSync(path.join(repoRoot, relative), 'utf8');
    assert.match(content, /fresh delta repair packet/i, relative);
    assert.match(content, /failed criterion/i, relative);
    assert.match(content, /changed files/i, relative);
    assert.match(content, /no readiness improvement[\s\S]{0,100}harness failure/i, relative);
  }
});

test('slice planning validates contracts, respects explicit direction, and isolates safety work', () => {
  const complete = { id: 'a', outcome: 'A', paths: ['src/a.js'], completionCriteria: 'done', safetyTriggers: [], focusedCheck: 'test' };
  for (const candidate of [
    { ...complete, paths: [] },
    { ...complete, focusedCheck: '' },
    { ...complete, outcome: '' },
    { ...complete, completionCriteria: '' },
    { ...complete, safetyTriggers: undefined },
  ]) assert.throws(() => planExecutionSlices([candidate]), /paths|focused check|outcome|completion criteria|safety triggers/i);

  const direction = planExecutionSlices([
    { ...complete, id: 'after', outcome: 'After', dependsOn: ['before'], paths: ['src/shared.js'] },
    { ...complete, id: 'before', outcome: 'Before', paths: ['src/shared.js'] },
  ]);
  assert.deepStrictEqual(direction.waves.map(wave => wave.map(slice => slice.id)), [['before'], ['after']]);

  const isolated = planExecutionSlices([
    { ...complete, id: 'safe', outcome: 'Safe', paths: ['src/safe.js'] },
    { ...complete, id: 'auth', outcome: 'Auth', paths: ['auth/config.js'], safetyTriggers: ['authentication'] },
    { ...complete, id: 'docs', outcome: 'Docs', paths: ['docs/readme.md'] },
  ]);
  assert.ok(isolated.waves.some(wave => wave.length === 1 && wave[0].id === 'auth'));
  assert.ok(isolated.waves.every(wave => wave.length === 1 || wave.every(slice => slice.mode !== 'Full BFM')));
  assert.strictEqual(isolated.slices.find(slice => slice.id === 'auth').elapsedLimitMinutes, null);
  assert.throws(() => planExecutionSlices([
    { ...complete, id: 'a', outcome: 'A', dependsOn: ['b'] },
    { ...complete, id: 'b', outcome: 'B', paths: ['src/b.js'], dependsOn: ['a'] },
  ]), /cycle/i);
  assert.throws(() => planExecutionSlices([{ ...complete, dependsOn: ['a'] }]), /itself/i);
});

test('mode routing consumes execution plans and keeps Quick to one slice', () => {
  const slice = { id: 'one', outcome: 'Correct status', paths: ['src/status.js'], completionCriteria: 'Focused proof passes', safetyTriggers: [], focusedCheck: 'node test/status.cjs' };
  const quick = classifyExecutionMode({ ...bounded, executionSlices: [slice] });
  assert.strictEqual(quick.mode, 'Quick BFM');
  assert.strictEqual(quick.executionPlan.slices.length, 1);
  const many = classifyExecutionMode({ ...bounded, slices: [slice, { ...slice, id: 'two', outcome: 'Correct docs', paths: ['docs/status.md'] }] });
  assert.strictEqual(many.mode, 'Full BFM');
  assert.strictEqual(many.executionPlan.slices.length, 2);
  const sensitive = classifyExecutionMode({ ...bounded, executionSlices: [{ ...slice, paths: ['auth/config.js'], safetyTriggers: ['authentication'] }] });
  assert.strictEqual(sensitive.mode, 'Full BFM');
  assert.strictEqual(sensitive.executionPlan.slices[0].mode, 'Full BFM');
});

test('Quick Records budget one slice while Full BFM may coordinate many slices', () => {
  const markdown = renderQuickRecord({
    ...bounded,
    approvedCorrection: bounded.scope,
    verificationPlan: 'focused contract',
    startedAt: 1_000_000,
  });
  assert.match(markdown, /Execution slice: 1 of 1/);
  assert.match(markdown, /Slice started at epoch ms: 1000000/);
  assert.match(markdown, /Slice elapsed limit minutes: 15/);
  assert.doesNotMatch(markdown, /^Elapsed limit minutes:/m);
});

test('Quick submit keeps slice review separate while revalidating sensitive candidate paths', () => {
  const documentation = closeQuickRecord(renderQuickRecord({
    ...bounded,
    locks: 'docs/fb/workflow.md',
    changedPaths: ['docs/fb/workflow.md'],
    approvedCorrection: bounded.scope,
    verificationPlan: 'focused contract',
  }), { focusedEvidence: 'focused contract passed', metrics: {} });

  assert.doesNotThrow(() => validateQuickRecordForSubmit(documentation, { changedPaths: ['docs/fb/workflow.md', 'app.js'] }));
  assert.throws(
    () => validateQuickRecordForSubmit(documentation, { changedPaths: ['docs/fb/workflow.md', 'auth/config.js'] }),
    /sensitive.*Full BFM/i,
  );
  assert.throws(
    () => validateQuickRecordForSubmit(documentation.replace('Review required: no', 'Review required: yes'), { changedPaths: ['docs/fb/workflow.md'] }),
    /one reviewer/i,
  );
});

test('verification class and budget are proportional', () => {
  const fixtures = [
    [['PROJECT_BOARD.md', 'docs/handoffs/TASK-Q-1.md'], 'coordination'],
    [['docs/why-fb.md'], 'documentation'],
    [['tools/fb-lane.test.cjs'], 'test'],
    [['tools/fb-lane.cjs'], 'runtime'],
    [['app.js'], 'runtime'],
    [['main.py'], 'runtime'],
    [['vite.config.js'], 'runtime'],
    [['Dockerfile'], 'runtime'],
    [['public/sw.js'], 'runtime'],
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
  const repoRoot = releaseHandoffFixture('v2');
  assert.deepStrictEqual(verificationBudget(runtime, { finalRuntimeCheckpoint: true }), {
    level: 'focused check',
    focused: ['runtime-focused'],
    runFullValidator: false,
    reuseCheckpoint: false,
    blockedReason: null,
  });
  assert.deepStrictEqual(verificationBudget(runtime, {
    repoRoot,
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
  const budget = verificationBudget(['src/auth/config.js'], {});
  assert.strictEqual(budget.level, 'immediate safety gate');
  assert.match(budget.blockedReason, /safety and approval/i);
});

test('Markdown filenames are documentation, while sensitive implementation paths retain safety gates', () => {
  for (const file of ['docs/auth-guide.md', 'release-notes.md']) {
    assert.strictEqual(classifyChangedSurface([file]), 'documentation', file);
  }
  assert.strictEqual(classifyChangedSurface(['docs/handoffs/TASK-RELEASE-AUTH.md']), 'coordination');
  for (const file of ['src/auth/config.js', 'src/payments/charge.ts', 'supabase/migrations/001.sql', 'config/secrets.json']) {
    assert.strictEqual(classifyChangedSurface([file]), 'sensitive', file);
  }
  assert.strictEqual(classifyChangedSurface(['docs/auth-guide.md', 'src/payments/charge.ts']), 'sensitive');
});

test('release checkpoint lifecycle requires a Product-owned handoff and permits only initial then proven final passes', () => {
  const runtime = ['tools/fb-lane.cjs'];
  const repoRoot = releaseHandoffFixture('v2');
  const request = {
    requestedBy: 'Product',
    handoffPath: 'docs/handoffs/TASK-100.md',
    initialPass: 'pending',
  };
  const unproven = verificationBudget(runtime, { repoRoot, finalRuntimeCheckpoint: true, releaseCheckpointRequested: true });
  assert.strictEqual(unproven.runFullValidator, false);
  assert.match(unproven.blockedReason, /Product-owned handoff/i);
  assert.deepStrictEqual(verificationBudget(runtime, { repoRoot, finalRuntimeCheckpoint: true, releaseCheckpoint: request }), {
    level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: true, reuseCheckpoint: false, blockedReason: null,
  });
  assert.match(verificationBudget(runtime, { repoRoot, finalRuntimeCheckpoint: true, releaseCheckpoint: { ...request, initialPass: 'passed' } }).blockedReason, /already passed/i);
  assert.deepStrictEqual(verificationBudget(runtime, {
    repoRoot,
    finalRuntimeCheckpoint: true,
    releaseCheckpoint: { ...request, initialPass: 'failed', consolidatedMaterialRepairBatch: true, finalPass: 'pending' },
  }), {
    level: 'release checkpoint', focused: ['runtime-focused'], runFullValidator: true, reuseCheckpoint: false, blockedReason: null,
  });
  for (const checkpoint of [
    { ...request, initialPass: 'failed' },
    { ...request, initialPass: 'failed', consolidatedMaterialRepairBatch: true, finalPass: 'passed' },
    { ...request, initialPass: 'failed', consolidatedMaterialRepairBatch: true, finalPass: 'failed' },
  ]) assert.match(verificationBudget(runtime, { repoRoot, finalRuntimeCheckpoint: true, releaseCheckpoint: checkpoint }).blockedReason, /repair batch|final pass|Product direction/i);
});

test('Product direction owns one bounded scope-preserving circuit-breaker recovery', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const detailedSurfaces = [
    'docs/fb/guardrails.md',
    'docs/fb/workflow.md',
    'skills/bfm/SKILL.md',
    'skills/fb-product/SKILL.md',
  ];
  for (const relative of detailedSurfaces) {
    const content = fs.readFileSync(path.join(repoRoot, relative), 'utf8');
    assert.match(content, /Product direction is not (?:automatically )?a user prompt/i, relative);
    assert.match(content, /one\s+(?:bounded\s+)?Product-directed recovery/i, relative);
    assert.match(content, /concrete cause[\s\S]{0,180}approved scope/i, relative);
    assert.match(content, /focused\s+proof[\s\S]{0,180}(?:final|complete)\s+(?:release\s+)?(?:pass|checkpoint)/i, relative);
    assert.match(content, /ask\s+the\s+user\s+only[\s\S]{0,240}(?:product outcome|scope|priority)[\s\S]{0,240}(?:safety|hard gate)/i, relative);
  }
  const coordination = fs.readFileSync(path.join(repoRoot, 'skills/fb-lane-coordination/SKILL.md'), 'utf8');
  assert.match(coordination, /workflow\.md[\s\S]{0,180}(?:budgets|closeout)/i, 'coordination must route recovery detail to workflow');
  assert.match(coordination, /guardrails\.md/i, 'coordination must route safety and recovery boundaries to guardrails');
});

test('automated checks select deterministic coordination and project runtime commands', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-automated-checks-'));
  fs.writeFileSync(path.join(repoRoot, 'package.json'), JSON.stringify({ scripts: { test: 'node test.cjs' } }));
  assert.deepStrictEqual(selectAutomatedChecks(['docs/fb/evidence.md', 'PROJECT_BOARD.md'], repoRoot), [
    { id: 'structure-and-links', command: process.execPath, args: [path.join(__dirname, 'fb-doc-check.cjs'), 'docs/fb/evidence.md', 'PROJECT_BOARD.md'], timeoutMs: 300000 },
    { id: 'whitespace', command: 'git', args: ['diff', '--check', '--', 'docs/fb/evidence.md', 'PROJECT_BOARD.md'], timeoutMs: 300000 },
  ]);
  assert.strictEqual(selectAutomatedChecks(['docs/fb/evidence.md'], repoRoot)
    .filter(check => check.id === 'structure-and-links').length, 1);
  assert.deepStrictEqual(selectAutomatedChecks(['src/app.js'], repoRoot), [
    { id: 'project-test', command: 'npm', args: ['test'], timeoutMs: 300000 },
  ]);
  fs.writeFileSync(path.join(repoRoot, '.fb-lane.json'), JSON.stringify({
    hooks: { focusedTest: 'npm run test:focused' },
    timeouts: { focusedTestMinutes: 8 },
  }));
  assert.deepStrictEqual(selectAutomatedChecks(['src/app.js'], repoRoot), [
    { id: 'project-test', command: 'npm run test:focused', args: [], shell: true, timeoutMs: 480000 },
  ]);
  fs.writeFileSync(path.join(repoRoot, '.fb-lane.json'), JSON.stringify({ timeouts: { focusedTestMinutes: 11 } }));
  assert.throws(() => selectAutomatedChecks(['src/app.js'], repoRoot), /ten|10|timeout/i);
  assert.throws(() => selectAutomatedChecks(['src/app.js'], fs.mkdtempSync(path.join(os.tmpdir(), 'fb-no-tests-'))), /runtime.*test|test.*runtime/i);
});

test('focused document check validates affected links and anchors without scanning unrelated history', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-doc-check-'));
  fs.mkdirSync(path.join(repoRoot, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'guide.md'), '[Read more](target.md#ready)\n');
  fs.writeFileSync(path.join(repoRoot, 'docs', 'target.md'), '# Ready\n');
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '[Old broken reference](missing.md)\n');
  const [focused] = selectAutomatedChecks(['docs/guide.md'], repoRoot);
  assert.doesNotThrow(() => runAutomatedCheck(focused, repoRoot));
  fs.writeFileSync(path.join(repoRoot, 'docs', 'guide.md'), '[Read more](target.md#missing)\n');
  assert.throws(() => runAutomatedCheck(focused, repoRoot), /broken anchor.*target.md#missing/);
  fs.writeFileSync(path.join(repoRoot, 'docs', 'guide.md'), '[Read more](absent.md)\n');
  assert.throws(() => runAutomatedCheck(focused, repoRoot), /broken link.*absent.md/);
  fs.writeFileSync(path.join(repoRoot, 'docs', 'guide.md'), '[Read more](target.md#ready)  \n');
  assert.throws(() => runAutomatedCheck(focused, repoRoot), /structure-and-links failed/);
  fs.writeFileSync(path.join(repoRoot, 'docs', 'target.md'), '# 0.8.2-beta — 2026-08-15\n');
  fs.writeFileSync(path.join(repoRoot, 'docs', 'guide.md'), '[Release history](target.md#082-beta--2026-08-15)\n');
  assert.doesNotThrow(() => runAutomatedCheck(focused, repoRoot));
});

test('selected whitespace checks inspect index and worktree without unrelated dirty files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-whitespace-'));
  const git = (...args) => require('node:child_process').execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  git('init', '-q');
  git('config', 'user.email', 'fixture@example.test');
  git('config', 'user.name', 'Fixture');
  fs.writeFileSync(path.join(root, 'selected.md'), '# Selected\n');
  fs.writeFileSync(path.join(root, 'unrelated.md'), '# Unrelated\n');
  git('add', '.');
  git('commit', '-qm', 'baseline');
  const whitespace = selectAutomatedChecks(['selected.md'], root).find(check => check.id === 'whitespace');
  fs.writeFileSync(path.join(root, 'unrelated.md'), '# Unrelated  \n');
  assert.doesNotThrow(() => runAutomatedCheck(whitespace, root));
  fs.writeFileSync(path.join(root, 'selected.md'), '# Selected  \n');
  assert.throws(() => runAutomatedCheck(whitespace, root), /whitespace failed/);
  git('add', 'selected.md');
  fs.writeFileSync(path.join(root, 'selected.md'), '# Selected\n');
  assert.throws(() => runAutomatedCheck(whitespace, root), /whitespace failed/);
});

test('focused document links and anchors ignore examples but validate live same-file fragments', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-doc-examples-'));
  const { validateDocuments } = require('./fb-doc-check.cjs');
  const doc = path.join(root, 'guide.md');
  fs.writeFileSync(doc, '# Guide\n[Good](#guide)\n`[Example](absent.md)`\n<!-- [Comment](absent.md) -->\n```md\n# Fake Anchor\n[Example](absent.md)\n```\n');
  assert.deepStrictEqual(validateDocuments(root, ['guide.md']), []);
  fs.appendFileSync(doc, '[Bad](#fake-anchor)\n');
  assert.match(validateDocuments(root, ['guide.md']).join('\n'), /broken anchor #fake-anchor/);
  fs.appendFileSync(doc, '[Nearby bad](absent.md)\n');
  assert.match(validateDocuments(root, ['guide.md']).join('\n'), /broken link absent.md/);
});

test('handoff index examples are not task metadata and real index links remain checked', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-index-metadata-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const { validateDocuments } = require('./fb-doc-check.cjs');
  const relative = 'docs/handoffs/index.md';
  fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
  fs.writeFileSync(path.join(root, relative), '---\ntype: fb-lane-handoff-index\nstatus: active\n---\n# Index\n[Here](#index)\n```md\n---\ntype: fb-lane-handoff\ntask: TASK-EXAMPLE\nrecord_model: normalized-v1\n---\n```\n');
  assert.deepStrictEqual(validateDocuments(root, [relative]), []);
  fs.appendFileSync(path.join(root, relative), '[Missing](absent.md)\n');
  assert.match(validateDocuments(root, [relative]).join('\n'), /broken link absent.md/);
});

test('handoff identity uses opening frontmatter, never body examples', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-handoff-metadata-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const { validateDocuments } = require('./fb-doc-check.cjs');
  const relative = 'docs/handoffs/TASK-EXAMPLE.md';
  fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
  const example = '# Legacy handoff\n```md\n---\ntask: TASK-OTHER\nrecord_model: normalized-v1\n---\n```\n';
  fs.writeFileSync(path.join(root, relative), example);
  assert.deepStrictEqual(validateDocuments(root, [relative]), []);
  fs.writeFileSync(path.join(root, relative), `---\ntype: fb-lane-handoff\ntask: TASK-WRONG\n---\n${example}`);
  assert.match(validateDocuments(root, [relative]).join('\n'), /task ID does not match filename/);
  fs.writeFileSync(path.join(root, relative), `---\ntype: fb-lane-handoff\ntask:\nrecord_model: normalized-v1\n---\n${example}`);
  assert.match(validateDocuments(root, [relative]).join('\n'), /normalized handoff requires a task ID/);
});

test('focused document check rejects symlink escapes before reading source or target', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-doc-containment-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-doc-private-'));
  const { validateDocuments } = require('./fb-doc-check.cjs');
  fs.writeFileSync(path.join(outside, 'private.md'), '# Secret Anchor\n');
  fs.symlinkSync(path.join(outside, 'private.md'), path.join(root, 'outside.md'));
  assert.match(validateDocuments(root, ['outside.md']).join('\n'), /outside.md: path leaves repository/);
  fs.writeFileSync(path.join(root, 'guide.md'), '[Private](outside.md#secret-anchor)\n');
  const findings = validateDocuments(root, ['guide.md']).join('\n');
  assert.match(findings, /link leaves repository outside.md#secret-anchor/);
  assert.doesNotMatch(findings, /broken anchor/);
});

test('focused normalized handoff checks selected record identity without inspecting unrelated records', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-record-check-'));
  fs.mkdirSync(path.join(repoRoot, 'docs', 'handoffs'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'handoffs', 'TASK-100.md'), '---\ntask: TASK-999\nrecord_model: normalized-v1\n---\n');
  const valid = '---\ntask: TASK-200\nrecord_model: normalized-v1\nstatus: In Progress\napproval: approved\n---\n\n## Goal Alignment Session\nProduct Goal: Reliable delivery\nLane OKR Fit: aligned\nMini-loop Evidence: Focused proof\nEvidence Against Product OKR: None observed\n';
  fs.writeFileSync(path.join(repoRoot, 'docs', 'handoffs', 'TASK-200.md'), valid);
  fs.writeFileSync(path.join(repoRoot, 'PROJECT_BOARD.md'), '### TASK-200 - Focused proof\n\n**Goal Alignment Session**\nObjective: Reliable delivery\nKey Results: Focused proof\nDefinition of Done: Checks pass\nGate / Review Point: Product review\nApproval: approved\nJustification: Bounded correction\n\n| ID | Status |\n|---|---|\n| TASK-200 | In Progress |\n');
  const [focused] = selectAutomatedChecks(['docs/handoffs/TASK-200.md'], repoRoot);
  assert.doesNotThrow(() => runAutomatedCheck(focused, repoRoot));
  fs.writeFileSync(path.join(repoRoot, 'docs', 'handoffs', 'TASK-200.md'), valid.replace('## Goal Alignment Session', '## Missing Goal'));
  assert.throws(() => runAutomatedCheck(focused, repoRoot), /Goal Alignment Session/);
  fs.writeFileSync(path.join(repoRoot, 'docs', 'handoffs', 'TASK-200.md'), valid.replace('status: In Progress', 'status: Done'));
  assert.throws(() => runAutomatedCheck(focused, repoRoot), /status conflicts/);
  fs.writeFileSync(path.join(repoRoot, 'docs', 'handoffs', 'TASK-200.md'), `${valid}Supersedes: TASK-199\n`);
  assert.throws(() => runAutomatedCheck(focused, repoRoot), /Supersedes must link/);
  const [invalid] = selectAutomatedChecks(['docs/handoffs/TASK-100.md'], repoRoot);
  assert.throws(() => runAutomatedCheck(invalid, repoRoot), /task ID does not match filename/);
  fs.writeFileSync(path.join(repoRoot, 'docs', 'handoffs', 'TASK-200.md'), valid.replace('status: In Progress', 'status: Done'));
  const [boardCheck] = selectAutomatedChecks(['PROJECT_BOARD.md'], repoRoot);
  assert.throws(() => runAutomatedCheck(boardCheck, repoRoot), /status conflicts/);
});

test('focused checks time out into Full BFM instead of waiting indefinitely', () => {
  assert.throws(() => runAutomatedCheck({
    id: 'project-test',
    command: process.execPath,
    args: ['-e', 'setTimeout(() => {}, 500)'],
    timeoutMs: 25,
  }, process.cwd()), /timed out.*Full BFM/i);
});

test('Quick submission executes the configured focused check exactly once', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-quick-check-'));
  const marker = path.join(repoRoot, 'focused-ran');
  const command = `"${process.execPath}" -e "require('node:fs').appendFileSync('focused-ran','x')"`;
  fs.writeFileSync(path.join(repoRoot, '.fb-lane.json'), JSON.stringify({ hooks: { focusedTest: command } }));
  const markdown = closeQuickRecord(renderQuickRecord({
    ...bounded,
    changedPaths: ['src/status.js'],
    approvedCorrection: bounded.scope,
    verificationPlan: 'configured focused check',
  }), {
    focusedEvidence: 'focused contract passed',
    metrics: {},
  });
  const manifest = runQuickSubmissionChecks(markdown, ['src/status.js'], repoRoot);
  assert.strictEqual(fs.readFileSync(marker, 'utf8'), 'x');
  assert.strictEqual(manifest.length, 1);
  assert.strictEqual(manifest[0].command, command);
});

test('automated verification is candidate-bound, safety-first, and requires explicit passed checks', () => {
  const commit = '0123456789abcdef0123456789abcdef01234567';
  const ready = automatedVerificationDecision({
    candidateCommit: commit,
    checkedCommit: commit,
    changedPaths: ['src/app.js'],
    checkResults: [{ id: 'project-test', result: 'passed' }],
    safetyGate: { result: 'not-applicable', approvalRef: '' },
    optionalLinks: [],
  });
  assert.strictEqual(ready.status, 'Ready to ship');
  assert.strictEqual(ready.reusable, true);
  assert.deepStrictEqual(ready.optionalLinks, []);
  assert.strictEqual(ready.prompt, [
    'Automated checks passed. Optional review links are available above.',
    'Say **Push Live** to deploy.',
  ].join('\n'));

  for (const checkResults of [
    [{ id: 'structure-and-links', result: 'passed' }, { id: 'whitespace', result: 'passed' }],
    [{ id: 'structure', result: 'passed' }, { id: 'links', result: 'passed' }, { id: 'whitespace', result: 'passed' }],
  ]) {
    assert.strictEqual(automatedVerificationDecision({
      candidateCommit: commit, checkedCommit: commit, changedPaths: ['docs/handoff.md'],
      checkResults, safetyGate: { result: 'not-applicable', approvalRef: '' }, optionalLinks: [],
    }).status, 'Ready to ship');
  }

  assert.strictEqual(automatedVerificationDecision({
    candidateCommit: commit, checkedCommit: commit, changedPaths: ['src/app.js'],
    checkResults: [{ id: 'project-test', result: 'failed' }],
    safetyGate: { result: 'not-applicable', approvalRef: '' }, optionalLinks: [],
  }).status, 'Checking');
  assert.strictEqual(automatedVerificationDecision({
    candidateCommit: commit, checkedCommit: commit, changedPaths: ['supabase/migrations/001.sql'],
    checkResults: [{ id: 'project-test', result: 'passed' }],
    safetyGate: { result: 'pending', approvalRef: '' }, optionalLinks: [],
  }).status, 'Blocked');
  assert.strictEqual(automatedVerificationDecision({
    candidateCommit: commit, checkedCommit: commit, changedPaths: ['src/app.js'],
    checkResults: [{ id: 'project-test', result: 'passed' }],
    safetyGate: { result: 'not-applicable', approvalRef: '' }, optionalLinks: [], bypassRequested: true,
  }).status, 'Blocked');
  assert.strictEqual(automatedVerificationDecision({
    candidateCommit: commit, checkedCommit: 'fedcba9876543210fedcba9876543210fedcba98', changedPaths: ['docs/handoff.md'],
    checkResults: [{ id: 'structure', result: 'passed' }],
    safetyGate: { result: 'not-applicable', approvalRef: '' }, optionalLinks: [],
  }).reusable, false);
  assert.strictEqual(automatedVerificationDecision({
    candidateCommit: commit, checkedCommit: commit, changedPaths: ['src/app.js'],
    checkResults: [{ id: 'structure', result: 'passed' }],
    safetyGate: { result: 'not-applicable', approvalRef: '' }, optionalLinks: [],
  }).reusable, false);
});

test('run budget blocks repeated or exhausted work and requires material progress', () => {
  const base = { iterations: 0, repairLoops: 0, broadValidatorRuns: 0, startedAt: 0, changedPaths: ['src/app.js'] };
  assert.strictEqual(evaluateRunBudget(base, { type: 'repair', now: 1, materialProgress: true }).blocked, false);
  assert.match(evaluateRunBudget({ ...base, repairLoops: 1 }, { type: 'repair', now: 1, materialProgress: true }).reason, /repair.*Full BFM|Full BFM.*repair/i);
  assert.strictEqual(evaluateRunBudget(base, { type: 'broad-validator', now: 1, materialProgress: true }).blocked, false);
  assert.match(evaluateRunBudget({ ...base, broadValidatorRuns: 1 }, { type: 'broad-validator', now: 1, materialProgress: true }).reason, /repeated broad/i);
  assert.match(evaluateRunBudget(base, { type: 'worker', now: 1, materialProgress: false }).reason, /no material progress/i);
  assert.match(evaluateRunBudget({ ...base, iterations: 3 }, { type: 'worker', now: 1, materialProgress: true }).reason, /iteration.*Full BFM|Full BFM.*iteration/i);
  assert.match(evaluateRunBudget({ ...base, startedAt: 0 }, { type: 'worker', now: 15 * 60_000, materialProgress: true }).reason, /elapsed.*Full BFM|Full BFM.*elapsed/i);
  const docs = { ...base, changedPaths: ['docs/fb/workflow.md'] };
  assert.match(evaluateRunBudget({ ...docs, iterations: 2 }, { type: 'worker', now: 1, materialProgress: true }).reason, /iteration.*Full BFM|Full BFM.*iteration/i);
  assert.match(evaluateRunBudget(docs, { type: 'worker', now: 5 * 60_000, materialProgress: true }).reason, /elapsed.*Full BFM|Full BFM.*elapsed/i);
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
  }).replace('Focused evidence: pending', 'Focused evidence: Focused status contract passed');

  assert.match(markdown, /Slice elapsed limit minutes: 15/);
  assert.doesNotThrow(() => validateQuickRecordForSubmit(markdown, { now: 1_001_000, changedPaths: ['src/status.js'] }));
  const invalid = [
    [markdown.replace('Agent iterations: 1', 'Agent iterations: 4'), /iteration|Full BFM/i],
    [markdown.replace('Repair loops: 0', 'Repair loops: 2'), /repair|Full BFM/i],
    [markdown.replace('Broad validator runs: 0', 'Broad validator runs: 2'), /repeated broad/i],
    [markdown.replace('No-progress cycles: 0', 'No-progress cycles: 1'), /no material progress|no-progress/i],
    [markdown.replace('Slice started at epoch ms: 1000000', 'Slice started at epoch ms: 0'), /elapsed/i],
    [markdown.replace('Token limit: unavailable', 'Token limit: 100').replace('Authoritative tokens: unavailable', 'Authoritative tokens: 100'), /token/i],
    [markdown.replace('Cost limit: unavailable', 'Cost limit: 2').replace('Authoritative cost: unavailable', 'Authoritative cost: 2'), /cost/i],
    [markdown.replace('Agent iterations: 1', 'Agent iterations: 2').replace('Material progress: initial execution', 'Material progress: none'), /material progress/i],
    [markdown.replace('Reviewer: not required', 'Reviewer: slice-reviewer'), /slice|zero reviewers/i],
    [markdown.replace('Approval reference: USER-APPROVAL-001', 'Approval reference: pending'), /approval reference/i],
    [markdown.replace('Focused evidence: Focused status contract passed', 'Focused evidence: pending'), /focused evidence/i],
  ];
  for (const [candidate, pattern] of invalid) {
    assert.throws(() => validateQuickRecordForSubmit(candidate, { now: 1_001_000, changedPaths: ['src/status.js'] }), pattern);
  }
});
