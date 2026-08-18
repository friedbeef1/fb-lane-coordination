#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { execFileSync, spawnSync } = require('node:child_process');

const {
  freezeBfmIntake,
  gateBfmExecutionStart,
  refreshBfmRoutingReceipts,
  renderBfmIntakeLedger,
  scanWorkstreamHandoffs,
} = require('./fb-lane.cjs');

const ROLE_ORDER = ['User', 'Business', 'Design', 'Tech', 'Discovery', 'Bugs', 'Product/BFM'];
const ROLE_FILES = {
  User: 'fb-user.md',
  Business: 'fb-business.md',
  Design: 'fb-design.md',
  Tech: 'fb-tech.md',
  Discovery: 'fb-discovery.md',
  Bugs: 'fb-bugs.md',
  'Product/BFM': 'fb-product.md',
};

function handoff({ task, lane, status = 'ready', disposition = '', dependsOn = '', approvalGate = '', externalBlocker = '', worktree = '' }) {
  return `---
type: fb-lane-handoff
task: ${task}
lane: ${lane}
status: ${status}
${disposition ? `disposition: ${disposition}\n` : ''}${dependsOn ? `depends_on: ${dependsOn}\n` : ''}${approvalGate ? `approval_gate: ${approvalGate}\n` : ''}${externalBlocker ? `external_blocker: ${externalBlocker}\n` : ''}${worktree ? `worktree: ${worktree}\n` : ''}---
# ${task}
`;
}

function board(tasks = []) {
  const rows = tasks.map(task =>
    `| ${task.id} | ${task.status || 'In Progress'} | ${task.owner || `FB-${task.role}`} | Test | ${task.id} scope | ${task.locks || '(None)'} | [Handoff](docs/handoffs/${task.file}) |`
  ).join('\n');
  return `# Project Board

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
${rows}
`;
}

function makeFixture(candidates = [], options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-ledger-'));
  fs.mkdirSync(path.join(root, '.git'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'handoffs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'workstreams'), { recursive: true });
  const boardTasks = candidates.map(candidate => ({
    id: candidate.task,
    role: candidate.role,
    file: candidate.file,
    locks: candidate.locks,
    status: candidate.boardStatus,
  })).concat(options.extraBoardTasks || []);
  fs.writeFileSync(path.join(root, 'PROJECT_BOARD.md'), board(boardTasks));
  const indexRows = candidates.map(candidate =>
    `| ${candidate.task} | ${candidate.role} | Ready | [${candidate.file}](${candidate.file}) |`
  ).join('\n');
  fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'index.md'), `# Handoff Index\n\n${indexRows}\n`);
  for (const role of ROLE_ORDER) {
    const roleTasks = candidates.filter(candidate => candidate.role === role).map(candidate => candidate.task);
    fs.writeFileSync(
      path.join(root, 'docs', 'workstreams', ROLE_FILES[role]),
      `# ${role}\n\n${roleTasks.length ? roleTasks.join('\n') : 'None relevant'}\n`
    );
  }
  for (const candidate of candidates) {
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', candidate.file), handoff({
      task: candidate.task,
      lane: candidate.lane,
      disposition: candidate.disposition,
      dependsOn: candidate.dependsOn,
      approvalGate: candidate.approvalGate,
      externalBlocker: candidate.externalBlocker,
      worktree: candidate.worktree,
    }));
  }
  return root;
}

function remove(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

function dispositionsFor(candidates, values) {
  return Object.fromEntries(candidates.map((candidate, index) => [candidate.task, values[index]]));
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function initGitFixture(root) {
  fs.rmSync(path.join(root, '.git'), { recursive: true, force: true });
  execFileSync('git', ['init', '-b', 'main', root], { stdio: 'ignore' });
  git(root, ['config', 'user.name', 'FB Test']);
  git(root, ['config', 'user.email', 'fb-test@example.invalid']);
  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'fixture']);
}

function writeVerifiedOnboardingReceipt(root, overrides = {}) {
  const attemptedActions = [];
  const taskBindings = Object.fromEntries([
    ['product', 'Product/BFM'],
    ['user', 'User'],
    ['business', 'Business'],
    ['design', 'Design'],
    ['tech', 'Tech'],
    ['discovery', 'Discovery'],
    ['bugs', 'Bugs'],
  ].map(([key, title], index) => [key, {
    taskId: `sidebar-${index}`,
    title: `FB · ${title}`,
    pinned: true,
  }]));
  const receipt = {
    schemaVersion: 1,
    repositoryPath: root,
    projectId: 'project-bfm-integration',
    permission: 'granted',
    promptedAt: '2026-08-07T00:00:00.000Z',
    decidedAt: '2026-08-07T00:01:00.000Z',
    workstreams: ['product', 'user', 'business', 'design', 'tech', 'discovery', 'bugs'],
    taskBindings,
    attemptedActions,
    attemptedActionsHash: crypto.createHash('sha256').update(JSON.stringify(attemptedActions)).digest('hex'),
    reconciledAt: '2026-08-07T00:02:00.000Z',
    ...overrides,
  };
  fs.writeFileSync(path.join(root, '.git', 'fb-onboarding.json'), `${JSON.stringify(receipt)}\n`);
  return receipt;
}

function writeMigrationManifest(root, former) {
  const taskBindings = Object.fromEntries([
    ['product', 'Product/BFM'],
    ['user', 'User'],
    ['business', 'Business'],
    ['design', 'Design'],
    ['tech', 'Tech'],
    ['discovery', 'Discovery'],
    ['bugs', 'Bugs'],
  ].map(([key, title], index) => [key, {
    taskId: `sidebar-${index}`,
    title: `FB · ${title}`,
    pinned: true,
  }]));
  const manifest = {
    version: 1,
    repository: { repositoryPath: root, projectId: 'project-bfm-integration' },
    canonicalPath: root,
    checkouts: {
      [root]: { state: 'active' },
      ...(former ? { [former]: { state: 'quarantined' } } : {}),
    },
    taskBindings,
    taskRebind: { status: 'complete', pending: [] },
    routingReceipts: {},
    unresolvedDrift: [],
  };
  fs.writeFileSync(path.join(root, '.git', 'fb-checkout-migration.json'), `${JSON.stringify(manifest)}\n`);
}

function configureVerifiedControlPlane(root, former = '') {
  writeMigrationManifest(root, former);
  writeVerifiedOnboardingReceipt(root);
}

