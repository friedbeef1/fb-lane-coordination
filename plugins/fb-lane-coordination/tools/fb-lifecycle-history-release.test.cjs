#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const containingRoot = path.resolve(__dirname, '..');
const packaged = path.basename(containingRoot) === 'fb-lane-coordination'
  && path.basename(path.dirname(containingRoot)) === 'plugins';
const root = containingRoot;
const pluginRoot = packaged ? root : path.join(root, 'plugins', 'fb-lane-coordination');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function json(relativePath) {
  return JSON.parse(read(relativePath));
}

const manifest = JSON.parse(fs.readFileSync(path.join(pluginRoot, '.codex-plugin/plugin.json'), 'utf8'));
assert.match(
  manifest.version,
  /^0\.5\.6-beta\+codex\.\d{14}$/,
  'release build must use the 0.5.6-beta UTC build form',
);
assert.strictEqual(JSON.parse(fs.readFileSync(path.join(pluginRoot, 'plugin.json'), 'utf8')).version, manifest.version);

const activeGuidance = [
  'README.md',
  'docs/fb/README.md',
  'docs/fb/start.md',
  'docs/fb/workflow.md',
  'docs/fb/records.md',
  'docs/fb/graph.md',
  'skills/fb-lane-coordination/SKILL.md',
  'skills/project-coordination-setup/SKILL.md',
  'skills/bfm/SKILL.md',
  'skills/fb-product/SKILL.md',
].map(read).join('\n');

for (const phrase of [
  'ready for Product intake',
  'not approval or execution',
  '$bfm',
  'current',
  'archive',
  'exact handoff',
  'Git history',
]) {
  assert.match(activeGuidance, new RegExp(phrase.replace('$', '\\$'), 'i'), `active guidance must retain ${phrase}`);
}
assert.doesNotMatch(
  activeGuidance,
  /execution of already-approved scope/i,
  'ready handoffs must not be described as already-approved executable scope',
);

const coordination = read('skills/fb-lane-coordination/SKILL.md');
assert.match(coordination, /status --context/i, 'coordination must begin with bounded current-state orientation');
assert.match(coordination, /on-demand historical retrieval/i, 'coordination must preserve an explicit historical deep-read route');

if (!packaged) {
  const changelog = read('CHANGELOG.md');
  const release = changelog.match(/## 0\.5\.6-beta[\s\S]*?(?=\n## 0\.5\.5-beta)/)?.[0] || '';
  for (const field of ['What changed', 'Why it matters', 'Compatibility', 'Installation or upgrade']) {
    assert.match(release, new RegExp(`\\*\\*${field}:\\*\\*`), `0.5.6 changelog must include ${field}`);
  }
  assert.match(release, /active\s+state/i);
  assert.match(release, /searchable on demand/i);

  for (const surface of ['README.md', 'FAQ.md', 'docs/setup.md', 'docs/versioning.md', 'platforms/codex/README.md']) {
    assert.match(read(surface), /0\.5\.6-beta/, `${surface} must name 0.5.6-beta`);
  }
}

console.log(`FB lifecycle-history release contract passed for ${manifest.version}.`);
