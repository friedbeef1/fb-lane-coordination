'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const cli = path.join(__dirname, 'fb-lane.cjs');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-local-'));
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`ok - ${name}`); }
function invoke(operation, input, raw = false) {
  const file = path.join(fixture, 'request.json');
  fs.writeFileSync(file, raw ? input : JSON.stringify(input));
  const result = spawnSync(process.execPath, [cli, 'local', operation, file], { cwd: fixture, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.error, undefined);
  let body;
  try { body = JSON.parse(result.stdout); } catch { assert.fail(`Expected JSON local-command response, got: ${result.stdout}`); }
  return { ...result, body };
}
try {
  assert.equal(spawnSync('git', ['init', '-q'], { cwd: fixture }).status, 0);
  fs.writeFileSync(path.join(fixture, 'PROJECT_BOARD.md'), '# Project Board\n\n| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |\n|---|---|---|---|---|---|---|\n| TASK-001 | Ready | Product | Local | Example | None | None |\n');
  test('status operates without starting an MCP server', () => {
    const r = invoke('fb_lane_status', { context: true, workspacePath: fixture });
    assert.equal(r.status, 0); assert.equal(r.body.ok, true);
    assert.match(r.body.result.content[0].text, /TASK-001/);
  });
  test('unknown operations fail rather than claiming success', () => {
    const r = invoke('not_a_tool', { workspacePath: fixture });
    assert.equal(r.status, 1); assert.equal(r.body.ok, false);
    assert.match(r.body.error, /Unknown/);
  });
  test('malformed and non-object inputs fail before dispatch', () => {
    for (const input of ['{', 'null', '[]', '"text"']) {
      const r = invoke('fb_lane_claim', input, true);
      assert.equal(r.status, 1); assert.equal(r.body.ok, false);
    }
  });
  test('oversized request is rejected', () => {
    const r = invoke('fb_lane_status', ' '.repeat(1024 * 1024 + 1), true);
    assert.equal(r.status, 1); assert.match(r.body.error, /1 MiB/);
  });
  test('context validation is not bypassed by local transport', () => {
    const r = invoke('fb_project_context', { taskId: 'TASK-001', question: 'x', workspacePath: fixture });
    assert.equal(r.status, 1); assert.match(r.body.error, /concrete context question/);
  });
  test('context packet is available without MCP', () => {
    const r = invoke('fb_project_context', { taskId: 'TASK-001', question: 'What should happen next?', workspacePath: fixture });
    assert.equal(r.status, 0); assert.match(r.body.result.content[0].text, /TASK-001/);
  });
  test('invalid learning receipt cannot write project state', () => {
    const r = invoke('fb_learning_record', { receipt: {}, workspacePath: fixture });
    assert.equal(r.status, 1); assert.equal(r.body.ok, false);
  });
  test('learning evidence persists and can be read through local commands', () => {
    const receipt = {
      lessonId: 'LESSON-TECH-CACHE-501', runId: 'run-501', taskId: 'TASK-001', state: 'provisional',
      signature: { category: 'build', surface: 'cache', criterion: 'invalidation' }, workTypes: ['tech:cache'],
      cause: 'The first candidate left stale derived cache data.', currentRepair: 'Invalidate derived cache data after mutation.',
      treatment: { type: 'select_existing_check', value: 'cache-invalidation' },
      evidenceRefs: ['docs/qa/TASK-001.md#cache-regression'], owningRecord: 'docs/handoffs/TASK-001.md#project-learning',
      safetyClass: 'ordinary', applications: [], revisionCount: 0, active: true,
    };
    const recorded = invoke('fb_learning_record', { receipt, workspacePath: fixture });
    assert.equal(recorded.status, 0, recorded.body.error);
    const status = invoke('fb_learning_status', { workTypes: ['tech:cache'], workspacePath: fixture });
    assert.equal(status.status, 0);
    assert.match(status.body.result.content[0].text, /LESSON-TECH-CACHE-501/);
  });
  test('noncanonical checkout blocks every mutating local operation', () => {
    const git = spawnSync('git', ['init', '-q'], { cwd: fixture, encoding: 'utf8' });
    assert.equal(git.status, 0);
    const manifest = path.join(fixture, '.git/fb-checkout-migration.json');
    fs.writeFileSync(manifest, JSON.stringify({ version: 1, canonicalPath: '/not-this-checkout',
      taskRebind: { status: 'complete', pending: [] },
      checkouts: { [fs.realpathSync(fixture)]: { state: 'quarantined' } }, routingReceipts: {} }));
    try {
      for (const operation of ['fb_checkout_migration_commit', 'fb_checkout_migration_rebind', 'fb_control_event_record',
        'fb_learning_record', 'fb_learning_apply', 'fb_lane_claim', 'fb_lane_submit', 'fb_lane_merge']) {
        const r = invoke(operation, { workspacePath: fixture });
        assert.equal(r.status, 1, operation);
        assert.match(r.body.error, /CANONICAL|canonical|quarantined/, operation);
      }
    } finally { fs.unlinkSync(manifest); }
  });
  test('hook diagnostics cannot corrupt JSON or hide a failed release gate', () => {
    const config = path.join(fixture, '.fb-lane.json');
    fs.writeFileSync(config, JSON.stringify({ hooks: { 'pre-merge': 'echo rejected-by-project-gate; exit 1' } }));
    try {
      const r = invoke('fb_lane_merge', { taskId: 'TASK-001', workspacePath: fixture });
      assert.equal(r.status, 1);
      assert.match(r.body.error, /pre-merge failed/);
      assert.match(r.stderr, /rejected-by-project-gate/);
    } finally { fs.unlinkSync(config); }
  });
  test('missing repository is an error, not an empty ready queue', () => {
    const absent = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-no-board-'));
    try { const r = invoke('fb_lane_status', { workspacePath: absent });
      assert.equal(r.status, 1); assert.match(r.body.error, /PROJECT_BOARD/);
    } finally { fs.rmSync(absent, { recursive: true, force: true }); }
  });
  test('plugin does not automatically register MCP', () => {
    const packaged = path.join(root, 'plugins/fb-lane-coordination');
    const plugin = fs.existsSync(packaged) ? packaged : root;
    const manifest = JSON.parse(fs.readFileSync(path.join(plugin, '.codex-plugin/plugin.json')));
    assert.equal(manifest.mcpServers, undefined);
    assert.equal(fs.existsSync(path.join(plugin, '.mcp.json')), false);
  });
  console.log(`${passed} local-operation tests passed`);
} finally { fs.rmSync(fixture, { recursive: true, force: true }); }
