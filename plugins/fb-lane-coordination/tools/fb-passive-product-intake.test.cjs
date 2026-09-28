'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packaged = path.basename(root) === 'fb-lane-coordination'
  && path.basename(path.dirname(root)) === 'plugins';
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const section = markdown => markdown.split('## Product handoff delivery states\n')[1]?.split('\n## ')[0] || '';

test('ready handoff arrival uses an indexed queue and never sends a wake-up prompt', () => {
  const policy = section(read('docs/fb/workflow.md'));
  assert.match(policy, /save[^\n]*handoff|saving a ready workstream handoff/i);
  assert.match(policy, /index/i);
  assert.match(policy, /never use `send_message_to_thread`[^\n]*Product\/BFM/i);
  assert.match(policy, /set_thread_read_state\([^\n]*read:\s*false/i);
  assert.match(policy, /exact[^\n]*Product\/BFM[^\n]*task/i);
  assert.match(policy, /saved-only|saved for Product intake/i);
  assert.match(policy, /\$bfm[^\n]*only|only[^\n]*\$bfm/i);
});

test('coordination, Product and BFM route workstream arrival to the canonical passive policy', () => {
  for (const skill of ['fb-lane-coordination', 'fb-product', 'bfm']) {
    const text = read(`skills/${skill}/SKILL.md`);
    assert.match(text, /Product handoff delivery states/i, `${skill} must load the canonical policy`);
  }
  for (const skill of ['fb-user', 'fb-business', 'fb-design', 'fb-tech', 'fb-discovery', 'fb-bugs']) {
    const text = read(`skills/${skill}/SKILL.md`);
    assert.match(text, /Product handoff delivery states/i, `${skill} must load the canonical policy`);
  }
});

test('packaged policy is identical after generation', () => {
  if (packaged) {
    assert.ok(section(read('docs/fb/workflow.md')), 'packaged policy must be present');
    return;
  }
  assert.equal(read('plugins/fb-lane-coordination/docs/fb/workflow.md'), read('docs/fb/workflow.md'));
});
