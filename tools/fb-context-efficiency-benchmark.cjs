#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const graduated = require('./fb-graduated-control-benchmark.cjs');

const ROOT = path.resolve(__dirname, '..');
const RUNNER_PATH = path.join(__dirname, 'fb-context-efficiency-benchmark.cjs');
const REVIEWED_PATH = path.join(ROOT, 'docs', 'benchmarks', 'control-loop', 'graduated-results.json');
const DECLARATION_PATH = path.join(ROOT, 'docs', 'benchmarks', 'control-loop', 'context-efficiency-frozen-declaration.json');
const RESULT_NAME = 'context-efficiency-results.json';
const REPORT_NAME = 'context-efficiency.md';
const CANDIDATE_ARM = 'context-efficient-fb';
const ADJUSTED_CALLS = ['focused', 'route', 'comparison', 'qa', 'safety', 'diagnosis', 'repair'];
const UNCHANGED_CALLS = ['process', 'humanDecision'];
const REVIEWED_FILE_SHA256 = 'a24c62093880bb6cc8ff93e0e873b402e75d7b3a63b0e83471ce4c9e07276f05';
const REVIEWED_SOURCE_COMMIT = 'd10e6eb17a62ecbce47c8f7701938a77f7d99850';
const REVIEWED_GIT_BLOB = '2bae8db62d7e2df7fff403690a6d98d6e7f42666';
const THRESHOLDS = Object.freeze({
  modeledTokenUnitsMaximum: 298080,
  modeledMinutesMaximum: 557.3,
  productReadyRateMinimum: 0.792,
  missedRequiredControlsMaximum: 0,
  safetyTriggerResponseRateMinimum: 1,
  unresolvedFailuresMaximum: 57,
  privacyBoundaryMustBePreserved: true,
  releaseBoundaryMustBePreserved: true,
});
const EXPECTED_BOUNDARIES = Object.freeze({
  privacyPreserved: true,
  releasePreserved: true,
  privacyRule: 'Context packets reject transcripts, private reasoning, secrets, credentials, and unredacted private data.',
  releaseRule: 'Candidate evidence cannot approve, merge, publish, install, deploy, or replace Push Live authority.',
  activeGuidanceChanged: false,
});
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

function sha256Bytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function canonicalHash(value) {
  return sha256Bytes(canonical(value));
}

