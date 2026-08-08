#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const SCHEMA_VERSION = 'fb-project-learning-v1';
const STATES = new Set(['provisional', 'confirmed', 'revised', 'rejected', 'retired']);
const ACTIVE_STATES = new Set(['provisional', 'confirmed', 'revised']);
const TREATMENTS = new Set([
  'add_context_ref',
  'add_dependency',
  'select_existing_check',
  'recovery_hint',
  'raise_verification_floor',
]);
const SAFETY_CLASSES = new Set(['ordinary', 'sensitive']);
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SAFE_LESSON_ID = /^LESSON-[A-Z0-9]+(?:-[A-Z0-9]+)+$/;
const SAFE_TASK_ID = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9][A-Z0-9-]*)$/;
const FORBIDDEN = /(?:authorization\s*:\s*bearer|api[_-]?key|password|secret|token|private reasoning|chain of thought|transcript)/i;

function assertPlainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error(`${label} must be a plain object.`);
  }
}

function assertOnlyKeys(value, allowed, label) {
  assertPlainObject(value, label);
  const extras = Object.keys(value).filter(key => !allowed.includes(key));
  if (extras.length) throw new Error(`${label} has unsupported field(s): ${extras.join(', ')}.`);
}

function assertPrivateSafe(value, label = 'Learning record') {
  const serialized = JSON.stringify(value);
  if (FORBIDDEN.test(serialized)) throw new Error(`${label} contains secret, credential, transcript, or private reasoning material.`);
}

function text(value, label) {
  const result = String(value || '').trim();
  if (result.length < 12 || result.length > 600 || /^(?:none|n\/a|unknown|tbd|todo)$/i.test(result)) {
    throw new Error(`${label} must be concrete and bounded.`);
  }
  assertPrivateSafe(result, label);
  return result;
}

function safeId(value, label, pattern = SAFE_ID) {
  const result = String(value || '').trim();
  if (!pattern.test(result) || result.includes('..')) throw new Error(`${label} must be a safe identifier.`);
  return result;
}

