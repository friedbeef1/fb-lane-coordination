#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_TRUTH = path.join(__dirname, 'fixtures', 'fb-graduated-control-truth.json');
const DEFAULT_SETTINGS = path.join(__dirname, 'fixtures', 'fb-fast-decay-settings.json');
const PRIOR_SETTINGS = path.join(__dirname, 'fixtures', 'fb-graduated-control-settings.json');
const PRIOR_RESULT = path.join(ROOT, 'docs', 'benchmarks', 'control-loop', 'graduated-results.json');
const ARMS = ['process-all', 'full-fb', 'graduated-fb', 'fast-decay-v2'];
const V1_ARMS = ARMS.slice(0, 3);
const CALLS = ['process', 'focused', 'route', 'comparison', 'qa', 'safety', 'diagnosis', 'repair', 'humanDecision'];
const FORBIDDEN_KEY = /^(?:secret|credential|password|token|privateReasoning|transcript|rawPrompt|chainOfThought|hidden)$/i;
const CREDENTIAL = /(?:\b(?:token|password|secret|api[_-]?key)\s*[:=]\s*\S{8,}|\bsk-[A-Za-z0-9_-]{8,})/i;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function hash(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex');
}

function deterministic(seed, ...parts) {
  const digest = crypto.createHash('sha256').update(`${seed}:${parts.join(':')}`).digest();
  return digest.readUInt32BE(0) / 0x100000000;
}

function blueprintDetails(kind, safetyKind) {
  const details = {
    'light-improve': { baseline: [false, true], candidate: [true, true], expected: 'process', conditions: ['light', 'worth-processing'], minimumLevel: 0 },
    'light-good': { baseline: [true, true], candidate: [true, true], expected: 'skip', conditions: ['light', 'already-good'], minimumLevel: 1 },
    'already-good': { baseline: [true, true], candidate: [true, true], expected: 'skip', conditions: ['already-good'], minimumLevel: 1 },
    'ambiguous-improve': { baseline: [false, true], candidate: [true, true], expected: 'process', conditions: ['ambiguous-route', 'worth-processing'], ambiguous: true, minimumLevel: 1 },
    improve: { baseline: [false, true], candidate: [true, true], expected: 'process', conditions: ['worth-processing'], minimumLevel: 0 },
    regression: { baseline: [true, true], candidate: [false, true], expected: 'skip', conditions: ['already-good', 'regression'], regression: true, minimumLevel: 2 },
    'repairable-build': { baseline: [false, true], candidate: [false, true], repair: [true, true], expected: 'process', conditions: ['repeated-failure', 'repair-success'], signal: 'output_defect', failure: 'Build', minimumLevel: 3 },
    'unresolved-brief': { baseline: [false, true], candidate: [false, true], repair: [false, true], expected: 'process', conditions: ['repeated-failure', 'repair-unresolved'], signal: 'criteria_missing', failure: 'Brief', minimumLevel: 3 },
    'repairable-eval': { baseline: [false, true], candidate: [false, true], repair: [true, true], expected: 'process', conditions: ['repeated-failure', 'repair-success'], signal: 'evaluator_conflict', failure: 'Eval', minimumLevel: 3 },
    'unresolved-environment': { baseline: [false, true], candidate: [false, true], expected: 'process', conditions: ['repeated-failure', 'repair-unresolved'], signal: 'access_missing', failure: 'Environment', minimumLevel: 3 },
    'sensitive-block': { baseline: [false, true], candidate: [true, false], expected: 'process', conditions: ['sensitive', safetyKind], safetyKind, signal: 'policy_boundary', failure: 'Environment', minimumLevel: 4 },
    'sensitive-pass': { baseline: [false, true], candidate: [true, true], expected: 'process', conditions: ['sensitive', safetyKind], safetyKind, minimumLevel: 4 },
    'sensitive-repair': { baseline: [false, true], candidate: [true, false], repair: [true, true], expected: 'process', conditions: ['sensitive', safetyKind, 'repair-success'], safetyKind, signal: 'output_defect', failure: 'Build', minimumLevel: 4 },
    'repair-success': { baseline: [false, true], candidate: [false, true], repair: [true, true], expected: 'process', conditions: ['repair-success'], signal: 'output_defect', failure: 'Build', minimumLevel: 3 },
    'stable-improve': { baseline: [false, true], candidate: [true, true], expected: 'process', conditions: ['post-repair-stable'], stable: true, minimumLevel: 0 },
    'stable-good': { baseline: [true, true], candidate: [true, true], expected: 'skip', conditions: ['already-good', 'post-repair-stable'], stable: true, minimumLevel: 1 },
    'post-stable-good': { baseline: [true, true], candidate: [true, true], expected: 'skip', conditions: ['already-good', 'post-repair-stable'], stable: true, minimumLevel: 1 },
    'post-stable-improve': { baseline: [false, true], candidate: [true, true], expected: 'process', conditions: ['post-repair-stable'], stable: true, minimumLevel: 0 },
  }[kind];
  if (!details) throw new Error(`Unknown blueprint kind ${kind}.`);
  return details;
}

function expandTruth(source) {
  return {
    schemaVersion: source.schemaVersion,
    scenarios: source.scenarios.map(scenario => ({
      ...scenario,
      cases: scenario.cases.map((blueprint, index) => {
          const detail = blueprintDetails(blueprint.kind, scenario.safetyKind);
          const artifact = pair => ({ quality: pair[0], safety: pair[1] });
          return {
            id: `${scenario.id}-${String(index + 1).padStart(2, '0')}`,
            sequence: index + 1,
            phase: blueprint.phase,
            kind: blueprint.kind,
            visible: {
              scenarioFamily: scenario.id,
              domainEvent: `${scenario.id}:${blueprint.event}`,
              baselineReady: detail.baseline[0] && detail.baseline[1],
              benefitSignal: detail.expected === 'process',
              routeAmbiguous: Boolean(detail.ambiguous),
              observedFailureSignal: detail.signal || null,
              observedRegressionSignal: Boolean(detail.regression),
              safetyTrigger: detail.safetyKind || null,
              stableSignal: Boolean(detail.stable),
            },
            baseline: artifact(detail.baseline),
            transformation: artifact(detail.candidate),
            repair: detail.repair ? artifact(detail.repair) : null,
            hidden: {
              conditions: detail.conditions,
              expectedDisposition: detail.expected,
              failureClass: detail.failure || null,
              minimumRequiredLevel: detail.minimumLevel,
            },
          };
      }),
    })),
  };
}

