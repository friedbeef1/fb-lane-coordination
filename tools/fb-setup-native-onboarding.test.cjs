#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const skill = fs.readFileSync(
  path.join(root, 'skills/project-coordination-setup/SKILL.md'),
  'utf8',
);
const onboarding = require('./fb-onboarding.cjs');
const packageManifest = JSON.parse(fs.readFileSync(
  path.join(root, 'tools/fb-package-manifest.json'),
  'utf8',
));

assert.ok(
  packageManifest.includes('tools/fb-setup-native-onboarding.test.cjs'),
  'the focused contract must be declared for Task 6 package generation',
);

const roles = ['Product/BFM', 'User', 'Business', 'Design', 'Tech', 'Discovery', 'Bugs'];
for (const role of roles) {
  assert.match(skill, new RegExp(`\\b${role.replace('/', '\\/')}\\b`), `setup must cover ${role}`);
}

const projectDiscovery = skill.indexOf('list_projects');
const taskDiscovery = skill.indexOf('list_threads');
const plan = skill.indexOf('fb-onboarding.cjs plan');
const create = skill.indexOf('create_thread');
const rename = skill.indexOf('set_thread_title');
const pin = skill.indexOf('set_thread_pinned');
const relist = skill.indexOf('Re-list');
const reconcile = skill.indexOf('fb-onboarding.cjs reconcile');

for (const [label, index] of [
  ['project discovery', projectDiscovery],
  ['task discovery', taskDiscovery],
  ['strict plan', plan],
  ['native create', create],
  ['native rename', rename],
  ['native pin', pin],
  ['complete re-list', relist],
  ['strict reconcile', reconcile],
]) {
  assert.notStrictEqual(index, -1, `setup must define ${label}`);
}
assert.ok(
  projectDiscovery < taskDiscovery
    && taskDiscovery < plan
    && plan < create
    && plan < rename
    && plan < pin
    && create < relist
    && rename < relist
    && pin < relist
    && relist < reconcile,
  'setup must run exact-project discovery -> strict plan -> native actions -> re-list -> strict reconcile',
);

assert.match(skill, /exact project ID[\s\S]{0,180}canonical repository path/i);
assert.match(skill, /exact-project inventory[\s\S]{0,120}(?:proven )?complete/i);
assert.match(skill, /execute only[\s\S]{0,120}(?:actions|action objects)[\s\S]{0,120}(?:returned|emitted)[\s\S]{0,120}(?:plan|planner)/i);
assert.match(skill, /reuse[\s\S]{0,160}(?:no native action|do not mutate|never mutate)/i);

assert.match(skill, /attempt(?:ed)? action ledger/i);
assert.match(skill, /Before each[\s\S]{0,100}native tool call[\s\S]{0,160}attempted action ledger/i);
assert.match(skill, /Record[\s\S]{0,100}(?:result|failure)[\s\S]{0,100}after each native tool\s+call/i);
assert.match(skill, /created task[\s\S]{0,220}set_thread_title[\s\S]{0,160}(?:plan|action)[\s\S]{0,80}title/i);
assert.match(skill, /partial[\s-]failure[\s\S]{0,180}(?:unreconciled|do not reconcile|must not reconcile)/i);
assert.match(skill, /stop[\s\S]{0,180}role-specific[\s\S]{0,180}manual fallback/i);
assert.match(skill, /newly created[\s\S]{0,180}(?:never|do not)[\s\S]{0,80}(?:create|recreate)[\s\S]{0,80}duplicate/i);
assert.match(skill, /rerun[\s\S]{0,180}(?:complete inventory|plan)[\s\S]{0,180}create only[\s\S]{0,120}(?:still missing|missing)/i);
assert.match(skill, /all seven[\s\S]{0,320}exact\s+titles?[\s\S]{0,180}pinned/i);

assert.strictEqual(
  onboarding.reconcileRepositoryTaskInventory,
  undefined,
  'Node onboarding must expose planning/verification, not a fake native-action executor',
);
assert.strictEqual(typeof onboarding.planRepositoryTaskInventory, 'function');
assert.strictEqual(typeof onboarding.verifyRepositoryTaskInventory, 'function');

assert.match(skill, /Node CLI[\s\S]{0,180}(?:does not|cannot)[\s\S]{0,180}(?:sidebar|Codex-native|native task)/i);
assert.match(skill, /Pinning never[\s\S]{0,180}\$bfm/i);
assert.match(skill, /Only \*\*Push Live\*\*[\s\S]{0,120}(?:merge|deploy|release)/i);

console.log('FB setup native onboarding contract passed.');
