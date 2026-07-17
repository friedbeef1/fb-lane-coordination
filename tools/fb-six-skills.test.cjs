'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relative) {
  let target = path.join(root, relative);
  const packagePrefix = 'plugins/fb-lane-coordination/';
  if (!fs.existsSync(target) && relative.startsWith(packagePrefix)) {
    target = path.join(root, relative.slice(packagePrefix.length));
  }
  return fs.readFileSync(target, 'utf8');
}

function assertDiscoverySkill() {
  const skill = read('plugins/fb-lane-coordination/skills/fb-discovery/SKILL.md');
  assert.match(skill, /reduces uncertainty[\s\S]{0,220}planning\/evidence[\s\S]{0,220}smallest decision-changing unknown/i);
  assert.match(skill, /must not implement source, present speculation as evidence, or set[\s\S]{0,40}final Product priority/i);
  assert.match(skill, /Research the smallest decision-changing unknown[\s\S]*Gather the smallest useful research, experiment, competitor, opportunity, or[\s\S]*Compare evidence[\s\S]*Create or update `docs\/handoffs\/<TASK-ID>\.md`/i);
  assert.match(skill, /Do not mark a[\s\S]{0,80}hypothesis or an unrun experiment ready as if it were a finding/i);
  assert.match(skill, /lane:\s*fb-discovery[\s\S]{0,80}status:\s*ready/i);
}

function assertBugsSkill() {
  const skill = read('plugins/fb-lane-coordination/skills/fb-bugs/SKILL.md');
  assert.match(skill, /ready[\s\S]{0,80}requires observable reproduction evidence/i);
  assert.match(skill, /Record environment[\s\S]*minimal steps[\s\S]*expected behavior[\s\S]*actual[\s\S]*affected users[\s\S]*severity/i);
  assert.match(skill, /Set `status: ready` only when[\s\S]{0,180}observable reproduction[\s\S]{0,120}severity[\s\S]{0,120}affected users[\s\S]{0,120}regression or verification evidence/i);
  assert.match(skill, /Otherwise[\s\S]{0,60}status: blocked[\s\S]{0,80}missing evidence/i);
  assert.match(skill, /lane:\s*fb-bugs[\s\S]{0,80}status:\s*ready/i);
}

function assertProductEvidenceBoundary() {
  const skill = read('plugins/fb-lane-coordination/skills/fb-product/SKILL.md');
  assert.match(skill, /Product inference and assumptions are not user evidence[\s\S]{0,80}label them as[\s\S]{0,20}assumptions/i);
  assert.match(skill, /Actual user evidence requires observed or recorded user input/i);
  assert.match(skill, /never fabricate or impersonate user feedback/i);
}

const SIX = /Product\/User[\s\S]*Business[\s\S]*Design[\s\S]*Tech[\s\S]*Discovery[\s\S]*Bugs/i;
const MINI_LOOP = /mini-loop/i;
const HANDOFF = /docs\/handoffs\/<TASK-ID>\.md|ready handoffs?/i;

function assertAlignedSkills() {
  const files = [
    'plugins/fb-lane-coordination/skills/fb-product/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-business/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-design/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-tech/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane/SKILL.md',
    'plugins/fb-lane-coordination/skills/bfm/SKILL.md',
    'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md'
  ];
  for (const file of files) {
    const skill = read(file);
    assert.match(skill, SIX, `${file} must name the six workstreams in canonical order`);
    assert.match(skill, MINI_LOOP, `${file} must use the mini-loop contract`);
    assert.match(skill, HANDOFF, `${file} must route durable work through handoffs`);
    assert.match(skill, /Ready to\s+ship/i, `${file} must stop delivery at Ready to ship`);
    assert.match(skill, /Push Live/i, `${file} must reserve merge and deployment for Push Live`);
  }

  const bfm = read('plugins/fb-lane-coordination/skills/bfm/SKILL.md');
  assert.match(bfm, /scanWorkstreamHandoffs/);
  assert.match(bfm, /require\(['"]\.\/tools\/fb-lane\.cjs['"]\)/);
  assert.match(bfm, /None\s+relevant/);
  assert.match(bfm, /duplicate|contradict/i);
  assert.doesNotMatch(bfm, /reimplement|re-implement/i);
}

assertDiscoverySkill();
assertBugsSkill();
assertProductEvidenceBoundary();
assertAlignedSkills();
console.log('six-workstream skill behavior contract passed');
