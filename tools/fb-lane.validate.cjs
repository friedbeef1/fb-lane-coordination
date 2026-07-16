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

function checkActiveCodexSurface(file) {
  const text = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(text, /\b(?:Claude(?: Code)?|Antigravity)\b/i, `${file} must be Codex-only`);
  assert.doesNotMatch(text, /\b(?:project\s+)?MCP\s+config(?:uration)?\b/i, `${file} must not promise project MCP configuration`);
}

run('root CLI syntax', 'node', ['--check', 'tools/fb-lane.cjs']);
run('plugin CLI syntax', 'node', ['--check', 'plugins/fb-lane-coordination/tools/fb-lane.cjs']);
run('root session module syntax', 'node', ['--check', 'tools/fb-session.cjs']);
run('plugin session module syntax', 'node', ['--check', 'plugins/fb-lane-coordination/tools/fb-session.cjs']);
run('root eval module syntax', 'node', ['--check', 'tools/fb-eval.cjs']);
run('plugin eval module syntax', 'node', ['--check', 'plugins/fb-lane-coordination/tools/fb-eval.cjs']);
run('root session tests syntax', 'node', ['--check', 'tools/fb-session.test.cjs']);
run('plugin session tests syntax', 'node', ['--check', 'plugins/fb-lane-coordination/tools/fb-session.test.cjs']);
run('root eval tests syntax', 'node', ['--check', 'tools/fb-eval.test.cjs']);
run('plugin eval tests syntax', 'node', ['--check', 'plugins/fb-lane-coordination/tools/fb-eval.test.cjs']);

console.log('\n==> root/package CLI, session, test, skill, and six-page parity');
sameFile('tools/fb-lane.cjs', 'plugins/fb-lane-coordination/tools/fb-lane.cjs');
sameFile('tools/fb-lane.test.cjs', 'plugins/fb-lane-coordination/tools/fb-lane.test.cjs');
sameFile('tools/fb-session.cjs', 'plugins/fb-lane-coordination/tools/fb-session.cjs');
sameFile('tools/fb-session.test.cjs', 'plugins/fb-lane-coordination/tools/fb-session.test.cjs');
sameFile('tools/fb-eval.cjs', 'plugins/fb-lane-coordination/tools/fb-eval.cjs');
sameFile('tools/fb-eval.test.cjs', 'plugins/fb-lane-coordination/tools/fb-eval.test.cjs');
sameFile('skills/fb-lane-coordination/SKILL.md', 'plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md');
sameFile('skills/project-coordination-setup/SKILL.md', 'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md');
for (const page of ['README.md', 'start.md', 'workflow.md', 'evidence.md', 'guardrails.md', 'sessions.md', 'evals.md']) {
  sameFile(`docs/fb/${page}`, `plugins/fb-lane-coordination/docs/fb/${page}`);
}

console.log('\n==> legacy runtime/configuration entry points remain absent');
for (const file of ['.mcp.json', 'tools/run_lane.py', 'CLAUDE.md', 'templates/CLAUDE.md']) {
  requireAbsent(file);
}

console.log('\n==> active Codex guides and demo remain Codex-only');
for (const file of [
  'docs/loop-engineering.md',
  'docs/setup.md',
  'platforms/codex/README.md',
  'plugins/fb-lane-coordination/README.md',
  'examples/my-app/README.md',
  'codex-lane-demo/AGENTS.md',
]) {
  checkActiveCodexSurface(file);
}
requireAbsent('codex-lane-demo/CLAUDE.md');

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
run('focused session tests', 'node', ['tools/fb-session.test.cjs']);
run('focused eval tests', 'node', ['tools/fb-eval.test.cjs']);

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
