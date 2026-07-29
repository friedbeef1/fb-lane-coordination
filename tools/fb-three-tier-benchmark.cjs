'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {exportFixture, scanFixture} = require('./fb-real-work-fixture.cjs');
const {hash} = require('./fb-real-work-context.cjs');
const {publicEvidence, runFirstPass} = require('./fb-real-work-runner.cjs');
const {
  changedPaths,
  fileManifest,
  repairCommandArgs,
  repairPrompt,
} = require('./fb-repair-efficiency-benchmark.cjs');

const REPO_ROOT = path.resolve(__dirname, '..');
const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'fb-three-tier-benchmark', 'tasks.json');
const TASK_056_DECLARATION = path.join(REPO_ROOT, 'docs', 'benchmarks', 'repair-efficiency', 'declaration.json');
const TASK_056_RESULTS = path.join(REPO_ROOT, 'docs', 'benchmarks', 'repair-efficiency', 'results.json');
const TASK_056_HASHES = Object.freeze({
  declaration: 'a8dd4eca5ab3b77e9790d40c4068722c10bd8c7fbe7406ea2a592b628e1b6897',
  results: 'eac1d3b10318efdee46b1c6181037d86a01457dd6cffcbc02367db24ff1734df',
});
const MODEL = 'gpt-5.4';
const FIRST_PASS_TIMEOUT_MS = 20 * 60 * 1000;
const REPAIR_TIMEOUT_MS = 10 * 60 * 1000;
const AGGREGATE_TOKEN_CEILING = 60_000_000;
const MAXIMUM_PROVIDER_TOKENS_PER_RUN = 6_000_000;
const SAFE_EXPERIMENT = /^[a-z0-9-]+$/;
const SOURCE_REPOS = new Set([
  '/Users/jamesyeang/Projects/mirrorcam',
  '/Users/jamesyeang/Documents/New project-recovered-20260723',
]);

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function assertPinnedTask056File(file, expectedHash, label) {
  const actualHash = sha256File(file);
  if (actualHash !== expectedHash) throw new Error(`TASK-056 ${label} hash mismatch`);
  return actualHash;
}

function loadTierRegistry() {
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
}

function totalUsage(...passes) {
  const usage = {inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0};
  for (const pass of passes.filter(Boolean)) {
    for (const key of Object.keys(usage)) usage[key] += pass.usage[key];
  }
  usage.authoritative = passes.filter(Boolean).every(pass => pass.usage.authoritative === true);
  return usage;
}

function buildReuseReceipts({resultsPath = TASK_056_RESULTS, declarationPath = TASK_056_DECLARATION} = {}) {
  const originalResultHash = assertPinnedTask056File(resultsPath, TASK_056_HASHES.results, 'results');
  const declarationHash = assertPinnedTask056File(declarationPath, TASK_056_HASHES.declaration, 'declaration');
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const reusedIds = new Set(loadTierRegistry()
    .filter(task => task.reuse === 'TASK-056')
    .map(task => task.id));
  return results.results
    .filter(result => reusedIds.has(result.taskId))
    .map(result => ({
      originalResultHash,
      declarationHash,
      taskId: result.taskId,
      arm: result.arm,
      providerUsage: totalUsage(result.firstPass, result.repair),
      wallTimeMs: result.firstPass.wallTimeMs + (result.repair?.wallTimeMs || 0),
      acceptance: result.finalPass,
      readiness: result.finalGrade.readiness,
    }));
}

function buildThreeTierSchedule(tasks = loadTierRegistry()) {
  return tasks
    .filter(task => task.reuse !== 'TASK-056')
    .flatMap((task, pairIndex) => {
      const arms = pairIndex % 2 ? ['efficient-graph', 'vanilla'] : ['vanilla', 'efficient-graph'];
      return arms.map((arm, orderWithinPair) => ({
        runId: `${task.id}-${arm}`,
        taskId: task.id,
        tier: task.tier,
        arm,
        pairIndex,
        orderWithinPair,
        counted: true,
      }));
    });
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}

function sha256Value(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}

function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {flag: 'wx'});
  fs.renameSync(temporary, file);
}

function atomicImmutableJson(file, value) {
  if (fs.existsSync(file)) throw new Error(`Immutable checkpoint already exists: ${file}`);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {flag: 'wx'});
  try {
    fs.linkSync(temporary, file);
    fs.chmodSync(file, 0o444);
  } finally {
    fs.rmSync(temporary, {force: true});
  }
}

