#!/usr/bin/env node
'use strict';

// Repository-local operational evidence for the generic FB control loop.
// Events are deliberately flat and omit private inputs, outputs, and secrets.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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
  return require('crypto').createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
}

function validateProfileManifest(manifest) {
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
  assertOnlyKeys(item, ['kind', 'evidenceRef'], `Observed failure ${index}`);
  if (!['build', 'brief', 'eval', 'environment'].includes(item.kind)) throw new Error(`Observed failure ${index} has an unsupported kind.`);
  if (typeof item.evidenceRef !== 'string' || !item.evidenceRef.trim()) throw new Error(`Observed failure ${index} requires an evidenceRef.`);
  return { kind: item.kind, evidenceRef: item.evidenceRef };
}

function diagnoseConfiguration(input = {}) {
  assertOnlyKeys(input, ['stageEvents', 'evalEvidence', 'candidateDiff', 'observedFailures'], 'Configuration diagnosis input');
  if (!Array.isArray(input.stageEvents) || !Array.isArray(input.evalEvidence) || !Array.isArray(input.observedFailures)) throw new Error('Configuration diagnosis accepts curated stageEvents, evalEvidence, and observedFailures arrays only.');
  const stageEvents = input.stageEvents.map(validateStageEvent);
  const evalEvidence = input.evalEvidence.map((item, index) => {
    assertOnlyKeys(item, ['result', 'evidenceRef'], `Eval evidence ${index}`);
    if (!['passed', 'failed'].includes(item.result) || typeof item.evidenceRef !== 'string' || !item.evidenceRef.trim()) throw new Error(`Eval evidence ${index} must contain a result and evidenceRef.`);
    return { result: item.result, evidenceRef: item.evidenceRef };
  });
  assertOnlyKeys(input.candidateDiff, ['changedPaths', 'evidenceRefs'], 'Candidate diff');
  const candidateDiff = {
    changedPaths: uniqueStringArray(input.candidateDiff.changedPaths, 'Candidate diff changedPaths').map(value => assertRepositoryRelativePath(value, 'Candidate diff changedPath')),
    evidenceRefs: uniqueStringArray(input.candidateDiff.evidenceRefs, 'Candidate diff evidenceRefs'),
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

function ensureCandidateDirectory(common, candidateId) {
  const laneDirectory = path.join(common, 'fb-lane');
  const candidateDirectory = path.join(laneDirectory, 'candidates');
  for (const [directory, label] of [[laneDirectory, 'control-loop store directory'], [candidateDirectory, 'candidate store directory']]) {
    assertNotSymlink(directory, label);
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { mode: 0o700 });
    assertNotSymlink(directory, label);
  }
  const target = path.join(candidateDirectory, candidateId);
  assertNotSymlink(target, 'candidate directory');
  if (fs.existsSync(target)) throw new Error(`Candidate ${candidateId} already exists and must remain isolated.`);
  fs.mkdirSync(target, { mode: 0o700 });
  if (fs.realpathSync(target) !== target) throw new Error('Unsafe candidate directory outside the Git common directory.');
  return target;
}

function validateCandidateResult(item, index) {
  assertOnlyKeys(item, ['caseId', 'result', 'evidenceRefs'], `Candidate result ${index}`);
  return {
    caseId: assertSafeIdentifier(item.caseId, 'candidate result case ID'),
    result: ['pass', 'fail'].includes(item.result) ? item.result : (() => { throw new Error(`Candidate result ${index} must be pass or fail.`); })(),
    evidenceRefs: uniqueStringArray(item.evidenceRefs, `Candidate result ${index} evidenceRefs`),
  };
}

function writeCandidateStore(cwd = process.cwd(), input = {}) {
  assertOnlyKeys(input, ['candidateId', 'profileId', 'proposedConfig', 'baselineHash', 'candidateHash', 'fixtureManifest', 'results', 'promotionRecommendation'], 'Candidate store input');
  const candidateId = assertSafeIdentifier(input.candidateId, 'candidate ID');
  const profileId = assertSafeIdentifier(input.profileId, 'profile ID');
  assertPlainObject(input.proposedConfig, 'Proposed config');
  const fixtureManifest = validateGoldenFixtureManifest(input.fixtureManifest);
  if (!Array.isArray(input.results) || input.results.length > fixtureManifest.cases.length) throw new Error('Candidate results must be bounded by the frozen golden case set.');
  const results = input.results.map(validateCandidateResult);
  if (new Set(results.map(item => item.caseId)).size !== results.length) throw new Error('Candidate results must not repeat a case.');
  if (results.some(item => !fixtureManifest.cases.some(fixture => fixture.id === item.caseId))) throw new Error('Candidate results must use only cases in the frozen golden fixture set.');
  if (!['promote', 'hold', 'reject'].includes(input.promotionRecommendation)) throw new Error('Candidate promotionRecommendation must be promote, hold, or reject.');
  const directory = ensureCandidateDirectory(gitCommonDir(cwd), candidateId);
  const record = {
    candidateId,
    profileId,
    baselineHash: assertSha256(input.baselineHash, 'Candidate baselineHash'),
    candidateHash: assertSha256(input.candidateHash, 'Candidate candidateHash'),
    fixtureManifestHash: manifestHash(fixtureManifest),
    results,
    promotionRecommendation: input.promotionRecommendation,
  };
  fs.writeFileSync(path.join(directory, 'proposed-config.json'), `${JSON.stringify(input.proposedConfig, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
  fs.writeFileSync(path.join(directory, 'candidate.json'), `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
  return { directory, ...record };
}

function validateBenchmarkRun(run, manifest, expectedHash, label) {
  assertOnlyKeys(run, ['fixtureManifestHash', 'settings', 'modelRef', 'limits', 'graderContract', 'results'], `${label} benchmark run`);
  if (run.fixtureManifestHash !== expectedHash) throw new Error(`${label} benchmark run does not use the frozen fixture manifest.`);
  assertPlainObject(run.settings, `${label} benchmark settings`);
  assertPlainObject(run.limits, `${label} benchmark limits`);
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
    byId.set(result.caseId, { caseId: result.caseId, criteria: { ...result.criteria }, observed: uniqueStringArray(result.observed, `${label} benchmark result observed`, true), evidenceRefs: uniqueStringArray(result.evidenceRefs, `${label} benchmark result evidenceRefs`) });
  }
  if (byId.size !== manifest.cases.length) throw new Error(`${label} benchmark run is missing frozen cases or selectively reran the fixture set.`);
  return { fixtureManifestHash: run.fixtureManifestHash, settings: { ...run.settings }, modelRef: run.modelRef, limits: { ...run.limits }, graderContract: run.graderContract, results: manifest.cases.map(item => byId.get(item.id)) };
}

function compareFrozenBenchmark(input = {}) {
  assertOnlyKeys(input, ['fixtureManifest', 'baseline', 'candidate'], 'Frozen benchmark comparison input');
  const fixtureManifest = validateGoldenFixtureManifest(input.fixtureManifest);
  const frozenFixtureManifestHash = manifestHash(fixtureManifest);
  const baseline = validateBenchmarkRun(input.baseline, fixtureManifest, frozenFixtureManifestHash, 'Baseline');
  const candidate = validateBenchmarkRun(input.candidate, fixtureManifest, frozenFixtureManifestHash, 'Candidate');
  for (const field of ['settings', 'modelRef', 'limits', 'graderContract']) {
    if (!require('util').isDeepStrictEqual(baseline[field], candidate[field])) throw new Error(`Baseline and candidate benchmark ${field} must be identical.`);
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
  return { frozenFixtureManifestHash, baseline, candidate, regressions, verdict: regressions.length ? 'baseline' : improvements.length ? 'candidate' : 'tie' };
}

function assessCandidateProgress(input = {}) {
  assertOnlyKeys(input, ['previousCandidate', 'candidate', 'repair'], 'Candidate progress input');
  const validateCandidate = (candidate, label) => {
    assertOnlyKeys(candidate, ['candidateId', 'candidateHash', 'evidenceRefs'], label);
    return { candidateId: assertSafeIdentifier(candidate.candidateId, `${label} ID`), candidateHash: assertSha256(candidate.candidateHash, `${label} hash`), evidenceRefs: uniqueStringArray(candidate.evidenceRefs, `${label} evidenceRefs`) };
  };
  const candidate = validateCandidate(input.candidate, 'Candidate');
  const previousCandidate = input.previousCandidate === undefined ? null : validateCandidate(input.previousCandidate, 'Previous candidate');
  assertOnlyKeys(input.repair, ['attempt', 'maxAttempts', 'budgetRemaining', 'timedOut', 'userDecisionChanged'], 'Repair state');
  const repair = input.repair;
  if (!Number.isInteger(repair.attempt) || repair.attempt < 0 || !Number.isInteger(repair.maxAttempts) || repair.maxAttempts < 1 || typeof repair.budgetRemaining !== 'number' || !Number.isFinite(repair.budgetRemaining) || repair.budgetRemaining < 0 || (repair.timedOut !== undefined && typeof repair.timedOut !== 'boolean') || (repair.userDecisionChanged !== undefined && typeof repair.userDecisionChanged !== 'boolean')) throw new Error('Repair state must use authoritative existing limits and budget values.');
  let productBoundary = '';
  if (repair.userDecisionChanged) productBoundary = 'Product boundary: the user decision changed; do not continue repair.';
  else if (repair.timedOut) productBoundary = 'Product boundary: repair timed out; choose whether to retry with new evidence.';
  else if (repair.budgetRemaining <= 0) productBoundary = 'Product boundary: the supplied repair budget is exhausted.';
  else if (repair.attempt >= repair.maxAttempts) productBoundary = 'Product boundary: the supplied repair attempt limit is exhausted.';
  else if (previousCandidate && previousCandidate.candidateHash === candidate.candidateHash && require('util').isDeepStrictEqual(previousCandidate.evidenceRefs, candidate.evidenceRefs)) productBoundary = 'Product boundary: repeated candidate has no material configuration or evidence change.';
  return productBoundary ? { status: 'stopped', candidateId: candidate.candidateId, productBoundary } : { status: 'progressed', candidateId: candidate.candidateId };
}

function validatePromotion(input = {}) {
  assertOnlyKeys(input, ['candidate', 'benchmark', 'approval'], 'Promotion validation input');
  assertOnlyKeys(input.candidate, ['candidateId', 'benchmarkEvidenceRef', 'promotionRecommendation'], 'Promotion candidate');
  assertOnlyKeys(input.benchmark, ['candidateId', 'evidenceRef', 'verdict'], 'Promotion benchmark');
  if (!input.approval) throw new Error('Promotion requires explicit Product approval tied to the exact candidate and benchmark evidence.');
  assertOnlyKeys(input.approval, ['decision', 'candidateId', 'benchmarkEvidenceRef', 'approvedBy'], 'Product approval');
  const candidateId = assertSafeIdentifier(input.candidate.candidateId, 'promotion candidate ID');
  if (input.candidate.promotionRecommendation !== 'promote' || input.benchmark.verdict !== 'candidate' || input.approval.decision !== 'approve' || input.approval.approvedBy !== 'Product') throw new Error('Promotion requires an exact Product approval for a promotable candidate benchmark.');
  if (input.benchmark.candidateId !== candidateId || input.approval.candidateId !== candidateId || input.candidate.benchmarkEvidenceRef !== input.benchmark.evidenceRef || input.approval.benchmarkEvidenceRef !== input.benchmark.evidenceRef) throw new Error('Promotion approval must match the exact candidate and benchmark evidence.');
  return { valid: true, promotion: 'product_approved', candidateId, benchmarkEvidenceRef: input.benchmark.evidenceRef };
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
  compareFrozenBenchmark,
  assessCandidateProgress,
  validatePromotion,
  stageEventSummary,
  assertStageEventSummaryMarkdown,
  collectControlLoopDoctorChecks,
};
