#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  prepareGraphDrivenBfm,
  renderGraphProjection,
  readGraphProjection,
} = require('./fb-graph-bfm.cjs');

function node(id, type = 'task', state = 'Ready', extra = {}) {
  return {
    id,
    type,
    label: id,
    source: `docs/${id.replace(':', '-')}.md`,
    citation: { source: `docs/${id.replace(':', '-')}.md` },
    activityState: state,
    ...extra,
  };
}

function edge(from, to, type, status = 'confirmed') {
  return {
    from,
    to,
    type,
    status,
    source: 'docs/handoffs/TASK-080.md',
    citation: { source: 'docs/handoffs/TASK-080.md' },
  };
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-graph-bfm-'));
  fs.mkdirSync(path.join(root, 'docs', 'handoffs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'PROJECT_BOARD.md'), '# Board\n');
  fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'TASK-200.md'), `# TASK-200

## Build Brief

Objective: Deliver the approved cache outcome through bounded graph slices.
Approval: Product approved this consolidated scope for scheduler execution.
`);
  return root;
}

function graph() {
  return {
    health: { valid: true, findings: [] },
    nodes: [
      node('task:TASK-200', 'task', 'In Progress', { objective: 'Deliver cache outcome', worktree: 'wt-200', locks: ['integration.js'] }),
      node('task:TASK-201', 'task', 'Ready', { worktree: 'wt-201', locks: ['a.js'] }),
      node('task:TASK-202', 'task', 'Ready', { worktree: 'wt-202', locks: ['b.js'] }),
      node('task:TASK-203', 'task', 'Blocked', { worktree: 'wt-203', locks: ['c.js'] }),
      node('task:TASK-204', 'task', 'Ready', { worktree: 'wt-204', locks: ['d.js'] }),
      node('decision:SCOPE', 'user-decision', 'Unresolved'),
      node('verification:TASK-201', 'verification', 'Ready'),
      node('verification:TASK-202', 'verification', 'Passed'),
    ],
    edges: [
      edge('task:TASK-201', 'verification:TASK-201', 'verified-by'),
      edge('task:TASK-202', 'verification:TASK-202', 'verified-by'),
      edge('task:TASK-204', 'decision:SCOPE', 'conflicts-with', 'unresolved'),
    ],
  };
}

function frozenLedger() {
  const states = new Map([
    ['TASK-200', 'In Progress'],
    ['TASK-201', 'Ready'],
    ['TASK-202', 'Ready'],
    ['TASK-203', 'Blocked'],
    ['TASK-204', 'Ready'],
  ]);
  const candidates = [...states].map(([task, boardStatus]) => ({
    task,
    disposition: 'Include now',
    relative: 'docs/handoffs/TASK-200.md',
    boardStatus,
    dependencies: [],
    locks: [`${task}.js`],
    worktree: `wt-${task.slice('TASK-'.length)}`,
    sensitive: false,
    acceptanceCriteria: [],
    verificationRequirements: [],
    verificationEvidence: null,
    workTypes: [],
    surface: '',
    requiredConditions: [],
    safetyRejections: [],
  }));
  return {
    candidates,
    activeLocks: [],
    approvalGates: [],
    externalBlockers: [],
    recommendedOrder: candidates.map(item => item.task),
    recommendedWaves: [candidates.map(item => item.task)],
    executionAllowed: true,
  };
}

