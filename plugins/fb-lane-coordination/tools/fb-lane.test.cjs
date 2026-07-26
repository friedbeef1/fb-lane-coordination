#!/usr/bin/env node
'use strict';

// Regression tests for the fb-lane CLI hardening.
//
// These cover the command-injection fix: runGit must never hand
// caller-supplied data to a shell, and task IDs / lane names that flow into
// branch names are validated up front. Run with:  node tools/fb-lane.test.cjs
//
// No external test runner or dependencies — just node's built-in assert.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const {
  runGit,
  assertSafeTaskId,
  assertSafeLane,
  assertSafeBranchName,
  visibleStageFor,
  performAutomatedSubmission,
  resolveSubmissionSafetyGate,
} = require('./fb-lane.cjs');

let passed = 0;
const testFocus = process.env.FB_LANE_TEST_FOCUS;
const cliPath = path.join(__dirname, 'fb-lane.cjs');
const exactProgress = 'Investigating → Handoffs ready → Reconciling → Building → Checking → Ready to ship';
const exactBlocked = 'Blocked — <reason> / next action';
const exactHowFbWorks = [
  '1. Six workstreams investigate relevant parts; irrelevant ones record None relevant.',
  '2. Product combines findings into one build brief.',
  '3. You approve the brief.',
  '4. Only after explicit `$bfm`, BFM builds and checks it.'
].join('\n');
const exactSimpleTaskMessage = 'This is a simple task, so I’ll handle it directly without lanes or a build brief.';
const exactPlanningMessage = 'FB will prepare the plan first. It is not building yet.';
const exactBuildMessage = 'Build For Me (BFM) will now build and check the approved plan.';
const projectStartBriefFields = [
  'What you asked for',
  'Your decisions',
  'Assumptions to confirm',
  'What FB will plan',
  'Out of scope',
  'Success looks like',
  'Next action'
];

assert.strictEqual(typeof performAutomatedSubmission, 'function', 'CLI and MCP must share one automated submission pipeline');
assert.deepStrictEqual(
  resolveSubmissionSafetyGate({
    candidateCommit: '0123456789abcdef0123456789abcdef01234567',
    changedPaths: ['auth/config.js'],
    session: { automatedVerification: {
      candidateCommit: '0123456789abcdef0123456789abcdef01234567',
      changedPaths: ['auth/config.js'],
      safetyGate: { result: 'passed', approvalRef: 'APPROVAL-001' },
    } },
  }),
  { result: 'passed', approvalRef: 'APPROVAL-001' },
  'sensitive submission must consume existing candidate-bound safety approval evidence'
);

