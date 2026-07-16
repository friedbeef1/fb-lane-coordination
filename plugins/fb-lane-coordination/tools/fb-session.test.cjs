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
const { collectSessionDoctorChecks, runSessionCommand } = require(path.join(__dirname, 'fb-session.cjs'));
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
    assertFailed(run(missing.repo, ['submit', 'TASK-001', '--no-tests']), /active execution session|session/i);
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
    const submit = run(worktree, ['submit', 'TASK-001', '--no-tests']);
    assertOk(submit);
    const close = run(worktree, ['session', 'close', '--outcome', 'completed', '--session-id', 'close-complete']);
    assertOk(close);
    assert.strictEqual(readSession(worktree, 'close-complete').state, 'closed');
    assert.strictEqual(readSession(worktree, 'close-complete').outcome, 'completed');
    assertFailed(promote(worktree, 'TASK-999', 'tech', 'planning', 'close-complete'), /closed|reuse/i);
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
    assertFailed(run(worktree, ['submit', 'TASK-001', '--no-tests']), /Task Receipt|Brief Validation|Verification Handoff|Test This Now|actionable|placeholder/i);
  } finally {
    placeholders.cleanup();
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
    assertFailed(run(worktree, ['submit', 'TASK-001', '--no-tests']), /In Progress|authoritative board|approval/i);
    fs.writeFileSync(boardPath, originalBoard.replace('**Approval**: approved', '**Approval**: pending'));
    assertFailed(run(worktree, ['submit', 'TASK-001', '--no-tests']), /approved|approval/i);
    fs.writeFileSync(boardPath, originalBoard.replace('| src/app.js |', '| src/other.js |'));
    assertFailed(run(worktree, ['submit', 'TASK-001', '--no-tests']), /lock|authoritative/i);
    fs.writeFileSync(boardPath, originalBoard);

    const handoffPath = path.join(worktree, 'docs', 'handoffs', 'TASK-001.md');
    const parkedHandoff = `${handoffPath}.parked`;
    fs.renameSync(handoffPath, parkedHandoff);
    assertFailed(run(worktree, ['submit', 'TASK-001', '--no-tests']), /handoff/i);
    fs.renameSync(parkedHandoff, handoffPath);

    const sessionFilePath = sessionPath(worktree, 'submit-authority');
    const originalRecord = readSession(worktree, 'submit-authority');
    fs.writeFileSync(sessionFilePath, `${JSON.stringify({ ...originalRecord, worktree: fixture.repo }, null, 2)}\n`);
    assertFailed(run(worktree, ['submit', 'TASK-001', '--no-tests']), /linked worktree|recorded worktree|registered/i);
    fs.writeFileSync(sessionFilePath, `${JSON.stringify(originalRecord, null, 2)}\n`);

    git(worktree, ['checkout', '-qb', 'session/submit-wrong-branch']);
    assertFailed(run(worktree, ['submit', 'TASK-001', '--no-tests']), /session branch|recorded branch|branch/i);
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

test('bootstrap preserves project-owned instructions, installs six canonical pages, and root/package mirrors stay byte-aligned', () => {
  const fixture = createRepo();
  try {
    const bootstrap = run(fixture.repo, ['bootstrap', '--platform', 'codex']);
    assertOk(bootstrap);
    assert.match(fs.readFileSync(path.join(fixture.repo, 'AGENTS.md'), 'utf8'), /Keep this sentence\./);
    for (const page of ['README.md', 'start.md', 'workflow.md', 'evidence.md', 'guardrails.md', 'sessions.md']) {
      assert.strictEqual(
        fs.readFileSync(path.join(fixture.repo, 'docs', 'fb', page), 'utf8'),
        fs.readFileSync(path.join(rootDir, 'docs', 'fb', page), 'utf8')
      );
      assert.strictEqual(
        fs.readFileSync(path.join(rootDir, 'docs', 'fb', page), 'utf8'),
        fs.readFileSync(path.join(rootDir, 'plugins', 'fb-lane-coordination', 'docs', 'fb', page), 'utf8')
      );
    }
    for (const file of ['fb-lane.cjs', 'fb-session.cjs', 'fb-lane.test.cjs', 'fb-session.test.cjs']) {
      assert.strictEqual(
        fs.readFileSync(path.join(rootDir, 'tools', file), 'utf8'),
        fs.readFileSync(path.join(rootDir, 'plugins', 'fb-lane-coordination', 'tools', file), 'utf8')
      );
    }
  } finally {
    fixture.cleanup();
  }
});

test('claim and quick execute linked worktrees by default while --no-worktree executes the compatibility path', () => {
  const claimFixture = createRepo([{ id: 'TASK-001', status: 'Ready', locks: 'src/app.js' }]);
  try {
    const claimed = run(claimFixture.repo, ['claim', 'TASK-001', 'Tech', 'src/app.js']);
    assertOk(claimed);
    const claimedPath = path.join(claimFixture.parent, 'repo-tech-TASK-001');
    assert.ok(fs.existsSync(claimedPath));
    assert.strictEqual(git(claimedPath, ['branch', '--show-current']), 'tech/TASK-001-scope-for-task-001');
    const registeredClaimPath = fs.realpathSync(claimedPath);
    assert.match(git(claimFixture.repo, ['worktree', 'list', '--porcelain']), new RegExp(`worktree ${registeredClaimPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.match(fs.readFileSync(path.join(claimedPath, 'PROJECT_BOARD.md'), 'utf8'), /\| TASK-001 \| In Progress \| FB-Tech \|/);
  } finally {
    claimFixture.cleanup();
  }

  const quickFixture = createRepo();
  try {
    const quick = run(quickFixture.repo, ['quick', 'Tech', 'src/quick.js', 'Real quick worktree']);
    assertOk(quick);
    const branch = /Branch:\s+(quick\/TASK-Q-\d+-real-quick-worktree)/.exec(quick.stdout)?.[1];
    const worktree = /Worktree:\s+([^\n]+)/.exec(quick.stdout)?.[1]?.trim();
    assert.ok(branch && worktree, output(quick));
    assert.ok(fs.existsSync(worktree));
    assert.strictEqual(git(worktree, ['branch', '--show-current']), branch);
    const registeredQuickPath = fs.realpathSync(worktree);
    assert.match(git(quickFixture.repo, ['worktree', 'list', '--porcelain']), new RegExp(`worktree ${registeredQuickPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  } finally {
    quickFixture.cleanup();
  }

  for (const command of [
    ['claim', 'TASK-001', 'Tech', 'src/app.js', '--no-worktree'],
    ['quick', 'Tech', 'src/quick.js', 'Compatibility path', '--no-worktree'],
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
