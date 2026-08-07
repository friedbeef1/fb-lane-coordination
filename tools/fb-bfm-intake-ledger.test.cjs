#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { execFileSync, spawnSync } = require('node:child_process');

const {
  freezeBfmIntake,
  gateBfmExecutionStart,
  renderBfmIntakeLedger,
} = require('./fb-lane.cjs');

const ROLE_ORDER = ['User', 'Business', 'Design', 'Tech', 'Discovery', 'Bugs', 'Product/BFM'];
const ROLE_FILES = {
  User: 'fb-user.md',
  Business: 'fb-business.md',
  Design: 'fb-design.md',
  Tech: 'fb-tech.md',
  Discovery: 'fb-discovery.md',
  Bugs: 'fb-bugs.md',
  'Product/BFM': 'fb-product.md',
};

function handoff({ task, lane, status = 'ready', disposition = '', dependsOn = '', approvalGate = '', externalBlocker = '' }) {
  return `---
type: fb-lane-handoff
task: ${task}
lane: ${lane}
status: ${status}
${disposition ? `disposition: ${disposition}\n` : ''}${dependsOn ? `depends_on: ${dependsOn}\n` : ''}${approvalGate ? `approval_gate: ${approvalGate}\n` : ''}${externalBlocker ? `external_blocker: ${externalBlocker}\n` : ''}---
# ${task}
`;
}

function board(tasks = []) {
  const rows = tasks.map(task =>
    `| ${task.id} | ${task.status || 'In Progress'} | ${task.owner || `FB-${task.role}`} | Test | ${task.id} scope | ${task.locks || '(None)'} | [Handoff](docs/handoffs/${task.file}) |`
  ).join('\n');
  return `# Project Board

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
${rows}
`;
}

function makeFixture(candidates = [], options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-ledger-'));
  fs.mkdirSync(path.join(root, '.git'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'handoffs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'workstreams'), { recursive: true });
  const boardTasks = candidates.map(candidate => ({
    id: candidate.task,
    role: candidate.role,
    file: candidate.file,
    locks: candidate.locks,
    status: candidate.boardStatus,
  })).concat(options.extraBoardTasks || []);
  fs.writeFileSync(path.join(root, 'PROJECT_BOARD.md'), board(boardTasks));
  const indexRows = candidates.map(candidate =>
    `| ${candidate.task} | ${candidate.role} | Ready | [${candidate.file}](${candidate.file}) |`
  ).join('\n');
  fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'index.md'), `# Handoff Index\n\n${indexRows}\n`);
  for (const role of ROLE_ORDER) {
    const roleTasks = candidates.filter(candidate => candidate.role === role).map(candidate => candidate.task);
    fs.writeFileSync(
      path.join(root, 'docs', 'workstreams', ROLE_FILES[role]),
      `# ${role}\n\n${roleTasks.length ? roleTasks.join('\n') : 'None relevant'}\n`
    );
  }
  for (const candidate of candidates) {
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', candidate.file), handoff({
      task: candidate.task,
      lane: candidate.lane,
      disposition: candidate.disposition,
      dependsOn: candidate.dependsOn,
      approvalGate: candidate.approvalGate,
      externalBlocker: candidate.externalBlocker,
    }));
  }
  return root;
}

function remove(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

function dispositionsFor(candidates, values) {
  return Object.fromEntries(candidates.map((candidate, index) => [candidate.task, values[index]]));
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function initGitFixture(root) {
  fs.rmSync(path.join(root, '.git'), { recursive: true, force: true });
  execFileSync('git', ['init', '-b', 'main', root], { stdio: 'ignore' });
  git(root, ['config', 'user.name', 'FB Test']);
  git(root, ['config', 'user.email', 'fb-test@example.invalid']);
  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'fixture']);
}