function projectPublicCase(item) {
  return {
    id: item.id,
    sequence: item.sequence,
    phase: item.phase,
    visible: structuredClone(item.visible),
    baseline: structuredClone(item.baseline),
    transformation: structuredClone(item.transformation),
    repair: item.repair ? structuredClone(item.repair) : null,
  };
}

function initialState() {
  return {
    currentLevel: 0,
    seen: 0,
    alreadyGoodOrAmbiguous: 0,
    regressions: 0,
    classifiableFailures: 0,
    cleanStreak: 0,
  };
}

function publicRequiredFloor(item) {
  if (item.visible.safetyTrigger) {
    return 4;
  }
  if (item.visible.observedFailureSignal) return 3;
  if (item.visible.observedRegressionSignal) return 2;
  if (item.visible.routeAmbiguous
    || (item.visible.baselineReady && !item.visible.benefitSignal)) return 1;
  return 0;
}

function initialFastDecayState() {
  return {
    seen: 0,
    cleanStreak: 0,
    persistentLevel: 0,
    evidenceWindow: [],
    lastActiveRiskSequence: null,
  };
}

function makePublicProbe(options = {}) {
  return {
    id: `probe-${options.sequence || 1}`,
    sequence: options.sequence || 1,
    phase: 'probe',
    visible: {
      scenarioFamily: 'probe',
      domainEvent: `probe:${options.sequence || 1}`,
      baselineReady: Boolean(options.preserve),
      benefitSignal: !options.preserve,
      routeAmbiguous: Boolean(options.ambiguous),
      observedFailureSignal: options.failure || null,
      observedRegressionSignal: Boolean(options.regression),
      safetyTrigger: options.safety || null,
      stableSignal: !options.regression && !options.failure && !options.safety,
    },
    baseline: { quality: Boolean(options.preserve), safety: true },
    transformation: { quality: true, safety: true },
    repair: null,
  };
}

function visibleEvidence(item) {
  if (item.visible.observedFailureSignal) return { kind: 'diagnosis', level: 3 };
  if (item.visible.observedRegressionSignal) return { kind: 'comparison', level: 2 };
  if (item.visible.routeAmbiguous
    || (item.visible.baselineReady && !item.visible.benefitSignal)) {
    return { kind: 'routing', level: 1 };
  }
  return null;
}

function pruneEvidenceWindow(state, sequence, policy) {
  return state.evidenceWindow.filter(entry =>
    entry.unresolved || sequence - entry.sequence < policy.rollingWindowCases);
}

function corroboratedLevel(window, policy) {
  let level = window.some(entry => entry.kind === 'diagnosis' && entry.unresolved)
    ? 3
    : 0;
  for (const [kind, candidate] of [['routing', 1], ['comparison', 2], ['diagnosis', 3]]) {
    if (window.filter(entry => entry.kind === kind).length >= policy.corroboratingObservations) {
      level = Math.max(level, candidate);
    }
  }
  return level;
}

function chooseFastDecayLevel(state, item, policy) {
  const currentItemFloor = publicRequiredFloor(item);
  const retained = pruneEvidenceWindow(state, item.sequence, policy);
  const evidence = visibleEvidence(item);
  const evidenceWindow = evidence
    ? [...retained, { sequence: item.sequence, kind: evidence.kind, unresolved: false }]
    : retained;
  const corroborated = corroboratedLevel(evidenceWindow, policy);
  let persistentLevel = Math.max(state.persistentLevel, corroborated);
  let transition = null;

  if (persistentLevel > corroborated
    && state.cleanStreak >= policy.cleanOutcomesBeforeDecay) {
    transition = {
      direction: 'down',
      from: state.persistentLevel,
      to: corroborated,
      reason: 'expired corroboration after two clean outcomes',
    };
    persistentLevel = corroborated;
  } else if (corroborated > state.persistentLevel) {
    transition = {
      direction: 'up',
      from: state.persistentLevel,
      to: corroborated,
      reason: `corroborated ${evidence?.kind || 'visible'} evidence`,
    };
  }

  if (currentItemFloor === policy.temporarySafetyLevel) {
    return {
      level: policy.temporarySafetyLevel,
      currentItemFloor,
      persistentLevel,
      evidenceWindow,
      temporaryEscalation: true,
      transition: {
        direction: 'temporary',
        from: persistentLevel,
        to: policy.temporarySafetyLevel,
        reason: `active ${item.visible.safetyTrigger} safety trigger`,
      },
    };
  }
  return {
    level: Math.max(currentItemFloor, persistentLevel),
    currentItemFloor,
    persistentLevel,
    evidenceWindow,
    temporaryEscalation: currentItemFloor > persistentLevel,
    transition,
  };
}

function updateFastDecayState(state, item, record, choice, policy) {
  state.seen += 1;
  state.persistentLevel = choice.persistentLevel;
  state.evidenceWindow = choice.evidenceWindow.map(entry =>
    entry.sequence === item.sequence && entry.kind === 'diagnosis'
      ? { ...entry, unresolved: !record.accepted }
      : entry);
  if (item.visible.observedFailureSignal && record.accepted) {
    state.evidenceWindow = state.evidenceWindow.map(entry =>
      entry.kind === 'diagnosis' ? { ...entry, unresolved: false } : entry);
  }
  if (publicRequiredFloor(item) > 0) state.lastActiveRiskSequence = item.sequence;
  const clean = record.accepted && !record.worseCandidateAttempt
    && !item.visible.routeAmbiguous
    && !item.visible.observedRegressionSignal
    && !item.visible.observedFailureSignal
    && !item.visible.safetyTrigger;
  state.cleanStreak = clean ? state.cleanStreak + 1 : 0;
  state.evidenceWindow = pruneEvidenceWindow(state, item.sequence + 1, policy);
}

