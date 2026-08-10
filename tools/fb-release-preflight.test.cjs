#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const modulePath = path.join(__dirname, 'fb-release-preflight.cjs');
assert.ok(fs.existsSync(modulePath), 'fb-release-preflight.cjs must implement the targeted release contract');
const { validateReleasePreflight, scanRepositoryRecords } = require(modulePath);

function write(root, relative, contents) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function fixture(options = {}) {
  const taskId = options.taskId || 'TASK-900';
  const phase = options.phase || 'candidate';
  const boardStatus = options.boardStatus || (phase === 'live' ? 'Done' : 'Ready');
  const handoffStatus = options.handoffStatus || (phase === 'live' ? 'done' : 'ready');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-release-preflight-'));
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'fixture@example.com']);
  git(root, ['config', 'user.name', 'Fixture']);
  write(root, 'README.md', '# Fixture\n');
  git(root, ['add', 'README.md']);
  git(root, ['commit', '-qm', 'base']);
  const baseCommit = git(root, ['rev-parse', 'HEAD']);

  write(root, 'PROJECT_BOARD.md', `# Board

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
| ${taskId} | ${boardStatus} | Product / BFM | Release | Ship bounded candidate | release records | [Handoff](docs/handoffs/${taskId}.md); [QA](docs/qa/${taskId}.md) |

### ${taskId} - Release candidate

* **Goal Alignment Session**:
  * **Objective**: Make the selected release candidate complete and deterministic.
  * **Key Results**: Every release invariant is checked before broad validation.
  * **Definition of Done**: Focused records, candidate state, QA, and changelog evidence pass.
  * **Gate / Review Point**: Stop at Ready to ship until release authority is explicit.
  * **Approval**: approved — Product approved the bounded release scope.
  * **Justification**: Earlier releases exposed preventable late evidence failures.
`);

  const marker = options.recordModel === false ? '' : 'record_model: normalized-v1\n';
  const qaStatus = options.qaStatus || (phase === 'live' ? 'passed' : 'checking');
  const checkpointEvidence = options.checkpointEvidence || (phase === 'live'
    ? '- Result: passed for the exact committed live candidate.'
    : '- Release checkpoint: requested — not run yet. Plan: run the broad validator after this preflight passes.');
  const liveEvidence = phase === 'live' || options.claimLive ? `
## Live release verification

- Merge: completed at the candidate commit.
- Marketplace publication: completed.
- Installed plugin: verified against the same build.
` : '';
  write(root, `docs/handoffs/${taskId}.md`, `---
type: fb-lane-handoff
task: ${taskId}
status: ${handoffStatus}
approval: approved
${marker}---

# ${taskId}

## Goal Alignment Session

Product Goal: Make releases fail early on incomplete evidence.
Lane OKR Fit: aligned
Mini-loop Evidence: The focused release preflight exercises every invariant.
Evidence Against Product OKR: No contrary evidence was found.

## Approved Decision

Prepare the selected release candidate and preserve the Push Live boundary.

## Build Brief

Approved scope: Add one deterministic targeted preflight.
Changelog expectation: required
Release boundary: Stop at Ready to ship before Push Live.

## Task Receipt

Approved brief and decisions: The bounded release preflight was implemented as approved.
Confirmed assumptions and approved scope changes: No material scope change was needed.
Branch, source commits, and changed surfaces: The fixture candidate contains committed release records.
Checks, failures, recovery, and results: Focused behavioral verification passed after the expected RED.
Review state, direct links, limits, and external gates: [QA evidence](../qa/${taskId}.md) records the bounded result.
Repository state: The worktree is clean and HEAD matches the selected candidate commit.
Remaining owner and action: Product owns the remaining release boundary.
Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#090-beta--2026-08-10).
${liveEvidence}`);

  write(root, `docs/qa/${taskId}.md`, `---
type: fb-verification-handoff
task: ${taskId}
status: ${qaStatus}
---

# ${taskId} QA

## Candidate

- Commit: recorded by the fixture.

## Focused verification

- Targeted release preflight: passed.

## Release checkpoint

${checkpointEvidence}
${liveEvidence}`);

  write(root, 'CHANGELOG.md', `# Changelog

## 0.9.0-beta — 2026-08-10

**What changed:** Releases now validate the selected task before broad gates.

**Why it matters:** Incomplete durable evidence fails early in one focused pass.

**Compatibility:** Historical repository scans retain their prospective marker boundary.

**Installation or upgrade:** Release only after the explicit Push Live boundary.
`);
  git(root, ['add', '.']);
  git(root, ['commit', '-qm', `${phase} release records`]);
  const candidateCommit = git(root, ['rev-parse', 'HEAD']);
  return { root, taskId, phase, baseCommit, candidateCommit };
}

function validate(current, overrides = {}) {
  return validateReleasePreflight({
    repoRoot: current.root,
    taskId: current.taskId,
    phase: current.phase,
    baseCommit: current.baseCommit,
    candidateCommit: current.candidateCommit,
    ...overrides,
  });
}

function codes(result) {
  return result.findings.map(finding => finding.code);
}

function editAndCommit(current, relative, edit) {
  const target = path.join(current.root, relative);
  fs.writeFileSync(target, edit(fs.readFileSync(target, 'utf8')));
  git(current.root, ['add', relative]);
  git(current.root, ['commit', '-qm', `break ${relative}`]);
  current.candidateCommit = git(current.root, ['rev-parse', 'HEAD']);
}

