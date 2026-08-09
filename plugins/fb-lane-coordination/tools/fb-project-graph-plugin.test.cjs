#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { spawnSync } = require('node:child_process');

const {
  projectContextPacket,
} = require('./fb-project-graph.cjs');

function write(root, relative, contents) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function fixture(taskId = 'TASK-200') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-graph-plugin-'));
  write(root, 'PROJECT_BOARD.md', `# Board

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
| ${taskId} | In Progress | FB-Tech | Navigation | Route focused context | none | [Handoff](docs/handoffs/${taskId}.md); [QA](docs/qa/${taskId}.md) |
`);
  write(root, 'docs/handoffs/index.md', `# Index\n\n[${taskId}](${taskId}.md)\n`);
  write(root, `docs/handoffs/${taskId}.md`, `---
type: fb-lane-handoff
task: ${taskId}
lane: fb-tech
status: ready
approval: approved
record_model: normalized-v1
graph:
  verified_by:
    - verification:${taskId}
---

# ${taskId}

## User Decision: CONTEXT-DECISION

Use graph-first targeted reading.

## Evidence

[Experiment](../experiments/${taskId}.md)

## Verification

[QA](../qa/${taskId}.md)
`);
  write(root, `docs/experiments/${taskId}.md`, '# Experiment\n\nTargeted reading passed.\n');
  write(root, `docs/qa/${taskId}.md`, '# QA\n\nFocused checks passed.\n');
  write(root, 'docs/workstreams/fb-tech.md', `# Tech\n\n${taskId} is active.\n`);
  return root;
}

test('plugin routine context returns only active-subgraph citations', () => {
  const root = fixture();
  const packet = projectContextPacket(root, {
    taskId: 'TASK-200',
    question: 'What verifies TASK-200?',
  });
  assert.strictEqual(packet.route, 'project-graph');
  assert.strictEqual(packet.taskId, 'TASK-200');
  assert.ok(packet.facts.length > 0);
  assert.deepStrictEqual(packet.readableSources, [
    'PROJECT_BOARD.md',
    `docs/handoffs/TASK-200.md`,
    `docs/qa/TASK-200.md`,
  ]);
  assert.ok(packet.facts.every(fact => fact.citation?.source === fact.source));
  assert.ok(fs.existsSync(path.join(root, '.fb', 'graph', 'project-graph.json')));
});

test('plugin context routes project-specific task prefixes used by existing repositories', () => {
  const root = fixture('MEJA-111');
  const packet = projectContextPacket(root, {
    taskId: 'MEJA-111',
    question: 'What verifies MEJA-111?',
  });
  assert.strictEqual(packet.route, 'project-graph');
  assert.strictEqual(packet.taskId, 'MEJA-111');
  assert.deepStrictEqual(packet.readableSources, [
    'PROJECT_BOARD.md',
    `docs/handoffs/MEJA-111.md`,
    `docs/qa/MEJA-111.md`,
  ]);
});

test('plugin context refreshes stale derived state without broad fallback', () => {
  const root = fixture();
  projectContextPacket(root, { taskId: 'TASK-200', question: 'What is approved?' });
  fs.appendFileSync(path.join(root, 'docs/handoffs/TASK-200.md'), '\n## Scope\n\nFocused only.\n');
  const packet = projectContextPacket(root, {
    taskId: 'TASK-200',
    question: 'What decision governs TASK-200?',
  });
  assert.strictEqual(packet.route, 'project-graph');
  assert.ok(packet.refresh.changedSources.includes('docs/handoffs/TASK-200.md'));
});

test('unknown task returns the normal authoritative route instead of guessing', () => {
  const root = fixture();
  const packet = projectContextPacket(root, {
    taskId: 'TASK-999',
    question: 'What verifies TASK-999?',
  });
  assert.strictEqual(packet.route, 'normalized-record-fallback');
  assert.match(packet.reason, /not represented|insufficient/i);
  assert.deepStrictEqual(packet.readableSources, [
    'PROJECT_BOARD.md',
    'docs/handoffs/index.md',
  ]);
});

