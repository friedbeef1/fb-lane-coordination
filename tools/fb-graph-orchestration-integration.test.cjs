#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const DOCUMENTATION_ROOT = fs.existsSync(path.join(__dirname, '..', 'templates', 'AGENTS.md'))
  ? path.resolve(__dirname, '..')
  : path.resolve(__dirname, '../../..');

const {
  CONTEXT_SOURCE_CAP,
  buildProjectGraph,
  isSafeTaskId,
  projectContextPacket,
  refreshProjectGraph,
  validateProjectGraph,
} = require('./fb-project-graph.cjs');
const { scheduleGraph } = require('./fb-graph-scheduler.cjs');
const {
  compileBfmCandidateGraph,
  detectSemanticGraphChanges,
  prepareGraphDrivenBfm,
  preflightBfmRoute,
  readGraphProjection,
  renderGraphProjection,
} = require('./fb-graph-bfm.cjs');

function write(root, relative, contents = '# Evidence\n') {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-graph-orchestration-integration-'));
  write(root, 'PROJECT_BOARD.md', '# Board\n');
  write(root, 'docs/handoffs/index.md', '# Handoffs\n');
  return root;
}

function node(id, type = 'task', activityState = 'Ready', extra = {}) {
  return {
    id,
    type,
    label: id,
    source: 'PROJECT_BOARD.md',
    citation: { source: 'PROJECT_BOARD.md' },
    activityState,
    ...extra,
  };
}

function edge(from, to, type, extra = {}) {
  return {
    from,
    to,
    type,
    status: 'confirmed',
    source: 'PROJECT_BOARD.md',
    citation: { source: 'PROJECT_BOARD.md' },
    ...extra,
  };
}

function graph(nodes, edges = [], hash = 'graph-hash-1') {
  return {
    schemaVersion: 1,
    generatedAt: '2026-08-09T00:00:00.000Z',
    sourceFingerprint: { hash, sources: [] },
    health: { valid: true, findings: [], sourceCount: 2 },
    nodes,
    edges,
  };
}

function candidate(task, extra = {}) {
  return {
    task,
    disposition: 'Include now',
    relative: `docs/handoffs/${task}.md`,
    boardStatus: 'Ready',
    dependencies: [],
    locks: [`${task}.js`],
    worktree: `worktrees/${task.toLowerCase()}`,
    sensitive: false,
    acceptanceCriteria: [`accept-${task}`],
    verificationRequirements: [`check-${task}`],
    verificationEvidence: null,
    workTypes: [],
    surface: '',
    requiredConditions: [],
    safetyRejections: [],
    ...extra,
  };
}

function ledger(candidates) {
  return {
    candidates,
    activeLocks: [],
    approvalGates: [],
    externalBlockers: [],
    recommendedOrder: candidates.map(item => item.task),
    recommendedWaves: [candidates.map(item => item.task)],
    executionAllowed: true,
  };
}

function lesson(lessonId, treatment, criterion = 'invalidation') {
  return {
    lessonId,
    runId: `run-${lessonId}`,
    taskId: 'TASK-OLD',
    state: 'confirmed',
    signature: { category: 'build', surface: 'cache', criterion },
    workTypes: ['tech:cache'],
    cause: 'A prior cache delivery missed a bounded condition.',
    currentRepair: 'Reuse the existing bounded treatment.',
    treatment,
    evidenceRefs: ['docs/qa/lesson.md#proof'],
    owningRecord: 'docs/handoffs/lesson.md#project-learning',
    safetyClass: 'ordinary',
    applications: ['run-next'],
    revisionCount: 0,
    active: true,
  };
}

