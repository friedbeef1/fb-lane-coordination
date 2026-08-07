#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const WORKSTREAMS = Object.freeze([
  {
    key: 'product',
    title: 'FB · Product/BFM',
    aliases: ['product', 'product bfm', 'fb product', 'fb product bfm'],
    question: 'How should we coordinate delivery and release?',
  },
  {
    key: 'user',
    title: 'FB · User',
    aliases: ['user', 'fb user', 'product user', 'fb product user'],
    question: 'What user outcome should we deliver?',
  },
  {
    key: 'business',
    title: 'FB · Business',
    aliases: ['business', 'fb business'],
    question: 'How can this succeed commercially?',
  },
  {
    key: 'design',
    title: 'FB · Design',
    aliases: ['design', 'fb design'],
    question: 'How should the experience work and feel?',
  },
  {
    key: 'tech',
    title: 'FB · Tech',
    aliases: ['tech', 'technical', 'fb tech', 'fb technical'],
    question: 'How can this be built safely and reliably?',
  },
  {
    key: 'discovery',
    title: 'FB · Discovery',
    aliases: ['discovery', 'fb discovery'],
    question: 'What do we still need to learn?',
  },
  {
    key: 'bugs',
    title: 'FB · Bugs',
    aliases: ['bug', 'bugs', 'fb bug', 'fb bugs'],
    question: 'What is broken and how do we prove it?',
  },
]);

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[·/_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function taskTitle(task) {
  return task && (task.title || task.name || task.threadTitle || task.taskTitle);
}

function taskRepositoryPath(task) {
  return task && (
    task.repositoryPath ||
    task.projectPath ||
    task.cwd ||
    task.workspacePath ||
    (task.project && (task.project.path || task.project.root || task.project.cwd))
  );
}

function taskProjectId(task) {
  return task && (task.projectId || (task.project && task.project.id));
}

function sameRepository(left, right) {
  if (!left || !right) return false;
  return path.resolve(String(left)) === path.resolve(String(right));
}

function belongsToRepository(task, repository) {
  const identity = typeof repository === 'string'
    ? { repositoryPath: repository }
    : (repository || {});
  const expectedProjectId = identity.projectId;
  const observedProjectId = taskProjectId(task);
  const expectedPath = identity.repositoryPath || identity.projectPath || identity.path;
  const observedPath = taskRepositoryPath(task);
  if (expectedProjectId && observedProjectId !== expectedProjectId) return false;
  if (expectedPath && observedPath && !sameRepository(observedPath, expectedPath)) return false;
  return Boolean(expectedProjectId ? observedProjectId === expectedProjectId : sameRepository(observedPath, expectedPath));
}

function recognizedWorkstream(title) {
  const normalized = normalizeTitle(title);
  return WORKSTREAMS.find(item => item.aliases.includes(normalized)) || null;
}

function planMissingWorkstreams(tasks, repositoryPath) {
  const found = new Set();
  for (const task of Array.isArray(tasks) ? tasks : []) {
    if (!belongsToRepository(task, repositoryPath)) continue;
    const workstream = recognizedWorkstream(taskTitle(task));
    if (workstream) found.add(workstream.key);
  }
  return WORKSTREAMS.filter(item => !found.has(item.key));
}

function taskId(task) {
  return task && (task.id || task.taskId || task.threadId || task.task_id || task.thread_id);
}

function taskIsPinned(task) {
  return Boolean(task && (task.pinned === true || task.isPinned === true));
}

function normalizeAttemptedActions(value, options = {}) {
  if (value === undefined) {
    if (options.required) throw new Error('Strict onboarding reconciliation requires an attemptedActions array, including [] when no native mutation was needed.');
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error('attemptedActions must be a privacy-safe array.');
  }
  const allowedFields = new Set(['sequence', 'action', 'workstream', 'outcome', 'taskId']);
  const allowedActions = new Set(['create', 'rename', 'pin']);
  const allowedOutcomes = new Set(['succeeded', 'failed', 'unknown']);
  const workstreams = new Set(WORKSTREAMS.map(item => item.key));
  return value.map((entry, index) => {
    if (!entry || Array.isArray(entry) || typeof entry !== 'object') {
      throw new Error(`attemptedActions[${index}] must be a privacy-safe object.`);
    }
    const unsupported = Object.keys(entry).filter(key => !allowedFields.has(key));
    if (unsupported.length > 0) {
      throw new Error(`attemptedActions[${index}] has unsupported privacy-safe ledger field(s): ${unsupported.join(', ')}.`);
    }
    if (entry.sequence !== index + 1) {
      throw new Error(`attemptedActions[${index}].sequence must be ${index + 1}.`);
    }
    if (!allowedActions.has(entry.action)) {
      throw new Error(`attemptedActions[${index}].action must be create, rename, or pin.`);
    }
    if (!workstreams.has(entry.workstream)) {
      throw new Error(`attemptedActions[${index}].workstream is not one of the seven canonical roles.`);
    }
    if (!allowedOutcomes.has(entry.outcome)) {
      throw new Error(`attemptedActions[${index}].outcome must be succeeded, failed, or unknown.`);
    }
    const taskId = entry.taskId === undefined ? undefined : String(entry.taskId).trim();
    if (taskId !== undefined && (!taskId || taskId.length > 512 || /[\u0000-\u001f\u007f]/.test(taskId))) {
      throw new Error(`attemptedActions[${index}].taskId must be a nonempty privacy-safe identifier.`);
    }
    if ((entry.action !== 'create' || entry.outcome === 'succeeded') && !taskId) {
      throw new Error(`attemptedActions[${index}] requires a taskId for this action outcome.`);
    }
    return {
      sequence: entry.sequence,
      action: entry.action,
      workstream: entry.workstream,
      outcome: entry.outcome,
      ...(taskId ? { taskId } : {}),
    };
  });
}

function attemptedActionsHash(actions) {
  return crypto.createHash('sha256').update(JSON.stringify(actions)).digest('hex');
}

function verifiedRepositoryIdentity(repository) {
  const projectId = String(repository?.projectId || '').trim();
  const rawRepositoryPath = repository?.repositoryPath || repository?.projectPath || repository?.path;
  if (!projectId || !String(rawRepositoryPath || '').trim()) {
    throw new Error('Both a nonempty verified project ID and canonical repository path are required before task mutation or reconciliation.');
  }
  return {
    projectId,
    repositoryPath: path.resolve(String(rawRepositoryPath).trim()),
  };
}

function inventorySnapshot(inventory, options = {}) {
  if (Array.isArray(inventory)) {
    return {
      tasks: inventory,
      complete: false,
      failures: [{ operation: 'inventory', message: 'An explicitly complete inventory object is required; raw task arrays are unproven.' }],
    };
  }
  const value = inventory && typeof inventory === 'object' ? inventory : {};
  return {
    tasks: Array.isArray(value.tasks) ? value.tasks : [],
    complete: value.complete === true,
    failures: Array.isArray(value.failures) ? value.failures : [],
    attemptedActions: normalizeAttemptedActions(value.attemptedActions, {
      required: options.requireAttemptedActions === true,
    }),
  };
}

function actionTaskId(task) {
  const id = taskId(task);
  return id === undefined || id === null ? undefined : String(id);
}

function needsTaskInventoryReconciliation(receipt) {
  if (!receipt || receipt.permission !== 'granted') return false;
  const observed = new Set(Array.isArray(receipt.workstreams) ? receipt.workstreams : []);
  return WORKSTREAMS.some(workstream => !observed.has(workstream.key));
}

function planRepositoryTaskInventory(inventory, repositoryPath) {
  const snapshot = inventorySnapshot(inventory);
  let repository;
  try {
    repository = verifiedRepositoryIdentity(
      typeof repositoryPath === 'string' ? { repositoryPath } : repositoryPath,
    );
  } catch (error) {
    return {
      complete: false,
      failures: [{ operation: 'project', message: error.message }],
      actions: [],
    };
  }
  if (!snapshot.complete) {
    return {
      complete: false,
      failures: snapshot.failures.length > 0
        ? snapshot.failures
        : [{ operation: 'inventory', message: 'A complete task inventory is required before planning.' }],
      actions: [],
    };
  }

  const available = new Map();
  for (const task of snapshot.tasks) {
    if (!belongsToRepository(task, repository)) continue;
    const workstream = recognizedWorkstream(taskTitle(task));
    if (!workstream) continue;
    const matches = available.get(workstream.key) || [];
    matches.push(task);
    available.set(workstream.key, matches);
  }

  const duplicateFailures = WORKSTREAMS.flatMap(workstream => {
    const matches = available.get(workstream.key) || [];
    if (matches.length < 2) return [];
    const ids = matches.map(task => actionTaskId(task) || '(unknown)').sort().join(', ');
    return [{
      operation: 'inventory',
      message: `Ambiguous ${workstream.title.replace(/^FB · /, '')} tasks: ${ids}.`,
    }];
  });
  if (duplicateFailures.length > 0) {
    return { complete: false, failures: duplicateFailures, actions: [] };
  }

  const missingTargetFailures = WORKSTREAMS.flatMap(workstream => {
    const task = (available.get(workstream.key) || [])[0];
    if (!task || actionTaskId(task)) return [];
    const label = workstream.title.replace(/^FB · /, '');
    const failures = [];
    if (normalizeTitle(taskTitle(task)) !== normalizeTitle(workstream.title)) {
      failures.push({
        operation: 'inventory',
        message: `Cannot rename ${label} without an executable task/thread ID.`,
      });
    }
    if (!taskIsPinned(task)) {
      failures.push({
        operation: 'inventory',
        message: `Cannot pin ${label} without an executable task/thread ID.`,
      });
    }
    return failures;
  });
  if (missingTargetFailures.length > 0) {
    return { complete: false, failures: missingTargetFailures, actions: [] };
  }

  const actions = [];
  for (const workstream of WORKSTREAMS) {
    const task = (available.get(workstream.key) || [])[0];
    if (!task) {
      actions.push({ type: 'create', workstream: workstream.key, title: workstream.title });
      actions.push({ type: 'pin', workstream: workstream.key, after: `create:${workstream.key}` });
      continue;
    }

    const id = actionTaskId(task);
    actions.push({ type: 'reuse', workstream: workstream.key, ...(id ? { taskId: id } : {}) });
    if (normalizeTitle(taskTitle(task)) !== normalizeTitle(workstream.title)) {
      actions.push({ type: 'rename', workstream: workstream.key, ...(id ? { taskId: id } : {}), title: workstream.title });
    }
    if (!taskIsPinned(task)) {
      actions.push({ type: 'pin', workstream: workstream.key, ...(id ? { taskId: id } : {}) });
    }
  }

  return { complete: true, failures: [], actions };
}

function verifyRepositoryTaskInventory(inventory, repository, options = {}) {
  const plan = planRepositoryTaskInventory(inventory, repository);
  if (!plan.complete) return { complete: false, failures: plan.failures, taskBindings: {} };

  const incomplete = plan.actions.filter(action => action.type !== 'reuse');
  if (incomplete.length > 0) {
    return {
      complete: false,
      failures: incomplete.map(action => ({
        operation: 'verification',
        workstream: action.workstream,
        message: `${action.workstream} still requires ${action.type}; all seven exact tasks must be visible and pinned.`,
      })),
      taskBindings: {},
    };
  }

  const snapshot = inventorySnapshot(inventory, options);
  const taskBindings = {};
  for (const workstream of WORKSTREAMS) {
    const task = snapshot.tasks.find(candidate => (
      belongsToRepository(candidate, repository)
      && recognizedWorkstream(taskTitle(candidate))?.key === workstream.key
    ));
    const id = actionTaskId(task);
    if (!task || !id || normalizeTitle(taskTitle(task)) !== normalizeTitle(workstream.title) || !taskIsPinned(task)) {
      return {
        complete: false,
        failures: [{
          operation: 'verification',
          workstream: workstream.key,
          message: `${workstream.title.replace(/^FB · /, '')} is not confirmed with an exact title, executable ID, and pinned state.`,
        }],
        taskBindings: {},
      };
    }
    taskBindings[workstream.key] = {
      taskId: id,
      title: workstream.title,
      pinned: true,
    };
  }
  return {
    complete: true,
    failures: [],
    taskBindings,
    ...(snapshot.attemptedActions !== undefined ? { attemptedActions: snapshot.attemptedActions } : {}),
  };
}

function fallbackRoleAction(workstream, inventory, repository, executed = []) {
  const label = workstream.title.replace(/^FB · /, '');
  if (executed.some(action => action.type === 'create' && action.workstream === workstream.key)) {
    return `Verify newly created ${label}, capture its task ID, and pin it; do not create a duplicate`;
  }
  const tasks = inventorySnapshot(inventory).tasks.filter(task => (
    belongsToRepository(task, repository)
    && recognizedWorkstream(taskTitle(task))?.key === workstream.key
  ));
  if (tasks.length > 1) return `Resolve ambiguous ${label} tasks before renaming, pinning, or creating anything`;
  if (tasks.length === 0) return `Check for ${label}; create only if absent`;
  const task = tasks[0];
  if (normalizeTitle(taskTitle(task)) !== normalizeTitle(workstream.title)) {
    return `Rename existing ${label} task to ${workstream.title}`;
  }
  if (!taskIsPinned(task)) return `Pin existing ${label} task`;
  return `Verify existing ${label} in a complete inventory`;
}

function reconciliationFailure(failures, repository, options = {}, context = {}) {
  const messages = Array.isArray(failures) && failures.length > 0
    ? failures
    : [{ operation: 'reconciliation', message: 'Complete exact-project task state could not be proved.' }];
  const explanation = messages.map(failure => `- ${failure.operation}: ${failure.message}`).join('\n');
  const prompts = renderManualFallback(WORKSTREAMS, {
    repositoryName: options.repositoryName,
    repositoryPath: repository?.repositoryPath || repository?.projectPath || repository?.path,
    roleActions: Object.fromEntries(WORKSTREAMS.map(workstream => [
      workstream.key,
      fallbackRoleAction(workstream, context.inventory, repository, context.actions),
    ])),
  });
  return {
    complete: false,
    reconciled: false,
    failures: messages,
    actions: [],
    taskBindings: {},
    manualFallback: `Automatic reconciliation could not finish:\n${explanation}\n\n${prompts}`,
  };
}

function recordVerifiedReconciliation(rootDir, verification, repository, options = {}) {
  const identity = verifiedRepositoryIdentity(repository);
  const current = readOnboardingReceipt(rootDir);
  if (!current || current.permission !== 'granted') {
    throw new Error('Explicit onboarding permission must be granted before reconciliation.');
  }
  if (!verification?.complete || Object.keys(verification.taskBindings || {}).length !== WORKSTREAMS.length) {
    throw new Error('Onboarding reconciliation requires confirmed exact titles, task IDs, and pinned state for all seven roles.');
  }
  const attemptedActions = normalizeAttemptedActions(verification.attemptedActions, { required: true });
  const now = options.now instanceof Date ? options.now : new Date();
  const state = {
    ...current,
    repositoryPath: identity.repositoryPath,
    projectId: identity.projectId,
    workstreams: WORKSTREAMS.map(item => item.key),
    taskBindings: verification.taskBindings,
    attemptedActions,
    attemptedActionsHash: attemptedActionsHash(attemptedActions),
    reconciledAt: now.toISOString(),
  };
  atomicWriteJson(receiptPath(rootDir), state);
  return state;
}

function receiptPath(rootDir) {
  const requestedRoot = path.resolve(rootDir);
  const resolvedRoot = fs.realpathSync.native(requestedRoot);
  try {
    const common = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd: resolvedRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (common) return path.join(path.resolve(resolvedRoot, common), 'fb-onboarding.json');
  } catch (error) {
    // Non-Git projects use the ignored repository-local fallback below.
  }
  return path.join(resolvedRoot, '.fb', 'onboarding.json');
}

function atomicWriteJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.renameSync(temporary, filePath);
  } finally {
    try {
      fs.unlinkSync(temporary);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

function readOnboardingReceipt(rootDir) {
  const filePath = receiptPath(rootDir);
  if (!fs.existsSync(filePath)) return null;
  const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (state.schemaVersion !== 1 || !['pending', 'granted', 'declined'].includes(state.permission)) {
    throw new Error(`Invalid FB onboarding receipt at ${filePath}.`);
  }
  return state;
}

function ensureOnboardingReceipt(rootDir, options = {}) {
  const existing = readOnboardingReceipt(rootDir);
  if (existing) {
    return { shouldPrompt: false, state: existing, statePath: receiptPath(rootDir) };
  }
  const now = options.now instanceof Date ? options.now : new Date();
  const state = {
    schemaVersion: 1,
    repositoryPath: path.resolve(rootDir),
    permission: 'pending',
    promptedAt: now.toISOString(),
  };
  atomicWriteJson(receiptPath(rootDir), state);
  return { shouldPrompt: true, state, statePath: receiptPath(rootDir) };
}

function recordPermission(rootDir, permission, options = {}) {
  if (!['granted', 'declined'].includes(permission)) {
    throw new Error('Onboarding permission must be granted or declined.');
  }
  const current = readOnboardingReceipt(rootDir) || ensureOnboardingReceipt(rootDir, options).state;
  const now = options.now instanceof Date ? options.now : new Date();
  const state = {
    ...current,
    permission,
    decidedAt: now.toISOString(),
  };
  atomicWriteJson(receiptPath(rootDir), state);
  return state;
}

function recordReconciliation(rootDir, inventory, options = {}) {
  if (!inventory || Array.isArray(inventory) || typeof inventory !== 'object') {
    throw new Error('Onboarding reconciliation requires a complete exact-project pinned task inventory.');
  }
  const repository = options.repository || {
    repositoryPath: rootDir,
    ...(options.projectId ? { projectId: options.projectId } : {}),
  };
  const verification = verifyRepositoryTaskInventory(inventory, repository, {
    requireAttemptedActions: true,
  });
  if (!verification.complete) {
    const detail = verification.failures.map(failure => failure.message).join('; ');
    throw new Error(`Onboarding reconciliation requires all seven exact-project tasks pinned: ${detail}`);
  }
  return recordVerifiedReconciliation(rootDir, verification, repository, options);
}

function requiredRepositoryFlags(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!['--repository-root', '--project-id'].includes(flag) || !String(value || '').trim()) {
      throw new Error('Onboarding plan and reconcile require --repository-root <canonical-root> and --project-id <verified-project-id>.');
    }
    if (values[flag]) throw new Error(`Duplicate onboarding identity flag: ${flag}.`);
    values[flag] = value;
  }
  if (!String(values['--repository-root'] || '').trim() || !String(values['--project-id'] || '').trim()) {
    throw new Error('Onboarding plan and reconcile require --repository-root <canonical-root> and --project-id <verified-project-id>.');
  }
  return verifiedRepositoryIdentity({
    repositoryPath: values['--repository-root'],
    projectId: values['--project-id'],
  });
}

