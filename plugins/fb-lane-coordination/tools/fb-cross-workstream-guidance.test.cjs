#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const surfaceRoot = path.resolve(__dirname, '..');
const packaged = fs.existsSync(path.join(surfaceRoot, 'plugin.json'));
const read = relative => fs.readFileSync(path.join(surfaceRoot, relative), 'utf8');
const workstreamSkills = [
  'fb-product', 'fb-business', 'fb-design', 'fb-tech', 'fb-discovery', 'fb-bugs',
];

test('all six workstreams expose explicit queue-and-wait routing', () => {
  for (const skill of workstreamSkills) {
    const source = read(`skills/${skill}/SKILL.md`);
    assert.match(source, /explicit user request/i, `${skill} must require explicit routing`);
    assert.match(source, /type:\s*fb-workstream-handoff/i, `${skill} must name the directed artifact type`);
    assert.match(source, /status:\s*queued/i, `${skill} must use the queue state`);
    assert.match(source, /planning only; waiting for you/i, `${skill} must use the passive destination notice`);
    assert.match(source, /Continue the queued <source> handoff/i, `${skill} must name the continuation intent`);
    assert.match(source, /remain(?:s)? idle|does not start automatically/i, `${skill} must keep the destination idle`);
    assert.match(source, /separate[^\n]*Product-ready|separate[^\n]*status:\s*ready/i, `${skill} must separate delivery intake`);
    assert.doesNotMatch(source, /(?:arrival|queued handoff)[^\n]*(?:starts|activates|executes|delegates)/i, `${skill} must not auto-start the recipient`);
  }
});

test('coordination, Product, and BFM exclude queued artifacts from execution', () => {
  for (const skill of ['fb-lane-coordination', 'fb-product', 'bfm']) {
    const source = read(`skills/${skill}/SKILL.md`);
    assert.match(source, /fb-workstream-handoff/i);
    assert.match(source, /\$bfm[\s\S]{0,100}(?:ignores|does not include)|(?:ignores|does not include)[\s\S]{0,100}\$bfm/i);
    assert.match(source, /sidechat[\s\S]{0,100}originating parent/i);
    assert.match(source, /paste-ready/i);
  }

  const bfm = read('skills/bfm/SKILL.md');
  const guard = bfm.search(/Only the Product\/BFM main task may continue/i);
  const onboarding = bfm.search(/## First-run|After bootstrap/i);
  assert.ok(guard >= 0 && onboarding >= 0 && guard < onboarding, 'BFM must reject non-Product invocation before onboarding work');
});

test('harness and public guidance show one Discovery to Design example', () => {
  for (const file of ['docs/fb/start.md', 'docs/fb/workflow.md', 'docs/fb/guardrails.md']) {
    const source = read(file);
    assert.match(source, /workstream-to-workstream|cross-workstream/i, `${file} must explain directed routing`);
    assert.match(source, /planning only; waiting for you/i, `${file} must preserve the passive notice`);
  }

  const publicSources = packaged ? [read('README.md')] : [read('README.md'), read('FAQ.md')];
  for (const source of publicSources) {
    assert.match(source, /Discovery[\s\S]{0,100}Design/i);
    assert.match(source, /queued/i);
    assert.match(source, /wait(?:s|ing)? for you|does not start automatically/i);
  }
});

test('installed prompt preserves truthful routing and release boundaries', () => {
  const manifestPath = packaged
    ? '.codex-plugin/plugin.json'
    : 'plugins/fb-lane-coordination/.codex-plugin/plugin.json';
  const manifest = read(manifestPath);
  assert.match(manifest, /planning only; waiting for you/i);
  assert.match(manifest, /Product\/BFM[\s\S]{0,120}\$bfm|\$bfm[\s\S]{0,120}Product\/BFM/i);
  assert.match(manifest, /task tools[^\n]*unavailable[^\n]*paste-ready/i);
  assert.doesNotMatch(manifest, /arrival[^\n]*(?:starts|activates|executes|delegates)/i);
  assert.match(manifest, /Push Live/);
});

test('active skills use one compact-first known-task route without mandatory full-board startup', () => {
  const graph = read('docs/fb/graph.md');
  assert.match(graph, /## Canonical known-task orientation/);
  assert.match(graph, /fb_project_context/);
  assert.match(graph, /status --context/);
  assert.match(graph, /missing, truncated, insufficient, or contradictory/);
  for (const skill of [...workstreamSkills, 'fb-user', 'bfm', 'fb-lane-coordination']) {
    const source = read(`skills/${skill}/SKILL.md`);
    assert.match(source, /Canonical known-task orientation/);
    assert.doesNotMatch(source, /1\. Read `AGENTS\.md`, `PROJECT_BOARD\.md`/);
  }
  const workflow = read('docs/fb/workflow.md');
  assert.doesNotMatch(workflow, /1\. Read `AGENTS\.md`, board, current-task record/);
});

test('saved Product handoff is distinguished from exact-task message delivery', () => {
  const workflow = read('docs/fb/workflow.md').replace(/\s+/g, ' ');
  assert.match(workflow, /Saved for Product intake\. No message was sent to the Product task, and you do not need to copy or paste this handoff\. In the Product\/BFM task, invoke \$bfm; it will discover the indexed handoff\./);
  assert.match(workflow, /Sent|Delivered/);
  assert.match(workflow, /successful exact receipt-bound native message/);
  assert.match(workflow, /delivery pending/);
  for (const skill of [...workstreamSkills, 'fb-user', 'bfm', 'fb-lane-coordination']) {
    assert.match(read(`skills/${skill}/SKILL.md`), /Product handoff delivery states/);
  }
});

test('candidate preservation and semantic-eval evidence remain truthfully bounded', () => {
  const evidence = read('docs/fb/evidence.md').replace(/\s+/g, ' ');
  assert.match(evidence, /exact source in a commit on a durable branch/);
  assert.match(evidence, /verified local Git bundle/);
  assert.match(evidence, /temporary worktree alone is not durable/);
  assert.match(evidence, /does not authorize any automatic push/i);
  const evals = read('docs/fb/evals.md').replace(/\s+/g, ' ');
  assert.match(evals, /synthetic mocks and generated labels/i);
  assert.match(evals, /plumbing, not observed effectiveness or human calibration/i);
  assert.match(evals, /semantic evals? remain(?:s)? shadow/i);
});

console.log(`FB cross-workstream guidance contract passed in ${packaged ? 'package' : 'root'} context.`);
