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
  advanceCheckoutRetirement,
  checkoutMigrationSnapshot,
  commitCheckoutMigration,
  inventoryCheckoutMigration,
  recordCheckoutTaskRebind,
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

function commitAll(root, message) {
  execFileSync('git', ['add', '--all'], { cwd: root, stdio: 'ignore' });
  execFileSync('git', [
    '-c', 'user.name=FB Migration Test',
    '-c', 'user.email=fb-migration@example.invalid',
    'commit', '-q', '-m', message,
  ], { cwd: root, stdio: 'ignore' });
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

function dispositionedMigration(options) {
  const draft = inventoryCheckoutMigration(options);
  const dispositions = Object.fromEntries(draft.differences.map(difference => [
    difference.id,
    'reviewed-and-preserved',
  ]));
  return inventoryCheckoutMigration({ ...options, dispositions });
}

function runCli(root, args, env = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', ...env },
  });
}

function mcpRequest(root, name, args = {}, env = {}) {
  const result = spawnSync(process.execPath, [cliPath, 'mcp'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', ...env },
    input: `${JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: { workspacePath: root, ...args } },
    })}\n`,
  });
  const line = result.stdout.split(/\r?\n/).find(value => value.trim().startsWith('{'));
  assert.ok(line, result.stderr || result.stdout);
  return JSON.parse(line);
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
          sources: [{
            root: oldRoot,
            sha256: sha256(handoff('TASK-DESIGN', 'fb-design', 'ready', 'Old body.')),
          }],
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

test('a routing receipt is invalidated when an off-home source changes later', () => {
  const canonical = makeRepo();
  const oldRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-old-'));
  try {
    fs.mkdirSync(path.join(oldRoot, 'docs', 'handoffs'), { recursive: true });
    const canonicalContents = handoff('TASK-DRIFT', 'fb-tech', 'ready', 'Canonical source.');
    const oldContents = handoff('TASK-DRIFT', 'fb-tech', 'ready', 'Reviewed old source.');
    fs.writeFileSync(path.join(canonical, 'docs', 'handoffs', 'TASK-DRIFT.md'), canonicalContents);
    fs.writeFileSync(path.join(oldRoot, 'docs', 'handoffs', 'TASK-DRIFT.md'), oldContents);
    fs.writeFileSync(path.join(gitDirectory(canonical), 'fb-handoff-audit-roots'), `${oldRoot}\n`);
    writeManifest(canonical, activeManifest(canonical, {
      routingReceipts: {
        'docs/handoffs/TASK-DRIFT.md': {
          canonicalSha256: sha256(canonicalContents),
          sources: [{ root: oldRoot, sha256: sha256(oldContents) }],
          disposition: 'canonical-content-retained',
        },
      },
    }));
    assert.doesNotThrow(() => scanWorkstreamHandoffs(canonical));

    fs.writeFileSync(
      path.join(oldRoot, 'docs', 'handoffs', 'TASK-DRIFT.md'),
      handoff('TASK-DRIFT', 'fb-tech', 'ready', 'Changed after review.')
    );
    assert.throws(() => scanWorkstreamHandoffs(canonical), /HANDOFF_CONTENT_DRIFT/);
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(oldRoot, { recursive: true, force: true });
  }
});

test('configured missing audit roots fail readiness instead of being skipped', () => {
  const canonical = makeRepo();
  const missing = path.join(canonical, 'missing-former-root');
  try {
    fs.writeFileSync(path.join(gitDirectory(canonical), 'fb-handoff-audit-roots'), `${missing}\n`);
    writeManifest(canonical, activeManifest(canonical));
    assert.throws(
      () => scanWorkstreamHandoffs(canonical),
      /READINESS_AUDIT_INCOMPLETE[\s\S]*missing-former-root/
    );
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
  }
});

test('configured inaccessible audit roots fail readiness instead of being skipped', () => {
  const canonical = makeRepo();
  const notDirectory = path.join(canonical, 'former-root-file');
  try {
    fs.writeFileSync(notDirectory, 'not a checkout\n');
    fs.writeFileSync(path.join(gitDirectory(canonical), 'fb-handoff-audit-roots'), `${notDirectory}\n`);
    writeManifest(canonical, activeManifest(canonical));
    assert.throws(
      () => scanWorkstreamHandoffs(canonical),
      /READINESS_AUDIT_INCOMPLETE[\s\S]*former-root-file/
    );
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
  }
});

console.log('checkout migration lifecycle');
test('clean same-branch committed divergence requires HEAD and tree dispositions', () => {
  const canonical = makeRepo();
  const former = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-former-committed-'));
  try {
    commitAll(canonical, 'canonical base');
    fs.rmSync(former, { recursive: true, force: true });
    execFileSync('git', ['clone', '-q', canonical, former], { stdio: 'ignore' });
    fs.writeFileSync(path.join(former, 'COMMITTED.txt'), 'former committed content\n');
    commitAll(former, 'former divergence');

    const taskInventory = {
      complete: true,
      tasks: require('./fb-onboarding.cjs').WORKSTREAMS.map((workstream, index) => ({
        id: `task-${index}`,
        title: workstream.title,
        projectId: 'project-fixture',
        pinned: true,
      })),
    };
    const inventory = inventoryCheckoutMigration({
      canonicalPath: canonical,
      formerPaths: [former],
      repository: { projectId: 'project-fixture', repositoryPath: canonical },
      taskInventory,
    });

    assert.strictEqual(inventory.roots[0].branch, inventory.roots[1].branch);
    assert.deepStrictEqual(inventory.roots[0].dirt, []);
    assert.deepStrictEqual(inventory.roots[1].dirt, []);
    assert.match(inventory.roots[0].head, /^[0-9a-f]{40,64}$/);
    assert.match(inventory.roots[0].tree, /^[0-9a-f]{40,64}$/);
    assert.ok(inventory.differences.some(difference => difference.kind === 'head'));
    assert.ok(inventory.differences.some(difference => difference.kind === 'tree'));
    assert.ok(inventory.differences.filter(difference => ['head', 'tree'].includes(difference.kind))
      .every(difference => !difference.disposition));
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(former, { recursive: true, force: true });
  }
});

test('migration inventory rejects a repository identity from another canonical root', () => {
  const canonical = makeRepo();
  const foreign = makeRepo('fb-checkout-foreign-repository-');
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-registry-'));
  try {
    const taskInventory = {
      complete: true,
      tasks: require('./fb-onboarding.cjs').WORKSTREAMS.map((workstream, index) => ({
        id: `task-${index}`,
        title: workstream.title,
        projectId: 'project-fixture',
        pinned: true,
      })),
    };
    assert.throws(() => inventoryCheckoutMigration({
      canonicalPath: canonical,
      repository: { projectId: 'project-fixture', repositoryPath: foreign },
      taskInventory,
    }), /MIGRATION_PROJECT_MISMATCH|canonical repository/i);

    const validInventory = inventoryCheckoutMigration({
      canonicalPath: canonical,
      repository: { projectId: 'project-fixture', repositoryPath: canonical },
      taskInventory,
    });
    assert.throws(() => commitCheckoutMigration({
      ...validInventory,
      repository: { projectId: 'project-fixture', repositoryPath: foreign },
    }, { registryDir: registry }), /MIGRATION_PROJECT_MISMATCH|canonical repository/i);
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(foreign, { recursive: true, force: true });
    fs.rmSync(registry, { recursive: true, force: true });
  }
});

test('task rebind rejects a manifest whose repository path is not the canonical root', () => {
  const canonical = makeRepo();
  const foreign = makeRepo('fb-checkout-foreign-rebind-');
  try {
    writeManifest(canonical, activeManifest(canonical, {
      repository: { projectId: 'project-fixture', repositoryPath: foreign },
      taskRebind: {
        status: 'awaiting-task-rebind',
        pending: require('./fb-onboarding.cjs').WORKSTREAMS.map(workstream => workstream.key),
      },
    }));
    const taskInventory = {
      complete: true,
      tasks: require('./fb-onboarding.cjs').WORKSTREAMS.map((workstream, index) => ({
        id: `task-${index}`,
        title: workstream.title,
        projectId: 'project-fixture',
        pinned: true,
      })),
    };
    assert.throws(() => recordCheckoutTaskRebind(canonical, taskInventory, {
      projectId: 'project-fixture', repositoryPath: foreign,
    }), /MIGRATION_PROJECT_MISMATCH|canonical repository/i);
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(foreign, { recursive: true, force: true });
  }
});

test('task rebind rejects a canonical identity that resolves to a same-repository subdirectory', () => {
  const repositoryRoot = makeRepo();
  const canonicalSubdirectory = path.join(repositoryRoot, 'nested-canonical');
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-registry-'));
  try {
    fs.mkdirSync(canonicalSubdirectory);
    writeManifest(repositoryRoot, activeManifest(canonicalSubdirectory, {
      repository: { projectId: 'project-fixture', repositoryPath: canonicalSubdirectory },
      taskRebind: {
        status: 'awaiting-task-rebind',
        pending: require('./fb-onboarding.cjs').WORKSTREAMS.map(workstream => workstream.key),
      },
    }));
    const taskInventory = {
      complete: true,
      tasks: require('./fb-onboarding.cjs').WORKSTREAMS.map((workstream, index) => ({
        id: `task-${index}`,
        title: workstream.title,
        projectId: 'project-fixture',
        pinned: true,
      })),
    };

    assert.throws(() => recordCheckoutTaskRebind(canonicalSubdirectory, taskInventory, {
      projectId: 'project-fixture', repositoryPath: canonicalSubdirectory,
    }, { registryDir: registry }), /MIGRATION_PROJECT_MISMATCH|canonical repository/i);
  } finally {
    fs.rmSync(repositoryRoot, { recursive: true, force: true });
    fs.rmSync(registry, { recursive: true, force: true });
  }
});

test('snapshot rejects a manifest whose canonical path is a same-repository subdirectory', () => {
  const repositoryRoot = makeRepo();
  const canonicalSubdirectory = path.join(repositoryRoot, 'nested-snapshot-canonical');
  try {
    fs.mkdirSync(canonicalSubdirectory);
    writeManifest(repositoryRoot, activeManifest(canonicalSubdirectory, {
      repository: { projectId: 'project-fixture', repositoryPath: canonicalSubdirectory },
    }));

    assert.throws(
      () => checkoutMigrationSnapshot(canonicalSubdirectory),
      /MIGRATION_PROJECT_MISMATCH|canonical repository/i,
    );
  } finally {
    fs.rmSync(repositoryRoot, { recursive: true, force: true });
  }
});

test('migration inventory discovers branches, worktrees, dirt, handoffs, and routing differences itself', () => {
  const canonical = makeRepo();
  const former = makeRepo('fb-checkout-former-inventory-');
  try {
    fs.writeFileSync(path.join(former, 'UNTRACKED.txt'), 'preserve me\n');
    fs.writeFileSync(path.join(canonical, 'docs', 'handoffs', 'TASK-X.md'), handoff('TASK-X', 'fb-design', 'ready', 'Canonical.'));
    fs.writeFileSync(path.join(former, 'docs', 'handoffs', 'TASK-X.md'), handoff('TASK-X', 'fb-design', 'ready', 'Former.'));
    const taskInventory = {
      complete: true,
      tasks: require('./fb-onboarding.cjs').WORKSTREAMS.map((workstream, index) => ({
        id: `task-${index}`,
        title: workstream.title,
        projectId: 'project-fixture',
        pinned: true,
      })),
    };
    const draft = inventoryCheckoutMigration({
      canonicalPath: canonical,
      formerPaths: [former],
      repository: { projectId: 'project-fixture', repositoryPath: canonical },
      taskInventory,
      differences: [],
      unresolvedDrift: [],
    });
    assert.ok(draft.differences.some(difference => difference.kind === 'worktrees'));
    assert.ok(draft.differences.some(difference => difference.kind === 'dirt'));
    assert.ok(draft.differences.some(difference => difference.kind === 'handoff'));
    assert.ok(draft.unresolvedDrift.length >= 3);

    const inventory = dispositionedMigration({
      canonicalPath: canonical,
      formerPaths: [former],
      repository: { projectId: 'project-fixture', repositoryPath: canonical },
      taskInventory,
      differences: [{ id: 'forged', kind: 'ignored' }],
      unresolvedDrift: [],
      dispositions: Object.fromEntries(draft.differences.map(difference => [difference.id, 'reviewed-and-preserved'])),
    });
    assert.strictEqual(inventory.roots.length, 2);
    assert.strictEqual(inventory.roots[0].path, fs.realpathSync(canonical));
    assert.ok(Array.isArray(inventory.roots[0].worktrees));
    assert.match(inventory.roots[1].dirt.join('\n'), /UNTRACKED\.txt/);
    assert.strictEqual(inventory.taskRecords.length, 7);
    assert.strictEqual(inventory.unresolvedDrift.length, 0);
    assert.ok(inventory.differences.every(difference => difference.disposition === 'reviewed-and-preserved'));
    assert.ok(inventory.differences.every(difference => difference.id !== 'forged'));
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(former, { recursive: true, force: true });
  }
});

test('migration commit records one active canonical root, quarantines former roots, and is idempotent', () => {
  const canonical = makeRepo();
  const former = makeRepo('fb-checkout-former-commit-');
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-registry-'));
  const previousRegistry = process.env.FB_CHECKOUT_MIGRATION_REGISTRY;
  try {
    process.env.FB_CHECKOUT_MIGRATION_REGISTRY = registry;
    const taskInventory = {
      complete: true,
      tasks: require('./fb-onboarding.cjs').WORKSTREAMS.map((workstream, index) => ({
        id: `task-${index}`,
        title: workstream.title,
        projectId: 'project-fixture',
        pinned: true,
      })),
    };
    const inventory = dispositionedMigration({
      canonicalPath: canonical,
      formerPaths: [former],
      repository: { projectId: 'project-fixture', repositoryPath: canonical },
      taskInventory,
    });
    const first = commitCheckoutMigration(inventory, { registryDir: registry });
    const second = commitCheckoutMigration(inventory, { registryDir: registry });
    assert.deepStrictEqual(second.manifest, first.manifest);
    assert.strictEqual(checkoutMigrationSnapshot(canonical).state, 'active');
    assert.strictEqual(checkoutMigrationSnapshot(former).state, 'quarantined');
    assert.throws(() => require('./fb-lane.cjs').assertCanonicalCheckout(former), /FB_CHECKOUT_NOT_CANONICAL/);
    assert.strictEqual(first.manifest.taskRebind.status, 'complete');
    assert.strictEqual(Object.keys(first.manifest.taskBindings).length, 7);
  } finally {
    if (previousRegistry === undefined) delete process.env.FB_CHECKOUT_MIGRATION_REGISTRY;
    else process.env.FB_CHECKOUT_MIGRATION_REGISTRY = previousRegistry;
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(former, { recursive: true, force: true });
    fs.rmSync(registry, { recursive: true, force: true });
  }
});

test('a disposition is invalidated when discovered evidence changes before commit', () => {
  const canonical = makeRepo();
  const former = makeRepo('fb-checkout-former-stale-disposition-');
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-registry-'));
  try {
    const tasks = require('./fb-onboarding.cjs').WORKSTREAMS.map((workstream, index) => ({
      id: `task-${index}`,
      title: workstream.title,
      projectId: 'project-fixture',
      pinned: true,
    }));
    fs.writeFileSync(path.join(former, 'DIRT.txt'), 'first\n');
    const inventory = dispositionedMigration({
      canonicalPath: canonical,
      formerPaths: [former],
      repository: { projectId: 'project-fixture', repositoryPath: canonical },
      taskInventory: { complete: true, tasks },
    });
    fs.writeFileSync(path.join(former, 'DIRT.txt'), 'second\n');
    assert.throws(() => commitCheckoutMigration(inventory, { registryDir: registry }), /MIGRATION_DIFFERENCE_UNDISPOSITIONED/);
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(former, { recursive: true, force: true });
    fs.rmSync(registry, { recursive: true, force: true });
  }
});

test('a registry write failure leaves no checkout-local migration manifest behind', () => {
  const canonical = makeRepo();
  const former = makeRepo('fb-checkout-former-transaction-');
  const blockedRegistry = path.join(canonical, 'registry-file');
  try {
    fs.writeFileSync(blockedRegistry, 'not a directory\n');
    const tasks = require('./fb-onboarding.cjs').WORKSTREAMS.map((workstream, index) => ({
      id: `task-${index}`,
      title: workstream.title,
      projectId: 'project-fixture',
      pinned: true,
    }));
    const inventory = dispositionedMigration({
      canonicalPath: canonical,
      formerPaths: [former],
      repository: { projectId: 'project-fixture', repositoryPath: canonical },
      taskInventory: { complete: true, tasks },
    });
    assert.throws(() => commitCheckoutMigration(inventory, {
      registryDir: blockedRegistry,
    }), /EEXIST|ENOTDIR/);
    assert.strictEqual(
      fs.existsSync(path.join(gitDirectory(canonical), 'fb-checkout-migration.json')),
      false,
    );
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(former, { recursive: true, force: true });
  }
});

test('pending task rebind closes only with a complete exact-project pinned inventory', () => {
  const canonical = makeRepo();
  const former = makeRepo('fb-checkout-former-rebind-');
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-registry-'));
  const previousRegistry = process.env.FB_CHECKOUT_MIGRATION_REGISTRY;
  try {
    process.env.FB_CHECKOUT_MIGRATION_REGISTRY = registry;
    const partialTasks = require('./fb-onboarding.cjs').WORKSTREAMS.slice(0, 6).map((workstream, index) => ({
      id: `task-${index}`,
      title: workstream.title,
      projectId: 'project-fixture',
      pinned: true,
    }));
    const inventory = dispositionedMigration({
      canonicalPath: canonical,
      formerPaths: [former],
      repository: { projectId: 'project-fixture', repositoryPath: canonical },
      taskInventory: { complete: true, tasks: partialTasks },
    });
    commitCheckoutMigration(inventory, { registryDir: registry });
    assert.strictEqual(checkoutMigrationSnapshot(canonical).taskRebind.status, 'awaiting-task-rebind');
    assert.throws(() => recordCheckoutTaskRebind(former, {
      complete: true,
      tasks: partialTasks,
    }, { projectId: 'project-fixture', repositoryPath: canonical }, { registryDir: registry }), /FB_CHECKOUT_NOT_CANONICAL/);
    assert.throws(() => recordCheckoutTaskRebind(canonical, {
      complete: true,
      tasks: partialTasks,
    }, { projectId: 'project-fixture', repositoryPath: canonical }, { registryDir: registry }), /TASK_REBIND_PENDING/);

    const completeTasks = require('./fb-onboarding.cjs').WORKSTREAMS.map((workstream, index) => ({
      id: `task-${index}`,
      title: workstream.title,
      projectId: 'project-fixture',
      pinned: true,
    }));
    assert.throws(() => recordCheckoutTaskRebind(canonical, { complete: true, tasks: completeTasks }, {
      projectId: 'project-other', repositoryPath: canonical,
    }, { registryDir: registry }), /MIGRATION_PROJECT_MISMATCH/);
    recordCheckoutTaskRebind(canonical, { complete: true, tasks: completeTasks }, {
      projectId: 'project-fixture', repositoryPath: canonical,
    }, { registryDir: registry });
    assert.strictEqual(checkoutMigrationSnapshot(canonical).taskRebind.status, 'complete');
    assert.deepStrictEqual(checkoutMigrationSnapshot(canonical).taskRebind.pending, []);
  } finally {
    if (previousRegistry === undefined) delete process.env.FB_CHECKOUT_MIGRATION_REGISTRY;
    else process.env.FB_CHECKOUT_MIGRATION_REGISTRY = previousRegistry;
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(former, { recursive: true, force: true });
    fs.rmSync(registry, { recursive: true, force: true });
  }
});

test('retirement requires explicit approval and a two-step lifecycle transition', () => {
  const canonical = makeRepo();
  const former = makeRepo('fb-checkout-former-retirement-');
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-registry-'));
  const previousRegistry = process.env.FB_CHECKOUT_MIGRATION_REGISTRY;
  try {
    process.env.FB_CHECKOUT_MIGRATION_REGISTRY = registry;
    const tasks = require('./fb-onboarding.cjs').WORKSTREAMS.map((workstream, index) => ({
      id: `task-${index}`,
      title: workstream.title,
      projectId: 'project-fixture',
      pinned: true,
    }));
    const inventory = dispositionedMigration({
      canonicalPath: canonical,
      formerPaths: [former],
      repository: { projectId: 'project-fixture', repositoryPath: canonical },
      taskInventory: { complete: true, tasks },
    });
    commitCheckoutMigration(inventory, { registryDir: registry });
    assert.throws(() => advanceCheckoutRetirement(canonical, former, {
      targetState: 'retirement-pending', registryDir: registry,
    }), /RETIREMENT_APPROVAL_REQUIRED/);
    assert.throws(() => advanceCheckoutRetirement(canonical, former, {
      targetState: 'retired', approvalRef: 'APPROVED-RETIRE', registryDir: registry,
    }), /retirement-pending/);
    advanceCheckoutRetirement(canonical, former, {
      targetState: 'retirement-pending', approvalRef: 'APPROVED-RETIRE', registryDir: registry,
    });
    assert.strictEqual(checkoutMigrationSnapshot(former).state, 'retirement-pending');
    advanceCheckoutRetirement(canonical, former, {
      targetState: 'retired', approvalRef: 'APPROVED-RETIRE', registryDir: registry,
    });
    assert.strictEqual(checkoutMigrationSnapshot(former).state, 'retired');
  } finally {
    if (previousRegistry === undefined) delete process.env.FB_CHECKOUT_MIGRATION_REGISTRY;
    else process.env.FB_CHECKOUT_MIGRATION_REGISTRY = previousRegistry;
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(former, { recursive: true, force: true });
    fs.rmSync(registry, { recursive: true, force: true });
  }
});

test('retirement derives unresolved drift from recorded difference evidence', () => {
  const canonical = makeRepo();
  const former = makeRepo('fb-checkout-former-derived-drift-');
  try {
    writeManifest(canonical, activeManifest(canonical, {
      checkouts: {
        [canonical]: { state: 'active' },
        [former]: { state: 'quarantined' },
      },
      differences: [{ id: 'actual:handoff', kind: 'handoff' }],
      unresolvedDrift: [],
    }));
    assert.throws(() => advanceCheckoutRetirement(canonical, former, {
      targetState: 'retirement-pending',
      approvalRef: 'APPROVED-RETIRE',
    }), /HANDOFF_CONTENT_DRIFT/);
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(former, { recursive: true, force: true });
  }
});

test('retirement rejects committed root drift introduced after migration commit', () => {
  const canonical = makeRepo();
  const former = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-former-retirement-drift-'));
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-registry-'));
  const previousRegistry = process.env.FB_CHECKOUT_MIGRATION_REGISTRY;
  try {
    process.env.FB_CHECKOUT_MIGRATION_REGISTRY = registry;
    commitAll(canonical, 'canonical base');
    fs.rmSync(former, { recursive: true, force: true });
    execFileSync('git', ['clone', '-q', canonical, former], { stdio: 'ignore' });
    const tasks = require('./fb-onboarding.cjs').WORKSTREAMS.map((workstream, index) => ({
      id: `task-${index}`,
      title: workstream.title,
      projectId: 'project-fixture',
      pinned: true,
    }));
    const inventory = dispositionedMigration({
      canonicalPath: canonical,
      formerPaths: [former],
      repository: { projectId: 'project-fixture', repositoryPath: canonical },
      taskInventory: { complete: true, tasks },
    });
    commitCheckoutMigration(inventory, { registryDir: registry });

    fs.writeFileSync(path.join(former, 'AFTER-MIGRATION.txt'), 'new committed evidence\n');
    commitAll(former, 'post-migration drift');
    assert.throws(() => advanceCheckoutRetirement(canonical, former, {
      targetState: 'retirement-pending',
      approvalRef: 'APPROVED-RETIRE',
      registryDir: registry,
    }), /RETIREMENT_EVIDENCE_STALE|MIGRATION_DIFFERENCE_UNDISPOSITIONED/);
    assert.strictEqual(checkoutMigrationSnapshot(former).state, 'quarantined');
  } finally {
    if (previousRegistry === undefined) delete process.env.FB_CHECKOUT_MIGRATION_REGISTRY;
    else process.env.FB_CHECKOUT_MIGRATION_REGISTRY = previousRegistry;
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(former, { recursive: true, force: true });
    fs.rmSync(registry, { recursive: true, force: true });
  }
});

test('CLI and MCP migration inventory routes use discovered transactional evidence', () => {
  const canonical = makeRepo();
  const former = makeRepo('fb-checkout-former-cli-mcp-');
  const requestPath = path.join(canonical, 'migration-request.json');
  try {
    fs.writeFileSync(path.join(former, 'DIRT.txt'), 'preserve\n');
    const tasks = require('./fb-onboarding.cjs').WORKSTREAMS.map((workstream, index) => ({
      id: `task-${index}`,
      title: workstream.title,
      projectId: 'project-fixture',
      pinned: true,
    }));
    const request = {
      canonicalPath: canonical,
      formerPaths: [former],
      repository: { projectId: 'project-fixture', repositoryPath: canonical },
      taskInventory: { complete: true, tasks },
      differences: [],
      unresolvedDrift: [],
    };
    fs.writeFileSync(requestPath, `${JSON.stringify(request)}\n`);
    const cli = runCli(canonical, ['migration', 'inventory', requestPath]);
    assert.strictEqual(cli.status, 0, cli.stderr);
    const cliInventory = JSON.parse(cli.stdout);
    assert.ok(cliInventory.differences.some(difference => difference.kind === 'dirt'));

    const mcp = mcpRequest(canonical, 'fb_checkout_migration_inventory', request);
    const mcpInventory = JSON.parse(mcp.result.content[0].text);
    assert.deepStrictEqual(mcpInventory.differences, cliInventory.differences);
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(former, { recursive: true, force: true });
  }
});

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

test('an independent former clone discovers a registered machine-local manifest and fails closed', () => {
  const canonical = makeRepo();
  const former = makeRepo('fb-checkout-former-clone-');
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-checkout-registry-'));
  try {
    fs.writeFileSync(
      path.join(registry, 'migration.json'),
      `${JSON.stringify(activeManifest(canonical, {
        checkouts: {
          [canonical]: { state: 'active' },
          [former]: { state: 'quarantined' },
        },
      }), null, 2)}\n`
    );
    const result = runCli(former, ['status', '--details'], {
      FB_CHECKOUT_MIGRATION_REGISTRY: registry,
    });
    assert.strictEqual(result.status, 1, result.stdout || result.stderr);
    assert.match(`${result.stdout}\n${result.stderr}`, /FB_CHECKOUT_NOT_CANONICAL/);
    assert.match(result.stdout, /Checkout state: quarantined/);
    assert.strictEqual(fs.existsSync(path.join(former, '.git', 'fb-checkout-migration.json')), false);
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(former, { recursive: true, force: true });
    fs.rmSync(registry, { recursive: true, force: true });
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
  const canonical = makeRepo('fb-checkout-active-');
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
  const canonical = makeRepo('fb-checkout-active-');
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
    const canonical = makeRepo('fb-checkout-active-');
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

test('MCP status exposes checkout lifecycle and fails closed outside canonical', () => {
  const root = makeRepo();
  const canonical = makeRepo('fb-checkout-active-');
  try {
    writeManifest(root, activeManifest(root));
    const active = mcpRequest(root, 'fb_lane_status', { details: true });
    assert.match(active.result.content[0].text, /Checkout current path:/);
    assert.match(active.result.content[0].text, /Checkout canonical path:/);
    assert.match(active.result.content[0].text, /Checkout state: active/);

    writeManifest(root, activeManifest(canonical, {
      checkouts: {
        [canonical]: { state: 'active' },
        [root]: { state: 'quarantined' },
      },
    }));
    const response = mcpRequest(root, 'fb_lane_status', { details: true });
    assert.match(response.error.message, /FB_CHECKOUT_NOT_CANONICAL/);
    assert.match(response.error.message, /Checkout current path:/);
    assert.match(response.error.message, /Checkout canonical path:/);
    assert.match(response.error.message, /Checkout state: quarantined/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(canonical, { recursive: true, force: true });
  }
});

test('MCP mutations assert canonical state before any write', () => {
  const event = {
    schemaVersion: 'fb-stage-event-v1',
    eventId: 'migration-guard-event',
    timestamp: '2026-08-07T00:00:00.000Z',
    runId: 'migration-guard-run',
    sessionId: 'migration-guard-session',
    taskId: 'TASK-001',
    stage: 'route',
    capability: 'migration-guard',
    attempt: 1,
    decision: 'process',
    result: 'passed',
    artifactRef: 'docs/handoffs/TASK-001.md',
    baselineRef: 'docs/handoffs/TASK-001.md',
    candidateRef: null,
    criteriaIds: [],
    reason: 'Guard MCP writes.',
    nextAction: 'Use the canonical checkout.',
  };
  for (const [name, args] of [
    ['fb_control_event_record', event],
    ['fb_lane_claim', { taskId: 'TASK-001', lane: 'Product', lockedFiles: '(None)' }],
    ['fb_lane_submit', { taskId: 'TASK-001' }],
    ['fb_lane_merge', { taskId: 'TASK-001' }],
  ]) {
    const root = makeRepo();
    const canonical = makeRepo('fb-checkout-active-');
    try {
      const originalBoard = fs.readFileSync(path.join(root, 'PROJECT_BOARD.md'), 'utf8');
      writeManifest(root, activeManifest(canonical, {
        checkouts: {
          [canonical]: { state: 'active' },
          [root]: { state: 'quarantined' },
        },
      }));
      const response = mcpRequest(root, name, args);
      assert.match(response.error.message, /FB_CHECKOUT_NOT_CANONICAL/, name);
      assert.strictEqual(fs.readFileSync(path.join(root, 'PROJECT_BOARD.md'), 'utf8'), originalBoard, name);
      assert.strictEqual(fs.existsSync(path.join(gitDirectory(root), 'fb-stage-events')), false, name);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(canonical, { recursive: true, force: true });
    }
  }
});

test('mutating session subcommands are guarded while read-only session status remains available', () => {
  const root = makeRepo();
  const canonical = makeRepo('fb-checkout-active-');
  try {
    writeManifest(root, activeManifest(canonical, {
      checkouts: {
        [canonical]: { state: 'active' },
        [root]: { state: 'quarantined' },
      },
    }));
    for (const args of [
      ['session', 'promote', 'TASK-001', 'product', '--mode', 'planning', '--session-id', 'guarded-session'],
      ['session', 'checkpoint', '--reason', 'decision', '--session-id', 'guarded-session'],
      ['session', 'close', '--outcome', 'blocked', '--session-id', 'guarded-session'],
    ]) {
      const result = runCli(root, args);
      assert.strictEqual(result.status, 1, result.stdout || result.stderr);
      assert.match(`${result.stdout}\n${result.stderr}`, /FB_CHECKOUT_NOT_CANONICAL/);
    }
    const status = runCli(root, ['session', 'status', '--all'], {
      CODEX_THREAD_ID: '',
      FB_SESSION_ID: '',
    });
    assert.strictEqual(status.status, 0, status.stdout || status.stderr);
    assert.doesNotMatch(`${status.stdout}\n${status.stderr}`, /FB_CHECKOUT_NOT_CANONICAL/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(canonical, { recursive: true, force: true });
  }
});

console.log(`\n✅ ${passed} checkout migration checks passed.`);