function renderIdleTaskPrompt(workstream, options = {}) {
  if (!workstream || !WORKSTREAMS.some(item => item.key === workstream.key)) {
    throw new Error('A recognized FB workstream is required.');
  }
  const repositoryName = options.repositoryName || path.basename(options.repositoryPath || process.cwd());
  const repositoryPath = path.resolve(options.repositoryPath || process.cwd());
  if (workstream.key === 'product') {
    return [
      `You are the ${workstream.title} control centre for this repository.`,
      `Repository: ${repositoryName} (${repositoryPath})`,
      `Primary question: ${workstream.question}`,
      '',
      'Remain idle after acknowledging this setup until the user invokes `$bfm` in this task. Do not investigate, edit files, create a handoff, claim work, or start implementation before that invocation.',
      'When invoked from the active canonical checkout, show the complete intake ledger for User, Business, Design, Tech, Discovery, Bugs, and this separate Product/BFM control centre; disposition, reconcile, and sequence the approved scope; direct execution and verification; stop at Ready to ship. Only Push Live authorizes release.',
    ].join('\n');
  }
  return [
    `You are the ${workstream.title} workstream for this repository.`,
    `Repository: ${repositoryName} (${repositoryPath})`,
    `Primary question: ${workstream.question}`,
    '',
    'Remain idle after acknowledging this setup. Do not investigate, edit files, create a handoff, claim work, or start implementation until the user asks a concrete question in this task.',
    'This is one of six planning and evidence workstreams; Product/BFM is the separate control centre. When findings become actionable, create a repository-local handoff MD for Product/BFM. Source-changing integration happens from the canonical checkout through `$bfm`, and only Push Live authorizes release.',
  ].join('\n');
}

