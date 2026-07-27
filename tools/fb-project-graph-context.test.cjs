#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { compileDeltaContext, compileBfmReconciliation } = require('./fb-project-graph.cjs');

function write(root, relative, contents) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function handoff(task, lane, status, extra = '') {
  return `---
type: fb-lane-handoff
task: ${task}
lane: ${lane}
status: ${status}
approval: approved
record_model: normalized-v1
---

# ${task}

## User Decision

Keep the worker bounded and opt-in.

## Assumptions

The focused proof is sufficient.

## Acceptance Criteria

- Return only source-cited evidence.

## Required Output

One compact worker packet.

## Verification

[QA](../qa/${task}.md)
${extra}`;
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-context-'));
  const workstreams = [
    ['Product/User', 'fb-product'], ['Business', 'fb-business'], ['Design', 'fb-design'],
    ['Tech', 'fb-tech'], ['Discovery', 'fb-discovery'], ['Bugs', 'fb-bugs'],
  ];
  write(root, 'PROJECT_BOARD.md', `# Board

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
${workstreams.map(([workstream], index) => `| TASK-${101 + index} | In Progress | FB-${workstream} | Context | Keep ${workstream} focused | none | [Handoff](docs/handoffs/TASK-${101 + index}.md) |`).join('\n')}
`);
  write(root, 'docs/handoffs/index.md', '# Handoff index\n');
  for (const [workstream, lane] of workstreams) {
    const index = workstreams.findIndex(item => item[0] === workstream);
    const task = `TASK-${101 + index}`;
    write(root, `docs/handoffs/${task}.md`, handoff(task, lane, 'ready'));
    write(root, `docs/qa/${task}.md`, `# QA\n\n${'Focused proof. '.repeat(200)}\n`);
    write(root, `docs/workstreams/${lane}.md`, `# ${workstream}\n\n- [${task}](../handoffs/${task}.md)\n`);
  }
  return { root, workstreams };
}

test('delta context extracts bounded changed evidence and moves known sources to references', () => {
  const { root } = fixture();
  const first = compileDeltaContext(root, {
    taskId: 'TASK-104', workstream: 'Tech',
    question: 'What evidence is required to implement TASK-104?',
    requiredOutput: 'A compact implementation packet.',
  });
  assert.strictEqual(first.schema, 'fb-context-packet-v1');
  assert.strictEqual(first.route, 'project-graph');
  assert.strictEqual(first.taskId, 'TASK-104');
  assert.strictEqual(first.workstream, 'Tech');
  assert.strictEqual(first.activeTaskNode.id, 'task:TASK-104');
  assert.match(first.currentObjective, /Keep Tech focused/);
  assert.deepStrictEqual(first.userDecisions, ['Keep the worker bounded and opt-in.']);
  assert.deepStrictEqual(first.approvedDecisions, ['Keep the worker bounded and opt-in.']);
  assert.deepStrictEqual(first.assumptions, ['The focused proof is sufficient.']);
  assert.deepStrictEqual(first.acceptanceCriteria, ['Return only source-cited evidence.']);
  assert.strictEqual(first.requiredOutput, 'A compact implementation packet.');
  assert.ok(first.changedEvidence.length > 0);
  assert.ok(first.changedEvidence.every(item => !path.isAbsolute(item.source) && /^[a-f0-9]{64}$/.test(item.sha256)));
  assert.ok(first.changedEvidence.every(item => item.excerpt.length <= 1600));
  assert.ok(first.metrics.changedEvidenceCharacters <= 4000);
  assert.ok(first.citations.length <= 4);
  assert.ok(first.changedEvidence.every(item => item.excerpt.length < fs.readFileSync(path.join(root, item.source), 'utf8').length));

  const second = compileDeltaContext(root, {
    taskId: 'TASK-104', workstream: 'Tech',
    question: 'What evidence is required to implement TASK-104?',
    requiredOutput: 'A compact implementation packet.', knownSourceHashes: first.nextSourceStateHashes,
  });
  assert.deepStrictEqual(second.changedEvidence, []);
  assert.ok(second.unchangedEvidence.length > 0);
  assert.ok(second.unchangedEvidence.every(item => Object.keys(item).sort().join(',') === 'sha256,source'));
});

test('delta context rejects unsafe input, forbidden content, and unhealthy graph state with normalized fallback', () => {
  const { root } = fixture();
  for (const options of [
    { taskId: '../TASK-104', workstream: 'Tech', question: 'What evidence is required?', requiredOutput: 'Packet.' },
    { taskId: 'TASK-104', workstream: 'Operations', question: 'What evidence is required?', requiredOutput: 'Packet.' },
    { taskId: 'TASK-104', workstream: 'Tech', question: 'Read the transcript please.', requiredOutput: 'Packet.' },
  ]) {
    const packet = compileDeltaContext(root, options);
    assert.strictEqual(packet.route, 'normalized-record-fallback');
    assert.ok(packet.fallbackReason);
  }
  fs.writeFileSync(path.join(root, 'docs/handoffs/TASK-104.md'), handoff('TASK-104', 'fb-tech', 'ready', '\n\nAuthorization: Bearer blocked'));
  const packet = compileDeltaContext(root, {
    taskId: 'TASK-104', workstream: 'Tech', question: 'What evidence is required?', requiredOutput: 'Packet.',
  });
  assert.strictEqual(packet.route, 'normalized-record-fallback');
  assert.match(packet.fallbackReason, /unhealthy|forbidden|sensitive/i);
});

test('BFM reconciliation returns an explicit disposition for every workstream and excludes terminal or unchanged handoffs', () => {
  const { root, workstreams } = fixture();
  for (const [task, lane, status] of [
    ['TASK-101', 'fb-product', 'completed'],
    ['TASK-102', 'fb-business', 'implemented'],
    ['TASK-103', 'fb-design', 'deferred'],
    ['TASK-104', 'fb-tech', 'done'],
    ['TASK-105', 'fb-discovery', 'unchanged'],
  ]) write(root, `docs/handoffs/${task}.md`, handoff(task, lane, status));
  const first = compileBfmReconciliation(root);
  assert.strictEqual(first.schema, 'fb-bfm-reconciliation-v1');
  assert.strictEqual(first.route, 'project-graph');
  assert.deepStrictEqual(first.dispositions.map(item => item.workstream), workstreams.map(item => item[0]));
  assert.strictEqual(first.dispositions.find(item => item.workstream === 'Business').disposition, 'None relevant');
  assert.ok(first.relevant.every(item => ['ready', 'blocked', 'changed', 'conflicting'].includes(item.status)));
  assert.deepStrictEqual(first.relevant.map(item => item.taskId), ['TASK-106']);

  const second = compileBfmReconciliation(root, { knownSourceHashes: first.nextSourceStateHashes });
  assert.ok(second.dispositions.every(item => item.disposition === 'None relevant'));
});

test('BFM reconciliation blocks duplicate contradictory ready task IDs and falls back when sources are missing', () => {
  const { root } = fixture();
  write(root, 'docs/handoffs/TASK-777.md', handoff('TASK-104', 'fb-business', 'ready'));
  const conflict = compileBfmReconciliation(root);
  assert.strictEqual(conflict.route, 'normalized-record-fallback');
  assert.match(conflict.fallbackReason, /duplicate|contradictory/i);

  fs.rmSync(path.join(root, 'docs/workstreams/fb-bugs.md'));
  const missing = compileBfmReconciliation(root);
  assert.strictEqual(missing.route, 'normalized-record-fallback');
  assert.match(missing.fallbackReason, /missing/i);
});
