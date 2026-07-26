#!/usr/bin/env node
'use strict';

// TASK-022 focused behavior tests. The complete fixture suite is added before
// the session implementation so the first run records a genuine public-CLI RED.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn, spawnSync } = require('child_process');

const containingRoot = path.resolve(__dirname, '..');
const isPackagedCopy = path.basename(containingRoot) === 'fb-lane-coordination'
  && path.basename(path.resolve(containingRoot, '..')) === 'plugins';
const rootDir = isPackagedCopy ? path.resolve(__dirname, '..', '..', '..') : containingRoot;
const cliPath = path.join(__dirname, 'fb-lane.cjs');
const packageCliPath = path.join(rootDir, 'plugins', 'fb-lane-coordination', 'tools', 'fb-lane.cjs');
const {
  collectSessionDoctorChecks,
  recordAutomatedVerification,
  runSessionCommand,
  submitVerificationReuse,
} = require(path.join(__dirname, 'fb-session.cjs'));
const { selectAutomatedChecks } = require(path.join(__dirname, 'fb-efficiency.cjs'));
const { appendStageEvent, issueFullRepairBudget, readFullRepairBudget, advanceFullRepairBudget } = require(path.join(__dirname, 'fb-control-loop.cjs'));
const cleanEnv = {
  ...process.env,
  CODEX_THREAD_ID: '',
  FB_SESSION_ID: '',
  CODEX_THREAD_TYPE: '',
  FB_SESSION_KIND: '',
};

let passed = 0;
const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

function git(cwd, args, options = {}) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function run(cwd, args, env = {}, cli = cliPath) {
  return spawnSync('node', [cli, ...args], {
    cwd,
    env: { ...cleanEnv, ...env },
    encoding: 'utf8',
  });
}

function output(result) {
  return `${result.stdout || ''}${result.stderr || ''}`;
}

function assertOk(result, message = '') {
  assert.strictEqual(result.status, 0, `${message}\n${output(result)}`);
}

function assertFailed(result, pattern) {
  assert.notStrictEqual(result.status, 0, output(result));
  if (pattern) assert.match(output(result), pattern);
}

function taskRow(task) {
  return `| ${task.id} | ${task.status || 'In Progress'} | FB-${task.owner || 'Tech'} | Test | ${task.scope || `Scope for ${task.id}`} | ${task.locks || `src/${task.id.toLowerCase()}`} | [Handoff](docs/handoffs/${task.id}.md) |`;
}

function taskDetail(task) {
  return `
### ${task.id} - ${task.scope || `Scope for ${task.id}`}
*   **Status**: ${task.status || 'In Progress'}
*   **Owner / Thread**: FB-${task.owner || 'Tech'}
*   **Area**: Test
*   **Scope**: ${task.scope || `Scope for ${task.id}`}
*   **Goal Alignment Session**:
    *   **Objective**: Deliver ${task.id} safely.
    *   **Key Results**: The task contract is verified.
    *   **Definition of Done**: Focused checks pass.
    *   **Gate / Review Point**: Product review.
    *   **Approval**: ${task.approval || 'approved'}
    *   **Justification**: The fixture is approved.
*   **Affected Screens / Locks**:
    *   **Screens**: CLI
    *   **Locked Files**: ${task.locks || `src/${task.id.toLowerCase()}`}
*   **Links & Deliverables**:
    *   **Handoff**: [${task.id}](docs/handoffs/${task.id}.md)
`;
}

function handoff(task) {
  return `---
type: fb-lane-handoff
task: ${task.id}
lane: fb-product
status: ready
okr_fit: aligned
fb_harness: v2
Review state: not reviewable
---

# ${task.id}

## Goal Alignment Session

Product Goal: Deliver the approved fixture.
Workstream Goal: ${task.scope || `Scope for ${task.id}`}
Lane OKR Fit: aligned
User Approval Needed: no
Mini-loop Evidence: Fixture ready for focused verification.
Evidence Against Product OKR: None identified.

## Project Start Brief

What you asked for: Deliver ${task.id}.
Your decisions: Use repository-local evidence.
Assumptions to confirm: None.
What FB will build: ${task.scope || `Scope for ${task.id}`}.
Out of scope: Unrelated work.
Success looks like: The focused test passes.

## Build Brief

Build the approved ${task.id} fixture.
`;
}

function createRepo(tasks = [{ id: 'TASK-001', locks: 'src/app.js' }]) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-session-test-'));
  const repo = path.join(parent, 'repo');
  const remote = path.join(parent, 'remote.git');
  fs.mkdirSync(repo);
  git(repo, ['init', '-q', '-b', 'main']);
  git(repo, ['config', 'user.email', 'fb-session@example.test']);
  git(repo, ['config', 'user.name', 'FB Session Test']);
  fs.mkdirSync(path.join(repo, 'docs', 'handoffs'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'tools'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'AGENTS.md'), '# Project-owned instructions\n\nKeep this sentence.\n');
  fs.writeFileSync(path.join(repo, '.gitignore'), '.fb-test-worktrees/\n');
  fs.writeFileSync(path.join(repo, 'src', 'app.js'), 'module.exports = 1;\n');
  fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));
  fs.writeFileSync(path.join(repo, 'tools', 'fb-lane.cjs'), '// fixture route\n');
  const board = `# Project Board

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
${tasks.map(taskRow).join('\n')}

${tasks.map(taskDetail).join('\n---\n')}
`;
  fs.writeFileSync(path.join(repo, 'PROJECT_BOARD.md'), board);
  fs.writeFileSync(path.join(repo, 'docs', 'handoffs', 'index.md'), '# Handoff Index\n');
  for (const task of tasks) {
    fs.writeFileSync(path.join(repo, 'docs', 'handoffs', `${task.id}.md`), handoff(task));
  }
  git(repo, ['add', '.']);
  git(repo, ['commit', '-qm', 'fixture']);
  git(parent, ['init', '-q', '--bare', remote]);
  git(repo, ['remote', 'add', 'origin', remote]);
  git(repo, ['push', '-q', '-u', 'origin', 'main']);
  return {
    parent,
    repo,
    remote,
    cleanup() {
      fs.rmSync(parent, { recursive: true, force: true });
    },
  };
}

function addWorktree(fixture, branch = 'session/work') {
  const worktree = path.join(fixture.parent, branch.replace(/[^a-z0-9]+/gi, '-'));
  git(fixture.repo, ['worktree', 'add', '-q', '-b', branch, worktree, 'main']);
  return worktree;
}

function commonDir(cwd) {
  const value = git(cwd, ['rev-parse', '--git-common-dir']);
  return path.resolve(cwd, value);
}

function sessionPath(cwd, id) {
  return path.join(commonDir(cwd), 'fb-sessions', `${id}.json`);
}

function recapPath(cwd, id) {
  return path.join(cwd, 'docs', 'sessions', `${id}.md`);
}

function readSession(cwd, id) {
  return JSON.parse(fs.readFileSync(sessionPath(cwd, id), 'utf8'));
}

function promote(cwd, taskId, lane, mode, id, env = {}) {
  return run(cwd, ['session', 'promote', taskId, lane, '--mode', mode, '--session-id', id], env);
}

function appendEvidence(cwd, id, taskId, sourceCommit, validationStatus = 'pass') {
  const recap = recapPath(cwd, id);
  const handoffPath = path.join(cwd, 'docs', 'handoffs', `${taskId}.md`);
  fs.appendFileSync(recap, `
## Decision And Assumptions

Decision: Keep the approved repository-local implementation boundary.
Assumption: The local bare remote is the intended verification target.

## Task Receipt

Approved brief and decisions: The approved Build Brief and repository-local evidence decision were followed.
Confirmed assumptions and approved scope changes: The local remote assumption was confirmed; no scope change was needed.
Branch, source commits, and changed surfaces: session/work at source commit ${sourceCommit}; src/app.js and coordination records changed.
Checks, failures, recovery, and results: node focused-session-test passed; no unresolved failure; dead-lock recovery passed.
Review state, direct links, limits, and external gates: completed build; [handoff](../handoffs/${taskId}.md); local CLI only; Product review remains.
Repository state: Source committed; coordination records are ready for checkpoint.
Remaining owner and action: Product owns final branch-diff review.

## Brief Validation

Status: ${validationStatus}
Satisfied criteria and evidence: The approved CLI, Git, and evidence criteria have named results.
Missing criteria: ${validationStatus === 'pass' ? 'No approved implementation criterion remains missing.' : 'External review access'}
Reason: ${validationStatus === 'pass' ? 'The named focused checks satisfy every approved local criterion.' : 'The external reviewer is unavailable.'}
Owner: Product
Next action: Product performs the final branch-diff review.
Approved scope-change references: The original approved brief applies without a scope change.

## Closeout

Reason: ${validationStatus === 'pass' ? 'All local criteria passed.' : 'External review remains unavailable.'}
Owner: Product
Next action: Product performs the final branch-diff review.
`);
  fs.appendFileSync(handoffPath, `
## Session Evidence

[Session recap](../sessions/${id}.md)

## Task Receipt

Approved brief and decisions: The approved Build Brief and repository-local evidence decision were followed.
Confirmed assumptions and approved scope changes: The fixture assumptions were confirmed; no scope change was needed.
Branch, source commits, and changed surfaces: session/work at source commit ${sourceCommit}; src/app.js and coordination records changed.
Checks, failures, recovery, and results: focused session tests passed; no unresolved failure; dead-lock recovery passed.
Review state, direct links, limits, and external gates: completed build; [session recap](../sessions/${id}.md); local CLI only; Product review remains.
Repository state: Source committed; coordination records are ready for checkpoint.
Remaining owner and action: Product owns final branch-diff review.

## Brief Validation

Status: ${validationStatus}
Satisfied criteria and evidence: The approved CLI, Git, and evidence criteria have named results.
Missing criteria: ${validationStatus === 'pass' ? 'No approved implementation criterion remains missing.' : 'External review access'}
Reason: ${validationStatus === 'pass' ? 'The named focused checks satisfy every approved local criterion.' : 'The external reviewer is unavailable.'}
Owner: Product
Next action: Product performs the final branch-diff review.
Approved scope-change references: The original approved brief applies without a scope change.

## Verification Handoff

Candidate: session/work at ${sourceCommit}.
Test plan: [Build Brief](#build-brief)
Commands and results: node tools/fb-session.test.cjs — passed.
Environment: Local temporary Git repository with a bare origin.
Runnable evidence links: [Session recap](../sessions/${id}.md)
Manual pass criteria: Product confirms only approved surfaces changed.
Recovery attempted: Dead-process registry-lock recovery; passed.
Known limits: Local CLI behavior only; no hosted provider was exercised.
Next Product/BFM recovery action: Product reviews the branch diff.

## Test This Now

- **Outcome type:** Completed CLI fixture
- **Direct links:** [Session recap](../sessions/${id}.md)
- **Exact steps and expectations:**
  1. Open the session recap and confirm the named source commit and checks are present.
- **Pass criteria:** The receipt, validation, verification handoff, and reciprocal link are complete.
- **Known limits:** Local CLI behavior only.
- **Failure-report format:** Observed result; expected result; branch and commit; environment.
`);
}

function blockingEvalRecord(latestResult) {
  return `## Eval Record

Eval ID: EVAL-HARNESS-CLOSE-001
Eval type: harness
Authority: blocking
Previous authority: advisory
Authority change approval: Product approval: approved; Reference: APPROVED-CLOSE-001
Authority change recorded by: Product/BFM
Authority decision: Product approved and recorded blocking authority.
Judgment: objective
Trigger: Completed session close is attempted.
Scenario: A blocking eval record has contradictory lifecycle fields.
Quality target: Completed close cannot hide a blocking failure.
Must pass: Latest result, rerun, and disposition agree.
Must not happen: A fail result closes because a rerun string says pass.
Evidence required: Repo-local record and session-close result.
Owner: Product/BFM
Latest result: ${latestResult}
Failure classification: Eval failure
Revision: Repaired the original candidate without weakening the target.
Rerun result: pass - original closeout scenario passed at abc1234.
Disposition: passed
Promotion or demotion recommendation: Keep blocking authority.
Advisory failure explanation: None - this record is blocking.
Root cause: The original candidate omitted required evidence.
Regression case: EVAL-HARNESS-CLOSE-001-R1 repeats the contradiction.
Fresh evidence: Fresh closeout evidence at abc1234.
Record consistency: Board, handoff, eval, session, and Git abc1234 agree.
Changed user decision approval: No user decision changed.
Approved brief revision: None - the approved brief is unchanged.
Mechanical origin and regression evidence: None - this is a judgment scenario.
`;
}

