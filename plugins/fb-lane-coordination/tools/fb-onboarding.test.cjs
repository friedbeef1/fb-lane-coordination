#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

let onboarding = {};
try {
  onboarding = require('./fb-onboarding.cjs');
} catch (error) {
  // RED begins with the production module absent.
}

const REPO = '/work/projects/mirrorcam';

test('legacy four-task projects add only Discovery and Bugs', () => {
  assert.strictEqual(typeof onboarding.planMissingWorkstreams, 'function');
  const tasks = ['Product', 'FB Business', 'FB-Design', 'Tech'].map(title => ({
    title,
    projectPath: REPO,
  }));
  assert.deepStrictEqual(
    onboarding.planMissingWorkstreams(tasks, REPO).map(item => item.key),
    ['discovery', 'bugs'],
  );
});

test('current six-task projects add nothing and duplicate aliases stay idempotent', () => {
  const tasks = [
    'FB · Product/User',
    'FB Product',
    'FB · Business',
    'FB · Design',
    'FB · Tech',
    'FB · Discovery',
    'FB · Bugs',
  ].map(title => ({ title, projectPath: REPO }));
  assert.deepStrictEqual(onboarding.planMissingWorkstreams(tasks, REPO), []);
});

test('tasks from another repository never satisfy this repository onboarding', () => {
  const tasks = onboarding.WORKSTREAMS.map(item => ({
    title: item.title,
    projectPath: '/work/projects/another-app',
  }));
  assert.deepStrictEqual(
    onboarding.planMissingWorkstreams(tasks, REPO).map(item => item.key),
    ['product', 'business', 'design', 'tech', 'discovery', 'bugs'],
  );
});

test('Codex project IDs scope tasks when thread summaries omit repository paths', () => {
  const tasks = ['Product', 'Business', 'Design', 'Tech'].map(title => ({
    title,
    projectId: 'project-mirrorcam',
  }));
  tasks.push({ title: 'Discovery', projectId: 'project-other' });
  assert.deepStrictEqual(
    onboarding.planMissingWorkstreams(tasks, {
      projectId: 'project-mirrorcam',
      repositoryPath: REPO,
    }).map(item => item.key),
    ['discovery', 'bugs'],
  );
});

