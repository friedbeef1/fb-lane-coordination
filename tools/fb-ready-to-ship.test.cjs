#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  performAutomatedSubmission,
  formatAutomatedSubmission,
  resolveSubmissionSafetyGate,
} = require('./fb-lane.cjs');

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

check('--no-tests fails before workspace mutation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-ready-'));
  const marker = path.join(root, 'marker.txt');
  fs.writeFileSync(marker, 'unchanged\n');
  assert.throws(() => performAutomatedSubmission({
    workspaceRoot: root,
    taskId: 'TASK-001',
    bypassRequested: true,
    transport: 'cli',
  }), /Automated checks are required before Ready to ship/);
  assert.strictEqual(fs.readFileSync(marker, 'utf8'), 'unchanged\n');
  assert.deepStrictEqual(fs.readdirSync(root), ['marker.txt']);
  fs.rmSync(root, { recursive: true, force: true });
});

check('CLI and MCP share one submission pipeline and never consume live approval', () => {
  const source = fs.readFileSync(path.join(__dirname, 'fb-lane.cjs'), 'utf8');
  assert.match(source, /performAutomatedSubmission\(\{ workspaceRoot, taskId, optionalReviewUrl: stagingUrl, bypassRequested: options\.bypassRequested, transport: 'cli' \}\)/);
  assert.match(source, /performAutomatedSubmission\(\{ workspaceRoot, taskId, optionalReviewUrl: stagingUrl, bypassRequested: false, transport: 'mcp' \}\)/);
  const body = source.slice(source.indexOf('function performAutomatedSubmission'), source.indexOf('function handleSubmit'));
  assert.ok(body.indexOf('execFileSync(check.command, check.args') < body.indexOf('updateBoardTask('));
  assert.doesNotMatch(body, /handleMerge|deploy|publish|Push Live.*===|push live.*===/i);
});

check('passed candidate renders optional links, Ready to ship, and exact prompt', () => {
  const output = formatAutomatedSubmission({
    status: 'Ready to ship',
    candidateCommit: '0123456789abcdef0123456789abcdef01234567',
    checks: [{ id: 'project-test', result: 'passed' }],
    checkManifest: [{ command: 'npm', args: ['test'] }],
    optionalLinks: ['https://example.com/review'],
    prompt: 'Automated checks passed. Optional review links are available above.\nSay **Push Live** to deploy.',
  });
  assert.match(output, /System verification: passed/);
  assert.match(output, /Optional review links:\n- https:\/\/example\.com\/review/);
  assert.match(output, /Ready to ship\nAutomated checks passed\. Optional review links are available above\.\nSay \*\*Push Live\*\* to deploy\.$/);
});

check('sensitive candidates require candidate-bound approval evidence', () => {
  const candidateCommit = '0123456789abcdef0123456789abcdef01234567';
  const changedPaths = ['auth/config.js'];
  assert.deepStrictEqual(resolveSubmissionSafetyGate({ candidateCommit, changedPaths, session: {} }), {
    result: 'unresolved', approvalRef: '',
  });
  assert.deepStrictEqual(resolveSubmissionSafetyGate({
    candidateCommit,
    changedPaths,
    session: { automatedVerification: {
      candidateCommit,
      changedPaths,
      safetyGate: { result: 'passed', approvalRef: 'APPROVAL-001' },
    } },
  }), { result: 'passed', approvalRef: 'APPROVAL-001' });
});

check('canonical SOP requires visible progress and the simple finish flow', () => {
  const guardrails = fs.readFileSync(path.join(__dirname, '..', 'docs', 'fb', 'guardrails.md'), 'utf8');
  const workflow = fs.readFileSync(path.join(__dirname, '..', 'docs', 'fb', 'workflow.md'), 'utf8');
  assert.match(guardrails, /at least every 60\s+seconds/i);
  assert.match(guardrails, /two minutes.*exact\s+failing check, blocker, or current gate/is);
  for (const phrase of ['Optional review links', 'Ready to ship', 'Say **Push Live** to deploy.', 'does not merge, deploy, publish']) {
    assert.ok(workflow.includes(phrase), `missing workflow phrase: ${phrase}`);
  }
});

console.log(`\n✅ ${passed} focused ready-to-ship checks passed.`);
