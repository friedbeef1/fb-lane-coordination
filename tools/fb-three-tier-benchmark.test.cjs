const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {
  AGGREGATE_TOKEN_CEILING,
  FIRST_PASS_TIMEOUT_MS,
  REPAIR_TIMEOUT_MS,
  loadTierRegistry,
  buildReuseReceipts,
  buildThreeTierSchedule,
  compileTreatment,
  directionalProfile,
  preflight,
  regradeCandidates,
  shakedown,
  runAll,
  summarize,
} = require('./fb-three-tier-benchmark.cjs');
const {grade: gradeSubchecks} = require('./fixtures/fb-three-tier-benchmark/graders/_shared.cjs');

const IDS_BY_TIER = {
  easy: [
    'unmirror-intro', 'unmirror-intro-persistence', 'meja-scroll',
    'meja-topic-flip', 'meja-back-navigation', 'meja-first-timer-readiness',
  ],
  medium: [
    'unmirror-intro-polish', 'unmirror-landscape-camera',
    'unmirror-actual-reassurance', 'meja-home-scroll', 'meja-sync-warning',
    'meja-redesign',
  ],
  difficult: [
    'unmirror-saved-capture', 'unmirror-native-analytics',
    'unmirror-unified-shutter', 'unmirror-ios-camera-crash', 'meja-pairing',
    'meja-auth-hardening',
  ],
};

const REUSED_REFS = {
  'unmirror-intro': {sourceRef: '2600f57', acceptanceRefs: ['c6e5fde', 'de82cbc']},
  'unmirror-saved-capture': {sourceRef: '568a6b4', acceptanceRefs: ['c26ab07', '9b7cd27', '5d5a33b', '070ae67', '191a69d', 'b4aaf03', 'afa47a6', 'fc359d6']},
  'unmirror-native-analytics': {sourceRef: '71bf297', acceptanceRefs: ['e548495', '42bc97c']},
  'meja-scroll': {sourceRef: 'cdfa26d', acceptanceRefs: ['27f67cc', '60c51f6']},
  'meja-pairing': {sourceRef: 'da4868f', acceptanceRefs: ['53d6d8d', '39dbbd7', 'ffe9c79', '6eb73c2', 'bb817e0', '1ff4f1d', '1462645']},
  'meja-redesign': {sourceRef: 'a815a90', acceptanceRefs: ['3bd46b2', '469cf31']},
};

const RECEIPTS = {
  'unmirror-intro:vanilla': {providerUsage: {inputTokens: 637521, cachedInputTokens: 534400, outputTokens: 8720, totalTokens: 646241, authoritative: true}, wallTimeMs: 252215, acceptance: true, readiness: 1},
  'unmirror-intro:efficient-graph': {providerUsage: {inputTokens: 638386, cachedInputTokens: 569856, outputTokens: 8988, totalTokens: 647374, authoritative: true}, wallTimeMs: 212958, acceptance: true, readiness: 1},
  'unmirror-saved-capture:efficient-graph': {providerUsage: {inputTokens: 5099870, cachedInputTokens: 4914816, outputTokens: 27109, totalTokens: 5126979, authoritative: true}, wallTimeMs: 664463, acceptance: true, readiness: 1},
  'unmirror-saved-capture:vanilla': {providerUsage: {inputTokens: 5659488, cachedInputTokens: 5397376, outputTokens: 31646, totalTokens: 5691134, authoritative: true}, wallTimeMs: 1052463, acceptance: false, readiness: 0.6},
  'unmirror-native-analytics:vanilla': {providerUsage: {inputTokens: 1760649, cachedInputTokens: 1600512, outputTokens: 18219, totalTokens: 1778868, authoritative: true}, wallTimeMs: 575858, acceptance: false, readiness: 0.75},
  'unmirror-native-analytics:efficient-graph': {providerUsage: {inputTokens: 1272903, cachedInputTokens: 1194112, outputTokens: 17949, totalTokens: 1290852, authoritative: true}, wallTimeMs: 389957, acceptance: true, readiness: 1},
  'meja-scroll:efficient-graph': {providerUsage: {inputTokens: 1034732, cachedInputTokens: 911232, outputTokens: 11998, totalTokens: 1046730, authoritative: true}, wallTimeMs: 311577, acceptance: false, readiness: 2 / 3},
  'meja-scroll:vanilla': {providerUsage: {inputTokens: 1010101, cachedInputTokens: 891776, outputTokens: 11147, totalTokens: 1021248, authoritative: true}, wallTimeMs: 300803, acceptance: false, readiness: 2 / 3},
  'meja-pairing:vanilla': {providerUsage: {inputTokens: 1767830, cachedInputTokens: 1596672, outputTokens: 22830, totalTokens: 1790660, authoritative: true}, wallTimeMs: 547775, acceptance: false, readiness: 0.5},
  'meja-pairing:efficient-graph': {providerUsage: {inputTokens: 1534125, cachedInputTokens: 1425024, outputTokens: 15572, totalTokens: 1549697, authoritative: true}, wallTimeMs: 404466, acceptance: false, readiness: 0.5},
  'meja-redesign:efficient-graph': {providerUsage: {inputTokens: 2206265, cachedInputTokens: 2056832, outputTokens: 25063, totalTokens: 2231328, authoritative: true}, wallTimeMs: 687966, acceptance: false, readiness: 0.6},
  'meja-redesign:vanilla': {providerUsage: {inputTokens: 3162376, cachedInputTokens: 2951552, outputTokens: 27176, totalTokens: 3189552, authoritative: true}, wallTimeMs: 766116, acceptance: false, readiness: 0.6},
};

const UNMIRROR_SOURCE_REPO = '/Users/jamesyeang/Projects/mirrorcam';
const MEJA_SOURCE_REPO = '/Users/jamesyeang/Documents/New project-recovered-20260723';
const UNMIRROR_FIXTURES = {
  'unmirror-intro-persistence': {sourceRef: 'a8a6290', acceptanceRefs: ['f618561']},
  'unmirror-intro-polish': {sourceRef: 'a0e9702', acceptanceRefs: ['6c83c40']},
  'unmirror-landscape-camera': {sourceRef: 'fb0dbe9', acceptanceRefs: ['fe6b69a']},
  'unmirror-actual-reassurance': {sourceRef: 'f618561', acceptanceRefs: ['2cd5b90']},
  'unmirror-unified-shutter': {sourceRef: '2d4a222', acceptanceRefs: ['5bd0e10']},
  'unmirror-ios-camera-crash': {sourceRef: 'bb6b276', acceptanceRefs: ['e548495']},
};

