#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const workflow = read('docs/fb/workflow.md');
const bfm = read('skills/bfm/SKILL.md');
const product = read('skills/fb-product/SKILL.md');
const control = `${workflow}\n${bfm}\n${product}`;
const normalizedControl = control.replace(/\s+/g, ' ');

for (const phrase of [
  'Product/BFM Result',
  'Return delivery: pending',
  'exact receipt-bound task ID',
  'one passive result summary per affected workstream per BFM cycle',
  'does not start work or invoke `$bfm`',
]) {
  assert.match(normalizedControl, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing return-loop contract: ${phrase}`);
}

for (const disposition of ['Include now', 'Blocked', 'Deferred', 'Duplicate', 'Rejected', 'Superseded']) {
  assert.match(control, new RegExp(`(?:Product/BFM Result|return)[\\s\\S]{0,900}${disposition}`, 'i'), `missing result return for ${disposition}`);
}

assert.match(control, /outcome[\s\S]{0,220}delivered work[\s\S]{0,220}evidence[\s\S]{0,220}remaining gate[\s\S]{0,220}final status/i);
assert.match(control, /group[\s\S]{0,120}(?:multiple|all)[\s\S]{0,120}(?:result|handoff)[\s\S]{0,120}workstream/i);
assert.match(control, /(?:fingerprint|unchanged result)[\s\S]{0,180}(?:not resend|not sent again|do not resend)/i);
assert.match(workflow, /fingerprint excludes the mutable delivery receipt/i);
assert.match(workflow, /changed result resets Return delivery to[\s\S]{0,40}pending/i);
assert.match(workflow, /Historical handoffs[\s\S]{0,100}Product\/BFM Closeout[\s\S]{0,100}remain valid/i);
assert.match(control, /task messaging[\s\S]{0,180}unavailable[\s\S]{0,220}paste-ready/i);
assert.match(control, /never (?:claim|report)[\s\S]{0,120}delivered/i);

for (const name of ['fb-user', 'fb-business', 'fb-design', 'fb-tech', 'fb-discovery', 'fb-bugs']) {
  const skill = read(`skills/${name}/SKILL.md`);
  assert.match(skill, /Product\/BFM Result/i, `${name} must read returned Product/BFM results`);
  assert.match(skill, /passive[\s\S]{0,120}(?:does not|never)[\s\S]{0,120}(?:start work|invoke `?\$bfm`?)/i, `${name} must keep result notices passive`);
}

console.log('FB workstream result-return contract passed.');
