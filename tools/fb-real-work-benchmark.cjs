#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  FIXTURE_DIR,
  loadTaskRegistry,
  loadRetrospectiveRegistry,
  validateRegistry,
} = require('./fb-real-work-benchmark-lib.cjs');
const {exportFixture} = require('./fb-real-work-fixture.cjs');
const {compilePublicFacts, compileTreatment, hash} = require('./fb-real-work-context.cjs');
const {gradeCandidate} = require('./fb-real-work-grader.cjs');
const {publicEvidence, runFirstPass, runRepair} = require('./fb-real-work-runner.cjs');

const EXPERIMENT_ID = 'fb-real-work-paired-054-20260728';
const REPO_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(REPO_ROOT, 'docs', 'benchmarks', 'real-work');

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive:true});
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

function schedule(tasks = loadTaskRegistry()) {
  return tasks.flatMap((task, index) => {
    const arms = index % 2 ? ['graph', 'vanilla'] : ['vanilla', 'graph'];
    return arms.map((arm, order) => ({
      runId: `${task.id}-${arm}`,
      taskId: task.id,
      arm,
      pairIndex: index,
      orderWithinPair: order,
      counted: true,
    }));
  });
}

function executableFiles() {
  const graders = fs.readdirSync(path.join(FIXTURE_DIR, 'graders'))
    .filter(name => name.endsWith('.cjs'))
    .map(name => path.join(FIXTURE_DIR, 'graders', name));
  return [
    path.join(FIXTURE_DIR, 'tasks.json'),
    path.join(FIXTURE_DIR, 'retrospective.json'),
    path.join(FIXTURE_DIR, 'prompts.json'),
    path.join(FIXTURE_DIR, 'forbidden-paths.json'),
    path.join(FIXTURE_DIR, 'run-result.schema.json'),
    path.join(__dirname, 'fb-real-work-benchmark-lib.cjs'),
    path.join(__dirname, 'fb-real-work-fixture.cjs'),
    path.join(__dirname, 'fb-real-work-context.cjs'),
    path.join(__dirname, 'fb-real-work-grader.cjs'),
    path.join(__dirname, 'fb-real-work-runner.cjs'),
    path.join(__dirname, 'fb-real-work-benchmark.cjs'),
    ...graders,
  ];
}

function freezeDeclaration() {
  const tasks = loadTaskRegistry();
  const retrospective = loadRetrospectiveRegistry();
  validateRegistry(tasks, retrospective);
  const hashes = Object.fromEntries(executableFiles().sort().map(file => [
    path.relative(REPO_ROOT, file).split(path.sep).join('/'),
    sha256File(file),
  ]));
  const sourceTrees = Object.fromEntries(tasks.map(task => {
    const {spawnSync} = require('node:child_process');
    const result = spawnSync('git', ['-C', task.sourceRepo, 'rev-parse', `${task.startCommit}^{tree}`], {encoding:'utf8'});
    if (result.status !== 0) throw new Error(`Missing source commit for ${task.id}: ${result.stderr.trim()}`);
    return [task.id, result.stdout.trim()];
  }));
  return {
    experimentId: EXPERIMENT_ID,
    generatedAt: new Date().toISOString(),
    tasks: 6,
    arms: ['vanilla', 'graph'],
    countedFirstPassRuns: 12,
    repairMaximumPerRun: 1,
    userDecisionEvents: 0,
    model: 'gpt-5.4',
    firstPassTimeoutMinutes: 20,
    repairTimeoutMinutes: 10,
    schedule: schedule(tasks),
    hashes,
    sourceTrees,
  };
}

function verifyFrozen(declaration) {
  if (declaration.experimentId !== EXPERIMENT_ID) throw new Error('Experiment id mismatch');
  if (declaration.schedule.length !== 12 || new Set(declaration.schedule.map(row => row.runId)).size !== 12) {
    throw new Error('Frozen schedule must contain 12 unique runs');
  }
  for (const [relative, expected] of Object.entries(declaration.hashes)) {
    const actual = sha256File(path.join(REPO_ROOT, relative));
    if (actual !== expected) throw new Error(`Frozen hash mismatch: ${relative}`);
  }
  return true;
}

