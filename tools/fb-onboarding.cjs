#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
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
  if (expectedProjectId) return observedProjectId === expectedProjectId;
  return sameRepository(
    taskRepositoryPath(task),
    identity.repositoryPath || identity.projectPath || identity.path,
  );
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

function inventorySnapshot(inventory) {
  if (Array.isArray(inventory)) {
    return { tasks: inventory, complete: true, failures: [] };
  }
  const value = inventory && typeof inventory === 'object' ? inventory : {};
  return {
    tasks: Array.isArray(value.tasks) ? value.tasks : [],
    complete: value.complete === true,
    failures: Array.isArray(value.failures) ? value.failures : [],
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
    if (!belongsToRepository(task, repositoryPath)) continue;
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

function verifyRepositoryTaskInventory(inventory, repository) {
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

  const snapshot = inventorySnapshot(inventory);
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
  return { complete: true, failures: [], taskBindings };
}

function reconciliationFailure(failures, repository, options = {}) {
  const messages = Array.isArray(failures) && failures.length > 0
    ? failures
    : [{ operation: 'reconciliation', message: 'Complete exact-project task state could not be proved.' }];
  const explanation = messages.map(failure => `- ${failure.operation}: ${failure.message}`).join('\n');
  const prompts = renderManualFallback(WORKSTREAMS, {
    repositoryName: options.repositoryName,
    repositoryPath: repository?.repositoryPath || repository?.projectPath || repository?.path,
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
  const current = readOnboardingReceipt(rootDir);
  if (!current || current.permission !== 'granted') {
    throw new Error('Explicit onboarding permission must be granted before reconciliation.');
  }
  if (!verification?.complete || Object.keys(verification.taskBindings || {}).length !== WORKSTREAMS.length) {
    throw new Error('Onboarding reconciliation requires confirmed exact titles, task IDs, and pinned state for all seven roles.');
  }
  const now = options.now instanceof Date ? options.now : new Date();
  const state = {
    ...current,
    repositoryPath: path.resolve(repository?.repositoryPath || repository?.projectPath || repository?.path || rootDir),
    ...(repository?.projectId ? { projectId: String(repository.projectId) } : {}),
    workstreams: WORKSTREAMS.map(item => item.key),
    taskBindings: verification.taskBindings,
    reconciledAt: now.toISOString(),
  };
  atomicWriteJson(receiptPath(rootDir), state);
  return state;
}

function reconcileRepositoryTaskInventory(options = {}) {
  const repository = typeof options.repository === 'string'
    ? { repositoryPath: options.repository }
    : (options.repository || {});
  const controls = options.controls || {};
  let inventory = options.inventory;
  if (inventory === undefined) {
    if (typeof controls.listTasks !== 'function') {
      return reconciliationFailure([{
        operation: 'inventory',
        message: 'Codex task inventory controls are unavailable.',
      }], repository, options);
    }
    try {
      inventory = controls.listTasks(repository);
    } catch (error) {
      return reconciliationFailure([{
        operation: 'inventory',
        message: error.message,
      }], repository, options);
    }
  }

  const plan = planRepositoryTaskInventory(inventory, repository);
  if (!plan.complete) return reconciliationFailure(plan.failures, repository, options);

  const createdTaskIds = new Map();
  const executed = [];
  try {
    for (const action of plan.actions) {
      if (action.type === 'reuse') continue;
      if (action.type === 'create') {
        if (typeof controls.createTask !== 'function') {
          throw new Error(`Codex create control is unavailable for ${action.workstream}.`);
        }
        const workstream = WORKSTREAMS.find(item => item.key === action.workstream);
        const created = controls.createTask({
          workstream: action.workstream,
          title: action.title,
          prompt: renderIdleTaskPrompt(workstream, {
            repositoryName: options.repositoryName,
            repositoryPath: repository.repositoryPath || repository.projectPath || repository.path,
          }),
          repository,
        });
        const createdId = actionTaskId(created);
        if (!createdId) throw new Error(`Codex create control returned no task/thread ID for ${action.workstream}.`);
        createdTaskIds.set(action.workstream, createdId);
        executed.push({ ...action, taskId: createdId });
        continue;
      }

      const targetId = action.taskId || createdTaskIds.get(action.workstream);
      if (!targetId) throw new Error(`No task/thread ID is available for ${action.type} ${action.workstream}.`);
      if (action.type === 'rename') {
        if (typeof controls.renameTask !== 'function') {
          throw new Error(`Codex rename control is unavailable for ${action.workstream}.`);
        }
        controls.renameTask(targetId, action.title, { workstream: action.workstream, repository });
      } else if (action.type === 'pin') {
        if (typeof controls.pinTask !== 'function') {
          throw new Error(`Codex pin control is unavailable for ${action.workstream}.`);
        }
        controls.pinTask(targetId, { workstream: action.workstream, repository, pinned: true });
      }
      executed.push({ ...action, taskId: targetId });
    }
  } catch (error) {
    return {
      ...reconciliationFailure([{
        operation: executed.length > 0 ? 'partial-reconciliation' : 'reconciliation',
        message: error.message,
      }], repository, options),
      actions: executed,
    };
  }

  if (typeof controls.listTasks !== 'function') {
    return {
      ...reconciliationFailure([{
        operation: 'verification',
        message: 'Codex task inventory cannot be re-listed to confirm all seven titles and pins.',
      }], repository, options),
      actions: executed,
    };
  }

  let finalInventory;
  try {
    finalInventory = controls.listTasks(repository);
  } catch (error) {
    return {
      ...reconciliationFailure([{ operation: 'verification', message: error.message }], repository, options),
      actions: executed,
    };
  }
  const verification = verifyRepositoryTaskInventory(finalInventory, repository);
  if (!verification.complete) {
    return {
      ...reconciliationFailure(verification.failures, repository, options),
      actions: executed,
    };
  }

  if (options.rootDir) {
    recordVerifiedReconciliation(options.rootDir, verification, repository, options);
  }
  return {
    complete: true,
    reconciled: true,
    failures: [],
    actions: executed,
    taskBindings: verification.taskBindings,
    manualFallback: '',
  };
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
  const verification = verifyRepositoryTaskInventory(inventory, repository);
  if (!verification.complete) {
    const detail = verification.failures.map(failure => failure.message).join('; ');
    throw new Error(`Onboarding reconciliation requires all seven exact-project tasks pinned: ${detail}`);
  }
  return recordVerifiedReconciliation(rootDir, verification, repository, options);
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
      'When invoked, reconcile ready evidence from User, Business, Design, Tech, Discovery, and Bugs; disposition and sequence the approved scope; direct execution and verification; stop at Ready to ship. Only Push Live authorizes release.',
    ].join('\n');
  }
  return [
    `You are the ${workstream.title} workstream for this repository.`,
    `Repository: ${repositoryName} (${repositoryPath})`,
    `Primary question: ${workstream.question}`,
    '',
    'Remain idle after acknowledging this setup. Do not investigate, edit files, create a handoff, claim work, or start implementation until the user asks a concrete question in this task.',
    'This is a planning and evidence task. When findings become actionable, create a repository-local handoff MD for Product/BFM. Source-changing integration happens through `$bfm`, and only Push Live authorizes release.',
  ].join('\n');
}

function renderManualFallback(missing, options = {}) {
  const workstreams = Array.isArray(missing) ? missing : WORKSTREAMS;
  const lines = [
    'Codex task creation is not available in this environment, so FB did not pretend to create sidebar tasks.',
    'Create only the missing tasks shown below, then paste the matching prompt into each one:',
    '',
  ];
  for (const workstream of workstreams) {
    lines.push(`### Create ${workstream.title.replace(/^FB · /, '')}`);
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
    const rootDir = args[2] || process.cwd();
    if (!args[1] || !fs.existsSync(inventoryPath)) {
      throw new Error('Reconciliation requires a JSON file containing a complete exact-project pinned task inventory.');
    }
    const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    process.stdout.write(`${JSON.stringify(recordReconciliation(rootDir, inventory, {
      repository: {
        repositoryPath: rootDir,
        ...(args[3] ? { projectId: args[3] } : {}),
      },
    }), null, 2)}\n`);
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
  throw new Error('Usage: node tools/fb-onboarding.cjs status [root] | needs-reconciliation [root] | permission granted|declined [root] | reconcile <complete-inventory.json> [root] [project-id] | prompt <workstream> [root]');
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
  planMissingWorkstreams,
  planRepositoryTaskInventory,
  reconcileRepositoryTaskInventory,
  readOnboardingReceipt,
  recognizedWorkstream,
  recordPermission,
  recordReconciliation,
  recordVerifiedReconciliation,
  renderIdleTaskPrompt,
  renderManualFallback,
  verifyRepositoryTaskInventory,
};
