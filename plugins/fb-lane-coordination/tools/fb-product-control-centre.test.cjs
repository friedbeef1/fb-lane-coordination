#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { scanWorkstreamHandoffs } = require('./fb-lane.cjs');

const root = path.resolve(__dirname, '..');
const packaged = path.basename(root) === 'fb-lane-coordination'
  && path.basename(path.dirname(root)) === 'plugins';
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const PUBLIC_MODEL = 'six evidence-producing workstreams plus one Product/BFM control centre and seven pinned repository-scoped Codex tasks';
const publicModelPattern = () => new RegExp(PUBLIC_MODEL.split(' ').join('\\s+').replace('/', '\\/'), 'i');
const EVIDENCE_ORDER = /User[\s\S]*Business[\s\S]*Design[\s\S]*Tech[\s\S]*Discovery[\s\S]*Bugs/;

const user = read('skills/fb-user/SKILL.md');
assert.match(user, /^name:\s*fb-user$/m);
assert.match(user, /user needs[\s\S]*user outcomes[\s\S]*requirements[\s\S]*feedback[\s\S]*acceptance criteria/i);
assert.match(user, /planning\/evidence workstream/i);
assert.match(user, /lane:\s*fb-user[\s\S]{0,80}status:\s*ready/i);
assert.match(user, /\$bfm[\s\S]{0,120}Product\/BFM/i);
assert.match(user, /pinning never starts work/i);

const product = read('skills/fb-product/SKILL.md');
assert.match(product, /^name:\s*fb-product$/m);
assert.match(product, /`fb-product`[\s\S]{0,80}technical identifier/i);
assert.match(product, /Product\/BFM control centre/i);
assert.match(product, /not (?:an|a seventh) evidence-producing workstream/i);
assert.match(product, /`?\$bfm`? executes only in Product\/BFM/i);
assert.match(product, /pinning never starts work/i);
assert.doesNotMatch(product, /Product\/User/);

for (const name of ['fb-user', 'fb-business', 'fb-design', 'fb-tech', 'fb-discovery', 'fb-bugs']) {
  const skill = read(`skills/${name}/SKILL.md`);
  assert.match(skill, EVIDENCE_ORDER, `${name} must name the evidence workstreams in canonical order`);
  assert.match(skill, /Product\/BFM control\s+centre/i, `${name} must route delivery to the control centre`);
  assert.match(skill, /\$bfm[\s\S]{0,140}Product\/BFM/i, `${name} must route $bfm to Product/BFM`);
}

const bfm = read('skills/bfm/SKILL.md');
assert.match(bfm, /Only the Product\/BFM main task may continue/);
assert.match(bfm, /planRepositoryTaskInventory/);
assert.match(bfm, /needs-reconciliation/i);
assert.match(bfm, /canonical seven roles/i);
assert.doesNotMatch(bfm, /permission is granted and `reconciledAt` is absent/i);
assert.match(bfm, /product,\s*user,\s*business,\s*design,\s*tech,\s*discovery,\s*bugs/i);
assert.match(bfm, /seven[\s\S]{0,100}(?:tasks|titles)[\s\S]{0,100}pinned/i);
assert.match(bfm, /pinning never starts work/i);

const setup = read('skills/project-coordination-setup/SKILL.md');
assert.match(setup, publicModelPattern());
assert.match(setup, /Product\/User[\s\S]{0,100}legacy[\s\S]{0,100}User/i);
assert.match(setup, /lone[\s\S]{0,80}Product[\s\S]{0,80}Product\/BFM/i);

const normalizedHandoff = read('templates/docs/handoffs/normalized-handoff-template.md');
assert.match(normalizedHandoff, /^lane:\s*fb-user$/m, 'new normalized evidence handoffs must default to User');
assert.doesNotMatch(normalizedHandoff, /^lane:\s*fb-product$/m, 'new normalized evidence must not default to the Product/BFM control-centre identifier');

for (const relative of [
  'README.md',
  'docs/fb/README.md',
  'docs/fb/start.md',
  'docs/why-fb.md',
]) {
  assert.match(read(relative), publicModelPattern(), `${relative} must expose the public model exactly`);
}

