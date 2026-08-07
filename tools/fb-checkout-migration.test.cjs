#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const cliPath = path.join(__dirname, 'fb-lane.cjs');
const {
  checkoutMigrationSnapshot,
  scanWorkstreamHandoffs,
} = require('./fb-lane.cjs');

let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

function sha256(contents) {
  return crypto.createHash('sha256').update(contents).digest('hex');
}

function handoff(task, lane = 'fb-product', status = 'ready', body = '') {
  return `---\ntype: fb-lane-handoff\ntask: ${task}\nlane: ${lane}\nstatus: ${status}\n---\n\n# ${task}\n\n${body}\n`;
}

function board(task = 'TASK-001', status = 'Ready') {
  return `# Project Board\n\n## Active Workstreams\n\n| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |\n|---|---|---|---|---|---|---|\n| ${task} | ${status} | FB-Product / BFM | Test | Verify migration guard | (None) | (None) |\n`;
}

function makeRepo(prefix = 'fb-checkout-canonical-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  execFileSync('git', ['init', '-q'], { cwd: root, stdio: 'ignore' });
  fs.mkdirSync(path.join(root, 'docs', 'handoffs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'PROJECT_BOARD.md'), board(), 'utf8');
  return root;
}

function gitDirectory(root) {
  return path.resolve(root, execFileSync('git', ['rev-parse', '--git-common-dir'], {
    cwd: root,
    encoding: 'utf8',
  }).trim());
}

function writeManifest(root, manifest) {
  fs.writeFileSync(
    path.join(gitDirectory(root), 'fb-checkout-migration.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
}

function activeManifest(root, overrides = {}) {
  return {
    version: 1,
    canonicalPath: root,
    taskRebind: { status: 'complete', pending: [] },
    checkouts: {
      [root]: { state: 'active' },
    },
    routingReceipts: {},
    ...overrides,
  };
}

function runCli(root, args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
}

console.log('checkout migration drift');
test('same-relative-path content drift fails with both SHA-256 hashes and task metadata', () => {
  const canonical = makeRepo();
  const oldRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-old-'));
  try {
    fs.mkdirSync(path.join(oldRoot, 'docs', 'handoffs'), { recursive: true });
    const canonicalContents = handoff('TASK-DRIFT', 'fb-design', 'ready', 'Canonical body.');
    const oldContents = handoff('TASK-DRIFT', 'fb-design', 'ready', 'Different body.');
    fs.writeFileSync(path.join(canonical, 'docs', 'handoffs', 'TASK-DRIFT.md'), canonicalContents);
    fs.writeFileSync(path.join(oldRoot, 'docs', 'handoffs', 'TASK-DRIFT.md'), oldContents);
    fs.writeFileSync(path.join(gitDirectory(canonical), 'fb-handoff-audit-roots'), `${oldRoot}\n`);
    writeManifest(canonical, activeManifest(canonical));

    assert.throws(
      () => scanWorkstreamHandoffs(canonical),
      error => {
        assert.match(error.message, /HANDOFF_CONTENT_DRIFT/);
        assert.match(error.message, /TASK-DRIFT/);
        assert.match(error.message, /status=ready/);
        assert.match(error.message, new RegExp(sha256(canonicalContents)));
        assert.match(error.message, new RegExp(sha256(oldContents)));
        assert.match(error.message, new RegExp(oldRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        return true;
      }
    );
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(oldRoot, { recursive: true, force: true });
  }
});

test('hash-bound disposition accepts known drift and preserves canonical ready ordering', () => {
  const canonical = makeRepo();
  const oldRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-old-'));
  try {
    fs.mkdirSync(path.join(oldRoot, 'docs', 'handoffs'), { recursive: true });
    const canonicalContents = handoff('TASK-DESIGN', 'fb-design', 'ready', 'Canonical body.');
    fs.writeFileSync(path.join(canonical, 'docs', 'handoffs', '01-tech.md'), handoff('TASK-TECH', 'fb-tech'));
    fs.writeFileSync(path.join(canonical, 'docs', 'handoffs', '02-design.md'), canonicalContents);
    fs.writeFileSync(path.join(oldRoot, 'docs', 'handoffs', '02-design.md'), handoff('TASK-DESIGN', 'fb-design', 'ready', 'Old body.'));
    fs.writeFileSync(path.join(gitDirectory(canonical), 'fb-handoff-audit-roots'), `${oldRoot}\n`);
    writeManifest(canonical, activeManifest(canonical, {
      routingReceipts: {
        'docs/handoffs/02-design.md': {
          canonicalSha256: sha256(canonicalContents),
          disposition: 'canonical-content-retained',
        },
      },
    }));

    const result = scanWorkstreamHandoffs(canonical);
    assert.deepStrictEqual(result.selected, [
      'docs/handoffs/02-design.md',
      'docs/handoffs/01-tech.md',
    ]);
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(oldRoot, { recursive: true, force: true });
  }
});

test('a unique off-home Ready handoff still fails as an orphan', () => {
  const canonical = makeRepo();
  const oldRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-old-'));
  try {
    fs.mkdirSync(path.join(oldRoot, 'docs', 'handoffs'), { recursive: true });
    fs.writeFileSync(path.join(oldRoot, 'docs', 'handoffs', 'orphan.md'), handoff('TASK-ORPHAN'));
    fs.writeFileSync(path.join(gitDirectory(canonical), 'fb-handoff-audit-roots'), `${oldRoot}\n`);
    writeManifest(canonical, activeManifest(canonical));
    assert.throws(() => scanWorkstreamHandoffs(canonical), /READINESS_FALSE_NEGATIVE[\s\S]*orphan\.md/);
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(oldRoot, { recursive: true, force: true });
  }
});

test('a unique non-ready off-home handoff fails as undispositioned content drift', () => {
  const canonical = makeRepo();
  const oldRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-old-'));
  try {
    fs.mkdirSync(path.join(oldRoot, 'docs', 'handoffs'), { recursive: true });
    fs.writeFileSync(
      path.join(oldRoot, 'docs', 'handoffs', 'historical.md'),
      handoff('TASK-HISTORICAL', 'fb-design', 'routed')
    );
    fs.writeFileSync(path.join(gitDirectory(canonical), 'fb-handoff-audit-roots'), `${oldRoot}\n`);
    writeManifest(canonical, activeManifest(canonical));
    assert.throws(
      () => scanWorkstreamHandoffs(canonical),
      /HANDOFF_CONTENT_DRIFT[\s\S]*historical\.md[\s\S]*canonical=missing/
    );
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(oldRoot, { recursive: true, force: true });
  }
});

test('an unreadable handoff source fails the audit closed', () => {
  const canonical = makeRepo();
  const oldRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-old-'));
  try {
    fs.mkdirSync(path.join(oldRoot, 'docs', 'handoffs'), { recursive: true });
    fs.symlinkSync('loop.md', path.join(oldRoot, 'docs', 'handoffs', 'loop.md'));
    fs.writeFileSync(path.join(gitDirectory(canonical), 'fb-handoff-audit-roots'), `${oldRoot}\n`);
    writeManifest(canonical, activeManifest(canonical));
    assert.throws(() => scanWorkstreamHandoffs(canonical), /READINESS_AUDIT_INCOMPLETE[\s\S]*loop\.md/);
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(oldRoot, { recursive: true, force: true });
  }
});

test('a stale routing receipt does not authorize changed canonical content', () => {
  const canonical = makeRepo();
  const oldRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-old-'));
  try {
    fs.mkdirSync(path.join(oldRoot, 'docs', 'handoffs'), { recursive: true });
    fs.writeFileSync(path.join(canonical, 'docs', 'handoffs', 'TASK-DRIFT.md'), handoff('TASK-DRIFT', 'fb-tech', 'ready', 'New canonical.'));
    fs.writeFileSync(path.join(oldRoot, 'docs', 'handoffs', 'TASK-DRIFT.md'), handoff('TASK-DRIFT', 'fb-tech', 'ready', 'Old source.'));
    fs.writeFileSync(path.join(gitDirectory(canonical), 'fb-handoff-audit-roots'), `${oldRoot}\n`);
    writeManifest(canonical, activeManifest(canonical, {
      routingReceipts: {
        'docs/handoffs/TASK-DRIFT.md': {
          canonicalSha256: '0'.repeat(64),
          disposition: 'canonical-content-retained',
        },
      },
    }));
    assert.throws(() => scanWorkstreamHandoffs(canonical), /HANDOFF_CONTENT_DRIFT/);
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(oldRoot, { recursive: true, force: true });
  }
});

console.log('checkout migration lifecycle');
test('snapshot reports active checkout, canonical path, drift count, and awaiting task rebind', () => {
  const root = makeRepo();
  try {
    writeManifest(root, activeManifest(root, {
      taskRebind: { status: 'awaiting-task-rebind', pending: ['FB-Design', 'FB-Tech'] },
      unresolvedDrift: [{ relative: 'docs/handoffs/TASK-X.md' }],
    }));
    const snapshot = checkoutMigrationSnapshot(root);
    assert.strictEqual(snapshot.currentPath, fs.realpathSync(root));
    assert.strictEqual(snapshot.canonicalPath, fs.realpathSync(root));
    assert.strictEqual(snapshot.state, 'active');
    assert.strictEqual(snapshot.unresolvedDrift, 1);
    assert.deepStrictEqual(snapshot.taskRebind, {
      status: 'awaiting-task-rebind',
      pending: ['FB-Design', 'FB-Tech'],
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('snapshot preserves every explicit checkout lifecycle state', () => {
  const root = makeRepo();
  const quarantined = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-quarantined-'));
  const pending = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-pending-'));
  const retired = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-retired-'));
  try {
    writeManifest(root, activeManifest(root, {
      checkouts: {
        [root]: { state: 'active' },
        [quarantined]: { state: 'quarantined' },
        [pending]: { state: 'retirement-pending' },
        [retired]: { state: 'retired' },
      },
    }));
    assert.strictEqual(checkoutMigrationSnapshot(root).state, 'active');
    const manifestPath = path.join(gitDirectory(root), 'fb-checkout-migration.json');
    for (const [checkout, state] of [
      [quarantined, 'quarantined'],
      [pending, 'retirement-pending'],
      [retired, 'retired'],
    ]) {
      const result = spawnSync(process.execPath, ['-e', `
        const runtime = require(${JSON.stringify(path.join(__dirname, 'fb-lane.cjs'))});
        process.stdout.write(runtime.checkoutMigrationSnapshot(process.cwd()).state);
      `], {
        cwd: checkout,
        encoding: 'utf8',
        env: { ...process.env, FB_CHECKOUT_MIGRATION_MANIFEST: manifestPath },
      });
      assert.strictEqual(result.status, 0, result.stderr);
      assert.strictEqual(result.stdout, state);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(quarantined, { recursive: true, force: true });
    fs.rmSync(pending, { recursive: true, force: true });
    fs.rmSync(retired, { recursive: true, force: true });
  }
});

test('task rebind cannot be complete while pending tasks remain', () => {
  const root = makeRepo();
  try {
    writeManifest(root, activeManifest(root, {
      taskRebind: { status: 'complete', pending: ['FB-Design'] },
    }));
    assert.throws(() => checkoutMigrationSnapshot(root), /TASK_REBIND_PENDING/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('retirement cannot close while task rebind is pending', () => {
  const root = makeRepo();
  const oldRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-retired-'));
  try {
    writeManifest(root, activeManifest(root, {
      taskRebind: { status: 'awaiting-task-rebind', pending: ['FB-Design'] },
      checkouts: {
        [root]: { state: 'active' },
        [oldRoot]: { state: 'retired' },
      },
    }));
    assert.throws(() => checkoutMigrationSnapshot(root), /TASK_REBIND_PENDING/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(oldRoot, { recursive: true, force: true });
  }
});

console.log('canonical checkout command guards');
test('status on a quarantined checkout prints migration state and fails closed', () => {
  const root = makeRepo();
  const canonical = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-active-'));
  try {
    writeManifest(root, activeManifest(canonical, {
      taskRebind: { status: 'awaiting-task-rebind', pending: ['FB-Design'] },
      checkouts: {
        [canonical]: { state: 'active' },
        [root]: { state: 'quarantined' },
      },
    }));
    const result = runCli(root, ['status', '--details']);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(`${result.stdout}\n${result.stderr}`, /FB_CHECKOUT_NOT_CANONICAL/);
    assert.match(result.stdout, /Checkout current path:/);
    assert.match(result.stdout, /Checkout canonical path:/);
    assert.match(result.stdout, /Checkout state: quarantined/);
    assert.match(result.stdout, /Task rebind: awaiting-task-rebind \(1 pending\)/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(canonical, { recursive: true, force: true });
  }
});

test('claim is rejected before board or context mutation outside the canonical checkout', () => {
  const root = makeRepo();
  const canonical = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-active-'));
  try {
    const originalBoard = fs.readFileSync(path.join(root, 'PROJECT_BOARD.md'), 'utf8');
    writeManifest(root, activeManifest(canonical, {
      checkouts: {
        [canonical]: { state: 'active' },
        [root]: { state: 'quarantined' },
      },
    }));
    const result = runCli(root, ['claim', 'TASK-001', 'Product', '(None)', '--no-worktree']);
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(`${result.stdout}\n${result.stderr}`, /FB_CHECKOUT_NOT_CANONICAL/);
    assert.strictEqual(fs.readFileSync(path.join(root, 'PROJECT_BOARD.md'), 'utf8'), originalBoard);
    assert.strictEqual(fs.existsSync(path.join(root, '.codex', 'current_task.md')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(canonical, { recursive: true, force: true });
  }
});

test('bootstrap and quick handoff writes are rejected before mutation outside canonical checkout', () => {
  for (const args of [
    ['bootstrap', '--platform', 'codex'],
    ['quick', 'Product', 'README.md', 'Guarded quick write', '--approval-ref', 'APPROVED-1', '--no-worktree'],
  ]) {
    const root = makeRepo();
    const canonical = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-active-'));
    try {
      writeManifest(root, activeManifest(canonical, {
        checkouts: {
          [canonical]: { state: 'active' },
          [root]: { state: 'quarantined' },
        },
      }));
      const before = fs.readdirSync(root).sort();
      const result = runCli(root, args);
      assert.strictEqual(result.status, 1, result.stdout || result.stderr);
      assert.match(`${result.stdout}\n${result.stderr}`, /FB_CHECKOUT_NOT_CANONICAL/);
      assert.deepStrictEqual(fs.readdirSync(root).sort(), before);
      assert.deepStrictEqual(fs.readdirSync(path.join(root, 'docs', 'handoffs')).sort(), []);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(canonical, { recursive: true, force: true });
    }
  }
});

console.log(`\n✅ ${passed} checkout migration checks passed.`);
