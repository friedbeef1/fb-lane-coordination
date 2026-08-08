#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageContext = path.basename(root) === 'fb-lane-coordination'
  && path.basename(path.dirname(root)) === 'plugins';
const canonical = path.join(root, 'docs', 'fb', 'learning.md');
const packaged = packageContext
  ? canonical
  : path.join(root, 'plugins', 'fb-lane-coordination', 'docs', 'fb', 'learning.md');

assert.ok(fs.existsSync(canonical), 'canonical project learning page must exist');
assert.ok(fs.existsSync(packaged), 'packaged project learning page must exist');
const source = fs.readFileSync(canonical, 'utf8');
assert.equal(fs.readFileSync(packaged, 'utf8'), source, 'project learning guidance must be mechanically mirrored');

for (const phrase of [
  'consumer project', 'provisional', 'confirmed', 'revised', 'rejected', 'retired',
  'one revision', 'relevant', 'repair budget', 'private', 'Push Live',
  'add_context_ref', 'add_dependency', 'select_existing_check', 'recovery_hint', 'raise_verification_floor',
]) {
  assert.match(source, new RegExp(phrase, 'i'), `learning guidance must include ${phrase}`);
}
assert.match(source, /one active lesson per failure signature/i);
assert.match(source, /never (?:automatically )?(?:edits?|changes?).*application source/i);
assert.match(source, /never[\s\S]*cross-project/i);
assert.doesNotMatch(source, /unbounded recursion|(?:may|can) reset the repair budget|lesson promotes itself/i);

for (const relative of [
  'docs/fb/README.md', 'docs/fb/workflow.md', 'docs/fb/evidence.md', 'docs/fb/guardrails.md',
  'docs/fb/sessions.md', 'docs/fb/evals.md', 'docs/fb/graph.md', 'docs/fb/control-loop.md',
  'skills/bfm/SKILL.md', 'skills/fb-product/SKILL.md', 'skills/fb-lane-coordination/SKILL.md',
  'skills/project-coordination-setup/SKILL.md',
]) {
  assert.match(fs.readFileSync(path.join(root, relative), 'utf8'), /learning\.md/, `${relative} must route to canonical learning guidance`);
}

for (const relative of packageContext ? ['README.md'] : ['README.md', 'FAQ.md']) {
  const publicSource = fs.readFileSync(path.join(root, relative), 'utf8');
  assert.match(publicSource, /After FB verifies a feature/i, `${relative} must explain project learning in plain language`);
  assert.match(publicSource, /endless repair loop/i, `${relative} must explain the bounded loop`);
}

console.log('FB project learning documentation contract passed.');
