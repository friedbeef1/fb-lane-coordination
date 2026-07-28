#!/usr/bin/env node
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packaged = path.join(root, 'plugins', 'fb-lane-coordination');

function read(base, relative) {
  return fs.readFileSync(path.join(base, relative), 'utf8');
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
  }

  assert.match(coordination, /automatic worktree allocation/i, `${label} coordination must route to the canonical behavior`);
  assert.match(coordination, /must not ask the user[\s\S]{0,120}worktree/i, `${label} coordination must retain user ownership boundary`);

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