test('automatic preflight selects Direct only for one isolated item and reports every graph trigger or fallback', () => {
  const one = candidate('TASK-Q-20260808-ONBOARDING-REUSE');
  const base = graph([node(`task:${one.task}`)]);
  const direct = preflightBfmRoute({ ledger: ledger([one]), graph: base, graphStatus: 'healthy' });
  assert.equal(direct.route, 'direct');
  assert.deepEqual(direct.reasons, ['single-isolated-bounded-item']);

  const second = candidate('TASK-202');
  const triggerCases = [
    {
      code: 'multiple-items',
      ledger: ledger([one, second]),
      graph: graph([node(`task:${one.task}`), node('task:TASK-202')]),
    },
    {
      code: 'dependencies',
      ledger: ledger([{ ...one, dependencies: ['TASK-202'] }]),
      graph: graph([node(`task:${one.task}`), node('task:TASK-202')], [edge(`task:${one.task}`, 'task:TASK-202', 'depends-on')]),
    },
    {
      code: 'conflicts',
      ledger: ledger([one]),
      graph: graph([node(`task:${one.task}`), node('decision:SCOPE', 'user-decision', 'Unresolved')], [edge(`task:${one.task}`, 'decision:SCOPE', 'conflicts-with', { status: 'unresolved' })]),
    },
    {
      code: 'changed-decisions',
      ledger: ledger([one]),
      graph: base,
      semanticChanges: [{ kind: 'changed-decision', nodeId: 'decision:SCOPE', source: 'PROJECT_BOARD.md' }],
    },
    {
      code: 'blocked-or-stale-work',
      ledger: ledger([one]),
      graph: graph([node(`task:${one.task}`), node('task:TASK-202', 'task', 'Blocked')], [edge(`task:${one.task}`, 'task:TASK-202', 'depends-on')]),
    },
    {
      code: 'shared-locks',
      ledger: ledger([one, { ...second, locks: [...one.locks] }]),
      graph: graph([node(`task:${one.task}`), node('task:TASK-202')]),
    },
    {
      code: 'applicable-lessons',
      ledger: ledger([one]),
      graph: base,
      applicableLessons: [{ lessonId: 'LESSON-1' }],
    },
    {
      code: 'release-relationships',
      ledger: ledger([one]),
      graph: graph([node(`task:${one.task}`), node('release:1.0.0', 'release')], [edge(`task:${one.task}`, 'release:1.0.0', 'included-in-release')]),
    },
  ];
  for (const input of triggerCases) {
    const selected = preflightBfmRoute({ graphStatus: 'healthy', ...input });
    assert.equal(selected.route, 'graph-driven', input.code);
    assert.ok(selected.reasons.includes(input.code), `${input.code} must be reported`);
  }

  for (const graphStatus of ['missing', 'stale', 'corrupt']) {
    const fallback = preflightBfmRoute({ ledger: ledger([one]), graph: base, graphStatus });
    assert.equal(fallback.route, 'authoritative-fallback');
    assert.equal(fallback.graphDrivenSequencing, false);
    assert.ok(fallback.reasons.includes(`graph-${graphStatus}`));
  }
});

test('candidate compiler schedules the frozen intake closure and greedily reserves priority locks/worktrees', () => {
  const first = candidate('TASK-201', {
    locks: ['shared.js'],
    worktree: 'worktrees/first',
    acceptanceCriteria: ['first accepted'],
    verificationRequirements: ['first-check'],
  });
  const second = candidate('TASK-202', {
    locks: ['shared.js'],
    worktree: 'worktrees/second',
  });
  const source = graph([
    node('task:TASK-201'),
    node('task:TASK-202'),
    node('task:TASK-DEPENDENCY', 'task', 'Done'),
    node('task:TASK-UNRELATED-68'),
  ], [
    edge('task:TASK-201', 'task:TASK-DEPENDENCY', 'depends-on'),
    edge('task:TASK-UNRELATED-68', 'task:TASK-DEPENDENCY', 'depends-on'),
  ]);
  const compiled = compileBfmCandidateGraph(source, ledger([first, second]), {
    selectedTask: 'TASK-201',
  });

  assert.deepEqual(
    compiled.nodes.filter(item => item.type === 'task').map(item => item.id),
    ['task:TASK-201', 'task:TASK-202', 'task:TASK-DEPENDENCY'],
  );
  assert.equal(compiled.nodes.some(item => item.id === 'task:TASK-UNRELATED-68'), false);
  const compiledFirst = compiled.nodes.find(item => item.id === 'task:TASK-201');
  assert.equal(compiledFirst.worktree, 'worktrees/first');
  assert.deepEqual(compiledFirst.locks, ['shared.js']);
  assert.deepEqual(compiledFirst.acceptanceCriteria, ['first accepted']);
  assert.deepEqual(compiledFirst.verificationRequirements, ['first-check']);

  const scheduled = scheduleGraph(compiled, { priorityOrder: ['task:TASK-201', 'task:TASK-202'] });
  assert.deepEqual(scheduled.parallelReady.map(item => item.id), ['task:TASK-201']);
  assert.deepEqual(scheduled.next.map(item => item.id), ['task:TASK-202']);
  assert.ok(scheduled.next[0].reasons.some(reason => reason.code === 'shared-lock'));
});

