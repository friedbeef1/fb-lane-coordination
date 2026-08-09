#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const modulePath = path.join(__dirname, 'fb-records.cjs');
assert.ok(fs.existsSync(modulePath), 'fb-records.cjs must implement the normalized-record contract');

const {
  validateNormalizedRepository,
  decideLaneReview,
  createVerificationFingerprint,
  compareVerificationFingerprint,
  shouldRunHealthCheck,
  validateCloseout,
  validateEfficiencyMetrics,
  redactAndBoundLog,
} = require(modulePath);

function write(root, relative, contents) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function fixture(taskId = 'TASK-100', options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-records-'));
  write(root, 'PROJECT_BOARD.md', `# Board

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
| ${taskId} | Done | Product / BFM | Harness | Compact scope | tools/fb-records.cjs | [Handoff](docs/handoffs/${taskId}.md); [Evidence](docs/qa/${taskId}.md) |
${options.omitGoalAlignment ? '' : `
### ${taskId} - Normalized record

* **Goal Alignment Session**:
  * **Objective**: Preserve one durable source for every important fact.
  * **Key Results**: Normalized records remain complete and linked.
  * **Definition of Done**: The focused record contract passes.
  * **Gate / Review Point**: Product review before closeout.
  * **Approval**: approved
  * **Justification**: The user approved this bounded normalized-record task.
`}
`);
  write(root, `docs/handoffs/${taskId}.md`, `---
type: fb-lane-handoff
task: ${taskId}
status: done
approval: approved
record_model: normalized-v1
---

# ${taskId}

${options.omitGoalAlignment ? '' : `## Goal Alignment Session

Product OKR: Preserve one durable source for every important fact.
Lane OKR Fit: aligned
Mini-loop Evidence: The focused normalized-record contract passes.
Evidence Against Product OKR: None identified.

`}
## Approved Decision

Use normalized evidence.

## Verification

[QA evidence](../qa/${taskId}.md)
`);
  write(root, `docs/qa/${taskId}.md`, '# QA\n\nCommand: `node --test`\n');
  write(root, 'docs/workstreams/fb-product.md', `---
record_model: normalized-v1
---

# Product card

## ${taskId}

- Status: Done
- Blockers: None
- Next action: None
- Links: [Handoff](../handoffs/${taskId}.md)
`);
  return root;
}

test('prospective normalized records pass with one linked authoritative home', () => {
  assert.deepStrictEqual(validateNormalizedRepository(fixture()), []);
});

test('normalized records accept approved goal alignment preserved in a board archive', () => {
  const root = fixture();
  const boardPath = path.join(root, 'PROJECT_BOARD.md');
  const board = fs.readFileSync(boardPath, 'utf8');
  const taskRow = board.match(/^\| TASK-100 \|.*$/m)[0];
  const taskSection = board.slice(board.indexOf('### TASK-100'));
  write(root, 'PROJECT_BOARD.md', `# Board

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
`);
  write(root, 'docs/board/archive/2026-08.md', `# Board archive

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
${taskRow}

${taskSection}`);

  assert.deepStrictEqual(validateNormalizedRepository(root), []);
});

test('prospective normalized records reject missing handoff and approved board goal alignment early', () => {
  const findings = validateNormalizedRepository(fixture('TASK-100', { omitGoalAlignment: true }));
  const codes = findings.map(finding => finding.code);
  assert.ok(codes.includes('handoff-goal-alignment'), `missing handoff goal finding: ${codes.join(', ')}`);
  assert.ok(codes.includes('board-goal-alignment'), `missing board goal finding: ${codes.join(', ')}`);
});

test('canonical normalized handoff template contains the complete early goal-alignment contract', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'templates', 'docs', 'handoffs', 'normalized-handoff-template.md'), 'utf8');
  for (const field of ['## Goal Alignment Session', 'Product OKR:', 'Lane OKR Fit:', 'Mini-loop Evidence:', 'Evidence Against Product OKR:']) {
    assert.match(template, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `template missing ${field}`);
  }
});

test('focused goal validation preserves established Product Goal vocabulary', () => {
  const root = fixture();
  const handoffPath = path.join(root, 'docs', 'handoffs', 'TASK-100.md');
  const handoff = fs.readFileSync(handoffPath, 'utf8').replace('Product OKR:', 'Product Goal:');
  fs.writeFileSync(handoffPath, handoff);
  assert.deepStrictEqual(validateNormalizedRepository(root), []);
});

