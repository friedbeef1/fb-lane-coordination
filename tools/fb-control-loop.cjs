#!/usr/bin/env node
'use strict';

// Repository-local operational evidence for the generic FB control loop.
// Events are deliberately flat and omit private inputs, outputs, and secrets.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { isDeepStrictEqual } = require('util');
const { spawnSync } = require('child_process');
const { quickPolicyForPaths, evaluateRunBudget } = require('./fb-efficiency.cjs');

const SCHEMA_VERSION = 'fb-stage-event-v1';
const EVENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const REQUIRED_EVENT_FIELDS = [
  'schemaVersion', 'eventId', 'timestamp', 'runId', 'sessionId', 'taskId',
  'stage', 'capability', 'attempt', 'decision', 'result', 'artifactRef',
  'baselineRef', 'candidateRef', 'criteriaIds', 'evidenceRefs', 'failureClass',
  'durationMs', 'inputTokens', 'outputTokens', 'cost', 'nextAction',
];
const USAGE_FIELDS = new Set(['durationMs', 'inputTokens', 'outputTokens', 'cost']);
const GATE_IDS = new Set(['focused', 'comparison', 'safety', 'integration', 'release']);
const FORBIDDEN_KEY = /(?:secret|token|password|credential|api[_-]?key|environment[_-]?value|env[_-]?value|transcript|raw[_-]?prompt|complete[_-]?output|private[_-]?reasoning|chain[_-]?of[_-]?thought)/i;
const CREDENTIAL_MATERIAL = /(?:\b(?:sk|rk|pk|xox[baprs])[-_][A-Za-z0-9_-]{8,}\b|\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bAIza[0-9A-Za-z_-]{20,}\b|\bAKIA[0-9A-Z]{16}\b|-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~+/-]{12,}\b|\b(?:api[_-]?key|token|password|secret)\s*[:=]\s*[^\s,;]{8,})/i;
const FULL_REPAIR_BUDGET_SCHEMA_VERSION = 'fb-full-repair-budget-v1';
const FULL_REPAIR_BUDGET_DURATION_MS = 120 * 60 * 1000;
const FULL_REPAIR_MAX_REPAIRS = 2;
const FULL_REPAIR_LOCK_WAIT_MS = 5000;
const FULL_REPAIR_LOCK_POLL_MS = 20;

function assertSafeIdentifier(value, label) {
  if (typeof value !== 'string' || !EVENT_ID_PATTERN.test(value) || value === '.' || value === '..') {
    throw new Error(`Invalid or unsafe ${label} ${JSON.stringify(value)}.`);
  }
  return value;
}

