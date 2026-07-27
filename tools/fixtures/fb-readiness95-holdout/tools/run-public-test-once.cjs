#!/usr/bin/env node
'use strict';

const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const evidencePath = path.join(root, '.benchmark-public-test-evidence.json');
const candidatePath = path.join(root, 'src', 'release-candidate.cjs');
const treatmentPath = path.join(root, '.benchmark-treatment.json');

function sha256(filePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex');
}

if (fs.existsSync(evidencePath)) {
  process.stderr.write('Public test has already been recorded for this run.\n');
  process.exit(2);
}

if (!fs.existsSync(treatmentPath)) {
  process.stderr.write('Missing .benchmark-treatment.json receipt.\n');
  process.exit(2);
}

const candidateSha256Before = sha256(candidatePath);
const startedAt = new Date().toISOString();
const startedNs = process.hrtime.bigint();
const environment = { ...process.env };
delete environment.NODE_TEST_CONTEXT;
const command = childProcess.spawnSync(
  process.execPath,
  ['--test', 'test/public.test.cjs'],
  { cwd: root, encoding: 'utf8', env: environment },
);
const durationNs = process.hrtime.bigint() - startedNs;
const candidateSha256After = sha256(candidatePath);
const exitCode = command.status ?? 1;
const evidence = {
  schemaVersion: 'fb-readiness95-public-test-v1',
  command: 'node --test test/public.test.cjs',
  startedAt,
  durationNs: durationNs.toString(),
  exitCode,
  stdout: command.stdout || '',
  stderr: command.stderr || '',
  candidateSha256Before,
  candidateSha256After,
  candidateChangedDuringTest:
    candidateSha256Before !== candidateSha256After,
  treatmentReceiptSha256: sha256(treatmentPath),
};
const temporaryPath = `${evidencePath}.${process.pid}.tmp`;
fs.writeFileSync(temporaryPath, `${JSON.stringify(evidence, null, 2)}\n`);
fs.renameSync(temporaryPath, evidencePath);

process.stdout.write(evidence.stdout);
process.stderr.write(evidence.stderr);
process.exit(exitCode);
