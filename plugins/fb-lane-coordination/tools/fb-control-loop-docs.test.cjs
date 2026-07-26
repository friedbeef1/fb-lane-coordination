#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const containingRoot = path.resolve(__dirname, '..');
const isPackagedCopy = path.basename(containingRoot) === 'fb-lane-coordination'
  && path.basename(path.resolve(containingRoot, '..')) === 'plugins';
const repoRoot = isPackagedCopy ? null : containingRoot;
const root = isPackagedCopy ? containingRoot : repoRoot;
const pluginRoot = isPackagedCopy ? containingRoot : path.join(repoRoot, 'plugins', 'fb-lane-coordination');
const buildPattern = /^0\.5\.0-beta\+codex\.\d{14}$/;

function read(base, relative) {
  return fs.readFileSync(path.join(base, relative), 'utf8');
}

function json(base, relative) {
  return JSON.parse(read(base, relative));
}

function assertControlLoopContract(base) {
  const overview = read(base, 'docs/fb/README.md');
  const controlLoop = read(base, 'docs/fb/control-loop.md');
  assert.match(overview, /\[control-loop\.md\]\(control-loop\.md\)/);
  for (const phrase of [
    'capabilities, not mandatory agents',
    'Understand',
    'Route',
    'Produce',
    'Compare',
    'QA',
    'Diagnose',
    'Ready to ship',
    'deterministic rules',
    'JSONL',
    'curated product truth',
    'pairwise',
    'layered',
    'golden',
    'isolated',
    'Product approval',
    'Push Live',
  ]) assert.match(controlLoop, new RegExp(phrase, 'i'), `control-loop.md must include ${phrase}`);
  for (const forbidden of [
    /requires? (?:a )?mandatory agent per stage/i,
    /captures? transcripts/i,
    /autonomously promotes?/i,
    /automatically deploys?/i,
    /requires? (?:a )?hosted logger/i,
    /requires? (?:a )?hosted dashboard/i,
  ]) assert.doesNotMatch(controlLoop, forbidden);
  assert.match(controlLoop, /\.fb-lane\.json/);
  assert.match(controlLoop, /controlLoop[\s\S]*profileManifest[\s\S]*goldenManifest/);
}

assertControlLoopContract(root);
const manifest = json(pluginRoot, '.codex-plugin/plugin.json');
assert.match(manifest.version, buildPattern);
assert.equal(json(pluginRoot, 'plugin.json').version, manifest.version);
assert.match(manifest.interface.longDescription, /rules-first control loop/i);
assert.match(manifest.interface.longDescription, /six workstreams/i);
assert.match(manifest.interface.longDescription, /Push Live/i);
assert.doesNotMatch(manifest.interface.defaultPrompt.join('\n'), /choose (?:Normal|Quick|Full) BFM/i);

if (!isPackagedCopy) {
  assertControlLoopContract(pluginRoot);
  assert.equal(
    read(repoRoot, 'docs/fb/control-loop.md'),
    read(pluginRoot, 'docs/fb/control-loop.md'),
    'canonical and packaged control-loop pages must be identical',
  );
  for (const surface of [
    'README.md',
    'CHANGELOG.md',
    'docs/setup.md',
    'docs/versioning.md',
    'platforms/codex/README.md',
  ]) assert.match(read(repoRoot, surface), /0\.5\.0-beta/);

  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-control-loop-bootstrap-'));
  try {
    cp.execFileSync('git', ['init', '-q'], { cwd: fixture });
    fs.writeFileSync(path.join(fixture, 'AGENTS.md'), '# Project-owned instructions\n\nKEEP-AGENTS\n');
    fs.mkdirSync(path.join(fixture, '.codex'), { recursive: true });
    fs.writeFileSync(path.join(fixture, '.codex', 'rules.md'), '# Project rules\n\nKEEP-RULES\n');
    cp.execFileSync(process.execPath, [path.join(repoRoot, 'tools', 'fb-lane.cjs'), 'bootstrap'], {
      cwd: fixture,
      stdio: 'pipe',
    });
    assert.equal(
      read(fixture, 'docs/fb/control-loop.md'),
      read(repoRoot, 'docs/fb/control-loop.md'),
      'bootstrap must copy the canonical control-loop page',
    );
    assert.match(read(fixture, 'AGENTS.md'), /KEEP-AGENTS/);
    assert.match(read(fixture, '.codex/rules.md'), /KEEP-RULES/);
    assert.match(read(fixture, 'AGENTS.md'), /docs\/fb\/control-loop\.md/);
    assert.match(read(fixture, '.codex/rules.md'), /docs\/fb\/control-loop\.md/);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

console.log('FB 0.5 control-loop documentation and bootstrap contract passed.');
