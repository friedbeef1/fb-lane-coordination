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
  GRAPH_CONTRACT_VERSION,
  supportsGraphRead,
  buildProjectGraph,
  validateProjectGraph,
  writeProjectGraph,
  refreshProjectGraph,
  queryProjectGraph,
  resolveProjectContext,
  buildActiveSubgraph,
  projectContextPacket,
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

function archivedHistoryFixture() {
  const root = fixture();
  fs.appendFileSync(path.join(root, 'docs/handoffs/TASK-100.md'), '\n## Prior work\n\n- [TASK-099 predecessor](TASK-099.md)\n');
  write(root, 'docs/board/archive/2026-08.md', `# August 2026 archive

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
| TASK-099 | Done | FB-Product / BFM | Harness | Record the governing history | None | [Handoff](../../handoffs/TASK-099.md); [QA](../../qa/TASK-099.md) |
| TASK-098 | Done | FB-Product / BFM | Unrelated | An unrelated completed task | None | [Handoff](../../handoffs/TASK-098.md) |
`);
  write(root, 'docs/handoffs/TASK-099.md', `---
type: fb-lane-handoff
task: TASK-099
lane: fb-product
status: done
---

# TASK-099

## Approved Decision

Keep predecessor decisions available for regression investigation.

## Verification

- [QA evidence](../qa/TASK-099.md)
`);
  write(root, 'docs/handoffs/TASK-098.md', `---
type: fb-lane-handoff
task: TASK-098
lane: fb-product
status: done
---

# TASK-098
`);
  write(root, 'docs/qa/TASK-099.md', '# TASK-099 QA\n');
  return root;
}

function normalizedCompilerFixture() {
  const root = fixture();
  write(root, 'PROJECT_BOARD.md', `# Board

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
| TASK-100 | In Progress | FB-Product / BFM | Harness | Add graph navigation | tools/fb-project-graph.cjs | [Handoff](docs/handoffs/TASK-100.md); [QA](docs/qa/TASK-100.md) |
| TASK-101 | Ready | FB-Tech | Compiler | Provide the prerequisite | none | [Handoff](docs/handoffs/TASK-101.md) |
`);
  write(root, 'docs/handoffs/TASK-100.md', `---
type: fb-lane-handoff
task: TASK-100
lane: fb-product
status: ready
graph:
  depends_on:
    - TASK-101
  conflicts_with:
    - DECISION-100
  affects:
    - REQUIREMENT-100
  supersedes:
    - REQUIREMENT-099
  learned_from:
    - lesson:LESSON-100
  included_in_release:
    - release:1.0.0
---

# TASK-100

## User Decision: DECISION-100

Use the source-cited graph.

## Assumption: ASSUMPTION-100

The graph remains derived.

## Requirement: REQUIREMENT-100

Compile the complete vocabulary.

## Requirement: REQUIREMENT-099

The predecessor requirement.

## Implementation Slice: SLICE-100

Implement only the compiler foundation.
`);
  write(root, 'docs/handoffs/TASK-101.md', `---
type: fb-lane-handoff
task: TASK-101
lane: fb-tech
status: ready
---

# TASK-101
`);
  write(root, 'docs/workstreams/fb-product.md', `# Product

## TASK-100

[Handoff](../handoffs/TASK-100.md)
`);
  write(root, 'docs/qa/BUG-100.md', '# BUG-100\n\n[QA](TASK-100.md)\n');
  write(root, 'docs/learning/index.md', `# Project Learning

## LESSON-100

[TASK-100](../handoffs/TASK-100.md) [QA](../qa/TASK-100.md)
`);
  write(root, 'CHANGELOG.md', '# 1.0.0\n\n- Includes TASK-100.\n');
  return root;
}

