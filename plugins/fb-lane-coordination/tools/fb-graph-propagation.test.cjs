#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { calculateGraphInvalidation } = require('./fb-graph-propagation.cjs');

function node(id, type, activityState, source) {
  return { id, type, activityState, source, citation: { source } };
}

function edge(from, to, type, source = 'docs/handoffs/TASK-080.md') {
  return { from, to, type, status: 'confirmed', source, citation: { source } };
}

function ids(items) {
  return items.map(item => item.id);
}

const graph = {
  nodes: [
    node('decision:CAMERA', 'user-decision', 'Confirmed', 'docs/decisions/camera.md'),
    node('slice:CAMERA', 'implementation-slice', 'Done', 'docs/handoffs/TASK-101.md'),
    node('verification:CAMERA', 'verification', 'Passed', 'docs/qa/TASK-101.md'),
    node('task:UNRELATED', 'task', 'Done', 'docs/handoffs/TASK-999.md'),
    node('verification:FAILED', 'verification', 'Failed', 'docs/qa/TASK-102.md'),
    node('slice:FAILED', 'implementation-slice', 'Done', 'docs/handoffs/TASK-102.md'),
    node('release:BETA', 'release', 'Ready to ship', 'docs/releases/beta.md'),
    node('requirement:OLD', 'requirement', 'Superseded', 'docs/requirements/old.md'),
    node('task:OLD', 'task', 'Ready', 'docs/handoffs/TASK-103.md'),
    node('task:OLD-STARTED', 'task', 'In Progress', 'docs/handoffs/TASK-104.md'),
    node('bug:EXPORT', 'bug', 'Fixed', 'docs/bugs/export.md'),
    node('verification:EXPORT-REGRESSION', 'verification', 'Ready', 'docs/qa/export.md'),
    node('task:BASE', 'task', 'Done', 'docs/handoffs/TASK-105.md'),
    node('task:DOWNSTREAM', 'task', 'Ready', 'docs/handoffs/TASK-106.md'),
    node('task:LAST', 'task', 'Ready', 'docs/handoffs/TASK-107.md'),
  ],
  edges: [
    edge('decision:CAMERA', 'slice:CAMERA', 'affects'),
    edge('slice:CAMERA', 'verification:CAMERA', 'verified-by'),
    edge('slice:FAILED', 'verification:FAILED', 'verified-by'),
    edge('release:BETA', 'slice:FAILED', 'included-in-release'),
    edge('task:OLD', 'requirement:OLD', 'implements'),
    edge('task:OLD-STARTED', 'requirement:OLD', 'implements'),
    edge('bug:EXPORT', 'verification:EXPORT-REGRESSION', 'verified-by'),
    edge('task:DOWNSTREAM', 'task:BASE', 'depends-on'),
    edge('task:LAST', 'task:DOWNSTREAM', 'depends-on'),
  ],
};

test('changed decisions reopen only affected completed implementation and verification', () => {
  const result = calculateGraphInvalidation(graph, [{
    nodeId: 'decision:CAMERA',
    kind: 'changed-decision',
    source: 'docs/decisions/camera.md',
  }]);

  assert.deepEqual(ids(result.reopened), ['slice:CAMERA', 'verification:CAMERA']);
  assert.deepEqual(ids(result.recentlyInvalidated), ['slice:CAMERA', 'verification:CAMERA']);
  assert.ok(!JSON.stringify(result).includes('task:UNRELATED'));
  assert.ok(result.reopened.every(item => item.changedSource === 'docs/decisions/camera.md'));
  assert.ok(result.reopened.every(item => item.reason.code === 'changed-decision-descendant'));
  assert.ok(result.reopened.every(item => item.reason.detail.includes('decision:CAMERA')));
});

test('failed verification blocks its implementation and connected release', () => {
  const result = calculateGraphInvalidation(graph, [{
    nodeId: 'verification:FAILED',
    kind: 'failed-verification',
    source: 'docs/qa/TASK-102.md',
  }]);

  assert.deepEqual(ids(result.blocked), ['release:BETA', 'slice:FAILED']);
  assert.ok(result.blocked.every(item => item.reason.code === 'failed-verification-block'));
  assert.ok(result.blocked.every(item => item.citation.source === 'docs/qa/TASK-102.md'));
});

test('superseded requirements retire only their unstarted implementing tasks', () => {
  const result = calculateGraphInvalidation(graph, [{
    nodeId: 'requirement:OLD',
    kind: 'superseded-requirement',
    source: 'docs/requirements/old.md',
  }]);

  assert.deepEqual(ids(result.retired), ['task:OLD']);
  assert.ok(!JSON.stringify(result.retired).includes('task:OLD-STARTED'));
  assert.equal(result.retired[0].reason.code, 'superseded-requirement-retirement');
});

test('fixed bugs require their connected regression verification', () => {
  const result = calculateGraphInvalidation(graph, [{
    nodeId: 'bug:EXPORT',
    kind: 'fixed-bug',
    source: 'docs/bugs/export.md',
  }]);

  assert.deepEqual(ids(result.requiredVerification), ['verification:EXPORT-REGRESSION']);
  assert.equal(result.requiredVerification[0].reason.code, 'fixed-bug-regression-required');
});

test('changed dependencies recalculate only downstream sequencing', () => {
  const result = calculateGraphInvalidation(graph, [{
    nodeId: 'task:BASE',
    kind: 'changed-dependency',
    source: 'docs/handoffs/TASK-105.md',
  }]);

  assert.deepEqual(ids(result.resequenced), ['task:DOWNSTREAM', 'task:LAST']);
  assert.equal(result.reopened.length, 0);
  assert.equal(result.blocked.length, 0);
  assert.ok(result.resequenced.every(item => item.reason.code === 'changed-dependency-downstream'));
});

test('rejects unknown change kinds and missing changed nodes', () => {
  assert.throws(() => calculateGraphInvalidation(graph, [{ nodeId: 'task:BASE', kind: 'invented' }]), /change kind/i);
  assert.throws(() => calculateGraphInvalidation(graph, [{ nodeId: 'task:MISSING', kind: 'changed-dependency' }]), /not present/i);
});