function renderManualFallback(missing, options = {}) {
  const workstreams = Array.isArray(missing) ? missing : WORKSTREAMS;
  const roleActions = options.roleActions && typeof options.roleActions === 'object'
    ? options.roleActions
    : null;
  const lines = roleActions
    ? ['Automatic Codex task reconciliation did not complete. Follow each exact remaining action, then use the prompt only for a newly created task:', '']
    : [
      'Codex task creation is not available in this environment, so FB did not pretend to create sidebar tasks.',
      'Create only the missing tasks shown below, then paste the matching prompt into each one:',
      '',
    ];
  for (const workstream of workstreams) {
    lines.push(`### ${roleActions?.[workstream.key] || `Create ${workstream.title.replace(/^FB · /, '')}`}`);
    lines.push('');
    lines.push('```text');
    lines.push(renderIdleTaskPrompt(workstream, options));
    lines.push('```');
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

function isBfmIntent(value) {
  return /(?:^|\s)(?:\$|\/)bfm(?:\s|$|[.!?,])/i.test(String(value || ''));
}

function runCli(args) {
  const command = args[0] || 'status';
  if (command === 'status') {
    const rootDir = args[1] || process.cwd();
    const state = readOnboardingReceipt(rootDir);
    process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
    return;
  }
  if (command === 'needs-reconciliation') {
    const rootDir = args[1] || process.cwd();
    const state = readOnboardingReceipt(rootDir);
    process.stdout.write(`${JSON.stringify({
      needsReconciliation: needsTaskInventoryReconciliation(state),
    }, null, 2)}\n`);
    return;
  }
  if (command === 'permission') {
    const permission = args[1];
    const rootDir = args[2] || process.cwd();
    process.stdout.write(`${JSON.stringify(recordPermission(rootDir, permission), null, 2)}\n`);
    return;
  }
  if (command === 'reconcile') {
    const inventoryPath = path.resolve(args[1] || '');
    if (!args[1] || !fs.existsSync(inventoryPath)) {
      throw new Error('Reconciliation requires a JSON file containing a complete exact-project pinned task inventory.');
    }
    const repository = requiredRepositoryFlags(args.slice(2));
    const rootDir = repository.repositoryPath;
    const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    process.stdout.write(`${JSON.stringify(recordReconciliation(rootDir, inventory, {
      repository,
    }), null, 2)}\n`);
    return;
  }
  if (command === 'plan') {
    const inventoryPath = path.resolve(args[1] || '');
    if (!args[1] || !fs.existsSync(inventoryPath)) {
      throw new Error('Planning requires a JSON file containing a proven-complete exact-project task inventory.');
    }
    const repository = requiredRepositoryFlags(args.slice(2));
    const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    const plan = planRepositoryTaskInventory(inventory, repository);
    const result = plan.complete
      ? { ...plan, nativeActionsRequired: plan.actions.some(action => action.type !== 'reuse') }
      : { ...reconciliationFailure(plan.failures, repository, {}, { inventory }), nativeActionsRequired: false };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (command === 'prompt') {
    const key = args[1];
    const rootDir = path.resolve(args[2] || process.cwd());
    const workstream = WORKSTREAMS.find(item => item.key === key);
    if (!workstream) throw new Error(`Unknown workstream: ${key || '(missing)'}.`);
    process.stdout.write(`${renderIdleTaskPrompt(workstream, {
      repositoryName: path.basename(rootDir),
      repositoryPath: rootDir,
    })}\n`);
    return;
  }
  throw new Error('Usage: node tools/fb-onboarding.cjs status [root] | needs-reconciliation [root] | permission granted|declined [root] | plan <complete-inventory.json> --repository-root <canonical-root> --project-id <verified-project-id> | reconcile <complete-inventory.json> --repository-root <canonical-root> --project-id <verified-project-id> | prompt <workstream> [root]');
}

if (require.main === module) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  WORKSTREAMS,
  ensureOnboardingReceipt,
  isBfmIntent,
  needsTaskInventoryReconciliation,
  normalizeAttemptedActions,
  planMissingWorkstreams,
  planRepositoryTaskInventory,
  readOnboardingReceipt,
  recognizedWorkstream,
  recordPermission,
  recordReconciliation,
  recordVerifiedReconciliation,
  renderIdleTaskPrompt,
  renderManualFallback,
  verifyRepositoryTaskInventory,
};
