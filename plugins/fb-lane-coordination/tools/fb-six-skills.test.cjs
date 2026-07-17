'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function assertDiscoverySkill() {
  const skill = read('plugins/fb-lane-coordination/skills/fb-discovery/SKILL.md');
  for (const pattern of [
    /unknowns/i,
    /research/i,
    /experiments?/i,
    /competitor/i,
    /opportunit/i,
    /feasibility/i,
    /finding/i,
    /hypoth/i,
    /docs\/handoffs\/<TASK-ID>\.md/,
    /lane:\s*fb-discovery/i,
    /status:\s*ready/i,
    /Mini-loop Evidence/i,
    /Evidence Against Product OKR/i,
    /plan-only|planning\/evidence/i,
    /Product\/BFM/i
  ]) assert.match(skill, pattern, `Discovery skill must include ${pattern}`);
}

function assertBugsSkill() {
  const skill = read('plugins/fb-lane-coordination/skills/fb-bugs/SKILL.md');
  for (const pattern of [
    /reproduc/i,
    /observable/i,
    /severity/i,
    /affected users?/i,
    /regression/i,
    /expected/i,
    /actual/i,
    /status:\s*blocked/i,
    /docs\/handoffs\/<TASK-ID>\.md/,
    /lane:\s*fb-bugs/i,
    /status:\s*ready/i,
    /Mini-loop Evidence/i,
    /Evidence Against Product OKR/i,
    /plan-only|planning\/evidence/i,
    /Product\/BFM/i
  ]) assert.match(skill, pattern, `Bugs skill must include ${pattern}`);
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
assertAlignedSkills();
console.log('six-workstream skill behavior contract passed');
