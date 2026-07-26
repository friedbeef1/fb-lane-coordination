#!/usr/bin/env node
'use strict';

// TASK-050 focused behavior tests. This file deliberately imports the missing
// control-loop runtime first so the initial execution records the public RED.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn } = require('child_process');
const {
  routeArtifact,
  validateStageEvent,
  appendStageEvent,
  readStageEvents,
  eventLogPath,
  compareBaseline,
  aggregateGates,
  assertStageEventSummaryMarkdown,
  validateProfileManifest,
  validateGoldenFixtureManifest,
  diagnoseConfiguration,
  writeCandidateStore,
  readCandidateStore,
  compareFrozenBenchmark,
  assessCandidateProgress,
  issueFullRepairBudget,
  readFullRepairBudget,
  advanceFullRepairBudget,
  closeFullRepairBudget,
  validatePromotion,
} = require('./fb-control-loop.cjs');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function createRepo() {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-control-loop-test-'));
  const repo = path.join(parent, 'repo');
  fs.mkdirSync(repo);
  git(repo, ['init', '-q', '-b', 'main']);
  git(repo, ['config', 'user.email', 'control-loop@example.test']);
  git(repo, ['config', 'user.name', 'Control Loop Test']);
  fs.writeFileSync(path.join(repo, 'README.md'), 'fixture\n');
  git(repo, ['add', 'README.md']);
  git(repo, ['commit', '-qm', 'fixture']);
  return {
    parent,
    repo,
    cleanup() { fs.rmSync(parent, { recursive: true, force: true }); },
  };
}

function addWorktree(fixture) {
  const worktree = path.join(fixture.parent, 'linked');
  git(fixture.repo, ['worktree', 'add', '-q', '-b', 'control-loop/linked', worktree, 'main']);
  return worktree;
}

function createFullExecutionSession(cwd, sessionId = 'full-session', options = {}) {
  const common = path.resolve(cwd, git(cwd, ['rev-parse', '--git-common-dir']));
  const sessionDirectory = path.join(common, 'fb-sessions');
  const taskId = options.taskId || 'TASK-050';
  const handoffPath = path.join(cwd, 'docs', 'handoffs', `${taskId}.md`);
  fs.mkdirSync(path.dirname(handoffPath), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'PROJECT_BOARD.md'), `| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |\n|---|---|---|---|---|---|---|\n| ${taskId} | In Progress | ${options.owner || 'FB-Product / BFM + FB-Tech'} | Control | ${options.scope || 'Coordinate the Full repair'} | tools/fb-control-loop.cjs | [Handoff](docs/handoffs/${taskId}.md) |\n\n### ${taskId} - Full repair\n\nApproval: approved\n`);
  fs.writeFileSync(handoffPath, `# ${taskId}\n\nProduct decision version: ${options.decisionVersion || 'decision-v1'}\n`);
  fs.mkdirSync(sessionDirectory, { recursive: true });
  fs.writeFileSync(path.join(sessionDirectory, `${sessionId}.json`), `${JSON.stringify({
    sessionId,
    state: 'active',
    mode: 'execution',
    lane: options.lane || 'bfm',
    taskId,
    handoff: `docs/handoffs/${taskId}.md`,
    locks: ['tools/fb-control-loop.cjs'],
    milestones: [],
  }, null, 2)}\n`);
  return sessionId;
}

function mcpRequest(request, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, 'fb-lane.cjs'), 'mcp'], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => {
      stdout += chunk;
      const line = stdout.split(/\r?\n/).find(value => value.trim());
      if (!line) return;
      try {
        const response = JSON.parse(line);
        child.kill();
        resolve(response);
      } catch (error) {
        child.kill();
        reject(error);
      }
    });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('exit', code => {
      if (!stdout.trim() && code !== null) reject(new Error(stderr || `MCP server exited ${code}`));
    });
    child.stdin.end(`${JSON.stringify(request)}\n`);
  });
}

function baseEvent(overrides = {}) {
  return {
    schemaVersion: 'fb-stage-event-v1',
    eventId: 'event-001',
    timestamp: '2026-07-26T00:00:00.000Z',
    runId: 'run-001',
    sessionId: 'session-001',
    taskId: 'TASK-050',
    stage: 'route',
    capability: 'deterministic-routing',
    attempt: 1,
    decision: 'process',
    result: 'passed',
    artifactRef: 'artifacts/input.json',
    baselineRef: 'artifacts/input.json',
    candidateRef: null,
    criteriaIds: ['criterion-routing'],
    evidenceRefs: ['docs/handoffs/TASK-050.md#route'],
    failureClass: null,
    durationMs: 8,
    inputTokens: 'unavailable',
    outputTokens: 'unavailable',
    cost: 'unavailable',
    nextAction: 'Record the comparison evidence.',
    ...overrides,
  };
}

