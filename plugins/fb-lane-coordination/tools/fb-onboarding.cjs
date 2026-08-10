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

function repositoryPathForConfiguration(repository) {
  const rawRepositoryPath = typeof repository === 'string'
    ? repository
    : repository?.repositoryPath || repository?.projectPath || repository?.path;
  if (!String(rawRepositoryPath || '').trim()) {
    throw new Error('A canonical repository path is required to resolve taskTitlePrefix.');
  }
  return path.resolve(String(rawRepositoryPath).trim());
}

function taskTitlePrefix(repository) {
  const repositoryPath = repositoryPathForConfiguration(repository);
  const configPath = path.join(repositoryPath, '.fb-lane.json');
  if (!fs.existsSync(configPath)) return 'FB';

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    const operation = error instanceof SyntaxError ? 'parse' : 'read';
    throw new Error(`Could not ${operation} .fb-lane.json at ${configPath}: ${error.message}`);
  }
  if (!config || Array.isArray(config) || typeof config !== 'object') {
    throw new Error(`.fb-lane.json at ${configPath} must contain a JSON object.`);
  }
  if (!Object.prototype.hasOwnProperty.call(config, 'taskTitlePrefix')) return 'FB';
  if (typeof config.taskTitlePrefix !== 'string') {
    throw new Error('taskTitlePrefix must be a string between 1 and 64 characters.');
  }
  const rawPrefix = config.taskTitlePrefix;
  const prefix = rawPrefix.trim();
  if (!prefix || prefix.length > 64 || /[·\u0000-\u001f\u007f]/.test(rawPrefix)) {
    throw new Error('taskTitlePrefix must be 1 to 64 characters and must not contain the canonical separator or control characters.');
  }
  return prefix;
}

function workstreamLabel(workstream) {
  return WORKSTREAMS.find(item => item.key === workstream?.key)?.title.replace(/^FB · /, '') || '';
}

function workstreamsForRepository(repository) {
  const prefix = taskTitlePrefix(repository);
  return WORKSTREAMS.map(workstream => ({
    ...workstream,
    title: `${prefix} · ${workstreamLabel(workstream)}`,
  }));
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

function recognizedWorkstream(title, workstreams = WORKSTREAMS) {
  const normalized = normalizeTitle(title);
  return workstreams.find(item => (
    normalizeTitle(item.title) === normalized
    || item.aliases.includes(normalized)
  )) || null;
}

function unrecognizedProjectQualifiedWorkstream(title, workstreams) {
  const rawTitle = String(title || '');
  const separatorIndex = rawTitle.indexOf('·');
  if (separatorIndex <= 0) return null;
  if (recognizedWorkstream(rawTitle, workstreams)) return null;
  const suffix = normalizeTitle(rawTitle.slice(separatorIndex + 1));
  return WORKSTREAMS.find(workstream => (
    normalizeTitle(workstreamLabel(workstream)) === suffix
    || workstream.aliases.includes(suffix)
  )) || null;
}

function planMissingWorkstreams(tasks, repositoryPath) {
  const workstreams = workstreamsForRepository(repositoryPath);
  const found = new Set();
  for (const task of Array.isArray(tasks) ? tasks : []) {
    if (!belongsToRepository(task, repositoryPath)) continue;
    const workstream = recognizedWorkstream(taskTitle(task), workstreams);
    if (workstream) found.add(workstream.key);
  }
  return workstreams.filter(item => !found.has(item.key));
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

function safeTaskIdentifier(value) {
  const id = String(value || '').trim();
  return id && id.length <= 512 && !/[\u0000-\u001f\u007f]/.test(id) ? id : null;
}

function localInventoryFailure(message, operation = 'local-inventory') {
  return { complete: false, failures: [{ operation, message }], candidateIds: [] };
}

function isExcludedLocalHelperSource(source) {
  if (typeof source !== 'string' || !source.startsWith('{')) return false;
  try {
    const parsed = JSON.parse(source);
    return Boolean(parsed && parsed.subagent);
  } catch (error) {
    return false;
  }
}

function classifyLocalTaskRows(rows, repository) {
  let identity;
  try {
    identity = verifiedRepositoryIdentity(repository);
  } catch (error) {
    return localInventoryFailure(error.message, 'project');
  }
  if (!Array.isArray(rows)) {
    return localInventoryFailure('The read-only Codex local-state query did not return a task-row array.');
  }

  const candidateIds = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      return localInventoryFailure('The read-only Codex local-state query returned a malformed task row.');
    }
    if (Number(row.archived || 0) !== 0 || !sameRepository(row.cwd, identity.repositoryPath)) continue;
    if (row.source !== 'vscode') {
      if (isExcludedLocalHelperSource(row.source)) continue;
      return localInventoryFailure(`Exact-root task ${safeTaskIdentifier(row.id) || '(unknown)'} has unsupported local source metadata; setup cannot prove whether it is a user-visible sidebar task.`);
    }
    const id = safeTaskIdentifier(row.id);
    if (!id) return localInventoryFailure('An exact-root user-visible task has an unsafe or missing task ID.');
    candidateIds.push(id);
  }
  const unique = [...new Set(candidateIds)].sort();
  if (unique.length !== candidateIds.length) {
    return localInventoryFailure('The read-only Codex local-state query returned duplicate task IDs.');
  }
  return {
    complete: true,
    failures: [],
    repositoryPath: identity.repositoryPath,
    projectId: identity.projectId,
    candidateIds: unique,
  };
}