test('complete empty intake proves all six None relevant and separates Product/BFM', () => {
  const root = makeFixture();
  try {
    const ledger = freezeBfmIntake(root, { dispositions: {} });
    assert.deepEqual(ledger.roles.map(role => role.role), ROLE_ORDER);
    assert.equal(ledger.emptyQueueProven, true);
    assert.equal(ledger.candidates.length, 0);
    for (const role of ledger.roles.slice(0, 6)) {
      assert.equal(role.candidateCount, 0);
      assert.equal(role.summary, 'None relevant');
    }
    assert.deepEqual(ledger.roles.at(-1), {
      role: 'Product/BFM',
      candidateCount: 0,
      summary: 'Control centre — not an evidence workstream',
      candidates: [],
    });
    const rendered = renderBfmIntakeLedger(ledger);
    let previous = -1;
    for (const role of ROLE_ORDER) {
      const position = rendered.indexOf(`${role}:`);
      assert.ok(position > previous, `${role} must render in canonical order`);
      previous = position;
    }
    assert.match(rendered, /Empty queue proof: complete/);
  } finally {
    remove(root);
  }
});

test('every candidate receives exactly one allowed disposition with hash-bound routing state', () => {
  const candidates = [
    { task: 'USER-1', role: 'User', lane: 'fb-user', file: 'user.md' },
    { task: 'BUSINESS-1', role: 'Business', lane: 'fb-business', file: 'business.md' },
    { task: 'DESIGN-1', role: 'Design', lane: 'fb-design', file: 'design.md' },
    { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'tech.md' },
    { task: 'DISCOVERY-1', role: 'Discovery', lane: 'fb-discovery', file: 'discovery.md' },
    { task: 'BUGS-1', role: 'Bugs', lane: 'fb-bugs', file: 'bugs.md' },
  ];
  const allowed = ['Include now', 'Blocked', 'Deferred', 'Duplicate', 'Rejected', 'Superseded'];
  const root = makeFixture(candidates);
  try {
    const ledger = freezeBfmIntake(root, { dispositions: dispositionsFor(candidates, allowed) });
    assert.deepEqual(ledger.candidates.map(candidate => candidate.disposition), allowed);
    assert.ok(ledger.candidates.every(candidate => /^[a-f0-9]{64}$/.test(candidate.sha256)));
    assert.ok(ledger.candidates.every(candidate => /^[a-f0-9]{64}$/.test(candidate.routingSha256)));
    assert.deepEqual(ledger.recommendedOrder, ['USER-1']);
    const userRouting = ledger.candidates.find(candidate => candidate.task === 'USER-1').routingSha256;
    fs.appendFileSync(path.join(root, 'docs', 'workstreams', 'fb-user.md'), '\nRouting state changed.\n');
    const changed = freezeBfmIntake(root, { dispositions: dispositionsFor(candidates, allowed) });
    assert.notEqual(
      changed.candidates.find(candidate => candidate.task === 'USER-1').routingSha256,
      userRouting,
      'the frozen routing digest must bind the workstream-card state',
    );
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { ...dispositionsFor(candidates, allowed), 'EXTRA-1': 'Deferred' } }),
      /BFM_DISPOSITION_INCOMPLETE.*EXTRA-1/
    );
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { ...dispositionsFor(candidates, allowed), 'USER-1': 'Maybe' } }),
      /BFM_DISPOSITION_INCOMPLETE.*USER-1/
    );
  } finally {
    remove(root);
  }
});

test('hidden Ready work and incomplete board/index/card inventory fail closed', () => {
  const candidate = { task: 'DESIGN-1', role: 'Design', lane: 'fb-design', file: 'design.md' };
  const root = makeFixture([candidate]);
  try {
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'hidden.md'), '# Hidden\n\n**Status:** Ready for Product intake\n');
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'DESIGN-1': 'Include now' } }),
      /READINESS_FALSE_NEGATIVE.*hidden\.md/
    );
    fs.rmSync(path.join(root, 'docs', 'handoffs', 'hidden.md'));
    fs.rmSync(path.join(root, 'docs', 'workstreams', 'fb-design.md'));
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'DESIGN-1': 'Include now' } }),
      /BFM_INTAKE_INCOMPLETE.*Design/
    );
  } finally {
    remove(root);
  }
});

test('same-filename drift and inaccessible former roots remain canonical scanner failures', () => {
  const candidate = { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'same.md' };
  const root = makeFixture([candidate]);
  const former = makeFixture([candidate]);
  try {
    fs.writeFileSync(path.join(former, 'docs', 'handoffs', 'same.md'), handoff({ task: 'TECH-1', lane: 'fb-tech' }) + 'drift\n');
    fs.writeFileSync(path.join(root, '.git', 'fb-handoff-audit-roots'), `${former}\n`);
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'TECH-1': 'Include now' } }),
      /HANDOFF_CONTENT_DRIFT.*same\.md/
    );
    fs.writeFileSync(path.join(root, '.git', 'fb-handoff-audit-roots'), `${path.join(root, 'missing-root')}\n`);
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'TECH-1': 'Include now' } }),
      /READINESS_AUDIT_INCOMPLETE.*missing-root/
    );
  } finally {
    remove(root);
    remove(former);
  }
});