test('canonical scan keeps User as an evidence workstream and selects Ready-to-ship handoffs', () => {
  const candidates = [
    { task: 'USER-READY', role: 'User', lane: 'fb-user', file: 'user-ready.md' },
    { task: 'PRODUCT-SHIP', role: 'Product/BFM', lane: 'fb-product', file: 'product-ship.md' },
  ];
  const root = makeFixture(candidates);
  try {
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'product-ship.md'),
      handoff({ task: 'PRODUCT-SHIP', lane: 'fb-product', status: 'Ready to ship' }),
    );

    const scan = scanWorkstreamHandoffs(root);

    assert.deepEqual(scan.candidates, [
      'docs/handoffs/user-ready.md',
      'docs/handoffs/product-ship.md',
    ]);
    assert.deepEqual(scan.workstreams.user.ready, ['docs/handoffs/user-ready.md']);
    assert.deepEqual(scan.workstreams.product.ready, ['docs/handoffs/product-ship.md']);
  } finally {
    remove(root);
  }
});

test('BFM onboarding validates repository-configured titles from the strict receipt', () => {
  const root = makeFixture();
  try {
    initGitFixture(root);
    fs.writeFileSync(path.join(root, '.fb-lane.json'), `${JSON.stringify({ taskTitlePrefix: 'Unmirror' })}\n`);
    configureVerifiedControlPlane(root);
    for (const relative of ['fb-onboarding.json', 'fb-checkout-migration.json']) {
      const file = path.join(root, '.git', relative);
      const value = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const binding of Object.values(value.taskBindings)) {
        binding.title = binding.title.replace(/^FB · /, 'Unmirror · ');
      }
      fs.writeFileSync(file, `${JSON.stringify(value)}\n`);
    }

    const ledger = freezeBfmIntake(root, { dispositions: {} });

    assert.equal(ledger.onboardingState, 'verified');
    assert.deepEqual(ledger.missingRoles, []);
  } finally {
    remove(root);
  }
});

test('BFM intake reconciles an offline quarantined root from exact manifest and routing receipts', () => {
  const candidate = { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'same.md' };
  const root = makeFixture([candidate]);
  const former = makeFixture([candidate]);
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-dataless-registry-'));
  try {
    initGitFixture(root);
    initGitFixture(former);
    configureVerifiedControlPlane(root, former);
    const manifestPath = path.join(root, '.git', 'fb-checkout-migration.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const source = fs.readFileSync(path.join(root, 'docs', 'handoffs', 'same.md'));
    const sha256 = crypto.createHash('sha256').update(source).digest('hex');
    const snapshot = { sha256, task: 'TECH-1', status: 'ready' };
    manifest.differences = [{
      id: 'migration:handoff:dataless-fixture',
      kind: 'handoff',
      relative: 'docs/handoffs/same.md',
      canonical: { root, value: snapshot },
      source: { root: former, value: snapshot },
      disposition: 'canonical-routing-retained',
    }];
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);

    refreshBfmRoutingReceipts(root, {
      relatives: ['docs/handoffs/same.md'],
      rebuildMissing: true,
      registryDir: registry,
    });

    const snapshottedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    snapshottedManifest.checkouts[fs.realpathSync(root)].handoffs = { 'docs/handoffs/same.md': snapshot };
    snapshottedManifest.checkouts[fs.realpathSync(former)].handoffs = { 'docs/handoffs/same.md': snapshot };
    fs.writeFileSync(manifestPath, `${JSON.stringify(snapshottedManifest)}\n`);

    fs.rmSync(path.join(former, 'docs'), { recursive: true, force: true });
    fs.rmSync(path.join(former, 'PROJECT_BOARD.md'), { force: true });

    const ledger = freezeBfmIntake(root, {
      dispositions: { 'TECH-1': 'Include now' },
    });

    assert.deepEqual(ledger.candidates.map(record => record.task), ['TECH-1']);
    assert.deepEqual(ledger.recommendedOrder, ['TECH-1']);

    const reconciledManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const missingReceipt = structuredClone(reconciledManifest);
    delete missingReceipt.routingReceipts['docs/handoffs/same.md'];
    fs.writeFileSync(manifestPath, `${JSON.stringify(missingReceipt)}\n`);
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'TECH-1': 'Include now' } }),
      /MANIFEST_ROUTING_RECEIPT_MISSING_OR_MISMATCHED/,
    );

    fs.writeFileSync(manifestPath, `${JSON.stringify(reconciledManifest)}\n`);
    fs.appendFileSync(path.join(root, 'docs', 'handoffs', 'same.md'), '\ncanonical drift\n');
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'TECH-1': 'Include now' } }),
      /HANDOFF_CONTENT_DRIFT/,
    );
  } finally {
    remove(root);
    remove(former);
    remove(registry);
  }
});

