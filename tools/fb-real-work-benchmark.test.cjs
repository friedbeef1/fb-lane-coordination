const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {
  loadTaskRegistry,
  loadRetrospectiveRegistry,
  validateRegistry,
} = require('./fb-real-work-benchmark-lib.cjs');
const {exportFixture, scanFixture} = require('./fb-real-work-fixture.cjs');

test('freezes six paired tasks and an 18-task real-work mix', () => {
  const tasks = loadTaskRegistry();
  const retrospective = loadRetrospectiveRegistry();
  assert.equal(tasks.length, 6);
  assert.equal(retrospective.length, 18);
  assert.deepEqual(tasks.map(task => task.id), [
    'unmirror-intro',
    'unmirror-saved-capture',
    'unmirror-native-analytics',
    'meja-scroll',
    'meja-pairing',
    'meja-redesign',
  ]);
  assert.doesNotThrow(() => validateRegistry(tasks, retrospective));
});

test('rejects duplicate, unsafe, or unapproved registry rows', () => {
  const tasks = loadTaskRegistry();
  const retrospective = loadRetrospectiveRegistry();
  assert.throws(() => validateRegistry([...tasks, tasks[0]], retrospective), /cardinality/);
  assert.throws(
    () => validateRegistry(tasks.map((task, index) => index ? task : {...task, sourceRepo: '/tmp/other'}), retrospective),
    /Unapproved source/,
  );
  assert.throws(
    () => validateRegistry(tasks.map((task, index) => index ? task : {...task, startCommit: '../main'}), retrospective),
    /Unsafe commit/,
  );
});

test('exports a historical tree without git history or forbidden files', () => {
  const source = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-real-work-source-'));
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-real-work-target-'));
  try {
    spawnSync('git', ['init', '-q'], {cwd: source});
    fs.writeFileSync(path.join(source, 'package.json'), '{"scripts":{"test":"node --test"}}\n');
    fs.writeFileSync(path.join(source, '.env'), 'SECRET=value\n');
    fs.mkdirSync(path.join(source, 'docs', 'handoffs'), {recursive: true});
    fs.writeFileSync(path.join(source, 'docs', 'handoffs', 'old.md'), 'history\n');
    spawnSync('git', ['add', '.'], {cwd: source});
    spawnSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'fixture'], {cwd: source});
    const commit = spawnSync('git', ['rev-parse', 'HEAD'], {cwd: source, encoding: 'utf8'}).stdout.trim();
    const task = {
      id: 'fixture',
      sourceRepo: source,
      startCommit: commit,
    };
    const {ALLOWED_REPOS} = require('./fb-real-work-benchmark-lib.cjs');
    ALLOWED_REPOS.add(source);
    const receipt = exportFixture(task, target);
    assert.equal(fs.existsSync(path.join(target, '.git')), false);
    assert.equal(fs.existsSync(path.join(target, '.env')), false);
    assert.equal(fs.existsSync(path.join(target, 'docs', 'handoffs', 'old.md')), false);
    assert.equal(receipt.startCommit, commit);
    assert.match(receipt.exportedFilesSha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(scanFixture(target).rejected, []);
  } finally {
    fs.rmSync(source, {recursive: true, force: true});
    fs.rmSync(target, {recursive: true, force: true});
  }
});

test('rejects unapproved repositories and secret-bearing retained files', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-real-work-scan-'));
  try {
    assert.throws(
      () => exportFixture({id: 'bad', sourceRepo: '/tmp/not-approved', startCommit: 'abcdef1'}, target),
      /Unapproved source/,
    );
    fs.writeFileSync(path.join(target, 'config.txt'), 'api_key="abcdefghijklmnopqrstuvwx"\n');
    assert.match(scanFixture(target).rejected.join('\n'), /secret marker/);
  } finally {
    fs.rmSync(target, {recursive: true, force: true});
  }
});
