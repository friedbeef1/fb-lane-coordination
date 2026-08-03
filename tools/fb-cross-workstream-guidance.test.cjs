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

console.log(`FB cross-workstream guidance contract passed in ${packaged ? 'package' : 'root'} context.`);