function addSelectedEvalEvidence(cwd, id, taskId, latestResult) {
  const handoffPath = path.join(cwd, 'docs', 'handoffs', `${taskId}.md`);
  const recap = recapPath(cwd, id);
  const selected = `Selected eval records: EVAL-HARNESS-CLOSE-001 (blocking, ${latestResult}, docs/evals/session-close.md#eval-harness-close-001).`;
  let handoffSource = fs.readFileSync(handoffPath, 'utf8');
  handoffSource = handoffSource.replace('## Project Start Brief\n\n', `## Project Start Brief\n\nQuality bar: Completed closeout preserves blocking eval truth.\nSelected eval IDs and authority: EVAL-HARNESS-CLOSE-001 (blocking).\n${selected}\nMechanical versus judgment evidence: Lifecycle coherence is mechanical; Product owns authority.\nRemaining user judgment: Product confirms the approved blocking authority remains unchanged.\n\n`);
  handoffSource = handoffSource.replace('## Build Brief\n\n', `## Build Brief\n\nQuality bar: Completed closeout preserves blocking eval truth.\nSelected eval IDs and authority: EVAL-HARNESS-CLOSE-001 (blocking).\n${selected}\nMechanical versus judgment evidence: Lifecycle coherence is mechanical; Product owns authority.\nRemaining user judgment: Product confirms the approved blocking authority remains unchanged.\n\n`);
  handoffSource = handoffSource.replace('## Verification Handoff\n\n', `## Verification Handoff\n\nSelected eval results and evidence: EVAL-HARNESS-CLOSE-001 uses the repo-local lifecycle record.\n${selected}\n`);
  handoffSource = handoffSource.replace('## Task Receipt\n\n', `## Task Receipt\n\nSelected eval results and evidence: EVAL-HARNESS-CLOSE-001 uses the repo-local lifecycle record.\n${selected}\n`);
  handoffSource = handoffSource.replace('## Test This Now\n\n', `## Test This Now\n\nWhat was evaluated: EVAL-HARNESS-CLOSE-001 lifecycle coherence.\n${selected}\nExact scenarios and expected results: Contradictory failure cannot close; coherent pass can close.\nKnown quality gaps: None after the coherent pass.\nRequired user judgment: None; Product authority remains blocking.\n`);
  fs.writeFileSync(handoffPath, handoffSource);
  fs.appendFileSync(recap, `\n## Verification Checkpoint\n\nSelected eval results and evidence: EVAL-HARNESS-CLOSE-001 uses the repo-local lifecycle record.\n${selected}\n`);
  fs.mkdirSync(path.join(cwd, 'docs', 'evals'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'evals', 'session-close.md'), `### EVAL-HARNESS-CLOSE-001\n\n${blockingEvalRecord(latestResult)}`);
}

function productQualityGapRecord(gap = '') {
  return `### EVAL-PRODUCT-CLOSE-001

## Eval Record

Eval ID: EVAL-PRODUCT-CLOSE-001
Eval type: product
Authority: shadow
Previous authority: none
Authority change approval: Product approval: not required; Reference: initial-shadow-record
Authority change recorded by: Product/BFM
Authority decision: Product/BFM recorded the initial shadow authority.
Judgment: subjective
Trigger: Completed session close or submit is attempted.
Scenario: A functional candidate misses the approved product-specificity target.
Quality target: Product recommendations are specific and actionable.
Must pass: The output names the approved product context and next action.
Must not happen: Generic functional output closes without a Quality Gap.
Evidence required: Curated repo-local comparison evidence.
Owner: Product/BFM
Latest result: fail
Failure classification: Eval failure
Revision: Revise the candidate against the original scenario.
Rerun result: not run
Disposition: open
Promotion or demotion recommendation: Keep shadow pending repeated evidence.
Advisory failure explanation: None - this record is shadow.
Root cause: None - the failure remains open.
Regression case: None - the failure remains open.
Fresh evidence: None - the failure remains open.
Record consistency: Eval, handoff, session, and Git agree that the gap is open.
Changed user decision approval: No user decision changed.
Approved brief revision: None - the approved brief is unchanged.
Mechanical origin and regression evidence: None - this is a judgment scenario.
Good example: Recommend the named cart-recovery action for the ceramics launch.
Bad example: Improve engagement.
${gap}`;
}

function addSelectedProductEvalEvidence(cwd, id, taskId, gap = '') {
  const handoffPath = path.join(cwd, 'docs', 'handoffs', `${taskId}.md`);
  const recap = recapPath(cwd, id);
  const selected = 'Selected eval records: EVAL-PRODUCT-CLOSE-001 (shadow, fail, docs/evals/product-close.md#eval-product-close-001).';
  let handoffSource = fs.readFileSync(handoffPath, 'utf8');
  for (const heading of ['Project Start Brief', 'Build Brief']) {
    handoffSource = handoffSource.replace(`## ${heading}\n\n`, `## ${heading}\n\nQuality bar: Product recommendations remain specific and actionable.\nSelected eval IDs and authority: EVAL-PRODUCT-CLOSE-001 (shadow).\n${selected}\nMechanical versus judgment evidence: Structure is mechanical; specificity is Product judgment.\nRemaining user judgment: Product confirms fit against the approved promise.\n\n`);
  }
  for (const heading of ['Verification Handoff', 'Task Receipt']) {
    handoffSource = handoffSource.replace(`## ${heading}\n\n`, `## ${heading}\n\nSelected eval results and evidence: EVAL-PRODUCT-CLOSE-001 records the functional quality miss.\n${selected}\n`);
  }
  handoffSource = handoffSource.replace('## Test This Now\n\n', `## Test This Now\n\nWhat was evaluated: Product specificity for the original candidate.\n${selected}\nExact scenarios and expected results: Generic output remains open with a complete Quality Gap.\nKnown quality gaps: EVAL-PRODUCT-CLOSE-001 remains open and checking.\nRequired user judgment: Product owns the next comparison.\n`);
  fs.writeFileSync(handoffPath, handoffSource);
  fs.appendFileSync(recap, `\n## Verification Checkpoint\n\nSelected eval results and evidence: EVAL-PRODUCT-CLOSE-001 records the functional quality miss.\n${selected}\n`);
  fs.mkdirSync(path.join(cwd, 'docs', 'evals'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'evals', 'product-close.md'), productQualityGapRecord(gap));
}

function replaceSection(markdown, heading, replacement) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^##\\s+${escaped}\\s*$)[\\s\\S]*?(?=^##\\s+|(?![\\s\\S]))`, 'm');
  assert.match(markdown, pattern, `fixture must contain ${heading}`);
  return markdown.replace(pattern, `$1\n\n${replacement.trim()}\n\n`);
}

