const test = require('node:test');
const assert = require('node:assert/strict');
const {
  schedule,
  compileEfficientTreatment,
  createFailurePacket,
  repairCommandArgs,
  repairPrompt,
} = require('./fb-repair-efficiency-benchmark.cjs');
const {loadTaskRegistry} = require('./fb-real-work-benchmark-lib.cjs');
const {compilePublicFacts} = require('./fb-real-work-context.cjs');

test('freezes six paired Vanilla and efficient Graph runs once', () => {
  const rows = schedule();
  assert.equal(rows.length, 12);
  assert.equal(new Set(rows.map(row => row.runId)).size, 12);
  assert.deepEqual(rows.slice(0, 4).map(row => row.arm), [
    'vanilla', 'efficient-graph', 'efficient-graph', 'vanilla',
  ]);
});

test('efficient Graph uses the same public facts with bounded slices', () => {
  for (const task of loadTaskRegistry()) {
    const facts = compilePublicFacts(task);
    const vanilla = compileEfficientTreatment('vanilla', facts, task);
    const graph = compileEfficientTreatment('efficient-graph', facts, task);
    assert.equal(vanilla.publicFactsSha256, graph.publicFactsSha256);
    assert.equal(vanilla.graphPacket, null);
    assert.ok(graph.graphPacket.executionSlices.length >= 1);
    assert.match(graph.prompt, /bounded execution slices/i);
    assert.doesNotMatch(graph.prompt, /hidden grader|acceptanceCommits/i);
  }
});

test('failure packet exposes only failed public criteria and candidate delta', () => {
  const packet = createFailurePacket('meja-pairing', {
    criteria: [
      {id:'continuation', pass:false, evidence:[]},
      {id:'subscription-gate', pass:true, evidence:['src/app.js']},
    ],
    readiness:0.5,
    pass:false,
  }, {
    candidateSha:'abc1234',
    changedPaths:['src/app.js', 'tests/pairing.test.js'],
    proofOutput:'FAIL continuation',
  });
  assert.equal(packet.action, 'repair');
  assert.deepEqual(packet.failedCriteria.map(row => row.id), ['continuation']);
  assert.deepEqual(packet.changedPaths, ['src/app.js', 'tests/pairing.test.js']);
  assert.doesNotMatch(JSON.stringify(packet), /subscription-gate|transcript|rawRecords|conversation history/i);
});

test('efficient repair is a fresh task and cannot resume accumulated context', () => {
  const args = repairCommandArgs('/tmp/fixture');
  assert.deepEqual(args.slice(0, 2), ['exec', '--json']);
  assert.equal(args.includes('resume'), false);
  const prompt = repairPrompt({
    action:'repair',
    contextMode:'fresh-delta',
    objective:'Fix continuation.',
    candidateRef:'abc1234',
    changedPaths:['src/app.js'],
    failedCriteria:[{id:'continuation',expected:'Preserve the exact session.',observed:'Failed.'}],
    relevantDecisions:['Keep the exact session.'],
    proofOutput:'FAIL continuation',
    correction:'Correct only continuation state transfer.',
    repairLimit:1,
    rerun:'failed proof only',
  });
  assert.match(prompt, /fresh delta repair/i);
  assert.match(prompt, /failed criterion: continuation/i);
  assert.doesNotMatch(prompt, /transcript|conversation history|all acceptance/i);
});