test('routing receipt refresh updates routing hashes without accepting content drift', () => {
  const candidate = { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'same.md' };
  const root = makeFixture([candidate]);
  const former = makeFixture([candidate]);
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-routing-registry-'));
  try {
    initGitFixture(root);
    initGitFixture(former);
    configureVerifiedControlPlane(root, former);
    const manifestPath = path.join(root, '.git', 'fb-checkout-migration.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const source = fs.readFileSync(path.join(root, 'docs', 'handoffs', 'same.md'));
    const sha256 = crypto.createHash('sha256').update(source).digest('hex');
    manifest.routingReceipts = {
      'docs/handoffs/same.md': {
        canonicalSha256: sha256,
        canonicalRoutingSha256: 'stale-routing-hash',
        sources: [{ root: former, sha256, routingSha256: 'stale-routing-hash' }],
        disposition: 'canonical-routing-retained',
      },
    };
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
    fs.appendFileSync(path.join(root, 'PROJECT_BOARD.md'), '\nCanonical routing changed.\n');

    const requestPath = path.join(root, 'refresh-routing.json');
    fs.writeFileSync(requestPath, `${JSON.stringify({
      rootDir: root,
      relatives: ['docs/handoffs/same.md'],
      registryDir: registry,
    })}\n`);
    const command = spawnSync(
      process.execPath,
      [path.join(__dirname, 'fb-lane.cjs'), 'migration', 'refresh-routing', requestPath],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(command.status, 0, `${command.stdout}\n${command.stderr}`);
    const refreshed = JSON.parse(command.stdout);
    const receipt = refreshed.manifest.routingReceipts['docs/handoffs/same.md'];
    assert.match(receipt.canonicalRoutingSha256, /^[a-f0-9]{64}$/);
    assert.notEqual(receipt.canonicalRoutingSha256, 'stale-routing-hash');
    assert.match(receipt.sources[0].routingSha256, /^[a-f0-9]{64}$/);
    assert.doesNotThrow(() => freezeBfmIntake(root, { dispositions: { 'TECH-1': 'Include now' } }));

    const before = fs.readFileSync(manifestPath, 'utf8');
    fs.appendFileSync(path.join(former, 'docs', 'handoffs', 'same.md'), '\ncontent drift\n');
    assert.throws(
      () => refreshBfmRoutingReceipts(root, {
        relatives: ['docs/handoffs/same.md'],
        registryDir: registry,
      }),
      /HANDOFF_CONTENT_DRIFT/,
    );
    assert.equal(fs.readFileSync(manifestPath, 'utf8'), before);
  } finally {
    remove(root);
    remove(former);
    remove(registry);
  }
});

test('routing receipt refresh rebuilds an erased receipt only from matching dispositioned migration evidence', () => {
  const candidate = { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'same.md' };
  const root = makeFixture([candidate]);
  const former = makeFixture([candidate]);
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-routing-rebuild-registry-'));
  try {
    initGitFixture(root);
    initGitFixture(former);
    configureVerifiedControlPlane(root, former);
    const manifestPath = path.join(root, '.git', 'fb-checkout-migration.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const source = fs.readFileSync(path.join(root, 'docs', 'handoffs', 'same.md'));
    const sha256 = crypto.createHash('sha256').update(source).digest('hex');
    manifest.differences = [{
      id: 'migration:handoff:fixture',
      kind: 'handoff',
      relative: 'docs/handoffs/same.md',
      canonical: { root, value: { sha256 } },
      source: { root: former, value: { sha256 } },
      disposition: 'canonical-routing-retained',
    }];
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);

    const refreshed = refreshBfmRoutingReceipts(root, {
      relatives: ['docs/handoffs/same.md'],
      rebuildMissing: true,
      registryDir: registry,
    });
    const receipt = refreshed.manifest.routingReceipts['docs/handoffs/same.md'];
    assert.equal(receipt.disposition, 'canonical-routing-retained');
    assert.equal(receipt.canonicalSha256, sha256);
    assert.equal(receipt.sources[0].root, fs.realpathSync(former));
    assert.equal(receipt.sources[0].sha256, sha256);
    assert.doesNotThrow(() => freezeBfmIntake(root, { dispositions: { 'TECH-1': 'Include now' } }));
  } finally {
    remove(root);
    remove(former);
    remove(registry);
  }
});

test('routing receipt refresh accepts exact index routes whose task IDs use Markdown code ticks', () => {
  const candidate = { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'same.md' };
  const root = makeFixture([candidate]);
  const former = makeFixture([candidate]);
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-routing-code-tick-registry-'));
  try {
    for (const fixtureRoot of [root, former]) {
      const indexPath = path.join(fixtureRoot, 'docs', 'handoffs', 'index.md');
      fs.writeFileSync(
        indexPath,
        fs.readFileSync(indexPath, 'utf8').replace('| TECH-1 |', '| `TECH-1` |'),
      );
      initGitFixture(fixtureRoot);
    }
    configureVerifiedControlPlane(root, former);
    const manifestPath = path.join(root, '.git', 'fb-checkout-migration.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const source = fs.readFileSync(path.join(root, 'docs', 'handoffs', 'same.md'));
    const sha256 = crypto.createHash('sha256').update(source).digest('hex');
    manifest.differences = [{
      id: 'migration:handoff:code-tick-fixture',
      kind: 'handoff',
      relative: 'docs/handoffs/same.md',
      canonical: { root, value: { sha256 } },
      source: { root: former, value: { sha256 } },
      disposition: 'canonical-routing-retained',
    }];
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);

    const refreshed = refreshBfmRoutingReceipts(root, {
      relatives: ['docs/handoffs/same.md'],
      rebuildMissing: true,
      registryDir: registry,
    });

    assert.equal(
      refreshed.manifest.routingReceipts['docs/handoffs/same.md'].disposition,
      'canonical-routing-retained',
    );
  } finally {
    remove(root);
    remove(former);
    remove(registry);
  }
});

test('routing receipt rebuild accepts canonical-identical linked copies without inventing migration evidence', () => {
  const candidate = { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'same.md' };
  const root = makeFixture([candidate]);
  const former = makeFixture([candidate]);
  const linked = makeFixture([candidate]);
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-routing-identical-linked-registry-'));
  try {
    fs.appendFileSync(path.join(former, 'docs', 'handoffs', 'same.md'), '\nPreserved former content.\n');
    for (const fixtureRoot of [root, former, linked]) initGitFixture(fixtureRoot);
    configureVerifiedControlPlane(root, former);
    const manifestPath = path.join(root, '.git', 'fb-checkout-migration.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.checkouts[fs.realpathSync(linked)] = { state: 'quarantined' };
    const canonicalSha256 = crypto.createHash('sha256')
      .update(fs.readFileSync(path.join(root, 'docs', 'handoffs', 'same.md')))
      .digest('hex');
    const formerSha256 = crypto.createHash('sha256')
      .update(fs.readFileSync(path.join(former, 'docs', 'handoffs', 'same.md')))
      .digest('hex');
    manifest.differences = [{
      id: 'migration:handoff:differing-former-fixture',
      kind: 'handoff',
      relative: 'docs/handoffs/same.md',
      canonical: { root, value: { sha256: canonicalSha256 } },
      source: { root: former, value: { sha256: formerSha256 } },
      disposition: 'canonical-authoritative-former-preserved',
    }];
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);

    const linkedHandoff = path.join(linked, 'docs', 'handoffs', 'same.md');
    fs.appendFileSync(linkedHandoff, '\nUnreceipted linked drift.\n');
    assert.throws(
      () => refreshBfmRoutingReceipts(root, {
        relatives: ['docs/handoffs/same.md'],
        rebuildMissing: true,
        registryDir: registry,
      }),
      /HANDOFF_ROUTING_RECEIPT_REQUIRED/,
    );
    fs.copyFileSync(path.join(root, 'docs', 'handoffs', 'same.md'), linkedHandoff);

    const refreshed = refreshBfmRoutingReceipts(root, {
      relatives: ['docs/handoffs/same.md'],
      rebuildMissing: true,
      registryDir: registry,
    });
    const receipt = refreshed.manifest.routingReceipts['docs/handoffs/same.md'];

    assert.equal(receipt.disposition, 'canonical-authoritative-former-preserved');
    assert.deepEqual(
      receipt.sources.map(source => ({ root: source.root, sha256: source.sha256 })),
      [
        { root: fs.realpathSync(former), sha256: formerSha256 },
        { root: fs.realpathSync(linked), sha256: canonicalSha256 },
      ].sort((left, right) => left.root.localeCompare(right.root)),
    );
  } finally {
    remove(root);
    remove(former);
    remove(linked);
    remove(registry);
  }
});

test('routing receipt refresh rebuilds historical content receipts without requiring intake routes', () => {
  const root = makeFixture();
  const former = makeFixture();
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-routing-legacy-registry-'));
  const relative = 'docs/handoffs/legacy-product-note.md';
  try {
    fs.writeFileSync(path.join(root, relative), '# Canonical legacy note\n');
    fs.writeFileSync(path.join(former, relative), '# Preserved former note\n');
    initGitFixture(root);
    initGitFixture(former);
    configureVerifiedControlPlane(root, former);
    fs.rmSync(path.join(former, 'PROJECT_BOARD.md'));
    fs.rmSync(path.join(former, 'docs', 'handoffs', 'index.md'));
    fs.rmSync(path.join(former, 'docs', 'workstreams'), { recursive: true });
    const manifestPath = path.join(root, '.git', 'fb-checkout-migration.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const canonicalSha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
    const sourceSha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(former, relative))).digest('hex');
    manifest.differences = [{
      id: 'migration:handoff:legacy-fixture',
      kind: 'handoff',
      relative,
      canonical: { root, value: { sha256: canonicalSha256 } },
      source: { root: former, value: { sha256: sourceSha256 } },
      disposition: 'canonical-history-authoritative-former-preserved',
    }];
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);

    const refreshed = refreshBfmRoutingReceipts(root, {
      relatives: [relative],
      rebuildMissing: true,
      registryDir: registry,
    });

    const receipt = refreshed.manifest.routingReceipts[relative];
    assert.equal(receipt.canonicalSha256, canonicalSha256);
    assert.equal(receipt.sources[0].sha256, sourceSha256);
    assert.equal(receipt.canonicalRoutingSha256, undefined);
    assert.doesNotThrow(() => scanWorkstreamHandoffs(root));
  } finally {
    remove(root);
    remove(former);
    remove(registry);
  }
});