function activeSubgraphFixture() {
  const root = normalizedCompilerFixture();
  write(root, 'PROJECT_BOARD.md', `# Board

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
| TASK-100 | In Progress | FB-Product / BFM | Harness | Compile only the current graph context | tools/fb-project-graph.cjs | [Handoff](docs/handoffs/TASK-100.md) |
| TASK-101 | Ready | FB-Tech | Compiler | Provide the direct prerequisite | none | [Handoff](docs/handoffs/TASK-101.md) |
| TASK-102 | Blocked | FB-Tech | Runtime | Wait for the current graph context | none | [Handoff](docs/handoffs/TASK-102.md) |
| TASK-103 | Ready | FB-Tech | Unrelated | Do not include this sibling task | none | [Handoff](docs/handoffs/TASK-103.md) |
`);
  write(root, 'docs/handoffs/TASK-100.md', `---
type: fb-lane-handoff
task: TASK-100
lane: fb-product
status: in-progress
graph:
  depends_on:
    - TASK-101
  blocks:
    - TASK-102
  conflicts_with:
    - DECISION-100
  affects:
    - verification:TASK-100
  verified_by:
    - verification:TASK-100
  learned_from:
    - lesson:LESSON-100
---

# TASK-100

## User Decision: DECISION-100

Use only the semantically linked active subgraph.

## Assumption: ASSUMPTION-100

The derived graph remains rebuildable.

## Requirement: REQUIREMENT-100

Keep routine context compact.
`);
  write(root, 'docs/handoffs/TASK-102.md', `---
type: fb-lane-handoff
task: TASK-102
lane: fb-tech
status: blocked
---

# TASK-102
`);
  write(root, 'docs/handoffs/TASK-103.md', `---
type: fb-lane-handoff
task: TASK-103
lane: fb-tech
status: ready
---

# TASK-103
`);
  write(root, 'docs/qa/TASK-100.md', '# TASK-100 QA\n');
  write(root, 'docs/learning/index.md', `# Learning

## LESSON-100

Relevant lesson.

## LESSON-OTHER

Unrelated lesson.
`);
  return root;
}