test('reports all missing selected-handoff evidence in one pass', () => {
  const current = fixture();
  editAndCommit(current, `docs/handoffs/${current.taskId}.md`, markdown => markdown
    .replace(/## Build Brief[\s\S]*?(?=\n## Task Receipt)/, '')
    .replace(/## Task Receipt[\s\S]*$/, ''));
  const result = validate(current);
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes('handoff-build-brief'), codes(result).join(', '));
  assert.ok(codes(result).includes('handoff-task-receipt'), codes(result).join(', '));
  assert.ok(codes(result).includes('qa-evidence-link'), codes(result).join(', '));
  assert.ok(codes(result).includes('changelog-evidence-link'), codes(result).join(', '));
});

test('reports missing board Gate / Review Point and Justification independently', () => {
  const current = fixture();
  editAndCommit(current, 'PROJECT_BOARD.md', markdown => markdown
    .replace(/^.*Gate \/ Review Point.*\n/m, '')
    .replace(/^.*Justification.*\n/m, ''));
  const result = validate(current);
  assert.ok(codes(result).includes('board-goal-gate'), codes(result).join(', '));
  assert.ok(codes(result).includes('board-goal-justification'), codes(result).join(', '));
});

test('selected release requires record_model while continuing every other invariant', () => {
  const current = fixture({ recordModel: false });
  assert.deepEqual(validate(current).findings, [{
    code: 'handoff-record-model',
    file: `docs/handoffs/${current.taskId}.md`,
    message: 'Selected release handoff requires record_model: normalized-v1.',
  }]);

  editAndCommit(current, 'PROJECT_BOARD.md', markdown => markdown.replace(/^.*Gate \/ Review Point.*\n/m, ''));
  const accumulated = codes(validate(current));
  assert.ok(accumulated.includes('handoff-record-model'), accumulated.join(', '));
  assert.ok(accumulated.includes('board-goal-gate'), accumulated.join(', '));
});

test('reports dirty and mismatched candidate state together', () => {
  const current = fixture();
  fs.appendFileSync(path.join(current.root, 'README.md'), '\ndirty\n');
  const result = validate(current, { candidateCommit: current.baseCommit });
  assert.ok(codes(result).includes('candidate-dirty'), codes(result).join(', '));
  assert.ok(codes(result).includes('candidate-head-mismatch'), codes(result).join(', '));
});

test('reports unresolved QA and changelog links together', () => {
  const current = fixture();
  editAndCommit(current, `docs/handoffs/${current.taskId}.md`, markdown => markdown
    .replace(`../qa/${current.taskId}.md`, '../qa/missing.md')
    .replace('../../CHANGELOG.md#090-beta--2026-08-10', '../../CHANGELOG.md#missing-release'));
  const result = validate(current);
  assert.ok(codes(result).includes('qa-link-unresolved'), codes(result).join(', '));
  assert.ok(codes(result).includes('changelog-link-unresolved'), codes(result).join(', '));
});

test('rejects candidate records with live lifecycle statuses', () => {
  const current = fixture({ phase: 'candidate', boardStatus: 'Done', handoffStatus: 'done' });
  const result = validate(current);
  assert.ok(codes(result).includes('phase-status-conflict'), codes(result).join(', '));
});

test('rejects candidate QA that claims live release completion', () => {
  const current = fixture({ phase: 'candidate', claimLive: true });
  const result = validate(current);
  assert.ok(codes(result).includes('phase-status-conflict'), codes(result).join(', '));
});

test('legacy repository scanning keeps the normalized-v1 opt-in boundary', () => {
  const current = fixture({ recordModel: false });
  write(current.root, 'docs/handoffs/TASK-LEGACY.md', '# Historical record without normalized metadata.\n');
  assert.deepEqual(scanRepositoryRecords(current.root), []);

  write(current.root, 'docs/handoffs/TASK-NORMALIZED.md', `---
task: TASK-NORMALIZED
status: done
record_model: normalized-v1
---

# Incomplete normalized record
`);
  assert.ok(scanRepositoryRecords(current.root).some(finding => finding.code === 'handoff-goal-alignment'));
});

test('passes a complete committed candidate', () => {
  const current = fixture();
  assert.deepEqual(validate(current), {
    ok: true,
    taskId: current.taskId,
    phase: 'candidate',
    candidateCommit: current.candidateCommit,
    findings: [],
  });
});

test('candidate phase also accepts passed focused QA before the broad checkpoint', () => {
  const current = fixture({ qaStatus: 'passed' });
  assert.deepEqual(validate(current).findings, []);
});

test('supports a complete live release record', () => {
  const current = fixture({ phase: 'live' });
  assert.deepEqual(validate(current).findings, []);
});

test('live phase requires passed QA and a passing release checkpoint', () => {
  const current = fixture({
    phase: 'live',
    qaStatus: 'checking',
    checkpointEvidence: '- Release checkpoint: requested — not run yet.',
  });
  const result = validate(current);
  assert.ok(codes(result).includes('qa-status'), codes(result).join(', '));
  assert.ok(codes(result).includes('release-checkpoint-not-passed'), codes(result).join(', '));
});