test('routing receipt refresh reconciles approved current content only from an unambiguous prior disposition', () => {
  const candidate = { task: 'USER-1', role: 'User', lane: 'fb-user', file: 'current.md' };
  const root = makeFixture([candidate]);
  const former = makeFixture([candidate]);
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-routing-current-registry-'));
  const relative = 'docs/handoffs/current.md';
  try {
    initGitFixture(root);
    initGitFixture(former);
    configureVerifiedControlPlane(root, former);
    fs.appendFileSync(path.join(root, relative), '\nApproved canonical revision.\n');
    const manifestPath = path.join(root, '.git', 'fb-checkout-migration.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.differences = [{
      id: 'migration:handoff:stale-fixture',
      kind: 'handoff',
      relative,
      canonical: { root, value: { sha256: 'a'.repeat(64) } },
      source: { root: former, value: { sha256: 'b'.repeat(64) } },
      disposition: 'canonical-approved-source-preserved',
    }];
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
    const canonicalSha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
    const sourceSha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(former, relative))).digest('hex');
    const reconciliation = {
      approvalRef: 'James approved the bounded Unmirror recovery on 2026-08-16',
      disposition: 'canonical-approved-source-preserved',
      canonicalSha256,
      sources: [{ root: fs.realpathSync(former), sha256: sourceSha256 }],
    };

    assert.throws(
      () => refreshBfmRoutingReceipts(root, {
        relatives: [relative],
        rebuildMissing: true,
        registryDir: registry,
      }),
      /HANDOFF_ROUTING_RECEIPT_REQUIRED/,
    );
    assert.throws(
      () => refreshBfmRoutingReceipts(root, {
        relatives: [relative],
        rebuildMissing: true,
        reconcileCurrent: {
          [relative]: { ...reconciliation, canonicalSha256: '0'.repeat(64) },
        },
        registryDir: registry,
      }),
      /HANDOFF_CONTENT_DRIFT/,
    );
    assert.throws(
      () => refreshBfmRoutingReceipts(root, {
        relatives: [relative],
        rebuildMissing: true,
        reconcileCurrent: {
          [relative]: {
            ...reconciliation,
            sources: [
              { root: fs.realpathSync(former), sha256: '0'.repeat(64) },
              ...reconciliation.sources,
            ],
          },
        },
        registryDir: registry,
      }),
      /HANDOFF_CONTENT_DRIFT/,
    );

    const refreshed = refreshBfmRoutingReceipts(root, {
      relatives: [relative],
      rebuildMissing: true,
      reconcileCurrent: { [relative]: reconciliation },
      registryDir: registry,
    });
    const receipt = refreshed.manifest.routingReceipts[relative];
    assert.equal(receipt.disposition, 'canonical-approved-source-preserved');
    assert.equal(receipt.canonicalSha256, canonicalSha256);
    assert.equal(receipt.sources[0].sha256, sourceSha256);
    const refreshedEvidence = refreshed.manifest.differences.filter(difference =>
      difference.kind === 'handoff'
      && difference.relative === relative
      && fs.realpathSync(difference.source.root) === fs.realpathSync(former)
    );
    assert.equal(refreshedEvidence.length, 1);
    assert.equal(refreshedEvidence[0].canonical.value.sha256, canonicalSha256);
    assert.equal(refreshedEvidence[0].source.value.sha256, sourceSha256);
    assert.equal(refreshedEvidence[0].disposition, reconciliation.disposition);
    assert.doesNotThrow(() => freezeBfmIntake(root, { dispositions: { 'USER-1': 'Include now' } }));

    const withoutEvidence = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    withoutEvidence.routingReceipts = {};
    withoutEvidence.differences = [];
    fs.writeFileSync(manifestPath, `${JSON.stringify(withoutEvidence)}\n`);
    assert.throws(
      () => refreshBfmRoutingReceipts(root, {
        relatives: [relative],
        rebuildMissing: true,
        reconcileCurrent: { [relative]: reconciliation },
        registryDir: registry,
      }),
      /HANDOFF_ROUTING_RECEIPT_REQUIRED/,
    );
  } finally {
    remove(root);
    remove(former);
    remove(registry);
  }
});