function assertPublicRouteContract(label, source) {
  const renderedSource = source.replace(/\\`/g, '`');
  assert.match(renderedSource, /start in whichever workstream matches the question/i, `${label} must expose workstream-first intake`);
  assert.match(renderedSource, /(?:ready handoffs?|handoffs for ready scope)[\s\S]*\$bfm[\s\S]*Product reconcile/i, `${label} must expose the handoff-to-reconciliation boundary`);
  assert.doesNotMatch(renderedSource, /\*\*(?:Simple task|Coordinated planning|Approved Build For Me)/i, `${label} must not expose mode choices`);
}

function assertExactFirstProjectContract(label, source) {
  assert.match(source, /start in whichever of the six workstreams matches the question/i);
  assert.match(source, /Product\/User:[^\n]*(?:only|selected only)[^\n]*(?:user needs|user outcomes)/i);
  assert.ok(source.includes(`**Progress:** ${exactProgress}`), `${label} must preserve the approved progress wording`);
  assert.ok(source.includes(`**Blocked:** ${exactBlocked}`), `${label} must keep blocked work actionable`);
  assert.match(source, /## The single public sequence/);
  assert.match(source, /ready handoffs[\s\S]*`\$bfm`[\s\S]*Product reconciliation[\s\S]*Project Start Brief and Build Brief[\s\S]*Ready to ship[\s\S]*Push Live/i);

  const brief = source.match(/## Project Start Brief\n([\s\S]*?)(?=\n## |\s*$)/);
  assert.ok(brief, `${label} must include Project Start Brief`);
  const visibleFields = [...brief[1].matchAll(/^- \*\*([^:*]+):\*\*/gm)].map(match => match[1]);
  assert.deepStrictEqual(visibleFields, projectStartBriefFields, `${label} must expose exactly the seven approved beginner fields`);
  assert.doesNotMatch(brief[1], /eval|OKR|authority|mechanical versus judgment|quality bar/i, `${label} must keep advanced mechanics out of the visible brief`);

  for (const term of ['Workstream', 'Handoff', 'Build For Me (BFM)', 'Gate', 'Quality Gap']) {
    assert.ok(source.includes(`**${term}:**`), `${label} must define ${term} inline`);
  }
  assert.match(source, /\*\*Build For Me \(BFM\):\*\*[^\n]*activated by `\$bfm`/i);
  assert.doesNotMatch(source, /^## Choose the mode|^### (?:Simple task|Coordinated planning|Approved Build For Me)/m);
  for (const clarificationField of ['Why this matters', 'Recommended default', 'What changes if you choose differently']) {
    assert.match(source, new RegExp(`\\*\\*${clarificationField}\\*\\*`), `${label} must preserve the ${clarificationField} clarification field`);
  }
  assert.doesNotMatch(source, /Build Flow Manager/i, `${label} must use Build For Me terminology`);
}

function test(name, fn) {
  if (testFocus && !name.includes(testFocus)) return;
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log('assertSafeTaskId');
test('accepts conventional task IDs', () => {
  ['TASK-001', 'TASK-Q-5624', 'task_42', 'A.1'].forEach(id =>
    assert.strictEqual(assertSafeTaskId(id), id)
  );
});
test('rejects shell metacharacters', () => {
  ['TASK; rm -rf ~', 'a$(touch x)', 'a`id`', 'a&&b', 'a|b', 'a b', '', '--upload-pack=x']
    .forEach(id => assert.throws(() => assertSafeTaskId(id), /Invalid task ID/));
});
test('rejects non-strings', () => {
  [undefined, null, 42, {}].forEach(id =>
    assert.throws(() => assertSafeTaskId(id), /Invalid task ID/));
});

console.log('assertSafeLane');
test('accepts the known lanes', () => {
  ['Tech', 'Design', 'Business', 'Product', 'tech'].forEach(l =>
    assert.strictEqual(assertSafeLane(l), l));
});
test('rejects injection payloads', () => {
  ['tech; rm -rf ~ #', 'a/b', 'a b', '1tech', '', '-x']
    .forEach(l => assert.throws(() => assertSafeLane(l), /Invalid lane/));
});

console.log('assertSafeBranchName');
test('rejects empty or option-like names', () => {
  ['', '-d', '--force'].forEach(b =>
    assert.throws(() => assertSafeBranchName(b), /unsafe branch name/));
  assert.strictEqual(assertSafeBranchName('tech/TASK-001-fix'), 'tech/TASK-001-fix');
});

console.log('runGit (no shell)');
// Build a throwaway git repo so runGit has something real to talk to.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-test-'));
const prevCwd = process.cwd();
try {
  process.chdir(tmp);
  execFileSync('git', ['init', '-q'], { stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 't@t'], { stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 't'], { stdio: 'ignore' });
  fs.writeFileSync(path.join(tmp, 'f'), 'x');
  execFileSync('git', ['add', 'f'], { stdio: 'ignore' });
  execFileSync('git', ['commit', '-qm', 'init'], { stdio: 'ignore' });

  test('runs a normal command via an args array', () => {
    assert.strictEqual(runGit(['rev-parse', '--is-inside-work-tree']), 'true');
  });

  test('a string of literal args still works', () => {
    assert.strictEqual(runGit('rev-parse --is-inside-work-tree'), 'true');
  });

  test('shell metacharacters in an argument are NOT executed', () => {
    const sentinel = path.join(tmp, 'PWNED');
    // If a shell were involved, "; touch PWNED" would create the sentinel.
    // With execFileSync the whole string is one git revision argument, so git
    // simply fails to resolve it and the sentinel is never created.
    assert.throws(() => runGit(['rev-parse', '--verify', 'HEAD; touch PWNED']));
    assert.ok(!fs.existsSync(sentinel), 'expected no shell-created sentinel file');
  });

  test('command-substitution payloads are inert', () => {
    const sentinel = path.join(tmp, 'SUBST');
    assert.throws(() => runGit(['rev-parse', '--verify', '$(touch SUBST)']));
    assert.ok(!fs.existsSync(sentinel), 'expected no command-substitution side effect');
  });
} finally {
  process.chdir(prevCwd);
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('beginner status');
function writeStatusFixture(root, tasks, options = {}) {
  execFileSync('git', ['init', '-q'], { cwd: root, stdio: 'ignore' });
  const rows = tasks.map(task =>
    `| ${task.id} | ${task.status} | ${task.owner || 'FB-Tech'} | ${task.area || 'CLI'} | ${task.scope} | ${task.locks || '(None)'} | ${task.links || '(None)'} |`
  ).join('\n');
  const details = tasks.map(task => {
    const explicitEvidence = [
      Object.prototype.hasOwnProperty.call(task, 'stagingUrl') ? `    *   **Staging URL**: ${task.stagingUrl}` : '',
      Object.prototype.hasOwnProperty.call(task, 'testLink') ? `    *   **Test Link**: ${task.testLink}` : '',
      Object.prototype.hasOwnProperty.call(task, 'reviewLink') ? `    *   **Test / Review Link**: ${task.reviewLink}` : '',
    ].filter(Boolean).join('\n');
    return `
### ${task.id} - ${task.scope}
*   **Status**: ${task.status}
*   **Owner / Thread**: ${task.owner || 'FB-Tech'}
*   **Area**: ${task.area || 'CLI'}
*   **Scope**: ${task.scope}
*   **Out of Scope**: Unrelated fixture behavior.
*   **Goal Alignment Session**:
    *   **Objective**: ${task.objective || task.scope}
    *   **Approval**: ${task.approval || 'pending'}
    *   **Gate / Review Point**: Product review.
*   **Blockers**: ${task.blockers || 'None'}
*   **Next Owner / Action**: ${task.nextAction || 'Product / choose the next approved action.'}
*   **Affected Screens / Locks**:
    *   **Screens**: Status fixture.
    *   **Locked Files**: ${task.locks || '(None)'}
*   **Links & Deliverables**:
${explicitEvidence || '    *   **Staging URL**: (None)'}
*   **QA Checklist**:
    *   [ ] Status behavior is verified.
*   **Latest Update**:
    *   *2026-07-17*: ${task.latestUpdate || '(None)'}
`;
  }).join('\n');
  fs.writeFileSync(path.join(root, 'PROJECT_BOARD.md'), `# Project Board

## Statuses
- \`Inbox\`: Newly requested tasks requiring triage.
- \`Ready\`: Triaged tasks, fully scoped, ready to be claimed.
- \`In Progress\`: Tasks currently being worked on by an owner.
- \`Staging QA\`: Candidate awaiting verification. Record the actual local, sandbox, staging, or completed-build environment separately.
- \`Done\`: Checked, verified, and merged to production by FB Product.

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
${rows}
---
${details}`);

  if (options.currentTask) {
    fs.mkdirSync(path.join(root, '.codex'), { recursive: true });
    fs.writeFileSync(path.join(root, '.codex', 'current_task.md'), `# Active Task Context

* **Current Task**: ${options.currentTask.id} ${options.currentTask.objective || ''}
* **Status**: ${options.currentTask.status || 'In Progress'}
`);
  }

  const sessions = options.sessions || (options.session ? [options.session] : []);
  for (const session of sessions) {
    const sessionsDir = path.join(root, '.git', 'fb-sessions');
    fs.mkdirSync(sessionsDir, { recursive: true });
    const now = session.updatedAt || new Date().toISOString();
    fs.writeFileSync(path.join(sessionsDir, `${session.sessionId}.json`), `${JSON.stringify({
      version: 1,
      sessionId: session.sessionId,
      taskId: session.taskId,
      lane: session.lane || 'tech',
      mode: session.mode,
      state: session.state || 'active',
      outcome: null,
      branch: session.branch || 'codex/status-fixture',
      worktree: Object.prototype.hasOwnProperty.call(session, 'worktree') ? session.worktree : root,
      handoff: '',
      recap: `docs/sessions/${session.sessionId}.md`,
      locks: [],
      createdAt: now,
      updatedAt: now,
      lastMilestoneAt: now,
      milestones: [],
    }, null, 2)}\n`);
  }
}

function runStatus(root, args = []) {
  return spawnSync('node', [cliPath, 'status', ...args], { cwd: root, encoding: 'utf8' });
}

function mcpRequest(root, request) {
  const result = spawnSync('node', [cliPath, 'mcp'], {
    cwd: root,
    encoding: 'utf8',
    input: `${JSON.stringify(request)}\n`,
  });
  const responseLine = result.stdout.split(/\r?\n/).find(line => line.trim().startsWith('{'));
  assert.ok(responseLine, result.stderr || result.stdout);
  return JSON.parse(responseLine);
}

test('status default uses active session before current task and board priority', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  try {
    writeStatusFixture(root, [
      { id: 'TASK-101', status: 'Ready', scope: 'First board priority', locks: '`secret-first.js`' },
      { id: 'TASK-102', status: 'Staging QA', scope: 'Current-task candidate' },
      { id: 'TASK-103', status: 'In Progress', scope: 'Session-selected objective', latestUpdate: 'Status fixtures written.', nextAction: 'FB-Tech / implement the shared renderer.', reviewLink: '[Focused test](review/status.html)' },
    ], {
      currentTask: { id: 'TASK-102', objective: 'Current task should lose to session' },
      session: { sessionId: 'status-active', taskId: 'TASK-103', mode: 'execution' },
    });
    const result = runStatus(root);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Current objective: Session-selected objective/);
    assert.match(result.stdout, /Working mode: Execution/);
    assert.match(result.stdout, /Stage: Building/);
    assert.match(result.stdout, /Completed work: Status fixtures written\./);
    assert.match(result.stdout, /Pause reason:/);
    assert.match(result.stdout, /Your input:/);
    assert.match(result.stdout, /Next action \/ owner: FB-Tech \/ implement the shared renderer\./);
    assert.match(result.stdout, /Test \/ review link: \[Focused test\]\(review\/status\.html\)/);
    assert.match(result.stdout, /Next ready: TASK-101 — First board priority/);
    assert.doesNotMatch(result.stdout, /Current task should lose|secret-first|\bLocks\b|authority|\bGate\b|Staging QA/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status ignores the newest computed-stale session so current task wins', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  try {
    writeStatusFixture(root, [
      { id: 'TASK-104', status: 'In Progress', scope: 'Current worktree objective' },
      { id: 'TASK-105', status: 'In Progress', scope: 'Newest but stale objective' },
    ], {
      currentTask: { id: 'TASK-104', objective: 'Current task survives stale session' },
      sessions: [{
        sessionId: 'status-stale-newest',
        taskId: 'TASK-105',
        mode: 'execution',
        updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      }],
    });
    const result = runStatus(root);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Current objective: Current task survives stale session/);
    assert.doesNotMatch(result.stdout, /Newest but stale objective/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status ignores an active foreign-worktree session so current task wins', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  const foreign = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-foreign-worktree-'));
  try {
    writeStatusFixture(root, [
      { id: 'TASK-106', status: 'In Progress', scope: 'Local current objective' },
      { id: 'TASK-107', status: 'In Progress', scope: 'Foreign worktree objective' },
    ], {
      currentTask: { id: 'TASK-106', objective: 'Current task survives foreign session' },
      sessions: [{
        sessionId: 'status-foreign-active',
        taskId: 'TASK-107',
        mode: 'execution',
        worktree: foreign,
      }],
    });
    const result = runStatus(root);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Current objective: Current task survives foreign session/);
    assert.doesNotMatch(result.stdout, /Foreign worktree objective/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(foreign, { recursive: true, force: true });
  }
});

test('status blocked session overrides stale board In Progress', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  try {
    writeStatusFixture(root, [
      { id: 'TASK-111', status: 'In Progress', scope: 'Blocked session objective', blockers: 'Provider access is unavailable.' },
    ], { session: { sessionId: 'status-blocked', taskId: 'TASK-111', mode: 'execution', state: 'blocked' } });
    const result = runStatus(root);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Stage: Blocked/);
    assert.match(result.stdout, /Pause reason: Provider access is unavailable\./);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status planning session overrides stale board In Progress', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  try {
    writeStatusFixture(root, [
      { id: 'TASK-112', status: 'In Progress', scope: 'Planning session objective' },
    ], { session: { sessionId: 'status-planning', taskId: 'TASK-112', mode: 'planning', state: 'active' } });
    const result = runStatus(root);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Working mode: Planning/);
    assert.match(result.stdout, /Stage: Understanding/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status current-task fallback wins before highest-priority incomplete board item', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  try {
    writeStatusFixture(root, [
      { id: 'TASK-201', status: 'Ready', scope: 'Higher board item' },
      { id: 'TASK-202', status: 'Staging QA', scope: 'Current-task review', reviewLink: '[Review](https://review.acme.test/task-202)' },
    ], { currentTask: { id: 'TASK-202', objective: 'Current task review objective' } });
    const result = runStatus(root);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Current objective: Current task review objective/);
    assert.match(result.stdout, /Stage: Ready for review/);
    assert.match(result.stdout, /Next ready: TASK-201 — Higher board item/);
    assert.doesNotMatch(result.stdout, /Staging QA/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status current-task state overrides stale board In Progress', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  try {
    writeStatusFixture(root, [
      { id: 'TASK-211', status: 'In Progress', scope: 'Stale board build state' },
    ], { currentTask: { id: 'TASK-211', objective: 'Current planning state', status: 'Ready' } });
    const result = runStatus(root);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Current objective: Current planning state/);
    assert.match(result.stdout, /Stage: Ready for your approval/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status current-task descriptive status prefixes map to beginner stages', () => {
  const fixtures = [
    ['In Progress — approved implementation and local verification only; no release authorized', 'Building'],
    ['Ready — awaiting Product approval before implementation', 'Ready for your approval'],
    ['Verification — local checks are still running', 'Checking'],
    ['Complete — focused verification passed', 'Complete'],
    ['Blocked — provider credentials are unavailable', 'Blocked'],
  ];

  for (const [status, expectedStage] of fixtures) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
    try {
      writeStatusFixture(root, [
        { id: 'TASK-211', status: 'In Progress', scope: 'Descriptive current-task state', blockers: 'Provider credentials are unavailable.' },
      ], { currentTask: { id: 'TASK-211', objective: 'Repository-shaped current task', status } });
      const result = runStatus(root);
      assert.strictEqual(result.status, 0, result.stderr);
      assert.match(result.stdout, new RegExp(`Stage: ${expectedStage.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}`), status);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('status Staging QA ignores general deliverable links and placeholder review evidence', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  try {
    writeStatusFixture(root, [
      { id: 'TASK-212', status: 'Staging QA', scope: 'Candidate without review access', links: '[Handoff](docs/handoffs/TASK-212.md); [Plan](docs/plan.md)', reviewLink: '(None)' },
    ]);
    const result = runStatus(root);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Stage: Checking/);
    assert.match(result.stdout, /Test \/ review link: Not available yet\./);
    assert.doesNotMatch(result.stdout, /Handoff|docs\/plan/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status Staging QA becomes review-ready only from explicit review evidence', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  try {
    writeStatusFixture(root, [
      { id: 'TASK-213', status: 'Staging QA', scope: 'Candidate with explicit staging access', links: '[Handoff](docs/handoffs/TASK-213.md)', stagingUrl: '[Open staging](https://review.acme.test/task-213)' },
    ]);
    const result = runStatus(root);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Stage: Ready for review/);
    assert.match(result.stdout, /Test \/ review link: \[Open staging\]\(https:\/\/review\.acme\.test\/task-213\)/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status review URL classifier accepts actionable ordinary-word domains and paths', () => {
  const fixtures = [
    'https://todo-app.pages.dev/review',
    'https://acme.test/templates/42',
    'https://examplecorp.com/review',
  ];

  for (const [index, reviewUrl] of fixtures.entries()) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
    try {
      writeStatusFixture(root, [
        { id: `TASK-24${index}`, status: 'Staging QA', scope: 'Candidate with a legitimate review URL', reviewLink: `[Open review](${reviewUrl})` },
      ]);
      const result = runStatus(root);
      assert.strictEqual(result.status, 0, result.stderr);
      assert.match(result.stdout, /Stage: Ready for review/);
      assert.ok(result.stdout.includes(`Test / review link: [Open review](${reviewUrl})`));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('status review evidence skips an earlier canonical placeholder and uses the first actionable field', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  try {
    writeStatusFixture(root, [
      {
        id: 'TASK-214',
        status: 'Staging QA',
        scope: 'Candidate with placeholder then actionable evidence',
        stagingUrl: '[Staging Link](https://staging.example.com)',
        testLink: '[Open focused review](https://review.acme.test/task-214)',
        reviewLink: '[Later review](https://review.acme.test/task-214/later)',
      },
    ]);
    const result = runStatus(root);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Stage: Ready for review/);
    assert.match(result.stdout, /Test \/ review link: \[Open focused review\]\(https:\/\/review\.acme\.test\/task-214\)/);
    assert.doesNotMatch(result.stdout, /staging\.example\.com|Later review/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status resolves TASK-022 and TASK-023 shaped canonical handoff review links', () => {
  const fixtures = [
    ['TASK-022', 'tools/fb-session.cjs', 'Root session module'],
    ['TASK-023', 'tools/fb-eval.cjs', 'Eval validator'],
  ];
  for (const [taskId, target, label] of fixtures) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-handoff-'));
    try {
      writeStatusFixture(root, [{
        id: taskId,
        status: 'Staging QA',
        scope: `${taskId} review candidate`,
        links: `[Handoff](docs/handoffs/${taskId}.md)`,
      }]);
      fs.mkdirSync(path.join(root, 'docs', 'handoffs'), { recursive: true });
      fs.mkdirSync(path.join(root, 'tools'), { recursive: true });
      fs.writeFileSync(path.join(root, target), '// review fixture\n');
      fs.writeFileSync(path.join(root, 'docs', 'handoffs', `${taskId}.md`), `# ${taskId}\n\n## Test This Now\n\n- **Direct links:** [Placeholder](https://example.com/review), [${label}](../../${target})\n- **Exact steps and expectations:**\n  1. Open the linked file.\n`);

      const result = runStatus(root);
      assert.strictEqual(result.status, 0, result.stderr);
      assert.match(result.stdout, /Stage: Ready for review/);
      assert.ok(result.stdout.includes(`Test / review link: [${label}](../../${target})`));
      assert.doesNotMatch(result.stdout, /Placeholder|example\.com/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('status keeps explicit board review evidence ahead of linked handoff evidence', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-handoff-'));
  try {
    writeStatusFixture(root, [{
      id: 'TASK-215',
      status: 'Staging QA',
      scope: 'Explicit review candidate',
      links: '[Handoff](docs/handoffs/TASK-215.md)',
      reviewLink: '[Board review](https://review.acme.test/task-215)',
    }]);
    fs.mkdirSync(path.join(root, 'docs', 'handoffs'), { recursive: true });
    fs.mkdirSync(path.join(root, 'tools'), { recursive: true });
    fs.writeFileSync(path.join(root, 'tools', 'handoff-review.cjs'), '// fixture\n');
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-215.md'), `## Test This Now\n\n- **Direct links:** [Handoff review](../../tools/handoff-review.cjs)\n`);

    const result = runStatus(root);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Test \/ review link: \[Board review\]\(https:\/\/review\.acme\.test\/task-215\)/);
    assert.doesNotMatch(result.stdout, /Handoff review/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status rejects unsafe or unavailable linked handoff review evidence', () => {
  const fixtures = [
    { name: 'escaped handoff', handoff: '[Handoff](../TASK-216.md)' },
    { name: 'missing handoff', handoff: '[Handoff](docs/handoffs/TASK-216.md)' },
    { name: 'remote handoff', handoff: '[Handoff](https://review.acme.test/TASK-216.md)' },
    { name: 'escaped direct link', handoff: '[Handoff](docs/handoffs/TASK-216.md)', direct: '[Escape](../../../outside.md)' },
    { name: 'missing direct link', handoff: '[Handoff](docs/handoffs/TASK-216.md)', direct: '[Missing](../../tools/missing.cjs)' },
    { name: 'placeholder direct link', handoff: '[Handoff](docs/handoffs/TASK-216.md)', direct: '[Example](https://example.com/review)' },
  ];
  for (const fixture of fixtures) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-handoff-'));
    const outsidePaths = [];
    try {
      writeStatusFixture(root, [{
        id: 'TASK-216',
        status: 'Staging QA',
        scope: fixture.name,
        links: fixture.handoff,
      }]);
      if (fixture.direct) {
        fs.mkdirSync(path.join(root, 'docs', 'handoffs'), { recursive: true });
        fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-216.md'), `## Test This Now\n\n- **Direct links:** ${fixture.direct}\n`);
      }
      if (fixture.name === 'escaped handoff') {
        const outsideHandoff = path.join(path.dirname(root), 'TASK-216.md');
        fs.writeFileSync(outsideHandoff, '## Test This Now\n\n- **Direct links:** [Outside](https://review.acme.test/outside)\n');
        outsidePaths.push(outsideHandoff);
      }
      if (fixture.name === 'escaped direct link') {
        const outsideReview = path.join(path.dirname(root), 'outside.md');
        fs.writeFileSync(outsideReview, '# Outside review evidence\n');
        outsidePaths.push(outsideReview);
      }

      const result = runStatus(root);
      assert.strictEqual(result.status, 0, result.stderr);
      assert.match(result.stdout, /Stage: Checking/);
      assert.match(result.stdout, /Test \/ review link: Not available yet\./);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      for (const outsidePath of outsidePaths) fs.rmSync(outsidePath, { force: true });
    }
  }
});

test('status review URL classifier rejects reserved hosts and explicit placeholder tokens', () => {
  const fixtures = [
    { stagingUrl: '[Staging Link](https://staging.example.com)' },
    { stagingUrl: '[Example review](https://example.com/review)' },
    { testLink: '[Example review](https://preview.example.org/review)' },
    { reviewLink: '[Example review](https://example.net/review)' },
    { testLink: '[TODO review](https://review.acme.test/ready)' },
    { reviewLink: '[TBD review](https://review.acme.test/ready)' },
    { reviewLink: '[Tenant review](https://<tenant>.pages.dev/review)' },
  ];

  for (const [index, evidence] of fixtures.entries()) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
    try {
      writeStatusFixture(root, [
        { id: `TASK-22${index}`, status: 'Staging QA', scope: 'Placeholder-only review evidence', ...evidence },
      ]);
      const result = runStatus(root);
      assert.strictEqual(result.status, 0, result.stderr);
      assert.match(result.stdout, /Stage: Checking/);
      assert.match(result.stdout, /Test \/ review link: Not available yet\./);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('status board fallback selects the highest-priority incomplete item', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  try {
    writeStatusFixture(root, [
      { id: 'TASK-301', status: 'Done', scope: 'Already complete' },
      { id: 'TASK-302', status: 'Ready', scope: 'Approve the status slice', approval: 'pending' },
      { id: 'TASK-303', status: 'In Progress', scope: 'Lower-priority build' },
    ]);
    const result = runStatus(root);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Current objective: Approve the status slice/);
    assert.match(result.stdout, /Stage: Ready for your approval/);
    assert.doesNotMatch(result.stdout, /Already complete|Lower-priority build/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status stage mapping keeps technical states behind beginner labels', () => {
  assert.strictEqual(typeof visibleStageFor, 'function');
  assert.strictEqual(visibleStageFor({ phase: 'intake' }), 'Understanding');
  assert.strictEqual(visibleStageFor({ mode: 'planning' }), 'Understanding');
  assert.strictEqual(visibleStageFor({ status: 'Ready', approval: 'pending' }), 'Ready for your approval');
  assert.strictEqual(visibleStageFor({ status: 'Approved' }), 'Ready for your approval');
  assert.strictEqual(visibleStageFor({ status: 'Waiting' }), 'Ready for your approval');
  assert.strictEqual(visibleStageFor({ phase: 'waiting' }), 'Ready for your approval');
  assert.strictEqual(visibleStageFor({ mode: 'execution' }), 'Building');
  assert.strictEqual(visibleStageFor({ status: 'Verification' }), 'Checking');
  assert.strictEqual(visibleStageFor({ status: 'Local' }), 'Checking');
  assert.strictEqual(visibleStageFor({ phase: 'verification' }), 'Checking');
  assert.strictEqual(visibleStageFor({ environment: 'local' }), 'Checking');
  assert.strictEqual(visibleStageFor({ status: 'Staged', reviewLink: 'https://review.acme.test' }), 'Ready for review');
  assert.strictEqual(visibleStageFor({ status: 'Staging QA', reviewLink: 'https://review.acme.test' }), 'Ready for review');
  assert.strictEqual(visibleStageFor({ status: 'Staging QA', reviewLink: '(None)' }), 'Checking');
  assert.strictEqual(visibleStageFor({ status: 'Staging QA' }), 'Checking');
  assert.strictEqual(visibleStageFor({ status: 'In Progress', mode: 'planning', state: 'active' }), 'Understanding');
  assert.strictEqual(visibleStageFor({ status: 'In Progress', mode: 'review', state: 'reviewing' }), 'Checking');
  assert.strictEqual(visibleStageFor({ status: 'In Progress', mode: 'review', state: 'reviewing', reviewLink: 'https://review.acme.test' }), 'Ready for review');
  assert.strictEqual(visibleStageFor({ status: 'In Progress', mode: 'execution', state: 'blocked' }), 'Blocked');
  assert.strictEqual(visibleStageFor({ state: 'closed' }), 'Complete');
  assert.strictEqual(visibleStageFor({ status: 'Blocked', blockers: 'Provider credentials unavailable.' }), 'Blocked');
});

test('status reports malformed session registry but treats an absent registry as normal', () => {
  const cleanRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  const brokenRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  try {
    writeStatusFixture(cleanRoot, [{ id: 'TASK-411', status: 'Ready', scope: 'Ordinary status objective' }]);
    const clean = runStatus(cleanRoot);
    assert.strictEqual(clean.status, 0, clean.stderr);
    assert.doesNotMatch(clean.stdout, /Status warning|registry/i);

    writeStatusFixture(brokenRoot, [{ id: 'TASK-412', status: 'Ready', scope: 'Status warning objective' }]);
    const sessionsDir = path.join(brokenRoot, '.git', 'fb-sessions');
    fs.mkdirSync(sessionsDir, { recursive: true });
    fs.writeFileSync(path.join(sessionsDir, 'broken.json'), '{not valid json\n');
    const broken = runStatus(brokenRoot);
    assert.strictEqual(broken.status, 0, broken.stderr);
    assert.match(broken.stdout, /Status warning: Session registry could not be read:/);
    assert.match(broken.stdout, /registry JSON is invalid/);
  } finally {
    fs.rmSync(cleanRoot, { recursive: true, force: true });
    fs.rmSync(brokenRoot, { recursive: true, force: true });
  }
});

test('status docs and generated board definitions preserve candidate semantics', () => {
  const adjacentRoot = path.resolve(__dirname, '..');
  const root = fs.existsSync(path.join(adjacentRoot, 'PROJECT_BOARD.md'))
    ? adjacentRoot
    : path.resolve(__dirname, '..', '..', '..');
  const expectedDefinition = '- `Staging QA`: Candidate awaiting verification. Record the actual local, sandbox, staging, or completed-build environment separately.';
  for (const relative of ['PROJECT_BOARD.md', 'templates/PROJECT_BOARD.md', 'examples/my-app/PROJECT_BOARD.md']) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    const topStatuses = source.match(/## Statuses\n([\s\S]*?)(?=\n---)/);
    assert.ok(topStatuses, `${relative} must retain the top Statuses section`);
    assert.ok(topStatuses[1].includes(expectedDefinition), `${relative} must use candidate-only Staging QA semantics`);
  }
  const cliSource = fs.readFileSync(path.join(root, 'tools', 'fb-lane.cjs'), 'utf8').replace(/\\`/g, '`');
  assert.ok(cliSource.includes(expectedDefinition), 'generated board text must use candidate-only Staging QA semantics');
  for (const prefix of ['', 'plugins/fb-lane-coordination/']) {
    assert.match(fs.readFileSync(path.join(root, prefix, 'docs', 'fb', 'workflow.md'), 'utf8'), /Staging QA[\s\S]*candidate/i);
    assert.match(fs.readFileSync(path.join(root, prefix, 'docs', 'fb', 'evidence.md'), 'utf8'), /completed[ -]build/i);
  }
});

test('status details preserves the raw technical table', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  try {
    writeStatusFixture(root, [
      { id: 'TASK-401', status: 'Staging QA', scope: 'Raw status candidate', locks: '`tools/fb-lane.cjs`' },
    ]);
    const result = runStatus(root, ['--details']);
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Active Workstreams/);
    assert.match(result.stdout, /TASK-401/);
    assert.match(result.stdout, /Staging QA/);
    assert.match(result.stdout, /Locks: `tools\/fb-lane\.cjs`/);
    assert.doesNotMatch(result.stdout, /Current objective:/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status MCP exposes details schema and shares beginner and technical renderers', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-status-'));
  try {
    writeStatusFixture(root, [
      { id: 'TASK-501', status: 'Staging QA', scope: 'MCP status candidate', locks: '`mcp-secret.js`', reviewLink: '[Review](https://review.acme.test/task-501)' },
    ]);
    const listed = mcpRequest(root, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
    const schema = listed.result.tools.find(tool => tool.name === 'fb_lane_status').inputSchema;
    assert.deepStrictEqual(schema.properties.details, { type: 'boolean', description: 'Show the raw technical workstream table.' });

    const beginner = mcpRequest(root, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'fb_lane_status', arguments: { workspacePath: root } } });
    const beginnerText = beginner.result.content[0].text;
    assert.match(beginnerText, /Current objective: MCP status candidate/);
    assert.match(beginnerText, /Stage: Ready for review/);
    assert.doesNotMatch(beginnerText, /Staging QA|\bLocks\b|mcp-secret/i);

    const details = mcpRequest(root, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'fb_lane_status', arguments: { workspacePath: root, details: true } } });
    const detailsText = details.result.content[0].text;
    assert.match(detailsText, /TASK-501/);
    assert.match(detailsText, /Staging QA/);
    assert.match(detailsText, /mcp-secret\.js/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

console.log('handoff index');
function writeDoctorFixture(root, handoffCount = 4) {
  fs.mkdirSync(path.join(root, 'docs', 'handoffs'), { recursive: true });
  fs.mkdirSync(path.join(root, '.codex'), { recursive: true });
  fs.mkdirSync(path.join(root, 'tools'), { recursive: true });
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Agents\n');
  fs.writeFileSync(path.join(root, '.codex', 'rules.md'), '# Rules\n');
  fs.writeFileSync(path.join(root, 'tools', 'fb-lane.cjs'), '// fixture\n');
  fs.writeFileSync(path.join(root, 'PROJECT_BOARD.md'), `# Project Board

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-001 | Ready | FB-Tech | Test | Test task | (None) | [Handoff](docs/handoffs/TASK-001.md) |

### TASK-001 - Test task
* **Status**: Ready
* **Goal Alignment Session**:
  * **Objective**: Keep handoff lookup cheap.
  * **Key Results**:
    * Agents can find the active handoff from an index.
  * **Definition of Done**: Doctor reports the index state.
  * **Gate / Review Point**: Product review.
  * **Approval**: approved
  * **Justification**: The task has multiple handoffs.
`);
  for (let i = 1; i <= handoffCount; i += 1) {
    const name = i === 1 ? 'TASK-001.md' : `TASK-${String(i).padStart(3, '0')}.md`;
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', name), `# ${name}

## Goal Alignment Session

Lane OKR Fit: aligned
Mini-loop Evidence: fixture evidence
Evidence Against Product OKR: None identified
`);
  }
}

function approvedV2Handoff(reviewState, body = '') {
  return `---
type: fb-lane-handoff
task: TASK-001
lane: fb-product
status: ready
fb_harness: v2
Review state: ${reviewState}
---

# TASK-001

## Goal Alignment Session

Lane OKR Fit: aligned
Mini-loop Evidence: fixture evidence
Evidence Against Product OKR: None identified

**Objective**: Verify the v2 review packet.
**Key Results**: Review evidence is actionable.
**Definition of Done**: Doctor accepts complete evidence.
**Gate / Review Point**: Product review.
**Approval**: approved
**Justification**: This fixture models an approved initial handoff.

## Project Start Brief

What you asked for: A reviewable fixture.

## Build Brief

Build the smallest reviewable fixture.
${body}`;
}

function completeReviewPacket(link) {
  return `
## Test This Now

- **Outcome type:** Reviewable fixture
- **Direct links:** [Open the review surface](${link})
- **Exact steps and expectations:**
  1. Open the direct link.
  2. Confirm the review surface loads and shows the fixture result.
- **Pass criteria:** The fixture result is visible without an error.
- **Known limits:** This fixture has no external service coverage.
- **Failure-report format:** What happened; what was expected; direct link or screenshot; environment.
`;
}

function runDoctor(root) {
  return spawnSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
}

function assertCodexBootstrap(args) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-bootstrap-'));
  try {
    const output = execFileSync('node', [cliPath, 'bootstrap', ...args], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const brandLine = ['FB 0.2.0-beta:', 'AI', 'Loop', 'Engineering', 'for', 'Everyday', 'People'].join(' ');
    assert.ok(!output.includes(brandLine), 'bootstrap console output must not repeat the current FB model line');
    const bundledPack = path.join(__dirname, '..', 'docs', 'fb');
    const generatedPack = path.join(root, 'docs', 'fb');
    for (const page of ['README.md', 'start.md', 'workflow.md', 'evidence.md', 'guardrails.md', 'sessions.md']) {
      const bundled = path.join(bundledPack, page);
      const generated = path.join(generatedPack, page);
      assert.ok(fs.existsSync(generated), `expected bootstrap to create docs/fb/${page}`);
      assert.strictEqual(fs.readFileSync(generated, 'utf8'), fs.readFileSync(bundled, 'utf8'), `expected docs/fb/${page} to match the installed pack`);
    }
    const indexPath = path.join(root, 'docs', 'handoffs', 'index.md');
    assert.ok(fs.existsSync(indexPath), 'expected bootstrap to create docs/handoffs/index.md');
    assert.match(fs.readFileSync(indexPath, 'utf8'), /type: fb-lane-handoff-index/);
    const evalTemplatePath = path.join(root, 'docs', 'evals', 'agent-behavior-scorecard-template.md');
    assert.ok(fs.existsSync(evalTemplatePath), 'expected bootstrap to create docs/evals/agent-behavior-scorecard-template.md');
    assert.ok(!fs.readFileSync(evalTemplatePath, 'utf8').includes(brandLine), 'generated scorecard must not repeat the current FB model line');
    assert.match(fs.readFileSync(evalTemplatePath, 'utf8'), /Non-Product Execution Gate/);
    assert.match(fs.readFileSync(evalTemplatePath, 'utf8'), /## Verification Handoff/);
    assert.match(fs.readFileSync(path.join(root, 'PROJECT_BOARD.md'), 'utf8'), /Sidechat-to-Main Prompt Handoff/);
    const sidechatRoutingPath = path.join(root, 'docs', 'sidechat-parent-thread-routing.md');
    assert.ok(fs.existsSync(sidechatRoutingPath), 'expected bootstrap to create sidechat parent-routing guidance');
    assert.match(fs.readFileSync(sidechatRoutingPath, 'utf8'), /one eligible destination:\s*the originating main thread/i);
    assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /sidechat-parent-thread-routing\.md/);
    const board = fs.readFileSync(path.join(root, 'PROJECT_BOARD.md'), 'utf8');
    const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    const codexRules = fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8');
    assertExactFirstProjectContract('fresh bootstrap docs/fb/start.md', fs.readFileSync(path.join(generatedPack, 'start.md'), 'utf8'));
    assert.ok(!board.includes(brandLine), 'generated project board must not repeat the current FB model line');
    for (const [label, source] of [['PROJECT_BOARD.md', board], ['AGENTS.md', agents], ['.codex/rules.md', codexRules]]) {
      assert.match(source, /sidechat-parent-thread-routing\.md/, `${label} must link to the canonical rule`);
      assert.doesNotMatch(source, /paste-ready prompt for the main Product\/BFM thread/i, `${label} must not choose a destination by Product/BFM role`);
    }
    for (const [label, source] of [['AGENTS.md', agents], ['.codex/rules.md', codexRules]]) {
      assert.match(source, /<!-- fb-harness-route-start -->/, `${label} must include the managed FB route`);
      assert.match(source, /<!-- fb-harness-route-end -->/, `${label} must close the managed FB route`);
      assert.match(source, /docs\/fb\/README\.md/, `${label} must route to the installed FB pack`);
      assert.match(source, /First project, plan, lanes, or approval: \[start\.md\]\(docs\/fb\/start\.md\)/, `${label} must map first-project work to start.md`);
      assert.match(source, /Ownership, BFM execution, and closeout: \[workflow\.md\]\(docs\/fb\/workflow\.md\)/, `${label} must map workflow work to workflow.md`);
      assert.match(source, /Test This Now and Verification Handoff: \[evidence\.md\]\(docs\/fb\/evidence\.md\)/, `${label} must map evidence and recovery work to evidence.md`);
      assert.match(source, /Sidechat-parent routing and recovery: \[guardrails\.md\]\(docs\/fb\/guardrails\.md\)/, `${label} must map sidechat-parent work to guardrails.md`);
      assert.match(source, /\[the project sidechat rule\]\(docs\/sidechat-parent-thread-routing\.md\)/, `${label} must retain the sidechat-parent route`);
      const boardRead = source.indexOf('`PROJECT_BOARD.md`');
      const indexRead = source.indexOf('`docs/handoffs/index.md`');
      const handoffRead = source.indexOf('the linked handoff');
      assert.ok(boardRead >= 0 && boardRead < indexRead && indexRead < handoffRead, `${label} must state the board → index → linked handoff read order`);
      assert.doesNotMatch(source, /## Project Start Brief|## Test This Now|### Verification Handoff/, `${label} must remain a thin route layer`);
      assertPublicRouteContract(label, source);
      assert.match(source, /node tools\/fb-lane\.cjs status --details/, `${label} must opt into technical details for lock inspection`);
      assert.match(source, /fb_lane_status\(\{details:true\}\)/, `${label} must request MCP details for lock inspection`);
      assert.match(source, /returning-project health[\s\S]*\$fb-lane status/i, `${label} must keep default status for returning health`);
    }
    assert.doesNotMatch(board + agents, /Mode Selection Trigger Rule|normal\/simple|FB light/i, 'generated coordination guidance must not expose internal mode routing');
    assert.match(agents, /ready scope[\s\S]*approval attaches[\s\S]*before `\$bfm`[\s\S]*Project Start Brief[\s\S]*Build Brief/i, 'generated AGENTS must attach approval to ready scope before post-$bfm reconciliation briefs');
    assert.match(output, /Describe your new project normally/, 'bootstrap quick start must lead with normal project description');
    assert.match(output, /starts in whichever workstream matches the question/, 'bootstrap quick start must explain workstream-first intake');
    assert.match(output, /Relevant workstreams investigate and create ready handoffs/, 'bootstrap quick start must explain relevant workstream output');
    assert.match(output, /actionable handoffs are ready, say \$bfm[\s\S]*Product scans all six, reconciles and prioritizes/, 'bootstrap quick start must put Product reconciliation after ready handoffs and $bfm');
    assert.ok(!output.includes(exactBuildMessage), 'bootstrap completion must not announce that Build For Me execution is starting');
    assert.match(output, /BFM executes approved scope/, 'bootstrap quick start must describe authorized execution');
    assert.match(output, /Ready to ship[\s\S]*Push Live/, 'bootstrap quick start must preserve the release boundary');
    assert.match(output, /returning-project health/, 'bootstrap quick start must reserve status for returning-project health');
    assert.match(codexRules, /docs\/fb\/guardrails\.md/, 'Codex rules must route sidechat authority through the harness');
    assert.ok(!fs.existsSync(path.join(root, '.mcp.json')), 'expected bootstrap not to create project MCP config');
    assert.match(fs.readFileSync(path.join(root, '.gitignore'), 'utf8'), /^\.fb\/graph\/$/m, 'expected bootstrap to ignore derived graph artifacts');
    assert.ok(!fs.existsSync(path.join(root, '.claude')), 'expected bootstrap not to create Claude Code files');
    assert.ok(!fs.existsSync(path.join(root, 'agents')), 'expected bootstrap not to create Antigravity files');
    assert.doesNotMatch(output, /Antigravity|Claude Code|MCP/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('bootstrap replaces only a complete stale managed route and remains byte-stable', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-existing-bootstrap-'));
  const staleRoute = '<!-- fb-harness-route-start -->\nold managed route\n<!-- fb-harness-route-end -->';
  const agentsPrefix = '# Project-owned AGENTS\n\nKeep this exact project instruction.\n\n';
  const agentsSuffix = '\n\nKeep this exact AGENTS suffix.\n';
  const rulesPrefix = '# Project-owned rules\n\nKeep this exact custom rule.\n\n';
  const rulesSuffix = '\n\nKeep this exact rules suffix.\n';
  const agentsBefore = `${agentsPrefix}${staleRoute}${agentsSuffix}`;
  const rulesBefore = `${rulesPrefix}${staleRoute}${rulesSuffix}`;
  try {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsBefore, 'utf8');
    fs.mkdirSync(path.join(root, '.codex'));
    fs.writeFileSync(path.join(root, '.codex', 'rules.md'), rulesBefore, 'utf8');
    execFileSync('node', [cliPath, 'bootstrap'], { cwd: root, stdio: 'ignore' });
    const agentsAfterFirstRun = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    const rulesAfterFirstRun = fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8');
    for (const [label, prefix, suffix, after] of [['AGENTS.md', agentsPrefix, agentsSuffix, agentsAfterFirstRun], ['.codex/rules.md', rulesPrefix, rulesSuffix, rulesAfterFirstRun]]) {
      assert.ok(after.startsWith(prefix), `${label} must preserve its project-owned prefix verbatim`);
      assert.ok(after.endsWith(suffix), `${label} must preserve its project-owned suffix verbatim`);
      assert.doesNotMatch(after, /old managed route/, `${label} must replace the stale managed route`);
      assert.strictEqual((after.match(/<!-- fb-harness-route-start -->/g) || []).length, 1, `${label} must retain one managed route start marker`);
      assert.strictEqual((after.match(/<!-- fb-harness-route-end -->/g) || []).length, 1, `${label} must retain one managed route end marker`);
      assert.match(after, /docs\/fb\/README\.md/, `${label} must route to the installed pack`);
    }
    execFileSync('node', [cliPath, 'bootstrap'], { cwd: root, stdio: 'ignore' });
    assert.strictEqual(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), agentsAfterFirstRun, 'AGENTS.md route update must be idempotent');
    assert.strictEqual(fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8'), rulesAfterFirstRun, '.codex/rules.md route update must be idempotent');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('bootstrap preserves unmatched route-start markers while appending one complete managed route', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-marker-bootstrap-'));
  const unmatchedStart = '<!-- fb-harness-route-start -->\nproject-owned unfinished note';
  const agentsBefore = `# Project-owned AGENTS\n\n${unmatchedStart}\n`;
  const rulesBefore = `# Project-owned rules\n\n${unmatchedStart}\n`;
  try {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsBefore, 'utf8');
    fs.mkdirSync(path.join(root, '.codex'));
    fs.writeFileSync(path.join(root, '.codex', 'rules.md'), rulesBefore, 'utf8');
    execFileSync('node', [cliPath, 'bootstrap'], { cwd: root, stdio: 'ignore' });
    const agentsAfterFirstRun = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    const rulesAfterFirstRun = fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8');
    for (const [label, before, after] of [['AGENTS.md', agentsBefore, agentsAfterFirstRun], ['.codex/rules.md', rulesBefore, rulesAfterFirstRun]]) {
      assert.ok(after.startsWith(before), `${label} must preserve unmatched project-owned text verbatim`);
      assert.strictEqual((after.match(/<!-- fb-harness-route-start -->/g) || []).length, 2, `${label} must append a complete route after its unmatched start marker`);
      assert.strictEqual((after.match(/<!-- fb-harness-route-end -->/g) || []).length, 1, `${label} must append one managed route end marker`);
      assert.match(after, /docs\/fb\/README\.md/, `${label} must append the canonical harness route`);
    }
    execFileSync('node', [cliPath, 'bootstrap'], { cwd: root, stdio: 'ignore' });
    assert.strictEqual(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), agentsAfterFirstRun, 'AGENTS.md marker migration must be idempotent');
    assert.strictEqual(fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8'), rulesAfterFirstRun, '.codex/rules.md marker migration must be idempotent');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('bootstrap preserves legacy routes while appending one complete managed route', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-legacy-bootstrap-'));
  const legacyRoute = '<!-- fb-lane-start -->\nlegacy project-owned routing text\n<!-- fb-lane-end -->';
  const agentsBefore = `# Project-owned AGENTS\n\n${legacyRoute}\n`;
  const rulesBefore = `# Project-owned rules\n\n${legacyRoute}\n`;
  try {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsBefore, 'utf8');
    fs.mkdirSync(path.join(root, '.codex'));
    fs.writeFileSync(path.join(root, '.codex', 'rules.md'), rulesBefore, 'utf8');
    execFileSync('node', [cliPath, 'bootstrap'], { cwd: root, stdio: 'ignore' });
    const agentsAfterFirstRun = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    const rulesAfterFirstRun = fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8');
    for (const [label, before, after] of [['AGENTS.md', agentsBefore, agentsAfterFirstRun], ['.codex/rules.md', rulesBefore, rulesAfterFirstRun]]) {
      assert.ok(after.startsWith(before), `${label} must preserve legacy project-owned text verbatim`);
      assert.strictEqual((after.match(/<!-- fb-harness-route-start -->/g) || []).length, 1, `${label} must append one managed route start marker`);
      assert.strictEqual((after.match(/<!-- fb-harness-route-end -->/g) || []).length, 1, `${label} must append one managed route end marker`);
      assert.match(after, /docs\/fb\/README\.md/, `${label} must append the canonical harness route`);
    }
    execFileSync('node', [cliPath, 'bootstrap'], { cwd: root, stdio: 'ignore' });
    assert.strictEqual(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), agentsAfterFirstRun, 'AGENTS.md legacy migration must be idempotent');
    assert.strictEqual(fs.readFileSync(path.join(root, '.codex', 'rules.md'), 'utf8'), rulesAfterFirstRun, '.codex/rules.md legacy migration must be idempotent');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

console.log('sidechat parent-thread routing');
test('documents the parent-only sidechat routing rule across source and package entry points', () => {
  const repoRoot = process.cwd();
  const canonicalPath = path.join(repoRoot, 'docs', 'sidechat-parent-thread-routing.md');
  assert.ok(fs.existsSync(canonicalPath), 'expected canonical sidechat parent-routing document');
  const canonical = fs.readFileSync(canonicalPath, 'utf8');
  assert.match(canonical, /one eligible destination:\s*the originating main thread/i);
  assert.match(canonical, /must not choose a destination.*role.*project.*name.*recency.*Product\/BFM status/is);
  assert.match(canonical, /cannot be identified or reached.*paste-ready handoff.*must not send, redirect, or imply/is);
  assert.match(canonical, /ordinary\s+user-provided context/i);

  const entryPoints = [
    '.codex/rules.md',
    'AGENTS.md',
    'FAQ.md',
    'README.md',
    'docs/loop-engineering.md',
    'skills/fb-lane-coordination/SKILL.md',
    'skills/project-coordination-setup/SKILL.md',
    'skills/quickstart/SKILL.md',
    'templates/AGENTS.md',
    'templates/PROJECT_BOARD.md',
    'plugins/fb-lane-coordination/README.md',
    'plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md',
    'plugins/fb-lane-coordination/skills/bfm/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane/SKILL.md',
    'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-product/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-tech/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-design/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-business/SKILL.md'
  ];
  for (const relativePath of entryPoints) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    if (!source.includes('sidechat-parent-thread-routing.md')) {
      assert.match(source, /(?:docs\/)?fb\/guardrails\.md/, `${relativePath} must route sidechat policy through the harness`);
      continue;
    }
    assert.match(source, /sidechat-parent-thread-routing\.md/, `${relativePath} must link to the canonical rule`);
    assert.match(source, /only to its (?:originating )?parent|only eligible destination|originating parent main thread/i, `${relativePath} must forbid non-parent delivery`);
    assert.match(source, /ordinary user-provided context/i, `${relativePath} must protect non-parent receiving threads`);
    assert.doesNotMatch(source, /paste-ready prompt for the main Product\/BFM thread/i, `${relativePath} must not choose a destination by Product/BFM role`);
  }
});

test('documents the verification handoff and recovery contract across source, package, and bootstrap', () => {
  const repoRoot = process.cwd();
  const scorecards = [
    'docs/evals/agent-behavior-scorecard-template.md',
    'templates/docs/evals/agent-behavior-scorecard-template.md',
    'plugins/fb-lane-coordination/docs/evals/agent-behavior-scorecard-template.md'
  ];
  for (const relativePath of scorecards) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /## Verification Handoff/, `${relativePath} must include the verification handoff checklist`);
    assert.match(source, /Test plan.*link/i, `${relativePath} must require a test plan link`);
    assert.match(source, /Next Product\/BFM recovery action/i, `${relativePath} must require the next recovery action`);
  }

  const entryPoints = [
    'AGENTS.md',
    '.codex/rules.md',
    'templates/AGENTS.md',
    'skills/fb-lane-coordination/SKILL.md',
    'skills/project-coordination-setup/SKILL.md',
    'plugins/fb-lane-coordination/skills/bfm/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-product/SKILL.md',
    'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md'
  ];
  for (const relativePath of entryPoints) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    if (!source.match(/Verification Handoff/i) || !source.match(/next Product\/BFM recovery action/i)) {
      assert.match(source, /(?:docs\/)?fb\/evidence\.md/, `${relativePath} must route verification guidance through the harness`);
      continue;
    }
    assert.match(source, /Verification Handoff/i, `${relativePath} must direct Product/BFM to the verification handoff`);
    assert.match(source, /next Product\/BFM recovery action/i, `${relativePath} must require agent-owned recovery`);
  }

  for (const relativePath of ['tools/fb-lane.cjs', 'plugins/fb-lane-coordination/tools/fb-lane.cjs']) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /docs\/fb\/evidence\.md/, `${relativePath} must generate the verification route`);
    assert.match(source, /docs\/fb\/guardrails\.md/, `${relativePath} must generate the recovery route`);
  }
});

test('documents the completed bootstrap and v2 review-authoring contract across source and package', () => {
  const repoRoot = process.cwd();
  const setupSkills = [
    'skills/project-coordination-setup/SKILL.md',
    'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md'
  ];
  for (const relativePath of setupSkills) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /bootstrap (?:installs|copies) the canonical ten-page (?:FB harness|\[FB harness\]\([^)]*\))\s*pack/i, `${relativePath} must describe the completed pack install`);
    assert.match(source, /thin managed route/i, `${relativePath} must describe thin managed routes`);
    assert.match(source, /preserv(?:e|es|ing) project-owned text/i, `${relativePath} must preserve project-owned text`);
    assert.match(source, /fb-harness-route-start.*fb-harness-route-end/is, `${relativePath} must name the managed replacement boundary`);
    assert.doesNotMatch(source, /does not yet install this pack|Task 2 owns that migration/i, `${relativePath} must not retain pre-migration setup guidance`);
  }

  const evidencePages = [
    'docs/fb/evidence.md',
    'plugins/fb-lane-coordination/docs/fb/evidence.md'
  ];
  for (const relativePath of evidencePages) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /fb_harness:\s*v2/, `${relativePath} must document the v2 opt-in marker`);
    assert.match(source, /not reviewable.*runnable sandbox.*staging candidate.*completed build/is, `${relativePath} must list every exact Review state`);
    assert.match(source, /Project Start Brief.*Build Brief/is, `${relativePath} must require both approved initial briefs`);
    assert.match(source, /historical|non-v2/i, `${relativePath} must document the non-v2 exemption`);
    assert.match(source, /not reviewable[\s\S]*exempt|exempt[\s\S]*not reviewable/i, `${relativePath} must document the planning-only exemption`);
    assert.match(source, /relative to the handoff/i, `${relativePath} must document local-link resolution`);
    assert.match(source, /remote[\s\S]*Markdown-link shape/i, `${relativePath} must document remote-link validation`);
    assert.match(source, /Blocked — no review environment yet[\s\S]*Next Product\/BFM action/is, `${relativePath} must document blocked missing access`);
  }
});

test('all nine active Task-1 contract surfaces keep exact progress and blocked wording', () => {
  const repoRoot = process.cwd();
  const startGuide = fs.readFileSync(path.join(repoRoot, 'docs', 'fb', 'start.md'), 'utf8');
  assert.match(startGuide, new RegExp(`\\*\\*Progress:\\*\\* ${exactProgress}`), 'docs/fb/start.md must keep the exact approved progress wording');
  const activeContractSurfaces = [
    'plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-product/SKILL.md',
    'plugins/fb-lane-coordination/skills/bfm/SKILL.md',
    'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md',
    'README.md',
    'FAQ.md',
    'platforms/codex/README.md',
    'plugins/fb-lane-coordination/README.md',
    'docs/loop-engineering.md'
  ];

  for (const relativePath of activeContractSurfaces) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /(?:docs\/)?fb\/start\.md/, `${relativePath} must route first-project guidance to the canonical harness page`);
  }
});

test('publishes one beginner interaction contract across root, package, skills, and examples', () => {
  const repoRoot = process.cwd();
  const canonicalStart = fs.readFileSync(path.join(repoRoot, 'docs/fb/start.md'), 'utf8');
  const packagedStart = fs.readFileSync(path.join(repoRoot, 'plugins/fb-lane-coordination/docs/fb/start.md'), 'utf8');
  assertExactFirstProjectContract('docs/fb/start.md', canonicalStart);
  assertExactFirstProjectContract('plugins/fb-lane-coordination/docs/fb/start.md', packagedStart);

  const activeEntryPoints = [
    'docs/fb/README.md',
    'docs/fb/workflow.md',
    'docs/fb/evidence.md',
    'README.md',
    'FAQ.md',
    'platforms/codex/README.md',
    'plugins/fb-lane-coordination/README.md',
    'examples/my-app/AGENTS.md',
    'skills/fb-lane-coordination/SKILL.md',
    'skills/project-coordination-setup/SKILL.md',
    'skills/quickstart/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-product/SKILL.md',
    'plugins/fb-lane-coordination/skills/bfm/SKILL.md',
    'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md'
  ];
  for (const relativePath of activeEntryPoints) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.doesNotMatch(source, /Build Flow Manager/i, `${relativePath} must not use the retired beginner-facing expansion`);
    assert.match(source, /(?:docs\/fb\/|\.\.\/\.\.\/docs\/fb\/)?start\.md/, `${relativePath} must route beginner guidance to start.md`);
    assert.match(source, /\$bfm|Build\s+For\s+Me\s+\(BFM\)/, `${relativePath} must route the BFM boundary`);
  }
  assert.doesNotMatch(fs.readFileSync(path.join(repoRoot, 'docs/fb/README.md'), 'utf8'), /Product\/Build For Me/i, 'docs/fb/README.md must not combine Product planning with Build For Me execution');

  for (const relativePath of ['tools/fb-lane.cjs', 'plugins/fb-lane-coordination/tools/fb-lane.cjs']) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.doesNotMatch(source, /\bfirstProjectContract\b/, `${relativePath} must not retain the stale inline first-project contract`);
    assert.doesNotMatch(source, /Build Flow Manager/i, `${relativePath} must use Build For Me terminology`);
    assertPublicRouteContract(relativePath, source);
  }
});