function spawnRun(cwd, args, env = {}) {
  return new Promise(resolve => {
    const child = spawn('node', [cliPath, ...args], {
      cwd,
      env: { ...cleanEnv, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', status => resolve({ status, stdout, stderr }));
  });
}

async function waitForPath(filePath, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (!fs.existsSync(filePath)) {
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for ${filePath}`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

function mcpCall(cwd, name, args = {}, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [cliPath, 'mcp'], {
      cwd,
      env: { ...cleanEnv, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', status => {
      const responseLine = stdout.split(/\r?\n/).find(line => line.trim().startsWith('{'));
      resolve({
        status,
        stdout,
        stderr,
        response: responseLine ? JSON.parse(responseLine) : null,
      });
    });
    child.stdin.end(`${JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: args },
    })}\n`);
  });
}

function installAuthorityChangingSubmitHook(cwd) {
  const scriptPath = path.join(cwd, 'tools', 'mutate-submit-authority.cjs');
  fs.writeFileSync(scriptPath, `
const fs = require('fs');
const boardPath = 'PROJECT_BOARD.md';
const board = fs.readFileSync(boardPath, 'utf8');
fs.writeFileSync(boardPath, board.replace('| TASK-001 | In Progress |', '| TASK-001 | Ready |'));
`);
  fs.writeFileSync(path.join(cwd, '.fb-lane.json'), `${JSON.stringify({
    hooks: { 'pre-submit': 'node tools/mutate-submit-authority.cjs' },
  }, null, 2)}\n`);
}

test('intake resolves flag then CODEX_THREAD_ID then FB_SESSION_ID and performs no writes', () => {
  const fixture = createRepo();
  try {
    const before = git(fixture.repo, ['status', '--porcelain']);
    const flagged = run(fixture.repo, ['session', 'intake', '--session-id', 'flag-id'], {
      CODEX_THREAD_ID: 'codex-id',
      FB_SESSION_ID: 'fb-id',
    });
    assertOk(flagged);
    assert.match(flagged.stdout, /flag-id/);
    const codex = run(fixture.repo, ['session', 'intake'], { CODEX_THREAD_ID: 'codex-id', FB_SESSION_ID: 'fb-id' });
    assertOk(codex);
    assert.match(codex.stdout, /codex-id/);
    const fallback = run(fixture.repo, ['session', 'intake'], { FB_SESSION_ID: 'fb-id' });
    assertOk(fallback);
    assert.match(fallback.stdout, /fb-id/);
    assert.strictEqual(git(fixture.repo, ['status', '--porcelain']), before);
    assert.ok(!fs.existsSync(path.join(commonDir(fixture.repo), 'fb-sessions')));
    assert.ok(!fs.existsSync(path.join(fixture.repo, 'docs', 'sessions')));
  } finally {
    fixture.cleanup();
  }
});

test('session IDs, modes, lanes, default branches, and sidechat promotion are gated', () => {
  const fixture = createRepo();
  try {
    assertFailed(run(fixture.repo, ['session', 'intake', '--session-id', '../unsafe']), /unsafe|invalid/i);
    assertFailed(promote(fixture.repo, 'TASK-001', 'tech', 'planning', 'plan-main'), /default branch|non-default/i);
    git(fixture.repo, ['checkout', '-qb', 'session/planning']);
    assertFailed(promote(fixture.repo, 'TASK-001', 'unknown', 'planning', 'bad-lane'), /lane/i);
    assertFailed(promote(fixture.repo, 'TASK-001', 'tech', 'unknown', 'bad-mode'), /mode/i);
    assertFailed(promote(fixture.repo, 'TASK-001', 'tech', 'planning', 'sidechat', { CODEX_THREAD_TYPE: 'sidechat' }), /sidechat|observer/i);
    const promoted = promote(fixture.repo, 'TASK-001', 'tech', 'planning', 'planning-1');
    assertOk(promoted);
    const first = fs.readFileSync(sessionPath(fixture.repo, 'planning-1'), 'utf8');
    const repeated = promote(fixture.repo, 'TASK-001', 'tech', 'planning', 'planning-1');
    assertOk(repeated);
    assert.match(repeated.stdout, /already active|idempotent/i);
    assert.strictEqual(fs.readFileSync(sessionPath(fixture.repo, 'planning-1'), 'utf8'), first);
  } finally {
    fixture.cleanup();
  }
});

test('execution requires an approved active board task, handoff, linked worktree, and nonoverlapping normalized locks', () => {
  const fixture = createRepo([
    { id: 'TASK-001', locks: 'src' },
    { id: 'TASK-002', locks: 'src/lib' },
    { id: 'TASK-003', locks: '(None)' },
    { id: 'TASK-004', locks: 'docs/task-004.md', approval: 'pending' },
  ]);
  try {
    git(fixture.repo, ['checkout', '-qb', 'session/not-linked']);
    assertFailed(promote(fixture.repo, 'TASK-001', 'tech', 'execution', 'exec-normal'), /linked worktree/i);
    git(fixture.repo, ['checkout', 'main']);
    const worktree = addWorktree(fixture, 'session/work');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'exec-1'));
    assertFailed(promote(worktree, 'TASK-002', 'tech', 'execution', 'exec-overlap'), /overlap|lock/i);
    assertFailed(promote(worktree, 'TASK-003', 'tech', 'execution', 'exec-no-lock'), /declared.*lock|lock/i);
    assertFailed(promote(worktree, 'TASK-004', 'tech', 'execution', 'exec-pending'), /approved/i);
    fs.unlinkSync(path.join(worktree, 'docs', 'handoffs', 'TASK-002.md'));
    assertFailed(promote(worktree, 'TASK-002', 'tech', 'execution', 'exec-no-handoff'), /handoff/i);
  } finally {
    fixture.cleanup();
  }
});

test('twelve concurrent promotions remain atomic and visible across linked worktrees', async () => {
  const tasks = Array.from({ length: 12 }, (_, index) => ({
    id: `TASK-${String(index + 1).padStart(3, '0')}`,
    locks: `src/task-${index + 1}`,
  }));
  const fixture = createRepo(tasks);
  try {
    git(fixture.repo, ['checkout', '-qb', 'session/concurrent']);
    const results = await Promise.all(tasks.map((task, index) =>
      spawnRun(fixture.repo, ['session', 'promote', task.id, 'coordination', '--mode', 'planning', '--session-id', `parallel-${index + 1}`])
    ));
    results.forEach(result => assertOk(result));
    for (let index = 0; index < 12; index += 1) {
      const record = readSession(fixture.repo, `parallel-${index + 1}`);
      assert.strictEqual(record.taskId, tasks[index].id);
      assert.strictEqual(record.state, 'active');
    }
    const worktree = addWorktree(fixture, 'session/reader');
    const status = run(worktree, ['session', 'status', '--all']);
    assertOk(status);
    assert.match(status.stdout, /parallel-12/);
  } finally {
    fixture.cleanup();
  }
});

test('same-session checkpoints serialize authoritative pending and commit state', async () => {
  const fixture = createRepo();
  try {
    git(fixture.repo, ['checkout', '-qb', 'session/checkpoint-atomic']);
    assertOk(promote(fixture.repo, 'TASK-001', 'tech', 'planning', 'checkpoint-atomic'));
    const commit = git(fixture.repo, ['rev-parse', '--short', 'HEAD']);
    appendEvidence(fixture.repo, 'checkpoint-atomic', 'TASK-001', commit);
    const gate = path.join(fixture.parent, 'checkpoint-gate');
    fs.mkdirSync(gate, { recursive: true });
    const first = spawnRun(fixture.repo, ['session', 'checkpoint', '--reason', 'scope', '--session-id', 'checkpoint-atomic'], { FB_SESSION_TEST_LIFECYCLE_GATE: gate });
    await waitForPath(path.join(gate, 'started'));
    const second = spawnRun(fixture.repo, ['session', 'checkpoint', '--reason', 'decision', '--session-id', 'checkpoint-atomic']);
    await new Promise(resolve => setTimeout(resolve, 100));
    fs.writeFileSync(path.join(gate, 'release'), 'release\n');
    const [firstResult, secondResult] = await Promise.all([first, second]);
    assertOk(firstResult);
    assertFailed(secondResult, /current change|pending.*checkpoint|session.*mutation/i);
    const record = readSession(fixture.repo, 'checkpoint-atomic');
    assert.strictEqual(record.pendingCheckpoint, undefined);
    assert.strictEqual(record.milestones.filter(item => item.reason === 'scope').length, 1);
    assert.strictEqual(record.milestones.filter(item => item.reason === 'decision').length, 0);
  } finally {
    fixture.cleanup();
  }
});

test('checkpoint and close serialize so a completed checkpoint cannot reopen a closed session', async () => {
  const fixture = createRepo();
  try {
    git(fixture.repo, ['checkout', '-qb', 'session/checkpoint-close-atomic']);
    assertOk(promote(fixture.repo, 'TASK-001', 'tech', 'planning', 'checkpoint-close-atomic'));
    const commit = git(fixture.repo, ['rev-parse', '--short', 'HEAD']);
    appendEvidence(fixture.repo, 'checkpoint-close-atomic', 'TASK-001', commit, 'blocked');
    const gate = path.join(fixture.parent, 'checkpoint-close-gate');
    fs.mkdirSync(gate, { recursive: true });
    const checkpoint = spawnRun(fixture.repo, ['session', 'checkpoint', '--reason', 'scope', '--session-id', 'checkpoint-close-atomic'], { FB_SESSION_TEST_LIFECYCLE_GATE: gate });
    await waitForPath(path.join(gate, 'started'));
    const close = spawnRun(fixture.repo, ['session', 'close', '--outcome', 'blocked', '--session-id', 'checkpoint-close-atomic']);
    await new Promise(resolve => setTimeout(resolve, 100));
    fs.writeFileSync(path.join(gate, 'release'), 'release\n');
    const [checkpointResult, closeResult] = await Promise.all([checkpoint, close]);
    assertOk(checkpointResult);
    assertOk(closeResult);
    const record = readSession(fixture.repo, 'checkpoint-close-atomic');
    assert.strictEqual(record.state, 'closed');
    assert.strictEqual(record.outcome, 'blocked');
    assert.strictEqual(record.pendingCheckpoint, undefined);
  } finally {
    fixture.cleanup();
  }
});

test('session close atomically closes linked Full repair budgets and rejects stale advancement', () => {
  const fixture = createRepo([{ id: 'TASK-001', owner: 'Bfm', scope: 'Coordinate multiple owners', locks: 'src/app.js' }]);
  try {
    const worktree = addWorktree(fixture, 'session/full-budget-close');
    assertOk(promote(worktree, 'TASK-001', 'bfm', 'execution', 'full-budget-close'));
    const handoffPath = path.join(worktree, 'docs', 'handoffs', 'TASK-001.md');
    fs.appendFileSync(handoffPath, '\nProduct decision version: decision-v1\n');
    const budgetRef = issueFullRepairBudget(worktree, { sessionId: 'full-budget-close', runId: 'full-budget-close-run', candidateId: 'full-budget-close-candidate' });
    appendEvidence(worktree, 'full-budget-close', 'TASK-001', git(worktree, ['rev-parse', 'HEAD']), 'blocked');
    assertOk(run(worktree, ['session', 'close', '--outcome', 'blocked', '--session-id', 'full-budget-close']));
    assert.strictEqual(readFullRepairBudget(worktree, budgetRef).state, 'closed');
    assert.strictEqual(advanceFullRepairBudget(worktree, { budgetRef, materialProgress: true, event: {} }).status, 'stopped');
  } finally {
    fixture.cleanup();
  }
});

test('MCP claim uses the CLI linked-worktree path and supports direct execution promotion there', async () => {
  const fixture = createRepo([{ id: 'TASK-024', status: 'Ready', locks: 'src/app.js' }]);
  try {
    const claimed = await mcpCall(fixture.repo, 'fb_lane_claim', {
      taskId: 'TASK-024',
      lane: 'Tech',
      lockedFiles: 'src/app.js',
      workspacePath: fixture.repo,
    });
    assert.strictEqual(claimed.status, 0, output(claimed));
    assert.ok(claimed.response && !claimed.response.error, JSON.stringify(claimed.response));
    const message = claimed.response.result.content.map(item => item.text || '').join('\n');
    assert.match(message, /Branch:\s*tech\/TASK-024-/i);
    const worktreeMatch = message.match(/Worktree:\s*([^\n]+)/i);
    assert.ok(worktreeMatch, message);
    const worktree = worktreeMatch[1].trim();
    assert.ok(fs.existsSync(worktree), worktree);
    assert.strictEqual(git(fixture.repo, ['branch', '--show-current']), 'main');
    assert.match(git(fixture.repo, ['worktree', 'list', '--porcelain']), new RegExp(worktree.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assertOk(promote(worktree, 'TASK-024', 'tech', 'execution', 'mcp-claim'));
  } finally {
    fixture.cleanup();
  }
});

test('dead mutation locks recover within bounds and stale status never releases declared locks', () => {
  const fixture = createRepo();
  try {
    git(fixture.repo, ['checkout', '-qb', 'session/recovery']);
    const registryDir = path.join(commonDir(fixture.repo), 'fb-sessions');
    const lockDir = path.join(commonDir(fixture.repo), 'fb-sessions.lock');
    fs.mkdirSync(registryDir, { recursive: true });
    fs.mkdirSync(lockDir);
    fs.writeFileSync(path.join(lockDir, 'owner.json'), JSON.stringify({ pid: 999999, startedAt: '2000-01-01T00:00:00.000Z' }));
    assertOk(promote(fixture.repo, 'TASK-001', 'tech', 'planning', 'recovered'));
    const recordPath = sessionPath(fixture.repo, 'recovered');
    const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    record.lastMilestoneAt = '2000-01-01T00:00:00.000Z';
    record.locks = ['src/app.js'];
    fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
    const status = run(fixture.repo, ['session', 'status', '--session-id', 'recovered']);
    assertOk(status);
    assert.match(status.stdout, /stale/i);
    assert.deepStrictEqual(readSession(fixture.repo, 'recovered').locks, ['src/app.js']);
  } finally {
    fixture.cleanup();
  }
});

test('verification checkpoint commits and pushes only recap and linked handoff while execution source dirt remains unstaged', () => {
  const fixture = createRepo();
  try {
    const worktree = addWorktree(fixture, 'session/work');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'checkpoint-ok'));
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 2;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: source evidence']);
    const sourceCommit = git(worktree, ['rev-parse', '--short', 'HEAD']);
    fs.writeFileSync(path.join(worktree, 'src', 'uncommitted.js'), 'module.exports = true;\n');
    appendEvidence(worktree, 'checkpoint-ok', 'TASK-001', sourceCommit);
    const checkpoint = run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'checkpoint-ok']);
    assertOk(checkpoint);
    assert.match(checkpoint.stdout, /pushed|checkpoint/i);
    const committed = git(worktree, ['show', '--pretty=', '--name-only', 'HEAD']).split(/\r?\n/).filter(Boolean).sort();
    assert.deepStrictEqual(committed, ['docs/handoffs/TASK-001.md', 'docs/sessions/checkpoint-ok.md']);
    assert.match(git(worktree, ['status', '--porcelain']), /src\/uncommitted\.js/);
    assert.ok(readSession(worktree, 'checkpoint-ok').milestones.some(item => item.reason === 'verification'));
    const remoteHead = git(fixture.remote, ['rev-parse', 'refs/heads/session/work']);
    assert.strictEqual(remoteHead, git(worktree, ['rev-parse', 'HEAD']));
  } finally {
    fixture.cleanup();
  }
});

test('verification checkpoint keeps only canonical counted control-loop summaries and rejects copied or malformed declarations', () => {
  const fixture = createRepo();
  try {
    const worktree = addWorktree(fixture, 'session/control-loop-summary');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'control-loop-summary'));
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 22;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: control loop source evidence']);
    const sourceCommit = git(worktree, ['rev-parse', '--short', 'HEAD']);
    appendStageEvent(worktree, {
      schemaVersion: 'fb-stage-event-v1', eventId: 'event-session-summary', timestamp: '2026-07-26T00:00:00.000Z',
      runId: 'run-session-summary', sessionId: 'control-loop-summary', taskId: 'TASK-001', stage: 'verification',
      capability: 'focused-check', attempt: 1, decision: 'process', result: 'passed', artifactRef: 'src/app.js',
      baselineRef: 'src/app.js', candidateRef: null, criteriaIds: ['criterion-session-summary'],
      evidenceRefs: ['docs/handoffs/TASK-001.md#verification-handoff'], failureClass: null, durationMs: 4,
      inputTokens: 'unavailable', outputTokens: 'unavailable', cost: 'unavailable', nextAction: 'Retain the summary link only.',
    });
    appendEvidence(worktree, 'control-loop-summary', 'TASK-001', sourceCommit);
    fs.appendFileSync(recapPath(worktree, 'control-loop-summary'), '\nStage event summary: [run-session-summary](fb-lane/events/run-session-summary.jsonl) (1 event).\n');
    assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'control-loop-summary']));
  } finally {
    fixture.cleanup();
  }

  const copied = createRepo();
  try {
    const worktree = addWorktree(copied, 'session/control-loop-copied');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'control-loop-copied'));
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 23;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: copied event source']);
    const sourceCommit = git(worktree, ['rev-parse', '--short', 'HEAD']);
    appendEvidence(worktree, 'control-loop-copied', 'TASK-001', sourceCommit);
    fs.appendFileSync(recapPath(worktree, 'control-loop-copied'), '\nStage event summary: [run-session-copied](fb-lane/events/run-session-copied.jsonl) (1 event).\n{"schemaVersion":"fb-stage-event-v1","eventId":"copied-event"}\n');
    assertFailed(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'control-loop-copied']), /stage event|JSONL|copy/i);
  } finally {
    copied.cleanup();
  }

  const malformed = createRepo();
  try {
    const worktree = addWorktree(malformed, 'session/control-loop-malformed');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'control-loop-malformed'));
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 24;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: malformed summary source']);
    const sourceCommit = git(worktree, ['rev-parse', '--short', 'HEAD']);
    appendStageEvent(worktree, {
      schemaVersion: 'fb-stage-event-v1', eventId: 'event-session-malformed', timestamp: '2026-07-26T00:00:00.000Z',
      runId: 'run-session-malformed', sessionId: 'control-loop-malformed', taskId: 'TASK-001', stage: 'verification',
      capability: 'focused-check', attempt: 1, decision: 'process', result: 'passed', artifactRef: 'src/app.js',
      baselineRef: 'src/app.js', candidateRef: null, criteriaIds: ['criterion-session-summary'],
      evidenceRefs: ['docs/handoffs/TASK-001.md#verification-handoff'], failureClass: null, durationMs: 4,
      inputTokens: 'unavailable', outputTokens: 'unavailable', cost: 'unavailable', nextAction: 'Retain the summary link only.',
    });
    appendEvidence(worktree, 'control-loop-malformed', 'TASK-001', sourceCommit);
    fs.appendFileSync(recapPath(worktree, 'control-loop-malformed'), '\nStage event summary: [run-session-malformed](fb-lane/events/run-session-malformed.jsonl) (1 event).\nStage event summary: [run-session-malformed](fb-lane/events/run-session-malformed.jsonl) (one event).\n');
    assertFailed(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'control-loop-malformed']), /stage event|summary|count/i);
  } finally {
    malformed.cleanup();
  }
});

test('checkpoint independently rejects unrelated staging, placeholders, private reasoning, and secrets', () => {
  const cases = [
    { id: 'unrelated-stage', recap: 'Decision: Keep scope bounded.\n', staged: true, pattern: /unrelated staged/i },
    { id: 'placeholder', recap: 'Decision: TODO\n', pattern: /placeholder|TODO/i },
    { id: 'private-reasoning', recap: 'Decision: Keep scope bounded.\nPrivate reasoning: hidden chain\n', pattern: /private[- ]reasoning/i },
    { id: 'secret', recap: 'Decision: Keep scope bounded.\nAPI_TOKEN=secret-value\n', pattern: /secret|token/i },
  ];
  for (const item of cases) {
    const fixture = createRepo();
    try {
      git(fixture.repo, ['checkout', '-qb', `session/${item.id}`]);
      assertOk(promote(fixture.repo, 'TASK-001', 'product', 'planning', item.id));
      fs.appendFileSync(recapPath(fixture.repo, item.id), `\n${item.recap}`);
      fs.appendFileSync(path.join(fixture.repo, 'docs', 'handoffs', 'TASK-001.md'), `\n[Session recap](../sessions/${item.id}.md)\nDecision: Keep scope bounded.\n`);
      if (item.staged) {
        fs.writeFileSync(path.join(fixture.repo, 'src', 'dirty.js'), 'x\n');
        git(fixture.repo, ['add', 'src/dirty.js']);
      }
      assertFailed(run(fixture.repo, ['session', 'checkpoint', '--reason', 'decision', '--session-id', item.id]), item.pattern);
      assert.strictEqual(git(fixture.repo, ['rev-parse', 'HEAD']), git(fixture.remote, ['rev-parse', 'main']));
    } finally {
      fixture.cleanup();
    }
  }
});

test('every meaningful Failure block requires its own complete structured evidence', () => {
  const fixture = createRepo();
  try {
    git(fixture.repo, ['checkout', '-qb', 'session/multiple-failures']);
    assertOk(promote(fixture.repo, 'TASK-001', 'tech', 'planning', 'multiple-failures'));
    fs.appendFileSync(recapPath(fixture.repo, 'multiple-failures'), `
## Decision And Assumptions

Decision: Keep both failure records independently reviewable.
`);
    const handoffPath = path.join(fixture.repo, 'docs', 'handoffs', 'TASK-001.md');
    fs.appendFileSync(handoffPath, `
## Failure Evidence

Failure: The first simulated command failed.
Observed: The first command exited with status one.
Cause: The first fixture intentionally returned a failing status.
Recovery attempted: The command input was corrected and rerun once.
Result: The first command passed on the bounded retry.
Reusable lesson: Preserve the first failure as a regression fixture.

Failure: The second simulated command failed.
Observed: The second command exited with status two.
`);

    assertFailed(
      run(fixture.repo, ['session', 'checkpoint', '--reason', 'decision', '--session-id', 'multiple-failures']),
      /structured Cause|Cause evidence/i
    );
    assert.strictEqual(readSession(fixture.repo, 'multiple-failures').milestones.some(item => item.reason === 'decision'), false);

    fs.appendFileSync(handoffPath, `
Cause: The second fixture intentionally omitted its recovery metadata.
Recovery attempted: The missing evidence fields were added before retrying.
Result: Both failure blocks are independently complete.
Reusable lesson: Validate structured fields within each failure block.
`);
    assertOk(run(fixture.repo, ['session', 'checkpoint', '--reason', 'decision', '--session-id', 'multiple-failures']));
  } finally {
    fixture.cleanup();
  }
});

test('failed checkpoint push preserves the new commit, marks the session blocked, and does not switch branches', () => {
  const fixture = createRepo();
  try {
    git(fixture.repo, ['checkout', '-qb', 'session/push-fails']);
    assertOk(promote(fixture.repo, 'TASK-001', 'tech', 'planning', 'push-fails'));
    fs.appendFileSync(recapPath(fixture.repo, 'push-fails'), '\nDecision: Preserve failed-push evidence.\n');
    fs.appendFileSync(path.join(fixture.repo, 'docs', 'handoffs', 'TASK-001.md'), '\n[Session recap](../sessions/push-fails.md)\nDecision: Preserve failed-push evidence.\n');
    const before = git(fixture.repo, ['rev-parse', 'HEAD']);
    git(fixture.repo, ['remote', 'set-url', 'origin', path.join(fixture.parent, 'missing.git')]);
    const result = run(fixture.repo, ['session', 'checkpoint', '--reason', 'decision', '--session-id', 'push-fails']);
    assertFailed(result, /push|blocked/i);
    assert.notStrictEqual(git(fixture.repo, ['rev-parse', 'HEAD']), before);
    assert.strictEqual(git(fixture.repo, ['branch', '--show-current']), 'session/push-fails');
    assert.strictEqual(readSession(fixture.repo, 'push-fails').state, 'blocked');
  } finally {
    fixture.cleanup();
  }
});

test('checkpoint persists commit-before-push state and safely resumes without duplicate commits or milestones', () => {
  const fixture = createRepo();
  try {
    git(fixture.repo, ['checkout', '-qb', 'session/crash-resume']);
    assertOk(promote(fixture.repo, 'TASK-001', 'tech', 'planning', 'crash-resume'));
    fs.appendFileSync(recapPath(fixture.repo, 'crash-resume'), '\nDecision: Resume the exact preserved checkpoint commit.\n');
    fs.appendFileSync(path.join(fixture.repo, 'docs', 'handoffs', 'TASK-001.md'), '\n[Session recap](../sessions/crash-resume.md)\nDecision: Resume the exact preserved checkpoint commit.\n');
    const interrupted = run(
      fixture.repo,
      ['session', 'checkpoint', '--reason', 'decision', '--session-id', 'crash-resume'],
      { FB_SESSION_TEST_INTERRUPT_AFTER_CHECKPOINT_COMMIT: '1' }
    );
    assertFailed(interrupted, /interrupt|resume|pending/i);
    const preservedCommit = git(fixture.repo, ['rev-parse', 'HEAD']);
    const pending = readSession(fixture.repo, 'crash-resume').pendingCheckpoint;
    assert.strictEqual(pending.commit, preservedCommit);
    assert.throws(() => git(fixture.remote, ['rev-parse', 'refs/heads/session/crash-resume']));

    const resumed = run(fixture.repo, ['session', 'checkpoint', '--reason', 'decision', '--session-id', 'crash-resume']);
    assertOk(resumed);
    assert.strictEqual(git(fixture.repo, ['rev-parse', 'HEAD']), preservedCommit);
    assert.strictEqual(git(fixture.remote, ['rev-parse', 'refs/heads/session/crash-resume']), preservedCommit);
    const record = readSession(fixture.repo, 'crash-resume');
    assert.strictEqual(record.pendingCheckpoint, undefined);
    assert.strictEqual(record.milestones.filter(item => item.reason === 'decision' && item.commit === preservedCommit).length, 1);
  } finally {
    fixture.cleanup();
  }
});

test('submit and completed close require active execution, reciprocal evidence, passing Brief Validation, receipt, verification, and Test This Now', () => {
  const missing = createRepo();
  try {
    git(missing.repo, ['checkout', '-qb', 'session/no-session']);
    assertFailed(run(missing.repo, ['submit', 'TASK-001', '--no-tests']), /Automated checks are required before Ready to ship/);
  } finally {
    missing.cleanup();
  }

  const fixture = createRepo();
  try {
    const worktree = addWorktree(fixture, 'session/work');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'close-complete'));
    assertFailed(run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'close-complete']), /Brief Validation|Task Receipt|verification|Test This Now/i);
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 3;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: completed source']);
    const sourceCommit = git(worktree, ['rev-parse', '--short', 'HEAD']);
    appendEvidence(worktree, 'close-complete', 'TASK-001', sourceCommit);
    assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'close-complete']));
    const submit = run(worktree, ['submit', 'TASK-001']);
    assertOk(submit);
    assert.match(output(submit), /System verification: passed/);
    assert.match(output(submit), /Ready to ship\nAutomated checks passed\. Optional review links are available above\.\nSay \*\*Push Live\*\* to deploy\./);
    assert.doesNotMatch(output(submit), /merge|deploy(?:ed|ing)|release(?:d|ing)/i);
    const close = run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'close-complete']);
    assertOk(close);
    assert.strictEqual(readSession(worktree, 'close-complete').state, 'closed');
    assert.strictEqual(readSession(worktree, 'close-complete').outcome, 'completed');
    assertFailed(promote(worktree, 'TASK-999', 'tech', 'planning', 'close-complete'), /closed|reuse/i);
  } finally {
    fixture.cleanup();
  }
});

test('automated verification evidence is explicit, validated, candidate-bound, and coordination-reusable', () => {
  const fixture = createRepo();
  try {
    const worktree = addWorktree(fixture, 'session/automated-evidence');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'automated-evidence'));
    const registryPath = path.join(commonDir(worktree), 'fb-sessions', 'automated-evidence.json');
    const generic = readSession(worktree, 'automated-evidence');
    generic.milestones.push({ reason: 'verification', at: '2026-07-17T00:00:00.000Z', commit: git(worktree, ['rev-parse', 'HEAD']) });
    fs.writeFileSync(registryPath, `${JSON.stringify(generic, null, 2)}\n`);
    assert.strictEqual(submitVerificationReuse(worktree, 'TASK-001').reuse, false, 'generic verification milestones must not count');

    const baseCommit = git(worktree, ['rev-parse', 'HEAD']);
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 2;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: automated candidate']);
    const candidateCommit = git(worktree, ['rev-parse', 'HEAD']);
    const changedPaths = ['src/app.js'];
    const checkManifest = selectAutomatedChecks(changedPaths, worktree);
    const evidence = {
      status: 'passed',
      baseCommit,
      candidateCommit,
      checkedAt: '2026-07-17T00:00:00.000Z',
      checks: [{ id: 'project-test', result: 'passed' }],
      changedPaths,
      checkManifest,
      safetyGate: { result: 'not-applicable', approvalRef: '' },
      optionalLinks: [],
    };
    const stored = recordAutomatedVerification(worktree, 'TASK-001', evidence);
    assert.deepStrictEqual(stored.automatedVerification, evidence);
    assert.deepStrictEqual(readSession(worktree, 'automated-evidence').automatedVerification, evidence);
    assert.strictEqual(submitVerificationReuse(worktree, 'TASK-001').reuse, true);

    fs.appendFileSync(path.join(worktree, 'docs', 'handoffs', 'TASK-001.md'), '\nCoordination closeout only.\n');
    assert.strictEqual(submitVerificationReuse(worktree, 'TASK-001').reuse, true);
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 9;\n');
    assert.strictEqual(submitVerificationReuse(worktree, 'TASK-001').reuse, false);

    assert.throws(() => recordAutomatedVerification(worktree, 'TASK-001', { ...evidence, status: 'failed' }), /passed|evidence/i);
    assert.throws(() => recordAutomatedVerification(worktree, 'TASK-001', { ...evidence, candidateCommit: 'stale' }), /commit|evidence/i);
    assert.throws(() => recordAutomatedVerification(worktree, 'TASK-001', { ...evidence, checks: [{ id: 'project-test', result: 'failed' }] }), /passed|check/i);
    assert.throws(() => recordAutomatedVerification(worktree, 'TASK-001', { ...evidence, checks: [{ id: 'made-up-check', result: 'passed' }] }), /selected|manifest|check/i);
  } finally {
    fixture.cleanup();
  }
});

test('automated verification persistence enforces sensitive safety and reuse fails closed on ancestry or git status errors', () => {
  const fixture = createRepo([{ id: 'TASK-001', locks: 'auth/config.js' }]);
  try {
    const worktree = addWorktree(fixture, 'session/sensitive-evidence');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'sensitive-evidence'));
    const baseCommit = git(worktree, ['rev-parse', 'HEAD']);
    fs.mkdirSync(path.join(worktree, 'auth'));
    fs.writeFileSync(path.join(worktree, 'auth', 'config.js'), 'module.exports = true;\n');
    git(worktree, ['add', 'auth/config.js']);
    git(worktree, ['commit', '-qm', 'feat: sensitive auth fixture']);
    const candidateCommit = git(worktree, ['rev-parse', 'HEAD']);
    const changedPaths = ['auth/config.js'];
    const evidence = {
      status: 'passed', baseCommit, candidateCommit, checkedAt: '2026-07-17T00:00:00.000Z',
      checks: [{ id: 'project-test', result: 'passed' }],
      changedPaths, checkManifest: selectAutomatedChecks(changedPaths, worktree),
      safetyGate: { result: 'not-applicable', approvalRef: '' }, optionalLinks: [],
    };
    assert.throws(() => recordAutomatedVerification(worktree, 'TASK-001', evidence), /safety|sensitive/i);
    evidence.safetyGate = { result: 'passed', approvalRef: 'APPROVAL-001' };
    recordAutomatedVerification(worktree, 'TASK-001', evidence);
    assert.strictEqual(submitVerificationReuse(worktree, 'TASK-001').reuse, true);

    const unrelated = git(worktree, ['commit-tree', git(worktree, ['rev-parse', 'HEAD^{tree}']), '-m', 'unrelated candidate']);
    const registryPath = path.join(commonDir(worktree), 'fb-sessions', 'sensitive-evidence.json');
    const record = readSession(worktree, 'sensitive-evidence');
    record.automatedVerification.candidateCommit = unrelated;
    fs.writeFileSync(registryPath, `${JSON.stringify(record, null, 2)}\n`);
    assert.strictEqual(submitVerificationReuse(worktree, 'TASK-001').reuse, false, 'unrelated candidate history must not reuse');

    record.automatedVerification.candidateCommit = candidateCommit;
    fs.writeFileSync(registryPath, `${JSON.stringify(record, null, 2)}\n`);
    const indexPath = path.resolve(worktree, git(worktree, ['rev-parse', '--git-path', 'index']));
    const savedIndex = `${indexPath}.saved`;
    fs.renameSync(indexPath, savedIndex);
    fs.mkdirSync(indexPath);
    try {
      assert.strictEqual(submitVerificationReuse(worktree, 'TASK-001').reuse, false, 'git diff/status errors must fail closed');
    } finally {
      fs.rmSync(indexPath, { recursive: true, force: true });
      fs.renameSync(savedIndex, indexPath);
    }
  } finally {
    fixture.cleanup();
  }
});

test('automated evidence derives the complete multi-commit and merge-sensitive candidate range', () => {
  const fixture = createRepo([{ id: 'TASK-001', locks: 'src/app.js, auth/merge.js' }]);
  try {
    const worktree = addWorktree(fixture, 'session/range-evidence');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'range-evidence'));
    const baseCommit = git(worktree, ['rev-parse', 'HEAD']);
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 2;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: first range commit']);
    const lateRelatedBase = git(worktree, ['rev-parse', 'HEAD']);
    git(worktree, ['checkout', '-qb', 'range-sensitive', baseCommit]);
    fs.mkdirSync(path.join(worktree, 'auth'));
    fs.writeFileSync(path.join(worktree, 'auth', 'merge.js'), 'module.exports = true;\n');
    git(worktree, ['add', 'auth/merge.js']);
    git(worktree, ['commit', '-qm', 'feat: sensitive merge side']);
    git(worktree, ['checkout', 'session/range-evidence']);
    git(worktree, ['merge', '--no-ff', '-m', 'merge sensitive range', 'range-sensitive']);
    const candidateCommit = git(worktree, ['rev-parse', 'HEAD']);
    const changedPaths = ['auth/merge.js', 'src/app.js'];
    const evidence = {
      status: 'passed', baseCommit, candidateCommit, checkedAt: '2026-07-17T00:00:00.000Z',
      changedPaths, checkManifest: selectAutomatedChecks(changedPaths, worktree),
      checks: [{ id: 'project-test', result: 'passed' }],
      safetyGate: { result: 'passed', approvalRef: 'APPROVAL-MERGE-001' }, optionalLinks: [],
    };
    assert.doesNotThrow(() => recordAutomatedVerification(worktree, 'TASK-001', evidence));
    assert.throws(() => recordAutomatedVerification(worktree, 'TASK-001', { ...evidence, baseCommit: candidateCommit }), /authoritative|promotion|base/i);
    assert.throws(() => recordAutomatedVerification(worktree, 'TASK-001', {
      ...evidence,
      baseCommit: lateRelatedBase,
      changedPaths: ['auth/merge.js'],
      checkManifest: selectAutomatedChecks(['auth/merge.js'], worktree),
    }), /authoritative|promotion|base/i);
    assert.throws(() => recordAutomatedVerification(worktree, 'TASK-001', { ...evidence, baseCommit: '' }), /base/i);
    const unrelated = git(worktree, ['commit-tree', git(worktree, ['rev-parse', 'HEAD^{tree}']), '-m', 'unrelated base']);
    assert.throws(() => recordAutomatedVerification(worktree, 'TASK-001', { ...evidence, baseCommit: unrelated }), /ancestor|base/i);
    assert.throws(() => recordAutomatedVerification(worktree, 'TASK-001', { ...evidence, changedPaths: ['src/app.js'] }), /changed path|range/i);
    assert.throws(() => recordAutomatedVerification(worktree, 'TASK-001', {
      ...evidence, checkManifest: [{ id: 'project-test', command: 'npm', args: ['run', 'made-up'] }],
    }), /manifest/i);
  } finally {
    fixture.cleanup();
  }
});

test('completed session close rejects contradictory blocking eval lifecycle and accepts a coherent passed record', () => {
  const fixture = createRepo();
  try {
    const worktree = addWorktree(fixture, 'session/eval-close');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'eval-close'));
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 23;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: eval close fixture']);
    const sourceCommit = git(worktree, ['rev-parse', '--short', 'HEAD']);
    appendEvidence(worktree, 'eval-close', 'TASK-001', sourceCommit);
    addSelectedEvalEvidence(worktree, 'eval-close', 'TASK-001', 'fail');
    assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'eval-close']));
    assertFailed(run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'eval-close']), /Latest result|coherent|disposition/i);
    for (const file of [recapPath(worktree, 'eval-close'), path.join(worktree, 'docs', 'handoffs', 'TASK-001.md')]) {
      fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll('(blocking, fail,', '(blocking, pass,'));
    }
    fs.writeFileSync(path.join(worktree, 'docs', 'evals', 'session-close.md'), `### EVAL-HARNESS-CLOSE-001\n\n${blockingEvalRecord('pass')}`);
    assertOk(run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'eval-close']));
  } finally {
    fixture.cleanup();
  }
});

