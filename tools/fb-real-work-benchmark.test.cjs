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
const {compilePublicFacts, compileTreatment} = require('./fb-real-work-context.cjs');
const {gradeCandidate} = require('./fb-real-work-grader.cjs');
const {
  parseCodexJsonl,
  redactEvents,
  runFirstPass,
  runRepair,
} = require('./fb-real-work-runner.cjs');

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

test('gives both treatments identical facts without leaking hidden controls', () => {
  for (const task of loadTaskRegistry()) {
    const facts = compilePublicFacts(task);
    const vanilla = compileTreatment('vanilla', facts);
    const graph = compileTreatment('graph', facts);
    assert.equal(vanilla.publicFactsSha256, graph.publicFactsSha256);
    assert.equal(vanilla.graphPacket, null);
    assert.ok(graph.graphPacket);
    assert.equal(JSON.stringify(vanilla).includes('hiddenGrader'), false);
    assert.equal(JSON.stringify(graph).includes('acceptanceCommits'), false);
    assert.equal(vanilla.prompt.includes('Preventive Graph'), false);
  }
});

test('all untouched historical starts fail and historical accepted trees pass', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-real-work-grade-'));
  try {
    for (const task of loadTaskRegistry()) {
      const start = path.join(base, `${task.id}-start`);
      const accepted = path.join(base, `${task.id}-accepted`);
      exportFixture(task, start);
      exportFixture({...task, startCommit: task.acceptanceCommits.at(-1)}, accepted);
      assert.equal(gradeCandidate(task.id, start).pass, false, `${task.id} start unexpectedly passed`);
      assert.equal(gradeCandidate(task.id, accepted).pass, true, `${task.id} accepted tree failed`);
    }
  } finally {
    fs.rmSync(base, {recursive: true, force: true});
  }
});

test('empty expected filenames cannot fool a grader', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-real-work-empty-'));
  try {
    fs.mkdirSync(path.join(root, 'src'), {recursive: true});
    fs.writeFileSync(path.join(root, 'src', 'IntroScreen.tsx'), '');
    assert.equal(gradeCandidate('unmirror-intro', root).pass, false);
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});

test('parses authoritative Codex usage and rejects malformed JSONL', () => {
  const parsed = parseCodexJsonl([
    JSON.stringify({type:'thread.started', thread_id:'thread-123', message:'private'}),
    JSON.stringify({type:'turn.completed', usage:{input_tokens:100,cached_input_tokens:25,output_tokens:40,total_tokens:140}}),
  ].join('\n'));
  assert.equal(parsed.sessionId, 'thread-123');
  assert.deepEqual(parsed.usage, {
    inputTokens:100,cachedInputTokens:25,outputTokens:40,totalTokens:140,authoritative:true,
  });
  assert.equal(JSON.stringify(redactEvents(parsed.events)).includes('private'), false);
  assert.throws(() => parseCodexJsonl('{not json}\n'), /Malformed/);
  assert.equal(parseCodexJsonl('{"type":"done"}\n').usage.authoritative, false);
});

test('runs one bounded fake Codex pass and one repair only', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-real-work-runner-'));
  const fixture = path.join(root, 'fixture');
  const fake = path.join(root, 'fake-codex.cjs');
  fs.mkdirSync(fixture);
  fs.writeFileSync(path.join(fixture, 'source.txt'), 'start\n');
  fs.writeFileSync(fake, [
    "const fs=require('node:fs');",
    "const path=require('node:path');",
    "const input=fs.readFileSync(0,'utf8');",
    "fs.writeFileSync(path.join(process.cwd(),'source.txt'), input.includes('consolidated repair')?'repaired\\n':'candidate\\n');",
    "process.stdout.write(JSON.stringify({type:'thread.started',thread_id:'thread-fake'})+'\\n');",
    "process.stdout.write(JSON.stringify({type:'turn.completed',usage:{input_tokens:11,cached_input_tokens:2,output_tokens:7,total_tokens:18}})+'\\n');",
  ].join('\n'));
  try {
    const first = await runFirstPass({
      runId:'fake-vanilla',taskId:'fake',arm:'vanilla',fixtureDir:fixture,allowedRoot:root,
      prompt:'implement',timeoutMs:5000,command:process.execPath,commandPrefix:[fake],commandArgs:[],
    });
    assert.equal(first.exitCode, 0);
    assert.equal(first.sessionId, 'thread-fake');
    assert.equal(first.usage.authoritative, true);
    const repaired = await runRepair(first, {
      passed:false,failedPublicChecks:['proof'],observedOutput:'failed',requiredAcceptance:['pass'],
    });
    assert.equal(repaired.repairCount, 1);
    assert.equal(fs.readFileSync(path.join(fixture,'source.txt'),'utf8'), 'repaired\n');
    await assert.rejects(() => runRepair(repaired, {passed:false}), /Second repair/);
  } finally {
    fs.rmSync(root, {recursive:true, force:true});
  }
});

test('times out fake Codex and rejects run-directory escape', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-real-work-timeout-'));
  const fixture = path.join(root, 'fixture');
  const fake = path.join(root, 'slow.cjs');
  fs.mkdirSync(fixture);
  fs.writeFileSync(fake, "setTimeout(()=>{}, 5000)\n");
  try {
    const evidence = await runFirstPass({
      runId:'fake-timeout',taskId:'fake',arm:'graph',fixtureDir:fixture,allowedRoot:root,
      prompt:'wait',timeoutMs:30,command:process.execPath,commandPrefix:[fake],commandArgs:[],
    });
    assert.equal(evidence.timedOut, true);
    await assert.rejects(() => runFirstPass({
      runId:'escape',taskId:'fake',arm:'graph',fixtureDir:os.tmpdir(),allowedRoot:root,
      prompt:'bad',command:process.execPath,commandPrefix:[fake],commandArgs:[],
    }), /escapes/);
  } finally {
    fs.rmSync(root, {recursive:true, force:true});
  }
});