test('graph runtime applies live bounded lessons and invalidates only semantic relevant changes', () => {
  const selected = candidate('TASK-301', {
    dependencies: ['TASK-302'],
    workTypes: ['tech:cache'],
    surface: 'cache',
    requiredConditions: ['invalidation', 'dependency', 'check', 'floor'],
  });
  const dependency = candidate('TASK-302', { boardStatus: 'Done' });
  const previous = graph([
    node('task:TASK-301'),
    node('task:TASK-302', 'task', 'Done'),
    node('decision:CACHE', 'user-decision', 'Confirmed', { label: 'Use cache v1' }),
    node('task:UNRELATED', 'task', 'Done', { objective: 'Old unrelated wording' }),
  ], [
    edge('decision:CACHE', 'task:TASK-301', 'affects'),
    edge('task:TASK-301', 'task:TASK-302', 'depends-on'),
  ], 'previous');
  const current = structuredClone(previous);
  current.sourceFingerprint.hash = 'current';
  current.nodes.find(item => item.id === 'decision:CACHE').label = 'Use cache v2';
  current.nodes.find(item => item.id === 'task:UNRELATED').objective = 'New unrelated wording';

  const changes = detectSemanticGraphChanges(previous, current, {
    taskIds: ['TASK-301', 'TASK-302'],
  });
  assert.deepEqual(changes, [{
    kind: 'changed-decision',
    nodeId: 'decision:CACHE',
    source: 'PROJECT_BOARD.md',
  }]);

  const root = fixture();
  try {
    write(root, 'docs/handoffs/TASK-301.md', '# TASK-301\n\n## Build Brief\n\nObjective: Deliver the selected cache outcome through the frozen candidate graph.\n');
    write(root, 'docs/qa/lesson.md', '# Lesson proof\n');
    write(root, 'docs/handoffs/lesson.md', '# Lesson\n');
    const result = prepareGraphDrivenBfm(root, {
      taskId: 'TASK-301',
      ledger: ledger([selected, dependency]),
      graph: current,
      previousGraph: previous,
      graphStatus: 'healthy',
      productPriorities: ['TASK-301', 'TASK-302'],
      lessonInputs: [
        lesson('LESSON-CONTEXT-001', { type: 'add_context_ref', value: 'decision-cache' }),
        lesson('LESSON-DEPENDENCY-001', { type: 'add_dependency', value: 'TASK-302' }, 'dependency'),
        lesson('LESSON-CHECK-001', { type: 'select_existing_check', value: 'cache-check' }, 'check'),
        lesson('LESSON-FLOOR-001', { type: 'raise_verification_floor', value: 'cache-floor' }, 'floor'),
      ],
    });
    assert.deepEqual(result.semanticChanges, changes);
    assert.deepEqual(result.lessons.contextRefs, ['decision-cache']);
    assert.deepEqual(result.lessons.dependencies, ['TASK-302']);
    assert.deepEqual(result.lessons.existingChecks, ['cache-check']);
    assert.deepEqual(result.lessons.verificationFloors, ['cache-floor']);
    assert.deepEqual(result.projection.recentlyInvalidated.map(item => item.id), [
      'task:TASK-301',
      'verification:TASK-301:CHECK-TASK-301',
    ]);
    assert.equal(result.executableGraph.nodes.some(item => item.id === 'task:UNRELATED'), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('projection envelopes revalidate health, legacy IDs remain safe, and sensitive nested fields fail closed without echo', () => {
  const legacy = 'TASK-Q-20260713-SIDECHAT-PARENT';
  assert.equal(isSafeTaskId(legacy), true);
  assert.equal(isSafeTaskId('TASK-Q-20260808-ONBOARDING-REUSE'), true);
  const root = fixture();
  try {
    write(root, `docs/handoffs/${legacy}.md`, `# ${legacy}\n\n## Build Brief\n\nObjective: Preserve the approved legacy task contract through graph execution.\n`);
    const current = graph([
      node(`task:${legacy}`),
      node('release:1.0.0', 'release'),
    ], [edge(`task:${legacy}`, 'release:1.0.0', 'included-in-release')]);
    const result = prepareGraphDrivenBfm(root, {
      taskId: legacy,
      ledger: ledger([candidate(legacy)]),
      graph: current,
      graphStatus: 'healthy',
      writeProjection: true,
    });
    assert.equal(result.route, 'graph-driven');
    assert.equal(result.envelope.schemaVersion, 1);
    assert.equal(result.envelope.selectedTask, legacy);
    assert.deepEqual(result.envelope.reasons, ['release-relationships']);
    assert.equal(result.envelope.sourceFingerprint.hash, 'graph-hash-1');
    assert.equal(result.envelope.graphHealth.valid, true);

    const restored = readGraphProjection(root, { currentGraph: current });
    assert.equal(restored.route, 'graph-driven');
    assert.match(renderGraphProjection(restored), /Graph-driven sequencing: active/);

    const changed = structuredClone(current);
    changed.sourceFingerprint.hash = 'graph-hash-2';
    const stale = readGraphProjection(root, { currentGraph: changed });
    assert.equal(stale.route, 'authoritative-fallback');
    assert.equal(stale.graphDrivenSequencing, false);
    assert.match(renderGraphProjection(stale), /AUTHORITATIVE FALLBACK/);
    assert.doesNotMatch(renderGraphProjection(stale), /Graph-driven sequencing: active/);

    fs.writeFileSync(path.join(root, '.fb', 'graph', 'bfm-projection.json'), '{"projection":{}}\n');
    assert.equal(readGraphProjection(root, { currentGraph: current }).route, 'authoritative-fallback');

    const sensitiveValues = ['password=hunter2', 'api_key=abc123', 'token: secret-value'];
    write(root, 'PROJECT_BOARD.md', `# Board

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
| TASK-500 | Ready | FB-Tech | Test | ${sensitiveValues[0]} | file.js | [Handoff](docs/handoffs/TASK-500.md) |
`);
    write(root, 'docs/handoffs/TASK-500.md', '---\ntask: TASK-500\nlane: fb-tech\n---\n# TASK-500\n');
    const persisted = refreshProjectGraph(root).graph;
    assert.equal(persisted.health.valid, false);
    assert.equal(JSON.stringify(persisted).includes(sensitiveValues[0]), false);
    assert.equal(fs.readFileSync(path.join(root, '.fb', 'graph', 'project-graph.json'), 'utf8').includes(sensitiveValues[0]), false);

    const unsafe = graph([
      node('task:TASK-500', 'task', 'Ready', { objective: sensitiveValues[0] }),
      node('lesson:LESSON-500', 'lesson', 'Confirmed', { treatment: { type: 'add_context_ref', value: sensitiveValues[1] } }),
    ]);
    unsafe.compileFindings = [{ code: 'unsafe-input', message: sensitiveValues[2], source: 'PROJECT_BOARD.md' }];
    const findings = validateProjectGraph(root, unsafe);
    assert.ok(findings.filter(item => item.code === 'sensitive-output').length >= 3);
    assert.equal(findings.some(item => sensitiveValues.some(value => JSON.stringify(item).includes(value))), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('integration and candidate readiness advance only from authoritative passed evidence, not verified-by edges', () => {
  const root = fixture();
  try {
    for (const id of ['TASK-401', 'TASK-402']) {
      write(root, `docs/handoffs/${id}.md`, `# ${id}\n\n## Build Brief\n\nObjective: Integrate the accepted candidate through authoritative evidence.\n`);
      write(root, `docs/qa/${id}.md`, `# ${id} passed verification\n`);
    }
    write(root, 'docs/qa/integration.md', '# Integration evidence\n\nState: pending\n');
    const candidates = ['TASK-401', 'TASK-402'].map(id => candidate(id, {
      boardStatus: 'Staging QA',
      verificationEvidence: { state: 'passed', source: `docs/qa/${id}.md` },
    }));
    const source = graph([
      ...candidates.map(item => node(`task:${item.task}`, 'task', 'Staging QA')),
      ...candidates.map(item => node(`verification:${item.task}`, 'verification', 'Passed')),
    ], candidates.map(item => edge(`task:${item.task}`, `verification:${item.task}`, 'verified-by')));

    const planned = prepareGraphDrivenBfm(root, {
      taskId: 'TASK-401', ledger: ledger(candidates), graph: source, graphStatus: 'healthy',
    });
    assert.deepEqual(planned.integrationPass, {
      state: 'planned', count: 0, taskIds: ['task:TASK-401', 'task:TASK-402'], evidence: null,
      representation: 'single-product-integration-pass',
    });
    assert.equal(planned.projection.readyToShip.ready, false);

    const contentFreeClaim = prepareGraphDrivenBfm(root, {
      taskId: 'TASK-401', ledger: ledger(candidates), graph: source, graphStatus: 'healthy',
      integrationEvidence: {
        state: 'completed', source: 'docs/qa/integration.md', passed: true,
        acceptedTaskIds: ['TASK-401', 'TASK-402'],
      },
    });
    assert.equal(contentFreeClaim.integrationPass.state, 'planned');
    assert.equal(contentFreeClaim.integrationPass.count, 0);

    write(root, 'docs/qa/integration.md', '# Integration evidence\n\nState: running\n');

    const running = prepareGraphDrivenBfm(root, {
      taskId: 'TASK-401', ledger: ledger(candidates), graph: source, graphStatus: 'healthy',
      integrationEvidence: { state: 'running', source: 'docs/qa/integration.md' },
    });
    assert.equal(running.integrationPass.state, 'running');
    assert.equal(running.integrationPass.count, 0);

    write(root, 'docs/qa/integration.md', [
      '# Integration evidence', '', 'State: running', 'State: completed', 'Result: passed',
      'Accepted tasks: TASK-401, TASK-402', '',
    ].join('\n'));

    const completed = prepareGraphDrivenBfm(root, {
      taskId: 'TASK-401', ledger: ledger(candidates), graph: source, graphStatus: 'healthy',
      integrationEvidence: {
        state: 'completed', source: 'docs/qa/integration.md', passed: true,
        acceptedTaskIds: ['TASK-401', 'TASK-402'],
      },
    });
    assert.equal(completed.integrationPass.state, 'completed');
    assert.equal(completed.integrationPass.count, 1);
    assert.equal(completed.projection.readyToShip.ready, true);

    const edgeOnly = ledger(candidates.map(item => ({ ...item, verificationEvidence: null })));
    const unproven = prepareGraphDrivenBfm(root, {
      taskId: 'TASK-401', ledger: edgeOnly, graph: source, graphStatus: 'healthy',
      integrationEvidence: {
        state: 'completed', source: 'docs/qa/integration.md', passed: true,
        acceptedTaskIds: ['TASK-401', 'TASK-402'],
      },
    });
    assert.equal(unproven.projection.readyToShip.ready, false);
    assert.ok(unproven.findings.some(item => item.code === 'missing-authoritative-verification'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('generated guidance starts from bounded status/project context and context packets enforce their promised source cap', () => {
  const guidance = fs.readFileSync(path.join(DOCUMENTATION_ROOT, 'templates', 'AGENTS.md'), 'utf8');
  const status = guidance.indexOf('status --context');
  const projectContext = guidance.indexOf('fb_project_context');
  const broadBoard = guidance.indexOf('Open the full `PROJECT_BOARD.md`');
  assert.ok(status >= 0 && projectContext > status && broadBoard > projectContext);

  const root = fixture();
  try {
    const rows = [];
    for (let index = 1; index <= CONTEXT_SOURCE_CAP + 4; index += 1) {
      const id = `TASK-${600 + index}`;
      rows.push(`| ${id} | Ready | FB-Tech | Test | Scope ${index} | file-${index}.js | [Handoff](docs/handoffs/${id}.md) |`);
      write(root, `docs/handoffs/${id}.md`, `---\ntask: ${id}\nlane: fb-tech\n---\n# ${id}\n`);
    }
    write(root, 'PROJECT_BOARD.md', `# Board\n\n| ID | Status | Owner | Area | Scope | Locks | Links |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`);
    const compiled = buildProjectGraph(root, { generatedAt: '2026-08-09T00:00:00.000Z' });
    const target = compiled.nodes.find(item => item.id === 'task:TASK-601');
    for (const other of compiled.nodes.filter(item => item.type === 'task' && item.id !== target.id)) {
      compiled.edges.push(edge(target.id, other.id, 'depends-on'));
    }
    const packet = projectContextPacket(root, {
      taskId: 'TASK-601',
      question: 'Which bounded sources govern this dependency closure?',
      graph: compiled,
    });
    assert.ok(packet.readableSources.length <= CONTEXT_SOURCE_CAP);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
