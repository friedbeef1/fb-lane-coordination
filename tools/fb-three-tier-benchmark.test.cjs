const test = require('node:test');
const assert = require('node:assert/strict');
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
  for (const task of tasks.filter(task => task.reuse === 'TASK-056')) {
    assert.match(task.sourceRef, /^[a-f0-9]{7,40}$/);
    assert.ok(Array.isArray(task.acceptanceRefs) && task.acceptanceRefs.length > 0);
    task.acceptanceRefs.forEach(ref => assert.match(ref, /^[a-f0-9]{7,40}$/));
  }
});

test('TASK-056 receipt reuse is an exact immutable projection of the frozen study', () => {
  const receipts = buildReuseReceipts();
  assert.equal(receipts.length, 12);
  assert.equal(new Set(receipts.map(receipt => `${receipt.taskId}:${receipt.arm}`)).size, 12);
  for (const receipt of receipts) {
    assert.equal(receipt.originalResultHash, 'eac1d3b10318efdee46b1c6181037d86a01457dd6cffcbc02367db24ff1734df');
    assert.equal(receipt.declarationHash, 'a8dd4eca5ab3b77e9790d40c4068722c10bd8c7fbe7406ea2a592b628e1b6897');
    assert.match(receipt.taskId, /^(unmirror-intro|unmirror-saved-capture|unmirror-native-analytics|meja-scroll|meja-pairing|meja-redesign)$/);
    assert.match(receipt.arm, /^(vanilla|efficient-graph)$/);
    assert.equal(receipt.providerUsage.authoritative, true);
    assert.equal(typeof receipt.providerUsage.totalTokens, 'number');
    assert.equal(typeof receipt.wallTimeMs, 'number');
    assert.equal(typeof receipt.acceptance, 'boolean');
    assert.equal(typeof receipt.readiness, 'number');
  }
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
