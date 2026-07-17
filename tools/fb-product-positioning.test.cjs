#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const containingRoot = path.resolve(__dirname, '..');
const isPackagedCopy = path.basename(containingRoot) === 'fb-lane-coordination'
  && path.basename(path.resolve(containingRoot, '..')) === 'plugins';
const repoRoot = isPackagedCopy ? path.resolve(__dirname, '..', '..', '..') : containingRoot;

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const canonical = read('docs/why-fb.md');
const packaged = read('plugins/fb-lane-coordination/docs/why-fb.md');
const compact = canonical.replace(/\s+/g, ' ');

assert.strictEqual(packaged, canonical, 'packaged positioning page must match the canonical page');
assert.match(canonical, /> Codex executes software work\.\s+> Capacitor is a session-intelligence platform\.\s+> FB is a product-delivery harness that includes curated session intelligence\./);
assert.match(canonical, /\| Vanilla Codex \| Execute software work \|/);
assert.match(canonical, /\| Kurrent Capacitor \| Automatically capture, observe, recall, and evaluate agent sessions \|/);
assert.match(canonical, /\| FB \| Define, authorize, coordinate, verify, and explain a product outcome \|/);
assert.match(compact, /overlap substantially in session recall, evidence, and evaluation/i);
assert.match(compact, /may provide richer session telemetry/i);
assert.match(compact, /optional evidence provider to FB/i);
assert.match(compact, /would not replace FB's approved brief, board, handoff, or closeout authority/i);
assert.match(canonical, /Capacitor can show that three agents attempted a feature/i);
assert.strictEqual((canonical.match(/```mermaid/g) || []).length, 2, 'comparison page must contain two rendered Mermaid diagrams');

for (const evidence of ['TASK-020.md', 'TASK-022.md', 'TASK-024.md', 'TASK-023-walkthroughs.md']) {
  assert.match(canonical, new RegExp(evidence.replace('.', '\\.')), `pain-point map must cite ${evidence}`);
}

for (const entrypoint of [
  'README.md',
  'FAQ.md',
  'plugins/fb-lane-coordination/README.md',
  'docs/fb/README.md',
  'plugins/fb-lane-coordination/docs/fb/README.md',
]) {
  assert.match(read(entrypoint), /why-fb\.md/, `${entrypoint} must link to the canonical comparison`);
}

for (const forbidden of [
  /Capacitor and FB (?:are|operate in) completely separate categories/i,
  /FB does not (?:recall|evaluate) agent work/i,
  /Capacitor replaces FB/i,
]) {
  assert.doesNotMatch(canonical, forbidden);
}

console.log('FB product-positioning contract passed.');
