const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {
  loadTierRegistry,
  buildReuseReceipts,
  buildThreeTierSchedule,
} = require('./fb-three-tier-benchmark.cjs');

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