test('requires a recorded consolidated Build Brief before refreshing or scheduling', () => {
  const root = fixture();
  let refreshed = false;
  try {
    assert.throws(() => prepareGraphDrivenBfm(root, {
      taskId: 'TASK-200',
      ledger: frozenLedger(),
      buildBriefPath: 'docs/handoffs/missing.md',
      refreshGraph() { refreshed = true; return { graph: graph() }; },
    }), /Build Brief.*before.*scheduler/i);
    assert.equal(refreshed, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('freezes one graph snapshot, applies Product priority, and emits one integration pass', () => {
  const root = fixture();
  try {
    const result = prepareGraphDrivenBfm(root, {
      taskId: 'TASK-200',
      ledger: frozenLedger(),
      buildBriefPath: 'docs/handoffs/TASK-200.md',
      productPriorities: ['TASK-202', 'TASK-201'],
      refreshGraph: () => ({ graph: graph(), changedSources: [], removedSources: [], reusedSources: [] }),
      changes: [{ nodeId: 'task:TASK-201', kind: 'changed-dependency', source: 'docs/task-TASK-201.md' }],
      writeProjection: true,
    });

    assert.equal(result.mode, 'graph-driven');
    assert.equal(result.graphDrivenSequencing, true);
    assert.equal(result.snapshot.frozen, true);
    assert.equal(result.buildBrief.source, 'docs/handoffs/TASK-200.md');
    assert.deepEqual(result.scheduler.parallelReady.map(item => item.id), ['task:TASK-202', 'task:TASK-201']);
    assert.equal(result.integrationPass.state, 'planned');
    assert.equal(result.integrationPass.count, 0);
    assert.deepEqual(result.integrationPass.taskIds, [
      'task:TASK-200', 'task:TASK-201', 'task:TASK-202', 'task:TASK-203', 'task:TASK-204',
    ]);
    assert.equal(result.handoffs.role, 'queued-product-inputs');
    assert.equal(result.handoffs.executable, false);
    assert.deepEqual(Object.keys(result.projection), [
      'current', 'next', 'blocked', 'deferred', 'conflicts', 'recentlyInvalidated', 'readyToShip',
    ]);
    assert.deepEqual(result.projection.current.map(item => item.id), ['task:TASK-200', 'task:TASK-202', 'task:TASK-201']);
    assert.deepEqual(result.projection.blocked.map(item => item.id), ['task:TASK-203']);
    assert.deepEqual(result.projection.conflicts.map(item => item.task.id), ['task:TASK-204']);
    assert.equal(result.projection.readyToShip.ready, false);
    assert.equal(result.releaseBoundary, 'Ready to ship');
    assert.equal(result.releaseAuthorized, false);
    assert.deepEqual(result.lifecycle, [
      'preflight-route', 'refresh-graph', 'freeze-active-subgraph', 'detect-gaps', 'apply-product-priorities',
      'schedule-bounded-slices', 'execute-ready-slices', 'update-authoritative-records',
      'refresh-graph-after-results', 'stop-at-ready-to-ship',
    ]);
    assert.deepEqual(readGraphProjection(root, { currentGraph: graph() }).projection, result.projection);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('detects missing verification, conflicts, and stale graph findings without inventing proof', () => {
  const root = fixture();
  try {
    const staleGraph = graph();
    staleGraph.health = { valid: true, findings: ['Source fingerprint is stale.'] };
    const result = prepareGraphDrivenBfm(root, {
      taskId: 'TASK-200',
      ledger: frozenLedger(),
      buildBriefPath: 'docs/handoffs/TASK-200.md',
      refreshGraph: () => ({ graph: staleGraph, changedSources: [], removedSources: [], reusedSources: [] }),
    });

    assert.ok(result.findings.some(finding => finding.code === 'missing-authoritative-verification' && finding.taskId === 'task:TASK-203'));
    assert.ok(result.findings.some(finding => finding.code === 'missing-authoritative-verification' && finding.taskId === 'task:TASK-204'));
    assert.ok(result.findings.some(finding => finding.code === 'unresolved-conflict'));
    assert.ok(result.findings.some(finding => finding.code === 'graph-unhealthy'));
    assert.equal(result.projection.readyToShip.ready, false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a failed refresh visibly falls back and never claims graph-driven sequencing', () => {
  const root = fixture();
  try {
    const result = prepareGraphDrivenBfm(root, {
      taskId: 'TASK-200',
      ledger: frozenLedger(),
      buildBriefPath: 'docs/handoffs/TASK-200.md',
      refreshGraph() { throw new Error('corrupt derived state'); },
    });

    assert.equal(result.mode, 'authoritative-fallback');
    assert.equal(result.graphDrivenSequencing, false);
    assert.match(result.notice, /graph preflight.*authoritative-record fallback/i);
    assert.deepEqual(result.authoritativeSources, [
      'PROJECT_BOARD.md', 'docs/handoffs/index.md', 'docs/handoffs/TASK-200.md', 'Git history',
    ]);
    assert.deepEqual(result.projection.current, []);
    assert.equal(result.projection.readyToShip.ready, false);
    assert.match(renderGraphProjection(result), /AUTHORITATIVE FALLBACK[\s\S]*Graph-driven sequencing: unavailable/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('renders compact named conditions without copying handoff narrative', () => {
  const root = fixture();
  try {
    const result = prepareGraphDrivenBfm(root, {
      taskId: 'TASK-200',
      ledger: frozenLedger(),
      buildBriefPath: 'docs/handoffs/TASK-200.md',
      refreshGraph: () => ({ graph: graph(), changedSources: [], removedSources: [], reusedSources: [] }),
    });
    const output = renderGraphProjection(result);
    for (const heading of ['Current', 'Next', 'Blocked', 'Deferred', 'Conflicts', 'Recently invalidated', 'Ready to ship']) {
      assert.match(output, new RegExp(`^${heading}:`, 'm'));
    }
    assert.doesNotMatch(output, /Deliver the approved cache outcome through bounded graph slices/);
    assert.ok(output.length < 2_000);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