test('completed close and submit require a complete private-safe Quality Gap for an open subjective product Eval failure', () => {
  const fixture = createRepo();
  try {
    const worktree = addWorktree(fixture, 'session/product-gap-close');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'product-gap-close'));
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 34;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: product gap close fixture']);
    const sourceCommit = git(worktree, ['rev-parse', 'HEAD']);
    appendEvidence(worktree, 'product-gap-close', 'TASK-001', sourceCommit);
    addSelectedProductEvalEvidence(worktree, 'product-gap-close', 'TASK-001');
    assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'product-gap-close']));
    assertFailed(run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'product-gap-close']), /Checking.*Quality Gap|Quality Gap/i);
    assertFailed(run(worktree, ['submit', 'TASK-001']), /Checking.*Quality Gap|Quality Gap/i);
    const evalPath = path.join(worktree, 'docs', 'evals', 'product-close.md');
    fs.writeFileSync(evalPath, productQualityGapRecord(`Progress: Checking — product quality target missed

## Quality Gap

Eval ID: EVAL-PRODUCT-CLOSE-001
Gap status: open
What is insufficient: TODO
Failed quality dimension: output relevance and specificity
Good example: Ground the action in the ceramics launch.
Bad example: Improve engagement.
Responsible layer: Product
Next scoped revision: Ground each action in the supplied context.
Evidence required for the next candidate: Fresh original-scenario comparison.`));
    assertFailed(run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'product-gap-close']), /What is insufficient/i);
    fs.writeFileSync(evalPath, productQualityGapRecord(`Progress: Checking — product quality target missed

## Quality Gap

Eval ID: EVAL-PRODUCT-CLOSE-001
Gap status: open
What is insufficient: Private reasoning: hidden chain of thought.
Failed quality dimension: output relevance and specificity
Good example: Ground the action in the ceramics launch.
Bad example: Improve engagement.
Responsible layer: Product
Next scoped revision: Ground each action in the supplied context.
Evidence required for the next candidate: Fresh original-scenario comparison.`));
    assertFailed(run(worktree, ['submit', 'TASK-001']), /private|privacy|reasoning/i);
    fs.writeFileSync(evalPath, productQualityGapRecord(`Progress: Checking — product quality target missed

## Quality Gap

Eval ID: EVAL-PRODUCT-CLOSE-001
Gap status: open
What is insufficient: The functional candidate remains generic.
Failed quality dimension: output relevance and specificity
Good example: Ground the action in the ceramics launch.
Bad example: Improve engagement.
Responsible layer: Product
Next scoped revision: Ground each action in the supplied context.
Evidence required for the next candidate: Fresh original-scenario comparison.`));
    assertOk(run(worktree, ['submit', 'TASK-001']));
    assertOk(run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'product-gap-close']));
  } finally {
    fixture.cleanup();
  }
});

