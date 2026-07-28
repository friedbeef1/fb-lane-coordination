#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {compileTreatment, hash} = require('./fb-real-work-context.cjs');
const {loadTaskRegistry} = require('./fb-real-work-benchmark-lib.cjs');
const {exportFixture} = require('./fb-real-work-fixture.cjs');
const {compilePublicFacts} = require('./fb-real-work-context.cjs');
const {gradeCandidate} = require('./fb-real-work-grader.cjs');
const {publicEvidence, runFirstPass} = require('./fb-real-work-runner.cjs');
const {createDeltaRepairPacket, evaluateRepairOutcome} = require('./fb-efficiency.cjs');

const EXPERIMENT_ID = 'fb-repair-efficiency-056-20260728';
const REPO_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(REPO_ROOT, 'docs', 'benchmarks', 'repair-efficiency');

const PUBLIC_CRITERIA = {
  'unmirror-intro': {
    'web-headline': 'Web source uses the exact approved headline.',
    'android-headline': 'Android source uses the exact approved headline.',
    'ios-headline': 'iOS source uses the exact approved headline.',
    'focused-tests': 'Focused source tests cover the exact approved headline.',
  },
  'unmirror-saved-capture': {
    'web-choice': 'Web exposes and persists Actual or Mirror saved-output choice.',
    'android-choice': 'Android exposes and persists Actual or Mirror saved-output choice.',
    'ios-choice': 'iOS exposes and persists Actual or Mirror saved-output choice.',
    'photo-and-clip': 'Photo and clip output honor the saved-output choice.',
    tests: 'Focused tests cover default, persistence, and output behavior.',
  },
  'unmirror-native-analytics': {
    'android-client': 'Android has an allow-listed analytics client with local enable or disable behavior.',
    'ios-client': 'iOS has an allow-listed analytics client with local enable or disable behavior.',
    'safe-failure': 'Provider and network errors do not break the product.',
    'privacy-tests': 'Tests prove missing-token, privacy, and enable or disable boundaries.',
    'person-profiles': 'Native analytics must not enable person profiles.',
  },
  'meja-scroll': {
    'host-scroll': 'Host main content scrolls vertically when required.',
    'pairing-contained': 'Pairing layout keeps the continuation action reachable.',
    'reachability-test': 'A focused responsive test proves continuation reachability.',
  },
  'meja-pairing': {
    continuation: 'Laptop continuation preserves the exact session and selected mode.',
    'subscription-gate': 'Presence waits for subscription and tracks only the exact session role.',
    'bounded-retry': 'Transient tracking failure retries once without duplicate attempts.',
    'connected-disconnected-tests': 'Focused tests cover disconnected and connected continuation.',
  },
  'meja-redesign': {
    'host-navigation': 'Host exposes the approved compact navigation.',
    'audience-composition': 'Audience exposes role, person, topic, timer, and round state.',
    'setup-navigation': 'Setup exposes Overview, Create Set, and Library.',
    'redesign-style': 'The redesign stylesheet is included in standalone output.',
    'contract-tests': 'Focused tests prove required markers and responsive containment.',
  },
};

function schedule(tasks = loadTaskRegistry()) {
  return tasks.flatMap((task, index) => {
    const arms = index % 2
      ? ['efficient-graph', 'vanilla']
      : ['vanilla', 'efficient-graph'];
    return arms.map((arm, orderWithinPair) => ({
      runId: `${task.id}-${arm}`,
      taskId: task.id,
      arm,
      pairIndex: index,
      orderWithinPair,
      counted: true,
    }));
  });
}

function executionSlices(task, facts) {
  const surface = {
    'unmirror-saved-capture': ['Web choice and proof', 'Android choice and proof', 'iOS choice and proof'],
    'unmirror-native-analytics': ['Android privacy client', 'iOS privacy client', 'Shared privacy and failure proof'],
    'meja-pairing': ['Continuation state', 'Presence retry lifecycle', 'Connected and disconnected proof'],
    'meja-redesign': ['Host composition', 'Audience composition', 'Setup and responsive proof'],
  }[task.id];
  const labels = surface || ['Single bounded implementation and proof'];
  return labels.map((outcome, index) => ({
    id: `slice-${index + 1}`,
    outcome,
    dependsOn: index ? [`slice-${index}`] : [],
    acceptance: facts.acceptanceCriteria[Math.min(index, facts.acceptanceCriteria.length - 1)],
  }));
}

