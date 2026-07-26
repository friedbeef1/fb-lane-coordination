#!/usr/bin/env node
'use strict';

// TASK-050 focused behavior tests. This file deliberately imports the missing
// control-loop runtime first so the initial execution records the public RED.

const assert = require('assert');
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

test('bundled MCP validates and records flat events and evaluates deterministic routing', async () => {
  const fixture = createRepo();
  try {
    fs.writeFileSync(path.join(fixture.repo, 'PROJECT_BOARD.md'), '# Project Board\n');
    const list = await mcpRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }, fixture.repo);
    const names = list.result.tools.map(tool => tool.name);
    assert.ok(names.includes('fb_control_event_validate'));
    assert.ok(names.includes('fb_control_event_record'));
    assert.ok(names.includes('fb_control_route'));

    const event = baseEvent({ eventId: 'event-mcp' });
    const validated = await mcpRequest({
      jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: { name: 'fb_control_event_validate', arguments: { ...event, workspacePath: fixture.repo } },
    }, fixture.repo);
    assert.deepStrictEqual(JSON.parse(validated.result.content[0].text), event);

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