function gitCommonDir(cwd = process.cwd()) {
  const result = spawnSync('git', ['rev-parse', '--git-common-dir'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) throw new Error((result.stderr || 'A Git common directory is required for control-loop events.').trim());
  return fs.realpathSync(path.resolve(cwd, result.stdout.trim()));
}

function assertNotSymlink(candidate, label) {
  if (fs.existsSync(candidate) && fs.lstatSync(candidate).isSymbolicLink()) throw new Error(`Unsafe symlinked ${label}.`);
}

function ensureEventDirectory(common) {
  const laneDirectory = path.join(common, 'fb-lane');
  const eventDirectory = path.join(laneDirectory, 'events');
  assertNotSymlink(laneDirectory, 'control-loop store directory');
  if (!fs.existsSync(laneDirectory)) fs.mkdirSync(laneDirectory, { mode: 0o700 });
  assertNotSymlink(laneDirectory, 'control-loop store directory');
  assertNotSymlink(eventDirectory, 'control-loop event directory');
  if (!fs.existsSync(eventDirectory)) fs.mkdirSync(eventDirectory, { mode: 0o700 });
  assertNotSymlink(eventDirectory, 'control-loop event directory');
  const realDirectory = fs.realpathSync(eventDirectory);
  if (realDirectory !== path.join(common, 'fb-lane', 'events')) throw new Error('Unsafe control-loop event directory outside the Git common directory.');
  return realDirectory;
}

function eventLogPath(cwd = process.cwd(), runId) {
  const safeRunId = assertSafeIdentifier(runId, 'run ID');
  const common = gitCommonDir(cwd);
  const eventDirectory = ensureEventDirectory(common);
  const filePath = path.resolve(eventDirectory, `${safeRunId}.jsonl`);
  if (path.dirname(filePath) !== eventDirectory) throw new Error('Unsafe event log path.');
  assertNotSymlink(filePath, 'control-loop run log');
  return filePath;
}

function fullRepairBudgetDirectory(common) {
  const laneDirectory = path.join(common, 'fb-lane');
  const budgetDirectory = path.join(laneDirectory, 'full-repair-budgets');
  assertNotSymlink(laneDirectory, 'Full repair-budget store directory');
  if (!fs.existsSync(laneDirectory)) fs.mkdirSync(laneDirectory, { mode: 0o700 });
  assertNotSymlink(laneDirectory, 'Full repair-budget store directory');
  assertNotSymlink(budgetDirectory, 'Full repair-budget directory');
  if (!fs.existsSync(budgetDirectory)) fs.mkdirSync(budgetDirectory, { mode: 0o700 });
  assertNotSymlink(budgetDirectory, 'Full repair-budget directory');
  const realDirectory = fs.realpathSync(budgetDirectory);
  if (realDirectory !== path.join(common, 'fb-lane', 'full-repair-budgets')) throw new Error('Unsafe Full repair-budget directory outside the Git common directory.');
  return realDirectory;
}

function fullRepairBudgetPaths(cwd = process.cwd(), runId) {
  const safeRunId = assertSafeIdentifier(runId, 'Full repair budget run ID');
  const common = gitCommonDir(cwd);
  const directory = fullRepairBudgetDirectory(common);
  const filePath = path.resolve(directory, `${safeRunId}.json`);
  if (path.dirname(filePath) !== directory) throw new Error('Unsafe Full repair-budget path.');
  assertNotSymlink(filePath, 'Full repair-budget record');
  return { common, directory, filePath };
}

function fullRepairSleep(milliseconds) {
  const view = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(view, 0, 0, milliseconds);
}

function fullRepairLockIsStale(lockDirectory) {
  try {
    const owner = JSON.parse(fs.readFileSync(path.join(lockDirectory, 'owner.json'), 'utf8'));
    if (Number.isInteger(owner.pid) && owner.pid > 0) {
      try {
        process.kill(owner.pid, 0);
        return false;
      } catch (error) {
        if (error.code === 'EPERM') return false;
      }
    }
  } catch (error) {
    try {
      return Date.now() - fs.statSync(lockDirectory).mtimeMs >= 1000;
    } catch (statError) {
      return true;
    }
  }
  return true;
}

function withFullRepairBudgetLock(cwd, fn) {
  const common = gitCommonDir(cwd);
  const directory = fullRepairBudgetDirectory(common);
  const lockDirectory = path.join(directory, 'mutation.lock');
  const deadline = Date.now() + FULL_REPAIR_LOCK_WAIT_MS;
  while (true) {
    try {
      fs.mkdirSync(lockDirectory, { mode: 0o700 });
      fs.writeFileSync(path.join(lockDirectory, 'owner.json'), `${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })}\n`, { flag: 'wx', mode: 0o600 });
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (fullRepairLockIsStale(lockDirectory)) {
        fs.rmSync(lockDirectory, { recursive: true, force: true });
        continue;
      }
      if (Date.now() >= deadline) throw new Error('Timed out waiting for the shared Full repair-budget authority lock.');
      fullRepairSleep(FULL_REPAIR_LOCK_POLL_MS);
    }
  }
  try {
    return fn();
  } finally {
    fs.rmSync(lockDirectory, { recursive: true, force: true });
  }
}

function assertFullRepairBudgetRef(value) {
  assertOnlyKeys(value, ['sessionId', 'runId', 'candidateId'], 'Full repair budget reference');
  return {
    sessionId: assertSafeIdentifier(value.sessionId, 'Full repair budget session ID'),
    runId: assertSafeIdentifier(value.runId, 'Full repair budget run ID'),
    candidateId: assertSafeIdentifier(value.candidateId, 'Full repair budget candidate ID'),
  };
}

function assertFullRepairBudgetRecord(value, expectedRef) {
  assertOnlyKeys(value, ['schemaVersion', 'sessionId', 'runId', 'candidateId', 'decisionVersion', 'issuedAt', 'deadlineAt', 'repairCount', 'maxRepairs', 'state', 'stoppedReason'], 'Full repair-budget record');
  if (value.schemaVersion !== FULL_REPAIR_BUDGET_SCHEMA_VERSION) throw new Error('Full repair-budget record has an unsupported schema version.');
  const ref = {
    sessionId: assertSafeIdentifier(value.sessionId, 'Full repair budget session ID'),
    runId: assertSafeIdentifier(value.runId, 'Full repair budget run ID'),
    candidateId: assertSafeIdentifier(value.candidateId, 'Full repair budget candidate ID'),
  };
  const decisionVersion = assertSafeIdentifier(value.decisionVersion, 'Full repair budget decision version');
  if (!Number.isFinite(value.issuedAt) || !Number.isFinite(value.deadlineAt) || value.deadlineAt !== value.issuedAt + FULL_REPAIR_BUDGET_DURATION_MS) throw new Error('Full repair-budget record has an invalid trusted deadline.');
  if (!Number.isInteger(value.repairCount) || value.repairCount < 0 || value.repairCount > FULL_REPAIR_MAX_REPAIRS || value.maxRepairs !== FULL_REPAIR_MAX_REPAIRS) throw new Error('Full repair-budget record has an invalid repair limit.');
  if (!['active', 'stopped', 'closed'].includes(value.state)) throw new Error('Full repair-budget record has an invalid state.');
  if (!(value.stoppedReason === null || (typeof value.stoppedReason === 'string' && value.stoppedReason.trim()))) throw new Error('Full repair-budget record has an invalid stopped reason.');
  if ((value.state === 'active') !== (value.stoppedReason === null)) throw new Error('Full repair-budget record state and stopped reason disagree.');
  if (expectedRef && (ref.sessionId !== expectedRef.sessionId || ref.runId !== expectedRef.runId || ref.candidateId !== expectedRef.candidateId)) throw new Error('Full repair-budget reference does not match its durable record.');
  return { ...value, ...ref, decisionVersion };
}

function readFullRepairBudgetRecord(cwd, ref) {
  const paths = fullRepairBudgetPaths(cwd, ref.runId);
  if (!fs.existsSync(paths.filePath)) throw new Error(`Full repair budget ${ref.runId} was not issued by this session.`);
  let record;
  try {
    record = JSON.parse(fs.readFileSync(paths.filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Full repair budget ${ref.runId} is not valid durable JSON: ${error.message}`);
  }
  return { paths, record: assertFullRepairBudgetRecord(record, ref) };
}

function writeExclusiveJson(filePath, value) {
  const directory = path.dirname(filePath);
  const temporary = path.join(directory, `.${path.basename(filePath)}.${process.pid}.${crypto.randomBytes(8).toString('hex')}.tmp`);
  const descriptor = fs.openSync(temporary, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
  try {
    fs.writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
  try {
    fs.linkSync(temporary, filePath);
    fsyncDirectory(directory);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

function fsyncDirectory(directory) {
  const descriptor = fs.openSync(directory, fs.constants.O_RDONLY | fs.constants.O_DIRECTORY);
  try {
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
}

function replaceFullRepairBudgetRecord(filePath, value) {
  assertNotSymlink(filePath, 'Full repair-budget record');
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${crypto.randomBytes(8).toString('hex')}.tmp`);
  const descriptor = fs.openSync(temporary, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
  try {
    fs.writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
  try {
    fs.renameSync(temporary, filePath);
    fsyncDirectory(path.dirname(filePath));
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

function fullRepairBudgetRecords(cwd) {
  const { directory } = fullRepairBudgetPaths(cwd, 'records-scan');
  return fs.readdirSync(directory)
    .filter(name => name.endsWith('.json'))
    .map(name => {
      const runId = path.basename(name, '.json');
      const filePath = path.join(directory, name);
      assertSafeIdentifier(runId, 'Full repair budget run ID');
      assertNotSymlink(filePath, 'Full repair-budget record');
      return readFullRepairBudgetRecord(cwd, { runId, sessionId: JSON.parse(fs.readFileSync(filePath, 'utf8')).sessionId, candidateId: JSON.parse(fs.readFileSync(filePath, 'utf8')).candidateId }).record;
    });
}

function withFullRepairSessionLock(cwd, sessionId, fn) {
  const { withSessionMutationLock } = require('./fb-session.cjs');
  return withSessionMutationLock(cwd, sessionId, fn);
}

function authoritativeFullBfmAuthority(cwd, sessionId) {
  return require('./fb-session.cjs').readFullBfmAuthority(cwd, sessionId);
}

function issueFullRepairBudget(cwd = process.cwd(), input = {}) {
  assertOnlyKeys(input, ['sessionId', 'runId', 'candidateId'], 'Full repair-budget issuance');
  const ref = {
    sessionId: assertSafeIdentifier(input.sessionId, 'Full repair budget session ID'),
    runId: assertSafeIdentifier(input.runId, 'Full repair budget run ID'),
    candidateId: assertSafeIdentifier(input.candidateId, 'Full repair budget candidate ID'),
  };
  return withFullRepairSessionLock(cwd, ref.sessionId, () => withFullRepairBudgetLock(cwd, () => {
    const authority = authoritativeFullBfmAuthority(cwd, ref.sessionId);
    const { filePath } = fullRepairBudgetPaths(cwd, ref.runId);
    if (fs.existsSync(filePath)) throw new Error(`Full repair budget for run ${ref.runId} is already issued and cannot be reset.`);
    if (fullRepairBudgetRecords(cwd).some(record => record.candidateId === ref.candidateId)) throw new Error(`Full repair budget for candidate ${ref.candidateId} is already issued and cannot be reset.`);
    const issuedAt = Date.now();
    const record = {
      schemaVersion: FULL_REPAIR_BUDGET_SCHEMA_VERSION,
      ...ref,
      decisionVersion: authority.decisionVersion,
      issuedAt,
      deadlineAt: issuedAt + FULL_REPAIR_BUDGET_DURATION_MS,
      repairCount: 0,
      maxRepairs: FULL_REPAIR_MAX_REPAIRS,
      state: 'active',
      stoppedReason: null,
    };
    writeExclusiveJson(filePath, record);
    return ref;
  }));
}

function readFullRepairBudget(cwd = process.cwd(), budgetRef) {
  const ref = assertFullRepairBudgetRef(budgetRef);
  return { ...readFullRepairBudgetRecord(cwd, ref).record };
}

function stopFullRepairBudget(filePath, record, reason) {
  const stopped = { ...record, state: 'stopped', stoppedReason: reason };
  replaceFullRepairBudgetRecord(filePath, stopped);
  return { status: 'stopped', budgetRef: { sessionId: stopped.sessionId, runId: stopped.runId, candidateId: stopped.candidateId }, productBoundary: `Product boundary: ${reason}` };
}

function advanceFullRepairBudget(cwd = process.cwd(), input = {}) {
  assertOnlyKeys(input, ['budgetRef', 'materialProgress', 'event'], 'Full repair-budget advancement');
  const ref = assertFullRepairBudgetRef(input.budgetRef);
  if (typeof input.materialProgress !== 'boolean') throw new Error('Full repair-budget advancement requires an evaluated material-progress result.');
  assertOnlyKeys(input.event, [], 'Full repair-budget advancement event');
  return withFullRepairSessionLock(cwd, ref.sessionId, () => withFullRepairBudgetLock(cwd, () => {
    const { paths, record } = readFullRepairBudgetRecord(cwd, ref);
    if (record.state !== 'active') return { status: 'stopped', budgetRef: ref, productBoundary: `Product boundary: Full repair budget is already ${record.state}; ${record.stoppedReason}` };
    let authority;
    try {
      authority = authoritativeFullBfmAuthority(cwd, ref.sessionId);
    } catch (error) {
      return stopFullRepairBudget(paths.filePath, record, `Full BFM session authority is no longer active; ${error.message}`);
    }
    if (authority.decisionVersion !== record.decisionVersion) return stopFullRepairBudget(paths.filePath, record, 'Product or user decision version changed; issue a new approved execution session.');
    if (Date.now() >= record.deadlineAt) return stopFullRepairBudget(paths.filePath, record, 'Full repair deadline is exhausted; choose the next approved execution slice.');
    if (!input.materialProgress) return stopFullRepairBudget(paths.filePath, record, 'Stopped after one cycle with no material progress; Product direction is required.');
    if (record.repairCount >= record.maxRepairs) return stopFullRepairBudget(paths.filePath, record, 'A third Full repair is blocked; Product direction is required.');
    const updated = { ...record, repairCount: record.repairCount + 1 };
    replaceFullRepairBudgetRecord(paths.filePath, updated);
    return { status: 'progressed', budgetRef: ref };
  }));
}

function closeFullRepairBudget(cwd = process.cwd(), budgetRef, reason = 'Full execution session closed.') {
  const ref = assertFullRepairBudgetRef(budgetRef);
  if (typeof reason !== 'string' || !reason.trim() || CREDENTIAL_MATERIAL.test(reason)) throw new Error('Full repair-budget close requires a privacy-safe reason.');
  return withFullRepairBudgetLock(cwd, () => {
    const { paths, record } = readFullRepairBudgetRecord(cwd, ref);
    if (record.state === 'active') replaceFullRepairBudgetRecord(paths.filePath, { ...record, state: 'closed', stoppedReason: reason.trim() });
    return readFullRepairBudget(cwd, ref);
  });
}

function closeFullRepairBudgetsForSession(cwd = process.cwd(), sessionId, reason = 'Full execution session closed.') {
  const safeSessionId = assertSafeIdentifier(sessionId, 'Full repair budget session ID');
  if (typeof reason !== 'string' || !reason.trim() || CREDENTIAL_MATERIAL.test(reason)) throw new Error('Full repair-budget close requires a privacy-safe reason.');
  return withFullRepairBudgetLock(cwd, () => fullRepairBudgetRecords(cwd)
    .filter(record => record.sessionId === safeSessionId && record.state === 'active')
    .map(record => {
      const { filePath } = fullRepairBudgetPaths(cwd, record.runId);
      replaceFullRepairBudgetRecord(filePath, { ...record, state: 'closed', stoppedReason: reason.trim() });
      return record.runId;
    }));
}

function stringArray(value, label) {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim())) {
    throw new Error(`${label} must be an array of non-empty strings.`);
  }
  return value;
}

function flatValue(value) {
  return value === null
    || ['string', 'number', 'boolean'].includes(typeof value)
    || (Array.isArray(value) && value.every(item => typeof item === 'string'));
}

function validateStageEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('Stage event must be a flat object.');
  for (const field of REQUIRED_EVENT_FIELDS) {
    if (!Object.hasOwn(event, field)) throw new Error(`Stage event is missing required field ${field}.`);
  }
  for (const [key, value] of Object.entries(event)) {
    if (!USAGE_FIELDS.has(key) && FORBIDDEN_KEY.test(key)) throw new Error(`Stage event contains forbidden privacy field ${key}.`);
    if (!flatValue(value)) throw new Error(`Stage event must be flat; nested value at ${key} is not allowed.`);
    const values = Array.isArray(value) ? value : [value];
    if (values.some(item => typeof item === 'string' && CREDENTIAL_MATERIAL.test(item))) {
      throw new Error(`Stage event contains forbidden credential material at ${key}.`);
    }
  }
  if (event.schemaVersion !== SCHEMA_VERSION) throw new Error(`Stage event schemaVersion must be ${SCHEMA_VERSION}.`);
  assertSafeIdentifier(event.eventId, 'event ID');
  assertSafeIdentifier(event.runId, 'run ID');
  if (typeof event.timestamp !== 'string' || Number.isNaN(Date.parse(event.timestamp))) throw new Error('Stage event timestamp must be an ISO-compatible date string.');
  if (!Number.isInteger(event.attempt) || event.attempt < 0) throw new Error('Stage event attempt must be a non-negative integer.');
  stringArray(event.criteriaIds, 'Stage event criteriaIds');
  stringArray(event.evidenceRefs, 'Stage event evidenceRefs');
  for (const field of USAGE_FIELDS) {
    if (!(event[field] === 'unavailable' || (typeof event[field] === 'number' && Number.isFinite(event[field]) && event[field] >= 0))) {
      throw new Error(`Stage event ${field} must be an authoritative non-negative value or unavailable.`);
    }
  }
  return { ...event, criteriaIds: [...event.criteriaIds], evidenceRefs: [...event.evidenceRefs] };
}

function appendStageEvent(cwd = process.cwd(), event) {
  const validated = validateStageEvent(event);
  const target = eventLogPath(cwd, validated.runId);
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  const descriptor = fs.openSync(target, 'a', 0o600);
  try {
    fs.writeSync(descriptor, `${JSON.stringify(validated)}\n`, null, 'utf8');
  } finally {
    fs.closeSync(descriptor);
  }
  return validated;
}

function readStageEvents(cwd = process.cwd(), runId) {
  const target = eventLogPath(cwd, runId);
  if (!fs.existsSync(target)) return [];
  return fs.readFileSync(target, 'utf8').split(/\r?\n/).filter(Boolean).map((line, index) => {
    let event;
    try {
      event = JSON.parse(line);
    } catch (error) {
      throw new Error(`Stage event log ${runId} has invalid JSON on line ${index + 1}.`);
    }
    return validateStageEvent(event);
  });
}

function refs(...groups) {
  return [...new Set(groups.flat().filter(value => typeof value === 'string' && value.trim()))];
}

function ruleMatches(rule, input) {
  const when = rule && rule.when;
  if (!when || typeof when !== 'object' || Array.isArray(when)) throw new Error('Deterministic route rules require a flat when object.');
  for (const [key, expected] of Object.entries(when)) {
    if (typeof expected !== 'string' || !expected) throw new Error(`Route rule ${rule.id || '(unnamed)'} has an invalid ${key} matcher.`);
    if (key === 'descriptionIncludes' && !String(input.description || '').includes(expected)) return false;
    if (key === 'artifactRefIncludes' && !String(input.artifactRef || '').includes(expected)) return false;
    if (key === 'metadataRefIncludes' && !String(input.metadataRef || '').includes(expected)) return false;
    if (key === 'criteriaId' && !input.criteriaIds.includes(expected)) return false;
    if (key === 'costRisk' && input.costRisk !== expected) return false;
    if (key === 'degradationRisk' && input.degradationRisk !== expected) return false;
    if (!['descriptionIncludes', 'artifactRefIncludes', 'metadataRefIncludes', 'criteriaId', 'costRisk', 'degradationRisk'].includes(key)) throw new Error(`Route rule matcher ${key} is not deterministic.`);
  }
  return true;
}

function routeArtifact(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Routing input must be an object.');
  if (typeof input.artifactRef !== 'string' || !input.artifactRef.trim()) throw new Error('Routing requires an artifactRef.');
  const criteriaIds = input.criteriaIds === undefined ? [] : stringArray(input.criteriaIds, 'Routing criteriaIds');
  const baselineRef = input.artifactRef;
  const baseRefs = refs(input.artifactRef, input.metadataRef);
  const safetyTriggers = input.safetyTriggers === undefined ? [] : stringArray(input.safetyTriggers, 'Routing safetyTriggers');
  if (safetyTriggers.length) return {
    decision: 'judgment_required',
    reason: 'Safety trigger requires judgment before any transformation.',
    evidenceRefs: refs(baseRefs, safetyTriggers.map(trigger => `safety:${trigger}`)),
    baselineRef,
    candidateRef: null,
    transformationComputeAvoided: true,
  };
  if (input.degradationRisk === 'high') return {
    decision: 'skip',
    reason: 'High degradation risk preserves the baseline artifact.',
    evidenceRefs: refs(baseRefs, 'risk:degradation-high'),
    baselineRef,
    candidateRef: baselineRef,
    transformationComputeAvoided: true,
  };
  const rules = input.routeRules === undefined ? [] : input.routeRules;
  if (!Array.isArray(rules)) throw new Error('Routing routeRules must be an array.');
  const matches = rules.filter(rule => {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) throw new Error('Each route rule must be an object.');
    assertSafeIdentifier(rule.id, 'route rule ID');
    if (!['process', 'skip'].includes(rule.decision)) throw new Error(`Route rule ${rule.id} must decide process or skip.`);
    stringArray(rule.evidenceRefs || [], `Route rule ${rule.id} evidenceRefs`);
    return ruleMatches(rule, { ...input, criteriaIds });
  });
  if (matches.length !== 1) return {
    decision: 'judgment_required',
    reason: matches.length ? 'Ambiguous deterministic route rules require judgment.' : 'No deterministic route rule matched; judgment is required.',
    evidenceRefs: refs(baseRefs, matches.flatMap(rule => rule.evidenceRefs)),
    baselineRef,
    candidateRef: null,
    transformationComputeAvoided: true,
  };
  const rule = matches[0];
  const skip = rule.decision === 'skip';
  return {
    decision: rule.decision,
    reason: `Matched deterministic route rule ${rule.id}.`,
    evidenceRefs: refs(baseRefs, rule.evidenceRefs),
    baselineRef,
    candidateRef: skip ? baselineRef : null,
    transformationComputeAvoided: skip,
  };
}

function compareBaseline(input = {}) {
  if (!input || !Array.isArray(input.criteria) || !input.criteria.length) throw new Error('Baseline comparison requires one or more criteria.');
  let candidateBetter = false;
  let baselineBetter = false;
  let blockedReason = '';
  const criteria = input.criteria.map(item => {
    if (!item || typeof item !== 'object' || !item.id) throw new Error('Each comparison criterion requires an id.');
    const required = item.required !== false;
    const baseline = item.baseline || {};
    const candidate = item.candidate || {};
    if (!['pass', 'fail'].includes(baseline.result) || !['pass', 'fail'].includes(candidate.result)) throw new Error(`Criterion ${item.id} needs pass or fail baseline and candidate results.`);
    const baselineEvidenceRefs = stringArray(baseline.evidenceRefs || [], `Criterion ${item.id} baseline evidenceRefs`);
    const candidateEvidenceRefs = stringArray(candidate.evidenceRefs || [], `Criterion ${item.id} candidate evidenceRefs`);
    if (required && (!baselineEvidenceRefs.length || !candidateEvidenceRefs.length)) blockedReason = `Required criterion ${item.id} lacks baseline or candidate evidence.`;
    if (baseline.result === 'fail' && candidate.result === 'pass') candidateBetter = true;
    if (baseline.result === 'pass' && candidate.result === 'fail') baselineBetter = true;
    return { id: item.id, required, baseline: baseline.result, candidate: candidate.result, baselineEvidenceRefs, candidateEvidenceRefs };
  });
  const verdict = blockedReason ? 'blocked' : candidateBetter && !baselineBetter ? 'candidate' : baselineBetter && !candidateBetter ? 'baseline' : 'tie';
  return blockedReason ? { criteria, verdict, blockedReason } : { criteria, verdict };
}

function aggregateGates(input = {}) {
  const selectedGates = input.selectedGates || [];
  const gates = input.gates || [];
  if (!Array.isArray(selectedGates) || !Array.isArray(gates)) throw new Error('Gate aggregation requires selectedGates and gates arrays.');
  const selected = [...new Set(selectedGates)];
  if (!selected.length || selected.some(id => !GATE_IDS.has(id))) throw new Error('Selected gates must use focused, comparison, safety, integration, or release.');
  if (selected.length !== selectedGates.length) throw new Error('Selected gates must not repeat.');
  const byId = new Map();
  for (const gate of gates) {
    if (!gate || !GATE_IDS.has(gate.id) || !['passed', 'failed', 'unresolved'].includes(gate.result)) throw new Error('Each gate requires a supported id and passed, failed, or unresolved result.');
    if (byId.has(gate.id)) throw new Error(`Gate ${gate.id} is duplicated.`);
    byId.set(gate.id, { id: gate.id, result: gate.result, evidenceRefs: stringArray(gate.evidenceRefs || [], `Gate ${gate.id} evidenceRefs`) });
  }
  const seenEvidence = new Set();
  for (const id of selected) {
    const gate = byId.get(id);
    if (!gate) throw new Error(`Selected gate ${id} is missing.`);
    if (!gate.evidenceRefs.length) throw new Error(`Selected gate ${id} requires evidence references.`);
    for (const evidence of gate.evidenceRefs) {
      if (seenEvidence.has(evidence)) throw new Error('Selected gates require distinct evidence references.');
      seenEvidence.add(evidence);
    }
  }
  const unresolvedRequiredGates = selected.filter(id => byId.get(id).result === 'unresolved');
  const failedRequiredGates = selected.filter(id => byId.get(id).result === 'failed');
  return {
    gates: selected.map(id => byId.get(id)),
    readyToShip: unresolvedRequiredGates.length === 0 && failedRequiredGates.length === 0,
    unresolvedRequiredGates,
    failedRequiredGates,
  };
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value;
}

function assertOnlyKeys(value, allowed, label) {
  assertPlainObject(value, label);
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`${label} contains an uncurated or unknown field ${key}.`);
  }
}

function assertPrivacySafeValue(value, label) {
  if (typeof value === 'string') {
    if (CREDENTIAL_MATERIAL.test(value)) throw new Error(`${label} contains forbidden credential material.`);
    return value;
  }
  if (value === null || ['number', 'boolean', 'undefined'].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map((item, index) => assertPrivacySafeValue(item, `${label}[${index}]`));
  assertPlainObject(value, label);
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_KEY.test(key)) throw new Error(`${label} contains forbidden privacy field ${key}.`);
    assertPrivacySafeValue(item, `${label}.${key}`);
  }
  return value;
}

