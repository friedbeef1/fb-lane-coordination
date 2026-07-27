#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const graduated = require('./fb-graduated-control-benchmark.cjs');

const ROOT = path.resolve(__dirname, '..');
const TRUTH_PATH = path.join(__dirname, 'fixtures', 'fb-preventive-context-truth.json');
const SETTINGS_PATH = path.join(__dirname, 'fixtures', 'fb-preventive-context-settings.json');
const RESULT_NAME = 'preventive-context-results.json';
const REPORT_NAME = 'preventive-context.md';
const RATES = Object.freeze([0, 0.25, 0.5, 0.75, 0.91, 0.95, 0.99, 1]);
const BLOCKER_KINDS = new Set(['unresolved-environment', 'sensitive-block']);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key =>
      `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function fixtureIndex() {
  const source = readJson(TRUTH_PATH);
  const kinds = new Map();
  for (const scenario of source.scenarios) {
    for (let index = 0; index < scenario.cases.length; index += 1) {
      const id = `${scenario.id}-${String(index + 1).padStart(2, '0')}`;
      kinds.set(id, scenario.cases[index].kind);
    }
  }
  return { source, kinds };
}

function classifyFixture() {
  const { source } = fixtureIndex();
  const familyCaseCounts = Object.fromEntries(
    source.scenarios.map(scenario => [scenario.id, scenario.cases.length]),
  );
  const intentionalBlockerCaseCount = source.scenarios.reduce(
    (total, scenario) => total + scenario.cases.filter(row => BLOCKER_KINDS.has(row.kind)).length,
    0,
  );
  const totalCases = source.scenarios.reduce((total, scenario) => total + scenario.cases.length, 0);
  const seeds = readJson(SETTINGS_PATH).seeds.length;
  return {
    families: Object.keys(familyCaseCounts).sort(),
    familyCaseCounts,
    deliverableCaseCount: totalCases - intentionalBlockerCaseCount,
    intentionalBlockerCaseCount,
    deliverableObservationCount: (totalCases - intentionalBlockerCaseCount) * seeds,
    intentionalBlockerObservationCount: intentionalBlockerCaseCount * seeds,
    totalObservationCount: totalCases * seeds,
  };
}

function runControlledDiagnostic() {
  const settings = readJson(SETTINGS_PATH);
  const bundle = graduated.runExperiment({
    truthPath: TRUTH_PATH,
    settingsPath: SETTINGS_PATH,
  });
  const { kinds } = fixtureIndex();
  const records = bundle.rawRecords.map(row => {
    const intentionalBlocker = BLOCKER_KINDS.has(kinds.get(row.caseId));
    const firstPassCalls = {
      ...row.calls,
      diagnosis: 0,
      repair: 0,
    };
    const firstPassCost = Object.entries(firstPassCalls).reduce(
      (totals, [name, count]) => {
        const cost = settings.costModel[name];
        totals.tokenUnits += count * cost.tokenUnits;
        totals.minutes += count * cost.minutes;
        return totals;
      },
      { tokenUnits: 0, minutes: 0 },
    );
    return {
      ...row,
      intentionalBlocker,
      firstPassReady: row.accepted && !row.repairAttempted,
      repairCredited: false,
      blockerCorrect: intentionalBlocker ? !row.accepted : null,
      firstPassCalls,
      firstPassModeledTokenUnits: firstPassCost.tokenUnits,
      firstPassModeledMinutes: Number(firstPassCost.minutes.toFixed(6)),
    };
  });
  const arms = ['process-all', 'full-fb', 'graduated-fb'].map(arm => {
    const armRows = records.filter(row => row.arm === arm);
    const deliverables = armRows.filter(row => !row.intentionalBlocker);
    const blockers = armRows.filter(row => row.intentionalBlocker);
    return {
      arm,
      deliverableCount: deliverables.length,
      firstPassReady: deliverables.filter(row => row.firstPassReady).length,
      intentionalBlockerCount: blockers.length,
      correctBlockers: blockers.filter(row => row.blockerCorrect).length,
      firstPassModeledTokenUnits: armRows.reduce(
        (total, row) => total + row.firstPassModeledTokenUnits,
        0,
      ),
      firstPassModeledMinutes: Number(armRows.reduce(
        (total, row) => total + row.firstPassModeledMinutes,
        0,
      ).toFixed(6)),
      postHeadlineRepairs: armRows.filter(row => row.repairAttempted).length,
    };
  });
  return { records, summary: { arms } };
}

function preventionSensitivity(options) {
  const baselineReady = Number(options.baselineReady);
  const deliverableCount = Number(options.deliverableCount);
  const rates = options.rates || RATES;
  const avoidableFailures = deliverableCount - baselineReady;
  const milestone = requiredReady => ({
    requiredReady,
    additionalReady: Math.max(0, requiredReady - baselineReady),
    minimumPreventionRate: Math.max(0, requiredReady - baselineReady) / avoidableFailures,
  });
  return {
    baselineReady,
    deliverableCount,
    avoidableFailures,
    assumedObservedPreventionRate: null,
    milestones: {
      readiness91: milestone(Math.ceil(deliverableCount * 0.91)),
      readiness99: milestone(Math.ceil(deliverableCount * 0.99)),
    },
    points: rates.map(rate => {
      const prevented = Math.min(avoidableFailures, Math.floor(avoidableFailures * rate));
      const ready = baselineReady + prevented;
      return {
        rate,
        prevented,
        ready,
        readiness: ready / deliverableCount,
        correctBlockers: 24,
        totalResolvedOutcomes: ready + 24,
      };
    }),
  };
}

function buildDiagnosticBundle() {
  const controlled = runControlledDiagnostic();
  const graph = controlled.summary.arms.find(row => row.arm === 'graduated-fb');
  return {
    schemaVersion: 'fb-preventive-context-diagnostic-v1',
    experimentId: readJson(SETTINGS_PATH).experimentId,
    evidenceType: {
      outcomes: 'deterministic modeled diagnostic',
      tokenAndTime: 'modeled, not observed Codex usage',
      graphEffectiveness: 'not assumed; autonomous evidence pending',
    },
    classification: classifyFixture(),
    arms: controlled.summary.arms,
    sensitivity: preventionSensitivity({
      baselineReady: graph.firstPassReady,
      deliverableCount: graph.deliverableCount,
      rates: RATES,
    }),
    records: controlled.records,
    hashes: {
      truth: sha256(fs.readFileSync(TRUTH_PATH)),
      settings: sha256(fs.readFileSync(SETTINGS_PATH)),
    },
  };
}

function validateBundle(bundle) {
  const expected = buildDiagnosticBundle();
  if (bundle.schemaVersion !== expected.schemaVersion) {
    throw new Error('Invalid preventive diagnostic schema.');
  }
  if (canonical(bundle.sensitivity) !== canonical(expected.sensitivity)) {
    throw new Error('Sensitivity evidence does not match exact recomputation.');
  }
  if (canonical(bundle) !== canonical(expected)) {
    throw new Error('Preventive diagnostic does not match frozen fixture recomputation.');
  }
  return true;
}

function reportMarkdown(bundle) {
  const labels = {
    'process-all': 'Autonomous Vanilla diagnostic',
    'full-fb': 'Broad-context FB diagnostic',
    'graduated-fb': 'Graph-routed FB baseline',
  };
  const arms = bundle.arms.map(row =>
    `| ${labels[row.arm]} | ${row.firstPassReady}/${row.deliverableCount} | ` +
    `${(row.firstPassReady / row.deliverableCount * 100).toFixed(1)}% | ` +
    `${row.correctBlockers}/${row.intentionalBlockerCount} | ` +
    `${row.firstPassModeledTokenUnits} | ${row.firstPassModeledMinutes.toFixed(1)} | ` +
    `${row.postHeadlineRepairs} |`).join('\n');
  const points = bundle.sensitivity.points.map(point =>
    `| ${(point.rate * 100).toFixed(0)}% | ${point.prevented} | ` +
    `${point.ready}/${bundle.sensitivity.deliverableCount} | ` +
    `${(point.readiness * 100).toFixed(1)}% | ${point.correctBlockers}/24 |`).join('\n');
  const m91 = bundle.sensitivity.milestones.readiness91;
  const m99 = bundle.sensitivity.milestones.readiness99;
  return `# Preventive context diagnostic\n\n` +
    `This controlled diagnostic uses Features, Bugs, Tech, and Design fixtures. ` +
    `It does not assume that graph context prevents any particular percentage of failures. ` +
    `Token and time values are modeled, not observed Codex usage.\n\n` +
    `## First-pass baselines\n\n` +
    `| Arm | Ready deliverables | Readiness | Correct blockers | Modeled tokens | Modeled minutes | Later repairs excluded |\n` +
    `|---|---:|---:|---:|---:|---:|---:|\n${arms}\n\n` +
    `## Prevention sensitivity\n\n` +
    `| Prevention rate | Failures prevented | Ready deliverables | Readiness | Correct blockers |\n` +
    `|---:|---:|---:|---:|---:|\n${points}\n\n` +
    `From the graph-routed first-pass baseline, the 91% milestone requires ` +
    `${m91.additionalReady} of ${bundle.sensitivity.avoidableFailures} avoidable failures ` +
    `to be prevented (${(m91.minimumPreventionRate * 100).toFixed(1)}%). ` +
    `The 99% milestone requires ${m99.additionalReady} ` +
    `(${(m99.minimumPreventionRate * 100).toFixed(1)}%).\n\n` +
    `## Limitation\n\nThe sensitivity curve is mathematical. It does not prove graph ` +
    `effectiveness. Autonomous real-Codex evidence must supply the observed prevention rate, ` +
    `agent topology, tokens, and elapsed time.\n`;
}

