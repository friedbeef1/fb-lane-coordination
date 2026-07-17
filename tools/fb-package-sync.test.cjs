#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { spawnSync } = require('child_process');

const { loadManifest, syncPackage } = require('./fb-package-sync.cjs');
const syncScript = path.join(__dirname, 'fb-package-sync.cjs');

function makeRepo(files, manifest = Object.keys(files)) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-package-sync-'));
  fs.mkdirSync(path.join(repoRoot, 'tools'), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, 'tools', 'fb-package-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  for (const [relativePath, contents] of Object.entries(files)) {
    const file = path.join(repoRoot, relativePath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  }
  return repoRoot;
}

test('check reports missing and changed targets without rewriting them', () => {
  const repoRoot = makeRepo({
    'tools/runtime.cjs': 'canonical runtime\n',
    'docs/fb/start.md': 'canonical guide\n',
  });
  const changedTarget = path.join(
    repoRoot,
    'plugins/fb-lane-coordination/tools/runtime.cjs'
  );
  fs.mkdirSync(path.dirname(changedTarget), { recursive: true });
  fs.writeFileSync(changedTarget, 'package edit\n');

  const cli = spawnSync(process.execPath, [syncScript, '--check'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.strictEqual(cli.status, 1);
  assert.match(cli.stdout, /changed: plugins\/fb-lane-coordination\/tools\/runtime\.cjs/);
  assert.match(cli.stdout, /missing: plugins\/fb-lane-coordination\/docs\/fb\/start\.md/);

  const result = syncPackage(repoRoot, { write: false });

  assert.deepStrictEqual(result.checked, [
    'plugins/fb-lane-coordination/tools/runtime.cjs',
    'plugins/fb-lane-coordination/docs/fb/start.md',
  ]);
  assert.deepStrictEqual(result.drift, [
    'changed: plugins/fb-lane-coordination/tools/runtime.cjs',
    'missing: plugins/fb-lane-coordination/docs/fb/start.md',
  ]);
  assert.strictEqual(fs.readFileSync(changedTarget, 'utf8'), 'package edit\n');
  assert.ok(
    !fs.existsSync(
      path.join(repoRoot, 'plugins/fb-lane-coordination/docs/fb/start.md')
    )
  );
});

test('write creates exact declared targets and leaves no temporary files', () => {
  const repoRoot = makeRepo({
    'tools/runtime.cjs': Buffer.from([0, 1, 2, 255]),
    'docs/fb/start.md': 'canonical guide\n',
  });

  const cli = spawnSync(process.execPath, [syncScript, '--write'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.strictEqual(cli.status, 0, cli.stderr);
  const result = syncPackage(repoRoot, { write: false });

  assert.deepStrictEqual(result.drift, []);
  for (const source of loadManifest(repoRoot)) {
    const target = path.join(repoRoot, 'plugins/fb-lane-coordination', source);
    assert.deepStrictEqual(
      fs.readFileSync(target),
      fs.readFileSync(path.join(repoRoot, source))
    );
  }
  const packageFiles = fs
    .readdirSync(path.join(repoRoot, 'plugins/fb-lane-coordination/tools'))
    .sort();
  assert.deepStrictEqual(packageFiles, ['runtime.cjs']);
});

test('check reports an undeclared root/package tool as extra', () => {
  const repoRoot = makeRepo({ 'tools/runtime.cjs': 'canonical\n' });
  fs.writeFileSync(path.join(repoRoot, 'tools', 'left-behind.cjs'), 'old canonical\n');
  const target = path.join(repoRoot, 'plugins', 'fb-lane-coordination', 'tools', 'left-behind.cjs');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, 'old package\n');

  assert.deepStrictEqual(syncPackage(repoRoot, { write: false }).drift, [
    'missing: plugins/fb-lane-coordination/tools/runtime.cjs',
    'extra: plugins/fb-lane-coordination/tools/left-behind.cjs',
  ]);
});

test('write rejects a generated target whose parent escapes through a symlink', () => {
  const repoRoot = makeRepo({ 'tools/runtime.cjs': 'canonical\n' });
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-package-outside-'));
  const packageRoot = path.join(repoRoot, 'plugins', 'fb-lane-coordination');
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.symlinkSync(outside, path.join(packageRoot, 'tools'));

  assert.throws(() => syncPackage(repoRoot, { write: true }), /symbolic link|symlink/i);
  assert.ok(!fs.existsSync(path.join(outside, 'runtime.cjs')));
});

test('write preserves the canonical executable mode', () => {
  const repoRoot = makeRepo({ 'tools/runtime.cjs': '#!/usr/bin/env node\n' });
  fs.chmodSync(path.join(repoRoot, 'tools', 'runtime.cjs'), 0o755);

  syncPackage(repoRoot, { write: true });

  const targetMode = fs.statSync(
    path.join(repoRoot, 'plugins', 'fb-lane-coordination', 'tools', 'runtime.cjs')
  ).mode & 0o777;
  assert.strictEqual(targetMode, 0o755);
});

test('manifest accepts only unique safe root-relative paths', async (t) => {
  const invalid = [
    { name: 'absolute path', manifest: ['/tmp/escape'], pattern: /absolute/i },
    { name: 'parent traversal', manifest: ['docs/../escape'], pattern: /\.\./ },
    {
      name: 'duplicate source and target',
      manifest: ['docs/fb/start.md', 'docs/fb/start.md'],
      pattern: /duplicate/i,
    },
    {
      name: 'pre-prefixed package target',
      manifest: ['plugins/fb-lane-coordination/escape'],
      pattern: /canonical root/i,
    },
  ];

  for (const fixture of invalid) {
    await t.test(fixture.name, () => {
      const repoRoot = makeRepo({}, fixture.manifest);
      assert.throws(() => loadManifest(repoRoot), fixture.pattern);
    });
  }
});
