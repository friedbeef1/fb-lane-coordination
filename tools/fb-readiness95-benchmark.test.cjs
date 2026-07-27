'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
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

test('arm prompts preserve equivalent facts while graph alone receives a compiled packet', () => {
  const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
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

test('public contract names every hidden input field used by blocker grading', () => {
  const tech = fs.readFileSync(path.join(fixture, 'docs', 'tech.md'), 'utf8');
  assert.match(
    tech,
    /`accessAvailable: false`/,
    'environment blocking must not depend on guessing a hidden field name',
  );
});

test('grader separates readiness from blockers and requires both gates', () => {
  const result = grader.gradeFixture(fixture);
  assert.equal(result.deliverable.total, 20);
  assert.equal(result.blockers.total, 8);
  assert.equal(result.gates.readiness95, false);
  assert.equal(result.gates.blockers, false);
  assert.equal(result.pass, false);
});