test('completed close and submit require complete actionable evidence from the canonical handoff only', () => {
  const missingCanonical = createRepo();
  try {
    const worktree = addWorktree(missingCanonical, 'session/canonical-missing');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'canonical-missing'));
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 31;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: canonical evidence fixture']);
    const sourceCommit = git(worktree, ['rev-parse', 'HEAD']);
    appendEvidence(worktree, 'canonical-missing', 'TASK-001', sourceCommit);
    assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'canonical-missing']));
    const handoffPath = path.join(worktree, 'docs', 'handoffs', 'TASK-001.md');
    const withoutReceipt = replaceSection(fs.readFileSync(handoffPath, 'utf8'), 'Task Receipt', '');
    fs.writeFileSync(handoffPath, withoutReceipt);
    assertFailed(
      run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'canonical-missing']),
      /canonical handoff|Task Receipt/i
    );
  } finally {
    missingCanonical.cleanup();
  }

  const placeholders = createRepo();
  try {
    const worktree = addWorktree(placeholders, 'session/canonical-placeholders');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'canonical-placeholders'));
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 32;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: placeholder evidence fixture']);
    const sourceCommit = git(worktree, ['rev-parse', 'HEAD']);
    appendEvidence(worktree, 'canonical-placeholders', 'TASK-001', sourceCommit);
    assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'canonical-placeholders']));
    const handoffPath = path.join(worktree, 'docs', 'handoffs', 'TASK-001.md');
    let markdown = fs.readFileSync(handoffPath, 'utf8');
    markdown = replaceSection(markdown, 'Task Receipt', `
Approved brief and decisions: Not recorded yet; completed closeout remains blocked.
Confirmed assumptions and approved scope changes: Not recorded yet; completed closeout remains blocked.
Branch, source commits, and changed surfaces: Not recorded yet; completed closeout remains blocked.
Checks, failures, recovery, and results: Not recorded yet; completed closeout remains blocked.
Review state, direct links, limits, and external gates: Not recorded yet; completed closeout remains blocked.
Repository state: Not recorded yet; completed closeout remains blocked.
Remaining owner and action: Not recorded yet; completed closeout remains blocked.
`);
    markdown = replaceSection(markdown, 'Brief Validation', `
Status: pass
Satisfied criteria and evidence: None
Missing criteria: None
Reason: None
Owner: None
Next action: None
Approved scope-change references: None
`);
    markdown = replaceSection(markdown, 'Verification Handoff', 'Placeholder evidence.');
    markdown = replaceSection(markdown, 'Test This Now', 'Placeholder evidence.');
    fs.writeFileSync(handoffPath, markdown);
    assertFailed(run(worktree, ['submit', 'TASK-001']), /Task Receipt|Brief Validation|Verification Handoff|Test This Now|actionable|placeholder/i);
  } finally {
    placeholders.cleanup();
  }
});

test('completed evidence accepts real prose containing example but rejects placeholder numbered steps', () => {
  const valid = createRepo();
  try {
    const worktree = addWorktree(valid, 'session/example-prose');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'example-prose'));
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 33;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: legitimate example prose fixture']);
    const sourceCommit = git(worktree, ['rev-parse', 'HEAD']);
    appendEvidence(worktree, 'example-prose', 'TASK-001', sourceCommit);
    const handoffPath = path.join(worktree, 'docs', 'handoffs', 'TASK-001.md');
    const handoffMarkdown = fs.readFileSync(handoffPath, 'utf8').replace(
      'Manual pass criteria: Product confirms only approved surfaces changed.',
      'Manual pass criteria: Product confirms the example fixture changes only approved surfaces.'
    );
    fs.writeFileSync(handoffPath, handoffMarkdown);
    assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'example-prose']));
    assertOk(run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'example-prose']));
  } finally {
    valid.cleanup();
  }

  for (const [label, sessionId, placeholderStep] of [
    ['example', 'step-a', '1. Example'],
    ['todo', 'step-b', '1. TODO'],
    ['tbd', 'step-c', '1. TBD'],
    ['prompt', 'step-d', '1. <describe the check>'],
  ]) {
    const fixture = createRepo();
    try {
      const worktree = addWorktree(fixture, `session/${sessionId}`);
      assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', sessionId));
      fs.writeFileSync(path.join(worktree, 'src', 'app.js'), `module.exports = '${label}';\n`);
      git(worktree, ['add', 'src/app.js']);
      git(worktree, ['commit', '-qm', `feat: ${label} step fixture`]);
      const sourceCommit = git(worktree, ['rev-parse', 'HEAD']);
      appendEvidence(worktree, sessionId, 'TASK-001', sourceCommit);
      assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', sessionId]));
      const handoffPath = path.join(worktree, 'docs', 'handoffs', 'TASK-001.md');
      const handoffMarkdown = fs.readFileSync(handoffPath, 'utf8').replace(
        '  1. Open the session recap and confirm the named source commit and checks are present.',
        `  ${placeholderStep}`
      );
      fs.writeFileSync(handoffPath, handoffMarkdown);
      assertFailed(
        run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', sessionId]),
        /Test This Now|numbered steps|placeholder|actionable/i
      );
      assert.strictEqual(readSession(worktree, sessionId).state, 'active');
    } finally {
      fixture.cleanup();
    }
  }
});

