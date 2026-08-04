#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const lane = require('./fb-lane.cjs');
const { renderWorkstreamSummary, refreshManagedWorkstreamCard } = require('./fb-board-context.cjs');

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
  assert.strictEqual(typeof lane.collectLifecycleFindings, 'function');
});

test('workstream projection lists every active lane task, bounded recent terminals, and historical lookup', () => {
  const board = `# Project Board

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-401 | In Progress | FB-Tech | Runtime | Build the active change | src/active.js | [Handoff](docs/handoffs/TASK-401.md) |
| TASK-402 | Ready | FB-Tech | Intake | Awaiting Product intake | (None) | [Handoff](docs/handoffs/TASK-402.md) |
| TASK-403 | Blocked | FB-Tech | Runtime | Provider access is unavailable | src/provider.js | [Handoff](docs/handoffs/TASK-403.md) |
| TASK-404 | Staging QA | FB-Tech | Runtime | Candidate waits for review | src/candidate.js | [QA](docs/qa/TASK-404.md) |
| TASK-405 | Inbox | FB-Tech | Runtime | Still needs triage | (None) | [Handoff](docs/handoffs/TASK-405.md) |
| TASK-406 | Done | FB-Tech | History | Delivered one | (None) | [Handoff](docs/handoffs/TASK-406.md) |
| TASK-407 | Rejected | FB-Tech | History | Rejected two | (None) | [Handoff](docs/handoffs/TASK-407.md) |
| TASK-408 | Deferred | FB-Tech | History | Deferred three | (None) | [Handoff](docs/handoffs/TASK-408.md) |
| TASK-409 | Done | FB-Tech | History | Older terminal | (None) | [Handoff](docs/handoffs/TASK-409.md) |
| TASK-410 | Ready | FB-Design | Design | Another lane | (None) | [Handoff](docs/handoffs/TASK-410.md) |
`;

  assert.strictEqual(typeof renderWorkstreamSummary, 'function');
  const summary = renderWorkstreamSummary(board, 'Tech');

  for (const heading of ['## Current', '## Next', '## Blocked', '## Recently delivered', '## Historical lookup']) {
    assert.match(summary, new RegExp(`^${heading}$`, 'm'));
  }
  for (const taskId of ['TASK-401', 'TASK-402', 'TASK-403', 'TASK-404', 'TASK-405']) {
    assert.match(summary, new RegExp(taskId));
  }
  assert.match(summary, /Product intake/i);
  for (const taskId of ['TASK-406', 'TASK-407', 'TASK-408']) {
    assert.match(summary, new RegExp(taskId));
  }
  assert.match(summary, /\[Handoff\]\(\.\.\/handoffs\/TASK-406\.md\)/);
  assert.doesNotMatch(summary, /\[Handoff\]\(docs\/handoffs\/TASK-406\.md\)/);
  assert.doesNotMatch(summary, /TASK-409|TASK-410/);
  assert.match(summary, /\]\(\.\.\/handoffs\/index\.md\)/);
  assert.match(summary, /\]\(\.\.\/board\/archive\/\)/);

  const oversizedRecent = renderWorkstreamSummary(board, 'Tech', { recentTerminal: 4 });
  assert.doesNotMatch(oversizedRecent, /TASK-409/);
});