const currentGuidance = [
  'README.md',
  'docs/fb/README.md',
  'docs/fb/workflow.md',
  'docs/fb/full-loop.md',
  'docs/fb/control-loop.md',
  'docs/why-fb.md',
  ...packaged ? [] : ['AGENTS.md', 'docs/versioning.md', 'docs/fb-for-agile-teams.md', 'platforms/codex/README.md'],
];
for (const relative of currentGuidance) {
  assert.doesNotMatch(read(relative), /Product\/User/, `${relative} must not present the retired combined role as current`);
}

if (!packaged) {
  const packageManifest = JSON.parse(read('tools/fb-package-manifest.json'));
  assert.ok(packageManifest.includes('skills/fb-user/SKILL.md'), 'package manifest must declare the canonical User skill');
}

const legacyManifest = packaged ? 'plugin.json' : 'plugins/fb-lane-coordination/plugin.json';
assert.match(read(legacyManifest), publicModelPattern());

const codexManifest = packaged ? '.codex-plugin/plugin.json' : 'plugins/fb-lane-coordination/.codex-plugin/plugin.json';
for (const relative of [codexManifest]) {
  const manifest = read(relative);
  assert.match(manifest, publicModelPattern(), `${relative} must describe the public model`);
  assert.match(manifest, /FB · Product\/BFM[\s\S]*FB · User[\s\S]*FB · Business[\s\S]*FB · Design[\s\S]*FB · Tech[\s\S]*FB · Discovery[\s\S]*FB · Bugs/i);
  assert.match(manifest, /pinning never starts work/i);
}

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-product-control-centre-'));
try {
  const output = execFileSync(process.execPath, [path.join(root, 'tools', 'fb-lane.cjs'), 'bootstrap'], {
    cwd: fixture,
    encoding: 'utf8',
  });
  assert.match(output, publicModelPattern());
  assert.match(output, /May I create seven repository-scoped sidebar tasks: Product\/BFM, User, Business, Design, Tech, Discovery, and Bugs\?/i);
  assert.match(output, /pinning never starts work/i);
  for (const lane of ['product', 'user', 'business', 'design', 'tech', 'discovery', 'bugs']) {
    assert.ok(fs.existsSync(path.join(fixture, 'docs', 'workstreams', `fb-${lane}.md`)), `bootstrap must create the ${lane} status card`);
  }
  const productCard = fs.readFileSync(path.join(fixture, 'docs', 'workstreams', 'fb-product.md'), 'utf8');
  assert.match(productCard, /^# FB-Product\/BFM Control Centre Status$/m);
  assert.match(productCard, /TASK-001/, 'Product/BFM card must project its generated board task');
  const userCard = fs.readFileSync(path.join(fixture, 'docs', 'workstreams', 'fb-user.md'), 'utf8');
  assert.match(userCard, /^# FB-User Workstream Status$/m);
  const board = fs.readFileSync(path.join(fixture, 'PROJECT_BOARD.md'), 'utf8');
  assert.match(board, /`Done`:[^\n]*FB Product\/BFM/i);
  assert.match(board, /\| TASK-001 \| Ready \| FB Product\/BFM \|/);
  assert.match(board, /\*\*Owner \/ Thread\*\*:\s*FB Product\/BFM/i);
  assert.match(board, /Product\/BFM control centre/i);
  assert.doesNotMatch(board, /FB-Product(?!\/BFM)/, 'generated board must not emit the retired standalone Product owner');
  const index = fs.readFileSync(path.join(fixture, 'docs/handoffs/index.md'), 'utf8');
  assert.match(index, /\| TASK-001 - Project setup \| Product\/BFM control centre \|/);
  assert.doesNotMatch(index, /FB-Product(?!\/BFM)/, 'generated index must not emit the retired standalone Product lane');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}

const handoffFixture = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-user-handoff-'));
try {
  fs.mkdirSync(path.join(handoffFixture, 'docs', 'handoffs'), { recursive: true });
  fs.writeFileSync(path.join(handoffFixture, 'docs', 'handoffs', 'user.md'), `---
type: fb-lane-handoff
task: USER-1
lane: fb-user
status: ready
---
`);
  const scan = scanWorkstreamHandoffs(handoffFixture);
  assert.deepStrictEqual(scan.candidates, ['docs/handoffs/user.md']);
  assert.deepStrictEqual(scan.workstreams.product.ready, ['docs/handoffs/user.md'], 'new User evidence must retain the historical product scanner slot');
} finally {
  fs.rmSync(handoffFixture, { recursive: true, force: true });
}

console.log('Product/BFM control-centre guidance contract passed.');