function writeInput(fixture, task, facts, treatment) {
  const input = path.join(fixture, '.benchmark-input');
  fs.mkdirSync(input, {recursive:true});
  fs.writeFileSync(path.join(input, 'brief.md'), treatment.prompt);
  facts.rawRecords.forEach((record, index) => {
    fs.writeFileSync(
      path.join(input, `record-${index + 1}.md`),
      record.content,
    );
  });
  return {
    publicFactsSha256:treatment.publicFactsSha256,
    promptSha256:hash(treatment.prompt),
    graphPacketSha256:treatment.graphPacket ? hash(treatment.graphPacket) : null,
  };
}

function prepare(root) {
  const absoluteRoot = path.resolve(root);
  fs.mkdirSync(absoluteRoot, {recursive:true});
  const declaration = freezeDeclaration();
  atomicJson(path.join(DOCS_DIR, 'frozen-declaration.json'), declaration);
  for (const task of loadTaskRegistry()) {
    const base = path.join(absoluteRoot, 'bases', task.id);
    exportFixture(task, base);
    for (const arm of ['vanilla', 'graph']) {
      const fixture = path.join(absoluteRoot, 'runs', `${task.id}-${arm}`, 'fixture');
      fs.rmSync(fixture, {recursive:true, force:true});
      fs.mkdirSync(path.dirname(fixture), {recursive:true});
      fs.cpSync(base, fixture, {recursive:true});
      const facts = compilePublicFacts(task);
      const treatment = compileTreatment(arm, facts);
      const receipt = writeInput(fixture, task, facts, treatment);
      atomicJson(path.join(absoluteRoot, 'runs', `${task.id}-${arm}`, 'treatment.json'), receipt);
    }
  }
  return declaration;
}

async function shakedown(root, options = {}) {
  const absoluteRoot = path.resolve(root);
  const fixture = path.join(absoluteRoot, 'shakedown', 'fixture');
  fs.rmSync(fixture, {recursive:true, force:true});
  fs.mkdirSync(fixture, {recursive:true});
  fs.writeFileSync(path.join(fixture, 'answer.txt'), 'WRONG\n');
  const first = await runFirstPass({
    runId:'shakedown-first',taskId:'shakedown',arm:'vanilla',
    fixtureDir:fixture,allowedRoot:absoluteRoot,
    prompt:'Change answer.txt to exactly DRAFT followed by a newline. Do not edit or create any other file. Then stop.',
    timeoutMs:options.timeoutMs || 5 * 60 * 1000,
    command:options.command,
    commandPrefix:options.commandPrefix,
    commandArgs:options.commandArgs || [
      'exec','--json','--ignore-user-config','--ignore-rules','--skip-git-repo-check',
      '--sandbox','workspace-write','-m','gpt-5.4','-C',fixture,'-',
    ],
  });
  if (first.exitCode !== 0 || first.timedOut || !first.sessionId) {
    throw new Error(`Shakedown first pass failed: exit=${first.exitCode} timeout=${first.timedOut} stderr=${first._stderr}`);
  }
  const firstExpectedFailure = fs.readFileSync(path.join(fixture,'answer.txt'),'utf8') !== 'READY\n';
  const repaired = await runRepair(first, {
    passed:false,
    failedPublicChecks:['answer.txt must contain exactly READY and a newline'],
    observedOutput:'answer.txt did not contain READY',
    requiredAcceptance:['answer.txt contains exactly READY and a newline'],
  });
  const repairPassed = fs.readFileSync(path.join(fixture,'answer.txt'),'utf8') === 'READY\n';
  const result = {
    experimentId:EXPERIMENT_ID,
    excluded:true,
    firstPass:publicEvidence(first),
    repair:publicEvidence(repaired).repair,
    firstExpectedFailure,
    repairPassed,
    authoritativeUsage:first.usage.authoritative && repaired.repair.usage.authoritative,
    passed:firstExpectedFailure && repairPassed && first.usage.authoritative && repaired.repair.usage.authoritative,
  };
  if (!repairPassed) {
    fs.writeFileSync(path.join(absoluteRoot, 'shakedown', 'repair.debug.jsonl'), repaired.repair._rawOutput || '');
    fs.writeFileSync(path.join(absoluteRoot, 'shakedown', 'repair.debug.stderr'), repaired.repair._stderr || '');
  }
  atomicJson(path.join(DOCS_DIR, 'shakedown.json'), result);
  fs.rmSync(first._config.codexHome, {recursive:true, force:true});
  if (!result.authoritativeUsage) {
    throw new Error('Shakedown lacks authoritative usage; counted spend is blocked');
  }
  if (!result.passed) throw new Error('Shakedown failed');
  return result;
}

