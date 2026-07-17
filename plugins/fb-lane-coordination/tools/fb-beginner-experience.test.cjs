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

function canonicalPauseGuidance() {
  const canonical = read('docs/fb/guardrails.md');
  const packaged = read('plugins/fb-lane-coordination/docs/fb/guardrails.md');
  assertCanonicalPauseShape(section(packaged, 'Canonical beginner pause card'), 'packaged pause card');
  return section(canonical, 'Canonical beginner pause card');
}

function assertCanonicalPauseShape(pause, label) {
  assert.match(pause, /Paused here/);
  assertOrdered(pause, pauseFields, label);
}

test('approval waits route to the approval title instead of Blocked', () => {
  const pause = canonicalPauseGuidance();
  assertCanonicalPauseShape(pause, 'approval pause card');
  assert.match(pause, /approval wait/i);
  assert.match(pause, /Waiting for your approval/);
  assert.match(pause, /(?:never|not) `?Blocked`?/i);
});

test('safe recovery stays with Product/BFM before asking the user to act', () => {
  const pause = canonicalPauseGuidance();
  assertCanonicalPauseShape(pause, 'safe-recovery pause card');
  assert.match(pause, /safe recovery/i);
  assert.match(pause, /Product\/BFM owns safe recovery/i);
});

test('lock conflicts route to Product/BFM lock resolution', () => {
  const pause = canonicalPauseGuidance();
  assertCanonicalPauseShape(pause, 'lock-conflict pause card');
  assert.match(pause, /lock conflict/i);
  assert.match(pause, /Product\/BFM owns[\s\S]*lock resolution/i);
});

test('missing review access routes to the review-access recovery card', () => {
  const pause = canonicalPauseGuidance();
  assertCanonicalPauseShape(pause, 'missing-review pause card');
  assert.match(pause, /missing review access/i);
  const evidence = read('docs/fb/evidence.md');
  assert.match(evidence, /Why:\s*Blocked — no review environment yet; review access is missing\./i);
  assert.match(evidence, /Next action and owner:\s*Product\/BFM owns review-access recovery\./i);
});

test('external-only actions ask the user only for the exact manual boundary', () => {
  const pause = canonicalPauseGuidance();
  assertCanonicalPauseShape(pause, 'external-only pause card');
  assert.match(pause, /external-only action/i);
  assert.match(pause, /Ask the user only for[\s\S]*external-only manual, device, account, or provider action/i);
  assert.match(pause, /internal evidence[\s\S]*durable records/i);
  assert.match(pause, /hide|hidden|omit/i);
});

test('active coordination, Product, BFM, lane, setup, and quickstart skills route pauses to guardrails', () => {
  const skills = [
    'skills/fb-lane-coordination/SKILL.md',
    'skills/project-coordination-setup/SKILL.md',
    'skills/quickstart/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-product/SKILL.md',
    'plugins/fb-lane-coordination/skills/bfm/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-business/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-design/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-tech/SKILL.md',
    'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md',
  ];
  for (const relativePath of skills) {
    const source = read(relativePath);
    assert.match(source, /guardrails\.md/, `${relativePath} must route to guardrails.md`);
    assert.match(source, /canonical\s+(?:beginner\s+)?pause\s+card/i, `${relativePath} must route beginner pauses to the canonical card`);
  }
});

test('canonical eval catalog defines three complete beginner scenarios at shadow authority', () => {
  const canonical = read('docs/fb/evals.md');
  const packaged = read('plugins/fb-lane-coordination/docs/fb/evals.md');
  const expectedScenarios = ['Beginner mode selection', 'Beginner status clarity', 'Stop and recovery clarity'];
  for (const [label, source] of [['canonical', canonical], ['packaged', packaged]]) {
    const catalog = section(source, 'Beginner experience shadow scenarios');
    const actualScenarios = [...catalog.matchAll(/^###\s+(.+)$/gm)].map(match => match[1]);
    assert.deepStrictEqual(actualScenarios, expectedScenarios, `${label} beginner experience catalog must contain exactly three scenarios`);
    assert.strictEqual([...catalog.matchAll(/^Authority:\s*shadow\s*$/gmi)].length, 3, `${label} scenarios must start shadow`);
  }
  const catalog = section(canonical, 'Beginner experience shadow scenarios');
  for (const name of expectedScenarios) {
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

test('Test This Now makes system verification primary and keeps review links optional when no input is needed', () => {
  const evidence = section(read('docs/fb/evidence.md'), 'Test This Now');
  assert.match(evidence, /\*\*System verification:\*\* passed/i);
  assert.match(evidence, /\*\*Your input needed:\*\* none/i);
  assert.match(evidence, /\*\*Direct links:\*\* Optional review links/i);
  assert.doesNotMatch(evidence, /Your input needed:\*\* none[\s\S]{0,600}Complete the named review flow/i);
  for (const label of ['Outcome type', 'Exact steps and expectations', 'Pass criteria', 'Known limits', 'Failure-report format', 'What was evaluated', 'Exact scenarios and expected results', 'Known quality gaps', 'Required user judgment']) assert.match(evidence, new RegExp(`\\*\\*${label}:\\*\\*`));
  assert.match(evidence, /(?:only\s+)?subjective judgment, unavailable access, a real[\s\S]*final\s+release approval/i);
  assert.match(evidence, /For an accessible candidate/i);

  assert.match(
    evidence,
    /\[canonical beginner pause card\]\(guardrails\.md#canonical-beginner-pause-card\)/i,
    'missing review access must route to the canonical pause card'
  );
  const missingAccess = evidence.match(/```md\n([\s\S]*?Blocked — no review environment yet[\s\S]*?)```/);
  assert.ok(missingAccess, 'missing review access must retain validator-compatible blocked wording');
  assert.match(missingAccess[1], /Paused here/);
  assertOrdered(missingAccess[1], pauseFields, 'missing-review pause card');
  assert.match(missingAccess[1], /Why:\s*Blocked — no review environment yet/i);
  assert.match(missingAccess[1], /Next Product\/BFM action:\s*\S+/i);
  assert.doesNotMatch(
    missingAccess[1],
    /^Blocked — no review environment yet\s*$/m,
    'missing review access must not fall back to the legacy two-line response'
  );
});

test('actual reviewable TASK-022 and TASK-023 handoffs include direct links and numbered steps', () => {
  for (const taskId of ['TASK-022', 'TASK-023']) {
    const handoff = read(`docs/handoffs/${taskId}.md`);
    assert.match(handoff, /^Review state:\s*(?:runnable sandbox|staging candidate|completed build)\s*$/im, `${taskId} must remain reviewable`);
    const review = section(handoff, 'Test This Now');
    const directLinks = review.match(/^- \*\*Direct links:\*\*\s*(.+)$/m);
    assert.ok(directLinks, `${taskId} must expose Direct links in Test This Now`);
    assert.match(directLinks[1], /\[[^\]]+\]\([^)]+\)/, `${taskId} Direct links must contain an actionable Markdown link`);
    const exactSteps = review.match(/^- \*\*Exact steps and expectations:\*\*([\s\S]*?)(?=\n- \*\*)/m);
    assert.ok(exactSteps, `${taskId} must expose exact steps and expectations`);
    assert.match(exactSteps[1], /^\s*1\.\s+\S+/m, `${taskId} must include step 1`);
    assert.match(exactSteps[1], /^\s*2\.\s+\S+/m, `${taskId} must include step 2`);
  }
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