test('managed workstream refresh preserves project-owned prose outside its explicit block', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-board-context-'));
  try {
    const cardPath = path.join(root, 'docs', 'workstreams', 'fb-tech.md');
    const prefix = '# Tech Workstream Status\n\nProject-owned introduction.\n\n';
    const suffix = '\n\n## Local notes\nKeep this prose exactly.\n';
    const start = '<!-- FB-LANE:WORKSTREAM-SUMMARY:START -->';
    const end = '<!-- FB-LANE:WORKSTREAM-SUMMARY:END -->';
    fs.mkdirSync(path.dirname(cardPath), { recursive: true });
    fs.writeFileSync(cardPath, `${prefix}${start}\nlegacy generated summary\n${end}${suffix}`);

    assert.strictEqual(typeof refreshManagedWorkstreamCard, 'function');
    refreshManagedWorkstreamCard(cardPath, '## Current\n- TASK-401');

    const refreshed = fs.readFileSync(cardPath, 'utf8');
    assert.strictEqual(refreshed, `${prefix}${start}\n## Current\n- TASK-401\n${end}${suffix}`);
    refreshManagedWorkstreamCard(cardPath, '## Current\n- TASK-402');
    assert.strictEqual(fs.readFileSync(cardPath, 'utf8'), `${prefix}${start}\n## Current\n- TASK-402\n${end}${suffix}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function writeLifecycleHandoff(root, taskId, body) {
  const handoffs = path.join(root, 'docs', 'handoffs');
  fs.mkdirSync(handoffs, { recursive: true });
  fs.writeFileSync(path.join(handoffs, `${taskId}.md`), body);
}

test('lifecycle diagnostics report only prospective invalid state without changing board history or locks', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-board-context-'));
  try {
    const boardPath = path.join(root, 'PROJECT_BOARD.md');
    const board = `# Project Board

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-201 | Staging QA | FB-Tech | Runtime | Valid candidate | src/valid.js | [Handoff](docs/handoffs/TASK-201.md) |
| TASK-202 | Staging QA | FB-Tech | Runtime | Missing gate | src/no-gate.js | [Handoff](docs/handoffs/TASK-202.md) |
| TASK-203 | Staging QA | FB-Tech | Runtime | Missing owner action | src/no-owner.js | [Handoff](docs/handoffs/TASK-203.md) |
| TASK-204 | Done | FB-Tech | History | Terminal done | src/done.js | [Handoff](docs/handoffs/TASK-204.md) |
| TASK-205 | Deferred | FB-Tech | History | Terminal deferred | src/deferred.js | [Handoff](docs/handoffs/TASK-205.md) |
| TASK-206 | Superseded | FB-Tech | History | Terminal superseded | src/superseded.js | [Handoff](docs/handoffs/TASK-206.md) |
| TASK-207 | Rejected | FB-Tech | History | Terminal rejected | src/rejected.js | [Handoff](docs/handoffs/TASK-207.md) |
| TASK-208 | Staging QA | FB-Tech | History | Legacy candidate | src/legacy.js | [Handoff](docs/handoffs/TASK-208.md) |
| TASK-209 | Done | FB-Tech | History | Historical surface | src/historical.js | (None) |
`;
    fs.writeFileSync(boardPath, board);
    writeLifecycleHandoff(root, 'TASK-201', `---
fb_harness: v3
---

External gates: Product verifies the staging candidate.
Remaining owner/action: FB-Product runs the focused staging review.
`);
    writeLifecycleHandoff(root, 'TASK-202', `---
fb_harness: v3
---

External gates: none
Remaining owner/action: FB-Product decides whether to integrate the candidate.
`);
    writeLifecycleHandoff(root, 'TASK-203', `---
fb_harness: v3
---

External gates: James approves Push Live.
Remaining owner/action: none
`);
    for (const [taskId, activeLocks] of [
      ['TASK-204', 'src/done.js'],
      ['TASK-205', 'src/deferred.js'],
      ['TASK-206', 'src/superseded.js'],
      ['TASK-207', 'src/rejected.js'],
    ]) {
      writeLifecycleHandoff(root, taskId, `---
fb_harness: v3
---

Active locks: ${activeLocks}
`);
    }
    writeLifecycleHandoff(root, 'TASK-208', '# TASK-208\n\nHistorical handoff without prospective lifecycle fields.\n');

    const findings = lane.collectLifecycleFindings(board, { rootDir: root });

    assert.deepStrictEqual(
      findings.map(finding => [finding.taskId, finding.code]),
      [
        ['TASK-202', 'staging-without-gate'],
        ['TASK-203', 'staging-without-owner-action'],
        ['TASK-204', 'terminal-with-locks'],
        ['TASK-205', 'terminal-with-locks'],
        ['TASK-206', 'terminal-with-locks'],
        ['TASK-207', 'terminal-with-locks'],
      ]
    );
    assert.match(findings[0].nextAction, /Product: record a concrete external gate or move TASK-202 to a terminal status/i);
    assert.match(findings[1].nextAction, /Product: record a concrete remaining owner\/action or move TASK-203 to a terminal status/i);
    assert.match(findings[2].nextAction, /Product: confirm no active owner needs the locks, then release them explicitly/i);
    assert.strictEqual(fs.readFileSync(boardPath, 'utf8'), board);
    assert.doesNotMatch(lane.renderBoardContext(board), /TASK-207/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doctor reports lifecycle findings with the task ID and Product action without mutating the board', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-board-context-'));
  try {
    const boardPath = path.join(root, 'PROJECT_BOARD.md');
    const board = `# Project Board

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-301 | Staging QA | FB-Tech | Runtime | Missing gate | src/no-gate.js | [Handoff](docs/handoffs/TASK-301.md) |
`;
    fs.writeFileSync(boardPath, board);
    writeLifecycleHandoff(root, 'TASK-301', `---
fb_harness: v3
---

Review state: not reviewable
External gates: none
Remaining owner/action: FB-Product decides whether to integrate the candidate.
`);

    const result = spawnSync(process.execPath, [path.join(__dirname, 'fb-lane.cjs'), 'doctor'], {
      cwd: root,
      encoding: 'utf8',
    });

    assert.strictEqual(result.status, 1, `${result.stderr}\n${result.stdout}`);
    assert.match(result.stdout, /TASK-301[\s\S]*staging-without-gate/);
    assert.match(result.stdout, /Product: record a concrete external gate or move TASK-301 to a terminal status/i);
    assert.strictEqual(fs.readFileSync(boardPath, 'utf8'), board);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
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
      return `### TASK-${id} - Completed ${id}\n\nPreserved detail ${id}. [QA](docs/qa/TASK-${id}.md)\n`;
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
      assert.match(archive, new RegExp(`\\[Handoff\\]\\(\\.\\.\\/\\.\\.\\/handoffs\\/TASK-${id}\\.md\\)`));
      assert.match(archive, new RegExp(`\\[QA\\]\\(\\.\\.\\/\\.\\.\\/qa\\/TASK-${id}\\.md\\)`));
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
    const boardPath = path.join(root, 'PROJECT_BOARD.md');
    fs.writeFileSync(boardPath, BOARD);
    const result = spawnSync(process.execPath, [path.join(__dirname, 'fb-lane.cjs'), 'status', '--context'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /^FB active board context/m);
    assert.match(result.stdout, /TASK-101/);
    assert.doesNotMatch(result.stdout, /TASK-104|Current objective:|historical detail/);
    assert.match(result.stdout, /\[handoff index\]\(docs\/handoffs\/index\.md\)/);
    assert.match(result.stdout, /\[board archives\]\(docs\/board\/archive\/\)/);
    assert.strictEqual(fs.readFileSync(boardPath, 'utf8'), BOARD);
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