test('prospective normalized records accept safe repository-specific task prefixes', () => {
  assert.deepStrictEqual(validateNormalizedRepository(fixture('MEJA-111')), []);
});

test('repository contract flags missing evidence, status conflict, copied card detail, and unlinked supersession', () => {
  const root = fixture();
  write(root, 'PROJECT_BOARD.md', `# Board

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
| TASK-100 | Done | Product / BFM | Harness | Compact scope | tools/fb-records.cjs | [Handoff](docs/handoffs/TASK-100.md) |
`);
  write(root, 'docs/handoffs/TASK-100.md', `---
type: fb-lane-handoff
task: TASK-100
status: ready
record_model: normalized-v1
---

# TASK-100

## Approved Decision

Use normalized evidence.

Supersedes: TASK-099
`);
  write(root, 'docs/workstreams/fb-product.md', `---
record_model: normalized-v1
---

# Product card

## Scope

Copied implementation scope.

## Checks

Copied test results.
`);
  const codes = validateNormalizedRepository(root).map(finding => finding.code);
  for (const code of ['board-evidence-link', 'handoff-approval', 'status-conflict', 'card-copied-detail', 'supersedes-link']) {
    assert.ok(codes.includes(code), `missing ${code}: ${codes.join(', ')}`);
  }
});

test('historical records without normalized opt-in are not retrofitted', () => {
  const root = fixture();
  write(root, 'docs/handoffs/TASK-100.md', '# Historical task\n\n## Decision\n\nLegacy prose.\n');
  assert.deepStrictEqual(validateNormalizedRepository(root), []);
});

test('light review requires a concrete no-impact reason and escalates overlap, cross-lane, and sensitive work', () => {
  assert.strictEqual(decideLaneReview({
    workClass: 'bounded-correction',
    otherLanes: 'no impact detected — only wording in the canonical records guide changes',
  }).level, 'light');
  assert.strictEqual(decideLaneReview({
    workClass: 'bounded-correction',
    otherLanes: 'no impact detected — none',
  }).level, 'product-review');
  assert.strictEqual(decideLaneReview({
    workClass: 'bounded-correction',
    otherLanes: 'no impact detected — isolated parser correction',
    overlappingSurfaces: ['tools/runtime.cjs'],
  }).level, 'product-review');
  assert.strictEqual(decideLaneReview({
    workClass: 'bounded-correction',
    otherLanes: 'no impact detected — local correction',
    risks: ['privacy'],
  }).level, 'full-multi-lane');
  assert.strictEqual(decideLaneReview({ workClass: 'feature' }).level, 'full-multi-lane');
});

test('verification reuse is stable for identical explicit inputs and stale for every relevant mismatch', () => {
  const input = {
    testedCommit: 'abc123',
    sourcePaths: ['src/b.js', 'src/a.js'],
    dependencyLockfiles: { 'package-lock.json': 'lock-sha' },
    buildConfiguration: { mode: 'production' },
    runtimeToolchain: { node: '22.17.0' },
    target: { platform: 'web', device: 'chromium' },
    baseCommit: 'base123',
    command: 'npm test -- focused',
    environment: { CI: '1' },
  };
  const original = createVerificationFingerprint(input);
  const reordered = createVerificationFingerprint({ ...input, sourcePaths: ['src/a.js', 'src/b.js'] });
  assert.deepStrictEqual(compareVerificationFingerprint(original, reordered), { reusable: true, changed: [] });

  for (const [field, value] of [
    ['testedCommit', 'different'],
    ['baseCommit', 'different-base'],
    ['command', 'npm test -- other'],
    ['target', { platform: 'android', device: 'pixel' }],
  ]) {
    const changed = createVerificationFingerprint({ ...input, [field]: value });
    const comparison = compareVerificationFingerprint(original, changed);
    assert.strictEqual(comparison.reusable, false, field);
    assert.ok(comparison.changed.includes(field), `${field}: ${comparison.changed.join(', ')}`);
  }
});

test('health checks are event-driven', () => {
  for (const event of ['session-start', 'worktree-change', 'integration', 'dependency-change', 'recovery', 'staging', 'release', 'closeout', 'workspace-anomaly']) {
    assert.strictEqual(shouldRunHealthCheck(event), true, event);
  }
  assert.strictEqual(shouldRunHealthCheck('unrelated-doc-edit'), false);
  assert.strictEqual(shouldRunHealthCheck('chat-update'), false);
});

