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
const shortcut = fs.readFileSync(
  path.join(root, 'skills/fb-setup/SKILL.md'),
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
assert.match(skill, /safe to run again[\s\S]{0,180}(?:complete inventory|plan)[\s\S]{0,180}create only[\s\S]{0,120}(?:still missing|missing)/i);
assert.match(skill, /all seven[\s\S]{0,320}exact\s+titles?[\s\S]{0,180}pinned/i);
assert.match(shortcut, /duplicate-looking[\s\S]{0,240}(?:prefix|rename|archive|repair)/i);
assert.match(shortcut, /exact-project reconciliation[\s\S]{0,180}before any (?:sidebar|task) mutation/i);
assert.match(shortcut, /(?:installed|upgraded|replaced)[\s\S]{0,180}(?:new|fresh) Codex task[\s\S]{0,180}before[\s\S]{0,120}plugin-dependent/i);

const repairStart = skill.indexOf('### Sidebar identity repair');
const nativeStart = skill.indexOf('### Native exact-project reconciliation');
assert.notStrictEqual(repairStart, -1, 'setup must define sidebar identity repair');
assert.ok(repairStart < nativeStart, 'sidebar identity repair must route into native exact-project reconciliation');
const repair = skill.slice(repairStart, nativeStart);
for (const term of ['duplicate-looking', 'prefix', 'rename', 'archive', 'repair']) {
  assert.match(repair, new RegExp(term, 'i'), `repair route must cover ${term}`);
}
assert.match(repair, /\.fb-lane\.json[\s\S]{0,100}`taskTitlePrefix`/);
assert.match(repair, /visible titles?[\s\S]{0,180}(?:presentation|not[\s\S]{0,60}identity)/i);
assert.match(repair, /exact-project reconciliation[\s\S]{0,180}before any (?:sidebar|task) mutation/i);
assert.match(repair, /archive[\s\S]{0,260}(?:not|never)[\s\S]{0,140}(?:plan|attemptedActions)[\s\S]{0,260}(?:exact task ID|explicit approval|explicit authority)/i);
assert.match(repair, /receiptRebindings[\s\S]{0,260}fromTaskId[\s\S]{0,180}toTaskId[\s\S]{0,180}approvalRef/);
assert.match(repair, /every other task binding[\s\S]{0,100}remain exact/i);
assert.match(repair, /(?:installed|upgraded|replaced)[\s\S]{0,180}(?:new|fresh) Codex task[\s\S]{0,180}before[\s\S]{0,120}plugin-dependent/i);

const postMutationEnd = skill.indexOf('Product/User is a legacy');
const postMutationProof = skill.slice(relist, postMutationEnd);
assert.match(postMutationProof, /do not reuse the pre-mutation evidence/i);
assert.match(postMutationProof, /all seven repository-expected visible titles/i);
assert.match(postMutationProof, /(?:same|unchanged)[\s\S]{0,100}(?:task IDs|IDs)/i);
assert.match(postMutationProof, /pinned state/i);
assert.match(postMutationProof, /receipt/i);

if (!packaged) {
  const setupDocs = fs.readFileSync(path.join(root, 'docs/setup.md'), 'utf8');
  assert.match(setupDocs, /taskTitlePrefix/);
  assert.match(setupDocs, /default(?:s)? to `FB`/i);
  assert.match(setupDocs, /visible titles?[\s\S]{0,180}(?:not|never)[\s\S]{0,100}(?:project identity|identity authority)/i);
  assert.match(setupDocs, /duplicate-looking[\s\S]{0,220}\$fb-setup/i);
  assert.match(setupDocs, /(?:new|fresh) Codex task[\s\S]{0,220}before[\s\S]{0,140}plugin-dependent/i);
}

assert.strictEqual(
  onboarding.reconcileRepositoryTaskInventory,
  undefined,
  'Node onboarding must expose planning/verification, not a fake native-action executor',
);
assert.strictEqual(typeof onboarding.planRepositoryTaskInventory, 'function');
assert.strictEqual(typeof onboarding.verifyRepositoryTaskInventory, 'function');
assert.strictEqual(typeof onboarding.classifyLocalTaskRows, 'function');
assert.strictEqual(typeof onboarding.buildCompleteLocalInventory, 'function');

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

assert.match(skill, /local-candidates/i);
assert.match(skill, /read_thread/i);
assert.match(skill, /inventory-local/i);
assert.match(skill, /read-only/i);
assert.match(skill, /(?:guardian|helper|subagent)[\s\S]{0,180}(?:exclude|excluded)/i);
assert.match(skill, /state_5\.sqlite[\s\S]{0,260}(?:not sufficient|not authority|never.*alone)/i);

const repository = {
  projectId: 'project-mirrorcam',
  repositoryPath: '/work/projects/mirrorcam',
};

const cappedNativeEvidence = {
  projects: [{
    projectId: repository.projectId,
    path: repository.repositoryPath,
    hostId: 'local',
    projectKind: 'local',
  }],
  threadList: {
    schemaVersion: 4,
    pinnedThreads: [{
      id: 'task-product',
      projectId: repository.projectId,
      hostId: 'local',
      cwd: repository.repositoryPath,
      title: 'FB · Product/BFM',
      pinnedIndex: 1,
    }],
    threads: Array.from({ length: 50 }, (_, index) => ({
      id: `global-${index}`,
      projectId: 'project-other',
      hostId: 'local',
      cwd: '/work/projects/other',
      title: `Global ${index}`,
    })),
    unavailableHosts: [],
    unavailableSources: [],
  },
  threadDetails: onboarding.WORKSTREAMS.map((workstream, index) => ({
    thread: {
      id: `task-${workstream.key}`,
      kind: 'codex',
      hostId: 'local',
      cwd: repository.repositoryPath,
      title: workstream.title,
    },
  })),
};
cappedNativeEvidence.threadDetails[0].thread.id = 'task-product';

const localRows = onboarding.WORKSTREAMS.map((workstream, index) => ({
  id: index === 0 ? 'task-product' : `task-${workstream.key}`,
  cwd: repository.repositoryPath,
  archived: 0,
  source: 'vscode',
}));
localRows.push({
  id: 'guardian-helper',
  cwd: repository.repositoryPath,
  archived: 0,
  source: '{"subagent":{"other":"guardian"}}',
});
localRows.push({
  id: 'spawned-worker',
  cwd: repository.repositoryPath,
  archived: 0,
  source: '{"subagent":{"thread_spawn":{"parent_thread_id":"task-product"}}}',
});

const classified = onboarding.classifyLocalTaskRows(localRows, repository);
assert.strictEqual(classified.complete, true);
assert.deepStrictEqual(
  classified.candidateIds,
  onboarding.WORKSTREAMS.map(workstream => `task-${workstream.key}`).sort(),
  'local enumeration must include every user-visible task and exclude helper/subagent rows',
);
const cappedInventory = onboarding.buildCompleteLocalInventory(
  cappedNativeEvidence,
  repository,
  { ...classified, candidateIds: localRows.filter(row => row.source === 'vscode').map(row => row.id).sort() },
);
assert.strictEqual(cappedInventory.complete, true);
assert.strictEqual(cappedInventory.tasks.length, 7);
assert.strictEqual(cappedInventory.tasks.find(task => task.id === 'task-product').pinned, true);
assert.ok(cappedInventory.tasks.filter(task => task.id !== 'task-product').every(task => task.pinned === false));
assert.ok(cappedInventory.tasks.every(task => task.projectId === repository.projectId));

const dbAlone = onboarding.buildCompleteLocalInventory({}, repository, classified);
assert.strictEqual(dbAlone.complete, false);
assert.match(dbAlone.failures.map(item => item.message).join(' '), /project|native|pinned/i);

const privateEvidence = structuredClone(cappedNativeEvidence);
privateEvidence.threadDetails[0].turns = [{ message: 'must not be retained' }];
const rejectedPrivateEvidence = onboarding.buildCompleteLocalInventory(
  privateEvidence,
  repository,
  classified,
);
assert.strictEqual(rejectedPrivateEvidence.complete, false);
assert.match(rejectedPrivateEvidence.failures[0].operation, /privacy/i);
assert.match(rejectedPrivateEvidence.failures[0].message, /identity metadata only|forbidden/i);

const missingDetailEvidence = structuredClone(cappedNativeEvidence);
missingDetailEvidence.threadDetails.pop();
const missingDetail = onboarding.buildCompleteLocalInventory(
  missingDetailEvidence,
  repository,
  { ...classified, candidateIds: localRows.filter(row => row.source === 'vscode').map(row => row.id).sort() },
);
assert.strictEqual(missingDetail.complete, false);
assert.match(missingDetail.failures.map(item => item.message).join(' '), /detail|candidate/i);

const wrongRootEvidence = structuredClone(cappedNativeEvidence);
wrongRootEvidence.threadDetails[1].thread.cwd = '/work/projects/other';
const wrongRoot = onboarding.buildCompleteLocalInventory(
  wrongRootEvidence,
  repository,
  { ...classified, candidateIds: localRows.filter(row => row.source === 'vscode').map(row => row.id).sort() },
);
assert.strictEqual(wrongRoot.complete, false);
assert.match(wrongRoot.failures.map(item => item.message).join(' '), /root|repository/i);

const unknownLocalSource = onboarding.classifyLocalTaskRows([
  ...localRows,
  { id: 'unknown-source', cwd: repository.repositoryPath, archived: 0, source: 'future-ui' },
], repository);
assert.strictEqual(unknownLocalSource.complete, false);
assert.deepStrictEqual(unknownLocalSource.candidateIds, []);
assert.match(unknownLocalSource.failures[0].message, /unsupported.*source/i);
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
  const canonicalTempRoot = fs.realpathSync.native(tempRoot);
  const stateDb = path.join(tempRoot, 'state_5.sqlite');
  fs.writeFileSync(stateDb, 'fixture');
  let sqliteInvocation;
  const localCandidates = onboarding.readLocalTaskCandidates({
    projectId: repository.projectId,
    repositoryPath: canonicalTempRoot,
  }, {
    stateDb,
    execFileSync(command, args, options) {
      sqliteInvocation = { command, args, options };
      return JSON.stringify(localRows.map(row => ({ ...row, cwd: canonicalTempRoot })));
    },
  });
  assert.strictEqual(localCandidates.complete, true);
  assert.deepStrictEqual(localCandidates.candidateIds, classified.candidateIds);
  assert.strictEqual(sqliteInvocation.command, 'sqlite3');
  assert.deepStrictEqual(sqliteInvocation.args.slice(0, 3), ['-readonly', '-json', stateDb]);
  assert.match(sqliteInvocation.args[3], /SELECT id, cwd, archived, source FROM threads/i);
  assert.doesNotMatch(sqliteInvocation.args[3], /title|preview|message|rollout/i);

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

  const replacementInventory = structuredClone(completeInventory);
  replacementInventory.tasks[0].id = 'task-product-next';
  const blockedReplacement = onboarding.planRepositoryTaskInventory(
    replacementInventory,
    exactRepository,
  );
  assert.strictEqual(blockedReplacement.complete, false);
  assert.match(blockedReplacement.failures[0].message, /receipt identity repair/i);

  replacementInventory.receiptRebindings = [{
    workstream: 'product',
    fromTaskId: 'task-product',
    toTaskId: 'task-product-next',
    approvalRef: 'James approved replacing the archived Product task on 2026-08-18',
  }];
  const plannedReplacement = onboarding.planRepositoryTaskInventory(
    replacementInventory,
    exactRepository,
  );
  assert.strictEqual(plannedReplacement.complete, true);
  assert.ok(plannedReplacement.actions.every(action => action.type === 'reuse'));

  for (const invalidRebinding of [
    { ...replacementInventory.receiptRebindings[0], fromTaskId: 'wrong-old-task' },
    { ...replacementInventory.receiptRebindings[0], toTaskId: 'task-user' },
  ]) {
    assert.strictEqual(
      onboarding.planRepositoryTaskInventory({
        ...replacementInventory,
        receiptRebindings: [invalidRebinding],
      }, exactRepository).complete,
      false,
    );
  }
  assert.throws(
    () => onboarding.planRepositoryTaskInventory({
      ...replacementInventory,
      receiptRebindings: [{ ...replacementInventory.receiptRebindings[0], approvalRef: '' }],
    }, exactRepository),
    /approvalRef.*explicit approval/i,
  );
  assert.throws(
    () => onboarding.planRepositoryTaskInventory({
      ...replacementInventory,
      receiptRebindings: [
        replacementInventory.receiptRebindings[0],
        { ...replacementInventory.receiptRebindings[0], workstream: 'user' },
      ],
    }, exactRepository),
    /one bounded canonical task replacement/i,
  );
  assert.strictEqual(
    onboarding.planRepositoryTaskInventory({
      ...replacementInventory,
      tasks: replacementInventory.tasks.map((task, index) => (
        index === 0 ? { ...task, pinned: false } : task
      )),
    }, exactRepository).complete,
    false,
  );

  const reboundReceipt = onboarding.recordReconciliation(tempRoot, replacementInventory, {
    repository: exactRepository,
    now: new Date('2026-08-18T02:00:00Z'),
  });
  assert.strictEqual(reboundReceipt.taskBindings.product.taskId, 'task-product-next');
  assert.deepStrictEqual(
    Object.fromEntries(Object.entries(reboundReceipt.taskBindings).filter(([role]) => role !== 'product')),
    Object.fromEntries(Object.entries(receipt.taskBindings).filter(([role]) => role !== 'product')),
  );
  assert.deepStrictEqual(reboundReceipt.receiptRebindings, replacementInventory.receiptRebindings);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('FB setup native onboarding contract passed.');
