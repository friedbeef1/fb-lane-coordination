#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const containingRoot = path.resolve(__dirname, '..');
const isPackagedCopy = path.basename(containingRoot) === 'fb-lane-coordination'
  && path.basename(path.resolve(containingRoot, '..')) === 'plugins';
const repoRoot = isPackagedCopy ? path.resolve(__dirname, '..', '..', '..') : containingRoot;

const pauseFields = [
  'Why:',
  'What FB already tried:',
  'What can continue safely:',
  'What I need from you:',
  'Next action and owner:',
  'What happens after:',
];
const startBriefFields = [
  'What you asked for',
  'Your decisions',
  'Assumptions to confirm',
  'What FB will plan',
  'Out of scope',
  'Success looks like',
  'Next action',
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function section(markdown, heading, level = 2) {
  const marker = `${'#'.repeat(level)} ${heading}`;
  const start = markdown.indexOf(marker);
  assert.ok(start >= 0, `missing ${marker}`);
  const rest = markdown.slice(start + marker.length);
  const nextHeading = rest.search(new RegExp(`\\n#{1,${level}} `));
  return nextHeading >= 0 ? rest.slice(0, nextHeading) : rest;
}

function assertOrdered(source, values, label) {
  let previous = -1;
  for (const value of values) {
    const index = source.indexOf(value);
    assert.ok(index > previous, `${label} must include ${value} in canonical order`);
    previous = index;
  }
}

const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

test('canonical pause card covers every beginner-facing stop without mislabeling approval', () => {
  const canonical = read('docs/fb/guardrails.md');
  const packaged = read('plugins/fb-lane-coordination/docs/fb/guardrails.md');
  assert.strictEqual(packaged, canonical, 'packaged guardrails must match the canonical pause contract');

  const pause = section(canonical, 'Canonical beginner pause card');
  assert.match(pause, /Paused here/);
  assertOrdered(pause, pauseFields, 'canonical pause card');
  for (const trigger of ['safe recovery', 'lock conflict', 'missing review access', 'external-only action']) {
    assert.match(pause, new RegExp(trigger, 'i'), `pause guidance must cover ${trigger}`);
  }
  assert.match(pause, /approval wait/i);
  assert.match(pause, /Waiting for your approval/);
  assert.match(pause, /(?:never|not) `?Blocked`?/i);
  assert.match(pause, /internal evidence[\s\S]*durable records/i);
  assert.match(pause, /hide|hidden|omit/i);
});

test('active coordination, Product, BFM, setup, and quickstart skills route pauses to guardrails', () => {
  const skills = [
    'skills/fb-lane-coordination/SKILL.md',
    'skills/project-coordination-setup/SKILL.md',
    'skills/quickstart/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-product/SKILL.md',
    'plugins/fb-lane-coordination/skills/bfm/SKILL.md',
    'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md',
  ];
  for (const relativePath of skills) {
    const source = read(relativePath);
    assert.match(source, /guardrails\.md/, `${relativePath} must route to guardrails.md`);
    assert.match(source, /canonical (?:beginner )?pause card/i, `${relativePath} must route beginner pauses to the canonical card`);
  }
});

test('canonical eval catalog defines three complete beginner scenarios at shadow authority', () => {
  const canonical = read('docs/fb/evals.md');
  const packaged = read('plugins/fb-lane-coordination/docs/fb/evals.md');
  assert.strictEqual(packaged, canonical, 'packaged eval guidance must match the canonical catalog');

  const catalog = section(canonical, 'Beginner experience shadow scenarios');
  for (const name of ['Beginner mode selection', 'Beginner status clarity', 'Stop and recovery clarity']) {
    const scenario = section(catalog, name, 3);
    assert.match(scenario, /Authority:\s*shadow/i, `${name} must start shadow`);
    for (const field of ['Trigger:', 'Scenario:', 'Quality target:', 'Must pass:', 'Must not happen:', 'Evidence required:', 'Owner:']) {
      assert.match(scenario, new RegExp(`^${field}`, 'm'), `${name} must define ${field}`);
    }
  }
  assert.match(catalog, /internal evidence[\s\S]*durable records/i);
  assert.match(catalog, /beginner updates[\s\S]*(?:judge|judgment)/i);
  assert.doesNotMatch(catalog, /Authority:\s*(?:advisory|blocking|mechanical)/i);
});

test('three onboarding walkthroughs preserve the approved mode transitions', () => {
  const start = read('docs/fb/start.md');
  const simple = section(start, 'Simple task', 3);
  assert.match(simple, /change one label in one file/i);
  assert.match(simple, /This is a simple task, so I’ll handle it directly without lanes or a build brief\./);

  const planning = section(start, 'Coordinated planning', 3);
  assert.match(planning, /creator-commerce/i);
  assert.match(planning, /FB will prepare the plan first\. It is not building yet\./);
  const brief = section(start, 'Project Start Brief');
  const visibleFields = [...brief.matchAll(/^- \*\*([^:*]+):\*\*/gm)].map(match => match[1]);
  assert.deepStrictEqual(visibleFields, startBriefFields, 'creator-commerce planning must use the seven-field visible brief');

  const build = section(start, 'Approved Build For Me', 3);
  assert.match(build, /explicitly invoked\s+`\$bfm`/i);
  assert.match(build, /Build For Me \(BFM\) will now build and check the approved plan\./);
});

test('every review request uses direct links and step-by-step Test This Now evidence', () => {
  const evidence = section(read('docs/fb/evidence.md'), 'Test This Now');
  assert.match(evidence, /\*\*Direct links:\*\*\s*\[[^\]]+\]\([^)]+\)/);
  const steps = evidence.match(/\*\*Exact steps and expectations:\*\*([\s\S]*?)(?=\n- \*\*)/);
  assert.ok(steps, 'Test This Now must include exact steps and expectations');
  assert.match(steps[1], /^\s*1\.\s+\S+/m);
  assert.match(steps[1], /^\s*2\.\s+\S+/m);
  assert.match(evidence, /Before asking a user to review/i);
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`not ok - ${name}`);
    console.error(error.message);
  }
}

if (failed) {
  console.error(`FB beginner-experience smoke failed (${failed}/${tests.length}).`);
  process.exitCode = 1;
} else {
  console.log(`FB beginner-experience smoke passed (${tests.length}/${tests.length}).`);
}
