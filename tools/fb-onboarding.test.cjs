#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

let onboarding = {};
try {
  onboarding = require('./fb-onboarding.cjs');
} catch (error) {
  // RED begins with the production module absent.
}

const REPO = '/work/projects/mirrorcam';
const REPOSITORY = { projectId: 'project-mirrorcam', repositoryPath: REPO };

function completeInventory(repository = REPOSITORY) {
  return {
    complete: true,
    attemptedActions: [],
    tasks: onboarding.WORKSTREAMS.map((workstream, index) => ({
      id: `task-${index}`,
      title: workstream.title,
      projectId: repository.projectId,
      projectPath: repository.repositoryPath,
      pinned: true,
    })),
  };
}

test('legacy four-task projects add User, Discovery, and Bugs', () => {
  assert.strictEqual(typeof onboarding.planMissingWorkstreams, 'function');
  const tasks = ['Product', 'FB Business', 'FB-Design', 'Tech'].map(title => ({
    title,
    projectPath: REPO,
  }));
  assert.deepStrictEqual(
    onboarding.planMissingWorkstreams(tasks, REPO).map(item => item.key),
    ['user', 'discovery', 'bugs'],
  );
});

test('legacy six-task projects reuse Product as Product/BFM and create only User', () => {
  const tasks = [
    'FB Product',
    'FB · Business',
    'FB · Design',
    'FB · Tech',
    'FB · Discovery',
    'FB · Bugs',
  ].map(title => ({ title, projectPath: REPO }));
  assert.deepStrictEqual(
    onboarding.planMissingWorkstreams(tasks, REPO).map(item => item.key),
    ['user'],
  );
});

test('tasks from another repository never satisfy this repository onboarding', () => {
  const tasks = onboarding.WORKSTREAMS.map(item => ({
    title: item.title,
    projectPath: '/work/projects/another-app',
  }));
  assert.deepStrictEqual(
    onboarding.planMissingWorkstreams(tasks, REPO).map(item => item.key),
    ['product', 'user', 'business', 'design', 'tech', 'discovery', 'bugs'],
  );
});

test('Codex project IDs scope tasks when thread summaries omit repository paths', () => {
  const tasks = ['Product', 'Business', 'Design', 'Tech'].map(title => ({
    title,
    projectId: 'project-mirrorcam',
  }));
  tasks.push({ title: 'Discovery', projectId: 'project-other' });
  assert.deepStrictEqual(
    onboarding.planMissingWorkstreams(tasks, {
      projectId: 'project-mirrorcam',
      repositoryPath: REPO,
    }).map(item => item.key),
    ['user', 'discovery', 'bugs'],
  );
});

test('an exact project ID never accepts a path-only or different-project task', () => {
  const inventory = completeInventory();
  inventory.tasks[0] = {
    ...inventory.tasks[0],
    projectId: undefined,
    projectPath: REPO,
  };
  inventory.tasks[1] = {
    ...inventory.tasks[1],
    projectId: 'project-other',
  };
  assert.deepStrictEqual(
    onboarding.planMissingWorkstreams(inventory.tasks, {
      projectId: 'project-mirrorcam',
      repositoryPath: REPO,
    }).map(item => item.key),
    ['product', 'user'],
  );
});