test('closeout schemas stay compact and require direct evidence links for full work', () => {
  assert.deepStrictEqual(validateCloseout('bfm', {
    Status: 'Ready to ship',
    Delivered: 'Normalized record enforcement.',
    'Commit/worktree': 'abc123 /tmp/worktree',
    Checks: 'Focused contract passed.',
    Evidence: '[QA](docs/qa/TASK-100.md)',
    'Remaining gates': 'Push Live',
    'Next owner': 'Product',
    'Release boundary': 'No release without Push Live.',
  }), []);
  assert.ok(validateCloseout('bfm', { Status: 'Done' }).length > 0);
  assert.deepStrictEqual(validateCloseout('normal', {
    Outcome: 'Updated copy.',
    Check: 'Markdown link check passed.',
    'Commit/worktree': 'abc123 /tmp/worktree',
    'Next action': 'None.',
  }), []);
});

test('efficiency metrics accept unavailable provider usage and reject invented estimates', () => {
  const record = {
    taskId: 'TASK-100',
    coordinationTokenShare: 'unavailable',
    totalTokens: 'unavailable',
    toolCalls: 8,
    repeatedChecks: 0,
    repairLoops: 1,
    userInterventions: 0,
    staleEvidenceInvalidations: 0,
    consistencyFindings: 0,
    escapedRiskIncidents: 0,
    timeToVerifiedCandidateMinutes: 12,
  };
  assert.deepStrictEqual(validateEfficiencyMetrics(record), []);
  assert.ok(validateEfficiencyMetrics({ ...record, totalTokens: 'about 5000' }).length > 0);
});

test('raw QA logs are redacted and bounded', () => {
  const output = redactAndBoundLog('token=secret-value\nAuthorization: Bearer abc123\n' + 'x'.repeat(200), 96);
  assert.doesNotMatch(output, /secret-value|abc123/);
  assert.ok(Buffer.byteLength(output) <= 96);
  assert.match(output, /REDACTED/);
});

test('the existing doctor consumes normalized repository findings', () => {
  const cli = fs.readFileSync(path.join(__dirname, 'fb-lane.cjs'), 'utf8');
  assert.match(cli, /require\('\.\/fb-records\.cjs'\)/);
  assert.match(cli, /validateNormalizedRepository\(rootDir\)/);
  assert.match(cli, /Normalized records/);
});

test('canonical guidance and every installed operating skill route to the records contract', () => {
  const repo = path.resolve(__dirname, '..');
  const records = fs.readFileSync(path.join(repo, 'docs/fb/records.md'), 'utf8');
  const normalizedRecords = records.replace(/\s+/g, ' ');
  for (const phrase of [
    'each important fact has one authoritative home',
    'record_model: normalized-v1',
    'Historical compatibility',
    'apply prospectively',
    'never invent retrospective',
    'remain searchable on demand',
    'Other lanes: no impact detected',
    'Verification reuse',
    'Event-driven health checks',
    'Full BFM closeout',
    '30–60% lower',
    'targets to test, not claims to publish',
  ]) assert.match(normalizedRecords, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), phrase);

  const packageContext = path.basename(path.dirname(repo)) === 'plugins';
  const packageRecords = packageContext
    ? path.join(repo, 'docs/fb/records.md')
    : path.join(repo, 'plugins/fb-lane-coordination/docs/fb/records.md');
  assert.ok(fs.existsSync(packageRecords), 'package records page must be generated');
  assert.deepStrictEqual(fs.readFileSync(packageRecords), fs.readFileSync(path.join(repo, 'docs/fb/records.md')));

  for (const skill of ['bfm', 'fb-product', 'fb-business', 'fb-design', 'fb-tech', 'fb-discovery', 'fb-bugs', 'fb-lane-coordination', 'project-coordination-setup']) {
    const source = fs.readFileSync(path.join(repo, 'skills', skill, 'SKILL.md'), 'utf8');
    assert.match(source, /docs\/fb\/records\.md/);
  }
  const cli = fs.readFileSync(path.join(repo, 'tools/fb-lane.cjs'), 'utf8');
  assert.match(cli, /FB_HARNESS_PAGES[^\n]*records\.md/);
  if (!packageContext) {
    assert.match(fs.readFileSync(path.join(repo, 'docs/setup.md'), 'utf8'), /eleven-page harness/);
  }
});