test('active operational lock guidance always opts into status details', () => {
  const repoRoot = process.cwd();
  const lockGuides = [
    'plugins/fb-lane-coordination/skills/fb-tech/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-design/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-business/SKILL.md',
    'examples/my-app/.codex/rules.md',
  ];
  for (const relativePath of lockGuides) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /node tools\/fb-lane\.cjs status --details/, `${relativePath} must use CLI details for lock inspection`);
    assert.match(source, /fb_lane_status\(\{details:true\}\)/, `${relativePath} must use MCP details for lock inspection`);
    assert.doesNotMatch(source, /(?:locks with|tasks and locks)[^\n]*`(?:fb_lane_status|node tools\/fb-lane\.cjs status)`/i, `${relativePath} must not claim default status exposes locks`);
  }

  for (const relativePath of [
    'skills/fb-lane-coordination/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md',
  ]) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /node tools\/fb-lane\.cjs status` for state/, `${relativePath} must preserve default status for ordinary health`);
  }
});

test('example AGENTS beginner-contract link resolves to the canonical in-repo page', () => {
  const repoRoot = process.cwd();
  const relativePath = 'examples/my-app/AGENTS.md';
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const link = source.match(/\[docs\/fb\/start\.md\]\(([^)]+)\)/);
  assert.ok(link, `${relativePath} must link the beginner contract`);
  const resolved = path.resolve(path.dirname(path.join(repoRoot, relativePath)), link[1]);
  assert.ok(fs.existsSync(resolved), `${relativePath} beginner-contract link must resolve in-repo`);
  assert.strictEqual(resolved, path.join(repoRoot, 'docs', 'fb', 'start.md'));
  assert.ok(!fs.existsSync(path.join(repoRoot, 'examples', 'my-app', 'docs', 'fb')), 'example must not copy a redundant harness pack');
});

test('bootstrap defaults to Codex-only output', () => {
  assertCodexBootstrap([]);
});

test('bootstrap accepts --platform codex', () => {
  assertCodexBootstrap(['--platform', 'codex']);
});

test('bootstrap accepts --codex-only', () => {
  assertCodexBootstrap(['--codex-only']);
});

for (const platform of ['all', 'claude', 'claude-code', 'antigravity']) {
  test(`bootstrap rejects --platform ${platform} without writing files`, () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-rejected-platform-'));
    try {
      assert.throws(
        () => execFileSync('node', [cliPath, 'bootstrap', '--platform', platform], {
          cwd: root,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe']
        }),
        (error) => {
          assert.match(error.stderr, /Invalid platform/);
          assert.match(error.stderr, /paused; collaborators welcome/);
          assert.match(error.stderr, /docs\/paused-integrations\.md/);
          return true;
        }
      );
      assert.deepStrictEqual(fs.readdirSync(root), [], 'rejected bootstrap must leave its temp directory empty');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
}

test('CLI source contains no stale non-Codex runtime or claim guidance', () => {
  const source = fs.readFileSync(cliPath, 'utf8');
  assert.doesNotMatch(source, /\b(?:includeClaude|includeAntigravity|agentConfigs)\b/);
  assert.doesNotMatch(source, /(?:Create Antigravity agent config|Create Claude Code lane subagents|claudeAgentsDir)/);
  assert.doesNotMatch(source, /CLAUDE_PROJECT_DIR/);
  assert.doesNotMatch(source, /&& claude/);
  assert.doesNotMatch(source, /Claude Code/);
});

test('repository contains no legacy runtime or configuration entry points', () => {
  let root = __dirname;
  while (!fs.existsSync(path.join(root, 'tools', 'fb-lane.validate.cjs'))) {
    const parent = path.dirname(root);
    assert.notStrictEqual(parent, root, 'could not find repository root');
    root = parent;
  }

  for (const legacyPath of ['.mcp.json', 'tools/run_lane.py', 'CLAUDE.md', 'templates/CLAUDE.md']) {
    assert.ok(!fs.existsSync(path.join(root, legacyPath)), `expected ${legacyPath} to be absent`);
  }
});

test('active Codex guides and demo use only the Codex bootstrap contract', () => {
  let root = __dirname;
  while (!fs.existsSync(path.join(root, 'tools', 'fb-lane.validate.cjs'))) {
    const parent = path.dirname(root);
    assert.notStrictEqual(parent, root, 'could not find repository root');
    root = parent;
  }

  const activeCodexPaths = [
    'docs/loop-engineering.md',
    'docs/setup.md',
    'platforms/codex/README.md',
    'plugins/fb-lane-coordination/README.md',
    'examples/my-app/README.md',
    'codex-lane-demo/AGENTS.md',
  ];
  for (const relativePath of activeCodexPaths) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    assert.doesNotMatch(source, /\b(?:Claude(?: Code)?|Antigravity)\b/i, `${relativePath} must be Codex-only`);
    assert.doesNotMatch(source, /\b(?:project\s+)?MCP\s+config(?:uration)?\b/i, `${relativePath} must not promise project MCP configuration`);
  }
  assert.ok(!fs.existsSync(path.join(root, 'codex-lane-demo', 'CLAUDE.md')), 'expected demo Claude instructions to be absent');
});

test('doctor does not require project MCP configuration', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 0);
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.doesNotMatch(output, /project MCP config|\.mcp\.json/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor warns when many handoffs have no index', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 1);
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.match(output, /Handoff index/);
    assert.match(output, /docs\/handoffs\/index\.md/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor warns when index lacks dependency gate columns', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'index.md'), `---