const MEJA_FIXTURES = {
  'meja-topic-flip': {sourceRef: '31ad03a', acceptanceRefs: ['fea1227']},
  'meja-back-navigation': {sourceRef: 'fea1227', acceptanceRefs: ['2675a6c']},
  'meja-first-timer-readiness': {sourceRef: 'b009d76', acceptanceRefs: ['e7fbe9d']},
  'meja-home-scroll': {sourceRef: '37282fd', acceptanceRefs: ['21e36af']},
  'meja-sync-warning': {sourceRef: '8082e42', acceptanceRefs: ['97a39ed']},
  'meja-auth-hardening': {sourceRef: 'fea1227', acceptanceRefs: ['2675a6c']},
};

function archiveHistoricalTree(sourceRepo, ref, directory) {
  const archive = spawnSync('git', ['-C', sourceRepo, 'archive', '--format=tar', ref], {
    encoding: null,
    maxBuffer: 100 * 1024 * 1024,
  });
  assert.equal(archive.status, 0, archive.stderr?.toString('utf8'));
  const extract = spawnSync('tar', ['-xf', '-', '-C', directory], {input: archive.stdout, encoding: 'utf8'});
  assert.equal(extract.status, 0, extract.stderr);
}

function gradeHistoricalTree(task, directory) {
  return require(path.join(
    __dirname,
    'fixtures',
    'fb-three-tier-benchmark',
    'graders',
    `${task.grader}.cjs`,
  )).grade(directory);
}

test('frozen registry has exactly the mandated three-tier task set and balanced total representation', () => {
  const tasks = loadTierRegistry();
  assert.equal(tasks.length, 18);
  assert.equal(new Set(tasks.map(task => task.id)).size, 18);
  for (const [tier, ids] of Object.entries(IDS_BY_TIER)) {
    assert.deepEqual(tasks.filter(task => task.tier === tier).map(task => task.id), ids);
    assert.equal(tasks.filter(task => task.tier === tier).length, 6);
  }
  assert.deepEqual(
    Object.fromEntries(['Unmirror', 'MÉJA'].map(project => [
      project,
      tasks.filter(task => task.project === project).length,
    ])),
    {Unmirror: 9, 'MÉJA': 9},
  );
  assert.deepEqual(Object.fromEntries(tasks.filter(task => task.reuse === 'TASK-056')
    .map(({id, sourceRef, acceptanceRefs}) => [id, {sourceRef, acceptanceRefs}])), REUSED_REFS);
});

test('TASK-056 receipt reuse is an exact immutable projection of the frozen study', () => {
  const receipts = buildReuseReceipts();
  assert.equal(receipts.length, 12);
  assert.equal(new Set(receipts.map(receipt => `${receipt.taskId}:${receipt.arm}`)).size, 12);
  assert.deepEqual(new Set(receipts.map(receipt => receipt.originalResultHash)), new Set(['eac1d3b10318efdee46b1c6181037d86a01457dd6cffcbc02367db24ff1734df']));
  assert.deepEqual(new Set(receipts.map(receipt => receipt.declarationHash)), new Set(['a8dd4eca5ab3b77e9790d40c4068722c10bd8c7fbe7406ea2a592b628e1b6897']));
  assert.deepEqual(Object.fromEntries(receipts.map(receipt => [
    `${receipt.taskId}:${receipt.arm}`,
    {
      providerUsage: receipt.providerUsage,
      wallTimeMs: receipt.wallTimeMs,
      acceptance: receipt.acceptance,
      readiness: receipt.readiness,
    },
  ])), RECEIPTS);
});

test('reuse import fails closed when either pinned TASK-056 evidence file changes', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-three-tier-receipt-'));
  const resultsPath = path.join(directory, 'results.json');
  const declarationPath = path.join(directory, 'declaration.json');
  fs.copyFileSync(path.join(__dirname, '..', 'docs', 'benchmarks', 'repair-efficiency', 'results.json'), resultsPath);
  fs.copyFileSync(path.join(__dirname, '..', 'docs', 'benchmarks', 'repair-efficiency', 'declaration.json'), declarationPath);
  fs.appendFileSync(resultsPath, '\n');
  assert.throws(() => buildReuseReceipts({resultsPath, declarationPath}), /TASK-056 results hash mismatch/);
  fs.copyFileSync(path.join(__dirname, '..', 'docs', 'benchmarks', 'repair-efficiency', 'results.json'), resultsPath);
  fs.appendFileSync(declarationPath, '\n');
  assert.throws(() => buildReuseReceipts({resultsPath, declarationPath}), /TASK-056 declaration hash mismatch/);
});

test('three-tier schedule excludes reused pairs and schedules exactly the twelve missing pairs', () => {
  const schedule = buildThreeTierSchedule();
  assert.equal(schedule.length, 24);
  assert.equal(new Set(schedule.map(row => row.runId)).size, 24);
  assert.deepEqual(new Set(schedule.map(row => row.taskId)), new Set(loadTierRegistry()
    .filter(task => task.reuse !== 'TASK-056')
    .map(task => task.id)));
  assert.ok(schedule.every(row => row.counted && ['vanilla', 'efficient-graph'].includes(row.arm)));
  for (const taskId of new Set(schedule.map(row => row.taskId))) {
    assert.equal(schedule.filter(row => row.taskId === taskId).length, 2);
  }
});