function parseEvidenceObject(value, label) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function containsPrivateThreadEvidence(value) {
  if (!value || typeof value !== 'object') return false;
  for (const [key, nested] of Object.entries(value)) {
    if (['preview', 'turns', 'items', 'message', 'first_user_message', 'rollout_path'].includes(key)) {
      return true;
    }
    if (containsPrivateThreadEvidence(nested)) return true;
  }
  return false;
}

function buildCompleteLocalInventory(evidence, repository, localCandidates) {
  let identity;
  try {
    identity = verifiedRepositoryIdentity(repository);
  } catch (error) {
    return { complete: false, failures: [{ operation: 'project', message: error.message }], tasks: [] };
  }
  const fail = (message, operation = 'local-inventory') => ({
    complete: false,
    failures: [{ operation, message }],
    tasks: [],
  });
  if (!localCandidates?.complete || !Array.isArray(localCandidates.candidateIds)) {
    return fail('A complete read-only local candidate enumeration is required; the Codex state database alone is never task, project, title, or pin authority.');
  }

  let value;
  try {
    value = parseEvidenceObject(evidence, 'Native inventory evidence') || {};
  } catch (error) {
    return fail(error.message, 'native-evidence');
  }
  if (containsPrivateThreadEvidence(value)) {
    return fail('Native inventory evidence must contain identity metadata only; previews, turns, messages, rollout paths, and tool items are forbidden.', 'privacy');
  }
  let projectEvidence;
  let threadList;
  try {
    projectEvidence = parseEvidenceObject(value.projects, 'Native project evidence');
    threadList = parseEvidenceObject(value.threadList, 'Native thread-list evidence');
  } catch (error) {
    return fail(error.message, 'native-evidence');
  }
  const projects = Array.isArray(projectEvidence)
    ? projectEvidence
    : projectEvidence?.projects;
  if (!Array.isArray(projects)) {
    return fail('Native list_projects evidence is required to prove the saved project ID and canonical root.', 'project');
  }
  const matchingProjects = projects.filter(project => project?.projectId === identity.projectId);
  if (matchingProjects.length !== 1
      || matchingProjects[0].projectKind !== 'local'
      || matchingProjects[0].hostId !== 'local'
      || !sameRepository(matchingProjects[0].path, identity.repositoryPath)) {
    return fail('Native project evidence does not prove one local saved project with the requested project ID and canonical repository root.', 'project');
  }
  if (!threadList || Number(threadList.schemaVersion || 0) < 4
      || !Array.isArray(threadList.pinnedThreads)
      || !Array.isArray(threadList.threads)
      || !Array.isArray(threadList.unavailableHosts)
      || !Array.isArray(threadList.unavailableSources)) {
    return fail('Native list_threads evidence is missing the pinned-task set or availability metadata.', 'native-evidence');
  }
  if (threadList.unavailableHosts.length > 0 || threadList.unavailableSources.length > 0) {
    return fail('Native task sources are unavailable, so exact-project inventory completeness cannot be proved.', 'native-evidence');
  }

  const candidateIds = [...localCandidates.candidateIds].sort();
  if (candidateIds.some(id => !safeTaskIdentifier(id)) || new Set(candidateIds).size !== candidateIds.length) {
    return fail('The local candidate enumeration contains unsafe or duplicate task IDs.');
  }
  const details = Array.isArray(value.threadDetails) ? value.threadDetails : [];
  const detailMap = new Map();
  for (const item of details) {
    let parsed;
    try {
      parsed = parseEvidenceObject(item, 'Native read_thread evidence');
    } catch (error) {
      return fail(error.message, 'native-evidence');
    }
    const detail = parsed?.thread || parsed;
    const id = safeTaskIdentifier(detail?.id);
    if (!id || detailMap.has(id)) return fail('Native read_thread evidence contains an unsafe, missing, or duplicate task ID.', 'native-evidence');
    detailMap.set(id, detail);
  }
  if (detailMap.size !== candidateIds.length
      || candidateIds.some(id => !detailMap.has(id))
      || [...detailMap.keys()].some(id => !candidateIds.includes(id))) {
    return fail('Native read_thread detail must cover every current local candidate exactly once.', 'native-evidence');
  }

  const pinnedMap = new Map();
  for (const pinned of threadList.pinnedThreads) {
    const id = safeTaskIdentifier(pinned?.id);
    if (!id || pinnedMap.has(id)) return fail('Native pinned-task evidence contains an unsafe, missing, or duplicate task ID.', 'native-evidence');
    pinnedMap.set(id, pinned);
    const claimsProject = pinned.projectId === identity.projectId;
    const claimsRoot = sameRepository(pinned.cwd, identity.repositoryPath);
    if (claimsProject !== claimsRoot) {
      return fail(`Pinned task ${id} contradicts the requested project ID and canonical repository root.`, 'native-evidence');
    }
    if (claimsProject && !candidateIds.includes(id)) {
      return fail(`Pinned exact-project task ${id} is missing from the complete local candidate enumeration.`, 'native-evidence');
    }
  }

  const recentMap = new Map();
  for (const recent of threadList.threads) {
    const id = safeTaskIdentifier(recent?.id);
    if (!id) return fail('Native recent-task evidence contains an unsafe or missing task ID.', 'native-evidence');
    if (recentMap.has(id) || pinnedMap.has(id)) return fail(`Native task ${id} appears more than once or in both pinned and non-pinned sets.`, 'native-evidence');
    recentMap.set(id, recent);
    if (recent.projectId === identity.projectId && !candidateIds.includes(id)) {
      return fail(`Recent exact-project task ${id} is missing from the complete local candidate enumeration.`, 'native-evidence');
    }
  }

  const tasks = [];
  for (const id of candidateIds) {
    const detail = detailMap.get(id);
    if (detail.kind !== 'codex' || detail.hostId !== 'local'
        || !sameRepository(detail.cwd, identity.repositoryPath)
        || !String(detail.title || '').trim()) {
      return fail(`Native read_thread detail for ${id} does not prove a current local Codex task at the canonical repository root.`, 'native-evidence');
    }
    const pinned = pinnedMap.get(id);
    const recent = recentMap.get(id);
    if (pinned && (pinned.projectId !== identity.projectId
        || !sameRepository(pinned.cwd, identity.repositoryPath)
        || String(pinned.title || '') !== String(detail.title))) {
      return fail(`Pinned-task and read_thread evidence disagree for ${id}.`, 'native-evidence');
    }
    if (recent && (recent.projectId !== identity.projectId
        || !sameRepository(recent.cwd, identity.repositoryPath)
        || String(recent.title || '') !== String(detail.title))) {
      return fail(`Recent-task and read_thread evidence disagree for ${id}.`, 'native-evidence');
    }
    tasks.push({
      id,
      title: String(detail.title).trim(),
      projectId: identity.projectId,
      repositoryPath: identity.repositoryPath,
      pinned: Boolean(pinned),
    });
  }
  return { complete: true, failures: [], tasks };
}