test('submit revalidates current board approval, locks, handoff, branch, and registered linked worktree', () => {
  const fixture = createRepo();
  try {
    const worktree = addWorktree(fixture, 'session/submit-authority');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'submit-authority'));
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 41;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: submit authority fixture']);
    const sourceCommit = git(worktree, ['rev-parse', 'HEAD']);
    appendEvidence(worktree, 'submit-authority', 'TASK-001', sourceCommit);
    assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'submit-authority']));

    const boardPath = path.join(worktree, 'PROJECT_BOARD.md');
    const originalBoard = fs.readFileSync(boardPath, 'utf8');
    fs.writeFileSync(boardPath, originalBoard.replace('| TASK-001 | In Progress |', '| TASK-001 | Staging QA |'));
    assertFailed(run(worktree, ['submit', 'TASK-001']), /In Progress|authoritative board|approval/i);
    fs.writeFileSync(boardPath, originalBoard.replace('**Approval**: approved', '**Approval**: pending'));
    assertFailed(run(worktree, ['submit', 'TASK-001']), /approved|approval/i);
    fs.writeFileSync(boardPath, originalBoard.replace('| src/app.js |', '| src/other.js |'));
    assertFailed(run(worktree, ['submit', 'TASK-001']), /lock|authoritative/i);
    fs.writeFileSync(boardPath, originalBoard);

    const handoffPath = path.join(worktree, 'docs', 'handoffs', 'TASK-001.md');
    const parkedHandoff = `${handoffPath}.parked`;
    fs.renameSync(handoffPath, parkedHandoff);
    assertFailed(run(worktree, ['submit', 'TASK-001']), /handoff/i);
    fs.renameSync(parkedHandoff, handoffPath);

    const sessionFilePath = sessionPath(worktree, 'submit-authority');
    const originalRecord = readSession(worktree, 'submit-authority');
    fs.writeFileSync(sessionFilePath, `${JSON.stringify({ ...originalRecord, worktree: fixture.repo }, null, 2)}\n`);
    assertFailed(run(worktree, ['submit', 'TASK-001']), /linked worktree|recorded worktree|registered/i);
    fs.writeFileSync(sessionFilePath, `${JSON.stringify(originalRecord, null, 2)}\n`);

    git(worktree, ['checkout', '-qb', 'session/submit-wrong-branch']);
    assertFailed(run(worktree, ['submit', 'TASK-001']), /session branch|recorded branch|branch/i);
  } finally {
    fixture.cleanup();
  }
});

test('CLI and MCP submit revalidate authority after pre-submit work before any submit mutation or push', async () => {
  for (const route of ['cli', 'mcp']) {
    const fixture = createRepo();
    try {
      const worktree = addWorktree(fixture, `session/submit-toctou-${route}`);
      const sessionId = `submit-toctou-${route}`;
      assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', sessionId));
      fs.writeFileSync(path.join(worktree, 'src', 'app.js'), `module.exports = '${route}';\n`);
      git(worktree, ['add', 'src/app.js']);
      git(worktree, ['commit', '-qm', `feat: ${route} submit TOCTOU fixture`]);
      const sourceCommit = git(worktree, ['rev-parse', 'HEAD']);
      appendEvidence(worktree, sessionId, 'TASK-001', sourceCommit);
      assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', sessionId]));
      installAuthorityChangingSubmitHook(worktree);

      const localHead = git(worktree, ['rev-parse', 'HEAD']);
      const remoteHead = git(fixture.remote, ['rev-parse', `refs/heads/session/submit-toctou-${route}`]);
      let message = '';
      if (route === 'cli') {
        const result = run(worktree, ['submit', 'TASK-001']);
        assertFailed(result, /In Progress|authoritative board|approval/i);
        message = output(result);
      } else {
        const result = await mcpCall(worktree, 'fb_lane_submit', {
          taskId: 'TASK-001',
          workspacePath: worktree,
        });
        assert.strictEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
        assert.ok(result.response?.error, `${result.stdout}\n${result.stderr}`);
        message = result.response.error.message;
        assert.match(message, /In Progress|authoritative board|approval/i);
      }

      assert.match(message, /In Progress|authoritative board|approval/i);
      assert.strictEqual(git(worktree, ['rev-parse', 'HEAD']), localHead, `${route} must not commit after authority drift`);
      assert.strictEqual(git(fixture.remote, ['rev-parse', `refs/heads/session/submit-toctou-${route}`]), remoteHead, `${route} must not push after authority drift`);
      const board = fs.readFileSync(path.join(worktree, 'PROJECT_BOARD.md'), 'utf8');
      assert.match(board, /\| TASK-001 \| Ready \|/);
      assert.doesNotMatch(board, /\| TASK-001 \| Staging QA \|/);
    } finally {
      fixture.cleanup();
    }
  }
});

test('CLI submit holds the session lifecycle boundary through board commit and push before close proceeds', async () => {
  const fixture = createRepo();
  try {
    const worktree = addWorktree(fixture, 'session/submit-close-serialized');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'submit-close-serialized'));
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 61;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: submit close serialization fixture']);
    const sourceCommit = git(worktree, ['rev-parse', 'HEAD']);
    appendEvidence(worktree, 'submit-close-serialized', 'TASK-001', sourceCommit);
    assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'submit-close-serialized']));

    const gate = path.join(fixture.parent, 'submit-close-gate');
    const submitPromise = spawnRun(worktree, ['submit', 'TASK-001'], { FB_SESSION_TEST_LIFECYCLE_GATE: gate });
    await waitForPath(path.join(gate, 'started'));
    let closeSettled = false;
    const closePromise = spawnRun(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'submit-close-serialized'])
      .then(result => { closeSettled = true; return result; });
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.strictEqual(closeSettled, false, 'close must wait while submit owns the session lifecycle transaction');
    fs.writeFileSync(path.join(gate, 'release'), 'release\n');

    assertOk(await submitPromise);
    assertOk(await closePromise);
    assert.strictEqual(readSession(worktree, 'submit-close-serialized').state, 'closed');
    assert.match(fs.readFileSync(path.join(worktree, 'PROJECT_BOARD.md'), 'utf8'), /\| TASK-001 \| Staging QA \|/);
    assert.strictEqual(git(fixture.remote, ['rev-parse', 'refs/heads/session/submit-close-serialized']), git(worktree, ['rev-parse', 'HEAD']));
  } finally {
    fixture.cleanup();
  }
});

test('MCP submit commits and pushes before a competing blocking checkpoint proceeds', async () => {
  const fixture = createRepo();
  try {
    const worktree = addWorktree(fixture, 'session/submit-blocked-serialized');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'submit-blocked-serialized'));
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 62;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: submit blocked serialization fixture']);
    const sourceCommit = git(worktree, ['rev-parse', 'HEAD']);
    appendEvidence(worktree, 'submit-blocked-serialized', 'TASK-001', sourceCommit);
    assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'submit-blocked-serialized']));
    fs.appendFileSync(recapPath(worktree, 'submit-blocked-serialized'), '\n## Blocking Investigation\n\nBlocker: The deterministic provider fixture is unavailable.\nNext action: Product restores the provider fixture and reruns the original check.\n');
    fs.appendFileSync(path.join(worktree, 'docs', 'handoffs', 'TASK-001.md'), '\n## Blocking Investigation\n\nThe provider fixture failure is recorded in the linked session recap.\n');

    const gate = path.join(fixture.parent, 'submit-blocked-gate');
    const submitPromise = mcpCall(worktree, 'fb_lane_submit', {
      taskId: 'TASK-001',
      workspacePath: worktree,
    }, { FB_SESSION_TEST_LIFECYCLE_GATE: gate });
    await waitForPath(path.join(gate, 'started'));
    let checkpointSettled = false;
    const checkpointPromise = spawnRun(worktree, ['session', 'checkpoint', '--reason', 'blocked', '--session-id', 'submit-blocked-serialized'])
      .then(result => { checkpointSettled = true; return result; });
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.strictEqual(checkpointSettled, false, 'checkpoint must wait while submit owns the session lifecycle transaction');
    fs.writeFileSync(path.join(gate, 'release'), 'release\n');

    const submitted = await submitPromise;
    assert.strictEqual(submitted.status, 0, `${submitted.stdout}\n${submitted.stderr}`);
    assert.ok(submitted.response?.result && !submitted.response.error, JSON.stringify(submitted.response));
    const message = submitted.response.result.content[0].text;
    assert.match(message, /System verification: passed/);
    assert.match(message, /Ready to ship\nAutomated checks passed\. Optional review links are available above\.\nSay \*\*Push Live\*\* to deploy\./);
    assert.doesNotMatch(message, /merge|deploy(?:ed|ing)|release(?:d|ing)/i);
    assertOk(await checkpointPromise);
    const log = git(worktree, ['log', '--format=%H%x09%s', '-5']);
    const submitCommit = log.split('\n').find(line => line.endsWith('docs: submit TASK-001 for staging qa'))?.split('\t')[0];
    const checkpointCommit = log.split('\n').find(line => line.endsWith('docs(session): submit-blocked-serialized blocked checkpoint'))?.split('\t')[0];
    assert.ok(submitCommit && checkpointCommit, log);
    git(worktree, ['merge-base', '--is-ancestor', submitCommit, checkpointCommit]);
    assert.strictEqual(readSession(worktree, 'submit-blocked-serialized').state, 'blocked');
    assert.match(fs.readFileSync(path.join(worktree, 'PROJECT_BOARD.md'), 'utf8'), /\| TASK-001 \| Staging QA \|/);
    assert.strictEqual(git(fixture.remote, ['rev-parse', 'refs/heads/session/submit-blocked-serialized']), checkpointCommit);
  } finally {
    fixture.cleanup();
  }
});

test('a close that wins the lifecycle lock makes CLI and MCP submit fail before board mutation or push', async () => {
  for (const route of ['cli', 'mcp']) {
    const fixture = createRepo();
    try {
      const sessionId = `close-wins-submit-${route}`;
      const worktree = addWorktree(fixture, `session/${sessionId}`);
      assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', sessionId));
      fs.writeFileSync(path.join(worktree, 'src', 'app.js'), `module.exports = 'close-wins-${route}';\n`);
      git(worktree, ['add', 'src/app.js']);
      git(worktree, ['commit', '-qm', `feat: close wins ${route} submit fixture`]);
      const sourceCommit = git(worktree, ['rev-parse', 'HEAD']);
      appendEvidence(worktree, sessionId, 'TASK-001', sourceCommit);
      assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', sessionId]));
      const localHead = git(worktree, ['rev-parse', 'HEAD']);
      const remoteHead = git(fixture.remote, ['rev-parse', `refs/heads/session/${sessionId}`]);

      const gate = path.join(fixture.parent, `${sessionId}-gate`);
      const closePromise = spawnRun(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', sessionId], { FB_SESSION_TEST_LIFECYCLE_GATE: gate });
      await waitForPath(path.join(gate, 'started'));
      let submitSettled = false;
      const submitPromise = (route === 'cli'
        ? spawnRun(worktree, ['submit', 'TASK-001'])
        : mcpCall(worktree, 'fb_lane_submit', { taskId: 'TASK-001', workspacePath: worktree }))
        .then(result => { submitSettled = true; return result; });
      await new Promise(resolve => setTimeout(resolve, 100));
      assert.strictEqual(submitSettled, false, `${route} submit must wait while close owns the session lifecycle transaction`);
      fs.writeFileSync(path.join(gate, 'release'), 'release\n');

      assertOk(await closePromise);
      const submitted = await submitPromise;
      if (route === 'cli') {
        assertFailed(submitted, /one active execution session|active execution session/i);
      } else {
        assert.ok(submitted.response?.error, JSON.stringify(submitted.response));
        assert.match(submitted.response.error.message, /one active execution session|active execution session/i);
      }
      assert.strictEqual(git(worktree, ['rev-parse', 'HEAD']), localHead);
      assert.strictEqual(git(fixture.remote, ['rev-parse', `refs/heads/session/${sessionId}`]), remoteHead);
      assert.match(fs.readFileSync(path.join(worktree, 'PROJECT_BOARD.md'), 'utf8'), /\| TASK-001 \| In Progress \|/);
    } finally {
      fixture.cleanup();
    }
  }
});

test('completed execution close revalidates current board, lock, branch, and worktree authority before closing', () => {
  const fixture = createRepo();
  try {
    const worktree = addWorktree(fixture, 'session/close-authority');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'close-authority'));
    fs.writeFileSync(path.join(worktree, 'src', 'app.js'), 'module.exports = 51;\n');
    git(worktree, ['add', 'src/app.js']);
    git(worktree, ['commit', '-qm', 'feat: close authority fixture']);
    const sourceCommit = git(worktree, ['rev-parse', 'HEAD']);
    appendEvidence(worktree, 'close-authority', 'TASK-001', sourceCommit);
    assertOk(run(worktree, ['session', 'checkpoint', '--reason', 'verification', '--session-id', 'close-authority']));

    const boardPath = path.join(worktree, 'PROJECT_BOARD.md');
    const board = fs.readFileSync(boardPath, 'utf8');
    fs.writeFileSync(boardPath, board.replace('| TASK-001 | In Progress |', '| TASK-001 | Ready |'));
    assertFailed(
      run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'close-authority']),
      /In Progress|authoritative board|approval/i
    );
    assert.strictEqual(readSession(worktree, 'close-authority').state, 'active');
    fs.writeFileSync(boardPath, board.replace('| src/app.js |', '| src/other.js |'));
    assertFailed(
      run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'close-authority']),
      /lock|authoritative board/i
    );
    assert.strictEqual(readSession(worktree, 'close-authority').state, 'active');
    fs.writeFileSync(boardPath, board);

    const sessionFilePath = sessionPath(worktree, 'close-authority');
    const record = readSession(worktree, 'close-authority');
    fs.writeFileSync(sessionFilePath, `${JSON.stringify({ ...record, worktree: fixture.repo }, null, 2)}\n`);
    assertFailed(
      run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'close-authority']),
      /linked worktree|recorded worktree|registered/i
    );
    assert.strictEqual(readSession(worktree, 'close-authority').state, 'active');
    fs.writeFileSync(sessionFilePath, `${JSON.stringify(record, null, 2)}\n`);

    git(worktree, ['checkout', '-qb', 'session/close-wrong-branch']);
    assertFailed(
      run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'close-authority']),
      /session branch|recorded branch|branch/i
    );
    assert.strictEqual(readSession(worktree, 'close-authority').state, 'active');
  } finally {
    fixture.cleanup();
  }
});