function compileEfficientTreatment(arm, facts, task) {
  if (arm === 'vanilla') return compileTreatment('vanilla', facts);
  if (arm !== 'efficient-graph') throw new Error(`Unknown arm: ${arm}`);
  const graphPacket = {
    objective: facts.objective,
    relevantDecisions: facts.relevantDecisions,
    assumptions: facts.assumptions,
    changedEvidence: facts.changedEvidence,
    acceptanceCriteria: facts.acceptanceCriteria,
    riskTriggers: facts.riskTriggers,
    requiredOutput: facts.requiredOutput,
    recordLinks: facts.recordLinks,
    executionSlices: executionSlices(task, facts),
  };
  return {
    arm,
    publicFactsSha256: hash(facts),
    graphPacket,
    prompt: [
      'Execute this preventive context packet using its bounded execution slices.',
      'Complete each slice with its smallest focused proof, integrate once, and stop when the acceptance criteria pass.',
      'Do not add coordination ceremony or read unrelated records.',
      JSON.stringify(graphPacket, null, 2),
    ].join('\n\n'),
  };
}

function createFailurePacket(taskId, grade, input = {}) {
  const definitions = PUBLIC_CRITERIA[taskId] || {};
  const failedCriteria = (grade.criteria || [])
    .filter(criterion => !criterion.pass)
    .map(criterion => ({
      id: criterion.id,
      expected: definitions[criterion.id] || `Pass ${criterion.id}.`,
      observed: `${criterion.id} did not produce accepted public evidence.`,
    }));
  for (const blocker of grade.blockers || []) {
    if (!blocker.triggered) continue;
    failedCriteria.push({
      id: blocker.id,
      expected: definitions[blocker.id] || `Do not trigger ${blocker.id}.`,
      observed: `${blocker.id} was triggered.`,
    });
  }
  return createDeltaRepairPacket({
    objective: `Correct only ${failedCriteria.map(row => row.id).join(', ')}.`,
    candidateRef: input.candidateSha,
    changedPaths: input.changedPaths,
    failedCriteria,
    relevantDecisions: input.relevantDecisions || [],
    proofOutput: input.proofOutput,
    correction: failedCriteria.length
      ? `Correct only the source responsible for ${failedCriteria.map(row => row.id).join(', ')}.`
      : '',
  });
}

function repairCommandArgs(fixture) {
  return [
    'exec', '--json', '--ignore-user-config', '--ignore-rules',
    '--skip-git-repo-check', '--sandbox', 'workspace-write',
    '-m', 'gpt-5.4', '-C', fixture, '-',
  ];
}

function repairPrompt(packet) {
  if (packet.action !== 'repair') throw new Error(`Repair is blocked: ${packet.reason}`);
  return [
    'Perform one fresh delta repair. Do not rediscover the full task.',
    `Objective: ${packet.objective}`,
    `Candidate: ${packet.candidateRef}`,
    `Changed files:\n${packet.changedPaths.map(value => `- ${value}`).join('\n')}`,
    ...packet.failedCriteria.map(criterion => [
      `Failed criterion: ${criterion.id}`,
      `Expected: ${criterion.expected}`,
      `Observed: ${criterion.observed}`,
    ].join('\n')),
    `Relevant decisions:\n${packet.relevantDecisions.map(value => `- ${value}`).join('\n')}`,
    `Focused proof output: ${packet.proofOutput}`,
    `Concrete correction: ${packet.correction}`,
    'Rerun only the failed proof and stop.',
  ].join('\n\n');
}

function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive:true});
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

function fileManifest(root) {
  const manifest = {};
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
      if (entry.name === '.benchmark-input') continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const relative = path.relative(root, absolute).split(path.sep).join('/');
        manifest[relative] = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
      }
    }
  }
  visit(root);
  return manifest;
}

