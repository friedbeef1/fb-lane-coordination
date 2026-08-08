#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const schedulerModule = path.join(__dirname, 'fb-graph-scheduler.cjs');
assert.ok(fs.existsSync(schedulerModule), 'fb-graph-scheduler.cjs must provide deterministic graph scheduling');

const { scheduleGraph } = require(schedulerModule);

function node(id, activityState = 'Ready', execution = {}) {
  return {
    id,
    type: id.startsWith('verification:') ? 'verification' : id.startsWith('decision:') ? 'user-decision' : 'task',
    label: id,
    source: `docs/${id.replace(/[:/]/g, '-')}.md`,
    citation: { source: `docs/${id.replace(/[:/]/g, '-')}.md` },
    activityState,
    ...execution,
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

function graph(nodes, edges = []) {
  return { nodes, edges };
}

function ids(items) {
  return items.map(item => item.id || item.task.id);
}

test('projects six independent ready tasks in deterministic isolated parallel lanes', () => {
  const input = graph([
    node('task:TASK-101', 'Ready', { worktree: 'wt-101', locks: ['a.js'] }),
    node('task:TASK-102', 'Ready', { worktree: 'wt-102', locks: ['b.js'] }),
    node('task:TASK-103', 'Ready', { worktree: 'wt-103', locks: ['c.js'] }),
    node('task:TASK-104', 'Ready', { worktree: 'wt-104', locks: ['d.js'] }),
    node('task:TASK-105', 'Ready', { worktree: 'wt-105', locks: ['e.js'] }),
    node('task:TASK-106', 'Ready', { worktree: 'wt-106', locks: ['f.js'] }),
    node('verification:TASK-101'),
  ], [edge('task:TASK-101', 'verification:TASK-101', 'verified-by')]);
  const before = JSON.parse(JSON.stringify(input));

  const projection = scheduleGraph(input);

  assert.deepStrictEqual(Object.keys(projection), [
    'current', 'parallelReady', 'next', 'blocked', 'deferred', 'conflicts', 'releaseGates',
  ]);
  assert.deepStrictEqual(ids(projection.parallelReady), [
    'task:TASK-101', 'task:TASK-102', 'task:TASK-103', 'task:TASK-104', 'task:TASK-105', 'task:TASK-106',
  ]);
  assert.deepStrictEqual(projection.parallelReady[0].verificationRequirements, [{
    id: 'verification:TASK-101', source: 'docs/verification-TASK-101.md', citation: { source: 'docs/verification-TASK-101.md' },
  }]);
  assert.equal(projection.current.length, 0);
  assert.equal(projection.next.length, 0);
  assert.deepStrictEqual(input, before, 'scheduler is a pure projection and never executes or mutates source graph data');

  const stopped = scheduleGraph(input, { approvedOutcomeSatisfied: true });
  assert.equal(stopped.parallelReady.length, 0);
  assert.deepStrictEqual(ids(stopped.deferred), [
    'task:TASK-101', 'task:TASK-102', 'task:TASK-103', 'task:TASK-104', 'task:TASK-105', 'task:TASK-106',
  ]);
  assert.ok(stopped.deferred.every(item => item.reasons.some(reason => reason.code === 'approved-outcome-satisfied')));
});

test('keeps dependency chains out of ready work and exposes their critical paths', () => {
  const projection = scheduleGraph(graph([
    node('task:TASK-201', 'Ready', { worktree: 'wt-201', locks: ['a.js'] }),
    node('task:TASK-202', 'Ready', { worktree: 'wt-202', locks: ['b.js'] }),
    node('task:TASK-203', 'Ready', { worktree: 'wt-203', locks: ['c.js'] }),
  ], [
    edge('task:TASK-202', 'task:TASK-201', 'depends-on'),
    edge('task:TASK-203', 'task:TASK-202', 'depends-on'),
  ]));

  assert.deepStrictEqual(ids(projection.parallelReady), ['task:TASK-201']);
  assert.deepStrictEqual(ids(projection.next), ['task:TASK-202', 'task:TASK-203']);
  assert.deepStrictEqual(projection.next[0].criticalPath, ['task:TASK-201', 'task:TASK-202']);
  assert.deepStrictEqual(projection.next[1].criticalPath, ['task:TASK-201', 'task:TASK-202', 'task:TASK-203']);
  assert.ok(projection.next.every(item => item.reasons.some(reason => reason.code === 'unresolved-dependency')));
});

test('reports unresolved user-decision conflicts without choosing a winner', () => {
  const projection = scheduleGraph(graph([
    node('task:TASK-301', 'Ready', { worktree: 'wt-301', locks: ['a.js'] }),
    node('decision:PAYMENT-DIRECTION', 'Unresolved'),
  ], [edge('task:TASK-301', 'decision:PAYMENT-DIRECTION', 'conflicts-with', 'unresolved')]));

  assert.equal(projection.parallelReady.length, 0);
  assert.equal(projection.next.length, 0);
  assert.deepStrictEqual(ids(projection.conflicts), ['task:TASK-301']);
  assert.equal(projection.conflicts[0].conflict.id, 'decision:PAYMENT-DIRECTION');
  assert.ok(projection.conflicts[0].reasons.some(reason => reason.code === 'unresolved-conflict'));
});

test('reports explicit blockers and blocked activity without scheduling either task', () => {
  const projection = scheduleGraph(graph([
    node('task:TASK-401', 'Blocked', { worktree: 'wt-401', locks: ['a.js'] }),
    node('task:TASK-402', 'Ready', { worktree: 'wt-402', locks: ['b.js'] }),
  ], [edge('task:TASK-401', 'task:TASK-402', 'blocks')]));

  assert.deepStrictEqual(ids(projection.blocked), ['task:TASK-401', 'task:TASK-402']);
  assert.equal(projection.parallelReady.length, 0);
  assert.ok(projection.blocked[1].reasons.some(reason => reason.code === 'blocked-by'));
});

test('defers sensitive work and serializes ready tasks that overlap a shared lock', () => {
  const projection = scheduleGraph(graph([
    node('task:TASK-501', 'Ready', { worktree: 'wt-501', locks: ['shared.js'], sensitive: true }),
    node('task:TASK-502', 'Ready', { worktree: 'wt-502', locks: ['shared.js'] }),
    node('task:TASK-503', 'Ready', { worktree: 'wt-503', locks: ['shared.js'] }),
  ]));

  assert.deepStrictEqual(ids(projection.deferred), ['task:TASK-501']);
  assert.ok(projection.deferred[0].reasons.some(reason => reason.code === 'sensitive-operation-gate'));
  assert.deepStrictEqual(ids(projection.next), ['task:TASK-502', 'task:TASK-503']);
  assert.ok(projection.next.every(item => item.reasons.some(reason => reason.code === 'shared-lock')));
  assert.deepStrictEqual(ids(projection.releaseGates), ['task:TASK-501']);
});

test('permits only distinct concurrent worktree mappings and defers an unmapped task', () => {
  const projection = scheduleGraph(graph([
    node('task:TASK-601', 'Ready', { worktree: 'wt-601', locks: ['a.js'] }),
    node('task:TASK-602', 'Ready', { worktree: 'wt-602', locks: ['b.js'] }),
    node('task:TASK-603', 'Ready', { worktree: 'wt-601', locks: ['c.js'] }),
    node('task:TASK-604', 'Ready', { locks: ['d.js'] }),
  ]));

  assert.deepStrictEqual(ids(projection.parallelReady), ['task:TASK-602']);
  assert.deepStrictEqual(ids(projection.next), ['task:TASK-601', 'task:TASK-603']);
  assert.ok(projection.next.every(item => item.reasons.some(reason => reason.code === 'worktree-overlap')));
  assert.deepStrictEqual(ids(projection.deferred), ['task:TASK-604']);
  assert.ok(projection.deferred[0].reasons.some(reason => reason.code === 'worktree-isolation-gate'));
});