test('current reconciliation enumerates and records every current source root', () => {
  const candidate = { task: 'USER-2', role: 'User', lane: 'fb-user', file: 'multi-source.md' };
  const root = makeFixture([candidate]);
  const former = makeFixture([candidate]);
  const added = makeFixture([candidate]);
  const registry = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-routing-multi-registry-'));
  const relative = 'docs/handoffs/multi-source.md';
  try {
    initGitFixture(root);
    initGitFixture(former);
    initGitFixture(added);
    configureVerifiedControlPlane(root, former);
    fs.appendFileSync(path.join(root, relative), '\nApproved canonical revision.\n');
    fs.appendFileSync(path.join(added, relative), '\nAdditional preserved source.\n');
    const manifestPath = path.join(root, '.git', 'fb-checkout-migration.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.checkouts[fs.realpathSync(added)] = { state: 'quarantined' };
    manifest.differences = [{
      id: 'migration:handoff:single-prior-source',
      kind: 'handoff',
      relative,
      canonical: { root, value: { sha256: 'a'.repeat(64) } },
      source: { root: former, value: { sha256: 'b'.repeat(64) } },
      disposition: 'canonical-approved-sources-preserved',
    }];
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
    const canonicalSha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
    const sources = [former, added].map(sourceRoot => ({
      root: fs.realpathSync(sourceRoot),
      sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(sourceRoot, relative))).digest('hex'),
    })).sort((left, right) => left.root.localeCompare(right.root));
    const reconciliation = {
      approvalRef: 'James approved the bounded multi-source recovery on 2026-08-16',
      disposition: 'canonical-approved-sources-preserved',
      canonicalSha256,
      sources,
    };

    assert.throws(
      () => refreshBfmRoutingReceipts(root, {
        relatives: [relative],
        rebuildMissing: true,
        reconcileCurrent: { [relative]: { ...reconciliation, sources: sources.slice(0, 1) } },
        registryDir: registry,
      }),
      /HANDOFF_CONTENT_DRIFT/,
    );

    const refreshed = refreshBfmRoutingReceipts(root, {
      relatives: [relative],
      rebuildMissing: true,
      reconcileCurrent: { [relative]: reconciliation },
      registryDir: registry,
    });
    assert.deepEqual(
      refreshed.manifest.routingReceipts[relative].sources.map(source => source.root),
      sources.map(source => source.root),
    );
    const exactEvidence = refreshed.manifest.differences.filter(difference =>
      difference.kind === 'handoff'
      && difference.relative === relative
      && sources.some(source => source.root === fs.realpathSync(difference.source.root))
    );
    assert.equal(exactEvidence.length, 2);
    assert.deepEqual(
      exactEvidence.map(difference => ({
        root: fs.realpathSync(difference.source.root),
        canonicalSha256: difference.canonical.value.sha256,
        sourceSha256: difference.source.value.sha256,
        approvalRef: difference.approvalRef,
      })).sort((left, right) => left.root.localeCompare(right.root)),
      sources.map(source => ({
        root: source.root,
        canonicalSha256,
        sourceSha256: source.sha256,
        approvalRef: reconciliation.approvalRef,
      })),
    );
  } finally {
    remove(root);
    remove(former);
    remove(added);
    remove(registry);
  }
});

test('complete empty intake proves all six None relevant and separates Product/BFM', () => {
  const root = makeFixture();
  try {
    initGitFixture(root);
    configureVerifiedControlPlane(root);
    const ledger = freezeBfmIntake(root, { dispositions: {} });
    assert.deepEqual(ledger.roles.map(role => role.role), ROLE_ORDER);
    assert.equal(ledger.emptyQueueProven, true);
    assert.equal(ledger.candidates.length, 0);
    for (const role of ledger.roles.slice(0, 6)) {
      assert.equal(role.candidateCount, 0);
      assert.equal(role.summary, 'None relevant');
    }
    assert.deepEqual(ledger.roles.at(-1), {
      role: 'Product/BFM',
      candidateCount: 0,
      blockedCount: 0,
      summary: 'Control centre — not an evidence workstream',
      candidates: [],
      blocked: [],
    });
    const rendered = renderBfmIntakeLedger(ledger);
    let previous = -1;
    for (const role of ROLE_ORDER) {
      const position = rendered.indexOf(`${role}:`);
      assert.ok(position > previous, `${role} must render in canonical order`);
      previous = position;
    }
    assert.match(rendered, /Empty queue proof: complete/);
  } finally {
    remove(root);
  }
});

test('every candidate receives exactly one allowed disposition with hash-bound routing state', () => {
  const candidates = [
    { task: 'USER-1', role: 'User', lane: 'fb-user', file: 'user.md' },
    { task: 'BUSINESS-1', role: 'Business', lane: 'fb-business', file: 'business.md' },
    { task: 'DESIGN-1', role: 'Design', lane: 'fb-design', file: 'design.md' },
    { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'tech.md' },
    { task: 'DISCOVERY-1', role: 'Discovery', lane: 'fb-discovery', file: 'discovery.md' },
    { task: 'BUGS-1', role: 'Bugs', lane: 'fb-bugs', file: 'bugs.md' },
  ];
  const allowed = ['Include now', 'Blocked', 'Deferred', 'Duplicate', 'Rejected', 'Superseded'];
  const root = makeFixture(candidates);
  try {
    const ledger = freezeBfmIntake(root, { dispositions: dispositionsFor(candidates, allowed) });
    assert.deepEqual(ledger.candidates.map(candidate => candidate.disposition), allowed);
    assert.ok(ledger.candidates.every(candidate => /^[a-f0-9]{64}$/.test(candidate.sha256)));
    assert.ok(ledger.candidates.every(candidate => /^[a-f0-9]{64}$/.test(candidate.routingSha256)));
    assert.deepEqual(ledger.recommendedOrder, ['USER-1']);
    const userRouting = ledger.candidates.find(candidate => candidate.task === 'USER-1').routingSha256;
    fs.appendFileSync(path.join(root, 'docs', 'workstreams', 'fb-user.md'), '\nRouting state changed.\n');
    const changed = freezeBfmIntake(root, { dispositions: dispositionsFor(candidates, allowed) });
    assert.notEqual(
      changed.candidates.find(candidate => candidate.task === 'USER-1').routingSha256,
      userRouting,
      'the frozen routing digest must bind the workstream-card state',
    );
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { ...dispositionsFor(candidates, allowed), 'EXTRA-1': 'Deferred' } }),
      /BFM_DISPOSITION_INCOMPLETE.*EXTRA-1/
    );
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { ...dispositionsFor(candidates, allowed), 'USER-1': 'Maybe' } }),
      /BFM_DISPOSITION_INCOMPLETE.*USER-1/
    );
  } finally {
    remove(root);
  }
});