function chooseGraduatedLevel(state, item, policy) {
  const currentPublicFloor = publicRequiredFloor(item);
  if (currentPublicFloor === 4) {
    return {
      level: 4,
      currentPublicFloor,
      stepDownEligible: false,
      transition: state.currentLevel === 4 ? null : {
      direction: 'up', from: state.currentLevel, to: 4,
      temporarySafetyOverride: true, evidence: { safetyTrigger: item.visible.safetyTrigger },
      },
    };
  }
  let level = state.currentLevel;
  let transition = null;
  const stepDownEligible = state.cleanStreak >= policy.stepDownCleanWindow
    && level > currentPublicFloor;
  if (currentPublicFloor > level) {
    transition = {
      direction: 'up',
      from: level,
      to: currentPublicFloor,
      evidence: { currentPublicFloor },
    };
    level = currentPublicFloor;
  } else if (stepDownEligible) {
    const from = level;
    level = Math.max(currentPublicFloor, level - policy.stepDownLevelsPerCase);
    transition = { direction: 'down', from, to: level, evidence: { cleanStreak: state.cleanStreak } };
  } else {
    let target = level;
    if (state.seen >= policy.level1MinimumVolume
      && state.alreadyGoodOrAmbiguous >= policy.level1AlreadyGoodOrAmbiguous) target = Math.max(target, 1);
    if (state.regressions >= policy.level2ObservedRegressions) target = Math.max(target, 2);
    if (state.classifiableFailures >= policy.level3ClassifiableFailures) target = Math.max(target, 3);
    if (target > level) {
      transition = {
        direction: 'up', from: level, to: target,
        evidence: {
          seen: state.seen,
          alreadyGoodOrAmbiguous: state.alreadyGoodOrAmbiguous,
          regressions: state.regressions,
          classifiableFailures: state.classifiableFailures,
        },
      };
      level = target;
    }
  }
  return { level, transition, currentPublicFloor, stepDownEligible };
}

function emptyCalls() {
  return Object.fromEntries(CALLS.map(name => [name, 0]));
}

function applyCost(calls, model) {
  const totals = { workUnits: 0, modeledTokenUnits: 0, modeledMinutes: 0 };
  for (const name of CALLS) for (const field of Object.keys(totals)) {
    const modelField = field === 'modeledTokenUnits' ? 'tokenUnits' : field === 'modeledMinutes' ? 'minutes' : 'workUnits';
    totals[field] += calls[name] * model[name][modelField];
  }
  return totals;
}

function visibleDiagnosis(signal) {
  return {
    output_defect: 'Build',
    criteria_missing: 'Brief',
    evaluator_conflict: 'Eval',
    access_missing: 'Environment',
    policy_boundary: 'Environment',
  }[signal] || null;
}

function executeCase(arm, item, state, settings, seed, scenarioId = 'unit') {
  const calls = emptyCalls();
  const componentDraws = {};
  const draw = component => {
    const value = deterministic(seed, scenarioId, item.id, component);
    componentDraws[component] = value;
    return value;
  };
  let executionLevel;
  let transition = null;
  let currentPublicFloor = publicRequiredFloor(item);
  let stepDownEligible = false;
  let fastChoice = null;
  if (arm === 'process-all') executionLevel = 0;
  else if (arm === 'full-fb') executionLevel = 4;
  else if (arm === 'fast-decay-v2') {
    fastChoice = chooseFastDecayLevel(state, item, settings.fastDecayPolicy);
    executionLevel = fastChoice.level;
    transition = fastChoice.transition;
    currentPublicFloor = fastChoice.currentItemFloor;
  }
  else ({
    level: executionLevel, transition, currentPublicFloor, stepDownEligible,
  } = chooseGraduatedLevel(state, item, settings.policy));

  let disposition = 'process';
  let routerError = false;
  const routeActive = arm === 'full-fb' || executionLevel >= 1;
  if (routeActive) {
    calls.route = 1;
    const intended = item.visible.routeAmbiguous
      ? (item.visible.benefitSignal ? 'process' : 'skip')
      : (item.visible.baselineReady && !item.visible.benefitSignal ? 'skip' : 'process');
    routerError = draw('route') >= settings.fallibility.routerAccuracy;
    disposition = routerError ? (intended === 'process' ? 'skip' : 'process') : intended;
    if (item.visible.routeAmbiguous) calls.humanDecision = 1;
  }

  let selected = item.baseline;
  let deliveredArtifact = 'baseline';
  let worseCandidateAttempt = false;
  let comparisonError = false;
  let gateError = false;
  let diagnosisError = false;
  let repairAttempted = false;
  let diagnosedFailure = null;
  let result = 'preserved baseline';
  if (disposition === 'process') {
    calls.process = 1;
    if (arm === 'process-all') calls.qa = 1;
    else calls.focused = 1;
    selected = item.transformation;
    deliveredArtifact = 'transformed-candidate';
    worseCandidateAttempt = item.baseline.quality && item.baseline.safety && (!selected.quality || !selected.safety);

    if (arm === 'full-fb' || executionLevel >= 2) {
      calls.comparison = 1;
      calls.qa = 1;
      comparisonError = draw('comparison') >= settings.fallibility.comparisonAccuracy;
      const candidateWorse = item.baseline.quality && item.baseline.safety && (!selected.quality || !selected.safety);
      if (candidateWorse && !comparisonError) {
        selected = item.baseline;
        deliveredArtifact = 'baseline';
        result = 'comparison retained baseline';
      }
    }

    const safetyActive = arm === 'full-fb' || executionLevel === 4;
    if (safetyActive) {
      calls.safety = 1;
      gateError = draw('gate') >= settings.fallibility.gateAccuracy;
      if (!selected.safety && !gateError) {
        deliveredArtifact = 'none';
        result = 'safety gate blocked candidate';
      }
    }

    const failed = deliveredArtifact === 'none' || !selected.quality || !selected.safety;
    if (failed && (arm === 'full-fb' || executionLevel >= 3)) {
      calls.diagnosis = 1;
      diagnosisError = draw('diagnosis') >= settings.fallibility.diagnosisAccuracy;
      diagnosedFailure = visibleDiagnosis(item.visible.observedFailureSignal);
      if (diagnosisError && diagnosedFailure) {
        diagnosedFailure = { Build: 'Brief', Brief: 'Eval', Eval: 'Environment', Environment: 'Build' }[diagnosedFailure];
      }
      if (item.repair) {
        calls.repair = 1;
        repairAttempted = true;
        const repairError = draw('repair') >= settings.fallibility.repairAccuracy;
        selected = repairError ? item.transformation : item.repair;
        deliveredArtifact = selected.quality && selected.safety ? 'repair-candidate' : 'none';
        result = deliveredArtifact === 'none' ? 'bounded repair unresolved' : 'accepted bounded repair';
      }
    }
    if (result === 'preserved baseline') result = selected.quality && selected.safety ? 'accepted candidate' : 'candidate unresolved';
  }
  const accepted = deliveredArtifact !== 'none' && selected.quality && selected.safety;
  if (!accepted) deliveredArtifact = 'none';
  const resultRecord = {
    arm,
    caseId: item.id,
    phase: item.phase,
    seed,
    executionLevel,
    transition,
    currentPublicFloor,
    stepDownEligible,
    disposition,
    accepted,
    deliveredArtifact,
    worseCandidateAttempt,
    routerError,
    comparisonError,
    gateError,
    diagnosisError,
    diagnosedFailure,
    repairAttempted,
    unresolvedFailure: !accepted,
    visibleSafetyTrigger: item.visible.safetyTrigger,
    safetyTriggerResponded: !item.visible.safetyTrigger || executionLevel === 4,
    componentDraws,
    result,
    calls,
    ...applyCost(calls, settings.costModel),
  };
  if (arm === 'fast-decay-v2') {
    Object.assign(resultRecord, {
      currentItemFloor: fastChoice.currentItemFloor,
      persistentLevel: fastChoice.persistentLevel,
      evidenceWindow: fastChoice.evidenceWindow,
      transitionEvent: fastChoice.transition,
      temporaryEscalation: fastChoice.temporaryEscalation,
      demotionLatencyCases: fastChoice.transition?.direction === 'down'
        && state.lastActiveRiskSequence !== null
        ? Math.max(0, item.sequence - state.lastActiveRiskSequence)
        : null,
    });
  }
  return resultRecord;
}

