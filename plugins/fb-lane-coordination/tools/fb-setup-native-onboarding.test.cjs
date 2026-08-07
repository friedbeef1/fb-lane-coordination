#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const packaged = path.basename(root) === 'fb-lane-coordination'
  && path.basename(path.dirname(root)) === 'plugins';
const skill = fs.readFileSync(
  path.join(root, 'skills/project-coordination-setup/SKILL.md'),
  'utf8',
);
const onboarding = require('./fb-onboarding.cjs');
if (!packaged) {
  const packageManifest = JSON.parse(fs.readFileSync(
    path.join(root, 'tools/fb-package-manifest.json'),
    'utf8',
  ));
  assert.ok(
    packageManifest.includes('tools/fb-setup-native-onboarding.test.cjs'),
    'the focused contract must be declared for Task 6 package generation',
  );
}

const roles = ['Product/BFM', 'User', 'Business', 'Design', 'Tech', 'Discovery', 'Bugs'];
for (const role of roles) {
  assert.match(skill, new RegExp(`\\b${role.replace('/', '\\/')}\\b`), `setup must cover ${role}`);
}

const projectDiscovery = skill.indexOf('list_projects');
const taskDiscovery = skill.indexOf('list_threads');
const plan = skill.indexOf('fb-onboarding.cjs plan');
const create = skill.indexOf('create_thread');
const rename = skill.indexOf('set_thread_title');
const pin = skill.indexOf('set_thread_pinned');
const relist = skill.indexOf('Re-list');
const reconcile = skill.indexOf('fb-onboarding.cjs reconcile');

for (const [label, index] of [
  ['project discovery', projectDiscovery],
  ['task discovery', taskDiscovery],
  ['strict plan', plan],
  ['native create', create],
  ['native rename', rename],
  ['native pin', pin],
  ['complete re-list', relist],
  ['strict reconcile', reconcile],
]) {
  assert.notStrictEqual(index, -1, `setup must define ${label}`);
}
assert.ok(
  projectDiscovery < taskDiscovery
    && taskDiscovery < plan
    && plan < create
    && plan < rename
    && plan < pin
    && create < relist
    && rename < relist
    && pin < relist
    && relist < reconcile,
  'setup must run exact-project discovery -> strict plan -> native actions -> re-list -> strict reconcile',
);

assert.match(skill, /exact project ID[\s\S]{0,180}canonical repository path/i);
assert.match(skill, /prove exact-project[\s\S]{0,80}(?:identity and )?completeness/i);
assert.match(skill, /execute only[\s\S]{0,120}(?:actions|action objects)[\s\S]{0,120}(?:returned|emitted)[\s\S]{0,120}(?:plan|planner)/i);
assert.match(skill, /reuse[\s\S]{0,160}(?:no native action|do not mutate|never mutate)/i);

assert.match(skill, /attempt(?:ed)? action ledger/i);
assert.match(skill, /Before each[\s\S]{0,100}native tool call[\s\S]{0,160}privacy-safe ledger row/i);
assert.match(skill, /update `outcome`[\s\S]{0,100}`succeeded`[\s\S]{0,100}`failed`[\s\S]{0,100}`unknown`/i);
assert.match(skill, /created task[\s\S]{0,220}set_thread_title[\s\S]{0,160}(?:plan|action)[\s\S]{0,80}title/i);
assert.match(skill, /partial[\s-]failure[\s\S]{0,180}(?:unreconciled|do not reconcile|must not reconcile)/i);
assert.match(skill, /stop[\s\S]{0,180}role-specific[\s\S]{0,180}manual fallback/i);
assert.match(skill, /newly created[\s\S]{0,180}(?:never|do not)[\s\S]{0,80}(?:create|recreate)[\s\S]{0,80}duplicate/i);
assert.match(skill, /rerun[\s\S]{0,180}(?:complete inventory|plan)[\s\S]{0,180}create only[\s\S]{0,120}(?:still missing|missing)/i);
assert.match(skill, /all seven[\s\S]{0,320}exact\s+titles?[\s\S]{0,180}pinned/i);

assert.strictEqual(
  onboarding.reconcileRepositoryTaskInventory,
  undefined,
  'Node onboarding must expose planning/verification, not a fake native-action executor',
);
assert.strictEqual(typeof onboarding.planRepositoryTaskInventory, 'function');
assert.strictEqual(typeof onboarding.verifyRepositoryTaskInventory, 'function');

assert.match(skill, /Node CLI[\s\S]{0,180}(?:does not|cannot)[\s\S]{0,180}(?:sidebar|Codex-native|native task)/i);
assert.match(skill, /Pinning never[\s\S]{0,180}\$bfm/i);
assert.match(skill, /Only \*\*Push Live\*\*[\s\S]{0,120}(?:merge|deploy|release)/i);