test('hidden Ready work and incomplete board/index/card inventory fail closed', () => {
  const candidate = { task: 'DESIGN-1', role: 'Design', lane: 'fb-design', file: 'design.md' };
  const root = makeFixture([candidate]);
  try {
    fs.writeFileSync(path.join(root, 'docs', 'handoffs', 'hidden.md'), '# Hidden\n\n**Status:** Ready for Product intake\n');
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'DESIGN-1': 'Include now' } }),
      /READINESS_FALSE_NEGATIVE.*hidden\.md/
    );
    fs.rmSync(path.join(root, 'docs', 'handoffs', 'hidden.md'));
    fs.rmSync(path.join(root, 'docs', 'workstreams', 'fb-design.md'));
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'DESIGN-1': 'Include now' } }),
      /BFM_INTAKE_INCOMPLETE.*Design/
    );
  } finally {
    remove(root);
  }
});

test('same-filename drift and inaccessible former roots remain canonical scanner failures', () => {
  const candidate = { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'same.md' };
  const root = makeFixture([candidate]);
  const former = makeFixture([candidate]);
  try {
    fs.writeFileSync(path.join(former, 'docs', 'handoffs', 'same.md'), handoff({ task: 'TECH-1', lane: 'fb-tech' }) + 'drift\n');
    fs.writeFileSync(path.join(root, '.git', 'fb-handoff-audit-roots'), `${former}\n`);
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'TECH-1': 'Include now' } }),
      /HANDOFF_CONTENT_DRIFT.*same\.md/
    );
    fs.writeFileSync(path.join(root, '.git', 'fb-handoff-audit-roots'), `${path.join(root, 'missing-root')}\n`);
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'TECH-1': 'Include now' } }),
      /READINESS_AUDIT_INCOMPLETE.*missing-root/
    );
  } finally {
    remove(root);
    remove(former);
  }
});

test('cross-root routing drift requires a receipt bound to canonical and source routing hashes', () => {
  const candidate = { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'same.md' };
  const root = makeFixture([candidate]);
  const former = makeFixture([candidate]);
  try {
    initGitFixture(root);
    initGitFixture(former);
    fs.appendFileSync(path.join(former, 'docs', 'workstreams', 'fb-tech.md'), '\nFormer-root route changed.\n');
    fs.writeFileSync(path.join(root, '.git', 'fb-handoff-audit-roots'), `${former}\n`);
    const source = fs.readFileSync(path.join(root, 'docs', 'handoffs', 'same.md'));
    fs.writeFileSync(path.join(root, '.git', 'fb-checkout-migration.json'), `${JSON.stringify({
      version: 1,
      canonicalPath: root,
      checkouts: { [root]: { state: 'active' } },
      taskRebind: { status: 'complete', pending: [] },
      unresolvedDrift: [],
      routingReceipts: {
        'docs/handoffs/same.md': {
          canonicalSha256: crypto.createHash('sha256').update(source).digest('hex'),
          sources: [{ root: former, sha256: crypto.createHash('sha256').update(source).digest('hex') }],
          disposition: 'canonical-routing-retained',
        },
      },
    })}\n`);
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'TECH-1': 'Include now' } }),
      /HANDOFF_ROUTING_DRIFT[\s\S]*canonicalRoutingSha256[\s\S]*routingSha256/
    );
  } finally {
    remove(root);
    remove(former);
  }
});

test('missing linked worktrees and their required routing surfaces fail closed', () => {
  const root = makeFixture();
  const linked = `${fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-ledger-linked-parent-'))}-worktree`;
  try {
    initGitFixture(root);
    git(root, ['worktree', 'add', '-b', 'audit-linked', linked]);
    fs.rmSync(linked, { recursive: true, force: true });
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: {} }),
      /READINESS_AUDIT_INCOMPLETE[\s\S]*linked-parent-[^\s]*-worktree/
    );
  } finally {
    remove(linked);
    remove(root);
  }
});

test('routing requires one coherent exact task and filename entry per authoritative surface', () => {
  const candidate = { task: 'TASK-1', role: 'User', lane: 'fb-user', file: 'task-1.md' };
  const root = makeFixture([candidate]);
  try {
    fs.writeFileSync(
      path.join(root, 'docs', 'handoffs', 'index.md'),
      '# Handoff Index\n\n| Task | Lane | Status | Detail |\n|---|---|---|---|\n| TASK-10 | User | Ready | [task-1.md](task-1.md) |\n'
    );
    fs.writeFileSync(path.join(root, 'docs', 'workstreams', 'fb-user.md'), '# User\n\nTASK-10\n');
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: { 'TASK-1': 'Include now' } }),
      /BFM_INTAKE_INCOMPLETE[\s\S]*exact[\s\S]*TASK-1/
    );
  } finally {
    remove(root);
  }
});

test('noncanonical checkout cannot freeze BFM intake', () => {
  const root = makeFixture();
  const canonical = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bfm-ledger-canonical-'));
  try {
    initGitFixture(root);
    execFileSync('git', ['init', '-b', 'main', canonical], { stdio: 'ignore' });
    const manifest = {
      version: 1,
      canonicalPath: canonical,
      checkouts: {
        [canonical]: { state: 'active' },
        [root]: { state: 'quarantined' },
      },
      taskRebind: { status: 'complete', pending: [] },
      routingReceipts: {},
      unresolvedDrift: [],
    };
    fs.writeFileSync(path.join(root, '.git', 'fb-checkout-migration.json'), `${JSON.stringify(manifest)}\n`);
    assert.throws(() => freezeBfmIntake(root, { dispositions: {} }), /FB_CHECKOUT_NOT_CANONICAL/);
  } finally {
    remove(root);
    remove(canonical);
  }
});