function loadDeclaration() {
  const file = path.join(DOCS_DIR, 'frozen-declaration.json');
  if (!fs.existsSync(file)) throw new Error('Prepare the experiment first');
  const declaration = JSON.parse(fs.readFileSync(file,'utf8'));
  verifyFrozen(declaration);
  return declaration;
}

function ensureShakedown() {
  const file = path.join(DOCS_DIR, 'shakedown.json');
  if (!fs.existsSync(file)) throw new Error('Passing shakedown required');
  const result = JSON.parse(fs.readFileSync(file,'utf8'));
  if (!result.passed || !result.authoritativeUsage || !result.excluded) {
    throw new Error('Passing authoritative excluded shakedown required');
  }
}

async function executeRun(root, scheduleRow, options = {}) {
  const absoluteRoot = path.resolve(root);
  const runDir = path.join(absoluteRoot, 'runs', scheduleRow.runId);
  const resultFile = path.join(runDir, 'result.json');
  if (fs.existsSync(resultFile)) throw new Error(`Counted run already exists: ${scheduleRow.runId}`);
  const task = loadTaskRegistry().find(row => row.id === scheduleRow.taskId);
  const facts = compilePublicFacts(task);
  const treatment = compileTreatment(scheduleRow.arm, facts);
  const fixture = path.join(runDir, 'fixture');
  const first = await runFirstPass({
    runId:scheduleRow.runId,taskId:task.id,arm:scheduleRow.arm,
    fixtureDir:fixture,allowedRoot:absoluteRoot,prompt:treatment.prompt,
    timeoutMs:options.timeoutMs || 20 * 60 * 1000,
    repairTimeoutMs:options.repairTimeoutMs || 10 * 60 * 1000,
    command:options.command,
    commandPrefix:options.commandPrefix,
    commandArgs:options.commandArgs || [
      'exec','--json','--ignore-user-config','--ignore-rules','--skip-git-repo-check',
      '--sandbox','workspace-write','-m','gpt-5.4','-C',fixture,'-',
    ],
  });
  const firstGrade = gradeCandidate(task.id, fixture);
  let finalEvidence = first;
  let finalGrade = firstGrade;
  if (!firstGrade.pass && first.exitCode === 0 && !first.timedOut && first.sessionId) {
    finalEvidence = await runRepair(first, {
      passed:false,
      failedPublicChecks:['The focused acceptance proof did not pass.'],
      observedOutput:`${firstGrade.passed} of ${firstGrade.total} public acceptance dimensions were demonstrated.`,
      requiredAcceptance:facts.acceptanceCriteria,
    });
    finalGrade = gradeCandidate(task.id, fixture);
  }
  const result = {
    experimentId:EXPERIMENT_ID,
    ...scheduleRow,
    treatment:{
      publicFactsSha256:treatment.publicFactsSha256,
      promptSha256:hash(treatment.prompt),
    },
    firstPass:publicEvidence(first),
    firstGrade,
    repair:finalEvidence.repair || null,
    finalGrade,
    finalPass:finalGrade.pass,
    userDecisionEvents:0,
  };
  atomicJson(resultFile, result);
  fs.rmSync(first._config.codexHome, {recursive:true, force:true});
  return result;
}

async function runAll(root, options = {}) {
  const declaration = loadDeclaration();
  ensureShakedown();
  const selected = options.runId
    ? declaration.schedule.filter(row => row.runId === options.runId)
    : declaration.schedule;
  if (!selected.length) throw new Error(`Unknown run id: ${options.runId}`);
  const results = [];
  for (const row of selected) results.push(await executeRun(root, row, options));
  return results;
}

function median(values) {
  const sorted = [...values].sort((a,b)=>a-b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length/2);
  return sorted.length%2 ? sorted[middle] : (sorted[middle-1]+sorted[middle])/2;
}