function assertRepositoryRelativePath(value, label) {
  if (typeof value !== 'string' || !value || value.includes('\0') || path.posix.isAbsolute(value) || path.win32.isAbsolute(value)) {
    throw new Error(`${label} must be a safe repository-relative path.`);
  }
  const segments = value.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..' || segment.includes('\\'))) {
    throw new Error(`${label} must be a safe repository-relative path.`);
  }
  return value;
}

function assertSha256(value, label) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/i.test(value)) throw new Error(`${label} must be a SHA256 hash.`);
  return value.toLowerCase();
}

function uniqueStringArray(value, label, allowEmpty = false) {
  stringArray(value, label);
  if (!allowEmpty && !value.length) throw new Error(`${label} must not be empty.`);
  if (new Set(value).size !== value.length) throw new Error(`${label} must not repeat values.`);
  return [...value];
}

function manifestHash(manifest) {
  return crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
}

function hashBytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function serializeJson(value) {
  assertPrivacySafeValue(value, 'Serialized configuration');
  return `${JSON.stringify(value, null, 2)}\n`;
}

function assertEvidenceRef(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty evidence reference.`);
  return assertPrivacySafeValue(value, label);
}

function validateProfileManifest(manifest) {
  assertPrivacySafeValue(manifest, 'Profile manifest');
  assertOnlyKeys(manifest, ['schemaVersion', 'profiles'], 'Profile manifest');
  if (manifest.schemaVersion !== 'fb-profile-manifest-v1') throw new Error('Profile manifest schemaVersion must be fb-profile-manifest-v1.');
  if (!Array.isArray(manifest.profiles) || !manifest.profiles.length) throw new Error('Profile manifest requires one or more profiles.');
  const ids = new Set();
  const profiles = manifest.profiles.map((profile, index) => {
    assertOnlyKeys(profile, ['id', 'promptRef', 'configRef', 'baselineHash'], `Profile manifest profile ${index}`);
    const id = assertSafeIdentifier(profile.id, 'profile ID');
    if (ids.has(id)) throw new Error(`Profile manifest repeats profile ID ${id}.`);
    ids.add(id);
    return {
      id,
      promptRef: assertRepositoryRelativePath(profile.promptRef, `Profile ${id} promptRef`),
      configRef: assertRepositoryRelativePath(profile.configRef, `Profile ${id} configRef`),
      baselineHash: assertSha256(profile.baselineHash, `Profile ${id} baselineHash`),
    };
  });
  return { schemaVersion: manifest.schemaVersion, profiles };
}

function validateGoldenFixtureManifest(manifest) {
  assertPrivacySafeValue(manifest, 'Golden-fixture manifest');
  assertOnlyKeys(manifest, ['schemaVersion', 'cases'], 'Golden-fixture manifest');
  if (manifest.schemaVersion !== 'fb-golden-fixture-manifest-v1') throw new Error('Golden-fixture manifest schemaVersion must be fb-golden-fixture-manifest-v1.');
  if (!Array.isArray(manifest.cases) || !manifest.cases.length) throw new Error('Golden-fixture manifest requires one or more cases.');
  const ids = new Set();
  const cases = manifest.cases.map((item, index) => {
    assertOnlyKeys(item, ['id', 'label', 'artifactRef', 'criteriaIds', 'mustPass', 'mustNotHappen'], `Golden-fixture case ${index}`);
    const id = assertSafeIdentifier(item.id, 'golden case ID');
    if (ids.has(id)) throw new Error(`Golden-fixture manifest repeats case ID ${id}.`);
    ids.add(id);
    if (typeof item.label !== 'string' || !item.label.trim()) throw new Error(`Golden case ${id} requires a human-readable label.`);
    const criteriaIds = uniqueStringArray(item.criteriaIds, `Golden case ${id} criteriaIds`);
    const mustPass = uniqueStringArray(item.mustPass, `Golden case ${id} mustPass`, true);
    const mustNotHappen = uniqueStringArray(item.mustNotHappen, `Golden case ${id} mustNotHappen`, true);
    if (mustPass.some(criterion => !criteriaIds.includes(criterion))) throw new Error(`Golden case ${id} mustPass criteria must be listed in criteriaIds.`);
    return {
      id,
      label: item.label,
      artifactRef: assertRepositoryRelativePath(item.artifactRef, `Golden case ${id} artifactRef`),
      criteriaIds,
      mustPass,
      mustNotHappen,
    };
  });
  return { schemaVersion: manifest.schemaVersion, cases };
}

function validateCuratedFailure(item, index) {
  assertPrivacySafeValue(item, `Observed failure ${index}`);
  assertOnlyKeys(item, ['kind', 'evidenceRef'], `Observed failure ${index}`);
  if (!['build', 'brief', 'eval', 'environment'].includes(item.kind)) throw new Error(`Observed failure ${index} has an unsupported kind.`);
  return { kind: item.kind, evidenceRef: assertEvidenceRef(item.evidenceRef, `Observed failure ${index} evidenceRef`) };
}

function diagnoseConfiguration(input = {}) {
  assertOnlyKeys(input, ['stageEvents', 'evalEvidence', 'candidateDiff', 'observedFailures'], 'Configuration diagnosis input');
  if (!Array.isArray(input.stageEvents) || !Array.isArray(input.evalEvidence) || !Array.isArray(input.observedFailures)) throw new Error('Configuration diagnosis accepts curated stageEvents, evalEvidence, and observedFailures arrays only.');
  const stageEvents = input.stageEvents.map(validateStageEvent);
  const evalEvidence = input.evalEvidence.map((item, index) => {
    assertOnlyKeys(item, ['result', 'evidenceRef'], `Eval evidence ${index}`);
    if (!['passed', 'failed'].includes(item.result)) throw new Error(`Eval evidence ${index} must contain a result and evidenceRef.`);
    return { result: item.result, evidenceRef: assertEvidenceRef(item.evidenceRef, `Eval evidence ${index} evidenceRef`) };
  });
  assertOnlyKeys(input.candidateDiff, ['changedPaths', 'evidenceRefs'], 'Candidate diff');
  const candidateDiff = {
    changedPaths: uniqueStringArray(input.candidateDiff.changedPaths, 'Candidate diff changedPaths').map(value => assertRepositoryRelativePath(value, 'Candidate diff changedPath')),
    evidenceRefs: uniqueStringArray(input.candidateDiff.evidenceRefs, 'Candidate diff evidenceRefs').map(value => assertEvidenceRef(value, 'Candidate diff evidenceRef')),
  };
  const observedFailures = input.observedFailures.map(validateCuratedFailure);
  const kinds = new Set(observedFailures.map(item => item.kind));
  const failureClass = kinds.has('build') || stageEvents.some(event => event.failureClass === 'build')
    ? 'Build failure'
    : kinds.has('brief') || stageEvents.some(event => event.failureClass === 'brief')
      ? 'Brief failure'
      : kinds.has('eval') || evalEvidence.some(item => item.result === 'failed') || stageEvents.some(event => event.failureClass === 'eval')
        ? 'Eval failure'
        : kinds.has('environment') || stageEvents.some(event => event.failureClass === 'environment')
          ? 'Environment failure'
          : null;
  if (!failureClass) throw new Error('Configuration diagnosis requires curated observed failure or failed eval evidence.');
  return {
    failureClass,
    evidenceRefs: refs(candidateDiff.evidenceRefs, evalEvidence.map(item => item.evidenceRef), observedFailures.map(item => item.evidenceRef), stageEvents.flatMap(event => event.evidenceRefs)),
    changedPaths: candidateDiff.changedPaths,
  };
}

function candidateStoreRoot(common) {
  const laneDirectory = path.join(common, 'fb-lane');
  const candidateDirectory = path.join(laneDirectory, 'candidates');
  for (const [directory, label] of [[laneDirectory, 'control-loop store directory'], [candidateDirectory, 'candidate store directory']]) {
    assertNotSymlink(directory, label);
    if (!fs.existsSync(directory)) {
      try {
        fs.mkdirSync(directory, { mode: 0o700 });
      } catch (error) {
        if (!error || error.code !== 'EEXIST') throw error;
      }
    }
    assertNotSymlink(directory, label);
    if (!fs.lstatSync(directory).isDirectory()) throw new Error(`Unsafe ${label}.`);
  }
  if (fs.realpathSync(candidateDirectory) !== candidateDirectory) throw new Error('Unsafe candidate store directory outside the Git common directory.');
  return candidateDirectory;
}

function safeCandidatePath(root, candidateId) {
  const target = path.resolve(root, candidateId);
  if (path.dirname(target) !== root) throw new Error('Unsafe candidate path.');
  return target;
}

function assertSafeCandidateDirectory(directory, label = 'candidate directory') {
  assertNotSymlink(directory, label);
  if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory() || fs.realpathSync(directory) !== directory) throw new Error(`Unsafe ${label}.`);
  return directory;
}

function safeCandidateFile(directory, name) {
  const file = path.join(directory, name);
  if (path.dirname(file) !== directory) throw new Error('Unsafe candidate file path.');
  assertNotSymlink(file, `candidate file ${name}`);
  return file;
}

function candidateDirectoryIdentity(directory) {
  assertSafeCandidateDirectory(directory);
  const stat = fs.lstatSync(directory);
  return { dev: stat.dev, ino: stat.ino };
}

function assertCandidateDirectoryIdentity(directory, expected) {
  assertSafeCandidateDirectory(directory);
  const actual = fs.lstatSync(directory);
  if (actual.dev !== expected.dev || actual.ino !== expected.ino) throw new Error('Claimed candidate directory changed during publication.');
}

function writeCandidateFile(directory, name, content, directoryIdentity, createdFiles) {
  assertCandidateDirectoryIdentity(directory, directoryIdentity);
  const target = safeCandidateFile(directory, name);
  const noFollow = fs.constants.O_NOFOLLOW || 0;
  const descriptor = fs.openSync(target, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | noFollow, 0o600);
  let identity;
  try {
    const opened = fs.fstatSync(descriptor);
    identity = { path: target, dev: opened.dev, ino: opened.ino };
    createdFiles.push(identity);
    fs.writeFileSync(descriptor, content, 'utf8');
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
  assertCandidateDirectoryIdentity(directory, directoryIdentity);
  const written = fs.lstatSync(target);
  if (!written.isFile() || written.isSymbolicLink() || written.dev !== identity.dev || written.ino !== identity.ino) throw new Error(`Candidate file ${name} changed during publication.`);
}

function fsyncCandidateDirectory(directory) {
  const descriptor = fs.openSync(directory, fs.constants.O_RDONLY);
  try {
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
}

function readCandidateFile(directory, name) {
  assertSafeCandidateDirectory(directory);
  const file = safeCandidateFile(directory, name);
  if (!fs.existsSync(file) || !fs.lstatSync(file).isFile()) throw new Error(`Candidate record is incomplete: ${name} is missing.`);
  return fs.readFileSync(file, 'utf8');
}

function parseCandidateJson(directory, name) {
  try {
    return JSON.parse(readCandidateFile(directory, name));
  } catch (error) {
    throw new Error(`Candidate record has invalid ${name}: ${error.message}`);
  }
}

function validateCandidateResult(item, index) {
  assertPrivacySafeValue(item, `Candidate result ${index}`);
  assertOnlyKeys(item, ['caseId', 'result', 'evidenceRefs'], `Candidate result ${index}`);
  return {
    caseId: assertSafeIdentifier(item.caseId, 'candidate result case ID'),
    result: ['pass', 'fail'].includes(item.result) ? item.result : (() => { throw new Error(`Candidate result ${index} must be pass or fail.`); })(),
    evidenceRefs: uniqueStringArray(item.evidenceRefs, `Candidate result ${index} evidenceRefs`).map(value => assertEvidenceRef(value, `Candidate result ${index} evidenceRef`)),
  };
}

function writeCandidateStore(cwd = process.cwd(), input = {}) {
  assertPrivacySafeValue(input, 'Candidate store input');
  assertOnlyKeys(input, ['candidateId', 'profileManifest', 'profileId', 'baselineConfig', 'proposedConfig', 'baselineHash', 'candidateHash', 'fixtureManifest', 'results', 'promotionRecommendation'], 'Candidate store input');
  const candidateId = assertSafeIdentifier(input.candidateId, 'candidate ID');
  const profileId = assertSafeIdentifier(input.profileId, 'profile ID');
  const profileManifest = validateProfileManifest(input.profileManifest);
  const profile = profileManifest.profiles.find(item => item.id === profileId);
  if (!profile) throw new Error(`Candidate profile ${profileId} is not present in the profile manifest.`);
  assertPlainObject(input.baselineConfig, 'Baseline config');
  assertPlainObject(input.proposedConfig, 'Proposed config');
  assertPrivacySafeValue(input.baselineConfig, 'Baseline config');
  assertPrivacySafeValue(input.proposedConfig, 'Proposed config');
  const baselineContent = serializeJson(input.baselineConfig);
  const proposedContent = serializeJson(input.proposedConfig);
  const baselineHash = hashBytes(baselineContent);
  const candidateHash = hashBytes(proposedContent);
  if (assertSha256(input.baselineHash, 'Candidate baselineHash') !== baselineHash || profile.baselineHash !== baselineHash) throw new Error('Candidate baseline hash must match the exact profile-manifest baseline configuration.');
  if (assertSha256(input.candidateHash, 'Candidate candidateHash') !== candidateHash) throw new Error('Candidate hash must match the exact proposed configuration bytes.');
  const fixtureManifest = validateGoldenFixtureManifest(input.fixtureManifest);
  const fixtureContent = `${JSON.stringify(fixtureManifest, null, 2)}\n`;
  if (!Array.isArray(input.results) || input.results.length > fixtureManifest.cases.length) throw new Error('Candidate results must be bounded by the frozen golden case set.');
  const results = input.results.map(validateCandidateResult);
  if (new Set(results.map(item => item.caseId)).size !== results.length) throw new Error('Candidate results must not repeat a case.');
  if (results.some(item => !fixtureManifest.cases.some(fixture => fixture.id === item.caseId))) throw new Error('Candidate results must use only cases in the frozen golden fixture set.');
  if (!['promote', 'hold', 'reject'].includes(input.promotionRecommendation)) throw new Error('Candidate promotionRecommendation must be promote, hold, or reject.');
  const record = {
    candidateId,
    profileId,
    baselineHash,
    candidateHash,
    fixtureManifestHash: hashBytes(fixtureContent),
    results,
    promotionRecommendation: input.promotionRecommendation,
  };
  const recordContent = `${JSON.stringify(record, null, 2)}\n`;
  const common = gitCommonDir(cwd);
  const root = candidateStoreRoot(common);
  const directory = safeCandidatePath(root, candidateId);
  const createdFiles = [];
  let claimedDirectory = false;
  let directoryIdentity;
  let completed = false;
  try {
    if (fs.realpathSync(root) !== root) throw new Error('Unsafe candidate store directory outside the Git common directory.');
    try {
      fs.mkdirSync(directory, { mode: 0o700 });
      claimedDirectory = true;
    } catch (error) {
      if (error && error.code === 'EEXIST') throw new Error(`Candidate ${candidateId} already exists and must remain isolated.`);
      throw error;
    }
    directoryIdentity = candidateDirectoryIdentity(directory);
    writeCandidateFile(directory, 'baseline-config.json', baselineContent, directoryIdentity, createdFiles);
    writeCandidateFile(directory, 'proposed-config.json', proposedContent, directoryIdentity, createdFiles);
    writeCandidateFile(directory, 'fixture-manifest.json', fixtureContent, directoryIdentity, createdFiles);
    writeCandidateFile(directory, 'candidate.json', recordContent, directoryIdentity, createdFiles);
    const commit = `${JSON.stringify({ recordHash: hashBytes(recordContent), baselineHash, candidateHash, fixtureManifestHash: record.fixtureManifestHash }, null, 2)}\n`;
    fsyncCandidateDirectory(directory);
    writeCandidateFile(directory, 'record.commit', commit, directoryIdentity, createdFiles);
    fsyncCandidateDirectory(directory);
    readCandidateStoreDirectory(directory, candidateId);
    fsyncCandidateDirectory(root);
    completed = true;
  } finally {
    if (claimedDirectory && !completed) {
      for (const created of createdFiles.reverse()) {
        if (!fs.existsSync(created.path)) continue;
        const actual = fs.lstatSync(created.path);
        if (actual.isFile() && !actual.isSymbolicLink() && actual.dev === created.dev && actual.ino === created.ino) fs.unlinkSync(created.path);
      }
      if (fs.existsSync(directory)) {
        const actual = fs.lstatSync(directory);
        if (actual.isDirectory() && !actual.isSymbolicLink() && directoryIdentity && actual.dev === directoryIdentity.dev && actual.ino === directoryIdentity.ino) {
          try {
            fs.rmdirSync(directory);
          } catch (error) {
            if (!error || error.code !== 'ENOTEMPTY') throw error;
          }
        }
      }
    }
  }
  return { directory, ...record, fixtureManifest };
}

function readCandidateStoreDirectory(directory, safeId) {
  assertSafeCandidateDirectory(directory);
  const commit = parseCandidateJson(directory, 'record.commit');
  const baselineContent = readCandidateFile(directory, 'baseline-config.json');
  const proposedContent = readCandidateFile(directory, 'proposed-config.json');
  const fixtureContent = readCandidateFile(directory, 'fixture-manifest.json');
  const recordContent = readCandidateFile(directory, 'candidate.json');
  const record = parseCandidateJson(directory, 'candidate.json');
  assertOnlyKeys(record, ['candidateId', 'profileId', 'baselineHash', 'candidateHash', 'fixtureManifestHash', 'results', 'promotionRecommendation'], 'Candidate record');
  if (record.candidateId !== safeId || hashBytes(baselineContent) !== assertSha256(record.baselineHash, 'Candidate record baselineHash') || hashBytes(proposedContent) !== assertSha256(record.candidateHash, 'Candidate record candidateHash') || hashBytes(fixtureContent) !== assertSha256(record.fixtureManifestHash, 'Candidate record fixtureManifestHash')) throw new Error('Candidate record content hashes do not match its immutable stored files.');
  assertOnlyKeys(commit, ['recordHash', 'baselineHash', 'candidateHash', 'fixtureManifestHash'], 'Candidate commit marker');
  if (commit.recordHash !== hashBytes(recordContent) || commit.baselineHash !== record.baselineHash || commit.candidateHash !== record.candidateHash || commit.fixtureManifestHash !== record.fixtureManifestHash) throw new Error('Candidate record commit marker does not match its complete stored record.');
  const fixtureManifest = validateGoldenFixtureManifest(JSON.parse(fixtureContent));
  return { directory, ...record, fixtureManifest };
}

function readCandidateStore(cwd = process.cwd(), candidateId) {
  const safeId = assertSafeIdentifier(candidateId, 'candidate ID');
  const root = candidateStoreRoot(gitCommonDir(cwd));
  return readCandidateStoreDirectory(safeCandidatePath(root, safeId), safeId);
}

function validateBenchmarkRun(run, candidateRecord, label, role) {
  const manifest = candidateRecord.fixtureManifest;
  const expectedHash = candidateRecord.fixtureManifestHash;
  assertOnlyKeys(run, ['runId', 'candidateId', 'profileId', 'configHash', 'fixtureManifestHash', 'settings', 'modelRef', 'limits', 'graderContract', 'results'], `${label} benchmark run`);
  const expectedConfigHash = role === 'baseline' ? candidateRecord.baselineHash : candidateRecord.candidateHash;
  if (assertSafeIdentifier(run.runId, `${label} benchmark run ID`) !== run.runId || run.candidateId !== candidateRecord.candidateId || run.profileId !== candidateRecord.profileId || assertSha256(run.configHash, `${label} benchmark configHash`) !== expectedConfigHash) throw new Error(`${label} benchmark run identity does not match the stored candidate configuration.`);
  if (run.fixtureManifestHash !== expectedHash) throw new Error(`${label} benchmark run does not use the frozen fixture manifest.`);
  assertPlainObject(run.settings, `${label} benchmark settings`);
  assertPlainObject(run.limits, `${label} benchmark limits`);
  assertPrivacySafeValue(run.settings, `${label} benchmark settings`);
  assertOnlyKeys(run.limits, ['maxTokens', 'maxOutputTokens', 'maxDurationMs', 'maxCost', 'maxCases'], `${label} benchmark limits`);
  for (const value of Object.values(run.limits)) {
    if (!(typeof value === 'number' && Number.isFinite(value) && value >= 0)) throw new Error(`${label} benchmark limits must be authoritative non-negative numbers.`);
  }
  assertPrivacySafeValue(run.modelRef, `${label} benchmark modelRef`);
  assertPrivacySafeValue(run.graderContract, `${label} benchmark graderContract`);
  if (typeof run.modelRef !== 'string' || !run.modelRef.trim() || typeof run.graderContract !== 'string' || !run.graderContract.trim()) throw new Error(`${label} benchmark run requires a modelRef and graderContract.`);
  if (!Array.isArray(run.results)) throw new Error(`${label} benchmark run requires results.`);
  const byId = new Map();
  for (const result of run.results) {
    assertOnlyKeys(result, ['caseId', 'criteria', 'observed', 'evidenceRefs'], `${label} benchmark result`);
    const fixture = manifest.cases.find(item => item.id === result.caseId);
    if (!fixture || byId.has(result.caseId)) throw new Error(`${label} benchmark run has duplicate or unknown frozen case results.`);
    assertPlainObject(result.criteria, `${label} benchmark result criteria`);
    const criteriaIds = Object.keys(result.criteria);
    if (criteriaIds.length !== fixture.criteriaIds.length || criteriaIds.some(id => !fixture.criteriaIds.includes(id)) || Object.values(result.criteria).some(value => !['pass', 'fail'].includes(value))) throw new Error(`${label} benchmark result criteria must exactly match the frozen case contract.`);
    byId.set(result.caseId, { caseId: result.caseId, criteria: { ...result.criteria }, observed: uniqueStringArray(result.observed, `${label} benchmark result observed`, true).map(value => assertPrivacySafeValue(value, `${label} benchmark result observed`)), evidenceRefs: uniqueStringArray(result.evidenceRefs, `${label} benchmark result evidenceRefs`).map(value => assertEvidenceRef(value, `${label} benchmark result evidenceRef`)) });
  }
  if (byId.size !== manifest.cases.length) throw new Error(`${label} benchmark run is missing frozen cases or selectively reran the fixture set.`);
  return { runId: run.runId, candidateId: run.candidateId, profileId: run.profileId, configHash: run.configHash, fixtureManifestHash: run.fixtureManifestHash, settings: { ...run.settings }, modelRef: run.modelRef, limits: { ...run.limits }, graderContract: run.graderContract, results: manifest.cases.map(item => byId.get(item.id)) };
}

function compareFrozenBenchmark(cwd = process.cwd(), input = {}) {
  assertOnlyKeys(input, ['candidateId', 'baseline', 'candidate'], 'Frozen benchmark comparison input');
  const candidateRecord = readCandidateStore(cwd, input.candidateId);
  const fixtureManifest = candidateRecord.fixtureManifest;
  const frozenFixtureManifestHash = candidateRecord.fixtureManifestHash;
  const baseline = validateBenchmarkRun(input.baseline, candidateRecord, 'Baseline', 'baseline');
  const candidate = validateBenchmarkRun(input.candidate, candidateRecord, 'Candidate', 'candidate');
  if (baseline.runId === candidate.runId) throw new Error('Baseline and candidate benchmark runs require distinct stable run identities.');
  for (const field of ['settings', 'modelRef', 'limits', 'graderContract']) {
    if (!isDeepStrictEqual(baseline[field], candidate[field])) throw new Error(`Baseline and candidate benchmark ${field} must be identical.`);
  }
  const regressions = [];
  const improvements = [];
  for (const fixture of fixtureManifest.cases) {
    const baselineResult = baseline.results.find(item => item.caseId === fixture.id);
    const candidateResult = candidate.results.find(item => item.caseId === fixture.id);
    for (const criterion of fixture.mustPass) {
      if (baselineResult.criteria[criterion] === 'pass' && candidateResult.criteria[criterion] === 'fail') regressions.push({ caseId: fixture.id, criterionId: criterion, reason: `must-pass criterion ${criterion} regressed from pass to fail.` });
      if (baselineResult.criteria[criterion] === 'fail' && candidateResult.criteria[criterion] === 'pass') improvements.push({ caseId: fixture.id, criterionId: criterion });
    }
    for (const forbidden of fixture.mustNotHappen) {
      if (candidateResult.observed.includes(forbidden)) regressions.push({ caseId: fixture.id, forbidden, reason: `must-not-happen behavior ${forbidden} was observed.` });
    }
  }
  const verdict = regressions.length ? 'baseline' : improvements.length ? 'candidate' : 'tie';
  const benchmarkResultHash = hashBytes(JSON.stringify({ candidateId: candidateRecord.candidateId, frozenFixtureManifestHash, baseline, candidate, regressions, verdict }));
  return { candidateId: candidateRecord.candidateId, frozenFixtureManifestHash, benchmarkResultHash, baseline, candidate, regressions, verdict };
}

function assessCandidateProgress(cwdOrInput = process.cwd(), maybeInput) {
  const cwd = typeof cwdOrInput === 'string' ? cwdOrInput : process.cwd();
  const input = typeof cwdOrInput === 'string' ? maybeInput : cwdOrInput;
  assertOnlyKeys(input, ['previousCandidate', 'candidate', 'repair'], 'Candidate progress input');
  const validateCandidate = (candidate, label) => {
    assertOnlyKeys(candidate, ['candidateId', 'candidateHash', 'evidenceRefs'], label);
    return { candidateId: assertSafeIdentifier(candidate.candidateId, `${label} ID`), candidateHash: assertSha256(candidate.candidateHash, `${label} hash`), evidenceRefs: uniqueStringArray(candidate.evidenceRefs, `${label} evidenceRefs`) };
  };
  const candidate = validateCandidate(input.candidate, 'Candidate');
  const previousCandidate = input.previousCandidate === undefined ? null : validateCandidate(input.previousCandidate, 'Previous candidate');
  assertPrivacySafeValue(input.repair, 'Repair state');
  assertOnlyKeys(input.repair, ['mode', 'changedPaths', 'state', 'budgetRef', 'event'], 'Repair state');
  const repair = input.repair;
  assertPlainObject(repair.event, 'Repair state event');
  if (!['Quick BFM', 'Full BFM'].includes(repair.mode)) throw new Error('Repair state must declare the trusted Quick BFM or Full BFM policy mode.');
  let productBoundary = '';
  const materialProgress = !(previousCandidate && previousCandidate.candidateHash === candidate.candidateHash && isDeepStrictEqual(previousCandidate.evidenceRefs, candidate.evidenceRefs));
  if (repair.mode === 'Full BFM') {
    if (repair.changedPaths !== undefined || repair.state !== undefined || repair.budgetRef === undefined) throw new Error('Full repair requires one durable session-issued budget reference and no caller-controlled state.');
    const budgetRef = assertFullRepairBudgetRef(repair.budgetRef);
    if (budgetRef.candidateId !== candidate.candidateId) throw new Error('Full repair budget reference must match the evaluated candidate.');
    const budget = advanceFullRepairBudget(cwd, { budgetRef, materialProgress, event: repair.event });
    if (budget.status === 'stopped') productBoundary = budget.productBoundary;
    else return { status: 'progressed', candidateId: candidate.candidateId, budgetRef };
  } else if (!materialProgress) productBoundary = 'Product boundary: repeated candidate has no material configuration or evidence change.';
  else if (repair.mode === 'Quick BFM') {
    assertPlainObject(repair.state, 'Repair state state');
    if (!Array.isArray(repair.changedPaths) || !repair.changedPaths.length || quickPolicyForPaths(repair.changedPaths).mode !== 'Quick BFM') throw new Error('Quick repair requires paths governed by the existing Quick BFM policy.');
    const budget = evaluateRunBudget({ ...repair.state, changedPaths: repair.changedPaths }, { ...repair.event, type: 'repair', materialProgress });
    if (budget.blocked) productBoundary = `Product boundary: ${budget.reason}`;
  }
  return productBoundary ? { status: 'stopped', candidateId: candidate.candidateId, productBoundary } : { status: 'progressed', candidateId: candidate.candidateId };
}

function validatePromotion(input = {}) {
  assertPrivacySafeValue(input, 'Promotion validation input');
  assertOnlyKeys(input, ['candidate', 'benchmark', 'approval'], 'Promotion validation input');
  assertOnlyKeys(input.candidate, ['candidateId', 'benchmarkEvidenceRef', 'fixtureManifestHash', 'benchmarkResultHash', 'promotionRecommendation'], 'Promotion candidate');
  assertOnlyKeys(input.benchmark, ['candidateId', 'evidenceRef', 'fixtureManifestHash', 'resultHash', 'verdict'], 'Promotion benchmark');
  if (!input.approval) throw new Error('Promotion requires explicit Product approval tied to the exact candidate and benchmark evidence.');
  assertOnlyKeys(input.approval, ['decision', 'candidateId', 'benchmarkEvidenceRef', 'fixtureManifestHash', 'benchmarkResultHash', 'approvalRef', 'approvedBy'], 'Product approval');
  const candidateId = assertSafeIdentifier(input.candidate.candidateId, 'promotion candidate ID');
  const candidateEvidence = assertEvidenceRef(input.candidate.benchmarkEvidenceRef, 'Promotion candidate benchmarkEvidenceRef');
  const benchmarkEvidence = assertEvidenceRef(input.benchmark.evidenceRef, 'Promotion benchmark evidenceRef');
  const approvalEvidence = assertEvidenceRef(input.approval.benchmarkEvidenceRef, 'Product approval benchmarkEvidenceRef');
  const approvalRef = assertEvidenceRef(input.approval.approvalRef, 'Product approval approvalRef');
  const fixtureManifestHash = assertSha256(input.candidate.fixtureManifestHash, 'Promotion candidate fixtureManifestHash');
  const benchmarkResultHash = assertSha256(input.candidate.benchmarkResultHash, 'Promotion candidate benchmarkResultHash');
  if (!approvalRef) throw new Error('Promotion requires a Product approval reference.');
  if (assertSha256(input.benchmark.fixtureManifestHash, 'Promotion benchmark fixtureManifestHash') !== fixtureManifestHash || assertSha256(input.benchmark.resultHash, 'Promotion benchmark resultHash') !== benchmarkResultHash || assertSha256(input.approval.fixtureManifestHash, 'Product approval fixtureManifestHash') !== fixtureManifestHash || assertSha256(input.approval.benchmarkResultHash, 'Product approval benchmarkResultHash') !== benchmarkResultHash) throw new Error('Promotion approval must match the exact frozen benchmark manifest and result.');
  if (input.candidate.promotionRecommendation !== 'promote' || input.benchmark.verdict !== 'candidate' || input.approval.decision !== 'approve' || input.approval.approvedBy !== 'Product') throw new Error('Promotion requires an exact Product approval for a promotable candidate benchmark.');
  if (input.benchmark.candidateId !== candidateId || input.approval.candidateId !== candidateId || candidateEvidence !== benchmarkEvidence || approvalEvidence !== benchmarkEvidence) throw new Error('Promotion approval must match the exact candidate and benchmark evidence.');
  return { valid: true, promotion: 'product_approved', candidateId, benchmarkEvidenceRef: benchmarkEvidence };
}

function stageEventSummary(cwd = process.cwd()) {
  const common = gitCommonDir(cwd);
  const eventDirectory = ensureEventDirectory(common);
  const files = fs.readdirSync(eventDirectory).filter(name => name.endsWith('.jsonl'));
  let eventCount = 0;
  for (const file of files) eventCount += readStageEvents(cwd, path.basename(file, '.jsonl')).length;
  return { directory: eventDirectory, runCount: files.length, eventCount };
}

function assertStageEventSummaryMarkdown(markdown, cwd = process.cwd()) {
  if (/"schemaVersion"\s*:\s*"fb-stage-event-v1"/i.test(markdown)) {
    throw new Error('Stage event summaries must link to clone-local JSONL and counts only; copied event JSONL payloads are forbidden.');
  }
  const lines = String(markdown).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const linkPattern = /fb-lane\/events\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.jsonl/i;
  const summaryPattern = /^Stage event summary: \[([A-Za-z0-9][A-Za-z0-9._-]{0,127})\]\(fb-lane\/events\/\1\.jsonl\) \((\d+) events?\)\.$/;
  const summaryLines = lines.filter(line => /^Stage event summary\s*:/i.test(line));
  const eventLinkLines = lines.filter(line => linkPattern.test(line));
  if (!summaryLines.length && !eventLinkLines.length) return;
  if (eventLinkLines.length !== summaryLines.length) throw new Error('Stage event log links require the canonical Stage event summary label.');
  for (const line of summaryLines) {
    const match = line.match(summaryPattern);
    if (!match) throw new Error('Stage event summary requires exactly: Stage event summary: [<runId>](fb-lane/events/<runId>.jsonl) (<count> events).');
    const runId = match[1];
    const expectedCount = Number(match[2]);
    if (readStageEvents(cwd, runId).length !== expectedCount) throw new Error(`Stage event summary count for ${runId} does not match its clone-local event log.`);
  }
}

function collectControlLoopDoctorChecks(repoRoot) {
  try {
    const summary = stageEventSummary(repoRoot);
    return [{ level: 'ok', label: 'Control-loop event registry', detail: `${summary.runCount} clone-local run log(s), ${summary.eventCount} validated stage event(s); JSONL remains outside committed Markdown.`, fix: '' }];
  } catch (error) {
    return [{ level: 'fail', label: 'Control-loop event registry', detail: error.message, fix: 'Repair only malformed clone-local event JSONL; retain curated Markdown as links and counts, not copied event payloads.' }];
  }
}

module.exports = {
  SCHEMA_VERSION,
  REQUIRED_EVENT_FIELDS,
  GATE_IDS,
  routeArtifact,
  validateStageEvent,
  appendStageEvent,
  readStageEvents,
  eventLogPath,
  compareBaseline,
  aggregateGates,
  validateProfileManifest,
  validateGoldenFixtureManifest,
  diagnoseConfiguration,
  writeCandidateStore,
  readCandidateStore,
  compareFrozenBenchmark,
  assessCandidateProgress,
  issueFullRepairBudget,
  readFullRepairBudget,
  advanceFullRepairBudget,
  closeFullRepairBudget,
  closeFullRepairBudgetsForSession,
  validatePromotion,
  stageEventSummary,
  assertStageEventSummaryMarkdown,
  collectControlLoopDoctorChecks,
};