function changedPaths(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter(file => before[file] !== after[file])
    .sort();
}

function prepare(root) {
  const absoluteRoot = path.resolve(root);
  fs.mkdirSync(absoluteRoot, {recursive:true});
  const declaration = {
    experimentId:EXPERIMENT_ID,
    generatedAt:new Date().toISOString(),
    model:'gpt-5.4',
    tasks:6,
    arms:['vanilla','efficient-graph'],
    countedRuns:12,
    repairMaximumPerRun:1,
    schedule:schedule(),
  };
  atomicJson(path.join(DOCS_DIR, 'declaration.json'), declaration);
  for (const task of loadTaskRegistry()) {
    const base = path.join(absoluteRoot, 'bases', task.id);
    fs.rmSync(base, {recursive:true, force:true});
    exportFixture(task, base);
    for (const arm of declaration.arms) {
      const runDir = path.join(absoluteRoot, 'runs', `${task.id}-${arm}`);
      const fixture = path.join(runDir, 'fixture');
      fs.rmSync(runDir, {recursive:true, force:true});
      fs.mkdirSync(runDir, {recursive:true});
      fs.cpSync(base, fixture, {recursive:true});
      const facts = compilePublicFacts(task);
      const treatment = compileEfficientTreatment(arm, facts, task);
      const input = path.join(fixture, '.benchmark-input');
      fs.mkdirSync(input, {recursive:true});
      fs.writeFileSync(path.join(input, 'brief.md'), treatment.prompt);
      facts.rawRecords.forEach((record,index)=>{
        fs.writeFileSync(path.join(input, `record-${index+1}.md`), record.content);
      });
      atomicJson(path.join(runDir, 'treatment.json'), {
        publicFactsSha256:treatment.publicFactsSha256,
        promptSha256:hash(treatment.prompt),
        graphPacketSha256:treatment.graphPacket ? hash(treatment.graphPacket) : null,
      });
    }
  }
  return declaration;
}

function defaultCommandArgs(fixture) {
  return [
    'exec','--json','--ignore-user-config','--ignore-rules',
    '--skip-git-repo-check','--sandbox','workspace-write',
    '-m','gpt-5.4','-C',fixture,'-',
  ];
}

async function executeRun(root, row, options = {}) {
  const absoluteRoot = path.resolve(root);
  const runDir = path.join(absoluteRoot, 'runs', row.runId);
  const resultFile = path.join(runDir, 'result.json');
  if (fs.existsSync(resultFile)) throw new Error(`Counted run already exists: ${row.runId}`);
  const task = loadTaskRegistry().find(value => value.id === row.taskId);
  const facts = compilePublicFacts(task);
  const treatment = compileEfficientTreatment(row.arm, facts, task);
  const fixture = path.join(runDir, 'fixture');
  const baseline = fileManifest(path.join(absoluteRoot, 'bases', task.id));
  const first = await runFirstPass({
    runId:row.runId, taskId:task.id, arm:row.arm,
    fixtureDir:fixture, allowedRoot:absoluteRoot, prompt:treatment.prompt,
    timeoutMs:options.timeoutMs || 20*60*1000,
    command:options.command,
    commandPrefix:options.commandPrefix,
    commandArgs:options.commandArgs || defaultCommandArgs(fixture),
  });
  const firstGrade = gradeCandidate(task.id, fixture);
  const afterFirst = fileManifest(fixture);
  let repair = null;
  let finalGrade = firstGrade;
  let repairOutcome = null;
  if (!firstGrade.pass && first.exitCode === 0 && !first.timedOut) {
    const delta = changedPaths(baseline, afterFirst);
    const packet = createFailurePacket(task.id, firstGrade, {
      candidateSha:first.candidateSha256,
      changedPaths:delta,
      proofOutput:`${firstGrade.passed} of ${firstGrade.total} public criteria passed.`,
      relevantDecisions:facts.relevantDecisions,
    });
    if (packet.action === 'repair') {
      const repairEvidence = await runFirstPass({
        runId:`${row.runId}-repair`, taskId:task.id, arm:row.arm,
        fixtureDir:fixture, allowedRoot:absoluteRoot, prompt:repairPrompt(packet),
        timeoutMs:options.repairTimeoutMs || 10*60*1000,
        command:options.command,
        commandPrefix:options.commandPrefix,
        commandArgs:options.repairCommandArgs || repairCommandArgs(fixture),
      });
      finalGrade = gradeCandidate(task.id, fixture);
      repairOutcome = evaluateRepairOutcome({
        beforeCandidateSha:first.candidateSha256,
        afterCandidateSha:repairEvidence.candidateSha256,
        beforeReadiness:firstGrade.readiness,
        afterReadiness:finalGrade.readiness,
        passed:finalGrade.pass,
      });
      repair = {
        ...publicEvidence(repairEvidence),
        contextMode:'fresh-delta',
        failedCriterionIds:packet.failedCriteria.map(value=>value.id),
        changedPaths:packet.changedPaths,
        outcome:repairOutcome,
      };
      fs.rmSync(repairEvidence._config.codexHome, {recursive:true, force:true});
    } else {
      repairOutcome = {status:'harness-failure',reason:packet.reason,continue:false};
    }
  }
  const result = {
    experimentId:EXPERIMENT_ID,
    ...row,
    treatment:{publicFactsSha256:treatment.publicFactsSha256,promptSha256:hash(treatment.prompt)},
    firstPass:publicEvidence(first),
    firstGrade,
    repair,
    repairOutcome,
    finalGrade,
    finalPass:finalGrade.pass,
    userDecisionEvents:0,
  };
  atomicJson(resultFile, result);
  fs.rmSync(first._config.codexHome, {recursive:true, force:true});
  return result;
}

