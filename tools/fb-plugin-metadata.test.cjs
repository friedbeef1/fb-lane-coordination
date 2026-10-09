#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const packaged = path.basename(root) === 'fb-lane-coordination' && path.basename(path.dirname(root)) === 'plugins';
const plugin = packaged ? root : path.join(root, 'plugins/fb-lane-coordination');
function validate(candidate) {
  const read = file => fs.readFileSync(path.join(candidate,file),'utf8');
  const manifest = JSON.parse(read('.codex-plugin/plugin.json'));
  const legacy = JSON.parse(read('plugin.json'));
  assert.match(manifest.version,/^0\.10\.5-beta\+codex\.\d{14}$/);
  assert.equal(legacy.version,manifest.version);
  assert.equal(manifest.name,'fb-lane-coordination');
  assert.equal(manifest.interface.displayName,'Flow Builder (FB)');
  assert.ok(read('README.md').includes(manifest.version));
  assert.equal(fs.existsSync(path.join(candidate,'.mcp.json')),false);
  assert.equal(manifest.mcpServers,undefined);
  assert.match(manifest.interface.longDescription,/No FB-hosted service or required MCP server/);
  assert.ok(manifest.interface.defaultPrompt.length <= 3, 'portal allows at most three conversation starters');
  for (const prompt of manifest.interface.defaultPrompt) assert.ok(prompt.length <= 128, 'portal starter must be at most 128 characters');
  assert.match(manifest.interface.defaultPrompt.join('\n'),/preview, then proceed/);
  assert.match(read('docs/fb/autonomy.md'),/five unsuccessful attempts on that issue/);
  assert.match(read('docs/fb/autonomy.md'),/distinct supported correction/);
  for(const skill of ['bfm','fb-product','fb-user','fb-business','fb-design','fb-tech','fb-discovery','fb-bugs','fb-setup','fb-release']) {
    const source=read(`skills/${skill}/SKILL.md`);
    assert.match(source,/^---\n[\s\S]*?name:\s*\S[\s\S]*?description:\s*\S[\s\S]*?\n---/);
  }
  assert.match(read('skills/bfm/SKILL.md'),/autonomy\.md/);
  assert.match(read('skills/fb-product/SKILL.md'),/autonomy\.md/);
  assert.match(read('docs/fb/autonomy.md'),/five unsuccessful attempts/);
  assert.match(read('docs/fb/autonomy.md'),/handoff notification is not/);
  assert.match(read('docs/fb/autonomy.md'),/Push Live/);
  assert.ok(read('PRIVACY.md').length>1000);
  for(const asset of [manifest.interface.composerIcon,manifest.interface.logo])assert.ok(fs.existsSync(path.resolve(candidate,asset)));
  return manifest.version;
}
const version=validate(plugin);
if(!packaged) {
  for(const file of ['README.md','CHANGELOG.md','docs/setup.md','docs/versioning.md','platforms/codex/README.md','docs/handoffs/TASK-098.md','docs/qa/TASK-098.md'])
    assert.ok(fs.readFileSync(path.join(root,file),'utf8').includes(version),`${file} must name current exact build`);
  const marketplace=JSON.parse(fs.readFileSync(path.join(root,'.agents/plugins/marketplace.json')));
  assert.equal(marketplace.name,'fb-lane');
  assert.equal(marketplace.interface.displayName,'Flow Builder (FB)');
}
console.log(`Flow Builder metadata and local-command contract passed: ${version}`);
