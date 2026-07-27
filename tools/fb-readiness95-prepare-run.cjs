#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

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

function sha256(filePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex');
}

function publicFactHash(files, directory = fixture) {
  const hash = crypto.createHash('sha256');
  for (const relativePath of files) {
    hash.update(relativePath);
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(directory, relativePath)));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function assertEqual(actual, expected, name) {
  if (actual !== expected) {
    throw new Error(`${name} hash mismatch: expected ${expected}, got ${actual}`);
  }
}

function verifyFreeze(prompts, freeze) {
  assertEqual(
    publicFactHash(prompts.publicFactFiles),
    freeze.hashes.publicFacts,
    'public facts',
  );
  assertEqual(
    sha256(path.join(__dirname, 'fb-readiness95-grader.cjs')),
    freeze.hashes.grader,
    'grader',
  );
  assertEqual(
    sha256(path.join(__dirname, 'fixtures', 'fb-readiness95-hidden-contract.json')),
    freeze.hashes.hiddenContract,
    'hidden contract',
  );
  assertEqual(sha256(promptsPath), freeze.hashes.prompts, 'prompts');
  assertEqual(
    sha256(path.join(fixture, 'src', 'release-candidate.cjs')),
    freeze.hashes.startingCandidate,
    'starting candidate',
  );
  assertEqual(
    sha256(path.join(fixture, 'test', 'public.test.cjs')),
    freeze.hashes.publicTest,
    'public test',
  );
  assertEqual(
    sha256(path.join(fixture, 'tools', 'run-public-test-once.cjs')),
    freeze.hashes.recordedTestRunner,
    'recorded test runner',
  );
  assertEqual(
    sha256(path.join(fixture, 'package.json')),
    freeze.hashes.packageManifest,
    'package manifest',
  );
}

function prepareRun(arm, repetition, target) {
  const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
  const freeze = JSON.parse(fs.readFileSync(freezePath, 'utf8'));
  if (!Object.hasOwn(prompts.arms, arm)) {
    throw new Error(`Unknown arm: ${arm}`);
  }
  if (!Number.isInteger(repetition) || repetition < 1 || repetition > 3) {
    throw new Error(`Invalid repetition: ${repetition}`);
  }
  if (fs.existsSync(target)) {
    throw new Error(`Target already exists: ${target}`);
  }
  verifyFreeze(prompts, freeze);

  fs.cpSync(fixture, target, { recursive: true, errorOnExist: true });
  const treatment = prompts.arms[arm];
  const receipt = {
    schemaVersion: 'fb-readiness95-treatment-v1',
    experimentId: freeze.experimentId,
    arm,
    repetition,
    publicFactHash: treatment.publicFactHash,
    promptsSha256: freeze.hashes.prompts,
    commonInstruction: prompts.commonInstruction,
    treatmentInstruction: treatment.treatmentInstruction,
    graphPacket: treatment.graphPacket,
    firstCandidateOnly: treatment.firstCandidateOnly,
    repairAllowed: treatment.repairAllowed,
    outsideAccessAllowed: treatment.outsideAccessAllowed,
    publicTestCommand: 'npm run test:recorded'
  };
  const receiptPath = path.join(target, '.benchmark-treatment.json');
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  const preflight = {
    schemaVersion: 'fb-readiness95-preflight-v1',
    generatedAt: new Date().toISOString(),
    startingCandidateSha256: sha256(
      path.join(target, 'src', 'release-candidate.cjs'),
    ),
    publicFactsSha256: publicFactHash(prompts.publicFactFiles, target),
    publicTestSha256: sha256(path.join(target, 'test', 'public.test.cjs')),
    recordedTestRunnerSha256: sha256(
      path.join(target, 'tools', 'run-public-test-once.cjs'),
    ),
    packageManifestSha256: sha256(path.join(target, 'package.json')),
    treatmentReceiptSha256: sha256(receiptPath)
  };
  fs.writeFileSync(
    path.join(target, '.benchmark-preflight.json'),
    `${JSON.stringify(preflight, null, 2)}\n`,
  );
  return { target, treatmentReceiptSha256: preflight.treatmentReceiptSha256 };
}

if (require.main === module) {
  try {
    const arm = process.argv[2];
    const repetition = Number(process.argv[3]);
    const target = path.resolve(process.argv[4] || '');
    process.stdout.write(`${JSON.stringify(prepareRun(arm, repetition, target))}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { prepareRun, publicFactHash, verifyFreeze };
