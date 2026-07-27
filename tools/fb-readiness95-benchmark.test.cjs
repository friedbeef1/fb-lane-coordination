'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const fixture = path.join(__dirname, 'fixtures', 'fb-readiness95-holdout');
const promptsPath = path.join(
  root,
  'docs',
  'benchmarks',
  'control-loop',
  'readiness95-prompts.json',
);
const freezePath = path.join(
  root,
  'docs',
  'benchmarks',
  'control-loop',
  'readiness95-frozen-declaration.json',
);
const resultsPath = path.join(
  root,
  'docs',
  'benchmarks',
  'control-loop',
  'readiness95-v2-results.json',
);
const prepareRunnerPath = path.join(
  __dirname,
  'fb-readiness95-prepare-run.cjs',
);
const grader = require('./fb-readiness95-grader.cjs');

function hashPublicFacts(files) {
  const hash = crypto.createHash('sha256');
  for (const relativePath of files) {
    hash.update(relativePath);
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(fixture, relativePath)));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function hashFile(filePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex');
}

test('freezes 20 deliverable criteria and 8 independent blocker gates', () => {
  const contract = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, 'fixtures', 'fb-readiness95-hidden-contract.json'),
      'utf8',
    ),
  );
  assert.equal(contract.deliverableCriteria.length, 20);
  assert.equal(contract.blockerCriteria.length, 8);
  assert.equal(new Set(contract.deliverableCriteria).size, 20);
  assert.equal(new Set(contract.blockerCriteria).size, 8);
  assert.equal(contract.readiness95Required, 19);
  assert.equal(contract.blockersRequired, 8);
});

test('freeze declaration binds every executable benchmark artifact', () => {
  const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
  const freeze = JSON.parse(fs.readFileSync(freezePath, 'utf8'));
  assert.equal(
    freeze.hashes.publicFacts,
    hashPublicFacts(prompts.publicFactFiles),
  );
  assert.equal(
    freeze.hashes.grader,
    hashFile(path.join(__dirname, 'fb-readiness95-grader.cjs')),
  );
  assert.equal(
    freeze.hashes.hiddenContract,
    hashFile(
      path.join(__dirname, 'fixtures', 'fb-readiness95-hidden-contract.json'),
    ),
  );
  assert.equal(freeze.hashes.prompts, hashFile(promptsPath));
  assert.equal(
    freeze.hashes.startingCandidate,
    hashFile(path.join(fixture, 'src', 'release-candidate.cjs')),
  );
  assert.equal(
    freeze.hashes.publicTest,
    hashFile(path.join(fixture, 'test', 'public.test.cjs')),
  );
  assert.equal(
    freeze.hashes.recordedTestRunner,
    hashFile(path.join(fixture, 'tools', 'run-public-test-once.cjs')),
  );
  assert.equal(
    freeze.hashes.packageManifest,
    hashFile(path.join(fixture, 'package.json')),
  );
});

test('arm prompts preserve equivalent facts while graph alone receives a compiled packet', () => {
  const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
  assert.equal(
    prompts.commonInstruction,
    'Read the public fixture, implement one first candidate, run the recorded public test command once, and stop. Choose your own agent topology.',
  );
  assert.deepEqual(Object.keys(prompts.arms).sort(), [
    'broadFb',
    'preventiveGraphFb',
    'vanilla',
  ]);
  for (const arm of Object.values(prompts.arms)) {
    assert.equal(arm.fixture, 'fb-readiness95-holdout');
    assert.equal(arm.firstCandidateOnly, true);
    assert.equal(arm.repairAllowed, false);
    assert.equal(arm.outsideAccessAllowed, false);
    assert.equal(typeof arm.treatmentInstruction, 'string');
    assert.equal(Object.hasOwn(arm, 'instruction'), false);
  }
  assert.equal(prompts.arms.vanilla.graphPacket, null);
  assert.equal(prompts.arms.broadFb.graphPacket, null);
  assert(prompts.arms.preventiveGraphFb.graphPacket);
  assert.equal(
    prompts.arms.vanilla.publicFactHash,
    hashPublicFacts(prompts.publicFactFiles),
  );
  assert.equal(prompts.arms.vanilla.publicFactHash, prompts.arms.broadFb.publicFactHash);
  assert.equal(prompts.arms.vanilla.publicFactHash, prompts.arms.preventiveGraphFb.publicFactHash);
});

test('public interface names every scored input and output field', () => {
  const schema = JSON.parse(
    fs.readFileSync(path.join(fixture, 'docs', 'interface.json'), 'utf8'),
  );
  assert.deepEqual(schema.input.required, [
    'items',
    'reviewLinks',
    'automatedChecksPassed',
  ]);
  assert.deepEqual(schema.input.itemFields, [
    'id',
    'type',
    'status',
    'scope',
    'revision',
    'decisionApproved',
    'severity',
    'reproduction',
    'observable',
    'risk',
    'safetyApproved',
    'dependsOn',
    'accessAvailable',
  ]);
  assert.deepEqual(schema.output.required, [
    'selected',
    'blocked',
    'status',
    'deploymentAuthorized',
    'designReview',
    'optionalReviewLinks',
    'userInputNeeded',
  ]);
  assert.deepEqual(schema.output.blockedRequired, [
    'id',
    'reason',
    'owner',
    'nextAction',
  ]);
  assert.equal(schema.rules.blockedItemsMustNotBeSelected, true);
});