test('insufficient graph evidence returns the ordered authoritative route for a known task', () => {
  const root = fixture();
  write(root, 'PROJECT_BOARD.md', `# Board

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
| TASK-200 | In Progress | FB-Tech | Navigation | Route focused context | none | None |
`);
  write(root, 'docs/handoffs/index.md', '# Index\n\n[TASK-200 record](TASK-200-record.md)\n');
  write(root, 'docs/handoffs/TASK-200-record.md', '# TASK-200 record\n');
  fs.unlinkSync(path.join(root, 'docs/handoffs/TASK-200.md'));

  const packet = projectContextPacket(root, {
    taskId: 'TASK-200',
    question: 'What decision governs TASK-200?',
  });

  assert.strictEqual(packet.route, 'normalized-record-fallback');
  assert.match(packet.reason, /insufficient/i);
  assert.deepStrictEqual(packet.readableSources, [
    'PROJECT_BOARD.md',
    'docs/handoffs/index.md',
    'docs/handoffs/TASK-200-record.md',
  ]);
  assert.deepStrictEqual(packet.citations, packet.readableSources);
  assert.ok(packet.instructions.some(instruction => /Git history/i.test(instruction)));
  assert.ok(!packet.readableSources.some(source => /git:/i.test(source)));
});

test('bundled MCP lists and serves the read-only project context tool', () => {
  const root = fixture();
  const requests = [
    { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
    {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'fb_project_context',
        arguments: {
          taskId: 'TASK-200',
          question: 'What verifies TASK-200?',
          workspacePath: root,
        },
      },
    },
  ];
  const result = spawnSync(process.execPath, [path.join(__dirname, 'fb-lane.cjs'), 'mcp'], {
    cwd: root,
    input: `${requests.map(request => JSON.stringify(request)).join('\n')}\n`,
    encoding: 'utf8',
  });
  assert.strictEqual(result.status, 0, result.stderr);
  const responses = result.stdout.trim().split(/\n/).map(line => JSON.parse(line));
  assert.ok(responses[0].result.tools.some(tool => tool.name === 'fb_project_context'));
  const packet = JSON.parse(responses[1].result.content[0].text);
  assert.strictEqual(packet.route, 'project-graph');
  assert.deepStrictEqual(packet.readableSources, [
    'PROJECT_BOARD.md',
    `docs/handoffs/TASK-200.md`,
    `docs/qa/TASK-200.md`,
  ]);
});

test('package and active guidance expose graph-first routing without changing authority', () => {
  const containingRoot = path.resolve(__dirname, '..');
  const packaged = path.basename(containingRoot) === 'fb-lane-coordination'
    && path.basename(path.dirname(containingRoot)) === 'plugins';
  const repoRoot = packaged ? path.resolve(containingRoot, '..', '..') : containingRoot;
  const surfaceRoot = packaged ? containingRoot : repoRoot;
  const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tools/fb-package-manifest.json'), 'utf8'));
  assert.ok(manifest.includes('tools/fb-project-graph.cjs'));
  assert.ok(manifest.includes('tools/fb-project-graph-plugin.test.cjs'));
  assert.ok(manifest.includes('docs/fb/graph.md'));

  const cli = fs.readFileSync(path.join(surfaceRoot, 'tools/fb-lane.cjs'), 'utf8');
  assert.match(cli, /name:\s*'fb_project_context'/);
  assert.match(cli, /projectContextPacket/);

  for (const relative of [
    'docs/fb/README.md',
    'docs/fb/records.md',
    'skills/fb-lane-coordination/SKILL.md',
    'skills/project-coordination-setup/SKILL.md',
    'skills/bfm/SKILL.md',
    'skills/fb-product/SKILL.md',
    'skills/fb-business/SKILL.md',
    'skills/fb-design/SKILL.md',
    'skills/fb-tech/SKILL.md',
    'skills/fb-discovery/SKILL.md',
    'skills/fb-bugs/SKILL.md',
  ]) {
    const source = fs.readFileSync(path.join(surfaceRoot, relative), 'utf8');
    assert.match(source, /fb_project_context/);
    assert.match(source, /(?:source of truth|authoritative records)/i);
    assert.match(source, /fallback|falls? back/i);
  }
});