function routeInput(overrides = {}) {
  return {
    artifactRef: 'artifacts/input.json',
    description: 'Normalize an imported record.',
    metadataRef: 'metadata/import.json',
    criteriaIds: ['criterion-normalization'],
    costRisk: 'low',
    degradationRisk: 'low',
    safetyTriggers: [],
    routeRules: [{
      id: 'normalize-imports',
      decision: 'process',
      when: { descriptionIncludes: 'Normalize' },
      evidenceRefs: ['rules/normalize-imports'],
    }],
    ...overrides,
  };
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function serializedJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function serializedHash(value) {
  return sha256(serializedJson(value));
}

function baselineConfig() {
  return { mode: 'baseline' };
}

function proposedConfig() {
  return { mode: 'candidate' };
}

function profileManifest(overrides = {}) {
  return {
    schemaVersion: 'fb-profile-manifest-v1',
    profiles: [{
      id: 'reviewer-default',
      promptRef: 'profiles/reviewer.md',
      configRef: 'profiles/reviewer.json',
      baselineHash: serializedHash(baselineConfig()),
    }],
    ...overrides,
  };
}

function goldenManifest(overrides = {}) {
  return {
    schemaVersion: 'fb-golden-fixture-manifest-v1',
    cases: [{
      id: 'case-safe-output',
      label: 'Rejects unsafe output',
      artifactRef: 'fixtures/safe-output.json',
      criteriaIds: ['criterion-safety'],
      mustPass: ['criterion-safety'],
      mustNotHappen: ['credential-output'],
    }, {
      id: 'case-correct-output',
      label: 'Produces the reviewed response',
      artifactRef: 'fixtures/correct-output.json',
      criteriaIds: ['criterion-correctness'],
      mustPass: ['criterion-correctness'],
      mustNotHappen: [],
    }],
    ...overrides,
  };
}

function benchmarkRun(record, role, overrides = {}) {
  const configHash = role === 'baseline' ? record.baselineHash : record.candidateHash;
  return {
    runId: `${role}-run-001`,
    candidateId: record.candidateId,
    profileId: record.profileId,
    configHash,
    fixtureManifestHash: record.fixtureManifestHash,
    settings: { temperature: 0 },
    modelRef: 'model/reviewer-v1',
    limits: { maxTokens: 200 },
    graderContract: 'grader/reviewer-v1',
    results: record.fixtureManifest.cases.map(item => ({
      caseId: item.id,
      criteria: Object.fromEntries(item.criteriaIds.map(id => [id, 'pass'])),
      observed: [],
      evidenceRefs: [`evidence/${item.id}`],
    })),
    ...overrides,
  };
}

function candidateStoreInput(overrides = {}) {
  const baseline = baselineConfig();
  const proposed = proposedConfig();
  return {
    candidateId: 'candidate-001',
    profileManifest: profileManifest(),
    profileId: 'reviewer-default',
    baselineConfig: baseline,
    proposedConfig: proposed,
    baselineHash: serializedHash(baseline),
    candidateHash: serializedHash(proposed),
    fixtureManifest: goldenManifest(),
    results: [{ caseId: 'case-safe-output', result: 'pass', evidenceRefs: ['evidence/candidate'] }],
    promotionRecommendation: 'hold',
    ...overrides,
  };
}

test('routes a matching deterministic rule to process with cited evidence', () => {
  const result = routeArtifact(routeInput());
  assert.deepStrictEqual(result, {
    decision: 'process',
    reason: 'Matched deterministic route rule normalize-imports.',
    evidenceRefs: ['artifacts/input.json', 'metadata/import.json', 'rules/normalize-imports'],
    baselineRef: 'artifacts/input.json',
    candidateRef: null,
    transformationComputeAvoided: false,
  });
});

test('routes a matching deterministic skip without replacing the baseline artifact', () => {
  const result = routeArtifact(routeInput({ routeRules: [{
    id: 'already-current',
    decision: 'skip',
    when: { metadataRefIncludes: 'import' },
    evidenceRefs: ['metadata/import.json#current'],
  }] }));
  assert.strictEqual(result.decision, 'skip');
  assert.strictEqual(result.baselineRef, 'artifacts/input.json');
  assert.strictEqual(result.candidateRef, 'artifacts/input.json');
  assert.strictEqual(result.transformationComputeAvoided, true);
});

test('safety triggers override an otherwise matching process rule', () => {
  const result = routeArtifact(routeInput({ safetyTriggers: ['contains-personal-data'] }));
  assert.strictEqual(result.decision, 'judgment_required');
  assert.match(result.reason, /Safety trigger/i);
  assert.ok(result.evidenceRefs.includes('safety:contains-personal-data'));
});

test('returns judgment_required when deterministic rules are ambiguous', () => {
  const result = routeArtifact(routeInput({ routeRules: [
    { id: 'process-import', decision: 'process', when: { metadataRefIncludes: 'import' }, evidenceRefs: ['rules/process'] },
    { id: 'skip-import', decision: 'skip', when: { metadataRefIncludes: 'import' }, evidenceRefs: ['rules/skip'] },
  ] }));
  assert.strictEqual(result.decision, 'judgment_required');
  assert.match(result.reason, /Ambiguous/i);
  assert.deepStrictEqual(result.evidenceRefs.slice(-2), ['rules/process', 'rules/skip']);
});

test('high degradation risk preserves the baseline even when a process rule matches', () => {
  const result = routeArtifact(routeInput({ degradationRisk: 'high' }));
  assert.strictEqual(result.decision, 'skip');
  assert.strictEqual(result.baselineRef, 'artifacts/input.json');
  assert.strictEqual(result.candidateRef, 'artifacts/input.json');
  assert.strictEqual(result.transformationComputeAvoided, true);
  assert.match(result.reason, /degradation/i);
});

test('rejects nested values from flat stage events', () => {
  assert.throws(() => validateStageEvent(baseEvent({ result: { status: 'passed' } })), /flat|nested/i);
});

test('rejects secret fields and obvious credential material from stage events', () => {
  assert.throws(() => validateStageEvent(baseEvent({ apiToken: 'sk-this-must-never-be-recorded' })), /forbidden|privacy|secret|token/i);
  assert.throws(() => validateStageEvent(baseEvent({ nextAction: 'Use Bearer very-secret-credential-now.' })), /credential|privacy|forbidden/i);
  assert.throws(() => validateStageEvent(baseEvent({ nextAction: 'Use ghp_1234567890abcdefghijklmnopqrstuvwxyzABCDE.' })), /credential|privacy|forbidden/i);
  assert.throws(() => validateStageEvent(baseEvent({ nextAction: 'Never persist sk-proj-0123456789abcdefghijklmnopqrstuvwxyzABCDE.' })), /credential|privacy|forbidden/i);
});

test('appends concurrent whole JSONL events atomically', async () => {
  const fixture = createRepo();
  try {
    const modulePath = path.join(__dirname, 'fb-control-loop.cjs');
    const childCode = "const { appendStageEvent } = require(process.argv[1]); appendStageEvent(process.cwd(), JSON.parse(process.argv[2]));";
    await Promise.all(Array.from({ length: 24 }, (_, index) => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['-e', childCode, modulePath, JSON.stringify(baseEvent({ eventId: `event-${index}`, attempt: index, durationMs: index }))], {
        cwd: fixture.repo,
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      let stderr = '';
      child.stderr.on('data', chunk => { stderr += chunk; });
      child.on('error', reject);
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(stderr || `child exited ${code}`)));
    })));
    const events = readStageEvents(fixture.repo, 'run-001');
    assert.strictEqual(events.length, 24);
    assert.strictEqual(new Set(events.map(event => event.eventId)).size, 24);
    assert.strictEqual(fs.readFileSync(eventLogPath(fixture.repo, 'run-001'), 'utf8').trim().split('\n').length, 24);
  } finally {
    fixture.cleanup();
  }
});

test('reads clone-local events from a linked worktree through the shared Git common directory', () => {
  const fixture = createRepo();
  try {
    const linked = addWorktree(fixture);
    appendStageEvent(fixture.repo, baseEvent());
    assert.deepStrictEqual(readStageEvents(linked, 'run-001').map(event => event.eventId), ['event-001']);
  } finally {
    fixture.cleanup();
  }
});

test('rejects unsafe run identifiers instead of resolving a path outside the event store', () => {
  const fixture = createRepo();
  try {
    assert.throws(() => eventLogPath(fixture.repo, '../escape'), /unsafe|invalid/i);
  } finally {
    fixture.cleanup();
  }
});