const listThreadsCall = skill.match(/list_threads\((\{[^\n]+\})\)/);
assert.ok(listThreadsCall, 'setup must show the supported list_threads argument object');
assert.deepStrictEqual(
  JSON.parse(listThreadsCall[1]),
  { limit: 50 },
  'setup must call list_threads with only its supported maximum limit and no projectId',
);
assert.doesNotMatch(skill, /list_threads\(\{[^)]*(?:"limit":100|projectId)/);

const repository = {
  projectId: 'project-mirrorcam',
  repositoryPath: '/work/projects/mirrorcam',
};
const emptyInventory = { complete: true, tasks: [] };
for (const incompleteIdentity of [
  { projectId: repository.projectId },
  { repositoryPath: repository.repositoryPath },
]) {
  const planned = onboarding.planRepositoryTaskInventory(emptyInventory, incompleteIdentity);
  assert.strictEqual(planned.complete, false);
  assert.deepStrictEqual(planned.actions, []);
  assert.match(planned.failures[0].message, /project ID.*canonical repository path/i);
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-native-onboarding-'));
try {
  const inventoryPath = path.join(tempRoot, 'inventory.json');
  fs.writeFileSync(inventoryPath, `${JSON.stringify(emptyInventory)}\n`);
  const cli = path.join(root, 'tools/fb-onboarding.cjs');
  for (const [command, args] of [
    ['plan without project ID', ['plan', inventoryPath, '--repository-root', tempRoot]],
    ['plan without repository root', ['plan', inventoryPath, '--project-id', repository.projectId]],
    ['reconcile without project ID', ['reconcile', inventoryPath, '--repository-root', tempRoot]],
    ['reconcile without repository root', ['reconcile', inventoryPath, '--project-id', repository.projectId]],
  ]) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
    assert.notStrictEqual(result.status, 0, command);
    assert.match(result.stderr, /--repository-root.*--project-id|--project-id.*--repository-root/i, command);
  }
  const blankProjectId = spawnSync(process.execPath, [
    cli,
    'plan',
    inventoryPath,
    '--repository-root',
    tempRoot,
    '--project-id',
    '   ',
  ], { encoding: 'utf8' });
  assert.notStrictEqual(blankProjectId.status, 0);
  assert.match(blankProjectId.stderr, /nonempty|verified.*project/i);

  onboarding.ensureOnboardingReceipt(tempRoot);
  onboarding.recordPermission(tempRoot, 'granted');
  const completeInventory = {
    complete: true,
    attemptedActions: [
      { sequence: 1, action: 'create', workstream: 'product', outcome: 'succeeded', taskId: 'task-product' },
      { sequence: 2, action: 'pin', workstream: 'product', outcome: 'failed', taskId: 'task-product' },
      { sequence: 3, action: 'pin', workstream: 'product', outcome: 'succeeded', taskId: 'task-product' },
    ],
    tasks: onboarding.WORKSTREAMS.map((workstream, index) => ({
      id: index === 0 ? 'task-product' : `task-${index}`,
      title: workstream.title,
      projectId: repository.projectId,
      projectPath: tempRoot,
      pinned: true,
    })),
  };
  const exactRepository = { ...repository, repositoryPath: tempRoot };
  const verified = onboarding.verifyRepositoryTaskInventory(completeInventory, exactRepository);
  assert.deepStrictEqual(verified.attemptedActions, completeInventory.attemptedActions);
  for (const incompleteIdentity of [
    { projectId: repository.projectId },
    { repositoryPath: tempRoot },
  ]) {
    assert.throws(
      () => onboarding.recordVerifiedReconciliation(
        tempRoot,
        verified,
        incompleteIdentity,
      ),
      /project ID.*canonical repository path/i,
    );
  }

  assert.throws(
    () => onboarding.recordReconciliation(tempRoot, { ...completeInventory, attemptedActions: undefined }, {
      repository: exactRepository,
    }),
    /attemptedActions/i,
  );
  assert.throws(
    () => onboarding.recordReconciliation(tempRoot, {
      ...completeInventory,
      attemptedActions: [{
        ...completeInventory.attemptedActions[0],
        message: 'private provider response',
      }],
    }, { repository: exactRepository }),
    /privacy-safe|unsupported.*field/i,
  );

  const receipt = onboarding.recordReconciliation(tempRoot, completeInventory, {
    repository: exactRepository,
    now: new Date('2026-08-07T12:00:00Z'),
  });
  assert.deepStrictEqual(receipt.attemptedActions, completeInventory.attemptedActions);
  assert.strictEqual(
    receipt.attemptedActionsHash,
    crypto.createHash('sha256')
      .update(JSON.stringify(completeInventory.attemptedActions))
      .digest('hex'),
  );
  assert.deepStrictEqual(
    onboarding.readOnboardingReceipt(tempRoot).attemptedActions,
    completeInventory.attemptedActions,
  );
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('FB setup native onboarding contract passed.');
