#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const { execFileSync } = require('child_process');

function run(label, command, args, options = {}) {
  process.stdout.write(`\n==> ${label}\n`);
  const output = execFileSync(command, args, {
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (options.capture && output) process.stdout.write(output);
  return output || '';
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function sameFile(a, b) {
  assert.strictEqual(
    fs.readFileSync(a, 'utf8'),
    fs.readFileSync(b, 'utf8'),
    `${a} differs from ${b}`
  );
}

function requireAbsent(file) {
  assert.ok(!fs.existsSync(file), `${file} must not be restored`);
}

function checkSkill(file) {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, `${file} missing metadata front matter`);
  assert.ok(/^name:\s*\S+/m.test(match[1]), `${file} missing metadata name`);
  assert.ok(/^description:\s*\S.+/m.test(match[1]), `${file} missing metadata description`);
}

run('root CLI syntax', 'node', ['--check', 'tools/fb-lane.cjs']);
run('plugin CLI syntax', 'node', ['--check', 'plugins/fb-lane-coordination/tools/fb-lane.cjs']);

console.log('\n==> root/package CLI parity');
sameFile('tools/fb-lane.cjs', 'plugins/fb-lane-coordination/tools/fb-lane.cjs');

console.log('\n==> legacy runtime/configuration entry points remain absent');
for (const file of ['.mcp.json', 'tools/run_lane.py', 'CLAUDE.md', 'templates/CLAUDE.md']) {
  requireAbsent(file);
}

console.log('\n==> Codex plugin manifest and bundled MCP JSON parse');
readJson('plugins/fb-lane-coordination/.codex-plugin/plugin.json');
readJson('plugins/fb-lane-coordination/.mcp.json');

console.log('\n==> skill metadata validation');
for (const dir of ['skills', 'plugins/fb-lane-coordination/skills']) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) checkSkill(`${dir}/${entry.name}/SKILL.md`);
  }
}

run('regression tests', 'node', ['tools/fb-lane.test.cjs']);

const doctor = run('doctor', 'node', ['tools/fb-lane.cjs', 'doctor'], { capture: true });
assert.ok(doctor.includes('FB-Lane doctor: Ready'), 'doctor did not report ready');

let hasParent = true;
try {
  execFileSync('git', ['rev-parse', '--verify', 'HEAD^'], { stdio: 'ignore' });
} catch (error) {
  hasParent = false;
}

if (hasParent) {
  run('committed-diff whitespace check', 'git', ['diff', '--check', 'HEAD^..HEAD']);
} else {
  run('workspace whitespace check', 'git', ['diff', '--check']);
}

console.log('\nFB-Lane readiness validation passed.');