test('rejects a symlinked event-store directory that escapes the Git common directory', () => {
  const fixture = createRepo();
  try {
    const common = git(fixture.repo, ['rev-parse', '--git-common-dir']);
    const commonPath = path.resolve(fixture.repo, common);
    const outside = path.join(fixture.parent, 'outside-events');
    fs.mkdirSync(outside);
    fs.symlinkSync(outside, path.join(commonPath, 'fb-lane'));
    assert.throws(() => eventLogPath(fixture.repo, 'run-001'), /symlink|unsafe/i);
  } finally {
    fixture.cleanup();
  }
});

test('rejects a symlinked run log that escapes the Git common event directory', () => {
  const fixture = createRepo();
  try {
    const target = eventLogPath(fixture.repo, 'run-001');
    const outside = path.join(fixture.parent, 'outside-run.jsonl');
    fs.writeFileSync(outside, '{}\n');
    fs.symlinkSync(outside, target);
    assert.throws(() => readStageEvents(fixture.repo, 'run-001'), /symlink|unsafe/i);
    assert.throws(() => appendStageEvent(fixture.repo, baseEvent()), /symlink|unsafe/i);
  } finally {
    fixture.cleanup();
  }
});

test('records criterion-level comparison results and selects candidate only for an evidenced improvement', () => {
  const result = compareBaseline({ criteria: [{
    id: 'criterion-output',
    required: true,
    baseline: { result: 'fail', evidenceRefs: ['evidence/baseline-output'] },
    candidate: { result: 'pass', evidenceRefs: ['evidence/candidate-output'] },
  }] });
  assert.strictEqual(result.verdict, 'candidate');
  assert.deepStrictEqual(result.criteria, [{
    id: 'criterion-output',
    required: true,
    baseline: 'fail',
    candidate: 'pass',
    baselineEvidenceRefs: ['evidence/baseline-output'],
    candidateEvidenceRefs: ['evidence/candidate-output'],
  }]);
  assert.strictEqual(Object.hasOwn(result, 'score'), false);
});

test('blocks comparison when a required criterion lacks evidence', () => {
  const result = compareBaseline({ criteria: [{
    id: 'criterion-safety',
    required: true,
    baseline: { result: 'pass', evidenceRefs: ['evidence/baseline-safety'] },
    candidate: { result: 'pass', evidenceRefs: [] },
  }] });
  assert.strictEqual(result.verdict, 'blocked');
  assert.match(result.blockedReason, /evidence/i);
});

test('selects baseline for a regression and tie for equivalent evidenced results', () => {
  const regression = compareBaseline({ criteria: [{
    id: 'criterion-regression', required: true,
    baseline: { result: 'pass', evidenceRefs: ['evidence/baseline-regression'] },
    candidate: { result: 'fail', evidenceRefs: ['evidence/candidate-regression'] },
  }] });
  assert.strictEqual(regression.verdict, 'baseline');
  const equivalent = compareBaseline({ criteria: [{
    id: 'criterion-equivalent', required: true,
    baseline: { result: 'pass', evidenceRefs: ['evidence/baseline-equivalent'] },
    candidate: { result: 'pass', evidenceRefs: ['evidence/candidate-equivalent'] },
  }] });
  assert.strictEqual(equivalent.verdict, 'tie');
});

test('requires selected gates to carry distinct evidence references', () => {
  assert.throws(() => aggregateGates({
    selectedGates: ['focused', 'comparison'],
    gates: [
      { id: 'focused', result: 'passed', evidenceRefs: ['evidence/shared'] },
      { id: 'comparison', result: 'passed', evidenceRefs: ['evidence/shared'] },
    ],
  }), /distinct/i);
});

test('rejects selected gates with no evidence instead of allowing a readiness decision', () => {
  assert.throws(() => aggregateGates({
    selectedGates: ['focused', 'comparison'],
    gates: [
      { id: 'focused', result: 'passed', evidenceRefs: [] },
      { id: 'comparison', result: 'passed', evidenceRefs: ['evidence/comparison'] },
    ],
  }), /evidence/i);
});

test('does not report Ready to ship while a required gate is unresolved', () => {
  const result = aggregateGates({
    selectedGates: ['focused', 'comparison', 'safety', 'integration', 'release'],
    gates: [
      { id: 'focused', result: 'passed', evidenceRefs: ['evidence/focused'] },
      { id: 'comparison', result: 'passed', evidenceRefs: ['evidence/comparison'] },
      { id: 'safety', result: 'passed', evidenceRefs: ['evidence/safety'] },
      { id: 'integration', result: 'unresolved', evidenceRefs: ['evidence/integration-pending'] },
      { id: 'release', result: 'passed', evidenceRefs: ['evidence/release'] },
    ],
  });
  assert.strictEqual(result.readyToShip, false);
  assert.deepStrictEqual(result.unresolvedRequiredGates, ['integration']);
});

test('rejects copied stage-event JSON regardless of key order or summary label', () => {
  assert.throws(() => assertStageEventSummaryMarkdown('{"eventId":"copied","schemaVersion":"fb-stage-event-v1"}'), /JSONL|copy/i);
});

test('requires every stage-event declaration to use the one counted clone-local summary syntax', () => {
  const fixture = createRepo();
  try {
    appendStageEvent(fixture.repo, baseEvent({ eventId: 'event-summary', runId: 'run-summary' }));
    const valid = 'Stage event summary: [run-summary](fb-lane/events/run-summary.jsonl) (1 event).';
    assert.doesNotThrow(() => assertStageEventSummaryMarkdown(valid, fixture.repo));
    assert.throws(() => assertStageEventSummaryMarkdown(`${valid}\nStage event summary: [run-summary](fb-lane/events/run-summary.jsonl) (one event).`, fixture.repo), /summary|counted|exact/i);
    assert.throws(() => assertStageEventSummaryMarkdown('[run-summary](fb-lane/events/run-summary.jsonl) (1 event).', fixture.repo), /summary|label/i);
  } finally {
    fixture.cleanup();
  }
});

test('validates stable profile and golden-fixture manifest contracts', () => {
  const profiles = validateProfileManifest(profileManifest());
  const fixtures = validateGoldenFixtureManifest(goldenManifest());
  assert.deepStrictEqual(profiles.profiles.map(profile => profile.id), ['reviewer-default']);
  assert.deepStrictEqual(fixtures.cases.map(item => item.id), ['case-safe-output', 'case-correct-output']);
  assert.deepStrictEqual(fixtures.cases[0].mustNotHappen, ['credential-output']);
});

test('rejects unsafe manifest paths and non-SHA256 baseline hashes', () => {
  assert.throws(() => validateProfileManifest(profileManifest({ profiles: [{
    id: 'reviewer-default', promptRef: '../private.md', configRef: 'profiles/reviewer.json', baselineHash: sha256('baseline'),
  }] })), /path|relative|unsafe/i);
  assert.throws(() => validateProfileManifest(profileManifest({ profiles: [{
    id: 'reviewer-default', promptRef: 'profiles/reviewer.md', configRef: 'profiles/reviewer.json', baselineHash: 'not-a-hash',
  }] })), /hash|sha256/i);
});