async function shakedown(root, options = {}) {
  const absoluteRoot = path.resolve(root);
  const fixture = path.join(absoluteRoot, 'shakedown', 'fixture');
  fs.rmSync(fixture, {recursive:true, force:true});
  fs.mkdirSync(fixture, {recursive:true});
  fs.writeFileSync(path.join(fixture, 'answer.txt'), 'WRONG\n');
  const first = await runFirstPass({
    runId:'repair-efficiency-shakedown-first',taskId:'shakedown',arm:'efficient-graph',
    fixtureDir:fixture,allowedRoot:absoluteRoot,
    prompt:'Change answer.txt to exactly DRAFT followed by a newline, then stop.',
    timeoutMs:options.timeoutMs||5*60*1000,
    command:options.command,commandPrefix:options.commandPrefix,
    commandArgs:options.commandArgs||defaultCommandArgs(fixture),
  });
  const packet = createDeltaRepairPacket({
    objective:'Correct answer.txt.',
    candidateRef:first.candidateSha256,
    changedPaths:['answer.txt'],
    failedCriteria:[{id:'answer',expected:'answer.txt contains READY and a newline.',observed:'It did not.'}],
    relevantDecisions:['Use exactly READY.'],
    proofOutput:'FAIL answer',
    correction:'Replace the content of answer.txt with READY and a newline.',
  });
  const repaired = await runFirstPass({
    runId:'repair-efficiency-shakedown-repair',taskId:'shakedown',arm:'efficient-graph',
    fixtureDir:fixture,allowedRoot:absoluteRoot,prompt:repairPrompt(packet),
    timeoutMs:options.repairTimeoutMs||5*60*1000,
    command:options.command,commandPrefix:options.commandPrefix,
    commandArgs:options.repairCommandArgs||repairCommandArgs(fixture),
  });
  const result = {
    experimentId:EXPERIMENT_ID,
    excluded:true,
    firstPass:publicEvidence(first),
    repair:publicEvidence(repaired),
    passed:fs.readFileSync(path.join(fixture,'answer.txt'),'utf8')==='READY\n' &&
      first.usage.authoritative && repaired.usage.authoritative,
  };
  atomicJson(path.join(DOCS_DIR,'shakedown.json'),result);
  fs.rmSync(first._config.codexHome,{recursive:true,force:true});
  fs.rmSync(repaired._config.codexHome,{recursive:true,force:true});
  if (!result.passed) throw new Error('Repair-efficiency shakedown failed');
  return result;
}

