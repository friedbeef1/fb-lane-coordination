#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_TRUTH = path.join(__dirname, 'fixtures', 'fb-graduated-control-truth.json');
const DEFAULT_SETTINGS = path.join(__dirname, 'fixtures', 'fb-graduated-control-settings.json');
const ARMS = ['process-all', 'full-fb', 'graduated-fb'];
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
  if (arm === 'process-all') executionLevel = 0;
  else if (arm === 'full-fb') executionLevel = 4;
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
  return {
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

function graderExecutableContract() {
  return [
    `blueprintDetails=${blueprintDetails.toString()}`,
    `expandTruth=${expandTruth.toString()}`,
    `publicRequiredFloor=${publicRequiredFloor.toString()}`,
    `gradeRecord=${gradeRecord.toString()}`,
    `metricSummary=${metricSummary.toString()}`,
  ].join('\n\n');
}

function armObject(records) {
  return {
    processAll: metricSummary(records.filter(row => row.arm === 'process-all')),
    fullFb: metricSummary(records.filter(row => row.arm === 'full-fb')),
    graduatedFb: metricSummary(records.filter(row => row.arm === 'graduated-fb')),
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
      ]),
      ['scenarioId', 'arm'],
    ),
    phaseSeedRanges: medianRange(phaseSeed, ['phase', 'arm']),
    signedDifferences: {
      graduatedMinusProcessAll: delta(aggregateArms.graduatedFb, aggregateArms.processAll),
      graduatedMinusFullFb: delta(aggregateArms.graduatedFb, aggregateArms.fullFb),
      fullFbMinusProcessAll: delta(aggregateArms.fullFb, aggregateArms.processAll),
    },
  };
}

function runExperiment(options = {}) {
  const truthSource = readJson(options.truthPath || DEFAULT_TRUTH);
  const truth = expandTruth(truthSource);
  const settings = readJson(options.settingsPath || DEFAULT_SETTINGS);
  const rawRecords = [];
  for (const seed of settings.seeds) for (const scenario of truth.scenarios) {
    for (const arm of ARMS) {
      const state = initialState();
      for (const item of scenario.cases) {
        const publicItem = projectPublicCase(item);
        const record = executeCase(arm, publicItem, state, settings, seed, scenario.id);
        rawRecords.push(gradeRecord({ ...record, scenarioId: scenario.id }, item));
        if (arm === 'graduated-fb') updateState(state, publicItem, record);
      }
    }
  }
  const bundle = {
    schemaVersion: 'fb-graduated-control-result-v2',
    experimentId: settings.experimentId,
    evidenceType: {
      outcomes: 'observed deterministic simulator results',
      tokenAndTime: 'modeled, not observed Codex usage',
      productionGeneralization: 'unmeasured',
    },
    supersedes: settings.supersedes,
    runDeclaration: {
      recordedRun: 'one replacement comparative run after the consolidated methodology repair',
      selectiveRerunsAllowed: false,
      postResultTuningPerformed: false,
      limitation: 'The result bundle cannot independently prove historical execution count or absence of exploratory runs.',
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
      fallibility: settings.fallibility,
    },
    costModel: settings.costModel,
    hashes: {
      truth: hash(truthSource),
      settings: hash(settings),
      policy: hash(settings.policy),
      costModel: hash(settings.costModel),
      graderImplementation: hash(graderExecutableContract()),
      seeds: hash(settings.seeds),
    },
    rawRecords,
    summary: recompute(rawRecords),
  };
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
    const state = initialState();
    for (const item of scenario.cases) {
      const publicItem = projectPublicCase(item);
      const record = executeCase(arm, publicItem, state, settings, seed, scenario.id);
      rows.push(gradeRecord({ ...record, scenarioId: scenario.id }, item));
      if (arm === 'graduated-fb') updateState(state, publicItem, record);
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
    costModel: hash(settings.costModel),
    graderImplementation: hash(graderExecutableContract()),
    seeds: hash(settings.seeds),
  };
  if (canonical(bundle.hashes) !== canonical(hashes)) throw new Error('Frozen input hash mismatch.');
  if (canonical(bundle.inputs.policy) !== canonical(settings.policy)
    || canonical(bundle.inputs.fallibility) !== canonical(settings.fallibility)) {
    throw new Error('Frozen declared policy or fallibility changed.');
  }
  if (bundle.rawRecords.length !== 864) throw new Error('Expected 864 records; missing or selective evidence.');
  const keys = new Set();
  for (const row of bundle.rawRecords) {
    const key = `${row.scenarioId}:${row.caseId}:${row.seed}:${row.arm}`;
    if (keys.has(key)) throw new Error(`Duplicate record ${key}.`);
    keys.add(key);
  }
  if (keys.size !== 864) throw new Error('Missing benchmark records.');
  if (canonical(bundle.rawRecords) !== canonical(expectedRaw(truth, settings))) {
    throw new Error('Raw records do not match frozen arm execution.');
  }
  if (canonical(bundle.summary) !== canonical(recompute(bundle.rawRecords))) {
    throw new Error('Summary does not match recomputed raw records.');
  }
  return true;
}