test('classifies curated observed failures without accepting raw transcript inputs', () => {
  const events = [baseEvent({ result: 'failed', failureClass: 'build', evidenceRefs: ['evidence/build-log'] })];
  const result = diagnoseConfiguration({
    stageEvents: events,
    evalEvidence: [],
    candidateDiff: { changedPaths: ['profiles/reviewer.json'], evidenceRefs: ['evidence/diff'] },
    observedFailures: [{ kind: 'build', evidenceRef: 'evidence/build-log' }],
  });
  assert.strictEqual(result.failureClass, 'Build failure');
  assert.throws(() => diagnoseConfiguration({ ...result, rawTranscript: 'private output' }), /curated|unknown|input/i);
});

test('classifies brief, eval, and environment failures from their curated evidence', () => {
  const base = { stageEvents: [], candidateDiff: { changedPaths: ['profiles/reviewer.json'], evidenceRefs: ['evidence/diff'] } };
  assert.strictEqual(diagnoseConfiguration({ ...base, evalEvidence: [], observedFailures: [{ kind: 'brief', evidenceRef: 'evidence/brief' }] }).failureClass, 'Brief failure');
  assert.strictEqual(diagnoseConfiguration({ ...base, evalEvidence: [{ result: 'failed', evidenceRef: 'evidence/eval' }], observedFailures: [] }).failureClass, 'Eval failure');
  assert.strictEqual(diagnoseConfiguration({ ...base, evalEvidence: [], observedFailures: [{ kind: 'environment', evidenceRef: 'evidence/environment' }] }).failureClass, 'Environment failure');
});

test('stores each candidate in its isolated clone-local directory without touching canonical configuration', () => {
  const fixture = createRepo();
  try {
    const canonical = path.join(fixture.repo, 'profiles', 'reviewer.json');
    fs.mkdirSync(path.dirname(canonical));
    fs.writeFileSync(canonical, '{"mode":"baseline"}\n');
    const manifest = goldenManifest();
    const input = candidateStoreInput({ fixtureManifest: manifest });
    const record = writeCandidateStore(fixture.repo, input);
    assert.match(record.directory, /fb-lane\/candidates\/candidate-001$/);
    assert.strictEqual(fs.lstatSync(record.directory).isFile(), true);
    assert.strictEqual(fs.readFileSync(canonical, 'utf8'), '{"mode":"baseline"}\n');
    assert.deepStrictEqual(readCandidateStore(fixture.repo, record.candidateId).fixtureManifest, manifest);
    assert.strictEqual(readCandidateStore(fixture.repo, record.candidateId).candidateHash, serializedHash(proposedConfig()));
  } finally {
    fixture.cleanup();
  }
});

test('rejects candidate-store results that are outside the frozen fixture set', () => {
  const fixture = createRepo();
  try {
    assert.throws(() => writeCandidateStore(fixture.repo, candidateStoreInput({
      candidateId: 'candidate-outside-fixture',
      results: [{ caseId: 'case-not-frozen', result: 'pass', evidenceRefs: ['evidence/candidate'] }],
    })), /frozen|fixture|case/i);
  } finally {
    fixture.cleanup();
  }
});

test('binds candidate hashes to the exact written configs and the selected profile baseline', () => {
  const fixture = createRepo();
  try {
    assert.throws(() => writeCandidateStore(fixture.repo, candidateStoreInput({ candidateHash: sha256('different config') })), /candidate.*hash|hash.*candidate|mismatch/i);
    assert.throws(() => writeCandidateStore(fixture.repo, candidateStoreInput({ profileId: 'unknown-profile' })), /profile|baseline/i);
    const mismatchedManifest = profileManifest({ profiles: [{
      id: 'reviewer-default', promptRef: 'profiles/reviewer.md', configRef: 'profiles/reviewer.json', baselineHash: sha256('different baseline'),
    }] });
    assert.throws(() => writeCandidateStore(fixture.repo, candidateStoreInput({ profileManifest: mismatchedManifest })), /baseline.*hash|hash.*baseline|profile/i);
  } finally {
    fixture.cleanup();
  }
});

test('rejects a benchmark substituted away from the candidate-store frozen manifest or config identity', () => {
  const fixture = createRepo();
  try {
    const record = writeCandidateStore(fixture.repo, candidateStoreInput());
    const baseline = benchmarkRun(record, 'baseline');
    const candidate = benchmarkRun(record, 'candidate');
    assert.throws(() => compareFrozenBenchmark(fixture.repo, {
      candidateId: record.candidateId,
      fixtureManifest: goldenManifest({ cases: [goldenManifest().cases[0]] }),
      baseline,
      candidate,
    }), /unknown|frozen|manifest/i);
    assert.throws(() => compareFrozenBenchmark(fixture.repo, {
      candidateId: record.candidateId,
      baseline,
      candidate: { ...candidate, configHash: sha256('substituted config') },
    }), /config|candidate|identity/i);
  } finally {
    fixture.cleanup();
  }
});

test('rejects incomplete and symlinked candidate targets without deleting existing data', () => {
  const fixture = createRepo();
  try {
    const common = path.resolve(fixture.repo, git(fixture.repo, ['rev-parse', '--git-common-dir']));
    const candidates = path.join(common, 'fb-lane', 'candidates');
    fs.mkdirSync(path.join(candidates, 'candidate-001'), { recursive: true });
    fs.writeFileSync(path.join(candidates, 'candidate-001', 'partial.json'), '{}\n');
    assert.throws(() => writeCandidateStore(fixture.repo, candidateStoreInput()), /exist|isolated/i);
    assert.strictEqual(fs.readFileSync(path.join(candidates, 'candidate-001', 'partial.json'), 'utf8'), '{}\n');
    fs.mkdirSync(path.join(candidates, 'candidate-empty'));
    assert.throws(() => writeCandidateStore(fixture.repo, candidateStoreInput({ candidateId: 'candidate-empty' })), /exist|isolated/i);
    assert.deepStrictEqual(fs.readdirSync(path.join(candidates, 'candidate-empty')), []);
    fs.writeFileSync(path.join(candidates, 'candidate-file'), 'preserve file\n');
    assert.throws(() => writeCandidateStore(fixture.repo, candidateStoreInput({ candidateId: 'candidate-file' })), /exist|isolated/i);
    assert.strictEqual(fs.readFileSync(path.join(candidates, 'candidate-file'), 'utf8'), 'preserve file\n');
    const outside = path.join(fixture.parent, 'outside-candidate');
    fs.mkdirSync(outside);
    fs.writeFileSync(path.join(outside, 'preserve.txt'), 'outside\n');
    fs.symlinkSync(outside, path.join(candidates, 'candidate-symlink'));
    assert.throws(() => writeCandidateStore(fixture.repo, candidateStoreInput({ candidateId: 'candidate-symlink' })), /symlink|unsafe/i);
    assert.strictEqual(fs.readFileSync(path.join(outside, 'preserve.txt'), 'utf8'), 'outside\n');
  } finally {
    fixture.cleanup();
  }
});