test('cross-root routing drift requires a receipt bound to canonical and source routing hashes', () => {
  const candidate = { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'same.md' };
  const root = makeFixture([candidate]);
  const former = makeFixture([candidate]);
  try {
    fs.appendFileSync(path.join(former, 'docs', 'workstreams', 'fb-tech.md'), '\nFormer-root route changed.\n');
    fs.writeFileSync(path.join(root, '.git', 'fb-handoff-audit-roots'), `${former}\n`);
    const source = fs.readFileSync(path.join(root, 'docs', 'handoffs', 'same.md'));
    fs.writeFileSync(path.join(root, '.git', 'fb-checkout-migration.json'), `${JSON.stringify({
      version: 1,
      canonicalPath: root,
      checkouts: { [root]: { state: 'active' } },
      taskRebind: { status: 'complete', pending: [] },
      unresolvedDrift: [],
      routingReceipts: {
        'docs/handoffs/same.md': {
          canonicalSha256: crypto.createHash('sha256').update(source).digest('hex'),
          sources: [{ root: former, sha256: crypto.createHash('sha256').update(source).digest('hex') }],
          disposition: 'canonical-routing-retained',
        },
      },
    })}\n`);
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'TECH-1': 'Include now' } }),
      /HANDOFF_ROUTING_DRIFT[\s\S]*canonicalRoutingSha256[\s\S]*routingSha256/
    );
  } finally {
    remove(root);
    remove(former);
  }
});

test('missing linked worktrees and their required routing surfaces fail closed', () => {
  const root = makeFixture();
  const linked = `${fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-ledger-linked-parent-'))}-worktree`;
  try {
    initGitFixture(root);
    git(root, ['worktree', 'add', '-b', 'audit-linked', linked]);
    fs.rmSync(linked, { recursive: true, force: true });
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: {} }),
      /READINESS_AUDIT_INCOMPLETE[\s\S]*linked-parent-[^\s]*-worktree/
    );
  } finally {
    remove(linked);
    remove(root);
  }
});

test('routing requires one coherent exact task and filename entry per authoritative surface', () => {
  const candidate = { task: 'TASK-1', role: 'User', lane: 'fb-user', file: 'task-1.md' };
  const root = makeFixture([candidate]);
  try {
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'index.md'),
      '# Handoff Index\n\n| Task | Lane | Status | Detail |\n|---|---|---|---|\n| TASK-10 | User | Ready | [task-1.md](task-1.md) |\n'
    );
    fs.writeFileSync(path.join(root, 'docs', 'workstreams', 'fb-user.md'), '# User\n\nTASK-10\n');
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'TASK-1': 'Include now' } }),
      /BFM_INTAKE_INCOMPLETE[\s\S]*exact[\s\S]*TASK-1/
    );
  } finally {
    remove(root);
  }
});

test('noncanonical checkout cannot freeze BFM intake', () => {
  const root = makeFixture();
  const canonical = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-ledger-canonical-'));
  try {
    const manifest = {
      version: 1,
      canonicalPath: canonical,
      checkouts: {
        [canonical]: { state: 'active' },
        [root]: { state: 'quarantined' },
      },
      taskRebind: { status: 'complete', pending: [] },
      routingReceipts: {},
      unresolvedDrift: [],
    };
    fs.writeFileSync(path.join(root, '.git', 'fb-checkout-migration.json'), `${JSON.stringify(manifest)}\n`);
    assert.throws(() => freezeBfmIntake(root, { dispositions: {} }), /FB_CHECKOUT_NOT_CANONICAL/);
  } finally {
    remove(root);
    remove(canonical);
  }
});