function totalUsage(result) {
  const first = result.firstPass.usage;
  const repair = result.repair?.usage || {inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0};
  return {
    inputTokens:first.inputTokens+repair.inputTokens,
    cachedInputTokens:first.cachedInputTokens+repair.cachedInputTokens,
    outputTokens:first.outputTokens+repair.outputTokens,
    totalTokens:first.totalTokens+repair.totalTokens,
  };
}

function summarize(root) {
  const declaration = loadDeclaration();
  const results = declaration.schedule.map(row => {
    const file = path.join(path.resolve(root),'runs',row.runId,'result.json');
    if (!fs.existsSync(file)) throw new Error(`Missing counted result: ${row.runId}`);
    return JSON.parse(fs.readFileSync(file,'utf8'));
  });
  const pairs = loadTaskRegistry().map(task => {
    const vanilla = results.find(row=>row.taskId===task.id&&row.arm==='vanilla');
    const graph = results.find(row=>row.taskId===task.id&&row.arm==='graph');
    const vanillaWall = vanilla.firstPass.wallTimeMs+(vanilla.repair?.wallTimeMs||0);
    const graphWall = graph.firstPass.wallTimeMs+(graph.repair?.wallTimeMs||0);
    const vanillaUsage = totalUsage(vanilla);
    const graphUsage = totalUsage(graph);
    return {
      taskId:task.id,class:task.class,
      vanilla:{wallTimeMs:vanillaWall,usage:vanillaUsage,firstPass:vanilla.firstGrade.pass,finalPass:vanilla.finalPass,repair:Boolean(vanilla.repair)},
      graph:{wallTimeMs:graphWall,usage:graphUsage,firstPass:graph.firstGrade.pass,finalPass:graph.finalPass,repair:Boolean(graph.repair)},
      difference:{wallTimeMs:graphWall-vanillaWall,totalTokens:graphUsage.totalTokens-vanillaUsage.totalTokens},
    };
  });
  const summary = {
    experimentId:EXPERIMENT_ID,
    generatedAt:new Date().toISOString(),
    sample:{pairs:6,countedFirstPassRuns:12},
    pairs,
    aggregate:{
      medianWallDifferenceMs:median(pairs.map(row=>row.difference.wallTimeMs)),
      wallDifferenceRangeMs:[Math.min(...pairs.map(row=>row.difference.wallTimeMs)),Math.max(...pairs.map(row=>row.difference.wallTimeMs))],
      medianTokenDifference:median(pairs.map(row=>row.difference.totalTokens)),
      tokenDifferenceRange:[Math.min(...pairs.map(row=>row.difference.totalTokens)),Math.max(...pairs.map(row=>row.difference.totalTokens))],
      vanillaFirstPassReady:pairs.filter(row=>row.vanilla.firstPass).length,
      graphFirstPassReady:pairs.filter(row=>row.graph.firstPass).length,
      vanillaFinalReady:pairs.filter(row=>row.vanilla.finalPass).length,
      graphFinalReady:pairs.filter(row=>row.graph.finalPass).length,
      vanillaRepairs:pairs.filter(row=>row.vanilla.repair).length,
      graphRepairs:pairs.filter(row=>row.graph.repair).length,
    },
    limitations:[
      'Six paired historical replays are directional evidence for James’s workload, not a population estimate.',
      'The comparison measures workflow packages; it does not isolate graph structure as the sole causal variable.',
      'No user decisions occurred after launch, so unattended completion is observed but human screen time is not estimated.',
    ],
  };
  atomicJson(path.join(DOCS_DIR,'results.json'), summary);
  return summary;
}

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index+1];
}

async function main() {
  const command = process.argv[2];
  const root = arg('--root', path.join('/private/tmp','fb-real-work-054'));
  if (command === 'prepare') console.log(JSON.stringify(prepare(root),null,2));
  else if (command === 'shakedown') console.log(JSON.stringify(await shakedown(root),null,2));
  else if (command === 'run') console.log(JSON.stringify(await runAll(root,{runId:arg('--run-id')}),null,2));
  else if (command === 'summarize') console.log(JSON.stringify(summarize(root),null,2));
  else throw new Error('Usage: prepare|shakedown|run|summarize [--root DIR] [--run-id ID]');
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode=1;
  });
}

module.exports = {
  EXPERIMENT_ID,
  freezeDeclaration,
  prepare,
  schedule,
  summarize,
  verifyFrozen,
};