test('blocked and deferred close require blocked validation plus a concrete reason, owner, and next action', () => {
  for (const outcomeName of ['blocked', 'deferred']) {
    const fixture = createRepo();
    try {
      git(fixture.repo, ['checkout', '-qb', `session/${outcomeName}`]);
      const id = `close-${outcomeName}`;
      assertOk(promote(fixture.repo, 'TASK-001', 'business', 'planning', id));
      assertFailed(
        run(fixture.repo, ['session', 'close', '--outcome', outcomeName, '--session-id', id]),
        /concrete (Reason|Owner|Next action)|close requires/i
      );
      const commit = git(fixture.repo, ['rev-parse', '--short', 'HEAD']);
      appendEvidence(fixture.repo, id, 'TASK-001', commit, 'blocked');
      const closed = run(fixture.repo, ['session', 'close', '--outcome', outcomeName, '--session-id', id]);
      assertOk(closed);
      assert.strictEqual(readSession(fixture.repo, id).outcome, outcomeName);
    } finally {
      fixture.cleanup();
    }
  }
});

test('recall searches only curated FB records, rejects private data, and emits deterministic full-SHA citations', () => {
  const fixture = createRepo();
  try {
    git(fixture.repo, ['checkout', '-qb', 'knowledge/branch']);
    fs.mkdirSync(path.join(fixture.repo, 'docs', 'knowledge'), { recursive: true });
    fs.writeFileSync(path.join(fixture.repo, 'docs', 'knowledge', 'note.md'), '# Ordinary note\n\nUncurated needle must stay hidden.\n');
    fs.writeFileSync(path.join(fixture.repo, 'docs', 'handoffs', 'TASK-RECALL.md'), `---
type: fb-lane-handoff
task: TASK-RECALL
---

# Curated recall handoff

Needle phrase for recall.
`);
    fs.writeFileSync(path.join(fixture.repo, 'docs', 'handoffs', 'TASK-SECRET.md'), `---
type: fb-lane-handoff
task: TASK-SECRET
---

# Unsafe recall handoff

Leaky needle API_TOKEN=super-secret-value
`);
    git(fixture.repo, ['add', 'docs/knowledge/note.md', 'docs/handoffs/TASK-RECALL.md', 'docs/handoffs/TASK-SECRET.md']);
    git(fixture.repo, ['commit', '-qm', 'docs: add recall fixtures']);
    const commit = git(fixture.repo, ['rev-parse', 'HEAD']);
    git(fixture.repo, ['push', '-q', '-u', 'origin', 'knowledge/branch']);
    git(fixture.repo, ['checkout', '-q', 'main']);
    const headOnly = run(fixture.repo, ['session', 'recall', 'Needle phrase']);
    assertFailed(headOnly, /no committed curated Markdown|no matches/i);
    const allRefs = run(fixture.repo, ['session', 'recall', 'Needle phrase', '--all-refs']);
    assertOk(allRefs);
    assert.match(allRefs.stdout, /docs\/handoffs\/TASK-RECALL\.md#L8/);
    assert.match(allRefs.stdout, /refs\/remotes\/origin\/knowledge\/branch/);
    assert.match(allRefs.stdout, new RegExp(commit));
    assert.match(allRefs.stdout, /Needle phrase for recall\./);
    assertFailed(run(fixture.repo, ['session', 'recall', 'Uncurated needle', '--all-refs']), /no committed curated Markdown|no matches/i);
    assertFailed(run(fixture.repo, ['session', 'recall', 'Leaky needle', '--all-refs']), /privacy|secret|no committed curated Markdown|no matches/i);
  } finally {
    fixture.cleanup();
  }
});

test('review writes a paste-ready Markdown packet without tracked files and makes clipboard failure actionable', () => {
  const fixture = createRepo();
  try {
    git(fixture.repo, ['checkout', '-qb', 'session/review-source']);
    assertOk(promote(fixture.repo, 'TASK-001', 'design', 'review', 'review-1'));
    fs.writeFileSync(path.join(fixture.repo, 'src', 'app.js'), 'module.exports = 4;\n');
    git(fixture.repo, ['add', 'src/app.js']);
    git(fixture.repo, ['commit', '-qm', 'feat: review source']);
    const before = git(fixture.repo, ['status', '--porcelain']);
    const successOutput = [];
    const originalLog = console.log;
    try {
      console.log = (...values) => successOutput.push(values.join(' '));
      runSessionCommand(['review', 'HEAD', '--session-id', 'review-1'], {
        cwd: fixture.repo,
        env: cleanEnv,
        copyToClipboard: () => true,
      });
    } finally {
      console.log = originalLog;
    }
    assert.match(successOutput.join('\n'), /^# FB Session Review/m);
    assert.match(successOutput.join('\n'), /src\/app\.js/);
    assert.strictEqual(git(fixture.repo, ['status', '--porcelain']), before);
    assert.strictEqual(readSession(fixture.repo, 'review-1').state, 'reviewing');

    const failureOutput = [];
    try {
      console.log = (...values) => failureOutput.push(values.join(' '));
      assert.throws(() => runSessionCommand(['review', 'HEAD', '--session-id', 'review-1'], {
        cwd: fixture.repo,
        env: cleanEnv,
        copyToClipboard: () => false,
      }), /clipboard.*failed|failed.*clipboard/i);
    } finally {
      console.log = originalLog;
    }
    assert.match(failureOutput.join('\n'), /^# FB Session Review/m);
    assert.match(failureOutput.join('\n'), /src\/app\.js/);
    assert.strictEqual(git(fixture.repo, ['status', '--porcelain']), before);
  } finally {
    fixture.cleanup();
  }
});

test('doctor verifies execution worktree registration/branch and the bundled MCP server route', () => {
  const executionFixture = createRepo();
  try {
    const worktree = addWorktree(executionFixture, 'session/doctor-worktree');
    assertOk(promote(worktree, 'TASK-001', 'tech', 'execution', 'doctor-worktree'));
    const recordPath = sessionPath(worktree, 'doctor-worktree');
    const record = readSession(worktree, 'doctor-worktree');
    fs.writeFileSync(recordPath, `${JSON.stringify({ ...record, worktree: executionFixture.repo }, null, 2)}\n`);
    const location = collectSessionDoctorChecks(executionFixture.repo).find(check => check.label === 'Session branch/worktree requirements');
    assert.strictEqual(location.level, 'fail', JSON.stringify(location));
    assert.match(location.detail, /worktree|branch|registered/i);
  } finally {
    executionFixture.cleanup();
  }

  const pluginFixture = createRepo();
  try {
    const pluginRoot = path.join(pluginFixture.repo, 'plugins', 'fb-lane-coordination');
    fs.mkdirSync(path.join(pluginRoot, '.codex-plugin'), { recursive: true });
    fs.mkdirSync(path.join(pluginRoot, 'tools'), { recursive: true });
    fs.writeFileSync(path.join(pluginRoot, '.codex-plugin', 'plugin.json'), `${JSON.stringify({ mcpServers: './.mcp.json' }, null, 2)}\n`);
    fs.writeFileSync(path.join(pluginRoot, '.mcp.json'), `${JSON.stringify({
      mcpServers: { 'fb-lane': { command: 'node', args: ['./tools/missing-server.cjs', 'mcp'], cwd: '.' } },
    }, null, 2)}\n`);
    fs.writeFileSync(path.join(pluginRoot, 'tools', 'fb-session.cjs'), '// A decoy file must not make doctor pass.\n');
    const server = collectSessionDoctorChecks(pluginFixture.repo).find(check => check.label === 'Plugin session server resolution');
    assert.strictEqual(server.level, 'fail', JSON.stringify(server));
    assert.match(server.detail, /configuration|missing-server|resolve|tool/i);
  } finally {
    pluginFixture.cleanup();
  }
});

test('bootstrap preserves project-owned instructions and installs seven structurally complete pages', () => {
  const fixture = createRepo();
  try {
    const bootstrap = run(fixture.repo, ['bootstrap', '--platform', 'codex']);
    assertOk(bootstrap);
    assert.match(fs.readFileSync(path.join(fixture.repo, 'AGENTS.md'), 'utf8'), /Keep this sentence\./);
    for (const page of ['README.md', 'start.md', 'workflow.md', 'evidence.md', 'guardrails.md', 'sessions.md', 'evals.md']) {
      assert.strictEqual(
        fs.readFileSync(path.join(fixture.repo, 'docs', 'fb', page), 'utf8'),
        fs.readFileSync(path.join(rootDir, 'docs', 'fb', page), 'utf8')
      );
      assert.match(fs.readFileSync(path.join(fixture.repo, 'docs', 'fb', page), 'utf8'), /^#\s+\S/m);
    }
    const parity = collectSessionDoctorChecks(rootDir).find(check => check.label === 'Package synchronization authority');
    assert.strictEqual(parity.level, 'ok', JSON.stringify(parity));
    assert.match(parity.detail, /fb-package-sync --check/i);
  } finally {
    fixture.cleanup();
  }
});

test('claim and quick execute linked worktrees by default while --no-worktree executes the compatibility path', () => {
  const claimFixture = createRepo([{ id: 'TASK-001', status: 'Ready', locks: 'src/app.js' }]);
  try {
    const claimed = run(claimFixture.repo, ['claim', 'TASK-001', 'Tech', 'src/app.js']);
    assertOk(claimed);
    const claimedPath = path.join(claimFixture.repo, '.worktrees', 'tech-TASK-001-scope-for-task-001');
    assert.ok(fs.existsSync(claimedPath));
    assert.strictEqual(git(claimedPath, ['branch', '--show-current']), 'tech/TASK-001-scope-for-task-001');
    const registeredClaimPath = fs.realpathSync(claimedPath);
    assert.match(git(claimFixture.repo, ['worktree', 'list', '--porcelain']), new RegExp(`worktree ${registeredClaimPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.match(fs.readFileSync(path.join(claimedPath, 'PROJECT_BOARD.md'), 'utf8'), /\| TASK-001 \| In Progress \| FB-Tech \|/);
  } finally {
    claimFixture.cleanup();
  }

  const reuseFixture = createRepo([{ id: 'TASK-001', status: 'Ready', locks: 'src/app.js' }]);
  try {
    const branch = 'tech/TASK-001-scope-for-task-001';
    const existing = path.join(reuseFixture.repo, '.worktrees', 'existing-task-001');
    fs.mkdirSync(path.dirname(existing), { recursive: true });
    git(reuseFixture.repo, ['worktree', 'add', '-b', branch, existing, 'main']);
    const claimed = run(reuseFixture.repo, ['claim', 'TASK-001', 'Tech', 'src/app.js']);
    assertOk(claimed);
    assert.match(claimed.stdout, /Reusing matching worktree/);
    assert.match(claimed.stdout, new RegExp(existing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.strictEqual(git(reuseFixture.repo, ['worktree', 'list', '--porcelain']).match(/^worktree /gm).length, 2);
  } finally {
    reuseFixture.cleanup();
  }

  const quickFixture = createRepo();
  try {
    const boardBefore = fs.readFileSync(path.join(quickFixture.repo, 'PROJECT_BOARD.md'), 'utf8');
    const indexBefore = fs.readFileSync(path.join(quickFixture.repo, 'docs', 'handoffs', 'index.md'), 'utf8');
    const quick = run(quickFixture.repo, ['quick', 'Tech', 'src/quick.js', 'Real quick worktree', '--approval-ref', 'USER-APPROVAL-001']);
    assertOk(quick);
    const branch = /Branch:\s+(quick\/TASK-Q-\d+-real-quick-worktree)/.exec(quick.stdout)?.[1];
    const worktree = /Worktree:\s+([^\n]+)/.exec(quick.stdout)?.[1]?.trim();
    assert.ok(branch && worktree, output(quick));
    assert.ok(fs.existsSync(worktree));
    assert.ok(fs.realpathSync(worktree).startsWith(path.join(fs.realpathSync(quickFixture.repo), '.worktrees') + path.sep));
    assert.strictEqual(git(worktree, ['branch', '--show-current']), branch);
    const registeredQuickPath = fs.realpathSync(worktree);
    assert.match(git(quickFixture.repo, ['worktree', 'list', '--porcelain']), new RegExp(`worktree ${registeredQuickPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    const taskId = /TASK-Q-\d+/.exec(branch)?.[0];
    const record = path.join(worktree, 'docs', 'handoffs', `${taskId}.md`);
    const primaryRecord = path.join(quickFixture.repo, 'docs', 'handoffs', `${taskId}.md`);
    assert.ok(fs.existsSync(record));
    assert.ok(!fs.existsSync(primaryRecord), 'default Quick Record must never be created in the primary checkout');
    assert.match(fs.readFileSync(record, 'utf8'), /mode: Quick BFM/i);
    assert.match(fs.readFileSync(record, 'utf8'), /^Review required: yes$/mi);
    assert.match(fs.readFileSync(record, 'utf8'), /^Approval reference: USER-APPROVAL-001$/mi);
    fs.writeFileSync(path.join(worktree, 'src', 'quick.js'), 'module.exports = "runtime quick fixture";\n');
    assert.strictEqual(fs.readFileSync(path.join(worktree, 'PROJECT_BOARD.md'), 'utf8'), boardBefore);
    assert.strictEqual(fs.readFileSync(path.join(worktree, 'docs', 'handoffs', 'index.md'), 'utf8'), indexBefore);
    assert.ok(!fs.existsSync(path.join(worktree, 'docs', 'sessions')));
    const status = run(worktree, ['status']);
    assertOk(status);
    assert.match(status.stdout, /Working mode: Quick BFM/);

    const ready = fs.readFileSync(record, 'utf8')
      .replace('Reviewer: pending', 'Reviewer: FB-Product')
      .replace('Reviewer decision: pending', 'Reviewer decision: approved')
      .replace('Focused evidence: pending', 'Focused evidence: focused quick test passed')
      .replace('Reviewers: 0', 'Reviewers: 1');
    for (const invalidDecision of [
      ready.replace('Reviewer decision: approved', 'Reviewer decision: pending'),
      ready.replace('Reviewer decision: approved', 'Reviewer decision: rejected'),
      ready.replace(/^Reviewer decision: approved\n/m, ''),
    ]) {
      fs.writeFileSync(record, invalidDecision);
      const blockedDecision = run(worktree, ['submit', taskId]);
      assertFailed(blockedDecision, /Reviewer decision|approved/i);
      assert.match(fs.readFileSync(record, 'utf8'), /Status: in-progress/);
    }
    const overBudget = ready.replace('Agent iterations: 1', 'Agent iterations: 6');
    fs.writeFileSync(record, overBudget);
    const blockedSubmit = run(worktree, ['submit', taskId]);
    assertFailed(blockedSubmit, /sixth|iteration|budget/i);
    assert.match(fs.readFileSync(record, 'utf8'), /Status: in-progress/);
    fs.writeFileSync(record, ready);
    const submitted = run(worktree, ['submit', taskId]);
    assertOk(submitted);
    assert.match(fs.readFileSync(record, 'utf8'), /Status: complete/);
    assert.strictEqual(fs.readFileSync(path.join(worktree, 'PROJECT_BOARD.md'), 'utf8'), boardBefore);
    const merge = spawnSync('git', ['merge', '--no-commit', '--no-ff', branch], {
      cwd: quickFixture.repo,
      encoding: 'utf8',
    });
    assert.strictEqual(merge.status, 0, `Quick closeout must merge without add/add conflict:\n${output(merge)}`);
    git(quickFixture.repo, ['merge', '--abort']);

  } finally {
    quickFixture.cleanup();
  }

  const docsQuickFixture = createRepo();
  try {
    const docsQuick = run(docsQuickFixture.repo, ['quick', 'Tech', 'docs/fb/workflow.md', 'Correct workflow wording', '--approval-ref', 'USER-APPROVAL-003']);
    assertOk(docsQuick);
    const docsWorktree = /Worktree:\s+([^\n]+)/.exec(docsQuick.stdout)?.[1]?.trim();
    const docsTaskId = /TASK-Q-\d+/.exec(docsQuick.stdout)?.[0];
    const docsRecord = path.join(docsWorktree, 'docs', 'handoffs', `${docsTaskId}.md`);
    const docsReady = fs.readFileSync(docsRecord, 'utf8')
      .replace('Focused evidence: pending', 'Focused evidence: documentation contract passed');
    assert.match(docsReady, /^Review required: no$/mi);
    assert.match(docsReady, /^Reviewer: not required$/mi);
    assert.match(docsReady, /^Reviewer decision: not required$/mi);
    assert.match(docsReady, /^Reviewers: 0$/mi);
    fs.writeFileSync(docsRecord, docsReady);
    const docsSubmitted = run(docsWorktree, ['submit', docsTaskId]);
    assertOk(docsSubmitted);
    assert.match(fs.readFileSync(docsRecord, 'utf8'), /Status: complete/);
  } finally {
    docsQuickFixture.cleanup();
  }

  for (const command of [
    ['claim', 'TASK-001', 'Tech', 'src/app.js', '--no-worktree'],
    ['quick', 'Tech', 'src/quick.js', 'Compatibility path', '--approval-ref', 'USER-APPROVAL-002', '--no-worktree'],
  ]) {
    const fixture = command[0] === 'claim'
      ? createRepo([{ id: 'TASK-001', status: 'Ready', locks: 'src/app.js' }])
      : createRepo();
    try {
      const result = run(fixture.repo, command);
      assertOk(result);
      assert.strictEqual(git(fixture.repo, ['worktree', 'list', '--porcelain']).split(/\n(?=worktree )/).length, 1);
      assert.notStrictEqual(git(fixture.repo, ['branch', '--show-current']), 'main');
    } finally {
      fixture.cleanup();
    }
  }
});

test('public quick requires concrete approval evidence before any write', () => {
  for (const approvalArgs of [[], ['--approval-ref'], ['--approval-ref', 'pending'], ['--approval-ref', 'unverified']]) {
    const fixture = createRepo();
    try {
      const beforeHead = git(fixture.repo, ['rev-parse', 'HEAD']);
      const beforeBoard = fs.readFileSync(path.join(fixture.repo, 'PROJECT_BOARD.md'), 'utf8');
      const beforeHandoffs = fs.readdirSync(path.join(fixture.repo, 'docs', 'handoffs')).sort();
      const result = run(fixture.repo, ['quick', 'Tech', 'src/quick.js', 'Correct copy', ...approvalArgs, '--no-worktree']);
      assertFailed(result, /approval|reference/i);
      assert.strictEqual(git(fixture.repo, ['rev-parse', 'HEAD']), beforeHead);
      assert.strictEqual(git(fixture.repo, ['branch', '--show-current']), 'main');
      assert.strictEqual(fs.readFileSync(path.join(fixture.repo, 'PROJECT_BOARD.md'), 'utf8'), beforeBoard);
      assert.deepStrictEqual(fs.readdirSync(path.join(fixture.repo, 'docs', 'handoffs')).sort(), beforeHandoffs);
    } finally {
      fixture.cleanup();
    }
  }
});

test('public quick rejects Full-BFM risks and lock conflicts before any write', () => {
  const cases = [
    ['feature correction'], ['coordinate lanes'], ['multi-lane correction'],
    ['authentication correction'], ['authorization correction'], ['privacy correction'],
    ['private data correction'], ['analytics correction'], ['payment correction'],
    ['secret rotation'], ['destructive correction'], ['delete production data'],
    ['provider correction'], ['provider state correction'], ['release correction'],
    ['live-release correction'], ['deployment correction'], ['publication correction'],
    ['publish externally'], ['launch correction'], ['OKR correction'],
    ['production migration correction'], ['external approval correction'],
    ['material architecture correction'], ['core flow correction'],
    ['core product flow correction'], ['multiple owner correction'],
    ['multiple repositories correction'], ['conflicting locks correction'],
    ['unresolved decision correction'], [],
  ];
  for (const scope of cases) {
    const fixture = createRepo();
    try {
      const beforeHead = git(fixture.repo, ['rev-parse', 'HEAD']);
      const beforeBoard = fs.readFileSync(path.join(fixture.repo, 'PROJECT_BOARD.md'), 'utf8');
      const beforeHandoffs = fs.readdirSync(path.join(fixture.repo, 'docs', 'handoffs')).sort();
      const result = run(fixture.repo, ['quick', 'Tech', 'src/quick.js', ...scope, '--approval-ref', 'USER-APPROVAL-003', '--no-worktree']);
      assertFailed(result, /Full BFM|cannot use quick|unclear/i);
      assert.strictEqual(git(fixture.repo, ['rev-parse', 'HEAD']), beforeHead);
      assert.strictEqual(git(fixture.repo, ['branch', '--show-current']), 'main');
      assert.strictEqual(fs.readFileSync(path.join(fixture.repo, 'PROJECT_BOARD.md'), 'utf8'), beforeBoard);
      assert.deepStrictEqual(fs.readdirSync(path.join(fixture.repo, 'docs', 'handoffs')).sort(), beforeHandoffs);
    } finally {
      fixture.cleanup();
    }
  }

  const conflict = createRepo([{ id: 'TASK-001', status: 'In Progress', locks: 'src/quick.js' }]);
  try {
    const beforeHead = git(conflict.repo, ['rev-parse', 'HEAD']);
    const result = run(conflict.repo, ['quick', 'Tech', 'src/quick.js', 'Correct copy', '--approval-ref', 'USER-APPROVAL-004', '--no-worktree']);
    assertFailed(result, /lock|Full BFM/i);
    assert.strictEqual(git(conflict.repo, ['rev-parse', 'HEAD']), beforeHead);
    assert.deepStrictEqual(fs.readdirSync(path.join(conflict.repo, 'docs', 'handoffs')).sort(), ['TASK-001.md', 'index.md']);
  } finally {
    conflict.cleanup();
  }
});

test('project-owned preflight stops claim before board or worktree mutation', () => {
  const fixture = createRepo([{ id: 'TASK-001', status: 'Ready', locks: 'src/app.js' }]);
  try {
    fs.writeFileSync(path.join(fixture.repo, '.fb-lane.json'), JSON.stringify({
      hooks: { preflight: `${JSON.stringify(process.execPath)} -e "process.exit(7)"` },
    }));
    const before = fs.readFileSync(path.join(fixture.repo, 'PROJECT_BOARD.md'), 'utf8');
    const result = run(fixture.repo, ['claim', 'TASK-001', 'Tech', 'src/app.js']);
    assertFailed(result, /Hook preflight failed/i);
    assert.strictEqual(fs.readFileSync(path.join(fixture.repo, 'PROJECT_BOARD.md'), 'utf8'), before);
    assert.strictEqual(git(fixture.repo, ['worktree', 'list', '--porcelain']).match(/^worktree /gm).length, 1);
  } finally {
    fixture.cleanup();
  }
});

test('public session behavior is identical through the packaged CLI', () => {
  const fixture = createRepo();
  try {
    const result = run(fixture.repo, ['session', 'intake', '--session-id', 'package-intake'], {}, packageCliPath);
    assertOk(result);
    assert.match(result.stdout, /package-intake/);
  } finally {
    fixture.cleanup();
  }
});

(async () => {
  for (const [name, fn] of tests) {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  }
  console.log(`\n✅ ${passed} focused session checks passed.`);
})().catch(err => {
  console.error(`\n❌ ${err.stack || err.message}`);
  process.exitCode = 1;
});