test('dependency and lock conflicts serialize Include-now work and expose gates', () => {
  const candidates = [
    {
      task: 'USER-1', role: 'User', lane: 'fb-user', file: 'user.md', dependsOn: 'DESIGN-1',
      locks: '`shared.css`', approvalGate: 'privacy review',
    },
    {
      task: 'BUSINESS-1', role: 'Business', lane: 'fb-business', file: 'business.md',
      locks: '`shared.css`', externalBlocker: 'vendor decision',
    },
    { task: 'DESIGN-1', role: 'Design', lane: 'fb-design', file: 'design.md', locks: '`design.css`' },
    { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'tech.md', locks: '`server.js`' },
  ];
  const root = makeFixture(candidates, {
    extraBoardTasks: [{
      id: 'ACTIVE-1', role: 'Tech', file: 'active.md', locks: '`server.js`', status: 'In Progress',
    }],
  });
  try {
    const dispositions = dispositionsFor(candidates, ['Include now', 'Include now', 'Include now', 'Include now']);
    const ledger = freezeBfmIntake(root, { dispositions });
    assert.ok(ledger.recommendedOrder.indexOf('DESIGN-1') < ledger.recommendedOrder.indexOf('USER-1'));
    assert.ok(ledger.recommendedWaves.every(wave => !(wave.includes('USER-1') && wave.includes('BUSINESS-1'))));
    assert.deepEqual(ledger.approvalGates, [{ task: 'USER-1', gate: 'privacy review' }]);
    assert.deepEqual(ledger.externalBlockers, [
      { task: 'BUSINESS-1', blocker: 'vendor decision' },
      { task: 'TECH-1', blocker: 'Lock server.js is active in ACTIVE-1' },
    ]);
    assert.ok(ledger.activeLocks.some(lock => lock.path === 'server.js' && lock.tasks.includes('ACTIVE-1')));
    const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'docs', 'handoffs', 'user.md'))).digest('hex');
    assert.equal(ledger.candidates.find(candidate => candidate.task === 'USER-1').sha256, digest);
  } finally {
    remove(root);
  }
});

test('the existing BFM claim path gates before mutation and emits the frozen ledger on success', () => {
  const blockedCandidate = { task: 'TASK-1', role: 'Tech', lane: 'fb-tech', file: 'task-1.md', boardStatus: 'Ready' };
  const blockedRoot = makeFixture([blockedCandidate]);
  const runtimePath = path.join(__dirname, 'fb-lane.cjs');
  try {
    const before = fs.readFileSync(path.join(blockedRoot, 'PROJECT_BOARD.md'), 'utf8');
    const blocked = spawnSync(
      process.execPath,
      [runtimePath, 'claim', 'TASK-1', 'bfm', '(None)', '--no-worktree'],
      { cwd: blockedRoot, encoding: 'utf8' }
    );
    assert.notEqual(blocked.status, 0);
    assert.match(`${blocked.stdout}\n${blocked.stderr}`, /BFM_DISPOSITION_INCOMPLETE|BFM_EXECUTION_BLOCKED/);
    assert.equal(fs.readFileSync(path.join(blockedRoot, 'PROJECT_BOARD.md'), 'utf8'), before);
  } finally {
    remove(blockedRoot);
  }

  const readyCandidate = {
    task: 'TASK-2', role: 'Tech', lane: 'fb-tech', file: 'task-2.md', boardStatus: 'Ready', disposition: 'Include now',
  };
  const readyRoot = makeFixture([readyCandidate]);
  try {
    initGitFixture(readyRoot);
    git(readyRoot, ['remote', 'add', 'origin', readyRoot]);
    const claimed = spawnSync(
      process.execPath,
      [runtimePath, 'claim', 'TASK-2', 'bfm', '(None)', '--no-worktree'],
      { cwd: readyRoot, encoding: 'utf8' }
    );
    assert.equal(claimed.status, 0, `${claimed.stdout}\n${claimed.stderr}`);
    assert.match(claimed.stdout, /BFM intake ledger[\s\S]*Execution gate: open for Include now scope/);
    assert.ok(claimed.stdout.indexOf('BFM intake ledger') < claimed.stdout.indexOf('Switching to main'));
    assert.equal(gateBfmExecutionStart(readyRoot, 'tech'), null);
    const runtime = fs.readFileSync(runtimePath, 'utf8');
    assert.match(runtime, /enum:\s*\[[^\]]*'BFM'/);
  } finally {
    remove(readyRoot);
  }
});
