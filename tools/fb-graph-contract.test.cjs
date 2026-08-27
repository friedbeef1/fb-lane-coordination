#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const contractPath = path.join(__dirname, 'fb-graph-contract.json');
const runtimePath = path.join(__dirname, 'fb-graph-contract.cjs');

test('publishes one versioned machine-readable graph contract', () => {
  assert.ok(fs.existsSync(contractPath), 'machine-readable graph contract is missing');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  assert.equal(contract.contractVersion, 1);
  assert.deepEqual(contract.graphSchema.read, [1, 2]);
  assert.equal(contract.graphSchema.write, 2);
  for (const type of [
    'project', 'workstream', 'user-decision', 'assumption', 'requirement',
    'handoff', 'task', 'implementation-slice', 'bug', 'verification', 'lesson', 'release',
  ]) assert.ok(contract.nodeTypes[type], `missing canonical node type ${type}`);
  for (const type of [
    'depends-on', 'blocks', 'conflicts-with', 'supersedes', 'affects', 'implements',
    'verified-by', 'learned-from', 'owned-by', 'included-in-release',
  ]) assert.ok(contract.edgeTypes[type], `missing canonical edge type ${type}`);
});

test('canonicalizes v1 aliases for new writes while retaining v1 read support', () => {
  assert.ok(fs.existsSync(runtimePath), 'graph contract runtime is missing');
  const { normalizeGraphWrite, supportsGraphRead } = require(runtimePath);
  assert.equal(supportsGraphRead(1), true);
  const normalized = normalizeGraphWrite({
    nodes: [
      { id: 'decision:scope', type: 'decision', state: 'Confirmed', source: 'docs/handoffs/TASK-091.md' },
      { id: 'task:TASK-091', type: 'task', state: 'Ready', source: 'PROJECT_BOARD.md' },
    ],
    edges: [{
      from: 'decision:scope',
      to: 'task:TASK-091',
      type: 'implemented-by',
      status: 'confirmed',
      source: 'docs/handoffs/TASK-091.md',
    }],
  });
  assert.equal(normalized.schemaVersion, 2);
  assert.deepEqual(normalized.nodes.map(node => [node.type, node.state]), [
    ['user-decision', 'confirmed'],
    ['task', 'ready'],
  ]);
  assert.deepEqual(normalized.edges.map(edge => [edge.from, edge.to, edge.type]), [
    ['task:TASK-091', 'decision:scope', 'implements'],
  ]);
});

test('validates directionality and entity-scoped transitions', () => {
  const { validateGraphEdge, validateStateTransition } = require(runtimePath);
  assert.deepEqual(validateGraphEdge({
    type: 'verified-by', fromType: 'task', toType: 'verification', status: 'confirmed', source: 'docs/qa/TASK-091.md',
  }), { valid: true });
  assert.deepEqual(validateGraphEdge({
    type: 'verified-by', fromType: 'verification', toType: 'task', status: 'confirmed', source: 'docs/qa/TASK-091.md',
  }), {
    valid: false,
    code: 'invalid-edge-direction',
    message: 'verified-by must point from task, implementation-slice, bug, or release to verification.',
  });
  assert.deepEqual(validateStateTransition('task', 'ready', 'in-progress'), { valid: true });
  assert.deepEqual(validateStateTransition('task', 'ready', 'done'), {
    valid: false,
    code: 'invalid-state-transition',
    message: 'task cannot transition from ready to done.',
  });
  assert.deepEqual(validateStateTransition('verification', 'passed', 'running'), {
    valid: false,
    code: 'terminal-state-transition',
    message: 'verification is terminal at passed.',
  });
});

test('never lets graph relationships grant approval verification release or Push Live', () => {
  const { normalizeGraphWrite, validateGraphEdge } = require(runtimePath);
  for (const type of ['approved-by', 'authorizes', 'releases']) {
    const result = validateGraphEdge({
      type, fromType: 'task', toType: 'release', status: 'confirmed', source: 'docs/handoffs/TASK-091.md',
    });
    assert.equal(result.valid, false);
    assert.equal(result.code, 'forbidden-authority-edge');
  }
  assert.throws(() => normalizeGraphWrite({
    nodes: [
      { id: 'task:TASK-091', type: 'task', state: 'ready', source: 'PROJECT_BOARD.md' },
      { id: 'release:0.10.0', type: 'release', state: 'planned', source: 'CHANGELOG.md' },
    ],
    edges: [{
      from: 'task:TASK-091', to: 'release:0.10.0', type: 'authorizes', status: 'confirmed', source: 'PROJECT_BOARD.md',
    }],
  }), /cannot grant approval, verification, release, or Push Live authority/i);
});