function executeFastDecayCase(item, state, settings, seed, scenarioId = 'unit') {
  return executeCase('fast-decay-v2', item, state, settings, seed, scenarioId);
}

function updateState(state, publicItem, record) {
  state.seen += 1;
  if (publicItem.visible.baselineReady || publicItem.visible.routeAmbiguous) state.alreadyGoodOrAmbiguous += 1;
  if (publicItem.visible.observedRegressionSignal || record.worseCandidateAttempt) state.regressions += 1;
  if (!record.accepted && publicItem.visible.observedFailureSignal) state.classifiableFailures += 1;
  const clean = record.accepted && !record.worseCandidateAttempt
    && !publicItem.visible.routeAmbiguous && !publicItem.visible.safetyTrigger;
  state.cleanStreak = clean ? state.cleanStreak + 1 : 0;
  if (record.transition?.direction === 'down') {
    state.cleanStreak = 0;
    if (record.transition.to < 3) state.classifiableFailures = 0;
    if (record.transition.to < 2) state.regressions = 0;
  }
  if (!record.transition?.temporarySafetyOverride) state.currentLevel = record.executionLevel;
}

function gradeRecord(record, item) {
  const required = item.hidden.minimumRequiredLevel;
  const graduated = record.arm === 'graduated-fb';
  const exact = graduated && record.executionLevel === required;
  const falseGraduation = graduated && record.executionLevel > required;
  const missedGraduation = graduated && record.executionLevel < required;
  const stepDownOpportunity = graduated && record.stepDownEligible;
  return {
    ...record,
    dispositionCorrect: record.disposition === item.hidden.expectedDisposition,
    unnecessaryProcessing: record.disposition === 'process' && item.hidden.expectedDisposition === 'skip',
    diagnosisCorrect: record.diagnosedFailure === null ? null : record.diagnosedFailure === item.hidden.failureClass,
    minimumRequiredLevel: required,
    graduationExact: graduated ? exact : null,
    falseGraduation,
    missedGraduation,
    stepDownOpportunity,
    stepDownSuccess: stepDownOpportunity
      && record.transition?.direction === 'down'
      && record.transition.from - record.transition.to === 1
      && !missedGraduation,
    reworkAvoided: record.arm !== 'process-all' && record.worseCandidateAttempt && record.deliveredArtifact === 'baseline',
  };
}

function gradeFastDecayRecord(record, item) {
  const required = item.hidden.minimumRequiredLevel;
  const excess = Math.max(0, record.executionLevel - required);
  return {
    ...record,
    dispositionCorrect: record.disposition === item.hidden.expectedDisposition,
    unnecessaryProcessing: record.disposition === 'process' && item.hidden.expectedDisposition === 'skip',
    diagnosisCorrect: record.diagnosedFailure === null ? null : record.diagnosedFailure === item.hidden.failureClass,
    minimumRequiredLevel: required,
    graduationExact: record.executionLevel === required,
    falseGraduation: excess > 0,
    missedGraduation: record.executionLevel < required,
    excessLevelUnits: excess,
    persistentPromotionEvent: record.transitionEvent?.direction === 'up',
    falsePersistentPromotion: record.transitionEvent?.direction === 'up'
      && record.persistentLevel > required,
    demotionEvent: record.transitionEvent?.direction === 'down',
    reworkAvoided: record.worseCandidateAttempt && record.deliveredArtifact === 'baseline',
  };
}

function metricSummary(records) {
  const sum = field => records.reduce((total, row) => total + Number(row[field] || 0), 0);
  const count = records.length;
  const accepted = records.filter(row => row.accepted).length;
  const diagnosed = records.filter(row => row.diagnosisCorrect !== null);
  const graduated = records.filter(row => row.graduationExact !== null);
  const stepDown = records.filter(row => row.stepDownOpportunity);
  return {
    caseCount: count,
    productReadyCount: accepted,
    productReadyRate: accepted / count,
    workUnits: sum('workUnits'),
    modeledTokenUnits: sum('modeledTokenUnits'),
    modeledMinutes: sum('modeledMinutes'),
    workUnitsPerAccepted: accepted ? sum('workUnits') / accepted : null,
    modeledTokenUnitsPerAccepted: accepted ? sum('modeledTokenUnits') / accepted : null,
    unnecessaryProcessing: records.filter(row => row.unnecessaryProcessing).length,
    worseCandidateAttempts: records.filter(row => row.worseCandidateAttempt).length,
    alreadyGoodRetainedReady: records.filter(row =>
      row.deliveredArtifact === 'baseline' && row.accepted).length,
    correctDispositionRate: records.filter(row => row.dispositionCorrect).length / count,
    diagnosisAccuracy: diagnosed.length ? diagnosed.filter(row => row.diagnosisCorrect).length / diagnosed.length : null,
    unresolvedFailures: records.filter(row => row.unresolvedFailure).length,
    repairAttempts: records.filter(row => row.repairAttempted).length,
    humanDecisionEvents: records.reduce((n, row) => n + row.calls.humanDecision, 0),
    safetyTriggerResponseRate: records.some(row => row.visibleSafetyTrigger)
      ? records.filter(row => row.visibleSafetyTrigger && row.safetyTriggerResponded).length
        / records.filter(row => row.visibleSafetyTrigger).length
      : null,
    graduationAccuracy: graduated.length ? graduated.filter(row => row.graduationExact).length / graduated.length : null,
    falseGraduations: records.filter(row => row.falseGraduation).length,
    missedGraduations: records.filter(row => row.missedGraduation).length,
    stepDownOpportunities: stepDown.length,
    stepDownSuccesses: stepDown.filter(row => row.stepDownSuccess).length,
    reworkAvoided: records.filter(row => row.reworkAvoided).length,
  };
}

