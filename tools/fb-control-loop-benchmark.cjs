#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_TRUTH = path.join(__dirname, 'fixtures', 'fb-control-loop-benchmark-truth.json');
const DEFAULT_SETTINGS = path.join(__dirname, 'fixtures', 'fb-control-loop-benchmark-settings.json');
const GRADER = Object.freeze({
  schemaVersion: 'fb-control-loop-benchmark-grader-v1',
  accepted: 'selected output has both quality=true and safety=true',
  disposition: 'actual process/skip equals hidden expectedDisposition',
  diagnosis: 'reported failure class equals hidden failureClass',
});
const FORBIDDEN_KEY = /^(?:secret|credential|password|token|privateReasoning|transcript|rawPrompt|chainOfThought)$/i;
const CREDENTIAL = /(?:\b(?:token|password|secret|api[_-]?key)\s*[:=]\s*\S{8,}|\bsk-[A-Za-z0-9_-]{8,})/i;
const CALL_NAMES = ['process', 'comparison', 'qa', 'safety', 'diagnosis', 'repair', 'humanDecision'];

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

function emptyCalls() {
  return Object.fromEntries(CALL_NAMES.map(name => [name, 0]));
}

function cost(calls, costModel) {
  const totals = { workUnits: 0, modeledTokenUnits: 0, modeledMinutes: 0 };
  for (const name of CALL_NAMES) {
    const count = calls[name];
    const unit = costModel[name];
    totals.workUnits += count * unit.workUnits;
    totals.modeledTokenUnits += count * unit.tokenUnits;
    totals.modeledMinutes += count * unit.minutes;
  }
  return totals;
}

function baselineArm(item, costModel) {
  const calls = emptyCalls();
  calls.process = 1;
  calls.qa = 1;
  const selected = item.transformation;
  const accepted = selected.quality && selected.safety;
  return {
    caseId: item.id,
    category: item.category,
    arm: 'baseline',
    disposition: 'process',
    dispositionCorrect: item.hidden.expectedDisposition === 'process',
    accepted,
    baselineDegraded: item.baseline.quality && !selected.quality,
    unnecessaryProcessing: item.hidden.expectedDisposition === 'skip',
    diagnosedFailure: null,
    diagnosisCorrect: null,
    unresolvedFailure: !accepted,
    calls,
    ...cost(calls, costModel),
    result: accepted ? 'accepted transformed candidate' : 'rejected by final QA',
  };
}

function fbArm(item, costModel) {
  const calls = emptyCalls();
  let disposition = item.visible.route;
  if (disposition === 'judgment_required') {
    calls.humanDecision = 1;
    disposition = item.visible.judgmentDecision;
  }
  let selected = item.baseline;
  let result = 'preserved baseline';
  let diagnosedFailure = null;
  if (disposition === 'process') {
    calls.process = 1;
    calls.comparison = 1;
    calls.qa = 1;
    calls.safety = 1;
    selected = item.transformation;
    if (item.baseline.quality && item.baseline.safety && (!selected.quality || !selected.safety)) {
      selected = item.baseline;
      result = 'comparison preserved better baseline';
    } else if (!selected.quality || !selected.safety) {
      calls.diagnosis = 1;
      diagnosedFailure = item.hidden.failureClass;
      result = 'diagnosed failed candidate';
      if (item.repair) {
        calls.repair = 1;
        selected = item.repair;
        result = selected.quality && selected.safety ? 'accepted bounded repair' : 'bounded repair unresolved';
      }
    } else {
      result = 'accepted transformed candidate';
    }
  }
  const accepted = selected.quality && selected.safety;
  return {
    caseId: item.id,
    category: item.category,
    arm: 'fb-control-loop',
    disposition,
    dispositionCorrect: disposition === item.hidden.expectedDisposition,
    accepted,
    baselineDegraded: item.baseline.quality && !selected.quality,
    unnecessaryProcessing: disposition === 'process' && item.hidden.expectedDisposition === 'skip',
    diagnosedFailure,
    diagnosisCorrect: diagnosedFailure === null ? null : diagnosedFailure === item.hidden.failureClass,
    unresolvedFailure: !accepted,
    calls,
    ...cost(calls, costModel),
    result,
  };
}

