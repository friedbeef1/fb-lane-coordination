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
  /^0\.9\.1-beta\+codex\.\d{14}$/,
  'release build must use the 0.9.1-beta UTC build form',
);
assert.strictEqual(JSON.parse(fs.readFileSync(path.join(pluginRoot, 'plugin.json'), 'utf8')).version, manifest.version);

const activeGuidance = [
  'README.md',
  'docs/fb/README.md',
  'docs/fb/start.md',
  'docs/fb/workflow.md',
  'docs/fb/evals.md',
  'docs/fb/records.md',
  'docs/fb/graph.md',
  'docs/fb/learning.md',
  'skills/fb-lane-coordination/SKILL.md',
  'skills/project-coordination-setup/SKILL.md',
  'skills/bfm/SKILL.md',
  'skills/fb-product/SKILL.md',
  'skills/fb-release/SKILL.md',
].map(read).join('\n');

for (const phrase of [
  'ready for Product intake',
  'not approval or execution',
  '$bfm',
  'current',
  'archive',
  'exact handoff',
  'Git history',
  'Evaluation results',
  'sufficient and causally relevant',
  'original failed scenario',
  'focused regression',
  'no-progress',
  'project-local continuous learning',
  'one revision',
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
  const release = changelog.match(/## 0\.8\.1-beta[\s\S]*?(?=\n## 0\.8\.0-beta)/)?.[0] || '';
  for (const field of ['What changed', 'Why it matters', 'Compatibility', 'Installation or upgrade']) {
    assert.match(release, new RegExp(`\\*\\*${field}:\\*\\*`), `0.8.1 changelog must include ${field}`);
  }
  assert.match(release, /taskTitlePrefix/i);
  assert.match(release, /stable IDs/i);
  assert.match(release, /fail(?:s|ed)? closed/i);
  assert.match(release, /seven/i);
  assert.match(release, /new\s+Codex\s+task/i);

  for (const surface of ['README.md', 'FAQ.md', 'docs/setup.md', 'docs/versioning.md', 'platforms/codex/README.md']) {
    assert.match(read(surface), /0\.9\.0-beta/, `${surface} must name 0.9.0-beta`);
  }

  const bfm = read('skills/bfm/SKILL.md');
  assert.match(bfm, /freezeBfmIntake/);
  assert.match(bfm, /renderBfmIntakeLedger/);
  assert.match(bfm, /canonical checkout/i);
  assert.match(bfm, /complete\s+intake\s+ledger/i);
  assert.match(bfm, /Do not duplicate scanner/i);

  const product = read('skills/fb-product/SKILL.md');
  assert.match(product, /canonical checkout/i);
  assert.match(product, /complete\s+intake\s+ledger/i);
  assert.match(product, /transactional\s+migration/i);

  const coordination = read('skills/fb-lane-coordination/SKILL.md');
  assert.match(coordination, /canonical checkout/i);
  assert.match(coordination, /complete\s+intake\s+ledger/i);

  const setup = read('skills/project-coordination-setup/SKILL.md');
  assert.match(setup, /exact-project/i);
  assert.match(setup, /transactional\s+migration/i);
  assert.match(setup, /quarantined former roots/i);

  for (const surface of ['README.md', 'docs/fb/README.md', 'docs/fb/start.md', 'docs/fb/workflow.md']) {
    const source = read(surface);
    assert.match(source, /canonical checkout/i, `${surface} must explain the canonical checkout gate`);
    assert.match(source, /complete\s+intake\s+ledger/i, `${surface} must explain the complete intake ledger`);
    assert.match(source, /transactional\s+migration/i, `${surface} must explain transactional migration`);
    assert.match(source, /Push Live/i, `${surface} must retain the release boundary`);
  }

  const manifestPaths = json('tools/fb-package-manifest.json');
  assert.ok(manifestPaths.includes('tools/fb-bfm-intake-ledger.test.cjs'), 'package manifest must include the focused intake-ledger contract');
  for (const required of [
    'tools/fb-release-preflight.cjs',
    'tools/fb-release-preflight.test.cjs',
    'tools/fb-release-skill.test.cjs',
    'skills/fb-release/SKILL.md',
  ]) assert.ok(manifestPaths.includes(required), `package manifest must include ${required}`);
}

console.log(`FB current release contract passed for ${manifest.version}.`);