test('bootstrap receipt asks once and records permission clone-locally', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-'));
  try {
    const first = onboarding.ensureOnboardingReceipt(root, {
      now: new Date('2026-07-29T10:00:00Z'),
    });
    const second = onboarding.ensureOnboardingReceipt(root, {
      now: new Date('2026-07-29T11:00:00Z'),
    });
    assert.strictEqual(first.shouldPrompt, true);
    assert.strictEqual(second.shouldPrompt, false);
    assert.strictEqual(first.state.permission, 'pending');
    assert.strictEqual(second.state.promptedAt, '2026-07-29T10:00:00.000Z');

    const granted = onboarding.recordPermission(root, 'granted', {
      now: new Date('2026-07-29T12:00:00Z'),
    });
    assert.strictEqual(granted.permission, 'granted');
    assert.strictEqual(granted.decidedAt, '2026-07-29T12:00:00.000Z');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('one clone shares the permission receipt across linked worktrees', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-git-'));
  const linked = `${root}-linked`;
  const git = (cwd, args) => execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    git(root, ['init', '-q']);
    git(root, ['config', 'user.name', 'FB Test']);
    git(root, ['config', 'user.email', 'fb-test@example.invalid']);
    fs.writeFileSync(path.join(root, 'README.md'), '# Fixture\n');
    git(root, ['add', 'README.md']);
    git(root, ['commit', '-qm', 'fixture']);
    git(root, ['worktree', 'add', '-qb', 'fixture-linked', linked]);

    const first = onboarding.ensureOnboardingReceipt(root);
    const second = onboarding.ensureOnboardingReceipt(linked);
    assert.strictEqual(first.shouldPrompt, true);
    assert.strictEqual(second.shouldPrompt, false);
    assert.strictEqual(second.statePath, first.statePath);
    assert.match(first.statePath, /\.git\/fb-onboarding\.json$/);
  } finally {
    fs.rmSync(linked, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('reconciliation completes only after all six workstreams are observed', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-'));
  try {
    onboarding.ensureOnboardingReceipt(root);
    onboarding.recordPermission(root, 'granted');
    assert.throws(
      () => onboarding.recordReconciliation(root, ['product', 'business', 'design', 'tech']),
      /all six/i,
    );
    const state = onboarding.recordReconciliation(
      root,
      ['product', 'business', 'design', 'tech', 'discovery', 'bugs'],
      { now: new Date('2026-07-29T13:00:00Z') },
    );
    assert.strictEqual(state.reconciledAt, '2026-07-29T13:00:00.000Z');
    assert.deepStrictEqual(state.workstreams, [
      'product',
      'business',
      'design',
      'tech',
      'discovery',
      'bugs',
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('new task prompts remain idle and carry distinct workstream instructions', () => {
  const prompts = onboarding.WORKSTREAMS.map(item =>
    onboarding.renderIdleTaskPrompt(item, {
      repositoryName: 'MirrorCam',
      repositoryPath: REPO,
    }),
  );
  for (const prompt of prompts) {
    assert.match(prompt, /remain idle/i);
    assert.match(prompt, /do not investigate|do not edit/i);
    assert.match(prompt, /repository:\s*MirrorCam/i);
    assert.match(prompt, new RegExp(REPO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.strictEqual(new Set(prompts).size, 6);
  assert.match(prompts[0], /user outcome/i);
  assert.match(prompts[1], /commercial/i);
  assert.match(prompts[2], /experience/i);
  assert.match(prompts[3], /safely and reliably/i);
  assert.match(prompts[4], /need to learn/i);
  assert.match(prompts[5], /broken/i);
});

test('manual fallback is honest and paste-ready for only missing workstreams', () => {
  const missing = onboarding.planMissingWorkstreams([
    { title: 'Product', projectPath: REPO },
    { title: 'Business', projectPath: REPO },
    { title: 'Design', projectPath: REPO },
    { title: 'Tech', projectPath: REPO },
  ], REPO);
  const fallback = onboarding.renderManualFallback(missing, {
    repositoryName: 'MirrorCam',
    repositoryPath: REPO,
  });
  assert.match(fallback, /Codex task creation is not available/i);
  assert.match(fallback, /create.*Discovery/i);
  assert.match(fallback, /create.*Bugs/i);
  assert.doesNotMatch(fallback, /create.*Product\/User/i);
  assert.match(fallback, /paste/i);
});

test('BFM fails safely when Codex cannot prove a complete repository task inventory', () => {
  const skill = fs.readFileSync(path.join(__dirname, '..', 'skills', 'bfm', 'SKILL.md'), 'utf8');
  assert.match(skill, /exact project ID or repository path/i);
  assert.match(skill, /search\s+argument is rejected, retry without it/i);
  assert.match(skill, /inventory is\s+truncated or cannot be proved complete/i);
  assert.match(skill, /never guess that a workstream is missing/i);
  assert.match(skill, /provide all six prompts/i);
});

test('CLI emits canonical idle prompts and rejects unknown workstreams', () => {
  const tool = path.join(__dirname, 'fb-onboarding.cjs');
  const prompt = spawnSync(process.execPath, [tool, 'prompt', 'discovery', REPO], {
    encoding: 'utf8',
  });
  assert.strictEqual(prompt.status, 0, prompt.stderr);
  assert.match(prompt.stdout, /FB · Discovery/);
  assert.match(prompt.stdout, /remain idle/i);
  assert.match(prompt.stdout, /What do we still need to learn/i);

  const invalid = spawnSync(process.execPath, [tool, 'prompt', 'sales', REPO], {
    encoding: 'utf8',
  });
  assert.notStrictEqual(invalid.status, 0);
  assert.match(invalid.stderr, /unknown workstream/i);
});

test('$bfm remains canonical while slash-bfm is recognized as user intent', () => {
  assert.strictEqual(onboarding.isBfmIntent('$bfm'), true);
  assert.strictEqual(onboarding.isBfmIntent('/bfm'), true);
  assert.strictEqual(onboarding.isBfmIntent('Please run /BFM now'), true);
  assert.strictEqual(onboarding.isBfmIntent('document the letters bfm'), false);
});

test('fresh bootstrap prints the permission question once across reruns', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-onboarding-bootstrap-'));
  try {
    fs.writeFileSync(path.join(root, '.gitignore'), '# project rules\n', 'utf8');
    const cli = path.join(__dirname, 'fb-lane.cjs');
    const first = spawnSync(process.execPath, [cli, 'bootstrap'], {
      cwd: root,
      encoding: 'utf8',
    });
    const second = spawnSync(process.execPath, [cli, 'bootstrap'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.strictEqual(first.status, 0, first.stderr);
    assert.strictEqual(second.status, 0, second.stderr);
    assert.match(first.stdout, /Meet FB[\s\S]*May I create six repository-scoped sidebar tasks/i);
    assert.doesNotMatch(second.stdout, /May I create six repository-scoped sidebar tasks/i);
    assert.match(fs.readFileSync(path.join(root, '.gitignore'), 'utf8'), /^\.fb\/onboarding\.json$/m);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('first-run guidance creates, pins, verifies, and only then reconciles workstream tasks', () => {
  const containingRoot = path.resolve(__dirname, '..');
  const packaged = path.basename(containingRoot) === 'fb-lane-coordination'
    && path.basename(path.dirname(containingRoot)) === 'plugins';
  const root = containingRoot;
  const bfm = fs.readFileSync(path.join(root, 'skills/bfm/SKILL.md'), 'utf8');
  const setup = fs.readFileSync(path.join(root, 'skills/project-coordination-setup/SKILL.md'), 'utf8');
  const start = fs.readFileSync(path.join(root, 'docs/fb/start.md'), 'utf8');
  const metadata = fs.readFileSync(path.join(root, packaged ? '.codex-plugin/plugin.json' : 'plugins/fb-lane-coordination/.codex-plugin/plugin.json'), 'utf8');
  for (const [label, source] of [['BFM', bfm], ['setup', setup], ['start', start], ['metadata', metadata]]) {
    assert.match(source, /pin/i, `${label} must require pinned workstream tasks`);
    assert.match(source, /sidebar/i, `${label} must connect pinning to sidebar visibility`);
  }
  assert.match(bfm, /set_thread_pinned/);
  assert.match(bfm, /verify all six[\s\S]*pinned/i);
  assert.match(bfm, /unpinned[\s\S]*rather than creating a duplicate/i);
  assert.ok(bfm.indexOf('verify all six') < bfm.indexOf('fb-onboarding.cjs reconcile'));
});
