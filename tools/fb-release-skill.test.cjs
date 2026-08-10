#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const skillPath = path.join(root, 'skills', 'fb-release', 'SKILL.md');

assert.ok(fs.existsSync(skillPath), 'fb-release must exist as a canonical model-invoked skill');
const skill = fs.readFileSync(skillPath, 'utf8');
const frontmatter = skill.match(/^---\n([\s\S]*?)\n---\n/)?.[1] || '';

assert.match(frontmatter, /^name:\s*fb-release$/m);
assert.match(
  frontmatter,
  /^description:\s*Use only when the user explicitly says Push Live in the Product\/BFM main task\.$/m,
  'the always-loaded description must remain a narrow trigger rather than a release summary',
);
assert.doesNotMatch(frontmatter, /disable-model-invocation/i, 'fb-release must remain model-invoked');
assert.equal(frontmatter.split('\n').filter(line => /^[a-z][a-z0-9_-]*:/i.test(line)).length, 2);

assert.match(skill, /current conversation/i, 'release authority must come from the current conversation');
assert.match(skill, /exact (?:task|Product\/BFM).*candidate|exact candidate/i);
assert.match(skill, /branch[\s\S]{0,180}base\s+commit[\s\S]{0,180}candidate\s+commit/i);
assert.match(skill, /workstream[\s\S]{0,160}sidechat[\s\S]{0,220}(?:route|handoff)[\s\S]{0,120}(?:stop|release nothing)/i);

assert.match(
  skill,
  /node tools\/fb-release-preflight\.cjs --task <TASK-ID> --phase candidate --base <BASE-COMMIT> --candidate <CANDIDATE-COMMIT>/,
  'the skill must run the repository-defined targeted release preflight against the pinned candidate',
);
assert.match(skill, /preflight[\s\S]{0,160}(?:before|precedes)[\s\S]{0,160}(?:broad|release instruction)/i);
assert.match(skill, /repository(?:'s|-defined)? release instructions/i);

assert.match(skill, /codex plugin marketplace list --json/);
assert.match(skill, /marketplaceSource\.sourceType/);
assert.match(skill, /`git`[\s\S]{0,260}marketplace upgrade/i);
assert.match(skill, /`local`[\s\S]{0,300}(?:configured root|marketplace root)/i);
assert.match(skill, /unknown[\s\S]{0,100}stop/i);
assert.match(skill, /merge[\s\S]{0,220}publish[\s\S]{0,220}reinstall/i);
assert.match(skill, /exact build/i);

assert.match(skill, /codex plugin list --json/);
assert.match(skill, /active install(?:ed)? (?:artifact|runtime|cache)/i);
assert.match(skill, /(?:byte|hash)/i);
assert.match(skill, /skill[\s\S]{0,180}runtime[\s\S]{0,180}manifest/i);
assert.match(skill, /root-only source-layout test/i);

for (const record of ['board', 'handoff', 'index', 'QA', 'changelog', 'Git']) {
  assert.match(skill, new RegExp(`\\b${record}\\b`, 'i'), `release closeout must reconcile ${record}`);
}
assert.match(skill, /phase live/i, 'live records must receive a final targeted preflight');
assert.match(skill, /new Codex task/i, 'replacement must end by requiring fresh task context');

for (const leaked of [
  /0\.7\.1-beta/,
  /202608\d+/,
  /friedbeef1/,
  /\/Users\//,
  /fb-setup-release/,
]) {
  assert.doesNotMatch(skill, leaked, 'public skill copy must not contain release-specific private details');
}

assert.ok(skill.split('\n').length <= 105, 'fb-release must stay concise and operational');

console.log('FB release skill contract passed.');
