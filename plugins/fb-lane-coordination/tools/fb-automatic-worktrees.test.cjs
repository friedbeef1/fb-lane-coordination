#!/usr/bin/env node
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { removeMergedWorktree, selectTaskBranch } = require('./fb-lane.cjs');

const root = path.resolve(__dirname, '..');
const packaged = path.join(root, 'plugins', 'fb-lane-coordination');

function read(base, relative) {
  return fs.readFileSync(path.join(base, relative), 'utf8');
}

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function worktreeFixture(label) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), `fb-worktree-${label}-`));
  const repo = path.join(parent, 'repo');
  const worktree = path.join(parent, 'worker');
  const branch = `tech/TASK-${label}-worker`;
  fs.mkdirSync(repo);
  git(repo, ['init', '-q', '-b', 'main']);
  git(repo, ['config', 'user.email', 'fb-test@example.com']);
  git(repo, ['config', 'user.name', 'FB Test']);
  fs.writeFileSync(path.join(repo, 'base.txt'), 'base\n');
  git(repo, ['add', 'base.txt']);
  git(repo, ['commit', '-qm', 'base']);
  git(repo, ['worktree', 'add', '-q', '-b', branch, worktree]);
  fs.writeFileSync(path.join(worktree, 'candidate.txt'), `${label}\n`);
  git(worktree, ['add', 'candidate.txt']);
  git(worktree, ['commit', '-qm', `candidate ${label}`]);
  return {
    parent,
    repo,
    worktree,
    branch,
    merge() {
      git(repo, ['merge', '--no-ff', '-qm', `merge ${label}`, branch]);
    },
    cleanup() {
      try { git(repo, ['worktree', 'remove', '--force', worktree]); } catch {}
      fs.rmSync(parent, { recursive: true, force: true });
    },
  };
}

function mergeCliFixture(label) {
  const fixture = worktreeFixture(label);
  const bare = path.join(fixture.parent, 'remote.git');
  git(fixture.parent, ['init', '--bare', '-q', bare]);
  git(fixture.repo, ['remote', 'add', 'origin', bare]);

  const board = [
    '# Project Board',
    '',
    '## Active Workstreams',
    '',
    '| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |',
    '|---|---|---|---|---|---|---|',
    `| TASK-${label} | In Progress | FB-Tech | Test | Worker cleanup | \`candidate.txt\` | Test fixture |`,
    '',
    `### TASK-${label} - Worker cleanup`,
    '',
    '* **Status**: In Progress',
    '* **Owner / Thread**: FB-Tech',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(fixture.repo, 'PROJECT_BOARD.md'), board);
  git(fixture.repo, ['add', 'PROJECT_BOARD.md']);
  git(fixture.repo, ['commit', '-qm', `add TASK-${label}`]);
  git(fixture.repo, ['push', '-qu', 'origin', 'main']);
  return fixture;
}

