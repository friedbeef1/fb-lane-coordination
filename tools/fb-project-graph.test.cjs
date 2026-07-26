#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const graphModule = path.join(__dirname, 'fb-project-graph.cjs');
assert.ok(fs.existsSync(graphModule), 'fb-project-graph.cjs must implement the graduated graph contract');

const {
  buildProjectGraph,
  validateProjectGraph,
  writeProjectGraph,
  refreshProjectGraph,
  queryProjectGraph,
  resolveProjectContext,
  evaluateGraduation,
} = require(graphModule);

function write(root, relative, contents) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-graph-'));
  write(root, 'PROJECT_BOARD.md', `# Board

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
| TASK-100 | In Progress | FB-Product / BFM | Harness | Add graph navigation | tools/fb-project-graph.cjs | [Handoff](docs/handoffs/TASK-100.md); [QA](docs/qa/TASK-100.md) |
`);
  write(root, 'docs/handoffs/index.md', `# Handoff Index

| Task | Lane | Status | Detail |
|---|---|---|---|
| TASK-100 | Product/User | ready | [TASK-100](TASK-100.md) |
`);
  write(root, 'docs/handoffs/TASK-100.md', `---
type: fb-lane-handoff
task: TASK-100
lane: fb-product
status: ready
approval: approved
record_model: normalized-v1
---

# TASK-100

## Approved Decision

Use a deterministic project graph.

## Dependencies

- [Records contract](../fb/records.md)

## Verification

- [QA evidence](../qa/TASK-100.md)
`);
  write(root, 'docs/fb/records.md', '# Records\n');
  write(root, 'docs/qa/TASK-100.md', '# QA\n\nCommand: `node --test`\n');
  write(root, 'docs/workstreams/fb-product.md', `# Product

## TASK-100

- Status: In Progress
- Next action: Complete implementation.
- Links: [Handoff](../handoffs/TASK-100.md)
`);
  return root;
}

test('builds a source-backed Level 1 graph without copying record prose', () => {
  const root = fixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-07-26T00:00:00.000Z' });
  assert.strictEqual(graph.schemaVersion, 1);
  assert.strictEqual(graph.level, 1);
  assert.ok(graph.nodes.some(node => node.id === 'task:TASK-100' && node.source === 'PROJECT_BOARD.md'));
  assert.ok(graph.nodes.some(node => node.id === 'handoff:docs/handoffs/TASK-100.md'));
  assert.ok(graph.nodes.some(node => node.id === 'qa:docs/qa/TASK-100.md'));
  assert.ok(graph.edges.some(edge => edge.from === 'task:TASK-100'
    && edge.to === 'handoff:docs/handoffs/TASK-100.md'
    && edge.type === 'documented-by'
    && edge.status === 'confirmed'));
  assert.deepStrictEqual(validateProjectGraph(root, graph), []);
  assert.ok(!JSON.stringify(graph).includes('Use a deterministic project graph.'));
  assert.ok(!JSON.stringify(graph).includes('Command: `node --test`'));
});

test('rejects unsafe, sensitive, and authority-bearing graph output', () => {
  const root = fixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-07-26T00:00:00.000Z' });
  graph.nodes.push(
    { id: 'unsafe:absolute', type: 'task', label: 'Unsafe', source: '/tmp/outside.md', status: 'confirmed' },
    { id: 'unsafe:secret', type: 'task', label: 'Authorization: Bearer abc123', source: 'PROJECT_BOARD.md', status: 'confirmed' },
  );
  graph.edges.push({
    from: 'task:TASK-100',
    to: 'unsafe:absolute',
    type: 'approved-by',
    source: 'PROJECT_BOARD.md',
    status: 'inferred',
  });
  const codes = validateProjectGraph(root, graph).map(finding => finding.code);
  assert.ok(codes.includes('unsafe-source'));
  assert.ok(codes.includes('sensitive-output'));
  assert.ok(codes.includes('invalid-edge-type'));
  assert.ok(codes.includes('inferred-authority'));
});

test('writes deterministic graph, Markdown, HTML, and state artifacts atomically', () => {
  const root = fixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-07-26T00:00:00.000Z' });
  const first = writeProjectGraph(root, graph);
  assert.strictEqual(first.changed, true);
  for (const name of ['project-graph.json', 'project-graph.md', 'project-graph.html', 'graph-state.json']) {
    assert.ok(fs.existsSync(path.join(root, '.fb', 'graph', name)), name);
  }
  const second = writeProjectGraph(root, graph);
  assert.strictEqual(second.changed, false);
});