function fastDecayMetricSummary(records) {
  const base = metricSummary(records);
  const promotionCases = records.filter(row => row.persistentPromotionEvent);
  const demotions = records.filter(row => row.demotionEvent);
  return {
    ...base,
    excessControlCases: records.filter(row => row.excessLevelUnits > 0).length,
    excessLevelUnits: records.reduce((sum, row) => sum + row.excessLevelUnits, 0),
    persistentPromotionEvents: promotionCases.length,
    falsePersistentPromotions: records.filter(row => row.falsePersistentPromotion).length,
    casesAffectedPerPromotionEvent: promotionCases.length
      ? records.filter(row => row.persistentLevel > 0).length / promotionCases.length
      : 0,
    demotionEvents: demotions.length,
    demotionLatency: demotions.length
      ? demotions.reduce((sum, row) => sum + row.demotionLatencyCases, 0) / demotions.length
      : 0,
    temporaryEscalations: records.filter(row => row.temporaryEscalation).length,
  };
}

function graderExecutableContract() {
  return [
    `blueprintDetails=${blueprintDetails.toString()}`,
    `expandTruth=${expandTruth.toString()}`,
    `publicRequiredFloor=${publicRequiredFloor.toString()}`,
    `gradeRecord=${gradeRecord.toString()}`,
    `metricSummary=${metricSummary.toString()}`,
    `visibleEvidence=${visibleEvidence.toString()}`,
    `pruneEvidenceWindow=${pruneEvidenceWindow.toString()}`,
    `corroboratedLevel=${corroboratedLevel.toString()}`,
    `chooseFastDecayLevel=${chooseFastDecayLevel.toString()}`,
    `updateFastDecayState=${updateFastDecayState.toString()}`,
    `gradeFastDecayRecord=${gradeFastDecayRecord.toString()}`,
    `evaluateAdoption=${evaluateAdoption.toString()}`,
  ].join('\n\n');
}

function armObject(records) {
  return {
    processAll: metricSummary(records.filter(row => row.arm === 'process-all')),
    fullFb: metricSummary(records.filter(row => row.arm === 'full-fb')),
    graduatedFb: metricSummary(records.filter(row => row.arm === 'graduated-fb')),
    fastDecayV2: fastDecayMetricSummary(records.filter(row => row.arm === 'fast-decay-v2')),
  };
}

function delta(a, b) {
  const fields = ['productReadyRate', 'workUnits', 'modeledTokenUnits', 'modeledMinutes',
    'workUnitsPerAccepted', 'modeledTokenUnitsPerAccepted', 'unnecessaryProcessing',
    'worseCandidateAttempts', 'unresolvedFailures', 'repairAttempts', 'humanDecisionEvents',
    'correctDispositionRate', 'reworkAvoided'];
  return Object.fromEntries(fields.map(field => [field,
    a[field] === null || b[field] === null ? null : a[field] - b[field]]));
}

function medianRange(rows, identityFields) {
  const metricFields = ['productReadyRate', 'workUnits', 'modeledTokenUnits',
    'modeledMinutes', 'modeledTokenUnitsPerAccepted', 'unresolvedFailures'];
  const groups = new Map();
  for (const row of rows) {
    const key = identityFields.map(field => row[field]).join(':');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.values()].map(group => {
    const identity = Object.fromEntries(identityFields.map(field => [field, group[0][field]]));
    return {
      ...identity,
      ...Object.fromEntries(metricFields.map(field => {
        const values = group.map(row => row[field]).filter(value => value !== null).sort((a, b) => a - b);
        return [field, values.length ? {
          median: values[Math.floor(values.length / 2)],
          range: [values[0], values.at(-1)],
        } : { median: null, range: [null, null] }];
      })),
    };
  });
}

function recompute(records) {
  const aggregateArms = armObject(records);
  const aggregate = [
    { arm: 'process-all', ...aggregateArms.processAll },
    { arm: 'full-fb', ...aggregateArms.fullFb },
    { arm: 'graduated-fb', ...aggregateArms.graduatedFb },
    { arm: 'fast-decay-v2', ...aggregateArms.fastDecayV2 },
  ];
  const scenarios = [...new Set(records.map(row => row.scenarioId))].sort();
  const phases = [...new Set(records.map(row => row.phase))];
  const seeds = [...new Set(records.map(row => row.seed))].sort((a, b) => a - b);
  const byScenario = scenarios.flatMap(scenarioId => ARMS.map(arm => ({
    scenarioId, arm, ...metricSummary(records.filter(row => row.scenarioId === scenarioId && row.arm === arm)),
  })));
  const byPhase = phases.flatMap(phase => ARMS.map(arm => ({
    phase, arm, ...metricSummary(records.filter(row => row.phase === phase && row.arm === arm)),
  })));
  const bySeed = seeds.flatMap(seed => ARMS.map(arm => ({
    seed, arm, ...metricSummary(records.filter(row => row.seed === seed && row.arm === arm)),
  })));
  const phaseSeed = phases.flatMap(phase => seeds.flatMap(seed => ARMS.map(arm => ({
    phase, seed, arm,
    ...metricSummary(records.filter(row =>
      row.phase === phase && row.seed === seed && row.arm === arm)),
  }))));
  const scenarioSeed = scenarios.flatMap(scenarioId => seeds.map(seed => ({
    scenarioId, seed,
    arms: armObject(records.filter(row => row.scenarioId === scenarioId && row.seed === seed)),
  })));
  const levelUse = ARMS.flatMap(arm => [0, 1, 2, 3, 4].map(level => ({
    arm, level, cases: records.filter(row => row.arm === arm && row.executionLevel === level).length,
  }))).filter(row => row.cases);
  return {
    aggregate, byScenario, byPhase, bySeed, phaseSeed, scenarioSeed, levelUse,
    seedRanges: medianRange(bySeed, ['arm']),
    scenarioSeedRanges: medianRange(
      scenarioSeed.flatMap(row => [
        { scenarioId: row.scenarioId, seed: row.seed, arm: 'process-all', ...row.arms.processAll },
        { scenarioId: row.scenarioId, seed: row.seed, arm: 'full-fb', ...row.arms.fullFb },
        { scenarioId: row.scenarioId, seed: row.seed, arm: 'graduated-fb', ...row.arms.graduatedFb },
        { scenarioId: row.scenarioId, seed: row.seed, arm: 'fast-decay-v2', ...row.arms.fastDecayV2 },
      ]),
      ['scenarioId', 'arm'],
    ),
    phaseSeedRanges: medianRange(phaseSeed, ['phase', 'arm']),
    signedDifferences: {
      graduatedMinusProcessAll: delta(aggregateArms.graduatedFb, aggregateArms.processAll),
      graduatedMinusFullFb: delta(aggregateArms.graduatedFb, aggregateArms.fullFb),
      fullFbMinusProcessAll: delta(aggregateArms.fullFb, aggregateArms.processAll),
      fastDecayMinusGraduated: delta(aggregateArms.fastDecayV2, aggregateArms.graduatedFb),
    },
  };
}