test('dependency and lock conflicts serialize Include-now work and expose gates', () => {
  const candidates = [
    {
      task: 'USER-1', role: 'User', lane: 'fb-user', file: 'user.md', dependsOn: 'DESIGN-1',
      locks: '`shared.css`', approvalGate: 'privacy review',
    },
    {
      task: 'BUSINESS-1', role: 'Business', lane: 'fb-business', file: 'business.md',
      locks: '`shared.css`', externalBlocker: 'vendor decision',
    },
    { task: 'DESIGN-1', role: 'Design', lane: 'fb-design', file: 'design.md', locks: '`design.css`' },
    { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'tech.md', locks: '`server.js`' },
  ];
  const root = makeFixture(candidates, {
    extraBoardTasks: [{
      id: 'ACTIVE-1', role: 'Tech', file: 'active.md', locks: '`server.js`', status: 'In Progress',
    }],
  });
  try {
    const dispositions = dispositionsFor(candidates, ['Include now', 'Include now', 'Include now', 'Include now']);
    const ledger = freezeBfmIntake(root, { dispositions });
    assert.ok(ledger.recommendedOrder.indexOf('DESIGN-1') < ledger.recommendedOrder.indexOf('USER-1'));
    assert.ok(ledger.recommendedWaves.every(wave => !(wave.includes('USER-1') && wave.includes('BUSINESS-1'))));
    assert.deepEqual(ledger.approvalGates, [{ task: 'USER-1', gate: 'privacy review' }]);
    assert.deepEqual(ledger.externalBlockers, [
      { task: 'BUSINESS-1', blocker: 'vendor decision' },
      { task: 'TECH-1', blocker: 'Lock server.js is active in ACTIVE-1' },
    ]);
    assert.ok(ledger.activeLocks.some(lock => lock.path === 'server.js' && lock.tasks.includes('ACTIVE-1')));
    const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'docs', 'handoffs', 'user.md'))).digest('hex');
    assert.equal(ledger.candidates.find(candidate => candidate.task === 'USER-1').sha256, digest);
  } finally {
    remove(root);
  }
});

test('the existing BFM claim path gates before mutation and emits the frozen ledger on success', () => {
  const blockedCandidate = { task: 'TASK-1', role: 'Tech', lane: 'fb-tech', file: 'task-1.md', boardStatus: 'Ready' };
  const blockedRoot = makeFixture([blockedCandidate]);
  const runtimePath = path.join(__dirname, 'fb-lane.cjs');
  try {
    const before = fs.readFileSync(path.join(blockedRoot, 'PROJECT_BOARD.md'), 'utf8');
    const blocked = spawnSync(
      process.execPath,
      [runtimePath, 'claim', 'TASK-1', 'bfm', '(None)', '--no-worktree'],
      { cwd: blockedRoot, encoding: 'utf8' }
    );
    assert.notEqual(blocked.status, 0);
    assert.match(`${blocked.stdout}\n${blocked.stderr}`, /BFM_DISPOSITION_INCOMPLETE|BFM_EXECUTION_BLOCKED/);
    assert.equal(fs.readFileSync(path.join(blockedRoot, 'PROJECT_BOARD.md'), 'utf8'), before);
  } finally {
    remove(blockedRoot);
  }

  const readyCandidate = {
    task: 'TASK-2', role: 'Tech', lane: 'fb-tech', file: 'task-2.md', boardStatus: 'Ready', disposition: 'Include now', worktree: 'worktrees/task-2',
  };
  const readyRoot = makeFixture([readyCandidate]);
  try {
    initGitFixture(readyRoot);
    configureVerifiedControlPlane(readyRoot);
    git(readyRoot, ['remote', 'add', 'origin', readyRoot]);
    const automatic = gateBfmExecutionStart(readyRoot, 'bfm', {
      taskId: 'TASK-2',
      writeProjection: false,
      graphStatus: 'healthy',
      graph: {
        schemaVersion: 1,
        sourceFingerprint: { hash: 'direct-fixture', sources: [] },
        health: { valid: true, findings: [], sourceCount: 1 },
        nodes: [{
          id: 'task:TASK-2', type: 'task', label: 'TASK-2', activityState: 'Ready',
          source: 'PROJECT_BOARD.md', citation: { source: 'PROJECT_BOARD.md' },
        }],
        edges: [],
      },
    });
    assert.equal(automatic.graphRuntime.route, 'direct');
    assert.match(automatic.rendered, /Direct BFM[\s\S]*single-isolated-bounded-item/);
    const claimed = spawnSync(
      process.execPath,
      [runtimePath, 'claim', 'TASK-2', 'bfm', '(None)', '--no-worktree'],
      { cwd: readyRoot, encoding: 'utf8' }
    );
    assert.equal(claimed.status, 0, `${claimed.stdout}\n${claimed.stderr}`);
    assert.match(claimed.stdout, /BFM intake ledger[\s\S]*Execution gate: open for Include now scope/);
    assert.ok(claimed.stdout.indexOf('BFM intake ledger') < claimed.stdout.indexOf('Switching to main'));
    assert.equal(gateBfmExecutionStart(readyRoot, 'tech'), null);
    const runtime = fs.readFileSync(runtimePath, 'utf8');
    assert.match(runtime, /enum:\s*\[[^\]]*'BFM'/);
  } finally {
    remove(readyRoot);
  }
});

