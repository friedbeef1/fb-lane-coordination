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
Missing criteria: ${validationStatus === 'pass' ? 'None' : 'External review access'}
Reason: ${validationStatus === 'pass' ? 'None' : 'The external reviewer is unavailable.'}
Owner: Product
Next action: Product performs the final branch-diff review.
Approved scope-change references: None.

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
Missing criteria: ${validationStatus === 'pass' ? 'None' : 'External review access'}
Reason: ${validationStatus === 'pass' ? 'None' : 'The external reviewer is unavailable.'}
Owner: Product
Next action: Product performs the final branch-diff review.
Approved scope-change references: None.

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

test('checkpoint rejects unrelated staging, planning source dirt, placeholders, private reasoning, and secrets', () => {
  const fixture = createRepo();
  try {
    git(fixture.repo, ['checkout', '-qb', 'session/privacy']);
    assertOk(promote(fixture.repo, 'TASK-001', 'product', 'planning', 'privacy'));
    const recap = recapPath(fixture.repo, 'privacy');
    const handoffPath = path.join(fixture.repo, 'docs', 'handoffs', 'TASK-001.md');
    fs.appendFileSync(recap, '\nDecision: TODO\nPrivate reasoning: hidden chain\nAPI_TOKEN=secret-value\n');
    fs.appendFileSync(handoffPath, '\n[Session recap](../sessions/privacy.md)\n');
    fs.writeFileSync(path.join(fixture.repo, 'src', 'dirty.js'), 'x\n');
    git(fixture.repo, ['add', 'src/dirty.js']);
    const result = run(fixture.repo, ['session', 'checkpoint', '--reason', 'decision', '--session-id', 'privacy']);
    assertFailed(result, /staged|source dirt|placeholder|private|secret|token/i);
    assert.strictEqual(git(fixture.repo, ['rev-parse', '--short', 'HEAD']), git(fixture.remote, ['rev-parse', '--short', 'main']));
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

test('recall searches only committed Markdown in HEAD or already-fetched refs and emits deterministic exact citations', () => {
  const fixture = createRepo();
  try {
    git(fixture.repo, ['checkout', '-qb', 'knowledge/branch']);
    fs.mkdirSync(path.join(fixture.repo, 'docs', 'knowledge'), { recursive: true });
    fs.writeFileSync(path.join(fixture.repo, 'docs', 'knowledge', 'note.md'), '# Curated note\n\nNeedle phrase for recall.\n');
    git(fixture.repo, ['add', 'docs/knowledge/note.md']);
    git(fixture.repo, ['commit', '-qm', 'docs: add curated note']);
    const commit = git(fixture.repo, ['rev-parse', 'HEAD']);
    git(fixture.repo, ['push', '-q', '-u', 'origin', 'knowledge/branch']);
    git(fixture.repo, ['checkout', '-q', 'main']);
    const headOnly = run(fixture.repo, ['session', 'recall', 'Needle phrase']);
    assertFailed(headOnly, /no committed curated Markdown|no matches/i);
    const allRefs = run(fixture.repo, ['session', 'recall', 'Needle phrase', '--all-refs']);
    assertOk(allRefs);
    assert.match(allRefs.stdout, /docs\/knowledge\/note\.md#L3/);
    assert.match(allRefs.stdout, /refs\/remotes\/origin\/knowledge\/branch/);
    assert.match(allRefs.stdout, new RegExp(commit.slice(0, 12)));
    assert.match(allRefs.stdout, /Needle phrase for recall\./);
  } finally {
    fixture.cleanup();
  }
});

test('review writes a paste-ready Markdown packet to stdout and clone-local state but no tracked file', () => {
  const fixture = createRepo();
  try {
    git(fixture.repo, ['checkout', '-qb', 'session/review-source']);
    assertOk(promote(fixture.repo, 'TASK-001', 'design', 'review', 'review-1'));
    fs.writeFileSync(path.join(fixture.repo, 'src', 'app.js'), 'module.exports = 4;\n');
    git(fixture.repo, ['add', 'src/app.js']);
    git(fixture.repo, ['commit', '-qm', 'feat: review source']);
    const before = git(fixture.repo, ['status', '--porcelain']);
    const review = run(fixture.repo, ['session', 'review', 'HEAD', '--session-id', 'review-1']);
    assertOk(review);
    assert.match(review.stdout, /^# FB Session Review/m);
    assert.match(review.stdout, /src\/app\.js/);
    assert.strictEqual(git(fixture.repo, ['status', '--porcelain']), before);
    assert.strictEqual(readSession(fixture.repo, 'review-1').state, 'reviewing');
  } finally {
    fixture.cleanup();
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

test('claim and quick default to linked worktrees while --no-worktree preserves the compatibility path', () => {
  const source = fs.readFileSync(cliPath, 'utf8');
  assert.match(source, /--no-worktree/);
  assert.match(source, /worktree:\s*!noWorktree/);
  assert.match(source, /handleQuick\([^\n]+\{\s*worktree:\s*!noWorktree\s*\}/);
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