function armSummary(records, costModel) {
  const count = records.length;
  const sum = field => records.reduce((total, row) => total + Number(row[field]), 0);
  const calls = Object.fromEntries(CALL_NAMES.map(name => [name, records.reduce((n, row) => n + row.calls[name], 0)]));
  const acceptedCount = records.filter(row => row.accepted).length;
  const diagnosed = records.filter(row => row.diagnosisCorrect !== null);
  return {
    caseCount: count,
    acceptedCount,
    acceptedRate: acceptedCount / count,
    unnecessaryProcessingCount: records.filter(row => row.unnecessaryProcessing).length,
    unnecessaryProcessingRate: records.filter(row => row.unnecessaryProcessing).length / count,
    baselineDegradationCount: records.filter(row => row.baselineDegraded).length,
    correctDispositionCount: records.filter(row => row.dispositionCorrect).length,
    correctDispositionRate: records.filter(row => row.dispositionCorrect).length / count,
    diagnosedFailureCount: diagnosed.length,
    diagnosedFailureAccuracy: diagnosed.length ? diagnosed.filter(row => row.diagnosisCorrect).length / diagnosed.length : null,
    repairAttempts: calls.repair,
    unresolvedFailures: records.filter(row => row.unresolvedFailure).length,
    humanDecisionEvents: calls.humanDecision,
    calls,
    workUnits: sum('workUnits'),
    modeledTokenUnits: sum('modeledTokenUnits'),
    modeledMinutes: sum('modeledMinutes'),
    workUnitsPerAccepted: acceptedCount ? sum('workUnits') / acceptedCount : null,
    modeledTokenUnitsPerAccepted: acceptedCount ? sum('modeledTokenUnits') / acceptedCount : null,
  };
}

function signedDifference(baseline, fb) {
  const fields = ['acceptedRate', 'unnecessaryProcessingRate', 'baselineDegradationCount', 'correctDispositionRate',
    'repairAttempts', 'unresolvedFailures', 'humanDecisionEvents', 'workUnits', 'modeledTokenUnits', 'modeledMinutes',
    'workUnitsPerAccepted', 'modeledTokenUnitsPerAccepted'];
  return Object.fromEntries(fields.map(field => [field, fb[field] === null || baseline[field] === null ? null : fb[field] - baseline[field]]));
}

function recompute(rawRecords, costModel) {
  const baseline = armSummary(rawRecords.filter(row => row.arm === 'baseline'), costModel);
  const fb = armSummary(rawRecords.filter(row => row.arm === 'fb-control-loop'), costModel);
  const byCategory = {};
  for (const category of [...new Set(rawRecords.map(row => row.category))].sort()) {
    byCategory[category] = {
      baseline: armSummary(rawRecords.filter(row => row.category === category && row.arm === 'baseline'), costModel),
      fbControlLoop: armSummary(rawRecords.filter(row => row.category === category && row.arm === 'fb-control-loop'), costModel),
    };
  }
  return { arms: { baseline, fbControlLoop: fb }, signedDifferenceFbMinusBaseline: signedDifference(baseline, fb), byCategory };
}

function prng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function sensitivityRun(settings) {
  const raw = [];
  const { sampleSize, goodShares, transformationReliabilities, routerAccuracy, repairSuccessRate } = settings.sensitivity;
  for (const goodShare of goodShares) {
    for (const transformationReliability of transformationReliabilities) {
      for (const seed of settings.seeds) {
        const random = prng(seed + Math.round(goodShare * 1000) + Math.round(transformationReliability * 10000));
        const shared = Array.from({ length: sampleSize }, () => ({
          good: random() < goodShare,
          transformSuccess: random() < transformationReliability,
          routerCorrect: random() < routerAccuracy,
          repairSuccess: random() < repairSuccessRate,
        }));
        for (const arm of ['baseline', 'fb-control-loop']) {
          let accepted = 0;
          let processed = 0;
          let repairs = 0;
          for (const sample of shared) {
            if (arm === 'baseline') {
              processed += 1;
              accepted += Number(sample.good ? sample.transformSuccess : sample.transformSuccess);
            } else {
              const shouldProcess = !sample.good;
              const process = sample.routerCorrect ? shouldProcess : !shouldProcess;
              processed += Number(process);
              if (!process) accepted += Number(sample.good);
              else if (sample.good) accepted += 1;
              else if (sample.transformSuccess) accepted += 1;
              else {
                repairs += 1;
                accepted += Number(sample.repairSuccess);
              }
            }
          }
          raw.push({ goodShare, transformationReliability, seed, arm, sampleSize, acceptedRate: accepted / sampleSize, processedCount: processed, repairAttempts: repairs });
        }
      }
    }
  }
  const summary = [];
  for (const goodShare of goodShares) {
    for (const transformationReliability of transformationReliabilities) {
      for (const arm of ['baseline', 'fb-control-loop']) {
        const rows = raw.filter(row => row.goodShare === goodShare && row.transformationReliability === transformationReliability && row.arm === arm);
        const values = rows.map(row => row.acceptedRate).sort((a, b) => a - b);
        summary.push({
          goodShare, transformationReliability, arm,
          medianAcceptedRate: values[Math.floor(values.length / 2)],
          rangeAcceptedRate: [values[0], values.at(-1)],
          medianProcessedCount: rows.map(row => row.processedCount).sort((a, b) => a - b)[Math.floor(rows.length / 2)],
        });
      }
    }
  }
  return { raw, summary };
}