test('bootstrap receipt asks once and records permission clone-locally', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-'));
  try {
    const first = onboarding.ensureOnboardingReceipt(root, {
      now: new Date('2026-07-29T10:00:00Z'),
    });
    const second = onboarding.ensureOnboardingReceipt(root, {
      now: new Date('2026-07-29T11:00:00Z'),
    });
    assert.strictEqual(first.shouldPrompt, true);
    assert.strictEqual(second.shouldPrompt, false);
    assert.strictEqual(first.state.permission, 'pending');
    assert.strictEqual(second.state.promptedAt, '2026-07-29T10:00:00.000Z');

    const granted = onboarding.recordPermission(root, 'granted', {
      now: new Date('2026-07-29T12:00:00Z'),
    });
    assert.strictEqual(granted.permission, 'granted');
    assert.strictEqual(granted.decidedAt, '2026-07-29T12:00:00.000Z');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('legacy six-role receipts remain readable until seven-role reconciliation runs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-legacy-'));
  try {
    const receipt = {
      schemaVersion: 1,
      repositoryPath: root,
      permission: 'granted',
      promptedAt: '2026-07-29T10:00:00.000Z',
      workstreams: ['product', 'business', 'design', 'tech', 'discovery', 'bugs'],
      reconciledAt: '2026-07-29T13:00:00.000Z',
    };
    fs.mkdirSync(path.join(root, '.fb'), { recursive: true });
    fs.writeFileSync(path.join(root, '.fb', 'onboarding.json'), `${JSON.stringify(receipt)}\n`);
    const existing = onboarding.ensureOnboardingReceipt(root);
    assert.strictEqual(existing.shouldPrompt, false);
    assert.deepStrictEqual(existing.state, receipt);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('legacy reconciled receipts still run the seven-role reconciliation cycle', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-legacy-cycle-'));
  const tool = path.join(__dirname, 'fb-onboarding.cjs');
  try {
    const receipt = {
      schemaVersion: 1,
      repositoryPath: root,
      permission: 'granted',
      promptedAt: '2026-07-29T10:00:00.000Z',
      workstreams: ['product', 'business', 'design', 'tech', 'discovery', 'bugs'],
      reconciledAt: '2026-07-29T13:00:00.000Z',
    };
    fs.mkdirSync(path.join(root, '.fb'), { recursive: true });
    fs.writeFileSync(path.join(root, '.fb', 'onboarding.json'), `${JSON.stringify(receipt)}\n`);

    const before = spawnSync(process.execPath, [tool, 'needs-reconciliation', root], {
      encoding: 'utf8',
    });
    assert.strictEqual(before.status, 0, before.stderr);
    assert.deepStrictEqual(JSON.parse(before.stdout), { needsReconciliation: true });

    const inventoryPath = path.join(root, 'task-inventory.json');
    fs.writeFileSync(inventoryPath, `${JSON.stringify({
      complete: true,
      attemptedActions: [],
      tasks: onboarding.WORKSTREAMS.map((workstream, index) => ({
        id: `task-${index}`,
        title: workstream.title,
        projectId: 'project-legacy',
        projectPath: root,
        pinned: true,
      })),
    })}\n`);
    const reconciled = spawnSync(process.execPath, [
      tool,
      'reconcile',
      inventoryPath,
      '--repository-root',
      root,
      '--project-id',
      'project-legacy',
    ], {
      encoding: 'utf8',
    });
    assert.strictEqual(reconciled.status, 0, reconciled.stderr);

    const after = spawnSync(process.execPath, [tool, 'needs-reconciliation', root], {
      encoding: 'utf8',
    });
    assert.strictEqual(after.status, 0, after.stderr);
    assert.deepStrictEqual(JSON.parse(after.stdout), { needsReconciliation: false });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('one clone shares the permission receipt across linked worktrees', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-git-'));
  const linked = `${root}-linked`;
  const git = (cwd, args) => execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    git(root, ['init', '-q']);
    git(root, ['config', 'user.name', 'FB Test']);
    git(root, ['config', 'user.email', 'fb-test@example.invalid']);
    fs.writeFileSync(path.join(root, 'README.md'), '# Fixture\n');
    git(root, ['add', 'README.md']);
    git(root, ['commit', '-qm', 'fixture']);
    git(root, ['worktree', 'add', '-qb', 'fixture-linked', linked]);

    const first = onboarding.ensureOnboardingReceipt(root);
    const second = onboarding.ensureOnboardingReceipt(linked);
    assert.strictEqual(first.shouldPrompt, true);
    assert.strictEqual(second.shouldPrompt, false);
    assert.strictEqual(second.statePath, first.statePath);
    assert.match(first.statePath, /\.git\/fb-onboarding\.json$/);
  } finally {
    fs.rmSync(linked, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('reconciliation completes only after all seven roles are observed', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-'));
  try {
    onboarding.ensureOnboardingReceipt(root);
    onboarding.recordPermission(root, 'granted');
    assert.throws(() => onboarding.recordReconciliation(
      root,
      ['product', 'user', 'business', 'design', 'tech', 'discovery', 'bugs'],
    ), /complete.*inventory|exact.*pinned/i);
    const inventory = {
      complete: true,
      attemptedActions: [],
      tasks: onboarding.WORKSTREAMS.map((workstream, index) => ({
        id: `task-${index}`,
        title: workstream.title,
        projectId: 'project-reconcile',
        projectPath: root,
        pinned: index !== 6,
      })),
    };
    const reconciliationOptions = {
      repository: { projectId: 'project-reconcile', repositoryPath: root },
    };
    assert.throws(
      () => onboarding.recordReconciliation(root, inventory, reconciliationOptions),
      /all seven|pinned/i,
    );
    inventory.tasks[6].pinned = true;
    const state = onboarding.recordReconciliation(root, inventory, {
      ...reconciliationOptions,
      now: new Date('2026-07-29T13:00:00Z'),
    });
    assert.strictEqual(state.reconciledAt, '2026-07-29T13:00:00.000Z');
    assert.deepStrictEqual(state.workstreams, [
      'product',
      'user',
      'business',
      'design',
      'tech',
      'discovery',
      'bugs',
    ]);
    assert.strictEqual(state.taskBindings.bugs.taskId, 'task-6');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('repository inventory planning creates and pins all seven roles without mutation', () => {
  assert.strictEqual(typeof onboarding.planRepositoryTaskInventory, 'function');
  const plan = onboarding.planRepositoryTaskInventory({ complete: true, tasks: [] }, REPOSITORY);
  assert.strictEqual(plan.complete, true);
  assert.deepStrictEqual(
    plan.actions.map(action => [action.type, action.workstream]),
    [
      ['create', 'product'], ['pin', 'product'],
      ['create', 'user'], ['pin', 'user'],
      ['create', 'business'], ['pin', 'business'],
      ['create', 'design'], ['pin', 'design'],
      ['create', 'tech'], ['pin', 'tech'],
      ['create', 'discovery'], ['pin', 'discovery'],
      ['create', 'bugs'], ['pin', 'bugs'],
    ],
  );
});

test('repository inventory planning migrates legacy titles and preserves pinned tasks', () => {
  const tasks = [
    { id: 'legacy-product-user', title: 'FB · Product/User', projectId: REPOSITORY.projectId, projectPath: REPO, pinned: false },
    { id: 'legacy-product', title: 'Product', projectId: REPOSITORY.projectId, projectPath: REPO, pinned: true },
    { id: 'business', title: 'FB · Business', projectId: REPOSITORY.projectId, projectPath: REPO, pinned: true },
    { id: 'design', title: 'FB · Design', projectId: REPOSITORY.projectId, projectPath: REPO, pinned: true },
    { id: 'tech', title: 'FB · Tech', projectId: REPOSITORY.projectId, projectPath: REPO, pinned: true },
    { id: 'discovery', title: 'FB · Discovery', projectId: REPOSITORY.projectId, projectPath: REPO, pinned: true },
    { id: 'bugs', title: 'FB · Bugs', projectId: REPOSITORY.projectId, projectPath: REPO, pinned: true },
  ];
  const plan = onboarding.planRepositoryTaskInventory({ complete: true, tasks }, REPOSITORY);
  assert.deepStrictEqual(
    plan.actions.map(action => [action.type, action.workstream, action.taskId || null]),
    [
      ['reuse', 'product', 'legacy-product'],
      ['rename', 'product', 'legacy-product'],
      ['reuse', 'user', 'legacy-product-user'],
      ['rename', 'user', 'legacy-product-user'],
      ['pin', 'user', 'legacy-product-user'],
      ['reuse', 'business', 'business'],
      ['reuse', 'design', 'design'],
      ['reuse', 'tech', 'tech'],
      ['reuse', 'discovery', 'discovery'],
      ['reuse', 'bugs', 'bugs'],
    ],
  );
});

test('repository inventory planning never creates tasks from a partial or foreign inventory', () => {
  const partial = onboarding.planRepositoryTaskInventory({
    tasks: [{ id: 'foreign-user', title: 'FB · User', projectPath: '/work/projects/another-app', pinned: true }],
    complete: false,
    failures: [{ operation: 'list', message: 'page two unavailable' }],
  }, REPOSITORY);
  assert.strictEqual(partial.complete, false);
  assert.deepStrictEqual(partial.actions, []);
  assert.deepStrictEqual(partial.failures, [{ operation: 'list', message: 'page two unavailable' }]);
});

test('repository inventory planning blocks duplicate roles and unproven object inventories', () => {
  const duplicate = onboarding.planRepositoryTaskInventory({
    complete: true,
    tasks: [
      { id: 'legacy-product', title: 'Product', projectId: REPOSITORY.projectId, projectPath: REPO, pinned: false },
      { id: 'canonical-product', title: 'FB · Product/BFM', projectId: REPOSITORY.projectId, projectPath: REPO, pinned: true },
    ],
  }, REPOSITORY);
  assert.strictEqual(duplicate.complete, false);
  assert.deepStrictEqual(duplicate.actions, []);
  assert.deepStrictEqual(duplicate.failures, [{
    operation: 'inventory',
    message: 'Ambiguous Product/BFM tasks: canonical-product, legacy-product.',
  }]);

  const unproven = onboarding.planRepositoryTaskInventory({ tasks: [] }, REPOSITORY);
  assert.strictEqual(unproven.complete, false);
  assert.deepStrictEqual(unproven.actions, []);
  assert.deepStrictEqual(unproven.failures, [{
    operation: 'inventory',
    message: 'A complete task inventory is required before planning.',
  }]);
});

test('repository inventory planning fails closed when rename or pin targets lack IDs', () => {
  const renameWithoutId = onboarding.planRepositoryTaskInventory({
    complete: true,
    tasks: [{ title: 'Product', projectId: REPOSITORY.projectId, projectPath: REPO, pinned: true }],
  }, REPOSITORY);
  assert.strictEqual(renameWithoutId.complete, false);
  assert.deepStrictEqual(renameWithoutId.actions, []);
  assert.deepStrictEqual(renameWithoutId.failures, [{
    operation: 'inventory',
    message: 'Cannot rename Product/BFM without an executable task/thread ID.',
  }]);

  const pinWithoutId = onboarding.planRepositoryTaskInventory({
    complete: true,
    tasks: [{ title: 'FB · User', projectId: REPOSITORY.projectId, projectPath: REPO, pinned: false }],
  }, REPOSITORY);
  assert.strictEqual(pinWithoutId.complete, false);
  assert.deepStrictEqual(pinWithoutId.actions, []);
  assert.deepStrictEqual(pinWithoutId.failures, [{
    operation: 'inventory',
    message: 'Cannot pin User without an executable task/thread ID.',
  }]);
});

test('repository inventory planning is deterministic across repeated complete inventories', () => {
  const tasks = onboarding.WORKSTREAMS.map((workstream, index) => ({
    id: `task-${index}`,
    title: workstream.title,
    projectId: REPOSITORY.projectId,
    projectPath: REPO,
    pinned: true,
  }));
  const inventory = { complete: true, tasks };
  const first = onboarding.planRepositoryTaskInventory(inventory, REPOSITORY);
  const second = onboarding.planRepositoryTaskInventory(inventory, REPOSITORY);
  assert.deepStrictEqual(first, second);
  assert.deepStrictEqual(first.actions.map(action => action.type), Array(7).fill('reuse'));
});

test('complete exact-project verification confirms all seven pinned task IDs without mutation', () => {
  const inventory = completeInventory();
  const result = onboarding.verifyRepositoryTaskInventory(
    inventory,
    { projectId: 'project-mirrorcam', repositoryPath: REPO },
  );
  assert.strictEqual(result.complete, true);
  assert.deepStrictEqual(Object.keys(result.taskBindings), [
    'product', 'user', 'business', 'design', 'tech', 'discovery', 'bugs',
  ]);
  assert.strictEqual(result.taskBindings.product.taskId, 'task-0');
});

test('CLI plan exposes deterministic native create rename pin actions without mutating tasks', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-plan-cli-'));
  try {
    const inventoryPath = path.join(root, 'inventory.json');
    const inventory = completeInventory({ projectId: 'project-cli', repositoryPath: root });
    inventory.tasks[0].title = 'Product';
    inventory.tasks[1].pinned = false;
    inventory.tasks.pop();
    fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory)}\n`);
    const result = spawnSync(process.execPath, [
      path.join(__dirname, 'fb-onboarding.cjs'),
      'plan',
      inventoryPath,
      '--repository-root',
      root,
      '--project-id',
      'project-cli',
    ], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0, result.stderr);
    const planned = JSON.parse(result.stdout);
    assert.deepStrictEqual(planned.actions.filter(action => action.type !== 'reuse').map(action => [
      action.type, action.workstream,
    ]), [
      ['rename', 'product'],
      ['pin', 'user'],
      ['create', 'bugs'],
      ['pin', 'bugs'],
    ]);
    assert.strictEqual(planned.nativeActionsRequired, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a partial pin failure remains unreconciled and cannot write a success receipt', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-pin-failure-'));
  const repository = { projectId: 'project-mirrorcam', repositoryPath: root };
  const inventory = completeInventory(repository);
  inventory.tasks[2].pinned = false;
  try {
    onboarding.ensureOnboardingReceipt(root);
    onboarding.recordPermission(root, 'granted');
    const inventoryPath = path.join(root, 'partial-inventory.json');
    fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory)}\n`);
    const result = spawnSync(process.execPath, [
      path.join(__dirname, 'fb-onboarding.cjs'),
      'reconcile',
      inventoryPath,
      '--repository-root',
      root,
      '--project-id',
      repository.projectId,
    ], { encoding: 'utf8' });
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /all seven|pinned/i);
    const receipt = onboarding.readOnboardingReceipt(root);
    assert.strictEqual(receipt.reconciledAt, undefined);
    assert.strictEqual(receipt.taskBindings, undefined);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('new task prompts remain idle and carry distinct workstream instructions', () => {
  const prompts = onboarding.WORKSTREAMS.map(item =>
    onboarding.renderIdleTaskPrompt(item, {
      repositoryName: 'MirrorCam',
      repositoryPath: REPO,
    }),
  );
  for (const prompt of prompts) {
    assert.match(prompt, /remain idle/i);
    assert.match(prompt, /do not investigate|do not edit/i);
    assert.match(prompt, /repository:\s*MirrorCam/i);
    assert.match(prompt, new RegExp(REPO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.strictEqual(new Set(prompts).size, 7);
  assert.match(prompts[0], /coordinate delivery/i);
  assert.match(prompts[0], /Product\/BFM control centre/i);
  assert.match(prompts[0], /reconcil(?:e|iation)/i);
  assert.match(prompts[0], /execut(?:e|ion)/i);
  assert.match(prompts[0], /verification|verify/i);
  assert.match(prompts[0], /remain idle[\s\S]*until[\s\S]*\$bfm/i);
  assert.doesNotMatch(prompts[0], /planning and evidence task|create a repository-local handoff/i);
  assert.match(prompts[1], /user outcome/i);
  assert.match(prompts[1], /planning and evidence workstream/i);
  assert.match(prompts[1], /create a repository-local handoff/i);
  assert.match(prompts[2], /commercial/i);
  assert.match(prompts[3], /experience/i);
  assert.match(prompts[4], /safely and reliably/i);
  assert.match(prompts[5], /need to learn/i);
  assert.match(prompts[6], /broken/i);
});

test('manual fallback is honest and paste-ready for only missing workstreams', () => {
  const missing = onboarding.planMissingWorkstreams([
    { title: 'Product', projectPath: REPO },
    { title: 'Business', projectPath: REPO },
    { title: 'Design', projectPath: REPO },
    { title: 'Tech', projectPath: REPO },
  ], REPO);
  const fallback = onboarding.renderManualFallback(missing, {
    repositoryName: 'MirrorCam',
    repositoryPath: REPO,
  });
  assert.match(fallback, /Codex task creation is not available/i);
  assert.match(fallback, /create.*Discovery/i);
  assert.match(fallback, /create.*Bugs/i);
  assert.doesNotMatch(fallback, /create.*Product\/User/i);
  assert.match(fallback, /paste/i);
});

test('BFM fails safely when Codex cannot prove a complete repository task inventory', () => {
  const skill = fs.readFileSync(path.join(__dirname, '..', 'skills', 'bfm', 'SKILL.md'), 'utf8');
  assert.match(skill, /needs-reconciliation/i);
  assert.match(skill, /canonical seven roles/i);
  assert.doesNotMatch(skill, /permission is granted and `reconciledAt` is absent/i);
  assert.match(skill, /verified project ID and canonical repository root/i);
  assert.match(skill, /project-coordination-setup/i);
  assert.match(skill, /proven-complete[\s\S]{0,80}inventory/i);
  assert.match(skill, /provide all seven prompts/i);
});

test('CLI emits canonical idle prompts and rejects unknown workstreams', () => {
  const tool = path.join(__dirname, 'fb-onboarding.cjs');
  const prompt = spawnSync(process.execPath, [tool, 'prompt', 'discovery', REPO], {
    encoding: 'utf8',
  });
  assert.strictEqual(prompt.status, 0, prompt.stderr);
  assert.match(prompt.stdout, /FB · Discovery/);
  assert.match(prompt.stdout, /remain idle/i);
  assert.match(prompt.stdout, /What do we still need to learn/i);

  const invalid = spawnSync(process.execPath, [tool, 'prompt', 'sales', REPO], {
    encoding: 'utf8',
  });
  assert.notStrictEqual(invalid.status, 0);
  assert.match(invalid.stderr, /unknown workstream/i);
});

test('$bfm remains canonical while slash-bfm is recognized as user intent', () => {
  assert.strictEqual(onboarding.isBfmIntent('$bfm'), true);
  assert.strictEqual(onboarding.isBfmIntent('/bfm'), true);
  assert.strictEqual(onboarding.isBfmIntent('Please run /BFM now'), true);
  assert.strictEqual(onboarding.isBfmIntent('document the letters bfm'), false);
});

test('fresh bootstrap prints the permission question once across reruns', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-bootstrap-'));
  try {
    fs.writeFileSync(path.join(root, '.gitignore'), '# project rules\n', 'utf8');
    const cli = path.join(__dirname, 'fb-lane.cjs');
    const first = spawnSync(process.execPath, [cli, 'bootstrap'], {
      cwd: root,
      encoding: 'utf8',
    });
    const second = spawnSync(process.execPath, [cli, 'bootstrap'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.strictEqual(first.status, 0, first.stderr);
    assert.strictEqual(second.status, 0, second.stderr);
    assert.match(first.stdout, /Meet FB[\s\S]*May I create seven repository-scoped sidebar tasks/i);
    assert.doesNotMatch(second.stdout, /May I create seven repository-scoped sidebar tasks/i);
    assert.match(fs.readFileSync(path.join(root, '.gitignore'), 'utf8'), /^\.fb\/onboarding\.json$/m);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('first-run guidance creates, pins, verifies, and only then reconciles workstream tasks', () => {
  const containingRoot = path.resolve(__dirname, '..');
  const packaged = path.basename(containingRoot) === 'fb-lane-coordination'
    && path.basename(path.dirname(containingRoot)) === 'plugins';
  const root = containingRoot;
  const bfm = fs.readFileSync(path.join(root, 'skills/bfm/SKILL.md'), 'utf8');
  const setup = fs.readFileSync(path.join(root, 'skills/project-coordination-setup/SKILL.md'), 'utf8');
  const start = fs.readFileSync(path.join(root, 'docs/fb/start.md'), 'utf8');
  const metadata = fs.readFileSync(path.join(root, packaged ? '.codex-plugin/plugin.json' : 'plugins/fb-lane-coordination/.codex-plugin/plugin.json'), 'utf8');
  assert.match(bfm, /project-coordination-setup/i);
  assert.match(bfm, /all seven exact tasks present and pinned/i);
  for (const [label, source] of [['setup', setup], ['start', start], ['metadata', metadata]]) {
    assert.match(source, /pin/i, `${label} must require pinned workstream tasks`);
    assert.match(source, /sidebar/i, `${label} must connect pinning to sidebar visibility`);
  }
  assert.match(setup, /set_thread_pinned/);
  assert.match(setup, /all seven roles[\s\S]*exact[\s\S]*pinned/i);
  assert.match(setup, /pin the named task[\s\S]*create only if absent/i);
  assert.ok(setup.indexOf('all seven roles') < setup.indexOf('fb-onboarding.cjs reconcile'));
});