test('six Unmirror historical fixtures reject their start trees and accept their recorded states', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-three-tier-unmirror-'));
  try {
    const tasks = Object.fromEntries(loadTierRegistry().map(task => [task.id, task]));
    for (const [id, expected] of Object.entries(UNMIRROR_FIXTURES)) {
      const task = tasks[id];
      assert.equal(task.sourceRepo, UNMIRROR_SOURCE_REPO, `${id} source repository`);
      assert.equal(task.sourceRef, expected.sourceRef, `${id} source ref`);
      assert.deepEqual(task.acceptanceRefs, expected.acceptanceRefs, `${id} accepted refs`);

      const start = path.join(directory, `${id}-start`);
      const accepted = path.join(directory, `${id}-accepted`);
      fs.mkdirSync(start);
      fs.mkdirSync(accepted);
      archiveHistoricalTree(UNMIRROR_SOURCE_REPO, task.sourceRef, start);
      archiveHistoricalTree(UNMIRROR_SOURCE_REPO, task.acceptanceRefs.at(-1), accepted);
      assert.equal(gradeHistoricalTree(task, start).pass, false, `${id} start unexpectedly passed`);
      assert.equal(gradeHistoricalTree(task, accepted).pass, true, `${id} accepted state failed`);
    }
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('six MÉJA historical fixtures reject their start trees and accept their recorded states without credentials', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-three-tier-meja-'));
  try {
    const tasks = Object.fromEntries(loadTierRegistry().map(task => [task.id, task]));
    for (const [id, expected] of Object.entries(MEJA_FIXTURES)) {
      const task = tasks[id];
      assert.equal(task.sourceRepo, MEJA_SOURCE_REPO, `${id} source repository`);
      assert.equal(task.sourceRef, expected.sourceRef, `${id} source ref`);
      assert.deepEqual(task.acceptanceRefs, expected.acceptanceRefs, `${id} accepted refs`);
      assert.ok(task.publicFacts, `${id} public facts`);
      assert.ok(task.grader, `${id} grader`);

      const start = path.join(directory, `${id}-start`);
      const accepted = path.join(directory, `${id}-accepted`);
      fs.mkdirSync(start);
      fs.mkdirSync(accepted);
      archiveHistoricalTree(MEJA_SOURCE_REPO, task.sourceRef, start);
      archiveHistoricalTree(MEJA_SOURCE_REPO, task.acceptanceRefs.at(-1), accepted);
      assert.equal(gradeHistoricalTree(task, start).pass, false, `${id} start unexpectedly passed`);
      assert.equal(gradeHistoricalTree(task, accepted).pass, true, `${id} accepted state failed`);
    }
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('MÉJA auth-hardening grader rejects an AI dispatch reordered before authentication and rate limiting', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-three-tier-meja-auth-order-'));
  try {
    const task = loadTierRegistry().find(candidate => candidate.id === 'meja-auth-hardening');
    archiveHistoricalTree(MEJA_SOURCE_REPO, task.acceptanceRefs.at(-1), directory);
    const functionPath = path.join(directory, 'supabase', 'functions', 'meja-ai', 'index.ts');
    const source = fs.readFileSync(functionPath, 'utf8');
    fs.writeFileSync(functionPath, source.replace(
      "  const action = body.action || 'topic_pair';",
      "  const action = body.action || 'topic_pair';\n  if (action === 'topic_pair') return json(await topicPair(body.theme || 'public speaking'), origin);",
    ));

    const result = gradeHistoricalTree(task, directory);
    assert.equal(result.pass, false);
    assert.equal(result.criteria.find(criterion => criterion.id === 'auth-and-rate-limit-before-paid-ai').pass, false);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('protocol v2 easy graders reject unsafe or incomplete semantic mutations', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-three-tier-easy-mutations-'));
  try {
    const tasks = new Map(loadTierRegistry().map(task => [task.id, task]));
    const cases = [{
      id: 'unmirror-intro-persistence',
      file: 'src/components/IntroScreen.tsx',
      mutate: source => source.replaceAll('localStorage.setItem', 'discardedPreference'),
    }, {
      id: 'unmirror-intro-persistence',
      name: 'unmirror-intro-invalid-default',
      file: 'android-native/app/src/main/java/ai/toughtalks/unmirror/MainActivity.kt',
      mutate: source => source.replace('else "Female"', 'else "Male"'),
    }, {
      id: 'meja-topic-flip',
      file: 'index.html',
      mutate: source => source.replaceAll('topic-flip', 'generic-motion'),
    }, {
      id: 'meja-back-navigation',
      file: 'index.html',
      mutate: source => source.replaceAll('routeHistoryStack.pop()', 'location.hash'),
    }, {
      id: 'meja-first-timer-readiness',
      file: 'index.html',
      mutate: source => source.replaceAll('controllerAccess(', 'unrestrictedAccess('),
    }, {
      id: 'meja-sync-warning',
      file: 'index.html',
      mutate: source => source.replaceAll('role="alert"', 'role="status"'),
    }, {
      id: 'meja-sync-warning',
      name: 'meja-sync-warning-without-dismissal',
      file: 'index.html',
      mutate: source => source.replace(
        /<button type="button" class="warning-dismiss"[\s\S]*?<\/button>/,
        '',
      ),
    }, {
      id: 'unmirror-ios-camera-crash',
      file: 'ios-native/Unmirror/CameraController.swift',
      mutate: source => source.replaceAll('isActive', 'ignoredActive'),
    }, {
      id: 'unmirror-ios-camera-crash',
      name: 'unmirror-ios-camera-without-video-guard',
      file: 'ios-native/Unmirror/CameraController.swift',
      mutate: source => source
        .replaceAll('hasVideoInput', 'hasAnyInput')
        .replaceAll('$0.mediaType == .video', 'true'),
    }];
    for (const item of cases) {
      const task = tasks.get(item.id);
      const candidate = path.join(directory, item.name || item.id);
      fs.mkdirSync(candidate);
      archiveHistoricalTree(task.sourceRepo, task.acceptanceRefs.at(-1), candidate);
      const file = path.join(candidate, item.file);
      fs.writeFileSync(file, item.mutate(fs.readFileSync(file, 'utf8')));
      const result = gradeHistoricalTree(task, candidate);
      assert.equal(result.pass, false, `${item.id} unsafe mutation passed`);
      assert.ok(result.readiness < 1, `${item.id} mutation retained full readiness`);
    }
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('public task facts reject exact hidden grader answer literals', () => {
  const publicFacts = loadTierRegistry().flatMap(task => Object.values(task.publicFacts || {}));
  const publicText = JSON.stringify(publicFacts);
  assert.doesNotMatch(publicText, /440ms/);
  assert.doesNotMatch(publicText, /user_id filtering/);
});

test('protocol v2 facts are complete and equal while treatment structure differs by arm', () => {
  const required = [
    'relevantFiles',
    'startingEvidence',
    'dependencies',
    'workSlices',
    'verificationTargets',
    'outcomeConstraints',
  ];
  for (const task of loadTierRegistry().filter(candidate => !candidate.reuse)) {
    for (const field of required) {
      assert.ok(Array.isArray(task.publicFacts[field]), `${task.id}.${field}`);
      assert.ok(task.publicFacts[field].length, `${task.id}.${field} is empty`);
    }
    const vanilla = compileTreatment(task, 'vanilla');
    const graph = compileTreatment(task, 'efficient-graph');
    assert.deepEqual(vanilla.publicFacts, graph.publicFacts, `${task.id} fact parity`);
    assert.equal(vanilla.structure, 'flat-brief');
    assert.equal(graph.structure, 'graph-packet');
    assert.equal(vanilla.packet, null);
    assert.ok(graph.packet.nodes.length >= 3);
    assert.deepEqual(graph.packet.dependencies, task.publicFacts.dependencies);
    assert.deepEqual(graph.packet.slices, task.publicFacts.workSlices);
    assert.deepEqual(graph.packet.verification, task.publicFacts.verificationTargets);
    for (const value of Object.values(task.publicFacts).flat()) {
      assert.ok(vanilla.prompt.includes(String(value)), `${task.id} vanilla omitted fact`);
      assert.ok(graph.prompt.includes(String(value)), `${task.id} graph omitted fact`);
    }
    assert.notEqual(vanilla.prompt, graph.prompt);
  }
});

test('directional profile selects one bounded representative per tier and no reused evidence', () => {
  const profile = directionalProfile();
  assert.deepEqual(profile.tasks.map(task => task.id), [
    'unmirror-intro-persistence',
    'meja-sync-warning',
    'unmirror-ios-camera-crash',
  ]);
  assert.deepEqual(profile.tasks.map(task => task.tier), ['easy', 'medium', 'difficult']);
  assert.deepEqual(profile.reuseReceipts, []);
  assert.equal(profile.aggregateTokenCeiling, 30_000_000);
  assert.equal(buildThreeTierSchedule(profile.tasks).length, 6);
});

test('directional evidence reports raw measurements and calibration limits', () => {
  const docs = path.join(__dirname, '..', 'docs', 'benchmarks', 'difficulty-tiers');
  const result = JSON.parse(fs.readFileSync(path.join(docs, 'TASK-059-directional-results.json'), 'utf8'));
  const report = fs.readFileSync(path.join(docs, 'TASK-059-directional-results.md'), 'utf8');
  assert.equal(result.runs.length, 6);
  assert.equal(result.aggregate.vanilla.providerTokens, 3384809);
  assert.equal(result.aggregate.efficientGraph.providerTokens, 1894419);
  assert.equal(result.aggregate.efficientGraphVersusVanilla.providerTokenDifferencePercent, -44);
  assert.equal(result.aggregate.efficientGraphVersusVanilla.wallTimeDifferencePercent, -7.3);
  assert.ok(result.runs.every(run => run.semanticReadinessPercent === 100));
  assert.match(report, /directional evidence, not a universal percentage/i);
  assert.match(report, /physical-device, provider-backed, visual, or production readiness/i);
  assert.match(report, /Cached input tokens are included/i);
});

test('shared grader scores weighted subchecks granularly and accepts semantic alternatives', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-three-tier-granular-'));
  try {
    fs.writeFileSync(path.join(directory, 'candidate.js'), 'const routeStack = []; routeStack.pop();\n');
    const definition = {criteria: [{
      id: 'navigation',
      subchecks: [
        {id: 'stack', path: '^candidate\\.js$', any: ['routeHistoryStack', 'routeStack'], weight: 90, mustPass: true},
        {id: 'pop', path: '^candidate\\.js$', any: ['\\.pop\\(', 'removePreviousRoute\\('], weight: 5, mustPass: true},
        {id: 'bounded', path: '^candidate\\.js$', any: ['\\.slice\\(', '\\.shift\\('], weight: 5, mustPass: true},
      ],
    }]};
    const ninetyFive = gradeSubchecks(directory, definition);
    assert.equal(ninetyFive.score, 95);
    assert.equal(ninetyFive.readiness, 0.95);
    assert.equal(ninetyFive.pass, false);
    fs.writeFileSync(path.join(directory, 'candidate.js'), 'const routeStack = [];\n');
    const ninety = gradeSubchecks(directory, definition);
    assert.equal(ninety.score, 90);
    assert.equal(ninety.readiness, 0.9);
    assert.equal(ninety.pass, false);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

function git(directory, args) {
  const result = spawnSync('git', ['-C', directory, ...args], {encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function makeControllerFixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-three-tier-controller-'));
  const sourceRepo = path.join(directory, 'source');
  fs.mkdirSync(sourceRepo);
  git(sourceRepo, ['init', '-q']);
  git(sourceRepo, ['config', 'user.email', 'benchmark@example.invalid']);
  git(sourceRepo, ['config', 'user.name', 'Benchmark Test']);
  fs.writeFileSync(path.join(sourceRepo, 'starting.txt'), 'start\n');
  git(sourceRepo, ['add', 'starting.txt']);
  git(sourceRepo, ['commit', '-qm', 'fixture']);
  const sourceRef = git(sourceRepo, ['rev-parse', 'HEAD']);
  const task = {
    id: 'controller-fixture',
    tier: 'easy',
    project: 'Unmirror',
    sourceRepo,
    sourceRef,
    acceptanceRefs: [sourceRef],
    grader: 'controller-fixture',
    publicFacts: {
      objective: 'Create candidate.txt with the accepted result.',
      relevantDecisions: ['Keep the source repository read-only.'],
      acceptanceCriteria: ['candidate.txt contains accepted.'],
      riskTriggers: [],
    },
  };
  const fakeCodex = path.join(directory, 'fake-codex.cjs');
  fs.writeFileSync(fakeCodex, `
const fs = require('node:fs');
const path = require('node:path');
let prompt = '';
process.stdin.on('data', chunk => { prompt += chunk; });
process.stdin.on('end', () => {
  if (/shakedown first pass/i.test(prompt)) fs.writeFileSync(path.join(process.cwd(), 'answer.txt'), 'DRAFT\\n');
  else if (/fresh delta repair/i.test(prompt) && fs.existsSync(path.join(process.cwd(), 'answer.txt'))) fs.writeFileSync(path.join(process.cwd(), 'answer.txt'), 'READY\\n');
  else if (/fresh delta repair/i.test(prompt)) fs.writeFileSync(path.join(process.cwd(), 'repaired.txt'), 'accepted\\n');
  else fs.writeFileSync(path.join(process.cwd(), 'candidate.txt'), 'accepted\\n');
  process.stdout.write(JSON.stringify({type:'thread.started',thread_id:'fake-thread'}) + '\\n');
  if (process.env.FAKE_SECRET_STATUS === '1') {
    process.stdout.write(JSON.stringify({type:'turn.progress',status:'api_key=sk-private-value'}) + '\\n');
  }
  if (process.env.FAKE_UNAUTHORITATIVE !== '1') {
    const total = Number(process.env.FAKE_TOTAL_TOKENS || 18);
    process.stdout.write(JSON.stringify({type:'turn.completed',usage:{input_tokens:Math.max(0,total-7),cached_input_tokens:2,output_tokens:Math.min(7,total),total_tokens:total}}) + '\\n');
  } else {
    process.stdout.write(JSON.stringify({type:'turn.completed'}) + '\\n');
  }
});
`);
  return {
    directory,
    sourceRepo,
    task,
    fakeCodex,
    root: path.join(directory, 'experiment'),
    experimentId: 'fb-three-tier-test',
  };
}

function controllerOptions(fixture, overrides = {}) {
  return {
    tasks: [fixture.task],
    reuseReceipts: [],
    command: process.execPath,
    commandPrefix: [fixture.fakeCodex],
    gradeCandidate(task, candidateDir) {
      const first = path.join(candidateDir, 'candidate.txt');
      const repaired = path.join(candidateDir, 'repaired.txt');
      const pass = (fs.existsSync(first) && fs.readFileSync(first, 'utf8') === 'accepted\n') ||
        (fs.existsSync(repaired) && fs.readFileSync(repaired, 'utf8') === 'accepted\n');
      return {criteria: [{id: 'candidate', pass}], passed: pass ? 1 : 0, total: 1, readiness: pass ? 1 : 0, pass};
    },
    ...overrides,
  };
}

test('controller preflight freezes equal treatment, limits, source status, and blocks spend before shakedown', async () => {
  const fixture = makeControllerFixture();
  try {
    const options = controllerOptions(fixture);
    const declaration = preflight(fixture.root, fixture.experimentId, options);
    assert.equal(declaration.passed, true);
    assert.equal(declaration.model, 'gpt-5.4');
    assert.equal(declaration.firstPassTimeoutMs, 20 * 60 * 1000);
    assert.equal(declaration.repairTimeoutMs, 10 * 60 * 1000);
    assert.equal(FIRST_PASS_TIMEOUT_MS, 20 * 60 * 1000);
    assert.equal(REPAIR_TIMEOUT_MS, 10 * 60 * 1000);
    assert.equal(AGGREGATE_TOKEN_CEILING, 60_000_000);
    assert.equal(declaration.schedule.length, 2);
    assert.ok(declaration.sourceStatus[fixture.sourceRepo].sha256);
    const treatments = declaration.schedule.map(row => JSON.parse(fs.readFileSync(
      path.join(fixture.root, 'runs', row.runId, 'treatment.json'),
      'utf8',
    )));
    assert.equal(treatments[0].publicFactsSha256, treatments[1].publicFactsSha256);
    assert.deepEqual(new Set(treatments.map(row => row.model)), new Set(['gpt-5.4']));
    assert.deepEqual(new Set(treatments.map(row => row.firstPassTimeoutMs)), new Set([FIRST_PASS_TIMEOUT_MS]));
    await assert.rejects(runAll(fixture.root, fixture.experimentId, options), /excluded shakedown/i);
    assert.equal(fs.existsSync(path.join(fixture.root, 'runs', declaration.schedule[0].runId, 'result.json')), false);
  } finally {
    fs.rmSync(fixture.directory, {recursive: true, force: true});
  }
});

test('excluded fake-Codex shakedown gates resumable immutable counted checkpoints and one fresh-delta repair', async () => {
  const fixture = makeControllerFixture();
  try {
    let grades = 0;
    const options = controllerOptions(fixture, {
      gradeCandidate(task, candidateDir) {
        grades += 1;
        const pass = fs.existsSync(path.join(candidateDir, 'repaired.txt'));
        return {criteria: [{id: 'candidate', pass}], passed: pass ? 1 : 0, total: 1, readiness: pass ? 1 : 0, pass};
      },
    });
    const declaration = preflight(fixture.root, fixture.experimentId, options);
    const shake = await shakedown(fixture.root, fixture.experimentId, options);
    assert.equal(shake.excluded, true);
    assert.equal(shake.passed, true);
    const firstRow = declaration.schedule[0];
    const [first] = await runAll(fixture.root, fixture.experimentId, {...options, runId: firstRow.runId});
    assert.equal(first.repair.contextMode, 'fresh-delta');
    assert.equal(first.firstPass.timeoutMs, FIRST_PASS_TIMEOUT_MS);
    assert.equal(first.repair.timeoutMs, REPAIR_TIMEOUT_MS);
    assert.equal(first.firstPass.usage.authoritative, true);
    assert.equal(first.repair.usage.authoritative, true);
    const checkpointFile = path.join(fixture.root, 'runs', firstRow.runId, 'result.json');
    const checkpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
    assert.equal(checkpoint.result.runId, firstRow.runId);
    assert.match(checkpoint.payloadSha256, /^[a-f0-9]{64}$/);
    assert.equal(fs.readdirSync(path.dirname(checkpointFile)).some(name => name.endsWith('.tmp')), false);

    const resumed = await runAll(fixture.root, fixture.experimentId, options);
    assert.equal(resumed.length, 1);
    await assert.rejects(runAll(fixture.root, fixture.experimentId, options), /schedule is complete/i);
    await assert.rejects(
      runAll(fixture.root, fixture.experimentId, {...options, runId: firstRow.runId}),
      /already exists/i,
    );
    assert.ok(grades >= 4);
  } finally {
    fs.rmSync(fixture.directory, {recursive: true, force: true});
  }
});

test('controller rejects privacy, source drift, unauthoritative usage, checkpoint mutation, and ceiling risk', async () => {
  const privacyFixture = makeControllerFixture();
  try {
    privacyFixture.task.publicFacts.privateReasoning = 'must never enter evidence';
    assert.throws(
      () => preflight(privacyFixture.root, privacyFixture.experimentId, controllerOptions(privacyFixture)),
      /privacy/i,
    );
  } finally {
    fs.rmSync(privacyFixture.directory, {recursive: true, force: true});
  }

  const fixture = makeControllerFixture();
  try {
    const options = controllerOptions(fixture);
    const declaration = preflight(fixture.root, fixture.experimentId, options);
    await shakedown(fixture.root, fixture.experimentId, options);
    fs.writeFileSync(path.join(fixture.sourceRepo, 'drift.txt'), 'changed\n');
    await assert.rejects(runAll(fixture.root, fixture.experimentId, options), /source status changed/i);
    fs.rmSync(path.join(fixture.sourceRepo, 'drift.txt'));

    const firstRow = declaration.schedule[0];
    await runAll(fixture.root, fixture.experimentId, {...options, runId: firstRow.runId});
    const checkpointFile = path.join(fixture.root, 'runs', firstRow.runId, 'result.json');
    const checkpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
    checkpoint.result.finalGrade.readiness = 0.25;
    fs.chmodSync(checkpointFile, 0o644);
    fs.writeFileSync(checkpointFile, `${JSON.stringify(checkpoint, null, 2)}\n`);
    await assert.rejects(runAll(fixture.root, fixture.experimentId, options), /checkpoint hash mismatch/i);
  } finally {
    fs.rmSync(fixture.directory, {recursive: true, force: true});
  }

  const usageFixture = makeControllerFixture();
  try {
    const options = controllerOptions(usageFixture, {env: {FAKE_UNAUTHORITATIVE: '1'}});
    preflight(usageFixture.root, usageFixture.experimentId, options);
    await assert.rejects(shakedown(usageFixture.root, usageFixture.experimentId, options), /authoritative usage/i);
  } finally {
    fs.rmSync(usageFixture.directory, {recursive: true, force: true});
  }

  const countedUsageFixture = makeControllerFixture();
  try {
    const options = controllerOptions(countedUsageFixture, {
      gradeCandidate(task, candidateDir) {
        const pass = fs.existsSync(path.join(candidateDir, 'repaired.txt'));
        return {criteria: [{id: 'candidate', pass}], passed: pass ? 1 : 0, total: 1, readiness: pass ? 1 : 0, pass};
      },
    });
    const declaration = preflight(countedUsageFixture.root, countedUsageFixture.experimentId, options);
    await shakedown(countedUsageFixture.root, countedUsageFixture.experimentId, options);
    const row = declaration.schedule[0];
    await assert.rejects(
      runAll(countedUsageFixture.root, countedUsageFixture.experimentId, {
        ...options,
        runId: row.runId,
        env: {FAKE_UNAUTHORITATIVE: '1'},
      }),
      /authoritative provider usage/i,
    );
    assert.equal(
      fs.existsSync(path.join(countedUsageFixture.root, 'runs', row.runId, 'fixture', 'repaired.txt')),
      false,
      'missing first-pass usage must block repair spend',
    );
  } finally {
    fs.rmSync(countedUsageFixture.directory, {recursive: true, force: true});
  }

  const ceilingFixture = makeControllerFixture();
  try {
    const options = controllerOptions(ceilingFixture, {
      aggregateTokenCeiling: 5_000_000,
      maximumProviderTokensPerRun: 5_000_001,
    });
    preflight(ceilingFixture.root, ceilingFixture.experimentId, options);
    await shakedown(ceilingFixture.root, ceilingFixture.experimentId, options);
    await assert.rejects(runAll(ceilingFixture.root, ceilingFixture.experimentId, options), /token ceiling risk/i);
  } finally {
    fs.rmSync(ceilingFixture.directory, {recursive: true, force: true});
  }
});

test('summary recomputes tier outcomes from immutable reuse receipts plus checkpoints', async () => {
  const fixture = makeControllerFixture();
  try {
    const reuseReceipts = [{
      originalResultHash: 'a'.repeat(64),
      declarationHash: 'b'.repeat(64),
      taskId: 'reused-easy',
      arm: 'vanilla',
      providerUsage: {inputTokens: 40, cachedInputTokens: 10, outputTokens: 10, totalTokens: 50, authoritative: true},
      wallTimeMs: 100,
      acceptance: false,
      readiness: 0.75,
    }, {
      originalResultHash: 'a'.repeat(64),
      declarationHash: 'b'.repeat(64),
      taskId: 'reused-easy',
      arm: 'efficient-graph',
      providerUsage: {inputTokens: 30, cachedInputTokens: 10, outputTokens: 10, totalTokens: 40, authoritative: true},
      wallTimeMs: 80,
      acceptance: true,
      readiness: 1,
    }];
    const tasks = [
      {...fixture.task},
      {id: 'reused-easy', tier: 'easy', project: 'MÉJA', reuse: 'TASK-056', sourceRef: '1234567', acceptanceRefs: ['1234568']},
    ];
    const options = controllerOptions(fixture, {tasks, reuseReceipts});
    preflight(fixture.root, fixture.experimentId, options);
    await shakedown(fixture.root, fixture.experimentId, options);
    await runAll(fixture.root, fixture.experimentId, options);
    const result = summarize(fixture.root, fixture.experimentId, options);
    assert.equal(result.sample.reusedCountedRuns, 2);
    assert.equal(result.sample.newCountedRuns, 2);
    assert.equal(result.sample.totalCountedRuns, 4);
    assert.equal(result.tiers.easy.arms.vanilla.outcomes, 2);
    assert.equal(result.tiers.easy.arms.vanilla.strictAccepted, 1);
    assert.equal(result.tiers.easy.arms.vanilla.meanReadiness, 0.875);
    assert.equal(result.tiers.easy.arms.vanilla.atLeast80Proportion, 0.5);
    assert.equal(result.tiers.easy.arms.vanilla.providerUsage.totalTokens, 68);
    assert.equal(result.tiers.easy.arms['efficient-graph'].providerUsage.totalTokens, 58);
    assert.equal(result.runs.length, 4);
    assert.equal(result.pairs.length, 2);
    assert.ok(result.tiers.easy.arms.vanilla.wallTimeRangeMs.min <= 100);
    assert.ok(result.tiers.easy.arms.vanilla.wallTimeRangeMs.max >= 100);
    assert.ok(Number.isFinite(result.tiers.easy.arms.vanilla.wallTimeMedianMs));
    assert.ok(Number.isFinite(result.tiers.easy.arms.vanilla.providerTokensMedian));
    assert.equal(result.tiers.easy.arms.vanilla.repairUsed, 0);
    assert.equal(result.tiers.easy.arms['efficient-graph'].repairUsed, 0);
    assert.equal(
      result.tiers.easy.signedDifferences.providerTokens,
      result.tiers.easy.arms['efficient-graph'].providerUsage.totalTokens -
        result.tiers.easy.arms.vanilla.providerUsage.totalTokens,
    );
    assert.ok(result.pairs.every(pair => Number.isFinite(pair.signedDifferences.providerTokens)));
  } finally {
    fs.rmSync(fixture.directory, {recursive: true, force: true});
  }
});

test('new-spend budget excludes immutable reuse receipts and rechecks reserve before repair', async () => {
  const fixture = makeControllerFixture();
  try {
    const reused = [{
      originalResultHash: 'a'.repeat(64),
      declarationHash: 'b'.repeat(64),
      taskId: 'reused-easy',
      arm: 'vanilla',
      providerUsage: {inputTokens: 900, cachedInputTokens: 0, outputTokens: 100, totalTokens: 1_000, authoritative: true},
      wallTimeMs: 1,
      acceptance: true,
      readiness: 1,
      repairUsed: false,
    }];
    const tasks = [
      {...fixture.task},
      {id: 'reused-easy', tier: 'easy', project: 'MÉJA', reuse: 'TASK-056', sourceRef: '1234567', acceptanceRefs: ['1234568']},
    ];
    const passOptions = controllerOptions(fixture, {
      tasks,
      reuseReceipts: reused,
      aggregateTokenCeiling: 20,
      maximumProviderTokensPerRun: 19,
    });
    preflight(fixture.root, fixture.experimentId, passOptions);
    await shakedown(fixture.root, fixture.experimentId, passOptions);
    const declaration = JSON.parse(fs.readFileSync(path.join(fixture.root, 'declaration.json'), 'utf8')).result;
    const [result] = await runAll(fixture.root, fixture.experimentId, {
      ...passOptions,
      runId: declaration.schedule[0].runId,
    });
    assert.equal(result.firstPass.usage.totalTokens, 18);

    const repairFixture = makeControllerFixture();
    try {
      const repairOptions = controllerOptions(repairFixture, {
        aggregateTokenCeiling: 20,
        maximumProviderTokensPerRun: 15,
        env: {FAKE_TOTAL_TOKENS: '10'},
        gradeCandidate(task, candidateDir) {
          const pass = fs.existsSync(path.join(candidateDir, 'repaired.txt'));
          return {criteria: [{id: 'candidate', pass}], passed: pass ? 1 : 0, total: 1, readiness: pass ? 1 : 0, pass};
        },
      });
      const repairDeclaration = preflight(repairFixture.root, repairFixture.experimentId, repairOptions);
      await shakedown(repairFixture.root, repairFixture.experimentId, repairOptions);
      const [bounded] = await runAll(repairFixture.root, repairFixture.experimentId, {
        ...repairOptions,
        runId: repairDeclaration.schedule[0].runId,
      });
      assert.equal(bounded.repair, null);
      assert.equal(bounded.repairSkippedReason, 'aggregate-token-ceiling');
      assert.equal(fs.existsSync(path.join(
        repairFixture.root,
        'runs',
        repairDeclaration.schedule[0].runId,
        'fixture',
        'repaired.txt',
      )), false);
    } finally {
      fs.rmSync(repairFixture.directory, {recursive: true, force: true});
    }

    const overrunFixture = makeControllerFixture();
    try {
      const overrunOptions = controllerOptions(overrunFixture, {
        aggregateTokenCeiling: 20,
        maximumProviderTokensPerRun: 19,
        env: {FAKE_TOTAL_TOKENS: '25'},
      });
      const overrunDeclaration = preflight(overrunFixture.root, overrunFixture.experimentId, overrunOptions);
      await shakedown(overrunFixture.root, overrunFixture.experimentId, overrunOptions);
      const overrunRow = overrunDeclaration.schedule[0];
      await assert.rejects(
        runAll(overrunFixture.root, overrunFixture.experimentId, {
          ...overrunOptions,
          runId: overrunRow.runId,
        }),
        /terminal token ceiling/i,
      );
      const terminal = JSON.parse(fs.readFileSync(
        path.join(overrunFixture.root, 'runs', overrunRow.runId, 'result.json'),
        'utf8',
      )).result;
      assert.equal(terminal.terminalReason, 'aggregate-token-ceiling-exceeded');
      await assert.rejects(
        runAll(overrunFixture.root, overrunFixture.experimentId, overrunOptions),
        /terminal token ceiling/i,
      );
    } finally {
      fs.rmSync(overrunFixture.directory, {recursive: true, force: true});
    }
  } finally {
    fs.rmSync(fixture.directory, {recursive: true, force: true});
  }
});

test('unauthoritative counted attempts reset cleanly and can be retried', async () => {
  const fixture = makeControllerFixture();
  try {
    const options = controllerOptions(fixture);
    const declaration = preflight(fixture.root, fixture.experimentId, options);
    await shakedown(fixture.root, fixture.experimentId, options);
    const row = declaration.schedule[0];
    await assert.rejects(
      runAll(fixture.root, fixture.experimentId, {
        ...options,
        runId: row.runId,
        env: {FAKE_UNAUTHORITATIVE: '1'},
      }),
      /authoritative provider usage/i,
    );
    assert.equal(fs.existsSync(path.join(fixture.root, 'runs', row.runId, 'result.json')), false);
    assert.equal(fs.existsSync(path.join(fixture.root, 'runs', row.runId, 'fixture', 'candidate.txt')), false);
    const [retried] = await runAll(fixture.root, fixture.experimentId, {...options, runId: row.runId});
    assert.equal(retried.firstPass.usage.authoritative, true);
  } finally {
    fs.rmSync(fixture.directory, {recursive: true, force: true});
  }
});

test('declaration and checkpoints reject schedule or identity mutation even with a recomputed envelope hash', async () => {
  const fixture = makeControllerFixture();
  try {
    const options = controllerOptions(fixture);
    const declaration = preflight(fixture.root, fixture.experimentId, options);
    await shakedown(fixture.root, fixture.experimentId, options);
    const row = declaration.schedule[0];
    await runAll(fixture.root, fixture.experimentId, {...options, runId: row.runId});

    const checkpointFile = path.join(fixture.root, 'runs', row.runId, 'result.json');
    const checkpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
    checkpoint.result.arm = checkpoint.result.arm === 'vanilla' ? 'efficient-graph' : 'vanilla';
    checkpoint.payloadSha256 = crypto.createHash('sha256')
      .update(JSON.stringify(stableForTest(checkpoint.result)))
      .digest('hex');
    fs.chmodSync(checkpointFile, 0o644);
    fs.writeFileSync(checkpointFile, `${JSON.stringify(checkpoint, null, 2)}\n`);
    await assert.rejects(runAll(fixture.root, fixture.experimentId, options), /checkpoint binding mismatch/i);

    const declarationFile = path.join(fixture.root, 'declaration.json');
    const envelope = JSON.parse(fs.readFileSync(declarationFile, 'utf8'));
    envelope.result.schedule.pop();
    envelope.result.newCountedRuns = envelope.result.schedule.length;
    envelope.payloadSha256 = crypto.createHash('sha256')
      .update(JSON.stringify(stableForTest(envelope.result)))
      .digest('hex');
    fs.chmodSync(declarationFile, 0o644);
    fs.writeFileSync(declarationFile, `${JSON.stringify(envelope, null, 2)}\n`);
    assert.throws(() => summarize(fixture.root, fixture.experimentId, options), /schedule contract/i);
  } finally {
    fs.rmSync(fixture.directory, {recursive: true, force: true});
  }
});

test('source fingerprint detects content changes to an already-dirty path', async () => {
  const fixture = makeControllerFixture();
  try {
    const dirty = path.join(fixture.sourceRepo, 'dirty.txt');
    fs.writeFileSync(dirty, 'before\n');
    const options = controllerOptions(fixture);
    preflight(fixture.root, fixture.experimentId, options);
    await shakedown(fixture.root, fixture.experimentId, options);
    fs.writeFileSync(dirty, 'after\n');
    await assert.rejects(runAll(fixture.root, fixture.experimentId, options), /source status changed/i);
  } finally {
    fs.rmSync(fixture.directory, {recursive: true, force: true});
  }
});

test('privacy export rejects sensitive string values, not only forbidden keys', async () => {
  const fixture = makeControllerFixture();
  try {
    const options = controllerOptions(fixture, {env: {FAKE_SECRET_STATUS: '1'}});
    preflight(fixture.root, fixture.experimentId, options);
    await assert.rejects(shakedown(fixture.root, fixture.experimentId, options), /privacy rejection/i);
    assert.equal(fs.existsSync(path.join(fixture.root, 'shakedown', 'result.json')), false);
  } finally {
    fs.rmSync(fixture.directory, {recursive: true, force: true});
  }
});

test('regrade scores all eight stopped-pilot candidates without modifying v1 evidence', {
  skip: !fs.existsSync('/private/tmp/fb-three-tier-059-20260729'),
}, () => {
  const pilotRoot = '/private/tmp/fb-three-tier-059-20260729';
  const before = treeHashForTest(pilotRoot);
  const result = regradeCandidates(pilotRoot);
  const after = treeHashForTest(pilotRoot);
  assert.equal(after, before);
  assert.equal(result.protocol, 'three-tier-v2');
  assert.equal(result.sourceEvidence, 'excluded-failed-pilot-v1');
  assert.equal(result.candidates.length, 8);
  assert.ok(result.candidates.every(candidate =>
    Number.isFinite(candidate.grade.score) && candidate.grade.score >= 0 && candidate.grade.score <= 100));
  assert.ok(result.candidates.some(candidate => candidate.grade.score % 25 !== 0));
  assert.ok(result.candidates.every(candidate => candidate.grade.subchecks.length > candidate.grade.criteria.length));
});

test('missing-checkpoint resume resets interrupted fixture from its frozen base', async () => {
  const fixture = makeControllerFixture();
  try {
    const options = controllerOptions(fixture);
    const declaration = preflight(fixture.root, fixture.experimentId, options);
    await shakedown(fixture.root, fixture.experimentId, options);
    const row = declaration.schedule[0];
    const interrupted = path.join(fixture.root, 'runs', row.runId, 'fixture', 'interrupted.txt');
    fs.writeFileSync(interrupted, 'partial prior invocation\n');
    const [result] = await runAll(fixture.root, fixture.experimentId, {...options, runId: row.runId});
    assert.equal(result.firstPass.usage.authoritative, true);
    assert.equal(fs.existsSync(interrupted), false);
  } finally {
    fs.rmSync(fixture.directory, {recursive: true, force: true});
  }
});

function stableForTest(value) {
  if (Array.isArray(value)) return value.map(stableForTest);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableForTest(value[key])]));
  }
  return value;
}

function treeHashForTest(root) {
  const digest = crypto.createHash('sha256');
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      digest.update(path.relative(root, absolute));
      digest.update('\0');
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) digest.update(fs.readFileSync(absolute));
      else if (entry.isSymbolicLink()) digest.update(fs.readlinkSync(absolute));
      digest.update('\0');
    }
  }
  visit(root);
  return digest.digest('hex');
}
