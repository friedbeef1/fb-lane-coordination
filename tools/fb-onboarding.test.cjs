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
const ROLE_LABELS = [
  ['product', 'Product/BFM'],
  ['user', 'User'],
  ['business', 'Business'],
  ['design', 'Design'],
  ['tech', 'Tech'],
  ['discovery', 'Discovery'],
  ['bugs', 'Bugs'],
];

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

test('repository taskTitlePrefix renames all seven stable bindings without creating duplicates', t => {
  const repositoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-prefix-plan-'));
  t.after(() => fs.rmSync(repositoryPath, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(repositoryPath, '.fb-lane.json'),
    `${JSON.stringify({ taskTitlePrefix: 'MÉJA' }, null, 2)}\n`,
  );
  const repository = { projectId: 'project-meja', repositoryPath };
  const inventory = completeInventory(repository);
  const plan = onboarding.planRepositoryTaskInventory(inventory, repository);

  assert.strictEqual(plan.complete, true);
  assert.strictEqual(plan.actions.filter(action => action.type === 'create').length, 0);
  assert.strictEqual(plan.actions.filter(action => action.type === 'pin').length, 0);
  assert.deepStrictEqual(
    plan.actions.map(action => [action.type, action.workstream, action.taskId || null]),
    ROLE_LABELS.flatMap(([key], index) => [
      ['reuse', key, `task-${index}`],
      ['rename', key, `task-${index}`],
    ]),
  );
  assert.deepStrictEqual(
    plan.actions.filter(action => action.type === 'rename').map(action => [
      action.workstream,
      action.taskId,
      action.title,
    ]),
    ROLE_LABELS.map(([key, label], index) => [key, `task-${index}`, `MÉJA · ${label}`]),
  );
});

test('a generic receipt migrates its unchanged bound IDs to a configured prefix', t => {
  const repositoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-prefix-receipt-migration-'));
  t.after(() => fs.rmSync(repositoryPath, { recursive: true, force: true }));
  const repository = { projectId: 'project-receipt-migration', repositoryPath };
  const genericInventory = completeInventory(repository);

  onboarding.ensureOnboardingReceipt(repositoryPath);
  onboarding.recordPermission(repositoryPath, 'granted');
  onboarding.recordVerifiedReconciliation(
    repositoryPath,
    onboarding.verifyRepositoryTaskInventory(genericInventory, repository, {
      requireAttemptedActions: true,
    }),
    repository,
  );
  fs.writeFileSync(path.join(repositoryPath, '.fb-lane.json'), `${JSON.stringify({ taskTitlePrefix: 'MÉJA' })}\n`);

  const plan = onboarding.planRepositoryTaskInventory(genericInventory, repository);
  assert.strictEqual(plan.complete, true);
  assert.strictEqual(plan.actions.filter(action => action.type === 'create').length, 0);
  assert.deepStrictEqual(
    plan.actions.filter(action => action.type === 'rename').map(action => action.taskId),
    ROLE_LABELS.map(([,], index) => `task-${index}`),
  );
});

test('receipt-bound IDs relabeled outside every current role require identity repair', t => {
  const repositoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-receipt-identity-'));
  t.after(() => fs.rmSync(repositoryPath, { recursive: true, force: true }));
  const repository = { projectId: 'project-receipt-identity', repositoryPath };
  const genericInventory = completeInventory(repository);

  onboarding.ensureOnboardingReceipt(repositoryPath);
  onboarding.recordPermission(repositoryPath, 'granted');
  onboarding.recordVerifiedReconciliation(
    repositoryPath,
    onboarding.verifyRepositoryTaskInventory(genericInventory, repository, {
      requireAttemptedActions: true,
    }),
    repository,
  );

  const relabeledBoundInventory = {
    ...genericInventory,
    tasks: genericInventory.tasks.map(task => ({
      ...task,
      title: `OLD · ${task.title.replace(/^FB · /, '')}`,
    })),
  };
  const competingGenericSuite = {
    ...relabeledBoundInventory,
    tasks: [
      ...relabeledBoundInventory.tasks,
      ...genericInventory.tasks.map((task, index) => ({ ...task, id: `generic-${index}` })),
    ],
  };

  for (const inventory of [relabeledBoundInventory, competingGenericSuite]) {
    const plan = onboarding.planRepositoryTaskInventory(inventory, repository);
    assert.strictEqual(plan.complete, false);
    assert.deepStrictEqual(plan.actions, []);
    assert.match(
      plan.failures.map(failure => failure.message).join(' '),
      /identity repair.*task-0|task-0.*identity repair/i,
    );
  }
});

test('prefixed post-mutation inventory verifies exact titles and writes the strict receipt', t => {
  const repositoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-prefix-receipt-'));
  t.after(() => fs.rmSync(repositoryPath, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(repositoryPath, '.fb-lane.json'),
    `${JSON.stringify({ taskTitlePrefix: 'MÉJA' }, null, 2)}\n`,
  );
  const repository = { projectId: 'project-meja', repositoryPath };
  const attemptedActions = ROLE_LABELS.map(([key], index) => ({
    sequence: index + 1,
    action: 'rename',
    workstream: key,
    outcome: 'succeeded',
    taskId: `task-${index}`,
  }));
  const inventory = {
    complete: true,
    attemptedActions,
    tasks: ROLE_LABELS.map(([key, label], index) => ({
      id: `task-${index}`,
      title: `MÉJA · ${label}`,
      projectId: repository.projectId,
      projectPath: repositoryPath,
      pinned: true,
    })),
  };

  const plan = onboarding.planRepositoryTaskInventory(inventory, repository);
  assert.deepStrictEqual(plan.actions.map(action => [action.type, action.workstream]),
    ROLE_LABELS.map(([key]) => ['reuse', key]));
  const verification = onboarding.verifyRepositoryTaskInventory(inventory, repository, {
    requireAttemptedActions: true,
  });
  assert.strictEqual(verification.complete, true);
  assert.deepStrictEqual(
    Object.values(verification.taskBindings),
    ROLE_LABELS.map(([, label], index) => ({
      taskId: `task-${index}`,
      title: `MÉJA · ${label}`,
      pinned: true,
    })),
  );

  onboarding.ensureOnboardingReceipt(repositoryPath);
  onboarding.recordPermission(repositoryPath, 'granted');
  const receipt = onboarding.recordVerifiedReconciliation(
    repositoryPath,
    verification,
    repository,
    { now: new Date('2026-08-10T04:00:00Z') },
  );
  assert.deepStrictEqual(receipt.taskBindings, verification.taskBindings);
  assert.deepStrictEqual(receipt.attemptedActions, attemptedActions);
  assert.strictEqual(
    receipt.attemptedActionsHash,
    require('node:crypto').createHash('sha256').update(JSON.stringify(attemptedActions)).digest('hex'),
  );
  assert.strictEqual(onboarding.needsTaskInventoryReconciliation(receipt, repositoryPath), false);
});

test('missing taskTitlePrefix keeps the current FB title contract', t => {
  const repositoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-prefix-default-'));
  t.after(() => fs.rmSync(repositoryPath, { recursive: true, force: true }));
  const repository = { projectId: 'project-default', repositoryPath };
  const inventory = completeInventory(repository);

  fs.writeFileSync(path.join(repositoryPath, '.fb-lane.json'), '{}\n');

  assert.deepStrictEqual(
    onboarding.workstreamsForRepository(repository).map(workstream => workstream.title),
    onboarding.WORKSTREAMS.map(workstream => workstream.title),
  );
  assert.deepStrictEqual(
    onboarding.planRepositoryTaskInventory(inventory, repository).actions.map(action => action.type),
    Array(7).fill('reuse'),
  );
});

test('invalid taskTitlePrefix configuration fails closed', t => {
  const invalidValues = [
    ['empty', '   '],
    ['overlong', 'x'.repeat(65)],
    ['canonical separator', 'MÉJA · Legacy'],
    ['control character', 'MÉJA\n'],
    ['non-string', 123],
    ['null', null],
    ['boolean', true],
    ['object', { name: 'MÉJA' }],
    ['array', ['MÉJA']],
  ];
  for (const [label, taskTitlePrefix] of invalidValues) {
    const repositoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-prefix-invalid-'));
    t.after(() => fs.rmSync(repositoryPath, { recursive: true, force: true }));
    fs.writeFileSync(path.join(repositoryPath, '.fb-lane.json'), `${JSON.stringify({ taskTitlePrefix })}\n`);
    assert.throws(
      () => onboarding.workstreamsForRepository({ repositoryPath }),
      /taskTitlePrefix/i,
      label,
    );
  }

  const malformedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-prefix-malformed-'));
  t.after(() => fs.rmSync(malformedRoot, { recursive: true, force: true }));
  fs.writeFileSync(path.join(malformedRoot, '.fb-lane.json'), '{ invalid json\n');
  assert.throws(
    () => onboarding.workstreamsForRepository({ repositoryPath: malformedRoot }),
    /parse.*\.fb-lane\.json|\.fb-lane\.json.*parse/i,
  );

  const unreadableRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-prefix-unreadable-'));
  t.after(() => fs.rmSync(unreadableRoot, { recursive: true, force: true }));
  fs.mkdirSync(path.join(unreadableRoot, '.fb-lane.json'));
  assert.throws(
    () => onboarding.workstreamsForRepository({ repositoryPath: unreadableRoot }),
    /\.fb-lane\.json/i,
  );
});

test('configured titles remain isolated by project and same-project aliases remain duplicate failures', t => {
  const mejaRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-prefix-meja-'));
  const toughTalksRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-prefix-tt-'));
  t.after(() => fs.rmSync(mejaRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(toughTalksRoot, { recursive: true, force: true }));
  fs.writeFileSync(path.join(mejaRoot, '.fb-lane.json'), `${JSON.stringify({ taskTitlePrefix: 'MÉJA' })}\n`);
  fs.writeFileSync(path.join(toughTalksRoot, '.fb-lane.json'), `${JSON.stringify({ taskTitlePrefix: 'TT' })}\n`);
  const mejaRepository = { projectId: 'project-meja', repositoryPath: mejaRoot };
  const otherTasks = ROLE_LABELS.map(([key, label]) => ({
    id: `tt-${key}`,
    title: `TT · ${label}`,
    projectId: 'project-tt',
    projectPath: toughTalksRoot,
    pinned: true,
  }));
  const mejaInventory = completeInventory(mejaRepository);
  mejaInventory.tasks.push(...otherTasks);
  const isolated = onboarding.planRepositoryTaskInventory(mejaInventory, mejaRepository);
  assert.strictEqual(isolated.complete, true);
  assert.ok(isolated.actions.every(action => !String(action.taskId || '').startsWith('tt-')));

  const duplicateInventory = completeInventory(mejaRepository);
  duplicateInventory.tasks.push({
    id: 'meja-user-prefixed',
    title: 'MÉJA · User',
    projectId: mejaRepository.projectId,
    projectPath: mejaRoot,
    pinned: true,
  });
  const duplicate = onboarding.planRepositoryTaskInventory(duplicateInventory, mejaRepository);
  assert.strictEqual(duplicate.complete, false);
  assert.deepStrictEqual(duplicate.actions, []);
  assert.match(duplicate.failures.map(failure => failure.message).join(' '), /Ambiguous User.*meja-user-prefixed.*task-1|Ambiguous User.*task-1.*meja-user-prefixed/i);
});

test('a later prefix change never turns prior reconciled bindings into creates', t => {
  const repositoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-prefix-drift-'));
  t.after(() => fs.rmSync(repositoryPath, { recursive: true, force: true }));
  const repository = { projectId: 'project-prefix-drift', repositoryPath };
  fs.writeFileSync(path.join(repositoryPath, '.fb-lane.json'), `${JSON.stringify({ taskTitlePrefix: 'MÉJA' })}\n`);
  const attemptedActions = [];
  const oldInventory = {
    complete: true,
    attemptedActions,
    tasks: ROLE_LABELS.map(([key, label], index) => ({
      id: `task-${index}`,
      title: `MÉJA · ${label}`,
      projectId: repository.projectId,
      projectPath: repositoryPath,
      pinned: true,
    })),
  };
  onboarding.ensureOnboardingReceipt(repositoryPath);
  onboarding.recordPermission(repositoryPath, 'granted');
  const oldVerification = onboarding.verifyRepositoryTaskInventory(oldInventory, repository, {
    requireAttemptedActions: true,
  });
  const oldReceipt = onboarding.recordVerifiedReconciliation(
    repositoryPath,
    oldVerification,
    repository,
  );
  assert.strictEqual(onboarding.needsTaskInventoryReconciliation(oldReceipt, repositoryPath), false);

  fs.writeFileSync(path.join(repositoryPath, '.fb-lane.json'), `${JSON.stringify({ taskTitlePrefix: 'MJ' })}\n`);
  assert.strictEqual(onboarding.needsTaskInventoryReconciliation(oldReceipt, repositoryPath), true);
  const driftPlan = onboarding.planRepositoryTaskInventory(oldInventory, repository);
  assert.strictEqual(driftPlan.complete, false);
  assert.deepStrictEqual(driftPlan.actions, []);
  assert.match(driftPlan.failures.map(failure => failure.message).join(' '), /prefix|receipt|previously reconciled/i);
});

test('configured exact-title proof repairs normalized punctuation and case variants', t => {
  const repositoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-prefix-exact-'));
  t.after(() => fs.rmSync(repositoryPath, { recursive: true, force: true }));
  fs.writeFileSync(path.join(repositoryPath, '.fb-lane.json'), `${JSON.stringify({ taskTitlePrefix: 'MÉJA' })}\n`);
  const repository = { projectId: 'project-exact-title', repositoryPath };
  const variants = ['MÉJA-Product/BFM', 'méja · user', 'MÉJA / Business', 'MÉJA  ·  Design'];
  const inventory = {
    complete: true,
    tasks: ROLE_LABELS.map(([key, label], index) => ({
      id: `task-${index}`,
      title: variants[index] || `MÉJA · ${label}`,
      projectId: repository.projectId,
      projectPath: repositoryPath,
      pinned: true,
    })),
  };
  const plan = onboarding.planRepositoryTaskInventory(inventory, repository);
  assert.strictEqual(plan.complete, true);
  assert.deepStrictEqual(
    plan.actions.filter(action => action.type === 'rename').map(action => [action.workstream, action.title]),
    ROLE_LABELS.slice(0, variants.length).map(([key, label]) => [key, `MÉJA · ${label}`]),
  );
  assert.strictEqual(onboarding.verifyRepositoryTaskInventory(inventory, repository).complete, false);
});

test('configured idle prompts and fallback use repository-expected visible titles', t => {
  const repositoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-prefix-prompts-'));
  t.after(() => fs.rmSync(repositoryPath, { recursive: true, force: true }));
  fs.writeFileSync(path.join(repositoryPath, '.fb-lane.json'), `${JSON.stringify({ taskTitlePrefix: 'MÉJA' })}\n`);
  const prompt = onboarding.renderIdleTaskPrompt(onboarding.WORKSTREAMS[1], {
    repositoryName: 'MÉJA',
    repositoryPath,
  });
  assert.match(prompt, /You are the MÉJA · User workstream/);
  const fallback = onboarding.renderManualFallback(undefined, {
    repositoryName: 'MÉJA',
    repositoryPath,
  });
  for (const [, label] of ROLE_LABELS) assert.match(fallback, new RegExp(`MÉJA · ${label.replace('/', '\\/')}`));

  const cli = spawnSync(process.execPath, [
    path.join(__dirname, 'fb-onboarding.cjs'),
    'prompt',
    'discovery',
    repositoryPath,
  ], { encoding: 'utf8' });
  assert.strictEqual(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /MÉJA · Discovery/);
});

test('needs-reconciliation detects stale binding titles and malformed prefix configuration', t => {
  const repositoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-prefix-needs-'));
  t.after(() => fs.rmSync(repositoryPath, { recursive: true, force: true }));
  fs.writeFileSync(path.join(repositoryPath, '.fb-lane.json'), `${JSON.stringify({ taskTitlePrefix: 'MÉJA' })}\n`);
  const receipt = {
    schemaVersion: 1,
    repositoryPath,
    projectId: 'project-needs',
    permission: 'granted',
    workstreams: ROLE_LABELS.map(([key]) => key),
    taskBindings: Object.fromEntries(ROLE_LABELS.map(([key, label], index) => [key, {
      taskId: `task-${index}`,
      title: `FB · ${label}`,
      pinned: true,
    }])),
    attemptedActions: [],
    reconciledAt: '2026-08-09T00:00:00.000Z',
  };
  assert.strictEqual(onboarding.needsTaskInventoryReconciliation(receipt, repositoryPath), true);

  fs.writeFileSync(path.join(repositoryPath, '.fb-lane.json'), '{ malformed\n');
  const cli = spawnSync(process.execPath, [
    path.join(__dirname, 'fb-onboarding.cjs'),
    'needs-reconciliation',
    repositoryPath,
  ], { encoding: 'utf8' });
  assert.notStrictEqual(cli.status, 0);
  assert.match(cli.stderr, /\.fb-lane\.json/i);
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
    assert.match(first.stdout, /May I reuse and pin matching repository-scoped sidebar tasks, rename legacy matches where needed, and create only the missing roles/i);
    assert.match(first.stdout, /Product\/BFM, User, Business, Design, Tech, Discovery, and Bugs/i);
    assert.doesNotMatch(first.stdout, /May I create seven repository-scoped sidebar tasks/i);
    assert.doesNotMatch(second.stdout, /May I reuse and pin matching repository-scoped sidebar tasks/i);
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