function writeDiagnostic(options = {}) {
  const outputDirectory = path.resolve(
    options.outputDirectory || path.join(ROOT, 'docs', 'benchmarks', 'control-loop'),
  );
  const resultPath = path.join(outputDirectory, RESULT_NAME);
  const reportPath = path.join(outputDirectory, REPORT_NAME);
  if (fs.existsSync(resultPath) || fs.existsSync(reportPath)) {
    throw new Error('Preventive diagnostic already exists; in-place reruns are forbidden.');
  }
  fs.mkdirSync(outputDirectory, { recursive: true });
  const bundle = buildDiagnosticBundle();
  fs.writeFileSync(resultPath, `${JSON.stringify(bundle, null, 2)}\n`);
  fs.writeFileSync(reportPath, reportMarkdown(bundle));
  validateBundle(readJson(resultPath));
  return { resultPath, reportPath, bundle };
}

function main() {
  if (!['diagnose', 'run'].includes(process.argv[2])) {
    process.stderr.write('Usage: node tools/fb-preventive-context-benchmark.cjs diagnose|run\n');
    process.exitCode = 2;
    return;
  }
  if (process.argv[2] === 'run') {
    const written = writeDiagnostic();
    process.stdout.write(`Wrote ${path.relative(ROOT, written.resultPath)} and ${path.relative(ROOT, written.reportPath)}.\n`);
    return;
  }
  const diagnostic = runControlledDiagnostic();
  const graph = diagnostic.summary.arms.find(row => row.arm === 'graduated-fb');
  process.stdout.write(`${JSON.stringify({
    classification: classifyFixture(),
    arms: diagnostic.summary.arms,
    sensitivity: preventionSensitivity({
      baselineReady: graph.firstPassReady,
      deliverableCount: graph.deliverableCount,
      rates: RATES,
    }),
  }, null, 2)}\n`);
}

if (require.main === module) main();

module.exports = {
  classifyFixture,
  runControlledDiagnostic,
  preventionSensitivity,
  buildDiagnosticBundle,
  validateBundle,
  reportMarkdown,
  writeDiagnostic,
};
