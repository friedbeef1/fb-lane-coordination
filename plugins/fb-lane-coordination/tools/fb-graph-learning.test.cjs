#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { attachApplicableGraphLessons } = require('./fb-graph-learning.cjs');

function lesson(overrides = {}) {
  return {
    lessonId: 'LESSON-TECH-CACHE-001',
    runId: 'run-001',
    taskId: 'TASK-001',
    state: 'confirmed',
    signature: { category: 'build', surface: 'cache', criterion: 'invalidation' },
    workTypes: ['tech:cache'],
    cause: 'Mutation did not invalidate the derived cache.',
    currentRepair: 'Invalidate the derived cache after the mutation.',
    treatment: { type: 'select_existing_check', value: 'cache-invalidation' },
    evidenceRefs: ['docs/qa/TASK-001.md#cache-regression'],
    owningRecord: 'docs/handoffs/TASK-001.md#project-learning',
    safetyClass: 'ordinary',
    applications: ['run-002', 'run-003'],
    revisionCount: 0,
    active: true,
    ...overrides,
  };
}

const graph = {
  nodes: [{
    id: 'task:TASK-200',
    type: 'task',
    label: 'TASK-200',
    source: 'PROJECT_BOARD.md',
    citation: { source: 'PROJECT_BOARD.md' },
  }],
  edges: [],
};

const context = {
  taskId: 'TASK-200',
  workTypes: ['tech:cache'],
  surface: 'cache',
  requiredConditions: ['invalidation'],
  lifecycleStates: ['provisional', 'confirmed', 'revised'],
  safetyRejections: [],
  repairBudget: { mode: 'quick', before: 1, after: 1, limit: 1 },
};

test('attaches only matching active lessons as source-cited graph context', () => {
  const result = attachApplicableGraphLessons(graph, [
    lesson(),
    lesson({ lessonId: 'LESSON-TECH-OTHER-001', workTypes: ['tech:storage'] }),
    lesson({ lessonId: 'LESSON-TECH-SURFACE-001', signature: { category: 'build', surface: 'database', criterion: 'invalidation' } }),
    lesson({ lessonId: 'LESSON-TECH-CONDITION-001', signature: { category: 'build', surface: 'cache', criterion: 'eviction' } }),
    lesson({ lessonId: 'LESSON-TECH-RETIRED-001', state: 'retired', active: false }),
  ], context);

  assert.deepEqual(result.applicableLessons.map(item => item.lessonId), ['LESSON-TECH-CACHE-001']);
  assert.deepEqual(result.graph.nodes.filter(node => node.type === 'lesson').map(node => node.id), ['lesson:LESSON-TECH-CACHE-001']);
  assert.deepEqual(result.graph.edges, [{
    from: 'task:TASK-200',
    to: 'lesson:LESSON-TECH-CACHE-001',
    type: 'learned-from',
    status: 'confirmed',
    source: 'docs/handoffs/TASK-001.md#project-learning',
    citation: { source: 'docs/handoffs/TASK-001.md#project-learning' },
  }]);
  assert.deepEqual(result.existingChecks, ['cache-invalidation']);
  assert.deepEqual(result.repairBudget, context.repairBudget);
});

test('projects every allowlisted treatment without executing or changing authority', () => {
  const lessons = [
    lesson({ lessonId: 'LESSON-CONTEXT-001', treatment: { type: 'add_context_ref', value: 'decision-auth' } }),
    lesson({ lessonId: 'LESSON-DEPENDENCY-001', signature: { category: 'build', surface: 'cache', criterion: 'dependency' }, treatment: { type: 'add_dependency', value: 'task-auth' } }),
    lesson({ lessonId: 'LESSON-RECOVERY-001', signature: { category: 'build', surface: 'cache', criterion: 'recovery' }, treatment: { type: 'recovery_hint', value: 'restore-cache' } }),
    lesson({ lessonId: 'LESSON-CHECK-001', signature: { category: 'build', surface: 'cache', criterion: 'check' }, treatment: { type: 'select_existing_check', value: 'cache-check' } }),
    lesson({ lessonId: 'LESSON-FLOOR-001', signature: { category: 'build', surface: 'cache', criterion: 'floor' }, treatment: { type: 'raise_verification_floor', value: 'full-cache-suite' } }),
  ];
  const result = attachApplicableGraphLessons(graph, lessons, {
    ...context,
    requiredConditions: ['invalidation', 'dependency', 'recovery', 'check', 'floor'],
  });

  assert.deepEqual(result.contextRefs, ['decision-auth']);
  assert.deepEqual(result.dependencies, ['task-auth']);
  assert.deepEqual(result.recoveryHints, ['restore-cache']);
  assert.deepEqual(result.existingChecks, ['cache-check']);
  assert.deepEqual(result.verificationFloors, ['full-cache-suite']);
  assert.equal(result.authority.releaseAuthorized, false);
  assert.equal(result.authority.decisionsChanged, false);
  assert.equal(result.authority.sourceChanged, false);
  assert.equal(result.authority.promptsChanged, false);
  assert.equal(result.authority.evalAuthorityChanged, false);
  assert.equal(result.authority.sensitivePolicyChanged, false);
});

test('a safety rejection excludes the lesson and cannot reset Quick or Full repair limits', () => {
  const rejected = attachApplicableGraphLessons(graph, [lesson()], {
    ...context,
    safetyRejections: ['LESSON-TECH-CACHE-001'],
  });
  assert.deepEqual(rejected.applicableLessons, []);

  assert.throws(() => attachApplicableGraphLessons(graph, [lesson()], {
    ...context,
    repairBudget: { mode: 'quick', before: 1, after: 0, limit: 1 },
  }), /repair budget|reset/i);
  assert.throws(() => attachApplicableGraphLessons(graph, [lesson()], {
    ...context,
    repairBudget: { mode: 'quick', before: 0, after: 0, limit: 2 },
  }), /Quick.*one|repair limit/i);
  assert.throws(() => attachApplicableGraphLessons(graph, [lesson()], {
    ...context,
    repairBudget: { mode: 'full', before: 0, after: 0, limit: 3 },
  }), /Full.*two|repair limit/i);
});

test('does not mutate the source graph or lesson receipts', () => {
  const sourceGraph = structuredClone(graph);
  const lessons = [lesson()];
  const sourceLessons = structuredClone(lessons);
  attachApplicableGraphLessons(graph, lessons, context);
  assert.deepEqual(graph, sourceGraph);
  assert.deepEqual(lessons, sourceLessons);
});
