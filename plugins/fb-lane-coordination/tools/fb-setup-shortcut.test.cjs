#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const containingRoot = path.resolve(__dirname, '..');
const isPackagedCopy = path.basename(containingRoot) === 'fb-lane-coordination'
  && path.basename(path.resolve(containingRoot, '..')) === 'plugins';
const repoRoot = isPackagedCopy ? null : containingRoot;
const pluginRoot = isPackagedCopy
  ? containingRoot
  : path.join(repoRoot, 'plugins', 'fb-lane-coordination');

function read(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const canonicalSkill = read(isPackagedCopy ? pluginRoot : repoRoot, 'skills/fb-setup/SKILL.md');
const packagedSkill = read(pluginRoot, 'skills/fb-setup/SKILL.md');

assert.strictEqual(packagedSkill, canonicalSkill, 'packaged fb-setup must be generated from the canonical skill');
assert.match(canonicalSkill, /^name:\s*fb-setup$/m);
assert.match(canonicalSkill, /REQUIRED SUB-SKILL:[\s\S]{0,100}project-coordination-setup/i);
assert.match(canonicalSkill, /canonical\s+setup\s+workflow/i);
assert.match(canonicalSkill, /seven repository-scoped/i);
assert.match(canonicalSkill, /leave(?:s)? (?:all )?(?:new )?tasks idle/i);
assert.match(canonicalSkill, /does not invoke `?\$bfm`?/i);
assert.match(canonicalSkill, /safe to run again/i);
assert.ok(canonicalSkill.split('\n').length <= 45, 'fb-setup must remain a thin alias, not a duplicated setup manual');

const primarySurfaces = isPackagedCopy
  ? [
      ['packaged README', pluginRoot, 'README.md'],
      ['packaged start guide', pluginRoot, 'docs/fb/start.md'],
    ]
  : [
      ['README', repoRoot, 'README.md'],
      ['Codex guide', repoRoot, 'platforms/codex/README.md'],
      ['setup guide', repoRoot, 'docs/setup.md'],
      ['FAQ', repoRoot, 'FAQ.md'],
      ['start guide', repoRoot, 'docs/fb/start.md'],
      ['packaged README', pluginRoot, 'README.md'],
    ];

for (const [label, root, relativePath] of primarySurfaces) {
  const source = read(root, relativePath);
  assert.match(source, /\$fb-setup/, `${label} must show the exact setup shortcut`);
  assert.doesNotMatch(source, /(?:invoke|run|say)\s+`\/fb-setup`/i, `${label} must not claim a slash command exists`);
}

for (const [label, root, relativePath] of [
  ['setup guide', isPackagedCopy ? pluginRoot : repoRoot, isPackagedCopy ? 'README.md' : 'docs/setup.md'],
  ['setup shortcut', isPackagedCopy ? pluginRoot : repoRoot, 'skills/fb-setup/SKILL.md'],
  ['canonical setup workflow', isPackagedCopy ? pluginRoot : repoRoot, 'skills/project-coordination-setup/SKILL.md'],
]) {
  const source = read(root, relativePath);
  assert.match(source, /safe to run again/i, `${label} must explain repeat setup in plain language`);
  assert.match(source, /only (?:what|roles|tasks|setup)[\s\S]{0,80}(?:missing|outdated)/i, `${label} must explain what a repeat setup changes`);
  assert.match(source, /preserv(?:e|es|ed|ing) existing (?:project\s+)?work/i, `${label} must explain that existing work is preserved`);
  assert.doesNotMatch(source, /\bidempotent(?:ly)?\b/i, `${label} must not use idempotent jargon in setup-facing guidance`);
}

assert.match(
  read(isPackagedCopy ? pluginRoot : repoRoot, 'skills/project-coordination-setup/SKILL.md'),
  /report[\s\S]{0,100}`FB setup is safe to run again:/i,
  'setup workflow must require a plain-language Codex completion status',
);

const setupGuide = read(isPackagedCopy ? pluginRoot : repoRoot, isPackagedCopy
  ? 'skills/project-coordination-setup/SKILL.md'
  : 'docs/setup.md');
assert.match(setupGuide, /\$fb-lane-coordination:project-coordination-setup|long-form skill invocation/i);
assert.match(setupGuide, /Set up FB in this project\.|Natural-language setup requests/i);
assert.match(setupGuide, /compatib|fallback/i);

if (!isPackagedCopy) {
  const manifest = JSON.parse(read(repoRoot, 'tools/fb-package-manifest.json'));
  assert.ok(manifest.includes('skills/fb-setup/SKILL.md'), 'package manifest must generate the shortcut skill');
  assert.ok(manifest.includes('tools/fb-setup-shortcut.test.cjs'), 'package manifest must generate the shortcut contract');
}

console.log('FB setup shortcut contract passed.');