test('keeps candidate payload writes bound to the exclusively opened record when its parent path is replaced', () => {
  const fixture = createRepo();
  const originalWriteFile = fs.writeFileSync;
  try {
    const common = path.resolve(fixture.repo, git(fixture.repo, ['rev-parse', '--git-common-dir']));
    const candidates = path.join(common, 'fb-lane', 'candidates');
    const target = path.join(candidates, 'candidate-partial');
    const movedCandidates = path.join(common, 'fb-lane', 'candidates-owned-moved');
    let replacedParent = false;
    fs.writeFileSync = (file, ...args) => {
      if (!replacedParent && typeof file === 'number') {
        assert.strictEqual(fs.lstatSync(target).isFile(), true);
        fs.renameSync(candidates, movedCandidates);
        fs.mkdirSync(candidates, { mode: 0o700 });
        fs.writeFileSync(path.join(candidates, 'foreign.txt'), 'foreign survives\n');
        replacedParent = true;
      }
      return originalWriteFile(file, ...args);
    };
    assert.throws(() => writeCandidateStore(fixture.repo, candidateStoreInput({ candidateId: 'candidate-partial' })), /candidate|store|changed|incomplete|unsafe/i);
    assert.strictEqual(replacedParent, true);
    assert.strictEqual(fs.readFileSync(path.join(candidates, 'foreign.txt'), 'utf8'), 'foreign survives\n');
    assert.strictEqual(fs.existsSync(path.join(candidates, 'candidate-partial')), false);
    assert.match(fs.readFileSync(path.join(movedCandidates, 'candidate-partial'), 'utf8'), /fb-candidate-record-v2/);
  } finally {
    fs.writeFileSync = originalWriteFile;
    fixture.cleanup();
  }
});

test('never deletes an adversarial replacement after a failed candidate write', () => {
  const fixture = createRepo();
  const originalWriteFile = fs.writeFileSync;
  const originalLstat = fs.lstatSync;
  try {
    const common = path.resolve(fixture.repo, git(fixture.repo, ['rev-parse', '--git-common-dir']));
    const candidates = path.join(common, 'fb-lane', 'candidates');
    fs.mkdirSync(candidates, { recursive: true });
    const target = path.join(candidates, 'candidate-failed');
    const displaced = path.join(candidates, 'candidate-failed-owned');
    let candidateWriteFailed = false;
    let replacementInstalled = false;
    fs.writeFileSync = (file, ...args) => {
      if (typeof file === 'number') {
        candidateWriteFailed = true;
        throw new Error('simulated candidate write failure');
      }
      return originalWriteFile(file, ...args);
    };
    fs.lstatSync = file => {
      const stat = originalLstat(file);
      if (candidateWriteFailed && !replacementInstalled && (file === target || path.dirname(file) === target)) {
        const replacementTarget = file === target ? target : file;
        const ownedTarget = file === target ? displaced : `${file}.owned`;
        fs.renameSync(replacementTarget, ownedTarget);
        originalWriteFile(replacementTarget, 'foreign replacement\n');
        replacementInstalled = true;
      }
      return stat;
    };
    assert.throws(() => writeCandidateStore(fixture.repo, candidateStoreInput({ candidateId: 'candidate-failed' })), /simulated candidate write failure/);
    if (!replacementInstalled) fs.lstatSync(target);
    assert.strictEqual(replacementInstalled, true);
    assert.strictEqual(fs.readFileSync(target, 'utf8'), 'foreign replacement\n');
    assert.throws(() => readCandidateStore(fixture.repo, 'candidate-failed'), /invalid|incomplete|hash|schema|record/i);
  } finally {
    fs.writeFileSync = originalWriteFile;
    fs.lstatSync = originalLstat;
    fixture.cleanup();
  }
});

test('rejects partial or hash-invalid single-file candidate records', () => {
  const fixture = createRepo();
  try {
    const common = path.resolve(fixture.repo, git(fixture.repo, ['rev-parse', '--git-common-dir']));
    const candidates = path.join(common, 'fb-lane', 'candidates');
    fs.mkdirSync(candidates, { recursive: true });
    fs.writeFileSync(path.join(candidates, 'candidate-partial-json'), '{"schemaVersion":"fb-candidate-record-v2"');
    assert.throws(() => readCandidateStore(fixture.repo, 'candidate-partial-json'), /invalid|incomplete|json/i);
    const record = writeCandidateStore(fixture.repo, candidateStoreInput({ candidateId: 'candidate-hash-source' }));
    const tampered = JSON.parse(fs.readFileSync(record.directory, 'utf8'));
    tampered.payload.proposedConfig.mode = 'tampered';
    fs.writeFileSync(path.join(candidates, 'candidate-hash-invalid'), `${JSON.stringify(tampered, null, 2)}\n`);
    assert.throws(() => readCandidateStore(fixture.repo, 'candidate-hash-invalid'), /hash|candidate|record/i);
  } finally {
    fixture.cleanup();
  }
});

test('allows exactly one complete winner among concurrent same-candidate publishers', async () => {
  const fixture = createRepo();
  try {
    const modulePath = path.join(__dirname, 'fb-control-loop.cjs');
    const input = candidateStoreInput({ candidateId: 'candidate-concurrent' });
    const script = `const { writeCandidateStore } = require(process.argv[1]);
try {
  const record = writeCandidateStore(process.cwd(), JSON.parse(process.argv[2]));
  console.log(JSON.stringify({ status: 'won', candidateHash: record.candidateHash }));
} catch (error) {
  console.log(JSON.stringify({ status: 'lost', message: error.message }));
}`;
    const outcomes = await Promise.all(Array.from({ length: 8 }, () => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['-e', script, modulePath, JSON.stringify(input)], {
        cwd: fixture.repo,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', chunk => { stdout += chunk; });
      child.stderr.on('data', chunk => { stderr += chunk; });
      child.on('error', reject);
      child.on('close', code => {
        if (code !== 0) return reject(new Error(stderr || `publisher exited ${code}`));
        resolve(JSON.parse(stdout.trim()));
      });
    })));
    assert.strictEqual(outcomes.filter(item => item.status === 'won').length, 1);
    assert.strictEqual(outcomes.filter(item => item.status === 'lost').length, 7);
    const record = readCandidateStore(fixture.repo, 'candidate-concurrent');
    assert.strictEqual(record.candidateHash, serializedHash(proposedConfig()));
    const common = path.resolve(fixture.repo, git(fixture.repo, ['rev-parse', '--git-common-dir']));
    const candidates = path.join(common, 'fb-lane', 'candidates');
    assert.strictEqual(fs.lstatSync(path.join(candidates, 'candidate-concurrent')).isFile(), true);
  } finally {
    fixture.cleanup();
  }
});