function defaultCodexStateDb() {
  const home = process.env.CODEX_HOME || path.join(require('node:os').homedir(), '.codex');
  return path.join(home, 'state_5.sqlite');
}

function readLocalTaskCandidates(repository, options = {}) {
  let identity;
  try {
    identity = verifiedRepositoryIdentity(repository);
  } catch (error) {
    return localInventoryFailure(error.message, 'project');
  }
  let canonicalRoot;
  try {
    canonicalRoot = fs.realpathSync.native(identity.repositoryPath);
  } catch (error) {
    return localInventoryFailure(`Canonical repository root is unavailable: ${identity.repositoryPath}.`, 'project');
  }
  if (canonicalRoot !== identity.repositoryPath) {
    return localInventoryFailure(`Repository root must be canonical: expected ${canonicalRoot}.`, 'project');
  }
  const stateDb = path.resolve(options.stateDb || defaultCodexStateDb());
  if (!fs.existsSync(stateDb) || !fs.statSync(stateDb).isFile()) {
    return localInventoryFailure(`Read-only Codex local state is unavailable at ${stateDb}.`);
  }
  const escapedRoot = canonicalRoot.replace(/'/g, "''");
  const query = `SELECT id, cwd, archived, source FROM threads WHERE archived = 0 AND cwd = '${escapedRoot}' ORDER BY id`;
  let rows;
  try {
    const execute = options.execFileSync || execFileSync;
    const output = execute(options.sqlite3Path || 'sqlite3', ['-readonly', '-json', stateDb, query], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    rows = JSON.parse(String(output || '[]'));
  } catch (error) {
    return localInventoryFailure('The read-only Codex local-state query failed; setup remains unchanged.');
  }
  return classifyLocalTaskRows(rows, { ...identity, repositoryPath: canonicalRoot });
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

function needsTaskInventoryReconciliation(receipt, repository = receipt?.repositoryPath) {
  if (!repository && !receipt) return false;
  const workstreams = workstreamsForRepository(repository);
  if (!receipt || receipt.permission !== 'granted') return false;
  const observed = new Set(Array.isArray(receipt.workstreams) ? receipt.workstreams : []);
  return workstreams.some(workstream => {
    const binding = receipt.taskBindings?.[workstream.key];
    return !observed.has(workstream.key)
      || !binding
      || !String(binding.taskId || '').trim()
      || binding.title !== workstream.title
      || binding.pinned !== true;
  });
}

function prefixDriftFailures(receipt, workstreams) {
  if (!receipt || receipt.permission !== 'granted' || !receipt.taskBindings) return [];
  return workstreams.flatMap(workstream => {
    const binding = receipt.taskBindings[workstream.key];
    if (!binding || binding.title === workstream.title) return [];
    const previouslyRecognized = recognizedWorkstream(binding.title, workstreams);
    if (previouslyRecognized?.key === workstream.key) return [];
    return [{
      operation: 'configuration',
      message: `The previously reconciled ${workstreamLabel(workstream)} receipt binding uses ${binding.title || '(missing title)'}; taskTitlePrefix drift requires explicit identity repair before planning task mutations.`,
    }];
  });
}

function receiptIdentityFailures(receipt, tasks, repository, workstreams) {
  if (!receipt || receipt.permission !== 'granted' || !receipt.taskBindings) return [];
  return workstreams.flatMap(workstream => {
    const binding = receipt.taskBindings[workstream.key];
    const id = String(binding?.taskId || '').trim();
    if (!id) {
      return [{
        operation: 'identity-repair',
        message: `Receipt identity repair is required: ${workstreamLabel(workstream)} has no bound task ID.`,
      }];
    }
    const matches = tasks.filter(task => (
      belongsToRepository(task, repository) && actionTaskId(task) === id
    ));
    if (matches.length !== 1) {
      return [{
        operation: 'identity-repair',
        message: `Receipt identity repair is required: bound task ID ${id} for ${workstreamLabel(workstream)} is missing or ambiguous in the complete exact-project inventory.`,
      }];
    }
    const observed = recognizedWorkstream(taskTitle(matches[0]), workstreams);
    if (observed?.key !== workstream.key) {
      return [{
        operation: 'identity-repair',
        message: `Receipt identity repair is required: bound task ID ${id} no longer classifies as ${workstreamLabel(workstream)} under the current workstreams.`,
      }];
    }
    return [];
  });
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
  let workstreams;
  try {
    workstreams = workstreamsForRepository(repository);
  } catch (error) {
    return {
      complete: false,
      failures: [{ operation: 'configuration', message: error.message }],
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

  let receipt = null;
  if (fs.existsSync(repository.repositoryPath)) {
    try {
      receipt = readOnboardingReceipt(repository.repositoryPath);
    } catch (error) {
      return {
        complete: false,
        failures: [{ operation: 'receipt', message: error.message }],
        actions: [],
      };
    }
  }
  const driftFailures = prefixDriftFailures(receipt, workstreams);
  if (driftFailures.length > 0) {
    return { complete: false, failures: driftFailures, actions: [] };
  }
  const identityFailures = receiptIdentityFailures(
    receipt,
    snapshot.tasks,
    repository,
    workstreams,
  );
  if (identityFailures.length > 0) {
    return { complete: false, failures: identityFailures, actions: [] };
  }

  const unrecognizedQualifiedFailures = snapshot.tasks.flatMap(task => {
    if (!belongsToRepository(task, repository)) return [];
    const workstream = unrecognizedProjectQualifiedWorkstream(taskTitle(task), workstreams);
    if (!workstream) return [];
    return [{
      operation: 'identity-repair',
      message: `Unrecognized project-qualified ${workstreamLabel(workstream)} task ${actionTaskId(task) || '(unknown ID)'} requires identity repair before FB can create or rename tasks.`,
    }];
  });
  if (unrecognizedQualifiedFailures.length > 0) {
    return { complete: false, failures: unrecognizedQualifiedFailures, actions: [] };
  }

  const available = new Map();
  for (const task of snapshot.tasks) {
    if (!belongsToRepository(task, repository)) continue;
    const workstream = recognizedWorkstream(taskTitle(task), workstreams);
    if (!workstream) continue;
    const matches = available.get(workstream.key) || [];
    matches.push(task);
    available.set(workstream.key, matches);
  }

  const duplicateFailures = workstreams.flatMap(workstream => {
    const matches = available.get(workstream.key) || [];
    if (matches.length < 2) return [];
    const ids = matches.map(task => actionTaskId(task) || '(unknown)').sort().join(', ');
    return [{
      operation: 'inventory',
      message: `Ambiguous ${workstreamLabel(workstream)} tasks: ${ids}.`,
    }];
  });
  if (duplicateFailures.length > 0) {
    return { complete: false, failures: duplicateFailures, actions: [] };
  }

  const missingTargetFailures = workstreams.flatMap(workstream => {
    const task = (available.get(workstream.key) || [])[0];
    if (!task || actionTaskId(task)) return [];
    const label = workstreamLabel(workstream);
    const failures = [];
    if (taskTitle(task) !== workstream.title) {
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
  for (const workstream of workstreams) {
    const task = (available.get(workstream.key) || [])[0];
    if (!task) {
      actions.push({ type: 'create', workstream: workstream.key, title: workstream.title });
      actions.push({ type: 'pin', workstream: workstream.key, after: `create:${workstream.key}` });
      continue;
    }

    const id = actionTaskId(task);
    actions.push({ type: 'reuse', workstream: workstream.key, ...(id ? { taskId: id } : {}) });
    if (taskTitle(task) !== workstream.title) {
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
  const workstreams = workstreamsForRepository(repository);

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
  for (const workstream of workstreams) {
    const task = snapshot.tasks.find(candidate => (
      belongsToRepository(candidate, repository)
      && recognizedWorkstream(taskTitle(candidate), workstreams)?.key === workstream.key
    ));
    const id = actionTaskId(task);
    if (!task || !id || taskTitle(task) !== workstream.title || !taskIsPinned(task)) {
      return {
        complete: false,
        failures: [{
          operation: 'verification',
          workstream: workstream.key,
          message: `${workstreamLabel(workstream)} is not confirmed with an exact title, executable ID, and pinned state.`,
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

function fallbackRoleAction(workstream, inventory, repository, executed = [], workstreams = WORKSTREAMS) {
  const label = workstreamLabel(workstream);
  if (executed.some(action => action.type === 'create' && action.workstream === workstream.key)) {
    return `Verify newly created ${label}, capture its task ID, and pin it; do not create a duplicate`;
  }
  const tasks = inventorySnapshot(inventory).tasks.filter(task => (
    belongsToRepository(task, repository)
    && recognizedWorkstream(taskTitle(task), workstreams)?.key === workstream.key
  ));
  if (tasks.length > 1) return `Resolve ambiguous ${label} tasks before renaming, pinning, or creating anything`;
  if (tasks.length === 0) return `Check for ${label}; create only if absent`;
  const task = tasks[0];
  if (taskTitle(task) !== workstream.title) {
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
  let workstreams;
  try {
    workstreams = workstreamsForRepository(repository);
  } catch (error) {
    workstreams = WORKSTREAMS;
  }
  const prompts = renderManualFallback(workstreams, {
    repositoryName: options.repositoryName,
    repositoryPath: repository?.repositoryPath || repository?.projectPath || repository?.path,
    roleActions: Object.fromEntries(workstreams.map(workstream => [
      workstream.key,
      fallbackRoleAction(workstream, context.inventory, repository, context.actions, workstreams),
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

function localInventoryFlags(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!['--repository-root', '--project-id', '--state-db'].includes(flag) || !String(value || '').trim()) {
      throw new Error('Local inventory requires --repository-root <canonical-root> and --project-id <verified-project-id>; --state-db <path> is optional.');
    }
    if (values[flag]) throw new Error(`Duplicate local inventory flag: ${flag}.`);
    values[flag] = value;
  }
  const repository = verifiedRepositoryIdentity({
    repositoryPath: values['--repository-root'],
    projectId: values['--project-id'],
  });
  return {
    repository,
    ...(values['--state-db'] ? { stateDb: path.resolve(values['--state-db']) } : {}),
  };
}

function renderIdleTaskPrompt(workstream, options = {}) {
  if (!workstream || !WORKSTREAMS.some(item => item.key === workstream.key)) {
    throw new Error('A recognized FB workstream is required.');
  }
  const repositoryName = options.repositoryName || path.basename(options.repositoryPath || process.cwd());
  const repositoryPath = path.resolve(options.repositoryPath || process.cwd());
  const expectedWorkstream = options.repositoryPath
    ? workstreamsForRepository({ repositoryPath }).find(item => item.key === workstream.key)
    : workstream;
  if (expectedWorkstream.key === 'product') {
    return [
      `You are the ${expectedWorkstream.title} control centre for this repository.`,
      `Repository: ${repositoryName} (${repositoryPath})`,
      `Primary question: ${expectedWorkstream.question}`,
      '',
      'Remain idle after acknowledging this setup until the user invokes `$bfm` in this task. Do not investigate, edit files, create a handoff, claim work, or start implementation before that invocation.',
      'When invoked from the active canonical checkout, show the complete intake ledger for User, Business, Design, Tech, Discovery, Bugs, and this separate Product/BFM control centre; disposition, reconcile, and sequence the approved scope; direct execution and verification; stop at Ready to ship. Only Push Live authorizes release.',
    ].join('\n');
  }
  return [
    `You are the ${expectedWorkstream.title} workstream for this repository.`,
    `Repository: ${repositoryName} (${repositoryPath})`,
    `Primary question: ${expectedWorkstream.question}`,
    '',
    'Remain idle after acknowledging this setup. Do not investigate, edit files, create a handoff, claim work, or start implementation until the user asks a concrete question in this task.',
    'This is one of six planning and evidence workstreams; Product/BFM is the separate control centre. When findings become actionable, create a repository-local handoff MD for Product/BFM. Source-changing integration happens from the canonical checkout through `$bfm`, and only Push Live authorizes release.',
  ].join('\n');
}

function renderManualFallback(missing, options = {}) {
  const workstreams = Array.isArray(missing)
    ? missing
    : (options.repositoryPath ? workstreamsForRepository(options) : WORKSTREAMS);
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
    lines.push(`### ${roleActions?.[workstream.key] || `Create ${workstreamLabel(workstream)}`}`);
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
      needsReconciliation: needsTaskInventoryReconciliation(state, rootDir),
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
  if (command === 'local-candidates') {
    const options = localInventoryFlags(args.slice(1));
    const result = readLocalTaskCandidates(options.repository, options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.complete) process.exitCode = 1;
    return;
  }
  if (command === 'inventory-local') {
    const evidencePath = path.resolve(args[1] || '');
    if (!args[1] || !fs.existsSync(evidencePath)) {
      throw new Error('Local inventory requires a JSON evidence file from list_projects, list_threads, and read_thread.');
    }
    const options = localInventoryFlags(args.slice(2));
    const candidates = readLocalTaskCandidates(options.repository, options);
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    const result = buildCompleteLocalInventory(evidence, options.repository, candidates);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.complete) process.exitCode = 1;
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
    const workstream = workstreamsForRepository({ repositoryPath: rootDir }).find(item => item.key === key);
    if (!workstream) throw new Error(`Unknown workstream: ${key || '(missing)'}.`);
    process.stdout.write(`${renderIdleTaskPrompt(workstream, {
      repositoryName: path.basename(rootDir),
      repositoryPath: rootDir,
    })}\n`);
    return;
  }
  throw new Error('Usage: node tools/fb-onboarding.cjs status [root] | needs-reconciliation [root] | permission granted|declined [root] | local-candidates --repository-root <canonical-root> --project-id <verified-project-id> [--state-db <path>] | inventory-local <native-evidence.json> --repository-root <canonical-root> --project-id <verified-project-id> [--state-db <path>] | plan <complete-inventory.json> --repository-root <canonical-root> --project-id <verified-project-id> | reconcile <complete-inventory.json> --repository-root <canonical-root> --project-id <verified-project-id> | prompt <workstream> [root]');
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
  buildCompleteLocalInventory,
  classifyLocalTaskRows,
  ensureOnboardingReceipt,
  isBfmIntent,
  needsTaskInventoryReconciliation,
  normalizeAttemptedActions,
  planMissingWorkstreams,
  planRepositoryTaskInventory,
  readOnboardingReceipt,
  readLocalTaskCandidates,
  recognizedWorkstream,
  recordPermission,
  recordReconciliation,
  recordVerifiedReconciliation,
  renderIdleTaskPrompt,
  renderManualFallback,
  taskTitlePrefix,
  verifyRepositoryTaskInventory,
  workstreamsForRepository,
};