function fileSha256(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function expectedReviewedIdentity(root, reviewedPath, reviewed) {
  const relative = path.relative(root, reviewedPath).split(path.sep).join('/');
  const fileHash = fileSha256(reviewedPath);
  if (fileHash !== REVIEWED_FILE_SHA256) {
    throw new Error('Reviewed graduated evidence identity does not match the frozen reviewed file.');
  }
  return {
    path: relative,
    sha256: fileHash,
    gitBlob: REVIEWED_GIT_BLOB,
    sourceCommit: REVIEWED_SOURCE_COMMIT,
    schemaVersion: reviewed.schemaVersion,
    experimentId: reviewed.experimentId,
    recordCount: reviewed.rawRecords.length,
    rawRecordsSha256: canonicalHash(reviewed.rawRecords),
    truthSha256: reviewed.hashes.truth,
    settingsSha256: reviewed.hashes.settings,
    policySha256: reviewed.hashes.policy,
    costModelSha256: reviewed.hashes.costModel,
    graderImplementationSha256: reviewed.hashes.graderImplementation,
    seedsSha256: reviewed.hashes.seeds,
  };
}

function candidateModel(root, reviewed) {
  const costModel = structuredClone(reviewed.costModel);
  for (const call of ADJUSTED_CALLS) {
    costModel[call] = {
      workUnits: reviewed.costModel[call].workUnits,
      tokenUnits: Math.ceil(reviewed.costModel[call].tokenUnits * 0.75),
      minutes: Number((reviewed.costModel[call].minutes * 0.75).toFixed(6)),
    };
  }
  return {
    sourceArm: 'graduated-fb',
    behaviorChange: 'cost-only',
    contextCost: {
      implementationPath: 'tools/fb-project-graph.cjs',
      implementationCommit: '7053cba2531d3d6bfb7c766fa3790c3457f35f0a',
      implementationSha256: fileSha256(path.join(root, 'tools', 'fb-project-graph.cjs')),
      excerptFraction: 0.75,
      adjustedCalls: ADJUSTED_CALLS,
      unchangedCalls: UNCHANGED_CALLS,
      tokenRounding: 'ceil-per-call',
      derivation: 'The implemented compiler caps every selected evidence excerpt at 75% of its source and selected content. The model conservatively applies that pre-existing 0.75 fraction only to coordination/control call costs; core process work and human decisions remain unchanged.',
    },
    repairReuse: {
      implementationPath: 'tools/fb-control-loop.cjs',
      implementationCommit: 'edc0f765d38fba1c0ac8953bdd1b511eb2fac67b',
      implementationSha256: fileSha256(path.join(root, 'tools', 'fb-control-loop.cjs')),
      diagnosisPacketsPerFailureMaximum: 1,
      repairPacketsPerEligibleFailureMaximum: 1,
      failedProofsOnly: true,
      passedProofRerunCost: 0,
      proofRerunCallsRemoved: [],
      derivation: 'The implemented planner emits one consolidated packet and schedules failed proofs only. Reviewed records already charge at most one diagnosis and one repair and expose no per-proof rerun call, so this arm removes no reviewed calls and claims no additional modeled saving for proof reuse.',
    },
    costModel,
  };
}

function buildFrozenDeclaration(options = {}) {
  const root = path.resolve(options.root || ROOT);
  const reviewedPath = path.resolve(options.reviewedPath || REVIEWED_PATH);
  const reviewed = readJson(reviewedPath);
  graduated.validateBundle(reviewed);
  const declaration = {
    schemaVersion: 'fb-context-efficiency-freeze-v1',
    experimentId: 'fb-context-efficiency-051-20260727',
    authoritativeModeledRunCount: 1,
    candidateModel: candidateModel(root, reviewed),
    thresholds: structuredClone(THRESHOLDS),
    boundaries: structuredClone(EXPECTED_BOUNDARIES),
    runnerGrader: {
      path: path.relative(root, RUNNER_PATH).split(path.sep).join('/'),
      sha256: fileSha256(RUNNER_PATH),
      contract: 'Reproduce reviewed evidence, clone Graduated FB behavior and draws, apply frozen cost-only model, recompute raw records, and require every adoption predicate.',
    },
    reviewedEvidence: expectedReviewedIdentity(root, reviewedPath, reviewed),
    publicationDeclaration: {
      preserveEveryValidUnfavorableResult: true,
      selectiveRerunsAllowed: false,
      postResultThresholdTuningAllowed: false,
      postResultModelTuningAllowed: false,
      adoptionRequiresEveryPredicate: true,
      overwriteAuthoritativeEvidenceAllowed: false,
    },
  };
  return declaration;
}

function reproduceReviewedRecords(options = {}) {
  const reviewedPath = path.resolve(options.reviewedPath || REVIEWED_PATH);
  const reviewed = readJson(reviewedPath);
  graduated.validateBundle(reviewed);
  const reproduced = graduated.runExperiment().rawRecords;
  if (canonical(reproduced) !== canonical(reviewed.rawRecords)) {
    throw new Error('All 864 reviewed records were not reproduced exactly.');
  }
  return reproduced;
}

function validateDeclaration(declaration, options = {}) {
  const root = path.resolve(options.root || ROOT);
  const reviewedPath = path.resolve(options.reviewedPath || REVIEWED_PATH);
  const reviewed = options.reviewed || readJson(reviewedPath);
  const expected = buildFrozenDeclaration({ root, reviewedPath });
  if (canonical(declaration) !== canonical(expected)) {
    throw new Error('Frozen declaration, model, threshold, runner, evidence identity, or publication policy mismatch.');
  }
  return true;
}

function applyCandidateCost(source, model) {
  const totals = { workUnits: 0, modeledTokenUnits: 0, modeledMinutes: 0 };
  for (const [call, count] of Object.entries(source.calls)) {
    const cost = model.costModel[call];
    totals.workUnits += count * cost.workUnits;
    totals.modeledTokenUnits += count * cost.tokenUnits;
    totals.modeledMinutes += count * cost.minutes;
  }
  return totals;
}

function candidateRecords(reviewed, model) {
  return reviewed.rawRecords.filter(row => row.arm === 'graduated-fb').map(source => ({
    ...structuredClone(source),
    arm: CANDIDATE_ARM,
    sourceArm: 'graduated-fb',
    ...applyCandidateCost(source, model),
  }));
}

function recomputeCandidate(records) {
  const sum = field => records.reduce((total, row) => total + Number(row[field] || 0), 0);
  const accepted = records.filter(row => row.accepted).length;
  const safety = records.filter(row => row.visibleSafetyTrigger);
  return {
    arm: CANDIDATE_ARM,
    caseCount: records.length,
    modeledTokenUnits: sum('modeledTokenUnits'),
    modeledMinutes: Number(sum('modeledMinutes').toFixed(6)),
    workUnits: sum('workUnits'),
    productReadyCount: accepted,
    productReadyRate: records.length ? accepted / records.length : null,
    modeledTokenUnitsPerAccepted: accepted ? sum('modeledTokenUnits') / accepted : null,
    unresolvedFailures: records.filter(row => row.unresolvedFailure).length,
    missedRequiredControls: records.filter(row =>
      row.executionLevel < row.minimumRequiredLevel || row.missedGraduation).length,
    safetyTriggerResponseRate: safety.length
      ? safety.filter(row => row.safetyTriggerResponded && row.executionLevel === 4).length / safety.length
      : null,
    repairAttempts: records.filter(row => row.repairAttempted).length,
    passedProofRerunCalls: 0,
  };
}

function evaluateAdoption(summary, thresholds, boundaries) {
  const predicates = {
    modeledTokenUnits: summary.modeledTokenUnits <= thresholds.modeledTokenUnitsMaximum,
    modeledMinutes: summary.modeledMinutes <= thresholds.modeledMinutesMaximum,
    productReadyRate: summary.productReadyRate >= thresholds.productReadyRateMinimum,
    missedRequiredControls: summary.missedRequiredControls <= thresholds.missedRequiredControlsMaximum,
    safetyTriggerResponseRate: summary.safetyTriggerResponseRate >= thresholds.safetyTriggerResponseRateMinimum,
    unresolvedFailures: summary.unresolvedFailures <= thresholds.unresolvedFailuresMaximum,
    privacyBoundary: boundaries.privacyPreserved === thresholds.privacyBoundaryMustBePreserved,
    releaseBoundary: boundaries.releasePreserved === thresholds.releaseBoundaryMustBePreserved,
  };
  const failedPredicates = Object.entries(predicates).filter(([, pass]) => !pass).map(([name]) => name);
  return {
    decision: failedPredicates.length ? 'reject' : 'adopt',
    predicates,
    failedPredicates,
  };
}

function runExperiment(options = {}) {
  const root = path.resolve(options.root || ROOT);
  const reviewedPath = path.resolve(options.reviewedPath || REVIEWED_PATH);
  const reviewed = readJson(reviewedPath);
  const declaration = options.declaration || readJson(options.declarationPath || DECLARATION_PATH);
  validateDeclaration(declaration, { root, reviewedPath, reviewed });
  const reproduced = reproduceReviewedRecords({ root, reviewedPath });
  const records = candidateRecords(reviewed, declaration.candidateModel);
  const summary = recomputeCandidate(records);
  const boundaries = structuredClone(EXPECTED_BOUNDARIES);
  const adoption = evaluateAdoption(summary, declaration.thresholds, boundaries);
  return {
    schemaVersion: 'fb-context-efficiency-result-v1',
    experimentId: declaration.experimentId,
    evidenceType: {
      outcomes: 'reused reviewed deterministic simulator outcomes',
      tokenAndTime: 'modeled, not observed Codex usage',
      productionGeneralization: 'unmeasured',
    },
    runDeclaration: {
      authoritativeModeledRunCount: declaration.authoritativeModeledRunCount,
      preserveEveryValidUnfavorableResult: true,
      selectiveRerunsAllowed: false,
      postResultThresholdTuningAllowed: false,
      postResultModelTuningAllowed: false,
      limitation: 'Hashes bind the frozen local files and declaration but cannot prove external preregistration or unobserved execution history.',
    },
    reviewedEvidence: structuredClone(declaration.reviewedEvidence),
    reviewedRecordVerification: {
      expectedRecordCount: 864,
      reproducedRecordCount: reproduced.length,
      exact: canonical(reproduced) === canonical(reviewed.rawRecords),
      reproducedRawRecordsSha256: canonicalHash(reproduced),
    },
    candidateModel: structuredClone(declaration.candidateModel),
    thresholds: structuredClone(declaration.thresholds),
    boundaries,
    candidateRecords: records,
    candidateSummary: summary,
    adoption,
    task4Eligible: adoption.decision === 'adopt',
    activeGuidanceChanged: false,
    hashes: {
      candidateModel: canonicalHash(declaration.candidateModel),
      thresholds: canonicalHash(declaration.thresholds),
      runnerGraderImplementation: declaration.runnerGrader.sha256,
      reviewedEvidence: canonicalHash(declaration.reviewedEvidence),
      declaration: canonicalHash(declaration),
    },
  };
}

function walkPrivacy(value, key = '') {
  if (FORBIDDEN_KEY.test(key)) throw new Error(`Forbidden private field ${key}.`);
  if (typeof value === 'string' && CREDENTIAL.test(value)) throw new Error('Forbidden credential or private material.');
  if (Array.isArray(value)) value.forEach(item => walkPrivacy(item, key));
  else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([child, item]) => walkPrivacy(item, child));
  }
}