function evidenceRef(value, label) {
  const result = String(value || '').trim();
  if (!/^(?:docs|config|tests?|src|tools)\/[A-Za-z0-9._/-]+(?:#[a-z0-9-]+)?$/.test(result)
    || result.includes('..') || path.isAbsolute(result)) {
    throw new Error(`${label} must be a safe repository-relative evidence reference.`);
  }
  return result;
}

function stringArray(value, label, validator = item => safeId(item, label)) {
  if (!Array.isArray(value) || !value.length) throw new Error(`${label} must be a non-empty array.`);
  const result = value.map(validator);
  if (new Set(result).size !== result.length) throw new Error(`${label} must not contain duplicates.`);
  return result;
}

function signatureKey(signature) {
  return `${signature.category}/${signature.surface}/${signature.criterion}`;
}

function validateLearningReceipt(input) {
  const keys = [
    'schemaVersion',
    'lessonId', 'runId', 'taskId', 'state', 'signature', 'workTypes', 'cause',
    'currentRepair', 'treatment', 'evidenceRefs', 'owningRecord', 'safetyClass',
    'applications', 'revisionCount', 'active',
  ];
  assertOnlyKeys(input, keys, 'Learning receipt');
  assertPrivateSafe(input);
  if (input.schemaVersion !== undefined && input.schemaVersion !== SCHEMA_VERSION) throw new Error('Learning receipt schema version is invalid.');
  assertOnlyKeys(input.signature, ['category', 'surface', 'criterion'], 'Learning signature');
  assertOnlyKeys(input.treatment, ['type', 'value'], 'Learning treatment');
  const state = String(input.state || '').trim();
  if (!STATES.has(state)) throw new Error('Learning state is invalid.');
  const treatmentType = String(input.treatment.type || '').trim();
  if (!TREATMENTS.has(treatmentType)) throw new Error('Learning treatment type is not allowlisted.');
  const applications = Array.isArray(input.applications) ? input.applications.map(item => safeId(item, 'Learning application run ID')) : [];
  if (new Set(applications).size !== applications.length) throw new Error('Learning applications must use distinct run IDs.');
  const revisionCount = Number(input.revisionCount);
  if (!Number.isInteger(revisionCount) || revisionCount < 0 || revisionCount > 1) throw new Error('Learning revision count must be zero or one.');
  const active = Boolean(input.active);
  if (active !== ACTIVE_STATES.has(state)) throw new Error(`Learning active state conflicts with ${state}.`);
  const safetyClass = String(input.safetyClass || '').trim();
  if (!SAFETY_CLASSES.has(safetyClass)) throw new Error('Learning safety class is invalid.');
  return {
    schemaVersion: SCHEMA_VERSION,
    lessonId: safeId(input.lessonId, 'Learning lesson ID', SAFE_LESSON_ID),
    runId: safeId(input.runId, 'Learning run ID'),
    taskId: safeId(input.taskId, 'Learning task ID', SAFE_TASK_ID),
    state,
    signature: {
      category: safeId(input.signature.category, 'Learning signature category'),
      surface: safeId(input.signature.surface, 'Learning signature surface'),
      criterion: safeId(input.signature.criterion, 'Learning signature criterion'),
    },
    workTypes: stringArray(input.workTypes, 'Learning work types'),
    cause: text(input.cause, 'Learning cause'),
    currentRepair: text(input.currentRepair, 'Learning current repair'),
    treatment: { type: treatmentType, value: safeId(input.treatment.value, 'Learning treatment value') },
    evidenceRefs: stringArray(input.evidenceRefs, 'Learning evidence references', item => evidenceRef(item, 'Learning evidence reference')),
    owningRecord: evidenceRef(input.owningRecord, 'Learning owning record'),
    safetyClass,
    applications,
    revisionCount,
    active,
  };
}

function gitCommonDir(cwd) {
  const value = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  return path.resolve(cwd, value);
}

function learningDirectory(cwd) {
  return path.join(gitCommonDir(cwd), 'fb-lane', 'learning');
}

function observationPath(cwd) {
  return path.join(learningDirectory(cwd), 'observations.jsonl');
}

function pause(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function withLock(directory, fn) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const lock = path.join(directory, '.observations.lock');
  const deadline = Date.now() + 5000;
  while (true) {
    try {
      fs.mkdirSync(lock, { mode: 0o700 });
      break;
    } catch (error) {
      if (error.code !== 'EEXIST' || Date.now() >= deadline) throw new Error('Learning observation registry is busy.');
      pause(10);
    }
  }
  try {
    return fn();
  } finally {
    fs.rmdirSync(lock);
  }
}

function recordLearningObservation(cwd, input) {
  const receipt = validateLearningReceipt(input);
  const directory = learningDirectory(cwd);
  return withLock(directory, () => {
    const target = observationPath(cwd);
    fs.appendFileSync(target, `${JSON.stringify(receipt)}\n`, { encoding: 'utf8', mode: 0o600 });
    return receipt;
  });
}

function readLearningObservations(cwd) {
  const target = observationPath(cwd);
  if (!fs.existsSync(target)) return [];
  return fs.readFileSync(target, 'utf8').split(/\r?\n/).filter(Boolean).map((line, index) => {
    try {
      const parsed = JSON.parse(line);
      const { schemaVersion, ...receipt } = parsed;
      if (schemaVersion !== SCHEMA_VERSION) throw new Error('schema');
      return validateLearningReceipt(receipt);
    } catch (error) {
      throw new Error(`Learning observation JSONL is invalid at line ${index + 1}.`);
    }
  });
}

function registryPath(repoRoot) {
  return path.join(repoRoot, 'docs', 'learning', 'index.md');
}

function renderLearningRegistry(lessons) {
  const validated = lessons.map(validateLearningReceipt);
  const active = new Map();
  for (const lesson of validated.filter(item => item.active)) {
    const key = signatureKey(lesson.signature);
    if (active.has(key)) throw new Error(`Duplicate active learning signature: ${key}.`);
    active.set(key, lesson.lessonId);
  }
  const sections = validated.sort((a, b) => a.lessonId.localeCompare(b.lessonId)).map(lesson => `## ${lesson.lessonId}\nState: ${lesson.state}\nSignature: ${signatureKey(lesson.signature)}\nWork types: ${lesson.workTypes.join(', ')}\nTreatment: ${lesson.treatment.type} — ${lesson.treatment.value}\nApplications: ${lesson.applications.join(', ') || 'none'}\nRevision count: ${lesson.revisionCount}\nSafety class: ${lesson.safetyClass}\nCause: ${lesson.cause}\nCurrent repair: ${lesson.currentRepair}\nOwning record: ${lesson.owningRecord}\nEvidence: ${lesson.evidenceRefs.join(', ')}\nRun ID: ${lesson.runId}\nTask ID: ${lesson.taskId}\nActive: ${lesson.active ? 'yes' : 'no'}\n`);
  return `# FB Project Learning\n\nThis compact registry routes matching future work to authoritative learning evidence.\n\n${sections.join('\n')}`;
}

function writeLearningRegistry(repoRoot, lessons) {
  const target = registryPath(repoRoot);
  const contents = renderLearningRegistry(lessons);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.tmp`);
  fs.writeFileSync(temporary, contents, { encoding: 'utf8', mode: 0o644 });
  fs.renameSync(temporary, target);
  return target;
}

function readLearningRegistry(repoRoot) {
  const target = registryPath(repoRoot);
  if (!fs.existsSync(target)) return [];
  const source = fs.readFileSync(target, 'utf8');
  const units = source.split(/^## /m).slice(1).map(unit => {
    const newline = unit.indexOf('\n');
    return [unit.slice(0, newline).trim(), unit.slice(newline + 1)];
  }).filter(([heading]) => SAFE_LESSON_ID.test(heading));
  return units.map(([lessonId, body]) => {
    const fields = {};
    for (const line of body.trim().split(/\r?\n/)) {
      const field = line.match(/^([^:]+):\s*(.*)$/);
      if (field) fields[field[1]] = field[2];
    }
    const signature = String(fields.Signature || '').split('/');
    const treatment = String(fields.Treatment || '').split(/\s+—\s+/);
    return validateLearningReceipt({
      lessonId,
      runId: fields['Run ID'],
      taskId: fields['Task ID'],
      state: fields.State,
      signature: { category: signature[0], surface: signature[1], criterion: signature[2] },
      workTypes: String(fields['Work types'] || '').split(/,\s*/).filter(Boolean),
      cause: fields.Cause,
      currentRepair: fields['Current repair'],
      treatment: { type: treatment[0], value: treatment[1] },
      evidenceRefs: String(fields.Evidence || '').split(/,\s*/).filter(Boolean),
      owningRecord: fields['Owning record'],
      safetyClass: fields['Safety class'],
      applications: fields.Applications === 'none' ? [] : String(fields.Applications || '').split(/,\s*/).filter(Boolean),
      revisionCount: Number(fields['Revision count']),
      active: fields.Active === 'yes',
    });
  });
}

function selectApplicableLessons(lessons, context = {}) {
  const requested = new Set(Array.isArray(context.workTypes) ? context.workTypes : []);
  return lessons.map(validateLearningReceipt).filter(lesson => lesson.active && lesson.workTypes.some(workType => requested.has(workType)));
}

function upsertLearningRegistry(repoRoot, input) {
  const lesson = validateLearningReceipt(input);
  const existing = readLearningRegistry(repoRoot);
  const next = existing.filter(item => item.lessonId !== lesson.lessonId);
  next.push(lesson);
  writeLearningRegistry(repoRoot, next);
  return lesson;
}

function validateAutomaticTreatment(input) {
  assertOnlyKeys(input, ['type', 'value'], 'Automatic learning treatment');
  const type = String(input.type || '').trim();
  if (!TREATMENTS.has(type)) throw new Error('Automatic learning treatment is not allowlisted.');
  return { type, value: safeId(input.value, 'Automatic learning treatment value') };
}

function validateLearningObservation(input) {
  assertOnlyKeys(input, [
    'result', 'runId', 'kind', 'comparable', 'acceptedOutcome', 'safetyPassed',
    'mustPassPassed', 'evidenceRefs', 'metrics',
  ], 'Learning application observation');
  assertPrivateSafe({ ...input, ...(input.metrics ? { metrics: '[numeric efficiency metrics]' } : {}) }, 'Learning application observation');
  const result = String(input.result || '').trim();
  if (!['helped', 'incomplete', 'failed', 'safety_regression', 'not_comparable'].includes(result)) {
    throw new Error('Learning application result is invalid.');
  }
  const kind = String(input.kind || '').trim();
  if (!['quality', 'efficiency'].includes(kind)) throw new Error('Learning application kind is invalid.');
  let metrics;
  if (kind === 'efficiency') {
    assertOnlyKeys(input.metrics, ['baselineTokens', 'candidateTokens', 'baselineWallMs', 'candidateWallMs'], 'Learning efficiency metrics');
    metrics = {};
    for (const key of ['baselineTokens', 'candidateTokens', 'baselineWallMs', 'candidateWallMs']) {
      const value = Number(input.metrics[key]);
      if (!Number.isFinite(value) || value < 0) throw new Error(`Learning efficiency metric ${key} is invalid.`);
      metrics[key] = value;
    }
  } else if (input.metrics !== undefined) {
    throw new Error('Quality learning observations do not accept efficiency metrics.');
  }
  return {
    result,
    runId: safeId(input.runId, 'Learning application run ID'),
    kind,
    comparable: input.comparable === true,
    acceptedOutcome: input.acceptedOutcome === true,
    safetyPassed: input.safetyPassed === true,
    mustPassPassed: input.mustPassPassed === true,
    evidenceRefs: stringArray(input.evidenceRefs, 'Learning application evidence references', item => evidenceRef(item, 'Learning application evidence reference')),
    ...(metrics ? { metrics } : {}),
  };
}

function efficiencyImprovement(metrics) {
  const tokenGain = metrics.baselineTokens > 0 ? (metrics.baselineTokens - metrics.candidateTokens) / metrics.baselineTokens : 0;
  const wallGain = metrics.baselineWallMs > 0 ? (metrics.baselineWallMs - metrics.candidateWallMs) / metrics.baselineWallMs : 0;
  return Math.max(tokenGain, wallGain);
}

function transitionedLesson(lesson, updates, reason) {
  const next = validateLearningReceipt({ ...lesson, ...updates });
  return { ...next, reason };
}

function evaluateLearningTransition(input = {}) {
  assertOnlyKeys(input, ['lesson', 'observation'], 'Learning transition');
  const { reason: priorReason, ...lessonInput } = input.lesson || {};
  const lesson = validateLearningReceipt(lessonInput);
  const observation = validateLearningObservation(input.observation);
  if (!lesson.active) throw new Error(`Learning lesson ${lesson.lessonId} is inactive and cannot transition automatically.`);
  if (lesson.applications.includes(observation.runId) || lesson.runId === observation.runId) {
    throw new Error('Learning confirmation requires a distinct application run that was not already counted.');
  }
  if (observation.result === 'not_comparable' || !observation.comparable) {
    return transitionedLesson(lesson, {}, 'Comparison was not equivalent; application was not counted.');
  }
  if (observation.result === 'safety_regression' || !observation.safetyPassed) {
    return transitionedLesson(lesson, { state: 'rejected', active: false }, 'Safety regression rejected and deactivated the lesson immediately.');
  }
  if (observation.result === 'failed' || !observation.mustPassPassed || !observation.acceptedOutcome) {
    return transitionedLesson(lesson, { state: 'rejected', active: false }, 'Required outcome or regression proof failed.');
  }
  if (observation.kind === 'efficiency' && efficiencyImprovement(observation.metrics) < 0.10) {
    return transitionedLesson(lesson, { state: 'rejected', active: false }, 'Observed efficiency improvement was below 10%.');
  }
  if (observation.result === 'incomplete') {
    if (lesson.revisionCount >= 1 || lesson.state === 'revised') {
      return transitionedLesson(lesson, { state: 'rejected', active: false }, 'The single permitted lesson revision was exhausted.');
    }
    return transitionedLesson(lesson, { state: 'revised', revisionCount: 1, applications: [...lesson.applications, observation.runId] }, 'The treatment was relevant but incomplete; one revision is permitted.');
  }
  const applications = [...lesson.applications, observation.runId];
  return transitionedLesson(lesson, {
    state: applications.length >= 2 ? 'confirmed' : lesson.state,
    applications,
  }, applications.length >= 2 ? 'Two distinct relevant applications confirmed the lesson.' : 'One helpful application recorded; another is required for confirmation.');
}

function applyLearningObservation(repoRoot, lessonId, input) {
  const safeLessonId = safeId(lessonId, 'Learning lesson ID', SAFE_LESSON_ID);
  const lessons = readLearningRegistry(repoRoot);
  const current = lessons.find(lesson => lesson.lessonId === safeLessonId);
  if (!current) throw new Error(`Learning lesson ${safeLessonId} is not recorded in the durable registry.`);
  const transitioned = evaluateLearningTransition({ lesson: current, observation: input });
  const { reason, ...receipt } = transitioned;
  upsertLearningRegistry(repoRoot, receipt);
  recordLearningObservation(repoRoot, receipt);
  return transitioned;
}

function assertLearningBudget(input = {}) {
  assertOnlyKeys(input, ['runId', 'signature', 'repairBudget', 'activeLessons'], 'Learning budget');
  safeId(input.runId, 'Learning budget run ID');
  assertOnlyKeys(input.signature, ['category', 'surface', 'criterion'], 'Learning budget signature');
  const signature = {
    category: safeId(input.signature.category, 'Learning budget signature category'),
    surface: safeId(input.signature.surface, 'Learning budget signature surface'),
    criterion: safeId(input.signature.criterion, 'Learning budget signature criterion'),
  };
  assertOnlyKeys(input.repairBudget, ['before', 'after', 'limit'], 'Learning repair budget');
  const before = Number(input.repairBudget.before);
  const after = Number(input.repairBudget.after);
  const limit = Number(input.repairBudget.limit);
  if (![before, after, limit].every(Number.isInteger) || before < 0 || after < 0 || limit < 0 || after > limit) {
    throw new Error('Learning repair budget values are invalid.');
  }
  if (after < before) throw new Error('Learning cannot reset or reduce the consumed repair budget.');
  const matching = (Array.isArray(input.activeLessons) ? input.activeLessons : [])
    .map(validateLearningReceipt)
    .filter(lesson => lesson.active && signatureKey(lesson.signature) === signatureKey(signature));
  if (matching.length > 1) throw new Error('Learning permits only one active lesson for a failure signature.');
  return { valid: true, remainingRepairs: limit - after };
}

function renderLearningSummary(lesson) {
  const record = validateLearningReceipt(lesson);
  return `Learning: ${record.state} ${record.lessonId}`;
}

function section(markdown, heading) {
  const pattern = new RegExp(`^## ${heading}\\s*$`, 'gmi');
  const matches = [...String(markdown || '').matchAll(pattern)];
  if (!matches.length) return '';
  const start = matches[matches.length - 1].index + matches[matches.length - 1][0].length;
  const tail = String(markdown).slice(start);
  const end = tail.search(/^##\s+/m);
  return (end >= 0 ? tail.slice(0, end) : tail).trim();
}

function markdownField(body, label) {
  const match = String(body || '').match(new RegExp(`^${label}:\\s*(.+)$`, 'mi'));
  return match ? match[1].trim() : '';
}

function assertLearningCloseoutMarkdown(markdown, repoRoot) {
  if (!/^learning_contract:\s*v1\s*$/im.test(String(markdown || ''))) return { required: false };
  const body = section(markdown, 'Project Learning');
  if (!body) throw new Error('Learning decision is missing: add a ## Project Learning section before completed closeout.');
  const decision = markdownField(body, 'Learning');
  const none = decision.match(/^none\s+—\s+(.+)$/i);
  if (none) {
    text(none[1], 'Learning none reason');
    return { required: true, decision: 'none', reason: none[1].trim() };
  }
  const recorded = decision.match(/^recorded\s+—\s+(LESSON-[A-Z0-9]+(?:-[A-Z0-9]+)+)$/i);
  if (!recorded) throw new Error('Learning decision must be `Learning: none — <concrete reason>` or `Learning: recorded — <lesson ID>`.');
  const lessonId = recorded[1].toUpperCase();
  const registry = markdownField(body, 'Registry');
  const evidence = markdownField(body, 'Evidence');
  const budget = markdownField(body, 'Repair budget');
  if (!new RegExp(`\\[[^\\]]+\\]\\(\\.\\./learning/index\\.md#${lessonId.toLowerCase()}\\)`, 'i').test(registry)) {
    throw new Error(`Project Learning registry link must resolve to ${lessonId}.`);
  }
  if (!/^\[[^\]]+\]\(\.\.\/qa\/[A-Za-z0-9._/-]+(?:#[a-z0-9-]+)?\)$/.test(evidence)) {
    throw new Error('Project Learning evidence must be one repository-relative Markdown QA link.');
  }
  if (!/^unchanged\s+—\s+.{12,}$/i.test(budget)) {
    throw new Error('Project Learning must state that the repair budget remained unchanged with a concrete reason.');
  }
  const lesson = readLearningRegistry(repoRoot).find(item => item.lessonId === lessonId);
  if (!lesson) throw new Error(`Project Learning lesson ${lessonId} is not recorded in docs/learning/index.md.`);
  return { required: true, decision: 'recorded', lessonId, state: lesson.state };
}

function collectLearningDoctorChecks(repoRoot) {
  const target = registryPath(repoRoot);
  if (!fs.existsSync(target)) {
    return [{ level: 'warn', label: 'Project learning', detail: 'docs/learning/index.md is missing.', fix: 'Run FB bootstrap to add the empty learning registry without changing project-owned records.' }];
  }
  try {
    const lessons = readLearningRegistry(repoRoot);
    const observations = readLearningObservations(repoRoot);
    const observed = new Set(observations.map(item => `${item.lessonId}/${item.runId}`));
    const missing = lessons.filter(item => !observed.has(`${item.lessonId}/${item.runId}`)).map(item => item.lessonId);
    if (missing.length) {
      return [{ level: 'fail', label: 'Project learning', detail: `${missing.length} durable lesson(s) lack matching clone-local observations.`, fix: 'Record the validated learning receipt before final closeout.' }];
    }
    return [{ level: 'ok', label: 'Project learning', detail: `${lessons.length} durable lesson(s); ${observations.length} clone-local observation(s); registry structure is consistent.` }];
  } catch (error) {
    return [{ level: 'fail', label: 'Project learning', detail: `Learning records are invalid: ${error.message}`, fix: 'Repair the learning registry or clone-local observation record before closeout.' }];
  }
}

module.exports = {
  SCHEMA_VERSION,
  STATES,
  TREATMENTS,
  signatureKey,
  validateLearningReceipt,
  recordLearningObservation,
  readLearningObservations,
  readLearningRegistry,
  writeLearningRegistry,
  selectApplicableLessons,
  upsertLearningRegistry,
  validateAutomaticTreatment,
  evaluateLearningTransition,
  applyLearningObservation,
  assertLearningBudget,
  assertLearningCloseoutMarkdown,
  collectLearningDoctorChecks,
  renderLearningSummary,
};