function runCli(cwd, args) {
  return spawnSync(process.execPath, [path.join(root, 'tools', 'fb-lane.cjs'), ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function assertAutomaticContract(base, label) {
  const workflow = read(base, 'docs/fb/workflow.md');
  const bfm = read(base, 'skills/bfm/SKILL.md');
  const coordination = read(base, 'skills/fb-lane-coordination/SKILL.md');
  const cli = read(base, 'tools/fb-lane.cjs');

  for (const source of [workflow, bfm]) {
    assert.match(source, /BFM must automatically (?:create or reuse|allocate)[\s\S]{0,240}linked\s+worktree/i, `${label} must make allocation mandatory`);
    assert.match(source, /(?:fb_lane_claim|node tools\/fb-lane\.cjs claim)/, `${label} must name the executable claim path`);
    assert.match(source, /every\s+independent,\s+non-overlapping\s+source-changing\s+slice/i, `${label} must define eligible slices`);
    assert.match(source, /planning-only[\s\S]{0,180}(?:does not|must not|no)[\s\S]{0,100}worktree/i, `${label} must avoid planning-only worktrees`);
    assert.match(source, /dependent[\s\S]{0,100}overlapping[\s\S]{0,160}sequential/i, `${label} must keep unsafe slices sequential`);
    assert.match(source, /must not ask the user[\s\S]{0,120}(?:create|choose|organize|manage)[\s\S]{0,80}worktree/i, `${label} must own worktree setup`);
    assert.match(source, /slice[\s/]+branch[\s/]+worktree (?:map|mapping)/i, `${label} must expose the integration map`);
    assert.match(source, /unique\s+approved\s+child\s+task\s+ID/i, `${label} must prevent multiple slices sharing one claim identity`);
    assert.match(source, /claims?\s+one\s+at\s+a\s+time[\s\S]{0,120}primary\s+checkout/i, `${label} must serialize authoritative claim mutations`);
    assert.match(source, /after\s+all\s+claims[\s\S]{0,120}(?:start|run)[\s\S]{0,80}(?:workers|agents)[\s\S]{0,80}concurrent/i, `${label} must separate serial allocation from concurrent execution`);
    assert.match(source, /cleanup[\s\S]{0,240}dirty[\s\S]{0,160}owner[\s\S]{0,100}next action/i, `${label} must retain unsafe worktrees with ownership`);
  }

  assert.match(coordination, /workflow\.md[\s\S]{0,180}worktrees/i, `${label} coordination must route worktree behavior to the canonical workflow`);

  assert.match(cli, /worktree:\s*!noWorktree/, `${label} CLI claim must default to worktrees`);
  assert.match(cli, /resolveWorktreePlan\(records, branchName\)/, `${label} CLI must create or reuse from registered worktrees`);
  assert.match(cli, /Reusing matching worktree/, `${label} CLI must report exact-match reuse`);
}

test('root and packaged BFM require automatic linked-worktree allocation', () => {
  assertAutomaticContract(root, 'root');
  assertAutomaticContract(packaged, 'package');
});

test('public docs explain that FB owns implementation worktree setup', () => {
  const readme = read(root, 'README.md');
  assert.match(readme, /After `?\$bfm`?[\s\S]{0,120}automatically creates or[\s\S]{0,40}reuses[\s\S]{0,160}worktree/i);
  assert.match(readme, /You\s+do not need to create, choose, or organize implementation worktrees/i);
  assert.match(readme, /Planning-only workstreams do not receive worktrees/i);
});

test('declared package copies remain byte-identical', () => {
  for (const relative of [
    'docs/fb/workflow.md',
    'skills/bfm/SKILL.md',
    'skills/fb-lane-coordination/SKILL.md',
    'tools/fb-automatic-worktrees.test.cjs',
  ]) {
    assert.deepStrictEqual(
      fs.readFileSync(path.join(root, relative)),
      fs.readFileSync(path.join(packaged, relative)),
      relative,
    );
  }
});

test('successful integration removes the clean merged worktree but retains the branch for durable closeout', () => {
  const fixture = worktreeFixture('580');
  try {
    fixture.merge();
    const canonicalWorktree = fs.realpathSync(fixture.worktree);
    const result = removeMergedWorktree(fixture.repo, fixture.branch);
    assert.deepStrictEqual(result, {
      status: 'removed',
      branch: fixture.branch,
      worktree: canonicalWorktree,
    });
    assert.ok(!fs.existsSync(fixture.worktree));
    assert.doesNotMatch(git(fixture.repo, ['worktree', 'list', '--porcelain']), new RegExp(fixture.branch));
    assert.strictEqual(git(fixture.repo, ['branch', '--list', fixture.branch]).replace(/^\*\s*/, ''), fixture.branch);
  } finally {
    fixture.cleanup();
  }
});

test('dirty merged worktrees are retained with an actionable cleanup error', () => {
  const fixture = worktreeFixture('581');
  try {
    fixture.merge();
    fs.writeFileSync(path.join(fixture.worktree, 'uncommitted.txt'), 'retain me\n');
    assert.throws(
      () => removeMergedWorktree(fixture.repo, fixture.branch),
      /dirty[\s\S]*owner[\s\S]*next action/i,
    );
    assert.ok(fs.existsSync(fixture.worktree));
    assert.match(git(fixture.repo, ['worktree', 'list', '--porcelain']), new RegExp(fixture.branch));
  } finally {
    fixture.cleanup();
  }
});

test('unmerged worktrees are retained and cannot be cleaned as completed work', () => {
  const fixture = worktreeFixture('582');
  try {
    assert.throws(
      () => removeMergedWorktree(fixture.repo, fixture.branch),
      /not merged[\s\S]*retain/i,
    );
    assert.ok(fs.existsSync(fixture.worktree));
  } finally {
    fixture.cleanup();
  }
});

test('missing registered worktree paths fail closed without pruning unrelated metadata', () => {
  const fixture = worktreeFixture('583');
  try {
    fixture.merge();
    fs.rmSync(fixture.worktree, { recursive: true, force: true });
    assert.throws(
      () => removeMergedWorktree(fixture.repo, fixture.branch),
      /registered worktree path is missing[\s\S]*prune/i,
    );
    assert.match(git(fixture.repo, ['worktree', 'list', '--porcelain']), new RegExp(fixture.branch));
  } finally {
    fixture.cleanup();
  }
});

test('cleanup never removes the primary checkout', () => {
  const fixture = worktreeFixture('584');
  try {
    assert.throws(
      () => removeMergedWorktree(fixture.repo, 'main'),
      /primary checkout/i,
    );
    assert.ok(fs.existsSync(fixture.repo));
  } finally {
    fixture.cleanup();
  }
});

test('branch selection requires an exact task token and rejects ambiguous task branches', () => {
  assert.strictEqual(
    selectTaskBranch(
      ['tech/TASK-0580-wrong', 'tech/TASK-058-right', 'tech/TASK-059-other'],
      'TASK-058',
    ),
    'tech/TASK-058-right',
  );
  assert.throws(
    () => selectTaskBranch(
      ['tech/TASK-058-first', 'product/TASK-058-second'],
      'TASK-058',
    ),
    /Multiple branches match TASK-058[\s\S]*choose the intended branch explicitly/i,
  );
});

test('merge CLI runs from primary, removes the integrated worktree, and releases the task only afterward', () => {
  const fixture = mergeCliFixture('585');
  try {
    const result = runCli(fixture.repo, ['merge', 'TASK-585']);
    assert.strictEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /Worktree cleanup: removed/i);
    assert.ok(!fs.existsSync(fixture.worktree));
    assert.doesNotMatch(git(fixture.repo, ['worktree', 'list', '--porcelain']), /TASK-585/);
    assert.strictEqual(git(fixture.repo, ['branch', '--list', fixture.branch]), '');
    const board = fs.readFileSync(path.join(fixture.repo, 'PROJECT_BOARD.md'), 'utf8');
    assert.match(board, /\| TASK-585 \| Done \|/);
    assert.match(board, /\| \(None\) \| Test fixture \|/);
    assert.strictEqual(git(fixture.repo, ['rev-parse', 'HEAD']), git(fixture.parent, ['--git-dir', path.join(fixture.parent, 'remote.git'), 'rev-parse', 'main']));
  } finally {
    fixture.cleanup();
  }
});

test('merge CLI refuses worker-checkout integration before changing main or cleanup state', () => {
  const fixture = mergeCliFixture('586');
  try {
    const mainBefore = git(fixture.repo, ['rev-parse', 'HEAD']);
    const result = runCli(fixture.worktree, ['merge', 'TASK-586']);
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /Run FB merge from the primary checkout/i);
    assert.strictEqual(git(fixture.repo, ['rev-parse', 'HEAD']), mainBefore);
    assert.ok(fs.existsSync(fixture.worktree));
    assert.match(git(fixture.repo, ['worktree', 'list', '--porcelain']), /TASK-586/);
  } finally {
    fixture.cleanup();
  }
});