function pct(value) {
  return value === null ? 'n/a' : `${(value * 100).toFixed(1)}%`;
}

function reportMarkdown(bundle) {
  const byArm = Object.fromEntries(bundle.summary.aggregate.map(row => [row.arm, row]));
  const armLabel = { 'process-all': 'Process-all', 'full-fb': 'Full FB', 'graduated-fb': 'Graduated FB' };
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
  const processWins = bundle.summary.scenarioSeed.filter(row =>
    row.arms.processAll.productReadyRate > row.arms.graduatedFb.productReadyRate)
    .map(row => `${row.scenarioId} seed ${row.seed} (${pct(row.arms.processAll.productReadyRate)} process-all versus ${pct(row.arms.graduatedFb.productReadyRate)} graduated)`);
  const processWinText = processWins.length
    ? `Process-all beat Graduated FB in ${processWins.join('; ')}.`
    : 'Process-all had no scenario/seed aggregate ready-rate win over Graduated FB; unfavorable component errors and unresolved outcomes still remain in the raw evidence.';
  return `# FB three-arm graduated-control benchmark\n\n` +
    `Experiment: \`${bundle.experimentId}\`\n\n` +
    `This result supersedes the non-publishable result \`${bundle.supersedes.resultSha256}\` from \`${bundle.supersedes.sourceCommit}\`: ${bundle.supersedes.reason}\n\n` +
    `This deterministic simulation compares Process-all, Full FB, and Graduated FB across four mixed-complexity scenarios with 24 sequential cases each: 96 cases per arm per seed, 288 cases per arm, and 864 arm/case records overall. Seeds are 11, 29, and 47. ` +
    `Outcomes are simulator observations. Token units and elapsed time are modeled, not observed Codex usage. ` +
    `See the [machine-readable evidence](graduated-results.json) and the earlier [fixed-treatment benchmark](README.md).\n\n` +
    `## Headline results\n\n| Arm | Product-ready | Work units | Modeled token units | Modeled minutes | Tokens per ready outcome | Unnecessary processing | Unresolved failures |\n|---|---:|---:|---:|---:|---:|---:|---:|\n${outcomeRows}\n\n` +
    `Graduated FB recorded ${pct(graduated.graduationAccuracy)} graduation accuracy, ${graduated.falseGraduations} false graduations, ${graduated.missedGraduations} missed graduations, ` +
    `${graduated.stepDownSuccesses}/${graduated.stepDownOpportunities} step-down successes, and ${pct(graduated.safetyTriggerResponseRate)} immediate safety-trigger response.\n\n` +
    `## Scenario results\n\n| Scenario | Arm | Ready rate | Modeled token units | Unresolved failures |\n|---|---|---:|---:|---:|\n${scenarioRows}\n\n` +
    `## Phase results\n\n| Phase | Arm | Ready rate | Modeled token units | Repairs |\n|---|---|---:|---:|---:|\n${phaseRows}\n\n` +
    `## Seed ranges\n\nThe table preserves all three seed outcomes; no unfavorable result was removed or rerun. ${processWinText} Full FB and Graduated FB use common random draws for every like-for-like component call.\n\n| Seed | Arm | Ready rate | Modeled token units | Tokens per ready outcome |\n|---:|---|---:|---:|---:|\n${seedRows}\n\n` +
    `| Arm | Median ready rate | Ready-rate range | Median modeled token units | Modeled-token range |\n|---|---:|---:|---:|---:|\n${seedRangeRows}\n\n` +
    `## Graduated-level use\n\n| Arm | Level | Cases |\n|---|---:|---:|\n${levelRows}\n\n` +
    `## Frozen declared settings\n\nThe policy, fixtures, fallibility, costs, and seeds were fixed before the one recorded replacement run. There is no external preregistration, and the bundle cannot independently prove historical execution count.\n\n` +
    `Level 1 requires four prior cases plus visible already-good or ambiguous evidence. Level 2 requires one observed regression. Level 3 requires two classifiable failures. ` +
    `A visible privacy, auth, payment, destructive, provider, migration, or release trigger immediately applies Level 4. Three consecutive clean results permit one-level step-down. ` +
    `Current public ambiguity, regression, classifiable failure, or safety evidence sets a floor before any demotion. Transitions use public observations only; hidden target levels and grading truth are grader-only.\n\n` +
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
  const resultPath = path.join(outputDirectory, 'graduated-results.json');
  const reportPath = path.join(outputDirectory, 'graduated.md');
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
    console.error('Usage: node tools/fb-graduated-control-benchmark.cjs run');
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
  expandTruth, projectPublicCase, initialState, executeCase, runExperiment,
  recompute, validateBundle, reportMarkdown, runAndWrite,
};