test('real BFM claim requires the complete cross-feature reliability evidence set', () => {
  const candidates = [
    { task: 'USER-1', role: 'User', lane: 'fb-user', file: 'user.md', boardStatus: 'Ready', disposition: 'Include now' },
    { task: 'BUSINESS-1', role: 'Business', lane: 'fb-business', file: 'business.md', boardStatus: 'Ready', disposition: 'Include now' },
    { task: 'DESIGN-1', role: 'Design', lane: 'fb-design', file: 'design.md', boardStatus: 'Ready', disposition: 'Include now' },
    { task: 'TECH-1', role: 'Tech', lane: 'fb-tech', file: 'tech.md', boardStatus: 'Ready', disposition: 'Include now' },
    { task: 'DISCOVERY-1', role: 'Discovery', lane: 'fb-discovery', file: 'discovery.md', boardStatus: 'Ready', disposition: 'Include now' },
    { task: 'BUGS-1', role: 'Bugs', lane: 'fb-bugs', file: 'bugs.md', boardStatus: 'Ready', disposition: 'Include now' },
    { task: 'PRODUCT-1', role: 'Product/BFM', lane: 'fb-product', file: 'product.md', boardStatus: 'Ready', disposition: 'Include now' },
  ];
  const root = makeFixture(candidates);
  const former = makeFixture(candidates);
  const runtimePath = path.join(__dirname, 'fb-lane.cjs');
  try {
    initGitFixture(root);
    initGitFixture(former);
    git(root, ['remote', 'add', 'origin', root]);
    writeMigrationManifest(root, former);
    writeVerifiedOnboardingReceipt(root);
    assert.equal(fs.existsSync(path.join(root, '.git', 'fb-handoff-audit-roots')), false);

    const claimed = spawnSync(
      process.execPath,
      [runtimePath, 'claim', 'TECH-1', 'bfm', '(None)', '--no-worktree'],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(claimed.status, 0, `${claimed.stdout}\n${claimed.stderr}`);
    assert.match(claimed.stdout, /Product\/BFM: 1 candidate\(s\) — PRODUCT-1: Include now/);
    assert.match(claimed.stdout, /Onboarding reconciliation: verified/);

    fs.rmSync(former, { recursive: true, force: true });
    assert.throws(
      () => freezeBfmIntake(root, { dispositions: dispositionsFor(candidates, candidates.map(() => 'Include now')) }),
      /READINESS_AUDIT_INCOMPLETE.*fb-bfm-ledger-/,
    );

    const manifest = JSON.parse(fs.readFileSync(path.join(root, '.git', 'fb-checkout-migration.json'), 'utf8'));
    delete manifest.checkouts[former];
    manifest.taskBindings.tech.taskId = 'stale-tech-task';
    fs.writeFileSync(path.join(root, '.git', 'fb-checkout-migration.json'), `${JSON.stringify(manifest)}\n`);
    writeVerifiedOnboardingReceipt(root);
    assert.throws(
      () => gateBfmExecutionStart(root, 'bfm', { dispositions: dispositionsFor(candidates, candidates.map(() => 'Include now')) }),
      /BFM_EXECUTION_BLOCKED[\s\S]*Onboarding reconciliation: stale/,
    );
  } finally {
    remove(root);
    remove(former);
  }
});

test('onboarding evidence and blocked-only roles remain visible at the execution boundary', () => {
  const ready = { task: 'TECH-2', role: 'Tech', lane: 'fb-tech', file: 'ready.md', boardStatus: 'Ready' };
  const root = makeFixture([ready]);
  try {
    initGitFixture(root);
    writeMigrationManifest(root);

    let ledger = freezeBfmIntake(root, { dispositions: { 'TECH-2': 'Include now' } });
    assert.equal(ledger.onboardingState, 'absent');
    assert.deepEqual(ledger.missingRoles, ROLE_ORDER);
    assert.equal(ledger.executionAllowed, false);
    assert.equal(ledger.emptyQueueProven, false);

    writeVerifiedOnboardingReceipt(root, {
      permission: 'pending',
      workstreams: undefined,
      taskBindings: undefined,
      reconciledAt: undefined,
    });
    ledger = freezeBfmIntake(root, { dispositions: { 'TECH-2': 'Include now' } });
    assert.equal(ledger.onboardingState, 'permission-pending');

    const partial = writeVerifiedOnboardingReceipt(root);
    delete partial.taskBindings.bugs;
    fs.writeFileSync(path.join(root, '.git', 'fb-onboarding.json'), `${JSON.stringify(partial)}\n`);
    ledger = freezeBfmIntake(root, { dispositions: { 'TECH-2': 'Include now' } });
    assert.equal(ledger.onboardingState, 'partial');
    assert.deepEqual(ledger.missingRoles, ['Bugs']);

    writeVerifiedOnboardingReceipt(root, { attemptedActionsHash: '0'.repeat(64) });
    ledger = freezeBfmIntake(root, { dispositions: { 'TECH-2': 'Include now' } });
    assert.equal(ledger.onboardingState, 'stale');

    writeVerifiedOnboardingReceipt(root, { repositoryPath: '' });
    ledger = freezeBfmIntake(root, { dispositions: { 'TECH-2': 'Include now' } });
    assert.equal(ledger.onboardingState, 'stale', 'a missing receipt path must not resolve through cwd');

    writeVerifiedOnboardingReceipt(root, { projectId: 'another-project' });
    ledger = freezeBfmIntake(root, { dispositions: { 'TECH-2': 'Include now' } });
    assert.equal(ledger.onboardingState, 'stale', 'the receipt project ID must match the migration project ID');

    writeVerifiedOnboardingReceipt(root);
    ledger = freezeBfmIntake(root, { dispositions: { 'TECH-2': 'Include now' } });
    assert.equal(ledger.onboardingState, 'verified');
    assert.deepEqual(ledger.missingRoles, []);
    assert.equal(ledger.executionAllowed, true);

    fs.rmSync(path.join(root, '.git', 'fb-checkout-migration.json'));
    ledger = freezeBfmIntake(root, { dispositions: { 'TECH-2': 'Include now' } });
    assert.equal(ledger.canonicalEvidenceState, 'not-configured');
    assert.equal(ledger.executionAllowed, false);
  } finally {
    remove(root);
  }

  const blocked = { task: 'BUG-BLOCKED', role: 'Bugs', lane: 'fb-bugs', file: 'blocked.md', boardStatus: 'Blocked' };
  const blockedRoot = makeFixture([]);
  try {
    initGitFixture(blockedRoot);
    configureVerifiedControlPlane(blockedRoot);
    fs.writeFileSync(path.join(blockedRoot, 'docs', 'handoffs', blocked.file), handoff({
      task: blocked.task,
      lane: blocked.lane,
      status: 'blocked',
    }));
    const ledger = freezeBfmIntake(blockedRoot, { dispositions: {} });
    const bugs = ledger.roles.find(role => role.role === 'Bugs');
    assert.equal(bugs.candidateCount, 0);
    assert.equal(bugs.blockedCount, 1);
    assert.deepEqual(bugs.blocked, [`docs/handoffs/${blocked.file}`]);
    assert.doesNotMatch(bugs.summary, /None relevant/);
    assert.match(renderBfmIntakeLedger(ledger), /Bugs: 0 ready, 1 blocked.*docs\/handoffs\/blocked\.md/);
  } finally {
    remove(blockedRoot);
  }
});