test('rejects credentials and forbidden private fields in Task 2 retained inputs', () => {
  assert.throws(() => validateProfileManifest(profileManifest({ profiles: [{
    id: 'reviewer-default', promptRef: 'profiles/reviewer.md', configRef: 'profiles/reviewer.json', baselineHash: 'sk-proj-0123456789abcdefghijklmnopqrstuvwxyzABCDE',
  }] })), /credential|forbidden|privacy|hash/i);
  assert.throws(() => validateGoldenFixtureManifest(goldenManifest({ cases: [{ ...goldenManifest().cases[0], label: 'Bearer private-credential-value' }] })), /credential|forbidden|privacy/i);
  assert.throws(() => diagnoseConfiguration({
    stageEvents: [], evalEvidence: [], candidateDiff: { changedPaths: ['profiles/reviewer.json'], evidenceRefs: ['Bearer private-credential-value'] }, observedFailures: [{ kind: 'brief', evidenceRef: 'evidence/brief' }],
  }), /credential|forbidden|privacy/i);
  const fixture = createRepo();
  try {
    assert.throws(() => writeCandidateStore(fixture.repo, candidateStoreInput({ proposedConfig: { apiToken: 'sk-proj-0123456789abcdefghijklmnopqrstuvwxyzABCDE' } })), /credential|forbidden|privacy/i);
  } finally {
    fixture.cleanup();
  }
});

test('rejects benchmark runs with missing frozen cases or changed settings', () => {
  const fixture = createRepo();
  try {
    const record = writeCandidateStore(fixture.repo, candidateStoreInput());
    const baseline = benchmarkRun(record, 'baseline');
    const candidate = benchmarkRun(record, 'candidate', { results: [benchmarkRun(record, 'candidate').results[0]] });
    assert.throws(() => compareFrozenBenchmark(fixture.repo, { candidateId: record.candidateId, baseline, candidate }), /case|frozen|parity/i);
    assert.throws(() => compareFrozenBenchmark(fixture.repo, { candidateId: record.candidateId, baseline, candidate: benchmarkRun(record, 'candidate', { settings: { temperature: 1 } }) }), /settings|identical|environment/i);
  } finally {
    fixture.cleanup();
  }
});

test('preserves unfavorable candidate results and selects the baseline on a must-pass regression', () => {
  const fixture = createRepo();
  try {
    const record = writeCandidateStore(fixture.repo, candidateStoreInput());
    const baseline = benchmarkRun(record, 'baseline');
    const candidate = benchmarkRun(record, 'candidate');
    candidate.results[1].criteria['criterion-correctness'] = 'fail';
    candidate.results[1].observed = ['incorrect-response'];
    const comparison = compareFrozenBenchmark(fixture.repo, { candidateId: record.candidateId, baseline, candidate });
    assert.strictEqual(comparison.verdict, 'baseline');
    assert.deepStrictEqual(comparison.candidate.results[1].observed, ['incorrect-response']);
    assert.match(comparison.regressions[0].reason, /must-pass/i);
  } finally {
    fixture.cleanup();
  }
});

test('rejects credential-bearing benchmark observations before returning comparison evidence', () => {
  const fixture = createRepo();
  try {
    const record = writeCandidateStore(fixture.repo, candidateStoreInput());
    const baseline = benchmarkRun(record, 'baseline');
    const candidate = benchmarkRun(record, 'candidate');
    candidate.results[0].observed = ['sk-proj-0123456789abcdefghijklmnopqrstuvwxyzABCDE'];
    assert.throws(() => compareFrozenBenchmark(fixture.repo, { candidateId: record.candidateId, baseline, candidate }), /credential|forbidden|privacy/i);
  } finally {
    fixture.cleanup();
  }
});

test('requires a repeated candidate to materially change configuration or evidence', () => {
  const previous = { candidateId: 'candidate-001', candidateHash: sha256('candidate'), evidenceRefs: ['evidence/one'] };
  const repeated = { candidateId: 'candidate-002', candidateHash: sha256('candidate'), evidenceRefs: ['evidence/one'] };
  const progressed = { candidateId: 'candidate-003', candidateHash: sha256('candidate changed'), evidenceRefs: ['evidence/one'] };
  const repair = { mode: 'Quick BFM', changedPaths: ['tools/fb-control-loop.cjs'], state: { repairLoops: 0, startedAt: 0 }, event: { type: 'repair', now: 1 } };
  assert.strictEqual(assessCandidateProgress({ previousCandidate: previous, candidate: repeated, repair }).status, 'stopped');
  assert.strictEqual(assessCandidateProgress({ previousCandidate: previous, candidate: progressed, repair }).status, 'progressed');
});

test('uses declared Quick repair policies instead of caller-supplied attempt limits', () => {
  const candidate = { candidateId: 'candidate-001', candidateHash: sha256('candidate'), evidenceRefs: ['evidence/one'] };
  const result = assessCandidateProgress({
    candidate,
    repair: { mode: 'Quick BFM', changedPaths: ['tools/fb-control-loop.cjs'], state: { repairLoops: 1, startedAt: 0 }, event: { type: 'repair', now: 1 } },
  });
  assert.strictEqual(result.status, 'stopped');
  assert.match(result.productBoundary, /repair|budget/i);
  assert.throws(() => assessCandidateProgress({ candidate, repair: { mode: 'Quick BFM', maxAttempts: 100, changedPaths: ['tools/fb-control-loop.cjs'], state: {}, event: { type: 'repair', now: 1 } } }), /unknown|policy|repair/i);
});

test('issues one durable Full repair budget per run or candidate and exposes it across worktrees', () => {
  const fixture = createRepo();
  try {
    const sessionId = createFullExecutionSession(fixture.repo);
    const linked = addWorktree(fixture);
    const issued = issueFullRepairBudget(fixture.repo, {
      sessionId,
      runId: 'full-run-001',
      candidateId: 'candidate-001',
    });
    assert.deepStrictEqual(issued, { sessionId, runId: 'full-run-001', candidateId: 'candidate-001' });
    const record = readFullRepairBudget(linked, issued);
    assert.strictEqual(record.deadlineAt > 0, true);
    assert.strictEqual(record.maxRepairs, 2);
    assert.strictEqual(record.repairCount, 0);
    assert.throws(() => issueFullRepairBudget(fixture.repo, {
      sessionId,
      runId: 'full-run-001',
      candidateId: 'candidate-002',
    }), /run|issued|budget/i);
    assert.throws(() => issueFullRepairBudget(fixture.repo, {
      sessionId,
      runId: 'full-run-002',
      candidateId: 'candidate-001',
    }), /candidate|issued|budget/i);
  } finally {
    fixture.cleanup();
  }
});