async function runAll(root, options = {}) {
  const declarationFile = path.join(DOCS_DIR,'declaration.json');
  const shakedownFile = path.join(DOCS_DIR,'shakedown.json');
  if (!fs.existsSync(declarationFile) || !fs.existsSync(shakedownFile)) {
    throw new Error('Prepare and pass shakedown before counted runs');
  }
  const shakedownResult = JSON.parse(fs.readFileSync(shakedownFile,'utf8'));
  if (!shakedownResult.passed || !shakedownResult.excluded) throw new Error('Passing excluded shakedown required');
  const rows = options.runId ? schedule().filter(row=>row.runId===options.runId) : schedule();
  if (!rows.length) throw new Error(`Unknown run id: ${options.runId}`);
  const output=[];
  for (const row of rows) output.push(await executeRun(root,row,options));
  return output;
}

function usageTotal(result) {
  const first=result.firstPass.usage;
  const repair=result.repair?.usage||{inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0};
  return {
    inputTokens:first.inputTokens+repair.inputTokens,
    cachedInputTokens:first.cachedInputTokens+repair.cachedInputTokens,
    outputTokens:first.outputTokens+repair.outputTokens,
    totalTokens:first.totalTokens+repair.totalTokens,
  };
}

function summarize(root) {
  const absoluteRoot=path.resolve(root);
  const results=schedule().map(row=>JSON.parse(fs.readFileSync(path.join(absoluteRoot,'runs',row.runId,'result.json'),'utf8')));
  const arms={};
  for (const arm of ['vanilla','efficient-graph']) {
    const selected=results.filter(row=>row.arm===arm);
    arms[arm]={
      wallTimeMs:selected.reduce((sum,row)=>sum+row.firstPass.wallTimeMs+(row.repair?.wallTimeMs||0),0),
      usage:selected.map(usageTotal).reduce((sum,row)=>({
        inputTokens:sum.inputTokens+row.inputTokens,
        cachedInputTokens:sum.cachedInputTokens+row.cachedInputTokens,
        outputTokens:sum.outputTokens+row.outputTokens,
        totalTokens:sum.totalTokens+row.totalTokens,
      }),{inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0}),
      accepted:selected.filter(row=>row.finalPass).length,
      repairs:selected.filter(row=>row.repair).length,
      meanFinalReadiness:selected.reduce((sum,row)=>sum+row.finalGrade.readiness,0)/selected.length,
    };
  }
  const result={experimentId:EXPERIMENT_ID,generatedAt:new Date().toISOString(),arms,results};
  atomicJson(path.join(DOCS_DIR,'results.json'),result);
  return result;
}

module.exports = {
  EXPERIMENT_ID,
  PUBLIC_CRITERIA,
  compileEfficientTreatment,
  createFailurePacket,
  executionSlices,
  repairCommandArgs,
  repairPrompt,
  schedule,
  changedPaths,
  executeRun,
  fileManifest,
  prepare,
  runAll,
  shakedown,
  summarize,
};

if (require.main === module) {
  const [command,...args]=process.argv.slice(2);
  const rootIndex=args.indexOf('--root');
  const root=rootIndex>=0?args[rootIndex+1]:path.join('/private/tmp',EXPERIMENT_ID);
  const runIdIndex=args.indexOf('--run-id');
  const runId=runIdIndex>=0?args[runIdIndex+1]:null;
  (async()=>{
    if (command==='prepare') console.log(JSON.stringify(prepare(root),null,2));
    else if (command==='shakedown') console.log(JSON.stringify(await shakedown(root),null,2));
    else if (command==='run') console.log(JSON.stringify(await runAll(root,{runId}),null,2));
    else if (command==='summarize') console.log(JSON.stringify(summarize(root),null,2));
    else throw new Error('Usage: node tools/fb-repair-efficiency-benchmark.cjs prepare|shakedown|run|summarize [--root <dir>] [--run-id <id>]');
  })().catch(error=>{console.error(error.stack||error.message);process.exitCode=1;});
}
