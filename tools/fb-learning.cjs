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

function renderLearningSummary(lesson) {
  const record = validateLearningReceipt(lesson);
  return `Learning: ${record.state} ${record.lessonId}`;
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
  renderLearningSummary,
};
