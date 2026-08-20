#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const containingRoot = path.resolve(__dirname, '..');
const isPackagedCopy = path.basename(containingRoot) === 'fb-lane-coordination'
  && path.basename(path.resolve(containingRoot, '..')) === 'plugins';
const repoRoot = isPackagedCopy ? null : containingRoot;
const pluginRoot = isPackagedCopy
  ? containingRoot
  : path.join(repoRoot, 'plugins', 'fb-lane-coordination');
const versionPattern = /^0\.9\.3-beta\+codex\.\d{14}$/;
const publicModel = 'six evidence-producing workstreams plus one Product/BFM control centre and seven pinned repository-scoped Codex tasks';

function read(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function json(root, relativePath) {
  return JSON.parse(read(root, relativePath));
}

function assertExactBuild(label, content, version) {
  assert.ok(content.includes(version), `${label} must expose exact build ${version}`);
}

function validatePluginPackage(root) {
  const legacyManifest = json(root, 'plugin.json');
  const codexManifest = json(root, '.codex-plugin/plugin.json');

  assert.match(codexManifest.version, versionPattern, 'Codex manifest must use the 0.9.3-beta UTC build ID');
  assert.strictEqual(legacyManifest.version, codexManifest.version, 'both plugin manifests must expose the same build ID');
  assert.strictEqual(codexManifest.name, 'fb-lane-coordination');
  assert.strictEqual(legacyManifest.name, 'fb-lane-coordination');

  const interfaceCopy = [
    codexManifest.description,
    codexManifest.interface.shortDescription,
    codexManifest.interface.longDescription,
    ...codexManifest.interface.defaultPrompt,
  ].join('\n');
  const prompts = codexManifest.interface.defaultPrompt.join('\n');

  for (const workstream of ['Product/BFM', 'User', 'Business', 'Design', 'Tech', 'Discovery', 'Bugs']) {
    assert.match(interfaceCopy, new RegExp(workstream.replace('/', '\\/'), 'i'), `plugin metadata must name ${workstream}`);
  }
  for (const contract of [
    'Graph Engineering', 'living product-delivery graph', publicModel, 'ready handoff', '$bfm', 'automated', 'repair', 'Ready to ship', 'Push Live',
  ]) {
    assert.ok(interfaceCopy.toLowerCase().includes(contract.toLowerCase()), `plugin metadata must include ${contract}`);
  }
  assert.match(prompts, /User, Business, Design, Tech, Discovery, and Bugs/i);
  assert.match(prompts, /Product\/BFM is the control centre, not an evidence-producing workstream/i);
  assert.match(prompts, /Goal → Split → only the relevant workstreams → Verify evidence → Merge findings → Implement → Verify candidate → One clear result/i);
  assert.match(prompts, /Activate only relevant workstreams/i);
  assert.match(prompts, /Send this to Product/i);
  assert.match(prompts, /complete intake ledger[\s\S]*User, Business, Design, Tech, Discovery, Bugs[\s\S]*Product\/BFM control centre/i);
  assert.match(prompts, /pinning never starts work/i);
  assert.match(prompts, /use \$fb-setup/i);
  assert.match(prompts, /canonical project-coordination-setup workflow/i);
  assert.match(prompts, /standing delegation[\s\S]*without a user prompt/i);
  assert.match(prompts, /changed product decisions[\s\S]*material scope[\s\S]*sensitive gates[\s\S]*Push Live/i);
  assert.match(prompts, /active canonical checkout/i);
  assert.match(prompts, /complete intake ledger/i);
  assert.match(prompts, /automatically runs a cheap deterministic preflight/i);
  assert.match(prompts, /Direct BFM[\s\S]*graph-driven orchestration/i);
  assert.match(prompts, /never ask the user to choose/i);
  assert.match(prompts, /authoritative-record fallback/i);
  assert.match(prompts, /transactional migration/i);
  assert.match(prompts, /fixed limit[\s\S]*read-only exact-root candidate adapter/i);
  assert.match(prompts, /never treat local state alone as authority/i);
  assert.match(prompts, /exact project ID[\s\S]*canonical repository root/i);
  assert.match(prompts, /Automated checks passed\. Optional review links are available above\.[\s\S]*Say \*\*Push Live\*\* to deploy\./i);
  assert.match(prompts, /project-local continuous learning/i);
  assert.match(prompts, /two helpful comparable applications/i);
  assert.match(prompts, /never resets Quick or Full repair budgets/i);
  assert.match(prompts, /Push Live[\s\S]*fb-release/i);
  assert.match(prompts, /marketplace source[\s\S]*(?:local|Git)/i);
  assert.match(prompts, /installed runtime/i);
  assert.match(prompts, /new Codex (?:task|thread)/i);
  assert.doesNotMatch(prompts, /split this work across Product, Tech, Design, and Business/i, 'stale four-workstream prompt must not return');
  assertExactBuild('packaged README.md', read(root, 'README.md'), codexManifest.version);

  return codexManifest.version;
}

const version = validatePluginPackage(pluginRoot);

if (!isPackagedCopy) {
  const marketplace = json(repoRoot, '.agents/plugins/marketplace.json');
  assert.strictEqual(marketplace.name, 'fb-lane');
  assert.strictEqual(marketplace.interface.displayName, 'FB');

  for (const activeSurface of [
    'README.md',
    'CHANGELOG.md',
    'PROJECT_BOARD.md',
    'docs/handoffs/index.md',
    'docs/handoffs/TASK-089.md',
    'docs/qa/TASK-089.md',
    'docs/setup.md',
    'docs/versioning.md',
    'platforms/codex/README.md',
  ]) {
    assertExactBuild(activeSurface, read(repoRoot, activeSurface), version);
  }
  assert.match(read(repoRoot, 'FAQ.md'), /0\.9\.3-beta/, 'FAQ.md intentionally names the release family');
  assert.match(read(repoRoot, 'docs/setup.md'), /codex plugin marketplace upgrade fb-lane/);
  assert.match(read(repoRoot, 'docs/setup.md'), /codex plugin add fb-lane-coordination@fb-lane/);
  assert.match(read(repoRoot, 'docs/setup.md'), /new Codex thread/i);
}

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-plugin-metadata-'));
try {
  fs.mkdirSync(path.join(fixtureRoot, '.codex-plugin'), { recursive: true });
  fs.copyFileSync(path.join(pluginRoot, 'plugin.json'), path.join(fixtureRoot, 'plugin.json'));
  fs.copyFileSync(path.join(pluginRoot, '.codex-plugin', 'plugin.json'), path.join(fixtureRoot, '.codex-plugin', 'plugin.json'));
  fs.writeFileSync(path.join(fixtureRoot, 'README.md'), read(pluginRoot, 'README.md').replace(version, '0.9.3-beta+codex.19990101000000'));
  assert.throws(
    () => validatePluginPackage(fixtureRoot),
    /packaged README\.md must expose exact build/,
    'package-local README drift must fail deterministically',
  );
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log(`FB plugin metadata contract passed for ${version}.`);