function checkpointEnvelope(result) {
  return {payloadSha256: sha256Value(result), result};
}

function readCheckpoint(file) {
  const checkpoint = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!checkpoint.result || checkpoint.payloadSha256 !== sha256Value(checkpoint.result)) {
    throw new Error(`Checkpoint hash mismatch: ${file}`);
  }
  return checkpoint.result;
}

function assertSafeExperiment(experimentId) {
  if (!SAFE_EXPERIMENT.test(experimentId || '')) {
    throw new Error(`Unsafe experiment id: ${experimentId}`);
  }
}

function runGit(repository, args, options = {}) {
  const result = spawnSync('git', ['-C', repository, ...args], {
    encoding: options.encoding || 'utf8',
    maxBuffer: 100 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed for ${repository}: ${String(result.stderr).trim()}`);
  }
  return result.stdout;
}

function sourceStatus(repository) {
  const head = String(runGit(repository, ['rev-parse', 'HEAD'])).trim();
  const porcelain = String(runGit(repository, [
    'status', '--porcelain=v1', '--untracked-files=all',
  ]));
  return {
    head,
    clean: porcelain.length === 0,
    sha256: crypto.createHash('sha256').update(`${head}\0${porcelain}`).digest('hex'),
  };
}

function sourceStatuses(tasks) {
  return Object.fromEntries([...new Set(tasks.filter(task => !task.reuse).map(task => task.sourceRepo))]
    .sort()
    .map(repository => [repository, sourceStatus(repository)]));
}

function assertSourceStatuses(expected) {
  for (const [repository, status] of Object.entries(expected)) {
    if (sourceStatus(repository).sha256 !== status.sha256) {
      throw new Error(`Source status changed: ${repository}`);
    }
  }
}

function assertPrivacySafe(value, location = 'evidence') {
  const forbiddenKey = /(private.?reasoning|transcript|conversation.?history|raw.?prompt|raw.?output|environment|credential|secret)/i;
  function visit(candidate, current) {
    if (Array.isArray(candidate)) {
      candidate.forEach((item, index) => visit(item, `${current}[${index}]`));
      return;
    }
    if (!candidate || typeof candidate !== 'object') return;
    for (const [key, item] of Object.entries(candidate)) {
      if (forbiddenKey.test(key)) throw new Error(`Privacy rejection at ${current}.${key}`);
      visit(item, `${current}.${key}`);
    }
  }
  visit(value, location);
}

function exportHistoricalTask(task, target) {
  if (SOURCE_REPOS.has(task.sourceRepo)) {
    return exportFixture({...task, startCommit: task.sourceRef}, target);
  }
  const commit = String(runGit(task.sourceRepo, ['rev-parse', `${task.sourceRef}^{commit}`])).trim();
  fs.rmSync(target, {recursive: true, force: true});
  fs.mkdirSync(target, {recursive: true});
  const archive = path.join(os.tmpdir(), `fb-three-tier-${process.pid}-${Date.now()}.tar`);
  try {
    runGit(task.sourceRepo, ['archive', '--format=tar', `--output=${archive}`, commit]);
    const extracted = spawnSync('tar', ['-xf', archive, '-C', target], {encoding: 'utf8'});
    if (extracted.status !== 0) throw new Error(`tar extraction failed: ${extracted.stderr}`);
  } finally {
    fs.rmSync(archive, {force: true});
  }
  const scan = scanFixture(target);
  if (scan.rejected.length) {
    fs.rmSync(target, {recursive: true, force: true});
    throw new Error(`Privacy rejection in fixture:\n${scan.rejected.join('\n')}`);
  }
  return {commit, files: scan.files.length};
}

function compileTreatment(task, arm) {
  if (!['vanilla', 'efficient-graph'].includes(arm)) throw new Error(`Unknown arm: ${arm}`);
  const publicFacts = JSON.parse(JSON.stringify(task.publicFacts || {}));
  assertPrivacySafe(publicFacts, `${task.id}.publicFacts`);
  const publicFactsSha256 = hash(publicFacts);
  const facts = JSON.stringify(publicFacts, null, 2);
  const prompt = arm === 'vanilla'
    ? `Use ordinary Codex execution. Implement only this public task:\n\n${facts}`
    : `Execute this Efficient-Graph FB packet with no extra coordination ceremony:\n\n${facts}`;
  return {
    arm,
    model: MODEL,
    publicFactsSha256,
    prompt,
    promptSha256: hash(prompt),
    firstPassTimeoutMs: FIRST_PASS_TIMEOUT_MS,
    repairTimeoutMs: REPAIR_TIMEOUT_MS,
  };
}

function defaultCommandArgs(fixture) {
  return [
    'exec', '--json', '--ignore-user-config', '--ignore-rules',
    '--skip-git-repo-check', '--sandbox', 'workspace-write',
    '-m', MODEL, '-C', fixture, '-',
  ];
}

function declarationFile(root) {
  return path.join(path.resolve(root), 'declaration.json');
}

function preflight(root, experimentId, options = {}) {
  assertSafeExperiment(experimentId);
  const absoluteRoot = path.resolve(root);
  const tasks = options.tasks || loadTierRegistry();
  if (!options.tasks) {
    for (const task of tasks.filter(task => !task.reuse)) {
      if (!SOURCE_REPOS.has(task.sourceRepo)) throw new Error(`Unapproved source repository: ${task.sourceRepo}`);
    }
  }
  tasks.forEach(task => assertPrivacySafe(task.publicFacts || {}, `${task.id}.publicFacts`));
  const schedule = buildThreeTierSchedule(tasks);
  const reuseReceipts = options.reuseReceipts || buildReuseReceipts();
  const statuses = sourceStatuses(tasks);
  const file = declarationFile(absoluteRoot);
  if (fs.existsSync(file)) throw new Error('Preflight already exists');
  fs.mkdirSync(absoluteRoot, {recursive: true});
  for (const task of tasks.filter(task => !task.reuse)) {
    const base = path.join(absoluteRoot, 'bases', task.id);
    exportHistoricalTask(task, base);
    for (const arm of ['vanilla', 'efficient-graph']) {
      const runDir = path.join(absoluteRoot, 'runs', `${task.id}-${arm}`);
      const fixture = path.join(runDir, 'fixture');
      fs.mkdirSync(runDir, {recursive: true});
      fs.cpSync(base, fixture, {recursive: true});
      const treatment = compileTreatment(task, arm);
      const input = path.join(fixture, '.benchmark-input');
      fs.mkdirSync(input, {recursive: true});
      fs.writeFileSync(path.join(input, 'brief.md'), treatment.prompt);
      const {prompt, ...receipt} = treatment;
      atomicJson(path.join(runDir, 'treatment.json'), receipt);
    }
  }
  assertSourceStatuses(statuses);
  const declaration = {
    experimentId,
    passed: true,
    model: MODEL,
    firstPassTimeoutMs: FIRST_PASS_TIMEOUT_MS,
    repairTimeoutMs: REPAIR_TIMEOUT_MS,
    repairMaximumPerRun: 1,
    repairContextMode: 'fresh-delta',
    aggregateTokenCeiling: options.aggregateTokenCeiling || AGGREGATE_TOKEN_CEILING,
    maximumProviderTokensPerRun: options.maximumProviderTokensPerRun || MAXIMUM_PROVIDER_TOKENS_PER_RUN,
    newCountedRuns: schedule.length,
    reusedCountedRuns: reuseReceipts.length,
    schedule,
    sourceStatus: statuses,
    reuseReceiptSha256: sha256Value(reuseReceipts),
  };
  atomicImmutableJson(file, declaration);
  return declaration;
}

function loadDeclaration(root, experimentId) {
  const file = declarationFile(root);
  if (!fs.existsSync(file)) throw new Error('Passing preflight required');
  const declaration = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!declaration.passed || declaration.experimentId !== experimentId) {
    throw new Error('Passing matching preflight required');
  }
  return declaration;
}

function cleanupPass(pass) {
  const home = pass?._config?.codexHome;
  if (home) fs.rmSync(home, {recursive: true, force: true});
}

async function shakedown(root, experimentId, options = {}) {
  const declaration = loadDeclaration(root, experimentId);
  assertSourceStatuses(declaration.sourceStatus);
  const file = path.join(path.resolve(root), 'shakedown', 'result.json');
  if (fs.existsSync(file)) throw new Error('Excluded shakedown already exists');
  const fixture = path.join(path.resolve(root), 'shakedown', 'fixture');
  fs.mkdirSync(fixture, {recursive: true});
  fs.writeFileSync(path.join(fixture, 'answer.txt'), 'WRONG\n');
  const common = {
    taskId: 'shakedown',
    arm: 'efficient-graph',
    fixtureDir: fixture,
    allowedRoot: path.resolve(root),
    command: options.command,
    commandPrefix: options.commandPrefix,
    env: options.env,
  };
  let first;
  let repair;
  try {
    first = await runFirstPass({
      ...common,
      runId: 'three-tier-shakedown-first',
      prompt: 'SHAKEDOWN FIRST PASS: change answer.txt to DRAFT followed by a newline, then stop.',
      timeoutMs: FIRST_PASS_TIMEOUT_MS,
      commandArgs: options.commandArgs || defaultCommandArgs(fixture),
    });
    repair = await runFirstPass({
      ...common,
      runId: 'three-tier-shakedown-repair',
      prompt: repairPrompt({
        action: 'repair',
        objective: 'Correct answer.txt.',
        candidateRef: first.candidateSha256,
        changedPaths: ['answer.txt'],
        failedCriteria: [{id: 'answer', expected: 'READY followed by a newline.', observed: 'The first pass intentionally wrote DRAFT.'}],
        relevantDecisions: ['Use exactly READY.'],
        proofOutput: 'FAIL answer',
        correction: 'Replace answer.txt with READY followed by a newline.',
      }),
      timeoutMs: REPAIR_TIMEOUT_MS,
      commandArgs: options.repairCommandArgs || repairCommandArgs(fixture),
    });
    const result = {
      experimentId,
      excluded: true,
      firstPass: {...publicEvidence(first), timeoutMs: FIRST_PASS_TIMEOUT_MS},
      repair: {...publicEvidence(repair), timeoutMs: REPAIR_TIMEOUT_MS, contextMode: 'fresh-delta'},
      authoritativeUsage: first.usage.authoritative && repair.usage.authoritative,
      passed: fs.readFileSync(path.join(fixture, 'answer.txt'), 'utf8') === 'READY\n' &&
        first.exitCode === 0 && repair.exitCode === 0 &&
        first.usage.authoritative && repair.usage.authoritative,
    };
    assertPrivacySafe(result);
    atomicImmutableJson(file, checkpointEnvelope(result));
    if (!result.authoritativeUsage) throw new Error('Shakedown lacks authoritative usage; counted spend is blocked');
    if (!result.passed) throw new Error('Excluded shakedown failed');
    assertSourceStatuses(declaration.sourceStatus);
    return result;
  } finally {
    cleanupPass(first);
    cleanupPass(repair);
  }
}

function ensureShakedown(root, experimentId) {
  const file = path.join(path.resolve(root), 'shakedown', 'result.json');
  if (!fs.existsSync(file)) throw new Error('Passing excluded shakedown required');
  const result = readCheckpoint(file);
  if (result.experimentId !== experimentId || !result.excluded || !result.passed || !result.authoritativeUsage) {
    throw new Error('Passing authoritative excluded shakedown required');
  }
  return result;
}

function defaultGradeCandidate(task, candidateDir) {
  return require(path.join(
    __dirname,
    'fixtures',
    'fb-three-tier-benchmark',
    'graders',
    `${task.grader}.cjs`,
  )).grade(candidateDir);
}

function usageForResult(result) {
  return totalUsage(result.firstPass, result.repair);
}

function existingResults(root, declaration) {
  const results = [];
  for (const row of declaration.schedule) {
    const file = path.join(path.resolve(root), 'runs', row.runId, 'result.json');
    if (fs.existsSync(file)) results.push(readCheckpoint(file));
  }
  return results;
}

function usedProviderTokens(root, declaration, reuseReceipts) {
  const reused = reuseReceipts.reduce((sum, receipt) => sum + receipt.providerUsage.totalTokens, 0);
  const fresh = existingResults(root, declaration).reduce((sum, result) => {
    const usage = usageForResult(result);
    if (!usage.authoritative) throw new Error('Existing checkpoint lacks authoritative provider usage');
    return sum + usage.totalTokens;
  }, 0);
  return reused + fresh;
}

function assertTokenBudget(root, declaration, reuseReceipts) {
  const used = usedProviderTokens(root, declaration, reuseReceipts);
  if (used + declaration.maximumProviderTokensPerRun > declaration.aggregateTokenCeiling) {
    throw new Error(
      `Aggregate token ceiling risk: ${used} used plus ${declaration.maximumProviderTokensPerRun} next-run reserve exceeds ${declaration.aggregateTokenCeiling}`,
    );
  }
}

async function executeRun(root, experimentId, row, task, options, declaration) {
  const runDir = path.join(path.resolve(root), 'runs', row.runId);
  const resultFile = path.join(runDir, 'result.json');
  if (fs.existsSync(resultFile)) throw new Error(`Counted run already exists: ${row.runId}`);
  const fixture = path.join(runDir, 'fixture');
  const treatment = compileTreatment(task, row.arm);
  const baseline = fileManifest(path.join(path.resolve(root), 'bases', task.id));
  let first;
  let repair;
  try {
    first = await runFirstPass({
      runId: row.runId,
      taskId: task.id,
      arm: row.arm,
      fixtureDir: fixture,
      allowedRoot: path.resolve(root),
      prompt: treatment.prompt,
      timeoutMs: FIRST_PASS_TIMEOUT_MS,
      command: options.command,
      commandPrefix: options.commandPrefix,
      commandArgs: options.commandArgs || defaultCommandArgs(fixture),
      env: options.env,
    });
    const grade = options.gradeCandidate || defaultGradeCandidate;
    const firstGrade = grade(task, fixture);
    let finalGrade = firstGrade;
    assertSourceStatuses(declaration.sourceStatus);
    if (!firstGrade.pass && first.exitCode === 0 && !first.timedOut && first.usage.authoritative) {
      const delta = changedPaths(baseline, fileManifest(fixture));
      repair = await runFirstPass({
        runId: `${row.runId}-repair`,
        taskId: task.id,
        arm: row.arm,
        fixtureDir: fixture,
        allowedRoot: path.resolve(root),
        prompt: repairPrompt({
          action: 'repair',
          objective: `Correct only the failed ${task.id} acceptance.`,
          candidateRef: first.candidateSha256,
          changedPaths: delta,
          failedCriteria: (firstGrade.criteria || []).filter(criterion => !criterion.pass).map(criterion => ({
            id: criterion.id,
            expected: (task.publicFacts.acceptanceCriteria || []).join(' '),
            observed: `${criterion.id} failed.`,
          })),
          relevantDecisions: task.publicFacts.relevantDecisions || [],
          proofOutput: `${firstGrade.passed} of ${firstGrade.total} criteria passed.`,
          correction: 'Make the smallest source correction for the failed criteria.',
        }),
        timeoutMs: REPAIR_TIMEOUT_MS,
        command: options.command,
        commandPrefix: options.commandPrefix,
        commandArgs: options.repairCommandArgs || repairCommandArgs(fixture),
        env: options.env,
      });
      finalGrade = grade(task, fixture);
    }
    const result = {
      experimentId,
      ...row,
      treatment: {
        publicFactsSha256: treatment.publicFactsSha256,
        promptSha256: treatment.promptSha256,
        model: MODEL,
      },
      firstPass: {...publicEvidence(first), timeoutMs: FIRST_PASS_TIMEOUT_MS},
      firstGrade,
      repair: repair ? {
        ...publicEvidence(repair),
        timeoutMs: REPAIR_TIMEOUT_MS,
        contextMode: 'fresh-delta',
      } : null,
      finalGrade,
      finalPass: finalGrade.pass,
      userDecisionEvents: 0,
    };
    assertPrivacySafe(result);
    atomicImmutableJson(resultFile, checkpointEnvelope(result));
    const usage = usageForResult(result);
    if (!usage.authoritative) throw new Error(`Counted result lacks authoritative provider usage: ${row.runId}`);
    assertSourceStatuses(declaration.sourceStatus);
    return result;
  } finally {
    cleanupPass(first);
    cleanupPass(repair);
  }
}

async function runAll(root, experimentId, options = {}) {
  const declaration = loadDeclaration(root, experimentId);
  ensureShakedown(root, experimentId);
  assertSourceStatuses(declaration.sourceStatus);
  const tasks = options.tasks || loadTierRegistry();
  const reuseReceipts = options.reuseReceipts || buildReuseReceipts();
  if (sha256Value(reuseReceipts) !== declaration.reuseReceiptSha256) {
    throw new Error('Reuse receipt hash mismatch');
  }
  const completed = new Set(existingResults(root, declaration).map(result => result.runId));
  if (options.runId && completed.has(options.runId)) {
    throw new Error(`Counted run already exists: ${options.runId}`);
  }
  const selected = options.runId
    ? declaration.schedule.filter(row => row.runId === options.runId)
    : declaration.schedule.filter(row => !completed.has(row.runId));
  if (options.runId && !selected.length) throw new Error(`Unknown run id: ${options.runId}`);
  if (!selected.length) throw new Error('Counted schedule is complete; reruns are forbidden');
  const output = [];
  for (const row of selected) {
    assertTokenBudget(root, declaration, reuseReceipts);
    const task = tasks.find(candidate => candidate.id === row.taskId);
    if (!task) throw new Error(`Missing task: ${row.taskId}`);
    output.push(await executeRun(root, experimentId, row, task, options, declaration));
  }
  return output;
}

function emptyUsage() {
  return {inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, authoritative: true};
}

function addUsage(target, usage) {
  for (const key of ['inputTokens', 'cachedInputTokens', 'outputTokens', 'totalTokens']) {
    target[key] += usage[key];
  }
  target.authoritative = target.authoritative && usage.authoritative === true;
}

function summarize(root, experimentId, options = {}) {
  const declaration = loadDeclaration(root, experimentId);
  const tasks = options.tasks || loadTierRegistry();
  const reuseReceipts = options.reuseReceipts || buildReuseReceipts();
  if (sha256Value(reuseReceipts) !== declaration.reuseReceiptSha256) {
    throw new Error('Reuse receipt hash mismatch');
  }
  const fresh = declaration.schedule.map(row => {
    const file = path.join(path.resolve(root), 'runs', row.runId, 'result.json');
    if (!fs.existsSync(file)) throw new Error(`Missing counted result: ${row.runId}`);
    return readCheckpoint(file);
  });
  const taskById = new Map(tasks.map(task => [task.id, task]));
  const normalized = [
    ...reuseReceipts.map(receipt => ({
      taskId: receipt.taskId,
      arm: receipt.arm,
      tier: taskById.get(receipt.taskId)?.tier,
      wallTimeMs: receipt.wallTimeMs,
      usage: receipt.providerUsage,
      finalPass: receipt.acceptance,
      readiness: receipt.readiness,
      reused: true,
    })),
    ...fresh.map(result => ({
      taskId: result.taskId,
      arm: result.arm,
      tier: result.tier,
      wallTimeMs: result.firstPass.wallTimeMs + (result.repair?.wallTimeMs || 0),
      usage: usageForResult(result),
      finalPass: result.finalPass,
      readiness: result.finalGrade.readiness,
      reused: false,
    })),
  ];
  if (normalized.some(result => !result.tier)) throw new Error('Result lacks a frozen tier');
  const tiers = {};
  for (const tier of ['easy', 'medium', 'difficult']) {
    const tierRows = normalized.filter(result => result.tier === tier);
    if (!tierRows.length) continue;
    tiers[tier] = {arms: {}};
    for (const arm of ['vanilla', 'efficient-graph']) {
      const rows = tierRows.filter(result => result.arm === arm);
      const usage = emptyUsage();
      rows.forEach(row => addUsage(usage, row.usage));
      tiers[tier].arms[arm] = {
        outcomes: rows.length,
        strictAccepted: rows.filter(row => row.finalPass).length,
        meanReadiness: rows.reduce((sum, row) => sum + row.readiness, 0) / rows.length,
        atLeast80: rows.filter(row => row.readiness >= 0.8).length,
        atLeast80Proportion: rows.filter(row => row.readiness >= 0.8).length / rows.length,
        wallTimeMs: rows.reduce((sum, row) => sum + row.wallTimeMs, 0),
        providerUsage: usage,
      };
    }
  }
  const result = {
    experimentId,
    sample: {
      reusedCountedRuns: reuseReceipts.length,
      newCountedRuns: fresh.length,
      totalCountedRuns: normalized.length,
    },
    tiers,
    aggregateProviderTokens: normalized.reduce((sum, row) => sum + row.usage.totalTokens, 0),
  };
  assertPrivacySafe(result);
  return result;
}

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

async function main() {
  const command = process.argv[2];
  const experimentId = argument('--experiment');
  assertSafeExperiment(experimentId);
  const root = argument('--root', path.join('/private/tmp', experimentId));
  if (command === 'preflight') console.log(JSON.stringify(preflight(root, experimentId), null, 2));
  else if (command === 'shakedown') console.log(JSON.stringify(await shakedown(root, experimentId), null, 2));
  else if (command === 'run') console.log(JSON.stringify(await runAll(root, experimentId, {runId: argument('--run-id')}), null, 2));
  else if (command === 'summarize') console.log(JSON.stringify(summarize(root, experimentId), null, 2));
  else throw new Error('Usage: preflight|shakedown|run|summarize --experiment ID [--root DIR] [--run-id ID]');
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  AGGREGATE_TOKEN_CEILING,
  FIRST_PASS_TIMEOUT_MS,
  REPAIR_TIMEOUT_MS,
  loadTierRegistry,
  buildReuseReceipts,
  buildThreeTierSchedule,
  preflight,
  shakedown,
  runAll,
  summarize,
};