test('rejects Full budget issuance from a non-BFM session or an authoritative Quick route', () => {
  const nonBfm = createRepo();
  try {
    const sessionId = createFullExecutionSession(nonBfm.repo, 'tech-session', { lane: 'tech' });
    assert.throws(() => issueFullRepairBudget(nonBfm.repo, { sessionId, runId: 'full-run-tech', candidateId: 'candidate-tech' }), /Full BFM|bfm|authority/i);
  } finally {
    nonBfm.cleanup();
  }
  const quick = createRepo();
  try {
    const sessionId = createFullExecutionSession(quick.repo, 'quick-session', { owner: 'FB-BFM', scope: 'Correct copy' });
    assert.throws(() => issueFullRepairBudget(quick.repo, { sessionId, runId: 'full-run-quick', candidateId: 'candidate-quick' }), /Full BFM|route|authority/i);
  } finally {
    quick.cleanup();
  }
});

test('rejects Full repair deadline extension and stops when authoritative Product decision changes despite a stale caller value', () => {
  const fixture = createRepo();
  try {
    const sessionId = createFullExecutionSession(fixture.repo);
    const budgetRef = issueFullRepairBudget(fixture.repo, {
      sessionId,
      runId: 'full-run-003',
      candidateId: 'candidate-003',
    });
    const budget = readFullRepairBudget(fixture.repo, budgetRef);
    assert.throws(() => advanceFullRepairBudget(fixture.repo, {
      budgetRef,
      materialProgress: true,
      event: { deadlineAt: budget.deadlineAt + 1 },
    }), /deadline|unknown|authority/i);
    fs.writeFileSync(path.join(fixture.repo, 'docs', 'handoffs', 'TASK-050.md'), '# TASK-050\n\nProduct decision version: decision-v2\n');
    const stopped = advanceFullRepairBudget(fixture.repo, {
      budgetRef,
      materialProgress: true,
      event: {},
    });
    assert.strictEqual(stopped.status, 'stopped');
    assert.match(stopped.productBoundary, /decision|Product/i);
    assert.strictEqual(readFullRepairBudget(fixture.repo, budgetRef).state, 'stopped');
  } finally {
    fixture.cleanup();
  }
});

test('stops a Full budget on no progress, closure, deadline, or a third repair without consumer reset', () => {
  const fixture = createRepo();
  try {
    const sessionId = createFullExecutionSession(fixture.repo);
    const noProgress = issueFullRepairBudget(fixture.repo, { sessionId, runId: 'full-run-004', candidateId: 'candidate-004' });
    assert.strictEqual(advanceFullRepairBudget(fixture.repo, { budgetRef: noProgress, materialProgress: false, event: {} }).status, 'stopped');

    const closed = issueFullRepairBudget(fixture.repo, { sessionId, runId: 'full-run-005', candidateId: 'candidate-005' });
    closeFullRepairBudget(fixture.repo, closed, 'session closed');
    assert.strictEqual(advanceFullRepairBudget(fixture.repo, { budgetRef: closed, materialProgress: true, event: {} }).status, 'stopped');

    const expired = issueFullRepairBudget(fixture.repo, { sessionId, runId: 'full-run-006', candidateId: 'candidate-006' });
    const deadline = readFullRepairBudget(fixture.repo, expired).deadlineAt;
    const originalNow = Date.now;
    Date.now = () => deadline;
    try {
      assert.strictEqual(advanceFullRepairBudget(fixture.repo, { budgetRef: expired, materialProgress: true, event: {} }).status, 'stopped');
    } finally {
      Date.now = originalNow;
    }

    const repairs = issueFullRepairBudget(fixture.repo, { sessionId, runId: 'full-run-007', candidateId: 'candidate-007' });
    assert.strictEqual(advanceFullRepairBudget(fixture.repo, { budgetRef: repairs, materialProgress: true, event: {} }).status, 'progressed');
    assert.strictEqual(advanceFullRepairBudget(fixture.repo, { budgetRef: repairs, materialProgress: true, event: {} }).status, 'progressed');
    const third = advanceFullRepairBudget(fixture.repo, { budgetRef: repairs, materialProgress: true, event: {} });
    assert.strictEqual(third.status, 'stopped');
    assert.match(third.productBoundary, /third|repair|Product/i);
    assert.strictEqual(readFullRepairBudget(fixture.repo, repairs).repairCount, 2);
  } finally {
    fixture.cleanup();
  }
});

test('serializes concurrent Full repair advancement through the shared session authority', async () => {
  const fixture = createRepo();
  try {
    const sessionId = createFullExecutionSession(fixture.repo);
    const budgetRef = issueFullRepairBudget(fixture.repo, { sessionId, runId: 'full-run-008', candidateId: 'candidate-008' });
    const runAdvance = () => new Promise((resolve, reject) => {
      const script = `const { advanceFullRepairBudget } = require(process.argv[1]);\ntry { console.log(JSON.stringify(advanceFullRepairBudget(process.cwd(), JSON.parse(process.argv[2])))); } catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }`;
      const child = spawn(process.execPath, ['-e', script, path.join(__dirname, 'fb-control-loop.cjs'), JSON.stringify({ budgetRef, materialProgress: true, event: {} })], { cwd: fixture.repo });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', chunk => { stdout += chunk; });
      child.stderr.on('data', chunk => { stderr += chunk; });
      child.on('error', reject);
      child.on('exit', code => code === 0 ? resolve(JSON.parse(stdout)) : reject(new Error(stderr)));
    });
    const results = await Promise.all([runAdvance(), runAdvance()]);
    assert.deepStrictEqual(results.map(result => result.status).sort(), ['progressed', 'progressed']);
    assert.strictEqual(readFullRepairBudget(fixture.repo, budgetRef).repairCount, 2);
  } finally {
    fixture.cleanup();
  }
});

test('fsyncs no-follow temporary Full budget files and their common-store directory on create and mutation', () => {
  const fixture = createRepo();
  const originalOpen = fs.openSync;
  const originalFsync = fs.fsyncSync;
  const openFlags = [];
  let fsyncs = 0;
  try {
    const sessionId = createFullExecutionSession(fixture.repo);
    fs.openSync = (target, flags, mode) => {
      openFlags.push(flags);
      return originalOpen(target, flags, mode);
    };
    fs.fsyncSync = descriptor => {
      fsyncs += 1;
      return originalFsync(descriptor);
    };
    const budgetRef = issueFullRepairBudget(fixture.repo, { sessionId, runId: 'full-run-durable', candidateId: 'candidate-durable' });
    assert.strictEqual(advanceFullRepairBudget(fixture.repo, { budgetRef, materialProgress: true, event: {} }).status, 'progressed');
    assert.ok(openFlags.some(flags => typeof flags === 'number' && (flags & fs.constants.O_NOFOLLOW) !== 0));
    assert.ok(fsyncs >= 4, `expected file and directory fsyncs, received ${fsyncs}`);
  } finally {
    fs.openSync = originalOpen;
    fs.fsyncSync = originalFsync;
    fixture.cleanup();
  }
});

