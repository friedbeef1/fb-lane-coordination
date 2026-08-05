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
  if (expectedProjectId && observedProjectId) return observedProjectId === expectedProjectId;
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

function recordReconciliation(rootDir, workstreams, options = {}) {
  const current = readOnboardingReceipt(rootDir);
  if (!current || current.permission !== 'granted') {
    throw new Error('Explicit onboarding permission must be granted before reconciliation.');
  }
  const observed = new Set(Array.isArray(workstreams) ? workstreams : []);
  const canonical = WORKSTREAMS.map(item => item.key);
  if (!canonical.every(key => observed.has(key))) {
    throw new Error('Onboarding reconciliation requires all seven roles.');
  }
  const now = options.now instanceof Date ? options.now : new Date();
  const state = {
    ...current,
    workstreams: canonical,
    reconciledAt: now.toISOString(),
  };
  atomicWriteJson(receiptPath(rootDir), state);
  return state;
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
  if (command === 'permission') {
    const permission = args[1];
    const rootDir = args[2] || process.cwd();
    process.stdout.write(`${JSON.stringify(recordPermission(rootDir, permission), null, 2)}\n`);
    return;
  }
  if (command === 'reconcile') {
    const workstreams = String(args[1] || '').split(',').map(item => item.trim()).filter(Boolean);
    const rootDir = args[2] || process.cwd();
    process.stdout.write(`${JSON.stringify(recordReconciliation(rootDir, workstreams), null, 2)}\n`);
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
  throw new Error('Usage: node tools/fb-onboarding.cjs status [root] | permission granted|declined [root] | reconcile product,user,business,design,tech,discovery,bugs [root] | prompt <workstream> [root]');
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
  planMissingWorkstreams,
  planRepositoryTaskInventory,
  readOnboardingReceipt,
  recognizedWorkstream,
  recordPermission,
  recordReconciliation,
  renderIdleTaskPrompt,
  renderManualFallback,
};