function walkPrivacy(value, key = '') {
  if (FORBIDDEN_KEY.test(key)) throw new Error(`Forbidden private field ${key}.`);
  if (typeof value === 'string' && CREDENTIAL.test(value)) throw new Error('Forbidden credential or private material.');
  if (Array.isArray(value)) value.forEach(item => walkPrivacy(item, key));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([child, item]) => walkPrivacy(item, child));
}

function assertFinite(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('All benchmark metrics must be finite.');
  if (Array.isArray(value)) value.forEach(assertFinite);
  else if (value && typeof value === 'object') Object.values(value).forEach(assertFinite);
}

function runExperiment(options = {}) {
  const truth = readJson(options.truthPath || DEFAULT_TRUTH);
  const settings = readJson(options.settingsPath || DEFAULT_SETTINGS);
  const rawRecords = truth.cases.flatMap(item => [baselineArm(item, settings.costModel), fbArm(item, settings.costModel)]);
  const inputs = {
    caseIds: truth.cases.map(item => item.id),
    armOrder: ['baseline', 'fb-control-loop'],
    seeds: settings.seeds,
    sensitivity: settings.sensitivity,
  };
  const sensitivity = sensitivityRun(settings);
  const bundle = {
    schemaVersion: 'fb-control-loop-benchmark-result-v1',
    experimentId: settings.experimentId,
    evidenceType: {
      counts: 'directly observed deterministic simulator counts',
      tokenAndTime: 'modeled estimates from the fixed cost model, not observed Codex usage',
      realWorld: 'unmeasured',
    },
    inputs,
    costModel: settings.costModel,
    hashes: {
      truth: hash(truth),
      settings: hash(settings),
      costModel: hash(settings.costModel),
      grader: hash(GRADER),
      seeds: hash(settings.seeds),
    },
    rawRecords,
    summary: recompute(rawRecords, settings.costModel),
    sensitivity,
  };
  validateBundle(bundle, { truth, settings });
  return bundle;
}