test('incremental refresh reuses unchanged sources and replaces only changed-source relationships', () => {
  const root = fixture();
  const first = refreshProjectGraph(root, { generatedAt: '2026-07-26T00:00:00.000Z' });
  assert.ok(first.changedSources.length > 0);
  const second = refreshProjectGraph(root, { generatedAt: '2026-07-26T00:01:00.000Z' });
  assert.deepStrictEqual(second.changedSources, []);
  assert.ok(second.reusedSources.length > 0);

  const target = path.join(root, 'docs/handoffs/TASK-100.md');
  fs.appendFileSync(target, '\n## Next action\n\nRun the focused proof.\n');
  const third = refreshProjectGraph(root, { generatedAt: '2026-07-26T00:02:00.000Z' });
  assert.deepStrictEqual(third.changedSources, ['docs/handoffs/TASK-100.md']);
  assert.ok(third.reusedSources.includes('PROJECT_BOARD.md'));
});

test('bounded query returns source-cited direct and one-hop results', () => {
  const root = fixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-07-26T00:00:00.000Z' });
  const results = queryProjectGraph(graph, 'What verifies TASK-100?');
  assert.ok(results.length <= 20);
  assert.ok(results.some(result => result.source === 'docs/qa/TASK-100.md'));
  assert.ok(results.every(result => result.source && Array.isArray(result.relationshipPath)));
});

test('missing, stale, or corrupt graph falls back to normalized FB records', () => {
  const root = fixture();
  let context = resolveProjectContext(root, 'What verifies TASK-100?');
  assert.strictEqual(context.route, 'normalized-record-fallback');
  assert.ok(context.results.some(result => result.source === 'docs/qa/TASK-100.md'));

  const graph = buildProjectGraph(root, { generatedAt: '2026-07-26T00:00:00.000Z' });
  writeProjectGraph(root, graph);
  context = resolveProjectContext(root, 'What verifies TASK-100?');
  assert.strictEqual(context.route, 'project-graph');

  fs.writeFileSync(path.join(root, '.fb/graph/project-graph.json'), '{broken');
  context = resolveProjectContext(root, 'What verifies TASK-100?');
  assert.strictEqual(context.route, 'normalized-record-fallback');
  assert.ok(context.findings.includes('Project graph is unreadable; used normalized FB records.'));
});

test('graduation is driven by retrieval friction rather than age or record volume', () => {
  assert.strictEqual(evaluateGraduation({
    projectClass: 'disposable',
    currentLevel: 0,
    frictionSignals: [],
  }).action, 'remain-level-0');

  assert.strictEqual(evaluateGraduation({
    projectClass: 'long-lived',
    currentLevel: 1,
    projectAgeDays: 90,
    handoffCount: 40,
    frictionSignals: [],
  }).action, 'remain-level-1');

  const decision = evaluateGraduation({
    projectClass: 'long-lived',
    currentLevel: 1,
    frictionSignals: [{
      type: 'repeated-governing-decision-search',
      query: 'Which approved decision governs camera orientation?',
      occurrences: 2,
      source: 'docs/experiments/TASK-048-friction.json',
    }],
    allowedCorpus: ['docs/handoffs', 'docs/design'],
  });
  assert.strictEqual(decision.recommendedLevel, 2);
  assert.strictEqual(decision.action, 'recommend-scoped-level-2');
  assert.strictEqual(decision.requiresApproval, false);
});

test('graduation rejects weak evidence and gates sensitive or cross-project scope', () => {
  assert.strictEqual(evaluateGraduation({
    projectClass: 'long-lived',
    currentLevel: 1,
    frictionSignals: [{
      type: 'repeated-governing-decision-search',
      query: '',
      occurrences: 10,
      source: 'docs/experiments/TASK-048-friction.json',
    }],
  }).action, 'remain-level-1');

  const sensitive = evaluateGraduation({
    projectClass: 'long-lived',
    currentLevel: 1,
    frictionSignals: [{
      type: 'missed-cross-workstream-dependency',
      query: 'Which payment decision blocks release?',
      occurrences: 1,
      material: true,
      source: 'docs/experiments/TASK-048-friction.json',
    }],
    allowedCorpus: ['docs/payments'],
    risks: ['payments'],
  });
  assert.strictEqual(sensitive.action, 'recommend-scoped-level-2');
  assert.strictEqual(sensitive.requiresApproval, true);
});
