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
const CREDENTIAL_MATERIAL = /(?:\b(?:sk|rk|pk)_[A-Za-z0-9_-]{8,}\b|\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bAKIA[0-9A-Z]{16}\b|-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~+/-]{12,}\b|\b(?:api[_-]?key|token|password|secret)\s*[:=]\s*[^\s,;]{8,})/i;

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
  return path.resolve(cwd, result.stdout.trim());
}

function eventLogPath(cwd = process.cwd(), runId) {
  const safeRunId = assertSafeIdentifier(runId, 'run ID');
  const common = gitCommonDir(cwd);
  const eventDirectory = path.join(common, 'fb-lane', 'events');
  const filePath = path.resolve(eventDirectory, `${safeRunId}.jsonl`);
  if (path.dirname(filePath) !== eventDirectory) throw new Error('Unsafe event log path.');
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

function stageEventSummary(cwd = process.cwd()) {
  const common = gitCommonDir(cwd);
  const eventDirectory = path.join(common, 'fb-lane', 'events');
  const files = fs.existsSync(eventDirectory) ? fs.readdirSync(eventDirectory).filter(name => name.endsWith('.jsonl')) : [];
  let eventCount = 0;
  for (const file of files) eventCount += readStageEvents(cwd, path.basename(file, '.jsonl')).length;
  return { directory: eventDirectory, runCount: files.length, eventCount };
}

function assertStageEventSummaryMarkdown(markdown, cwd = process.cwd()) {
  if (/"schemaVersion"\s*:\s*"fb-stage-event-v1"/i.test(markdown)) {
    throw new Error('Stage event summaries must link to clone-local JSONL and counts only; copied event JSONL payloads are forbidden.');
  }
  if (!/Stage event summary\s*:/i.test(markdown)) return;
  const summaries = [...markdown.matchAll(/Stage event summary\s*:\s*\[([A-Za-z0-9][A-Za-z0-9._-]{0,127})\]\([^)]*fb-lane\/events\/\1\.jsonl\)\s*\((\d+) events?\)\./gi)];
  if (!summaries.length) throw new Error('Stage event summary requires a clone-local fb-lane/events/<runId>.jsonl link and exact event count.');
  for (const match of summaries) {
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
  stageEventSummary,
  assertStageEventSummaryMarkdown,
  collectControlLoopDoctorChecks,
};