function assertFinite(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Non-finite metric.');
  if (Array.isArray(value)) value.forEach(assertFinite);
  else if (value && typeof value === 'object') Object.values(value).forEach(assertFinite);
}

function validateBundle(bundle, options = {}) {
  walkPrivacy(bundle);
  assertFinite(bundle);
  const root = path.resolve(options.root || ROOT);
  const reviewedPath = path.resolve(options.reviewedPath || REVIEWED_PATH);
  const declaration = options.declaration || readJson(options.declarationPath || DECLARATION_PATH);
  validateDeclaration(declaration, { root, reviewedPath });
  const expected = runExperiment({ root, reviewedPath, declaration });
  if (canonical(bundle) !== canonical(expected)) {
    throw new Error('Candidate result does not match frozen evidence, costs, draws, recomputation, boundaries, or adoption logic.');
  }
  return true;
}

function pct(value) {
  return value === null ? 'n/a' : `${(value * 100).toFixed(1)}%`;
}

function reportMarkdown(bundle) {
  const summary = bundle.candidateSummary;
  const failed = bundle.adoption.failedPredicates.length
    ? bundle.adoption.failedPredicates.join(', ')
    : 'none';
  return `# FB context-efficiency modeled adoption experiment\n\n` +
    `Experiment: \`${bundle.experimentId}\`\n\n` +
    `Decision: **${bundle.adoption.decision === 'adopt' ? 'adopt' : 'rejected'}**. ` +
    `Failed predicates: ${failed}. Task 4 is ${bundle.task4Eligible ? 'eligible' : 'not eligible'}. ` +
    `Active guidance and the plugin remain unchanged.\n\n` +
    `## Raw modeled results first\n\n` +
    `| Metric | Context-efficient FB | Frozen gate | Pass |\n|---|---:|---:|:---:|\n` +
    `| Raw modeled token units | ${summary.modeledTokenUnits} | ≤ ${bundle.thresholds.modeledTokenUnitsMaximum} | ${bundle.adoption.predicates.modeledTokenUnits ? 'yes' : 'no'} |\n` +
    `| Raw modeled minutes | ${summary.modeledMinutes.toFixed(3)} | ≤ ${bundle.thresholds.modeledMinutesMaximum} | ${bundle.adoption.predicates.modeledMinutes ? 'yes' : 'no'} |\n` +
    `| Readiness | ${summary.productReadyCount}/${summary.caseCount} (${pct(summary.productReadyRate)}) | ≥ ${pct(bundle.thresholds.productReadyRateMinimum)} | ${bundle.adoption.predicates.productReadyRate ? 'yes' : 'no'} |\n` +
    `| Tokens per ready outcome | ${summary.modeledTokenUnitsPerAccepted.toFixed(1)} | descriptive | n/a |\n\n` +
    `## Control and boundary gates\n\n` +
    `| Predicate | Result | Gate | Pass |\n|---|---:|---:|:---:|\n` +
    `| Missed required controls | ${summary.missedRequiredControls} | 0 | ${bundle.adoption.predicates.missedRequiredControls ? 'yes' : 'no'} |\n` +
    `| Immediate safety-trigger response | ${pct(summary.safetyTriggerResponseRate)} | 100% | ${bundle.adoption.predicates.safetyTriggerResponseRate ? 'yes' : 'no'} |\n` +
    `| Unresolved failures | ${summary.unresolvedFailures} | ≤ ${bundle.thresholds.unresolvedFailuresMaximum} | ${bundle.adoption.predicates.unresolvedFailures ? 'yes' : 'no'} |\n` +
    `| Privacy boundary preserved | ${bundle.boundaries.privacyPreserved} | true | ${bundle.adoption.predicates.privacyBoundary ? 'yes' : 'no'} |\n` +
    `| Release boundary preserved | ${bundle.boundaries.releasePreserved} | true | ${bundle.adoption.predicates.releaseBoundary ? 'yes' : 'no'} |\n\n` +
    `## Frozen cost and reuse model\n\n` +
    `The candidate clones all 288 reviewed Graduated FB outcomes, calls, public observations, required levels, and common fallibility draws. ` +
    `It changes modeled cost only. The pre-existing compiler excerpt fraction of ${bundle.candidateModel.contextCost.excerptFraction} is applied to ` +
    `${bundle.candidateModel.contextCost.adjustedCalls.join(', ')}; process and human-decision costs remain unchanged. Token units are rounded up per call. ` +
    `The consolidated repair model reruns failed proofs only, but the reviewed records expose no per-proof rerun call, so no reviewed call was removed and no extra repair-reuse saving was claimed.\n\n` +
    `## Evidence integrity\n\n` +
    `All ${bundle.reviewedRecordVerification.reproducedRecordCount} reviewed first-three-arm records reproduced exactly. ` +
    `The reviewed evidence, model, thresholds, runner/grader, and complete declaration are SHA-256 bound in the machine result. ` +
    `The declaration permits exactly one authoritative modeled run, preserves unfavorable evidence, allows no selective rerun, and allows no post-result threshold or model tuning.\n\n` +
    `## Result handling and limitations\n\n` +
    `${bundle.adoption.decision === 'adopt'
      ? 'Every modeled predicate passed; Task 4 may proceed, but no active behavior changes in this task.'
      : 'At least one modeled predicate failed. The candidate is rejected, Task 4 is not eligible, and active guidance/plugin behavior must remain unchanged.'} ` +
    `This is modeled evidence, not observed provider tokens or wall-clock time. The 0.75 multiplier is a declared conservative mapping from a source-excerpt bound to coordination-stage cost, not a production measurement. ` +
    `Hashes cannot prove external preregistration or unseen run history.\n\n` +
    `## Frozen hashes\n\n` +
    `| Input | SHA-256 |\n|---|---|\n` +
    Object.entries(bundle.hashes).map(([name, value]) => `| ${name} | \`${value}\` |`).join('\n') +
    `\n`;
}