type: fb-lane-handoff-index
status: active
---

# Handoff Index

| Task / Topic | Lane | Status | Fit | Detail |
|---|---|---|---|---|
| TASK-001 | FB-Tech | Ready | aligned | [TASK-001.md](TASK-001.md) |
`);
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.match(output, /old-style/);
    assert.match(output, /Depends \/ Blocks \/ Gate/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor accepts non-quick handoffs with compact index columns', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 4);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'index.md'), `---
type: fb-lane-handoff-index
status: active
---

# Handoff Index

| Task / Topic | Lane | Status | Depends / Blocks / Gate | Checks / Evidence | Detail |
|---|---|---|---|---|---|
| TASK-001 | FB-Tech | Ready | Product gate | Doctor fixture | [TASK-001.md](TASK-001.md) |
`);
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.match(output, /Handoff index/);
    assert.doesNotMatch(output, /Missing docs\/handoffs\/index\.md/);
    assert.doesNotMatch(output, /old-style/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor does not require an index for quick-only handoffs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-doctor-'));
  try {
    writeDoctorFixture(root, 0);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-Q-1234.md'), '# quick\n');
    const output = execFileSync('node', [cliPath, 'doctor'], { cwd: root, encoding: 'utf8' });
    assert.match(output, /Handoff lookup is present or not needed yet/);
    assert.doesNotMatch(output, /Missing docs\/handoffs\/index\.md/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

console.log('harness-v2 review evidence');
test('doctor accepts an approved v2 initial handoff with briefs and a resolvable local review link', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.mkdirSync(path.join(root, 'docs', 'handoffs', 'review'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'review', 'sandbox.html'), '<p>review</p>');
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
      approvedV2Handoff('runnable sandbox', completeReviewPacket('review/sandbox.html'))
    );

    const result = runDoctor(root);
    assert.strictEqual(result.status, 0, result.stdout || result.stderr);
    assert.doesNotMatch(result.stdout, /❌ Review evidence/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor accepts every v2 reviewable state with a complete review packet', () => {
  const fixtures = [
    ['runnable sandbox', 'review/sandbox.html', true],
    ['staging candidate', 'https://review.example.test/staging', false],
    ['completed build', 'review/build.html', true],
  ];

  for (const [reviewState, link, needsLocalFile] of fixtures) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
    try {
      writeDoctorFixture(root, 1);
      if (needsLocalFile) {
        fs.mkdirSync(path.join(root, 'docs', 'handoffs', 'review'), { recursive: true });
        fs.writeFileSync(path.join(root, 'docs', 'handoffs', link), '<p>review</p>');
      }
      fs.writeFileSync(
        path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
        approvedV2Handoff(reviewState, completeReviewPacket(link))
      );

      const result = runDoctor(root);
      assert.strictEqual(result.status, 0, `${reviewState}: ${result.stdout || result.stderr}`);
      assert.doesNotMatch(result.stdout, /❌ Review evidence/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('doctor blocks an approved v2 initial handoff missing either required brief', () => {
  for (const heading of ['Project Start Brief', 'Build Brief']) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
    try {
      writeDoctorFixture(root, 1);
      const sectionPattern = new RegExp(`\\n## ${heading}[\\s\\S]*?(?=\\n## )`);
      fs.writeFileSync(
        path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
        approvedV2Handoff('runnable sandbox', completeReviewPacket('https://review.example.test/sandbox'))
          .replace(sectionPattern, '\n')
      );

      const result = runDoctor(root);
      assert.strictEqual(result.status, 1, `${heading}: ${result.stdout || result.stderr}`);
      assert.match(result.stdout, /Project Start Brief and Build Brief/);
      assert.match(result.stdout, new RegExp(heading));
      assert.match(result.stdout, /Add both required sections/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('doctor blocks incomplete v2 review packets with an actionable Test This Now result', () => {
  const fixtures = [
    ['missing section', '', /Outcome type/],
    ['empty outcome', completeReviewPacket('https://review.example.test/staging').replace('Reviewable fixture', ''), /Outcome type/],
    ['plain URL', completeReviewPacket('https://review.example.test/staging').replace('[Open the review surface](https://review.example.test/staging)', 'https://review.example.test/staging'), /Markdown direct link/],
  ];

  for (const [label, packet, expectedMissing] of fixtures) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
    try {
      writeDoctorFixture(root, 1);
      fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-001.md'), approvedV2Handoff('staging candidate', packet));

      const result = runDoctor(root);
      assert.strictEqual(result.status, 1, `${label}: ${result.stdout || result.stderr}`);
      assert.match(result.stdout, /Review evidence/);
      assert.match(result.stdout, /Test This Now/);
      assert.match(result.stdout, expectedMissing);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('doctor blocks a v2 review packet whose exact steps field is empty even when another numbered line exists', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    const packet = completeReviewPacket('https://review.example.test/staging')
      .replace(
        '- **Exact steps and expectations:**\n  1. Open the direct link.\n  2. Confirm the review surface loads and shows the fixture result.',
        '- **Exact steps and expectations:**'
      )
      .replace(
        '- **Known limits:** This fixture has no external service coverage.',
        '- **Known limits:** This fixture has no external service coverage.\n1. Unrelated numbered note.'
      );
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
      approvedV2Handoff('staging candidate', packet)
    );

    const result = runDoctor(root);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(result.stdout, /Review evidence/);
    assert.match(result.stdout, /Exact steps and expectations/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor blocks placeholder-only values in required v2 review fields', () => {
  const fixtures = [
    ['angle-bracket outcome', 'Reviewable fixture', '<what is ready to assess>', /Outcome type/],
    ['example direct links', '[Open the review surface](https://review.example.test/staging)', 'example', /Direct links/],
    ['TODO pass criteria', 'The fixture result is visible without an error.', 'TODO', /Pass criteria/],
    ['TBD known limits', 'This fixture has no external service coverage.', 'TBD', /Known limits/],
    ['placeholder failure format', 'What happened; what was expected; direct link or screenshot; environment.', 'placeholder', /Failure-report format/],
  ];

  for (const [label, currentValue, placeholderValue, expectedMissing] of fixtures) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
    try {
      writeDoctorFixture(root, 1);
      const packet = completeReviewPacket('https://review.example.test/staging')
        .replace(currentValue, placeholderValue);
      fs.writeFileSync(
        path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
        approvedV2Handoff('staging candidate', packet)
      );

      const result = runDoctor(root);
      assert.strictEqual(result.status, 1, `${label}: ${result.stdout || result.stderr}`);
      assert.match(result.stdout, /Review evidence/);
      assert.match(result.stdout, expectedMissing);
      assert.match(result.stdout, /actionable/i);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('doctor blocks placeholder-only numbered steps in v2 review evidence', () => {
  for (const placeholderStep of ['1. TODO', '1. <action>']) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
    try {
      writeDoctorFixture(root, 1);
      const packet = completeReviewPacket('https://review.example.test/staging')
        .replace(
          '  1. Open the direct link.\n  2. Confirm the review surface loads and shows the fixture result.',
          `  ${placeholderStep}`
        );
      fs.writeFileSync(
        path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
        approvedV2Handoff('staging candidate', packet)
      );

      const result = runDoctor(root);
      assert.strictEqual(result.status, 1, `${placeholderStep}: ${result.stdout || result.stderr}`);
      assert.match(result.stdout, /Review evidence/);
      assert.match(result.stdout, /actionable numbered exact steps/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('doctor blocks v2 review packets whose local Markdown direct link does not resolve', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
      approvedV2Handoff('completed build', completeReviewPacket('review/missing-build.html'))
    );

    const result = runDoctor(root);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(result.stdout, /Local Markdown direct link\(s\) do not resolve/);
    assert.match(result.stdout, /review\/missing-build\.html/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor treats missing v2 review access as the explicit blocked environment state', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
      approvedV2Handoff('staging candidate', `
## Test This Now

Blocked — no review environment yet
Next Product/BFM action: create the staging review environment and add its direct link.
`)
    );

    const result = runDoctor(root);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(result.stdout, /Blocked — no review environment yet/);
    assert.match(result.stdout, /Next Product\/BFM action/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor requires an actionable Product/BFM next action for blocked v2 review access', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
      approvedV2Handoff('staging candidate', `
## Test This Now

Blocked — no review environment yet
Next Product/BFM action:
`)
    );

    const result = runDoctor(root);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(result.stdout, /Test This Now is incomplete/);
    assert.match(result.stdout, /Next Product\/BFM action/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor rejects a placeholder-only Product/BFM next action for blocked v2 review access', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'TASK-001.md'),
      approvedV2Handoff('staging candidate', `
## Test This Now

Blocked — no review environment yet
Next Product/BFM action: TBD
`)
    );

    const result = runDoctor(root);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(result.stdout, /Test This Now is incomplete/);
    assert.match(result.stdout, /Next Product\/BFM action/);
    assert.match(result.stdout, /actionable/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor keeps planning-only v2 and historical handoffs exempt from review evidence', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-001.md'), `---
fb_harness: v2
Review state: not reviewable
---

# Planning-only v2 handoff
`);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-LEGACY.md'), '# Historical handoff\n');

    const result = runDoctor(root);
    assert.strictEqual(result.status, 0, result.stdout || result.stderr);
    assert.doesNotMatch(result.stdout, /❌ Review evidence/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor rejects v2 review states outside the four visible values', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-lane-v2-review-'));
  try {
    writeDoctorFixture(root, 1);
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-001.md'), approvedV2Handoff('waiting on QA'));

    const result = runDoctor(root);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(result.stdout, /Review state/);
    assert.match(result.stdout, /not reviewable.*runnable sandbox.*staging candidate.*completed build/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

console.log(`\n✅ ${passed} checks passed.`);