test('builds a source-backed Level 1 graph without copying record prose', () => {
  const root = fixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-07-26T00:00:00.000Z' });
  assert.strictEqual(graph.schemaVersion, 1);
  assert.strictEqual(GRAPH_CONTRACT_VERSION, 1);
  assert.strictEqual(supportsGraphRead(1), true);
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

test('uses the shared contract for v2 direction and transition validation while retaining v1 reads', () => {
  const root = fixture();
  const v1 = buildProjectGraph(root, { generatedAt: '2026-07-26T00:00:00.000Z' });
  v1.nodes.push({
    id: 'document:legacy', type: 'document', label: 'Legacy document', source: 'PROJECT_BOARD.md',
    status: 'confirmed', citation: { source: 'PROJECT_BOARD.md' },
  });
  assert.ok(!validateProjectGraph(root, v1).some(finding => finding.code === 'invalid-node-type'));

  const v2 = {
    schemaVersion: 2,
    contractVersion: 1,
    compileFindings: [],
    health: { findings: [] },
    nodes: [
      { id: 'task:TASK-100', type: 'task', state: 'done', previousState: 'ready', source: 'PROJECT_BOARD.md', citation: { source: 'PROJECT_BOARD.md' } },
      { id: 'verification:TASK-100', type: 'verification', state: 'not-run', source: 'docs/qa/TASK-100.md', citation: { source: 'docs/qa/TASK-100.md' } },
    ],
    edges: [{
      from: 'verification:TASK-100', to: 'task:TASK-100', type: 'verified-by', status: 'confirmed',
      source: 'docs/qa/TASK-100.md', citation: { source: 'docs/qa/TASK-100.md' },
    }],
  };
  const codes = validateProjectGraph(root, v2).map(finding => finding.code);
  assert.ok(codes.includes('invalid-edge-direction'));
  assert.ok(codes.includes('invalid-state-transition'));

  const unsupported = structuredClone(v2);
  unsupported.schemaVersion = 3;
  assert.ok(validateProjectGraph(root, unsupported).some(finding => finding.code === 'unsupported-graph-schema'));
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

test('normalizes the Task 1 vocabulary and structured handoff graph with source citations', () => {
  const root = normalizedCompilerFixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-08-08T00:00:00.000Z' });
  const nodeTypes = new Set(graph.nodes.map(node => node.type));

  for (const type of ['project', 'workstream', 'user-decision', 'assumption', 'requirement', 'handoff', 'task', 'implementation-slice', 'bug', 'verification', 'lesson', 'release']) {
    assert.ok(nodeTypes.has(type), `missing ${type} node`);
  }
  for (const type of ['depends-on', 'conflicts-with', 'affects', 'supersedes', 'learned-from', 'included-in-release']) {
    assert.ok(graph.edges.some(edge => edge.type === type), `missing ${type} edge`);
  }
  assert.ok(graph.edges.some(edge => edge.from === 'task:TASK-100'
    && edge.to === 'task:TASK-101'
    && edge.type === 'depends-on'
    && edge.source === 'docs/handoffs/TASK-100.md'));
  assert.ok(graph.nodes.every(node => node.citation?.source === node.source));
  assert.ok(graph.edges.every(edge => edge.citation?.source === edge.source));
  assert.deepStrictEqual(validateProjectGraph(root, graph), []);
});

test('rejects unresolved declared relationships without deriving successful verification', () => {
  const root = normalizedCompilerFixture();
  const handoffPath = path.join(root, 'docs/handoffs/TASK-100.md');
  fs.writeFileSync(handoffPath, fs.readFileSync(handoffPath, 'utf8').replace('- TASK-101', '- TASK-404'));
  const graph = buildProjectGraph(root, { generatedAt: '2026-08-08T00:00:00.000Z' });

  assert.ok(graph.health.findings.some(finding => finding.code === 'unresolved-edge-target'));
  assert.ok(!graph.edges.some(edge => edge.to === 'task:TASK-404'));
  assert.ok(graph.nodes.filter(node => node.type === 'verification').every(node => node.verificationState === 'unknown'));
});

test('does not infer a user decision or approval from a plain decision heading', () => {
  const root = fixture();
  write(root, 'docs/handoffs/TASK-100.md', `---
type: fb-lane-handoff
task: TASK-100
lane: fb-product
status: ready
---

# TASK-100

## Decision

A facilitator noted an unresolved option.
`);

  const graph = buildProjectGraph(root, { generatedAt: '2026-08-08T00:00:00.000Z' });
  assert.ok(!graph.nodes.some(node => node.type === 'user-decision'));
  assert.ok(!graph.edges.some(edge => edge.type === 'supports' && edge.source === 'docs/handoffs/TASK-100.md'));
});

test('does not infer a user decision or approval from an approved decision heading', () => {
  const root = fixture();
  write(root, 'docs/handoffs/TASK-100.md', `---
type: fb-lane-handoff
task: TASK-100
lane: fb-product
status: ready
---

# TASK-100

## Approved Decision

An editor labelled an option for later review.
`);
  const graph = buildProjectGraph(root, { generatedAt: '2026-08-08T00:00:00.000Z' });
  const source = 'docs/handoffs/TASK-100.md';
  const sourceNodeTypes = [...new Set(graph.nodes
    .filter(node => node.source === source)
    .map(node => node.type))].sort();
  const sourceEdgeTypes = [...new Set(graph.edges
    .filter(edge => edge.source === source)
    .map(edge => edge.type))].sort();

  assert.deepStrictEqual(sourceNodeTypes, ['handoff', 'workstream']);
  assert.deepStrictEqual(sourceEdgeTypes, ['documented-by', 'owned-by']);
});

test('does not promote generic QA links and task mentions into semantic relationships', () => {
  const root = fixture();
  write(root, 'docs/qa/BUG-100.md', '# BUG-100\n\nTASK-100 is mentioned for investigation.\n');
  write(root, 'docs/learning/index.md', '# Learning\n\n## LESSON-100\n\n[TASK-100](../handoffs/TASK-100.md) [QA](../qa/TASK-100.md)\n');
  write(root, 'CHANGELOG.md', '# 1.0.0\n\nTASK-100 is mentioned as a future candidate.\n');

  const graph = buildProjectGraph(root, { generatedAt: '2026-08-08T00:00:00.000Z' });
  assert.ok(!graph.edges.some(edge => edge.type === 'verified-by'));
  assert.ok(!graph.edges.some(edge => edge.type === 'owned-by' && edge.source.startsWith('docs/workstreams/')));
  assert.ok(!graph.edges.some(edge => edge.type === 'affects' && edge.source === 'docs/qa/BUG-100.md'));
  assert.ok(!graph.edges.some(edge => edge.type === 'learned-from' && edge.source === 'docs/learning/index.md'));
  assert.ok(!graph.edges.some(edge => edge.type === 'included-in-release' && edge.source === 'CHANGELOG.md'));
});

test('source-scopes repeated heading entities instead of silently dropping one source', () => {
  const root = normalizedCompilerFixture();
  fs.appendFileSync(path.join(root, 'docs/handoffs/TASK-100.md'), '\n## Requirement: SHARED-REQUIREMENT\n\nFirst source.\n');
  fs.appendFileSync(path.join(root, 'docs/handoffs/TASK-101.md'), '\n## Requirement: SHARED-REQUIREMENT\n\nSecond source.\n');

  const graph = buildProjectGraph(root, { generatedAt: '2026-08-08T00:00:00.000Z' });
  const repeated = graph.nodes.filter(node => node.label === 'Requirement: SHARED-REQUIREMENT');
  assert.strictEqual(repeated.length, 2);
  assert.notStrictEqual(repeated[0].id, repeated[1].id);
  assert.notStrictEqual(repeated[0].source, repeated[1].source);
});

test('citation-less persisted graphs and nonexistent Git provenance fall back to authoritative records', () => {
  const root = fixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-08-08T00:00:00.000Z' });
  for (const item of [...graph.nodes, ...graph.edges]) delete item.citation;
  graph.nodes.push({
    id: 'commit:invalid',
    type: 'commit',
    label: 'invalid',
    source: 'git:0000000000000000000000000000000000000000',
    status: 'confirmed',
  });
  writeProjectGraph(root, graph);

  const findings = validateProjectGraph(root, graph).map(finding => finding.code);
  assert.ok(findings.includes('missing-citation'));
  assert.ok(findings.includes('unsafe-source'));
  assert.strictEqual(resolveProjectContext(root, 'What verifies TASK-100?').route, 'normalized-record-fallback');
});

test('citation-less persisted node independently fails validation and rebuilds through fallback', () => {
  const root = fixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-08-08T00:00:00.000Z' });
  delete graph.nodes.find(node => node.id === 'task:TASK-100').citation;
  writeProjectGraph(root, graph);

  assert.ok(validateProjectGraph(root, graph).some(finding => finding.code === 'missing-citation'));
  assert.strictEqual(resolveProjectContext(root, 'What verifies TASK-100?').route, 'normalized-record-fallback');
});

test('citation-less persisted edge independently fails validation and rebuilds through fallback', () => {
  const root = fixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-08-08T00:00:00.000Z' });
  delete graph.edges.find(edge => edge.from === 'project:root' && edge.to === 'task:TASK-100').citation;
  writeProjectGraph(root, graph);

  assert.ok(validateProjectGraph(root, graph).some(finding => finding.code === 'missing-citation'));
  assert.strictEqual(resolveProjectContext(root, 'What verifies TASK-100?').route, 'normalized-record-fallback');
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

test('explicit graph-linked lookup scopes generic questions to linked task documents without unrelated noise', () => {
  const root = fixture();
  write(root, 'docs/superpowers/specs/TASK-100-design.md', '# TASK-100 design\n');
  fs.appendFileSync(path.join(root, 'docs/handoffs/TASK-100.md'), '\n## Design\n\n[Detailed design](../superpowers/specs/TASK-100-design.md)\n');
  const graph = buildProjectGraph(root, { generatedAt: '2026-07-26T00:00:00.000Z' });
  const results = queryProjectGraph(graph, 'What user-visible artifacts are proposed?', { currentTask: 'TASK-100' });
  assert.ok(results.some(result => result.source === 'docs/superpowers/specs/TASK-100-design.md'));
  assert.ok(results.every(result => !result.id.includes('TASK-999')));
  assert.ok(results.length <= 20);
});

test('routine packets exclude generic references and completed history while explicit graph lookups retain both', () => {
  const root = activeSubgraphFixture();
  write(root, 'docs/board/archive/2026-08.md', `# August 2026 archive

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
| TASK-099 | Done | FB-Product / BFM | History | Archived predecessor | None | [Handoff](../../handoffs/TASK-099.md) |
`);
  write(root, 'docs/handoffs/TASK-099.md', `---
type: fb-lane-handoff
task: TASK-099
lane: fb-product
status: done
---

# TASK-099
`);
  write(root, 'docs/superpowers/specs/TASK-100-design.md', '# TASK-100 design\n');
  fs.appendFileSync(path.join(root, 'docs/handoffs/TASK-100.md'), `
## Design

[Detailed design](../superpowers/specs/TASK-100-design.md)

## Prior work

[TASK-099 predecessor](TASK-099.md)
`);
  const packet = projectContextPacket(root, {
    taskId: 'TASK-100',
    question: 'What user-visible artifacts and prior history should I review for TASK-100?',
  });

  assert.strictEqual(packet.route, 'project-graph');
  const routineContext = JSON.stringify({
    facts: packet.facts,
    readableSources: packet.readableSources,
    citations: packet.citations,
  });
  assert.ok(!routineContext.includes('TASK-100-design.md'));
  assert.ok(!routineContext.includes('TASK-099'));
  assert.ok(packet.facts.every(fact => fact.citation?.source === fact.source));

  const graph = buildProjectGraph(root, { generatedAt: '2026-08-08T00:00:00.000Z' });
  const genericLookup = queryProjectGraph(graph, 'What user-visible artifacts are proposed?', { currentTask: 'TASK-100' });
  assert.ok(genericLookup.some(result => result.source === 'docs/superpowers/specs/TASK-100-design.md'));
  const historyLookup = queryProjectGraph(graph, 'What decision governs TASK-099?', { currentTask: 'TASK-100' });
  assert.ok(historyLookup.some(result => result.id === 'task:TASK-099'));
});

test('active subgraph keeps only direct semantic context and compact cited fields', () => {
  const root = activeSubgraphFixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-08-08T00:00:00.000Z' });
  const context = buildActiveSubgraph(graph, {
    taskId: 'TASK-100',
    recentSources: ['docs/handoffs/TASK-100.md'],
  });

  assert.strictEqual(context.objective, 'Compile only the current graph context');
  assert.deepStrictEqual(context.readyNodes.map(node => node.id), ['task:TASK-101']);
  assert.deepStrictEqual(context.blockedNodes.map(node => node.id), ['task:TASK-102']);
  assert.deepStrictEqual(context.directDependencies.map(node => node.id), ['task:TASK-101']);
  assert.deepStrictEqual(context.directDependants.map(node => node.id), ['task:TASK-102']);
  assert.deepStrictEqual(context.governingDecisions.map(node => node.label), ['User Decision: DECISION-100']);
  assert.deepStrictEqual(context.recentDecisions.map(node => node.label), ['User Decision: DECISION-100']);
  assert.deepStrictEqual(context.assumptions.map(node => node.label), ['Assumption: ASSUMPTION-100']);
  assert.deepStrictEqual(context.acceptanceCriteria.map(node => node.label), ['Requirement: REQUIREMENT-100']);
  assert.deepStrictEqual(context.affectedVerification.map(node => node.id), ['verification:TASK-100']);
  assert.deepStrictEqual(context.applicableLessons.map(node => node.id), ['lesson:LESSON-100']);
  assert.strictEqual(context.unresolvedConflicts.length, 1);
  assert.ok(context.unresolvedConflicts[0].node.label.includes('DECISION-100'));
  assert.ok(!JSON.stringify(context).includes('TASK-103'));
  assert.ok(!JSON.stringify(context).includes('LESSON-OTHER'));
  for (const group of Object.values(context)) {
    if (!Array.isArray(group)) continue;
    for (const item of group) {
      const node = item.node || item;
      assert.strictEqual(node.citation.source, node.source);
    }
  }
});

test('project context packet exposes compact active-subgraph fields without copied handoff prose', () => {
  const root = activeSubgraphFixture();
  const packet = projectContextPacket(root, {
    taskId: 'TASK-100',
    question: 'What is the active dependency state for TASK-100?',
  });

  assert.strictEqual(packet.route, 'project-graph');
  assert.strictEqual(packet.objective, 'Compile only the current graph context');
  assert.deepStrictEqual(packet.directDependencies.map(node => node.id), ['task:TASK-101']);
  assert.deepStrictEqual(packet.directDependants.map(node => node.id), ['task:TASK-102']);
  assert.deepStrictEqual(packet.applicableLessons.map(node => node.id), ['lesson:LESSON-100']);
  assert.deepStrictEqual(packet.recentDecisions, []);
  assert.ok(!JSON.stringify(packet).includes('Use only the semantically linked active subgraph.'));

  fs.appendFileSync(path.join(root, 'docs/handoffs/TASK-100.md'), '\n## Note\n\nRefresh the current decision source.\n');
  const changedPacket = projectContextPacket(root, {
    taskId: 'TASK-100',
    question: 'What is the active dependency state for TASK-100?',
  });
  assert.deepStrictEqual(changedPacket.recentDecisions.map(node => node.label), ['User Decision: DECISION-100']);
});

test('retrieves archived history through its exact archive and handoff citations', () => {
  const root = archivedHistoryFixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-08-04T00:00:00.000Z' });
  const results = queryProjectGraph(graph, 'What decision governs TASK-099?');

  assert.ok(graph.sourceFingerprint.sources.some(source => source.relativePath === 'docs/board/archive/2026-08.md'));
  assert.ok(results.some(result => result.id === 'task:TASK-099' && result.source === 'docs/board/archive/2026-08.md'));
  assert.ok(results.some(result => result.id === 'handoff:docs/handoffs/TASK-099.md'
    && result.source === 'docs/handoffs/TASK-099.md'));
  assert.ok(graph.edges.some(edge => edge.from === 'task:TASK-099'
    && edge.to === 'handoff:docs/handoffs/TASK-099.md'
    && edge.source === 'docs/board/archive/2026-08.md'));
  assert.deepStrictEqual(validateProjectGraph(root, graph), []);
});

test('retrieves a linked archived predecessor for a prior-decision regression question', () => {
  const root = archivedHistoryFixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-08-04T00:00:00.000Z' });
  const results = queryProjectGraph(graph, 'What prior decision explains this regression?', { currentTask: 'TASK-100' });

  assert.ok(results.some(result => result.id === 'task:TASK-099'
    && result.source === 'docs/board/archive/2026-08.md'));
});

test('routine current-task context keeps a linked archived predecessor but excludes same-lane archived siblings', () => {
  const root = archivedHistoryFixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-08-04T00:00:00.000Z' });
  const results = queryProjectGraph(graph, 'What should I work on next?', { currentTask: 'TASK-100' });

  assert.ok(results.some(result => result.id === 'task:TASK-099'));
  assert.ok(!results.some(result => result.id === 'task:TASK-098'));
});

test('contradictory graph evidence falls back to the authoritative record route', () => {
  const root = archivedHistoryFixture();
  const graph = buildProjectGraph(root, { generatedAt: '2026-08-04T00:00:00.000Z' });
  graph.edges.push({
    from: 'task:TASK-100',
    to: 'task:TASK-404',
    type: 'depends-on',
    source: 'docs/handoffs/TASK-100.md',
    status: 'confirmed',
  });
  writeProjectGraph(root, graph);

  const context = resolveProjectContext(root, 'What prior decision explains TASK-100 regression?');
  assert.strictEqual(context.route, 'normalized-record-fallback');
  assert.ok(context.findings.some(finding => /endpoint is missing/i.test(finding)));
  assert.ok(context.results.some(result => result.source === 'docs/board/archive/2026-08.md'));
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
