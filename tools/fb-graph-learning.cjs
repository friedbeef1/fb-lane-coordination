#!/usr/bin/env node
'use strict';

const { validateLearningReceipt, validateAutomaticTreatment } = require('./fb-learning.cjs');

const ACTIVE_LIFECYCLE = new Set(['provisional', 'confirmed', 'revised']);
const TREATMENT_OUTPUTS = new Map([
  ['add_context_ref', 'contextRefs'],
  ['add_dependency', 'dependencies'],
  ['recovery_hint', 'recoveryHints'],
  ['select_existing_check', 'existingChecks'],
  ['raise_verification_floor', 'verificationFloors'],
]);

function normalizedTaskId(value) {
  const raw = String(value || '').trim().toUpperCase();
  return raw.startsWith('TASK:') ? `task:${raw.slice(5)}` : `task:${raw}`;
}

function validateRepairBudget(input = {}) {
  const mode = String(input.mode || '').toLowerCase();
  const before = Number(input.before);
  const after = Number(input.after);
  const limit = Number(input.limit);
  if (!['quick', 'full'].includes(mode) || ![before, after, limit].every(Number.isInteger)
    || before < 0 || after < before || after > limit) {
    throw new Error('Learning cannot reset or exceed the existing repair budget.');
  }
  if (mode === 'quick' && limit !== 1) throw new Error('Quick BFM repair limit remains exactly one consolidated repair.');
  if (mode === 'full' && limit > 2) throw new Error('Full BFM repair limit remains at most two material repairs.');
  return { mode, before, after, limit };
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function attachApplicableGraphLessons(graph = {}, lessonInputs = [], context = {}) {
  const repairBudget = validateRepairBudget(context.repairBudget);
  const targetId = normalizedTaskId(context.taskId);
  const sourceNodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  if (!sourceNodes.some(node => node.id === targetId && node.type === 'task')) {
    throw new Error(`Graph learning target ${targetId} is not present as a task node.`);
  }

  const workTypes = new Set(Array.isArray(context.workTypes) ? context.workTypes.map(String) : []);
  const requiredConditions = new Set(Array.isArray(context.requiredConditions) ? context.requiredConditions.map(String) : []);
  const lifecycleStates = new Set(Array.isArray(context.lifecycleStates) && context.lifecycleStates.length
    ? context.lifecycleStates.map(String)
    : ACTIVE_LIFECYCLE);
  const safetyRejections = new Set(Array.isArray(context.safetyRejections) ? context.safetyRejections.map(String) : []);
  const surface = String(context.surface || '');

  const applicable = lessonInputs
    .map(validateLearningReceipt)
    .filter(lesson => lesson.active
      && ACTIVE_LIFECYCLE.has(lesson.state)
      && lifecycleStates.has(lesson.state)
      && lesson.workTypes.some(workType => workTypes.has(workType))
      && lesson.signature.surface === surface
      && requiredConditions.has(lesson.signature.criterion)
      && context.safetyPassed !== false
      && !safetyRejections.has(lesson.lessonId))
    .sort((left, right) => left.lessonId.localeCompare(right.lessonId));

  const projectedGraph = {
    ...structuredClone(graph),
    nodes: structuredClone(sourceNodes),
    edges: structuredClone(Array.isArray(graph.edges) ? graph.edges : []),
  };
  const outputs = {
    contextRefs: [],
    dependencies: [],
    recoveryHints: [],
    existingChecks: [],
    verificationFloors: [],
  };
  const applications = [];

  for (const lesson of applicable) {
    const treatment = validateAutomaticTreatment(lesson.treatment);
    const lessonId = `lesson:${lesson.lessonId}`;
    projectedGraph.nodes.push({
      id: lessonId,
      type: 'lesson',
      label: lesson.lessonId,
      source: lesson.owningRecord,
      citation: { source: lesson.owningRecord },
      lifecycleState: lesson.state,
      treatment,
    });
    projectedGraph.edges.push({
      from: targetId,
      to: lessonId,
      type: 'learned-from',
      status: 'confirmed',
      source: lesson.owningRecord,
      citation: { source: lesson.owningRecord },
    });
    outputs[TREATMENT_OUTPUTS.get(treatment.type)].push(treatment.value);
    applications.push({
      lessonId: lesson.lessonId,
      targetId,
      lifecycleState: lesson.state,
      treatment,
      evidenceRefs: [...lesson.evidenceRefs],
      source: lesson.owningRecord,
      citation: { source: lesson.owningRecord },
    });
  }

  projectedGraph.nodes.sort((left, right) => left.id.localeCompare(right.id));
  projectedGraph.edges.sort((left, right) => `${left.from}:${left.to}:${left.type}`.localeCompare(`${right.from}:${right.to}:${right.type}`));

  return {
    graph: projectedGraph,
    applicableLessons: applications,
    ...Object.fromEntries(Object.entries(outputs).map(([key, values]) => [key, uniqueSorted(values)])),
    repairBudget,
    authority: {
      releaseAuthorized: false,
      decisionsChanged: false,
      sourceChanged: false,
      promptsChanged: false,
      evalAuthorityChanged: false,
      sensitivePolicyChanged: false,
    },
  };
}

module.exports = { attachApplicableGraphLessons, validateRepairBudget };