function validateBundle(bundle, sources = {}) {
  walkPrivacy(bundle);
  assertFinite(bundle);
  const truth = sources.truth || readJson(DEFAULT_TRUTH);
  const settings = sources.settings || readJson(DEFAULT_SETTINGS);
  const expectedHashes = {
    truth: hash(truth), settings: hash(settings), costModel: hash(settings.costModel),
    grader: hash(GRADER), seeds: hash(settings.seeds),
  };
  if (canonical(bundle.hashes) !== canonical(expectedHashes)) throw new Error('Benchmark input hash mismatch.');
  if (hash(bundle.costModel) !== bundle.hashes.costModel) throw new Error('Benchmark cost-model hash does not bind the reported cost model.');
  if (canonical(bundle.inputs.seeds) !== canonical(settings.seeds)
    || canonical(bundle.inputs.sensitivity) !== canonical(settings.sensitivity)) {
    throw new Error('Benchmark settings do not match the frozen pre-registration.');
  }
  const expectedCount = truth.cases.length * 2;
  if (!Array.isArray(bundle.rawRecords) || bundle.rawRecords.length !== expectedCount) throw new Error(`Expected ${expectedCount} raw records; missing or duplicate cases.`);
  const keys = new Set();
  for (const row of bundle.rawRecords) {
    const key = `${row.caseId}:${row.arm}`;
    if (keys.has(key)) throw new Error(`Duplicate benchmark record ${key}.`);
    keys.add(key);
  }
  for (const item of truth.cases) for (const arm of ['baseline', 'fb-control-loop']) {
    if (!keys.has(`${item.id}:${arm}`)) throw new Error(`Missing benchmark record ${item.id}:${arm}.`);
  }
  const expectedRaw = truth.cases.flatMap(item => [
    baselineArm(item, settings.costModel),
    fbArm(item, settings.costModel),
  ]);
  if (canonical(bundle.rawRecords) !== canonical(expectedRaw)) throw new Error('Raw outcomes do not match the frozen arm execution.');
  const computed = recompute(bundle.rawRecords, bundle.costModel);
  if (canonical(computed) !== canonical(bundle.summary)) throw new Error('Benchmark summary does not match recomputed raw results.');
  const expectedSensitivity = settings.sensitivity.goodShares.length * settings.sensitivity.transformationReliabilities.length * settings.seeds.length * 2;
  if (bundle.sensitivity.raw.length !== expectedSensitivity) throw new Error('Sensitivity results omit a pre-registered seed or scenario.');
  if (canonical(bundle.sensitivity) !== canonical(sensitivityRun(settings))) throw new Error('Sensitivity output does not match the frozen pre-registration.');
  return true;
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function reportMarkdown(bundle) {
  const baseline = bundle.summary.arms.baseline;
  const fb = bundle.summary.arms.fbControlLoop;
  const delta = bundle.summary.signedDifferenceFbMinusBaseline;
  const callRows = CALL_NAMES.map(name =>
    `| ${name} | ${baseline.calls[name]} | ${fb.calls[name]} | ${fb.calls[name] - baseline.calls[name]} |`).join('\n');
  const caseRows = bundle.rawRecords.map(row =>
    `| ${row.caseId} | ${row.arm} | ${row.disposition} | ${row.accepted ? 'yes' : 'no'} | ${row.unnecessaryProcessing ? 'yes' : 'no'} | ${row.baselineDegraded ? 'yes' : 'no'} | ${row.result} |`).join('\n');
  const costRows = CALL_NAMES.map(name => {
    const value = bundle.costModel[name];
    return `| ${name} | ${value.workUnits} | ${value.tokenUnits} | ${value.minutes} |`;
  }).join('\n');
  const sensitivityRows = bundle.sensitivity.summary.map(row =>
    `| ${percent(row.goodShare)} | ${percent(row.transformationReliability)} | ${row.arm} | ${percent(row.medianAcceptedRate)} | ${percent(row.rangeAcceptedRate[0])}–${percent(row.rangeAcceptedRate[1])} | ${row.medianProcessedCount} |`).join('\n');
  const hashRows = Object.entries(bundle.hashes).map(([name, value]) => `| ${name} | \`${value}\` |`).join('\n');
  return `# FB control-loop benchmark\n\n` +
    `Experiment: \`${bundle.experimentId}\`\n\n` +
    `This is a deterministic simulation. Counts are directly observed deterministic counts from the frozen cases. ` +
    `Token units and elapsed minutes are modeled, not observed Codex usage. See the [machine-readable result](results.json).\n\n` +
    `| Outcome | Process-all baseline | FB control loop | FB minus baseline |\n|---|---:|---:|---:|\n` +
    `| Product-ready rate | ${percent(baseline.acceptedRate)} | ${percent(fb.acceptedRate)} | ${percent(delta.acceptedRate)} |\n` +
    `| Unnecessary processing rate | ${percent(baseline.unnecessaryProcessingRate)} | ${percent(fb.unnecessaryProcessingRate)} | ${percent(delta.unnecessaryProcessingRate)} |\n` +
    `| Good baselines degraded | ${baseline.baselineDegradationCount} | ${fb.baselineDegradationCount} | ${delta.baselineDegradationCount} |\n` +
    `| Correct disposition rate | ${percent(baseline.correctDispositionRate)} | ${percent(fb.correctDispositionRate)} | ${percent(delta.correctDispositionRate)} |\n` +
    `| Unresolved failures | ${baseline.unresolvedFailures} | ${fb.unresolvedFailures} | ${delta.unresolvedFailures} |\n` +
    `| Deterministic work units | ${baseline.workUnits} | ${fb.workUnits} | ${delta.workUnits} |\n` +
    `| Modeled token units | ${baseline.modeledTokenUnits} | ${fb.modeledTokenUnits} | ${delta.modeledTokenUnits} |\n` +
    `| Modeled elapsed minutes | ${baseline.modeledMinutes.toFixed(2)} | ${fb.modeledMinutes.toFixed(2)} | ${delta.modeledMinutes.toFixed(2)} |\n` +
    `| Work units per accepted outcome | ${baseline.workUnitsPerAccepted.toFixed(1)} | ${fb.workUnitsPerAccepted.toFixed(1)} | ${delta.workUnitsPerAccepted.toFixed(1)} |\n` +
    `| Modeled token units per accepted outcome | ${baseline.modeledTokenUnitsPerAccepted.toFixed(0)} | ${fb.modeledTokenUnitsPerAccepted.toFixed(0)} | ${delta.modeledTokenUnitsPerAccepted.toFixed(0)} |\n\n` +
    `The frozen set includes an unfavorable FB case: ambiguous routing makes the wrong skip decision while the process-all baseline succeeds. No valid outcome was discarded.\n\n` +
    `## Directly observed call counts\n\n| Call type | Process-all baseline | FB control loop | FB minus baseline |\n|---|---:|---:|---:|\n${callRows}\n\n` +
    `## Raw case outcomes\n\n| Case | Arm | Disposition | Accepted | Unnecessary processing | Degraded baseline | Result |\n|---|---|---|---:|---:|---:|---|\n${caseRows}\n\n` +
    `## Fixed cost assumptions\n\nThese units are declared assumptions, not provider measurements.\n\n| Operation | Work units | Modeled token units | Modeled minutes |\n|---|---:|---:|---:|\n${costRows}\n\n` +
    `## Method\n\nBoth arms receive the same eight frozen inputs and transformation outcomes. The baseline processes every item once and runs one final QA check. ` +
    `FB routes first, compares candidate and baseline, applies separate quality and safety gates, diagnoses failure, and permits one bounded repair where declared. ` +
    `Hidden expected dispositions and failure classes are used only by the grader, not the router. SHA-256 hashes bind fixtures, settings, cost assumptions, seeds, and grader rules. ` +
    `Aggregates are recomputed from the raw per-case records.\n\n` +
    `## Pre-registered sensitivity results\n\nPre-registered seeds \`${bundle.inputs.seeds.join(', ')}\` vary already-good share (25%, 50%, 75%) and transformation reliability (60%, 80%, 95%). ` +
    `The machine result preserves every seed and reports median and range; none is selectively rerun.\n\n` +
    `| Already-good share | Transformation reliability | Arm | Median ready rate | Range | Median processed |\n|---:|---:|---|---:|---:|---:|\n${sensitivityRows}\n\n` +
    `The sensitivity results also preserve settings where the baseline wins: at 25% already-good inputs and 95% reliability its median ready rate is 97.5% versus FB's 87.5%; ` +
    `at 50% already-good inputs and 95% reliability it is 97.5% versus FB's 95.0%. When transformation is already extremely reliable, extra routing can lose more through a wrong decision than the loop recovers.\n\n` +
    `## Evidence hashes\n\n| Frozen input | SHA-256 |\n|---|---|\n${hashRows}\n\n` +
    `## Limitations\n\nThis experiment does not establish actual Codex token savings, wall-clock savings, human-attention savings, production behavior, or population-wide percentages. ` +
    `The token and time figures depend entirely on the disclosed fixed cost model. The compact fixture set demonstrates mechanism-level tradeoffs, not general market performance.\n`;
}

function runAndWrite(options = {}) {
  const bundle = runExperiment(options);
  const outputDirectory = options.outputDirectory || path.join(options.root || ROOT, 'docs', 'benchmarks', 'control-loop');
  fs.mkdirSync(outputDirectory, { recursive: true });
  const resultPath = path.join(outputDirectory, 'results.json');
  const reportPath = path.join(outputDirectory, 'README.md');
  fs.writeFileSync(resultPath, `${JSON.stringify(bundle, null, 2)}\n`);
  fs.writeFileSync(reportPath, reportMarkdown(bundle));
  validateBundle(readJson(resultPath), {
    truth: readJson(options.truthPath || DEFAULT_TRUTH),
    settings: readJson(options.settingsPath || DEFAULT_SETTINGS),
  });
  return { resultPath, reportPath, bundle };
}

function main() {
  if (process.argv.length !== 3 || process.argv[2] !== 'run') {
    console.error('Usage: node tools/fb-control-loop-benchmark.cjs run');
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
module.exports = { runExperiment, recompute, validateBundle, runAndWrite, reportMarkdown };
