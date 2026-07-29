#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const lane = require('./fb-lane.cjs');

const BOARD = `# Project Board

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-104 | Done | FB-Tech | History | Old completed task | old.js | [Handoff](docs/handoffs/TASK-104.md) |
| TASK-103 | Staging QA | FB-Design | Candidate | Check the candidate | design/** | [QA](docs/qa/TASK-103.md) |
| TASK-102 | Blocked | FB-Tech | Runtime | Resolve provider access | src/provider.js | [Handoff](docs/handoffs/TASK-102.md) |
| TASK-101 | In Progress | FB-Tech | Runtime | Implement the active change | src/active.js | [Handoff](docs/handoffs/TASK-101.md) |

---

### TASK-104 - Old completed task

This historical detail must not enter routine orientation.

### TASK-101 - Active change

This long implementation narrative belongs in the handoff.
`;

test('CLI exports the compact-board behavior used by status and closeout', () => {
  assert.strictEqual(typeof lane.renderBoardContext, 'function');
  assert.strictEqual(typeof lane.compactBoardFiles, 'function');
});

test('compact context keeps active coordination and excludes terminal history and detail blocks', () => {
  const output = lane.renderBoardContext(BOARD);

  assert.match(output, /^FB active board context/m);
  assert.match(output, /TASK-101[\s\S]*In Progress[\s\S]*Implement the active change[\s\S]*src\/active\.js/);
  assert.match(output, /TASK-102[\s\S]*Blocked[\s\S]*src\/provider\.js/);
  assert.match(output, /TASK-103[\s\S]*Staging QA/);
  assert.doesNotMatch(output, /TASK-104|Old completed task|historical detail|implementation narrative/);
  assert.ok(output.length < 2_000, `expected compact output, received ${output.length} characters`);
});

test('compact context keeps critical work and reports overflow within its character budget', () => {
  const rows = [
    '| TASK-301 | In Progress | FB-Tech | Runtime | Current work | src/current.js | [Handoff](docs/handoffs/TASK-301.md) |',
    '| TASK-302 | Blocked | FB-Tech | Runtime | Blocked work | src/blocked.js | [Handoff](docs/handoffs/TASK-302.md) |',
    '| TASK-303 | Ready | FB-Design | Design | Next work | design/** | [Handoff](docs/handoffs/TASK-303.md) |',
    ...Array.from({ length: 30 }, (_, index) =>
      `| TASK-${400 + index} | Staging QA | FB-Tech | Candidate | Candidate ${index} | candidate/${index}.js | [QA](docs/qa/TASK-${400 + index}.md) |`
    ),
  ];
  const output = lane.renderBoardContext(`${BOARD}\n${rows.join('\n')}`, { maxChars: 1_500 });

  assert.match(output, /TASK-301/);
  assert.match(output, /TASK-302/);
  assert.match(output, /TASK-303/);
  assert.match(output, /omitted from this packet/);
  assert.ok(output.length <= 1_500, `expected <= 1500 characters, received ${output.length}`);
});