test('rejects promotion unless Product approves the exact candidate and benchmark evidence', () => {
  const input = {
    candidate: { candidateId: 'candidate-001', benchmarkEvidenceRef: 'evidence/benchmark-001', fixtureManifestHash: sha256('manifest'), benchmarkResultHash: sha256('result'), promotionRecommendation: 'promote' },
    benchmark: { candidateId: 'candidate-001', evidenceRef: 'evidence/benchmark-001', fixtureManifestHash: sha256('manifest'), resultHash: sha256('result'), verdict: 'candidate' },
  };
  assert.throws(() => validatePromotion(input), /approval|Product/i);
  assert.throws(() => validatePromotion({ ...input, approval: { decision: 'approve', candidateId: 'candidate-other', benchmarkEvidenceRef: 'evidence/benchmark-001', fixtureManifestHash: sha256('manifest'), benchmarkResultHash: sha256('result'), approvalRef: 'approvals/product-001', approvedBy: 'Product' } }), /exact|candidate/i);
  assert.throws(() => validatePromotion({ ...input, candidate: { ...input.candidate, benchmarkEvidenceRef: '' }, approval: { decision: 'approve', candidateId: 'candidate-001', benchmarkEvidenceRef: '', fixtureManifestHash: sha256('manifest'), benchmarkResultHash: sha256('result'), approvalRef: '', approvedBy: 'Product' } }), /evidence|approval|exact/i);
  assert.throws(() => validatePromotion({ ...input, approval: { decision: 'approve', candidateId: 'candidate-001', benchmarkEvidenceRef: 'evidence/benchmark-001', fixtureManifestHash: sha256('manifest'), benchmarkResultHash: sha256('result'), approvalRef: 'sk-proj-0123456789abcdefghijklmnopqrstuvwxyzABCDE', approvedBy: 'Product' } }), /credential|forbidden|privacy/i);
  assert.deepStrictEqual(validatePromotion({ ...input, approval: { decision: 'approve', candidateId: 'candidate-001', benchmarkEvidenceRef: 'evidence/benchmark-001', fixtureManifestHash: sha256('manifest'), benchmarkResultHash: sha256('result'), approvalRef: 'approvals/product-001', approvedBy: 'Product' } }), {
    valid: true,
    promotion: 'product_approved',
    candidateId: 'candidate-001',
    benchmarkEvidenceRef: 'evidence/benchmark-001',
  });
});

test('bundled MCP validates and records flat events and evaluates deterministic routing', async () => {
  const fixture = createRepo();
  try {
    fs.writeFileSync(path.join(fixture.repo, 'PROJECT_BOARD.md'), '# Project Board\n');
    const list = await mcpRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }, fixture.repo);
    const names = list.result.tools.map(tool => tool.name);
    assert.ok(names.includes('fb_control_event_validate'));
    assert.ok(names.includes('fb_control_event_record'));
    assert.ok(names.includes('fb_control_route'));
    const eventValidator = list.result.tools.find(tool => tool.name === 'fb_control_event_validate');
    assert.strictEqual(eventValidator.inputSchema.additionalProperties, false);
    assert.strictEqual(eventValidator.inputSchema.properties.result.oneOf !== undefined, true);
    assert.strictEqual(eventValidator.outputSchema.additionalProperties, false);

    const event = baseEvent({ eventId: 'event-mcp' });
    const validated = await mcpRequest({
      jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: { name: 'fb_control_event_validate', arguments: { ...event, workspacePath: fixture.repo } },
    }, fixture.repo);
    assert.deepStrictEqual(JSON.parse(validated.result.content[0].text), event);
    assert.deepStrictEqual(validated.result.structuredContent, event);

    const nested = await mcpRequest({
      jsonrpc: '2.0', id: 21, method: 'tools/call',
      params: { name: 'fb_control_event_validate', arguments: { ...event, result: { state: 'passed' }, workspacePath: fixture.repo } },
    }, fixture.repo);
    assert.match(nested.error.message, /flat|nested/i);

    const arbitrary = await mcpRequest({
      jsonrpc: '2.0', id: 211, method: 'tools/call',
      params: { name: 'fb_control_event_validate', arguments: { ...event, unexpected: 'not-a-stage-event-field', workspacePath: fixture.repo } },
    }, fixture.repo);
    assert.match(arbitrary.error.message, /additional property/i);

    const credential = await mcpRequest({
      jsonrpc: '2.0', id: 22, method: 'tools/call',
      params: { name: 'fb_control_event_record', arguments: { ...event, eventId: 'event-mcp-secret', nextAction: 'Use sk-proj-0123456789abcdefghijklmnopqrstuvwxyzABCDE.', workspacePath: fixture.repo } },
    }, fixture.repo);
    assert.match(credential.error.message, /credential|privacy|forbidden/i);

    const routed = await mcpRequest({
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'fb_control_route', arguments: { ...routeInput(), workspacePath: fixture.repo } },
    }, fixture.repo);
    assert.strictEqual(JSON.parse(routed.result.content[0].text).decision, 'process');

    const recorded = await mcpRequest({
      jsonrpc: '2.0', id: 4, method: 'tools/call',
      params: { name: 'fb_control_event_record', arguments: { ...event, workspacePath: fixture.repo } },
    }, fixture.repo);
    assert.deepStrictEqual(JSON.parse(recorded.result.content[0].text), event);
    assert.deepStrictEqual(recorded.result.structuredContent, event);
    assert.strictEqual(readStageEvents(fixture.repo, 'run-001').length, 1);
  } finally {
    fixture.cleanup();
  }
});

test('declares the control-loop runtime and focused test for generated package parity', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'fb-package-manifest.json'), 'utf8'));
  assert.ok(manifest.includes('tools/fb-control-loop.cjs'));
  assert.ok(manifest.includes('tools/fb-control-loop.test.cjs'));
});

(async () => {
  for (const [name, fn] of tests) {
    try {
      await fn();
      passed += 1;
      console.log(`PASS ${name}`);
    } catch (error) {
      console.error(`FAIL ${name}`);
      throw error;
    }
  }
  console.log(`\n${passed}/${tests.length} control-loop tests passed.`);
})().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