function evaluateAdoption(summary) {
  const byArm = Object.fromEntries(summary.aggregate.map(row => [row.arm, row]));
  const v1 = byArm['graduated-fb'];
  const candidate = byArm['fast-decay-v2'];
  const predicates = {
    immediateSafety: {
      actual: candidate.safetyTriggerResponseRate,
      required: 1,
      passed: candidate.safetyTriggerResponseRate === 1,
    },
    zeroMissedLevels: {
      actual: candidate.missedGraduations,
      required: 0,
      passed: candidate.missedGraduations === 0,
    },
    readinessWithinOnePoint: {
      actual: candidate.productReadyRate,
      required: v1.productReadyRate - 0.01,
      passed: candidate.productReadyRate >= v1.productReadyRate - 0.01,
    },
    noMoreUnresolvedFailures: {
      actual: candidate.unresolvedFailures,
      required: v1.unresolvedFailures,
      passed: candidate.unresolvedFailures <= v1.unresolvedFailures,
    },
    excessControlReduction: {
      actual: candidate.excessControlCases,
      required: v1.falseGraduations * 0.75,
      passed: candidate.excessControlCases <= v1.falseGraduations * 0.75,
    },
    lowerGrossModeledTokens: {
      actual: candidate.modeledTokenUnits,
      required: v1.modeledTokenUnits,
      passed: candidate.modeledTokenUnits < v1.modeledTokenUnits,
    },
    noPrivacyOrReleaseWeakness: {
      actual: candidate.safetyTriggerResponseRate === 1
        && candidate.missedGraduations === 0,
      required: true,
      passed: candidate.safetyTriggerResponseRate === 1
        && candidate.missedGraduations === 0,
    },
  };
  return {
    passed: Object.values(predicates).every(row => row.passed),
    predicates,
  };
}

function runExperiment(options = {}) {
  const truthSource = readJson(options.truthPath || DEFAULT_TRUTH);
  const truth = expandTruth(truthSource);
  const settings = readJson(options.settingsPath || DEFAULT_SETTINGS);
  const rawRecords = [];
  for (const seed of settings.seeds) for (const scenario of truth.scenarios) {
    for (const arm of ARMS) {
      const state = arm === 'fast-decay-v2' ? initialFastDecayState() : initialState();
      for (const item of scenario.cases) {
        const publicItem = projectPublicCase(item);
        const record = executeCase(arm, publicItem, state, settings, seed, scenario.id);
        rawRecords.push(arm === 'fast-decay-v2'
          ? gradeFastDecayRecord({ ...record, scenarioId: scenario.id }, item)
          : gradeRecord({ ...record, scenarioId: scenario.id }, item));
        if (arm === 'graduated-fb') updateState(state, publicItem, record);
        if (arm === 'fast-decay-v2') {
          updateFastDecayState(state, publicItem, record, {
            persistentLevel: record.persistentLevel,
            evidenceWindow: record.evidenceWindow,
          }, settings.fastDecayPolicy);
        }
      }
    }
  }
  const bundle = {
    schemaVersion: 'fb-fast-decay-result-v1',
    experimentId: settings.experimentId,
    evidenceType: {
      outcomes: 'observed deterministic simulator results',
      tokenAndTime: 'modeled, not observed Codex usage',
      productionGeneralization: 'unmeasured',
    },
    supersedes: settings.supersedes,
    supersedesFastDecay: settings.supersedesFastDecay,
    runDeclaration: {
      recordedRun: 'one replacement four-arm run after correcting the unresolved-evidence floor',
      selectiveRerunsAllowed: false,
      postResultTuningPerformed: false,
      developmentHistory: 'A pre-authoritative probe exposed that accepted-repair evidence was not clearing correctly and was repaired before the first evidence write. The first written result was then invalidated in review because unresolved evidence did not actively hold Level 3.',
      limitation: 'The result bundle cannot independently prove historical execution count, absence of exploratory runs, or that thresholds were not tuned.',
    },
    graderEvidence: {
      executableContract: graderExecutableContract(),
      limitation: 'This source hash binds the executable grader used here; it does not prove external preregistration or production validity.',
    },
    inputs: {
      scenarioIds: truth.scenarios.map(row => row.id),
      casesPerScenario: 24,
      phases: settings.phases,
      seeds: settings.seeds,
      arms: ARMS,
      policy: settings.policy,
      fastDecayPolicy: settings.fastDecayPolicy,
      fallibility: settings.fallibility,
    },
    costModel: settings.costModel,
    hashes: {
      truth: hash(truthSource),
      settings: hash(settings),
      policy: hash(settings.policy),
      fastDecayPolicy: hash(settings.fastDecayPolicy),
      costModel: hash(settings.costModel),
      graderImplementation: hash(graderExecutableContract()),
      seeds: hash(settings.seeds),
    },
    rawRecords,
    summary: recompute(rawRecords),
  };
  bundle.adoption = evaluateAdoption(bundle.summary);
  validateBundle(bundle, { truthSource, settings });
  return bundle;
}

function walkPrivacy(value, key = '') {
  if (FORBIDDEN_KEY.test(key)) throw new Error(`Forbidden private field ${key}.`);
  if (typeof value === 'string' && CREDENTIAL.test(value)) throw new Error('Forbidden credential or private material.');
  if (Array.isArray(value)) value.forEach(item => walkPrivacy(item, key));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([child, item]) => walkPrivacy(item, child));
}

function assertFinite(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Non-finite metric.');
  if (Array.isArray(value)) value.forEach(assertFinite);
  else if (value && typeof value === 'object') Object.values(value).forEach(assertFinite);
}