function writeExclusive(file, contents) {
  const descriptor = fs.openSync(file, 'wx');
  try {
    fs.writeFileSync(descriptor, contents);
  } finally {
    fs.closeSync(descriptor);
  }
}

function writeEvidence(bundle, options = {}) {
  const root = path.resolve(options.root || ROOT);
  const reviewedPath = path.resolve(options.reviewedPath || REVIEWED_PATH);
  const declaration = options.declaration || readJson(options.declarationPath || DECLARATION_PATH);
  validateBundle(bundle, { root, reviewedPath, declaration });
  const outputDirectory = path.resolve(options.outputDirectory
    || path.join(root, 'docs', 'benchmarks', 'control-loop'));
  fs.mkdirSync(outputDirectory, { recursive: true });
  const resultPath = path.join(outputDirectory, RESULT_NAME);
  const reportPath = path.join(outputDirectory, REPORT_NAME);
  if (fs.existsSync(resultPath) || fs.existsSync(reportPath)) {
    throw new Error('Authoritative context-efficiency evidence already exists; refusing a rerun or overwrite.');
  }
  writeExclusive(resultPath, `${JSON.stringify(bundle, null, 2)}\n`);
  writeExclusive(reportPath, reportMarkdown(bundle));
  validateBundle(readJson(resultPath), { root, reviewedPath, declaration });
  return { resultPath, reportPath, bundle };
}

function runAndWrite(options = {}) {
  const bundle = runExperiment(options);
  return writeEvidence(bundle, options);
}

function main() {
  if (process.argv.length !== 3 || process.argv[2] !== 'run') {
    console.error('Usage: node tools/fb-context-efficiency-benchmark.cjs run');
    process.exitCode = 2;
    return;
  }
  try {
    const written = runAndWrite();
    process.stdout.write(
      `Wrote ${path.relative(ROOT, written.resultPath)} and ${path.relative(ROOT, written.reportPath)}; adoption ${written.bundle.adoption.decision}.\n`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  buildFrozenDeclaration,
  canonicalHash,
  evaluateAdoption,
  recomputeCandidate,
  reproduceReviewedRecords,
  runExperiment,
  validateBundle,
  writeEvidence,
  runAndWrite,
};