test('oversized board archives older terminal rows and detail blocks exactly once', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-board-context-'));
  try {
    const terminalRows = Array.from({ length: 5 }, (_, index) => {
      const id = 205 - index;
      return `| TASK-${id} | Done | FB-Tech | History | Completed ${id} | (None) | [Handoff](docs/handoffs/TASK-${id}.md) |`;
    });
    const details = Array.from({ length: 5 }, (_, index) => {
      const id = 205 - index;
      return `### TASK-${id} - Completed ${id}\n\nPreserved detail ${id}.\n`;
    });
    const boardPath = path.join(root, 'PROJECT_BOARD.md');
    const source = `# Project Board

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-206 | In Progress | FB-Tech | Runtime | Active work | src/active.js | [Handoff](docs/handoffs/TASK-206.md) |
${terminalRows.join('\n')}

---

${details.join('\n')}`;
    fs.writeFileSync(boardPath, source);

    const result = lane.compactBoardFiles(boardPath, {
      thresholdBytes: 1,
      retainTerminal: 2,
      now: new Date('2026-07-29T00:00:00Z'),
    });

    assert.strictEqual(result.changed, true);
    assert.deepStrictEqual(result.archivedTaskIds, ['TASK-203', 'TASK-202', 'TASK-201']);
    const board = fs.readFileSync(boardPath, 'utf8');
    assert.match(board, /TASK-205/);
    assert.match(board, /TASK-204/);
    assert.doesNotMatch(board, /TASK-203|TASK-202|TASK-201|Preserved detail 203/);
    const archive = fs.readFileSync(result.archivePath, 'utf8');
    for (const id of [203, 202, 201]) {
      assert.match(archive, new RegExp(`TASK-${id}`));
      assert.match(archive, new RegExp(`Preserved detail ${id}`));
    }
    assert.doesNotMatch(archive, /TASK-205|TASK-204/);

    const second = lane.compactBoardFiles(boardPath, {
      thresholdBytes: 1,
      retainTerminal: 2,
      now: new Date('2026-07-29T00:00:00Z'),
    });
    assert.strictEqual(second.changed, false);
    assert.strictEqual(fs.readFileSync(result.archivePath, 'utf8'), archive);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('board below the threshold is byte-identical and creates no archive', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-board-context-'));
  try {
    const boardPath = path.join(root, 'PROJECT_BOARD.md');
    fs.writeFileSync(boardPath, BOARD);
    const before = fs.readFileSync(boardPath);
    const result = lane.compactBoardFiles(boardPath, { thresholdBytes: 1_000_000 });
    assert.strictEqual(result.changed, false);
    assert.ok(fs.readFileSync(boardPath).equals(before));
    assert.strictEqual(fs.existsSync(path.join(root, 'docs', 'board', 'archive')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('status context emits the bounded active packet instead of the beginner card or full board', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-board-context-'));
  try {
    fs.writeFileSync(path.join(root, 'PROJECT_BOARD.md'), BOARD);
    const result = spawnSync(process.execPath, [path.join(__dirname, 'fb-lane.cjs'), 'status', '--context'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /^FB active board context/m);
    assert.match(result.stdout, /TASK-101/);
    assert.doesNotMatch(result.stdout, /TASK-104|Current objective:|historical detail/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('MCP status context returns the same bounded active packet', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-board-context-'));
  try {
    fs.writeFileSync(path.join(root, 'PROJECT_BOARD.md'), BOARD);
    const requests = [
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'fb_lane_status',
          arguments: { context: true, workspacePath: root },
        },
      },
    ].map(request => JSON.stringify(request)).join('\n');
    const result = spawnSync(process.execPath, [path.join(__dirname, 'fb-lane.cjs'), 'mcp'], {
      cwd: root,
      encoding: 'utf8',
      input: `${requests}\n`,
    });
    assert.strictEqual(result.status, 0, result.stderr);
    const responses = result.stdout.trim().split(/\r?\n/).map(line => JSON.parse(line));
    const status = responses.find(response => response.id === 2);
    assert.ok(status, result.stdout);
    assert.match(status.result.content[0].text, /^FB active board context/m);
    assert.match(status.result.content[0].text, /TASK-101/);
    assert.doesNotMatch(status.result.content[0].text, /TASK-104|historical detail/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('completed-task helper updates status and invokes threshold archival', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-board-context-'));
  try {
    const rows = Array.from({ length: 4 }, (_, index) => {
      const id = 604 - index;
      return `| TASK-${id} | Done | FB-Tech | History | Completed ${id} | (None) | [Handoff](docs/handoffs/TASK-${id}.md) |`;
    });
    const boardPath = path.join(root, 'PROJECT_BOARD.md');
    fs.writeFileSync(boardPath, `# Project Board

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-605 | In Progress | FB-Tech | Runtime | Finishing work | src/work.js | [Handoff](docs/handoffs/TASK-605.md) |
${rows.join('\n')}
`);
    const result = lane.completeBoardTask(boardPath, 'TASK-605', {
      thresholdBytes: 1,
      retainTerminal: 2,
      now: new Date('2026-07-29T00:00:00Z'),
    });
    assert.strictEqual(result.changed, true);
    const board = fs.readFileSync(boardPath, 'utf8');
    assert.match(board, /\| TASK-605 \| Done \| FB-Tech \| Runtime \| Finishing work \| \(None\) \|/);
    assert.doesNotMatch(board, /TASK-603|TASK-602|TASK-601/);
    assert.deepStrictEqual(result.archivedTaskIds, ['TASK-603', 'TASK-602', 'TASK-601']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