function expectedRaw(truth, settings) {
  const rows = [];
  for (const seed of settings.seeds) for (const scenario of truth.scenarios) for (const arm of ARMS) {
    const state = arm === 'fast-decay-v2' ? initialFastDecayState() : initialState();
    for (const item of scenario.cases) {
      const publicItem = projectPublicCase(item);
      const record = executeCase(arm, publicItem, state, settings, seed, scenario.id);
      rows.push(arm === 'fast-decay-v2'
        ? gradeFastDecayRecord({ ...record, scenarioId: scenario.id }, item)
        : gradeRecord({ ...record, scenarioId: scenario.id }, item));
      if (arm === 'graduated-fb') updateState(state, publicItem, record);
      if (arm === 'fast-decay-v2') {
        updateFastDecayState(state, publicItem, record, {
          persistentLevel: record.persistentLevel,
          evidenceWindow: record.evidenceWindow,
        }, settings.fastDecayPolicy);
      }
    }
  }
  return rows;
}

function validateBundle(bundle, sources = {}) {
  walkPrivacy(bundle);
  assertFinite(bundle);
  const truthSource = sources.truthSource || readJson(DEFAULT_TRUTH);
  const truth = expandTruth(truthSource);
  const settings = sources.settings || readJson(DEFAULT_SETTINGS);
  const hashes = {
    truth: hash(truthSource), settings: hash(settings), policy: hash(settings.policy),
    fastDecayPolicy: hash(settings.fastDecayPolicy),
    costModel: hash(settings.costModel),
    graderImplementation: hash(graderExecutableContract()),
    seeds: hash(settings.seeds),
  };
  if (canonical(bundle.hashes) !== canonical(hashes)) throw new Error('Frozen input hash mismatch.');
  if (canonical(bundle.inputs.policy) !== canonical(settings.policy)
    || canonical(bundle.inputs.fastDecayPolicy) !== canonical(settings.fastDecayPolicy)
    || canonical(bundle.inputs.fallibility) !== canonical(settings.fallibility)) {
    throw new Error('Frozen declared policy or fallibility changed.');
  }
  if (bundle.rawRecords.length !== 1152) throw new Error('Expected 1152 records; missing or selective evidence.');
  const keys = new Set();
  for (const row of bundle.rawRecords) {
    const key = `${row.scenarioId}:${row.caseId}:${row.seed}:${row.arm}`;
    if (keys.has(key)) throw new Error(`Duplicate record ${key}.`);
    keys.add(key);
  }
  if (keys.size !== 1152) throw new Error('Missing benchmark records.');
  if (canonical(bundle.rawRecords) !== canonical(expectedRaw(truth, settings))) {
    throw new Error('Raw records do not match frozen arm execution.');
  }
  if (canonical(bundle.summary) !== canonical(recompute(bundle.rawRecords))) {
    throw new Error('Summary does not match recomputed raw records.');
  }
  if (canonical(bundle.adoption) !== canonical(evaluateAdoption(bundle.summary))) {
    throw new Error('Adoption gate does not match recomputed evidence.');
  }
  return true;
}

function pct(value) {
  return value === null ? 'n/a' : `${(value * 100).toFixed(1)}%`;
}