test('grader separates readiness from blockers and requires both gates', () => {
  const result = grader.gradeFixture(fixture);
  assert.equal(result.deliverable.total, 20);
  assert.equal(result.blockers.total, 8);
  assert.equal(result.gates.readiness95, false);
  assert.equal(result.gates.blockers, false);
  assert.equal(result.pass, false);
});

test('blocker gate rejects work that is both blocked and selected', () => {
  const temporary = fs.mkdtempSync(
    path.join(require('node:os').tmpdir(), 'fb-readiness95-'),
  );
  try {
    fs.mkdirSync(path.join(temporary, 'src'));
    fs.writeFileSync(
      path.join(temporary, 'src', 'release-candidate.cjs'),
      `'use strict';
module.exports.buildCandidate = input => ({
  selected: input.items,
  blocked: input.items.map(item => ({
    ...item,
    reason: 'Blocked by the supplied condition',
    owner: 'Product',
    nextAction: 'Resolve the condition'
  })),
  status: 'Ready to ship',
  deploymentAuthorized: false,
  designReview: {
    ariaLabel: true,
    focusVisible: true,
    narrowViewportChecked: true
  },
  optionalReviewLinks: ['https://example.test/preview'],
  userInputNeeded: 'none'
});
`,
    );
    const result = grader.gradeFixture(temporary);
    assert.equal(result.gates.blockers, false);
    assert.equal(result.pass, false);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('recorded public test command runs once and preserves TAP plus hashes', () => {
  const temporary = fs.mkdtempSync(
    path.join(require('node:os').tmpdir(), 'fb-readiness95-runner-'),
  );
  try {
    fs.cpSync(fixture, temporary, { recursive: true });
    fs.writeFileSync(
      path.join(temporary, '.benchmark-treatment.json'),
      JSON.stringify({ arm: 'test', promptSha256: 'fixture' }),
    );
    const command = childProcess.spawnSync(
      process.execPath,
      ['tools/run-public-test-once.cjs'],
      { cwd: temporary, encoding: 'utf8' },
    );
    assert.equal(command.status, 1);
    const evidence = JSON.parse(
      fs.readFileSync(
        path.join(temporary, '.benchmark-public-test-evidence.json'),
        'utf8',
      ),
    );
    assert.equal(evidence.command, 'node --test test/public.test.cjs');
    assert.equal(evidence.exitCode, 1);
    assert.match(evidence.stdout, /terminal work is not selected/);
    assert.equal(
      evidence.candidateSha256Before,
      evidence.candidateSha256After,
    );
    assert.equal(evidence.candidateChangedDuringTest, false);
    assert.equal(typeof evidence.treatmentReceiptSha256, 'string');

    const repeated = childProcess.spawnSync(
      process.execPath,
      ['tools/run-public-test-once.cjs'],
      { cwd: temporary, encoding: 'utf8' },
    );
    assert.equal(repeated.status, 2);
    assert.match(repeated.stderr, /already been recorded/);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('run preparation derives immutable treatment receipts from frozen prompts', () => {
  const temporary = fs.mkdtempSync(
    path.join(require('node:os').tmpdir(), 'fb-readiness95-prepare-'),
  );
  try {
    const vanillaTarget = path.join(temporary, 'vanilla');
    const vanilla = childProcess.spawnSync(
      process.execPath,
      [prepareRunnerPath, 'vanilla', '1', vanillaTarget],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(vanilla.status, 0, vanilla.stderr);
    const receipt = JSON.parse(
      fs.readFileSync(
        path.join(vanillaTarget, '.benchmark-treatment.json'),
        'utf8',
      ),
    );
    const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
    assert.equal(receipt.commonInstruction, prompts.commonInstruction);
    assert.equal(
      receipt.treatmentInstruction,
      prompts.arms.vanilla.treatmentInstruction,
    );
    assert.equal(receipt.graphPacket, null);
    const preflight = JSON.parse(
      fs.readFileSync(
        path.join(vanillaTarget, '.benchmark-preflight.json'),
        'utf8',
      ),
    );
    assert.equal(
      preflight.treatmentReceiptSha256,
      hashFile(path.join(vanillaTarget, '.benchmark-treatment.json')),
    );
    assert.equal(
      preflight.startingCandidateSha256,
      hashFile(path.join(vanillaTarget, 'src', 'release-candidate.cjs')),
    );

    const graphTarget = path.join(temporary, 'graph');
    const graph = childProcess.spawnSync(
      process.execPath,
      [prepareRunnerPath, 'preventiveGraphFb', '1', graphTarget],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(graph.status, 0, graph.stderr);
    const graphReceipt = JSON.parse(
      fs.readFileSync(
        path.join(graphTarget, '.benchmark-treatment.json'),
        'utf8',
      ),
    );
    assert.deepEqual(
      graphReceipt.graphPacket,
      prompts.arms.preventiveGraphFb.graphPacket,
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('recorded arm pass requires all three repetitions to clear both gates', () => {
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  assert.equal(results.runs.length, 9);
  for (const arm of ['vanilla', 'broadFb', 'preventiveGraphFb']) {
    const runs = results.runs.filter(run => run.arm === arm);
    assert.equal(runs.length, 3);
    for (const run of runs) {
      assert.equal(
        run.pass,
        run.deliverablePassed >= 19 && run.blockerPassed === 8,
      );
      assert.equal(run.publicTestExit, 0);
      assert.equal(run.candidateModifiedAfterTest ?? false, false);
    }
    assert.equal(
      results.aggregates[arm].armPass,
      runs.every(run => run.pass),
    );
  }
  assert.match(results.excludedV1.reason, /accessAvailable/);
});
