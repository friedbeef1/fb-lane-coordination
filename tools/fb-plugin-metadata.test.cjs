#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const containingRoot = path.resolve(__dirname, '..');
const isPackagedCopy = path.basename(containingRoot) === 'fb-lane-coordination'
  && path.basename(path.resolve(containingRoot, '..')) === 'plugins';
const repoRoot = isPackagedCopy ? path.resolve(__dirname, '..', '..', '..') : containingRoot;
const pluginRoot = path.join(repoRoot, 'plugins', 'fb-lane-coordination');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function json(relativePath) {
  return JSON.parse(read(relativePath));
}

const legacyManifest = json('plugins/fb-lane-coordination/plugin.json');
const codexManifest = json('plugins/fb-lane-coordination/.codex-plugin/plugin.json');
const marketplace = json('.agents/plugins/marketplace.json');
const versionPattern = /^0\.3\.0-beta\+codex\.\d{14}$/;

assert.match(codexManifest.version, versionPattern, 'Codex manifest must use the 0.3.0-beta UTC build ID');
assert.strictEqual(legacyManifest.version, codexManifest.version, 'both plugin manifests must expose the same build ID');
assert.strictEqual(codexManifest.name, 'fb-lane-coordination');
assert.strictEqual(legacyManifest.name, 'fb-lane-coordination');
assert.strictEqual(marketplace.name, 'fb-lane');
assert.strictEqual(marketplace.interface.displayName, 'FB');

const interfaceCopy = [
  codexManifest.description,
  codexManifest.interface.shortDescription,
  codexManifest.interface.longDescription,
  ...codexManifest.interface.defaultPrompt,
].join('\n');
const prompts = codexManifest.interface.defaultPrompt.join('\n');

for (const workstream of ['Product/User', 'Business', 'Design', 'Tech', 'Discovery', 'Bugs']) {
  assert.match(interfaceCopy, new RegExp(workstream.replace('/', '\\/'), 'i'), `plugin metadata must name ${workstream}`);
}
for (const contract of [
  'ready handoff', '$bfm', 'automated', 'repair', 'Ready to ship', 'Push Live',
]) {
  assert.ok(interfaceCopy.toLowerCase().includes(contract.toLowerCase()), `plugin metadata must include ${contract}`);
}
assert.match(prompts, /Product\/User, Business, Design, Tech, Discovery, and Bugs/i);
assert.match(prompts, /scan(?:s)? all six/i);
assert.match(prompts, /Automated checks passed\. Optional review links are available above\.[\s\S]*Say \*\*Push Live\*\* to deploy\./i);
assert.doesNotMatch(prompts, /split this work across Product, Tech, Design, and Business/i, 'stale four-workstream prompt must not return');

for (const activeSurface of [
  'README.md',
  'FAQ.md',
  'docs/setup.md',
  'docs/versioning.md',
  'platforms/codex/README.md',
  'plugins/fb-lane-coordination/README.md',
]) {
  assert.match(read(activeSurface), /0\.3\.0-beta/, `${activeSurface} must identify the active 0.3.0-beta line`);
}

assert.match(read('docs/setup.md'), /codex plugin marketplace upgrade fb-lane/);
assert.match(read('docs/setup.md'), /codex plugin add fb-lane-coordination@fb-lane/);
assert.match(read('docs/setup.md'), /new Codex thread/i);

console.log(`FB plugin metadata contract passed for ${codexManifest.version}.`);