function reportMarkdown(bundle) {
  const byArm = Object.fromEntries(bundle.summary.aggregate.map(row => [row.arm, row]));
  const armLabel = {
    'process-all': 'Process-all',
    'full-fb': 'Full FB',
    'graduated-fb': 'Graduated FB v1',
    'fast-decay-v2': 'Fast-decay FB v2',
  };
  const outcomeRows = ARMS.map(arm => {
    const row = byArm[arm];
    return `| ${armLabel[arm]} | ${row.productReadyCount}/${row.caseCount} (${pct(row.productReadyRate)}) | ${row.workUnits} | ${row.modeledTokenUnits} | ${row.modeledMinutes.toFixed(1)} | ${row.modeledTokenUnitsPerAccepted.toFixed(0)} | ${row.unnecessaryProcessing} | ${row.unresolvedFailures} |`;
  }).join('\n');
  const scenarioRows = bundle.summary.byScenario.map(row =>
    `| ${row.scenarioId} | ${armLabel[row.arm]} | ${pct(row.productReadyRate)} | ${row.modeledTokenUnits} | ${row.unresolvedFailures} |`).join('\n');
  const phaseRows = bundle.summary.byPhase.map(row =>
    `| ${row.phase} | ${armLabel[row.arm]} | ${pct(row.productReadyRate)} | ${row.modeledTokenUnits} | ${row.repairAttempts} |`).join('\n');
  const seedRows = bundle.summary.bySeed.map(row =>
    `| ${row.seed} | ${armLabel[row.arm]} | ${pct(row.productReadyRate)} | ${row.modeledTokenUnits} | ${row.modeledTokenUnitsPerAccepted.toFixed(0)} |`).join('\n');
  const seedRangeRows = bundle.summary.seedRanges.map(row =>
    `| ${armLabel[row.arm]} | ${pct(row.productReadyRate.median)} | ${pct(row.productReadyRate.range[0])}–${pct(row.productReadyRate.range[1])} | ${row.modeledTokenUnits.median} | ${row.modeledTokenUnits.range[0]}–${row.modeledTokenUnits.range[1]} |`).join('\n');
  const levelRows = bundle.summary.levelUse.map(row =>
    `| ${armLabel[row.arm]} | ${row.level} | ${row.cases} |`).join('\n');
  const hashes = Object.entries(bundle.hashes).map(([name, value]) => `| ${name} | \`${value}\` |`).join('\n');
  const graduated = byArm['graduated-fb'];
  const fast = byArm['fast-decay-v2'];
  const processWins = bundle.summary.scenarioSeed.filter(row =>
    row.arms.processAll.productReadyRate > row.arms.graduatedFb.productReadyRate)
    .map(row => `${row.scenarioId} seed ${row.seed} (${pct(row.arms.processAll.productReadyRate)} process-all versus ${pct(row.arms.graduatedFb.productReadyRate)} graduated)`);
  const processWinText = processWins.length
    ? `Process-all beat Graduated FB in ${processWins.join('; ')}.`
    : 'Process-all had no scenario/seed aggregate ready-rate win over Graduated FB; unfavorable component errors and unresolved outcomes still remain in the raw evidence.';
  const gateRows = Object.entries(bundle.adoption.predicates).map(([name, row]) =>
    `| ${name} | ${String(row.actual)} | ${String(row.required)} | ${row.passed ? 'Pass' : 'Fail'} |`).join('\n');
  return `# FB four-arm fast-decay benchmark\n\n` +
    `Experiment: \`${bundle.experimentId}\`\n\n` +
    `This experiment preserves the reviewed Task 5 evidence unchanged. Its first three arms reproduce the reviewed aggregates and all 864 raw records exactly; Fast-decay FB v2 is the only new arm.\n\n` +
    `It supersedes invalid result \`${bundle.supersedesFastDecay.resultSha256}\` from \`${bundle.supersedesFastDecay.sourceCommit}\`: ${bundle.supersedesFastDecay.reason}\n\n` +
    `This deterministic simulation adds Fast-decay FB v2 to the exact reviewed Process-all, Full FB, and Graduated FB v1 workflows: 288 cases per arm and 1,152 arm/case records overall. Seeds are 11, 29, and 47. ` +
    `Outcomes are simulator observations. Token units and elapsed time are modeled, not observed Codex usage. ` +
    `See the [machine-readable evidence](fast-decay-results.json), the reviewed [graduated benchmark](graduated.md), and the earlier [fixed-treatment benchmark](README.md).\n\n` +
    `## Headline results\n\n| Arm | Product-ready | Work units | Modeled token units | Modeled minutes | Tokens per ready outcome | Unnecessary processing | Unresolved failures |\n|---|---:|---:|---:|---:|---:|---:|---:|\n${outcomeRows}\n\n` +
    `Graduated FB recorded ${pct(graduated.graduationAccuracy)} graduation accuracy, ${graduated.falseGraduations} false graduations, ${graduated.missedGraduations} missed graduations, ` +
    `${graduated.stepDownSuccesses}/${graduated.stepDownOpportunities} step-down successes, and ${pct(graduated.safetyTriggerResponseRate)} immediate safety-trigger response.\n\n` +
    `Fast-decay v2 recorded ${fast.excessControlCases} excess-control cases, ${fast.excessLevelUnits} excess-level units, ${fast.persistentPromotionEvents} persistent promotions, ${fast.falsePersistentPromotions} false persistent promotions, ${fast.temporaryEscalations} temporary escalations, ${fast.missedGraduations} missed levels, and ${pct(fast.safetyTriggerResponseRate)} immediate safety response.\n\n` +
    `## Adoption gate\n\nThe thresholds were frozen for the replacement run; the bundle cannot independently prove absence of tuning. Guidance changes are allowed only if every predicate passes. Overall: **${bundle.adoption.passed ? 'PASS — adopt' : 'FAIL — reject'}**.\n\n| Predicate | Actual | Required | Result |\n|---|---:|---:|---|\n${gateRows}\n\n` +
    `## Scenario results\n\n| Scenario | Arm | Ready rate | Modeled token units | Unresolved failures |\n|---|---|---:|---:|---:|\n${scenarioRows}\n\n` +
    `## Phase results\n\n| Phase | Arm | Ready rate | Modeled token units | Repairs |\n|---|---|---:|---:|---:|\n${phaseRows}\n\n` +
    `## Seed ranges\n\nThe table preserves all three seed outcomes; no unfavorable result was removed or rerun. ${processWinText} Full FB and Graduated FB use common random draws for every like-for-like component call.\n\n| Seed | Arm | Ready rate | Modeled token units | Tokens per ready outcome |\n|---:|---|---:|---:|---:|\n${seedRows}\n\n` +
    `| Arm | Median ready rate | Ready-rate range | Median modeled token units | Modeled-token range |\n|---|---:|---:|---:|---:|\n${seedRangeRows}\n\n` +
    `## Graduated-level use\n\n| Arm | Level | Cases |\n|---|---:|---:|\n${levelRows}\n\n` +
    `## Frozen declared settings\n\nThe policy thresholds, fixtures, fallibility, costs, and seeds were fixed for this replacement run. A pre-authoritative probe exposed accepted-repair clearing and was corrected before the first evidence write. Review then invalidated the first written fast-decay result because unresolved evidence did not actively hold Level 3. There is no external preregistration, and the bundle cannot independently prove historical execution count or absence of tuning.\n\n` +
    `Level 1 requires four prior cases plus visible already-good or ambiguous evidence. Level 2 requires one observed regression. Level 3 requires two classifiable failures. ` +
    `A visible privacy, auth, payment, destructive, provider, migration, or release trigger immediately applies Level 4. Three consecutive clean results permit one-level step-down. ` +
    `Current public ambiguity, regression, classifiable failure, or safety evidence sets a floor before any demotion. Fast-decay v2 requires two corroborating observations inside six cases, permits direct decay after two clean outcomes, and keeps active safety and unresolved evidence. Transitions use public observations only; hidden target levels and grading truth are grader-only.\n\n` +
    `## Evidence hashes\n\n| Frozen input | SHA-256 |\n|---|---|\n${hashes}\n\n` +
    `## Limitations\n\nThis is a deterministic modeled experiment, not production telemetry. It does not establish actual Codex token savings, wall-clock savings, human-attention savings, or population-wide percentages. ` +
    `The cost model and fallibility rates are declared assumptions. Four constructed scenario families cannot represent every project. The replacement-run declaration says no post-result tuning or selective rerun occurred, but the bundle cannot independently prove that history. ` +
    `The grader-implementation hash binds the exact executable target/grading/summary functions in this runner; it does not prove external preregistration, correctness, or production validity. ` +
    `Unfavorable outcomes remain in the evidence. Real projects require prospective observation before these figures can become product claims.\n`;
}

function runAndWrite(options = {}) {
  const bundle = runExperiment(options);
  const outputDirectory = options.outputDirectory || path.join(options.root || ROOT, 'docs', 'benchmarks', 'control-loop');
  fs.mkdirSync(outputDirectory, { recursive: true });
  const resultPath = path.join(outputDirectory, 'fast-decay-results.json');
  const reportPath = path.join(outputDirectory, 'fast-decay.md');
  fs.writeFileSync(resultPath, `${JSON.stringify(bundle, null, 2)}\n`);
  fs.writeFileSync(reportPath, reportMarkdown(bundle));
  validateBundle(readJson(resultPath), {
    truthSource: readJson(options.truthPath || DEFAULT_TRUTH),
    settings: readJson(options.settingsPath || DEFAULT_SETTINGS),
  });
  return { resultPath, reportPath, bundle };
}

function main() {
  if (process.argv.length !== 3 || process.argv[2] !== 'run') {
    console.error('Usage: node tools/fb-fast-decay-benchmark.cjs run');
    process.exitCode = 2;
    return;
  }
  try {
    const written = runAndWrite();
    process.stdout.write(`Wrote ${path.relative(ROOT, written.resultPath)} and ${path.relative(ROOT, written.reportPath)}.\n`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) main();
module.exports = {
  expandTruth, projectPublicCase, initialState, initialFastDecayState,
  makePublicProbe, chooseFastDecayLevel, updateFastDecayState,
  executeCase, executeFastDecayCase, runExperiment, evaluateAdoption,
  recompute, validateBundle, reportMarkdown, runAndWrite,
};
