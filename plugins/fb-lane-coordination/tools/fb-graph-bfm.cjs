#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  GRAPH_SCHEMA_VERSION,
  buildProjectGraph,
  isSafeTaskId,
  normalizeTaskId,
  readProjectGraph,
  refreshProjectGraph,
  validateProjectGraph,
} = require('./fb-project-graph.cjs');
const { scheduleGraph } = require('./fb-graph-scheduler.cjs');
const { calculateGraphInvalidation } = require('./fb-graph-propagation.cjs');
const { attachApplicableGraphLessons } = require('./fb-graph-learning.cjs');
const { readLearningRegistry } = require('./fb-learning.cjs');

const PROJECTION_SCHEMA_VERSION = 1;
const PROJECTION_KEYS = [
  'current', 'next', 'blocked', 'deferred', 'conflicts', 'recentlyInvalidated', 'readyToShip',
];
const LIFECYCLE = [
  'preflight-route', 'refresh-graph', 'freeze-active-subgraph', 'detect-gaps',
  'apply-product-priorities', 'schedule-bounded-slices', 'execute-ready-slices',
  'update-authoritative-records', 'refresh-graph-after-results', 'stop-at-ready-to-ship',
];
const ACCEPTED_PRE_RELEASE_STATES = new Set([
  'staging qa', 'ready to ship', 'done', 'complete', 'completed',
]);
const SEMANTIC_EDGE_TYPES = new Set([
  'depends-on', 'blocks', 'conflicts-with', 'affects', 'implements', 'verified-by',
  'learned-from', 'included-in-release',
]);
const TERMINAL_BUG_STATES = new Set(['fixed', 'resolved', 'done', 'complete', 'completed']);

function safeRelative(root, relative, label, options = {}) {
  const value = String(relative || '').replace(/\\/g, '/');
  const filePart = value.split('#', 1)[0];
  const absolute = path.resolve(root, filePart);
  const prefix = `${path.resolve(root)}${path.sep}`;
  if (!filePart || path.isAbsolute(filePart)
    || (!absolute.startsWith(prefix) && absolute !== path.resolve(root))) {
    throw new Error(`${label} must be a repository-relative path.`);
  }
  if (options.mustExist !== false && !fs.existsSync(absolute)) {
    throw new Error(`${label} must cite an existing authoritative record.`);
  }
  return { value, filePart, absolute };
}

function buildBrief(root, relative) {
  const target = safeRelative(root, relative, 'Build Brief source', { mustExist: false });
  if (!fs.existsSync(target.absolute)) {
    throw new Error('Product must record the consolidated Build Brief before graph scheduler execution.');
  }
  const markdown = fs.readFileSync(target.absolute, 'utf8');
  const heading = markdown.match(/^## Build Brief\s*$/mi);
  if (!heading) throw new Error('Product must record the consolidated Build Brief before graph scheduler execution.');
  const tail = markdown.slice(heading.index + heading[0].length);
  const end = tail.search(/^##\s+/m);
  const body = (end >= 0 ? tail.slice(0, end) : tail).trim();
  if (body.length < 40 || !/\b(?:objective|scope|outcome)\s*:/i.test(body)) {
    throw new Error('Product must record a concrete consolidated Build Brief before graph scheduler execution.');
  }
  return { source: target.value, citation: { source: target.value } };
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) deepFreeze(nested);
  return value;
}

function graphTaskId(value) {
  const normalized = normalizeTaskId(value);
  if (!isSafeTaskId(normalized)) throw new Error('Graph-driven BFM requires a safe task ID.');
  return `task:${normalized}`;
}

function taskState(value) {
  return String(value || '').trim().toLowerCase();
}

function includedCandidates(ledger = {}) {
  return (ledger.candidates || [])
    .filter(candidate => candidate.disposition === 'Include now')
    .map(candidate => ({ ...candidate, task: normalizeTaskId(candidate.task) }));
}

function compact(item) {
  if (!item) return item;
  if (item.task && item.conflict) return {
    task: compact(item.task), conflict: compact(item.conflict), reasons: item.reasons,
  };
  return {
    id: item.id,
    type: item.type,
    label: item.label,
    source: item.source,
    citation: item.citation || { source: item.source },
    ...(item.reasons ? { reasons: item.reasons } : {}),
    ...(item.verificationRequirements ? { verificationRequirements: item.verificationRequirements } : {}),
    ...(item.criticalPath ? { criticalPath: item.criticalPath } : {}),
  };
}

function emptyProjection(reason) {
  return {
    current: [], next: [], blocked: [], deferred: [], conflicts: [], recentlyInvalidated: [],
    readyToShip: { ready: false, reasons: [reason] },
  };
}

function authoritativeFallback(task, reasons = ['graph-unavailable']) {
  const selectedTask = normalizeTaskId(task);
  const safeTask = isSafeTaskId(selectedTask) ? selectedTask : '';
  const result = {
    route: 'authoritative-fallback',
    mode: 'authoritative-fallback',
    reasons: [...new Set(reasons.map(String))],
    graphDrivenSequencing: false,
    notice: 'Graph preflight selected the visible authoritative-record fallback.',
    authoritativeSources: [
      'PROJECT_BOARD.md', 'docs/handoffs/index.md',
      ...(safeTask ? [`docs/handoffs/${safeTask}.md`] : []),
      'Git history',
    ],
    projection: emptyProjection('authoritative-fallback-active'),
    lifecycle: [...LIFECYCLE],
    releaseBoundary: 'Ready to ship',
    releaseAuthorized: false,
    handoffs: { role: 'queued-product-inputs', executable: false },
  };
  return result;
}

function relevantTaskIds(ledger = {}) {
  return new Set(includedCandidates(ledger).map(candidate => graphTaskId(candidate.task)));
}

function hasSharedIsolation(candidates) {
  const locks = new Set();
  const worktrees = new Set();
  for (const candidate of candidates) {
    for (const lock of candidate.locks || []) {
      if (locks.has(lock)) return true;
      locks.add(lock);
    }
    if (candidate.worktree) {
      if (worktrees.has(candidate.worktree)) return true;
      worktrees.add(candidate.worktree);
    }
  }
  return false;
}

function preflightBfmRoute(input = {}) {
  const graphStatus = String(input.graphStatus || 'missing').toLowerCase();
  if (graphStatus !== 'healthy') {
    const reason = ['missing', 'stale', 'corrupt'].includes(graphStatus)
      ? `graph-${graphStatus}`
      : 'graph-unhealthy';
    return {
      route: 'authoritative-fallback',
      reasons: [reason],
      graphDrivenSequencing: false,
    };
  }

  const candidates = includedCandidates(input.ledger);
  if (candidates.length === 0) {
    return { route: 'authoritative-fallback', reasons: ['no-selected-item'], graphDrivenSequencing: false };
  }
  const taskIds = new Set(candidates.map(candidate => graphTaskId(candidate.task)));
  const nodes = new Map((input.graph?.nodes || []).map(item => [item.id, item]));
  const relevantEdges = (input.graph?.edges || []).filter(item => taskIds.has(item.from) || taskIds.has(item.to));
  const reasons = [];
  if (candidates.length > 1) reasons.push('multiple-items');
  if (candidates.some(candidate => (candidate.dependencies || []).length > 0)
    || relevantEdges.some(item => item.type === 'depends-on')) reasons.push('dependencies');
  if (relevantEdges.some(item => item.type === 'conflicts-with' && item.status !== 'resolved')) reasons.push('conflicts');
  if ((input.semanticChanges || []).some(item => item.kind === 'changed-decision')) reasons.push('changed-decisions');
  const relatedNodeIds = new Set(relevantEdges.flatMap(item => [item.from, item.to]));
  if (candidates.some(candidate => ['blocked', 'stale'].includes(taskState(candidate.boardStatus)))
    || [...relatedNodeIds].some(id => ['blocked', 'stale'].includes(taskState(nodes.get(id)?.activityState)))) {
    reasons.push('blocked-or-stale-work');
  }
  if (candidates.some(candidate => !candidate.worktree || !Array.isArray(candidate.locks))) reasons.push('missing-isolation');
  if (hasSharedIsolation(candidates)) reasons.push('shared-locks');
  if ((input.applicableLessons || []).length > 0) reasons.push('applicable-lessons');
  if (relevantEdges.some(item => item.type === 'included-in-release')) reasons.push('release-relationships');
  const uniqueReasons = [...new Set(reasons)];
  if (!uniqueReasons.length) {
    return { route: 'direct', reasons: ['single-isolated-bounded-item'], graphDrivenSequencing: false };
  }
  return { route: 'graph-driven', reasons: uniqueReasons, graphDrivenSequencing: true };
}

function verificationNodeId(task, requirement) {
  const suffix = String(requirement || 'required').toUpperCase().replace(/[^A-Z0-9._-]+/g, '-');
  return `verification:${normalizeTaskId(task)}:${suffix}`;
}

function compileBfmCandidateGraph(graph = {}, ledger = {}, options = {}) {
  const candidates = includedCandidates(ledger);
  const selectedTask = normalizeTaskId(options.selectedTask || candidates[0]?.task);
  if (!isSafeTaskId(selectedTask)) throw new Error('The frozen BFM intake requires one safe selected task.');
  const candidateById = new Map(candidates.map(candidate => [graphTaskId(candidate.task), candidate]));
  if (!candidateById.has(graphTaskId(selectedTask))) {
    throw new Error('The selected task is not present in the frozen Include now intake.');
  }

  const sourceNodes = new Map((graph.nodes || []).map(item => [item.id, structuredClone(item)]));
  const sourceEdges = Array.isArray(graph.edges) ? graph.edges : [];
  const selectedTaskIds = new Set(candidateById.keys());
  for (const candidate of candidates) {
    for (const dependency of candidate.dependencies || []) {
      if (isSafeTaskId(dependency)) selectedTaskIds.add(graphTaskId(dependency));
    }
  }
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const relationship of sourceEdges) {
      if (!['depends-on', 'blocks'].includes(relationship.type)) continue;
      if (selectedTaskIds.has(relationship.from) && sourceNodes.get(relationship.to)?.type === 'task'
        && !selectedTaskIds.has(relationship.to)) {
        selectedTaskIds.add(relationship.to);
        expanded = true;
      }
      if (relationship.type === 'blocks' && selectedTaskIds.has(relationship.to)
        && sourceNodes.get(relationship.from)?.type === 'task' && !selectedTaskIds.has(relationship.from)) {
        selectedTaskIds.add(relationship.from);
        expanded = true;
      }
    }
  }

  const selectedIds = new Set(selectedTaskIds);
  for (const relationship of sourceEdges) {
    if (!SEMANTIC_EDGE_TYPES.has(relationship.type)) continue;
    if (selectedTaskIds.has(relationship.from) && sourceNodes.get(relationship.to)?.type !== 'task') selectedIds.add(relationship.to);
    if (selectedTaskIds.has(relationship.to) && sourceNodes.get(relationship.from)?.type !== 'task') selectedIds.add(relationship.from);
  }
  const nodes = new Map();
  for (const id of selectedIds) {
    const existing = sourceNodes.get(id);
    if (existing) nodes.set(id, existing);
  }
  const edges = sourceEdges
    .filter(item => selectedIds.has(item.from) && selectedIds.has(item.to) && SEMANTIC_EDGE_TYPES.has(item.type))
    .map(item => structuredClone(item));

  for (const [id, candidate] of candidateById) {
    const existing = nodes.get(id) || {
      id,
      type: 'task',
      label: candidate.task,
      source: candidate.relative || 'PROJECT_BOARD.md',
      citation: { source: candidate.relative || 'PROJECT_BOARD.md' },
    };
    nodes.set(id, {
      ...existing,
      activityState: candidate.boardStatus || existing.activityState || 'Ready',
      authoritativeState: candidate.boardStatus || '',
      worktree: candidate.worktree || '',
      locks: Array.isArray(candidate.locks) ? [...candidate.locks] : [],
      sensitive: candidate.sensitive === true,
      acceptanceCriteria: [...(candidate.acceptanceCriteria || [])],
      verificationRequirements: [...(candidate.verificationRequirements || [])],
      authoritativeVerification: candidate.verificationEvidence || null,
      intakeSource: candidate.relative || existing.source,
    });
    for (const dependency of candidate.dependencies || []) {
      if (!isSafeTaskId(dependency)) continue;
      const dependencyId = graphTaskId(dependency);
      if (!nodes.has(dependencyId)) {
        const source = candidate.relative || 'PROJECT_BOARD.md';
        nodes.set(dependencyId, {
          id: dependencyId, type: 'task', label: normalizeTaskId(dependency), source,
          citation: { source }, activityState: 'Unknown',
        });
      }
      if (!edges.some(item => item.from === id && item.to === dependencyId && item.type === 'depends-on')) {
        const source = candidate.relative || 'PROJECT_BOARD.md';
        edges.push({
          from: id, to: dependencyId, type: 'depends-on', status: 'confirmed', source,
          citation: { source },
        });
      }
    }
    for (const requirement of candidate.verificationRequirements || []) {
      const verificationId = verificationNodeId(candidate.task, requirement);
      const evidence = candidate.verificationEvidence;
      const source = evidence?.source || candidate.relative || existing.source;
      nodes.set(verificationId, {
        id: verificationId,
        type: 'verification',
        label: String(requirement),
        source,
        citation: { source },
        activityState: evidence?.state === 'passed' ? 'Passed' : 'Required',
        verificationState: evidence?.state || 'unknown',
      });
      if (!edges.some(item => item.from === id && item.to === verificationId && item.type === 'verified-by')) {
        edges.push({
          from: id, to: verificationId, type: 'verified-by', status: 'confirmed', source,
          citation: { source },
        });
      }
    }
  }

  return {
    schemaVersion: graph.schemaVersion || GRAPH_SCHEMA_VERSION,
    generatedAt: graph.generatedAt,
    sourceFingerprint: structuredClone(graph.sourceFingerprint || { hash: '', sources: [] }),
    health: structuredClone(graph.health || { valid: false, findings: ['Missing graph health.'] }),
    nodes: [...nodes.values()].sort((left, right) => left.id.localeCompare(right.id)),
    edges: edges.sort((left, right) => `${left.from}:${left.to}:${left.type}`.localeCompare(`${right.from}:${right.to}:${right.type}`)),
    candidateScope: {
      selectedTask,
      taskIds: candidates.map(candidate => graphTaskId(candidate.task)),
      intakeFingerprint: candidates.map(candidate => `${candidate.task}:${candidate.sha256 || ''}:${candidate.routingSha256 || ''}`).join('|'),
    },
  };
}

function semanticNode(node) {
  if (!node) return null;
  return {
    id: node.id,
    type: node.type,
    label: node.label,
    activityState: node.activityState,
    state: node.state,
    status: node.status,
    verificationState: node.verificationState,
    objective: node.objective,
  };
}

function relevantClosure(graph, taskIds) {
  const relevant = new Set(taskIds.map(graphTaskId));
  const nodes = new Map((graph.nodes || []).map(item => [item.id, item]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const relationship of graph.edges || []) {
      if (!SEMANTIC_EDGE_TYPES.has(relationship.type)) continue;
      const fromTask = nodes.get(relationship.from)?.type === 'task';
      const toTask = nodes.get(relationship.to)?.type === 'task';
      if (relevant.has(relationship.from) && !relevant.has(relationship.to)
        && (fromTask || !toTask)) {
        relevant.add(relationship.to);
        changed = true;
      } else if (relevant.has(relationship.to) && !relevant.has(relationship.from)
        && (toTask || !fromTask)) {
        relevant.add(relationship.from);
        changed = true;
      }
    }
  }
  return relevant;
}

function detectSemanticGraphChanges(previousGraph, currentGraph, options = {}) {
  if (!previousGraph || !currentGraph) return [];
  const relevant = relevantClosure(currentGraph, options.taskIds || []);
  const previousNodes = new Map((previousGraph.nodes || []).map(item => [item.id, item]));
  const currentNodes = new Map((currentGraph.nodes || []).map(item => [item.id, item]));
  const events = [];
  const add = (kind, node) => {
    if (!node || !relevant.has(node.id)) return;
    events.push({ kind, nodeId: node.id, source: node.source || previousNodes.get(node.id)?.source || '' });
  };
  for (const [id, current] of currentNodes) {
    if (!relevant.has(id)) continue;
    const previous = previousNodes.get(id);
    if (!previous) continue;
    const before = JSON.stringify(semanticNode(previous));
    const after = JSON.stringify(semanticNode(current));
    const previousState = taskState(previous.activityState || previous.state || previous.status || previous.verificationState);
    const currentState = taskState(current.activityState || current.state || current.status || current.verificationState);
    if (current.type === 'user-decision' && before !== after) add('changed-decision', current);
    if (['verification', 'qa'].includes(current.type) && currentState === 'failed' && previousState !== 'failed') add('failed-verification', current);
    if (current.type === 'requirement' && currentState === 'superseded' && previousState !== 'superseded') add('superseded-requirement', current);
    if (current.type === 'bug' && TERMINAL_BUG_STATES.has(currentState) && !TERMINAL_BUG_STATES.has(previousState)) add('fixed-bug', current);
  }
  const dependencySet = graphValue => new Set((graphValue.edges || [])
    .filter(item => item.type === 'depends-on' && (relevant.has(item.from) || relevant.has(item.to)))
    .map(item => `${item.from}\0${item.to}`));
  const beforeDependencies = dependencySet(previousGraph);
  const afterDependencies = dependencySet(currentGraph);
  for (const key of new Set([...beforeDependencies, ...afterDependencies])) {
    if (beforeDependencies.has(key) === afterDependencies.has(key)) continue;
    const from = key.split('\0')[0];
    add('changed-dependency', currentNodes.get(from) || previousNodes.get(from));
  }
  return [...new Map(events.map(item => [`${item.kind}\0${item.nodeId}`, item])).values()]
    .sort((left, right) => `${left.kind}:${left.nodeId}`.localeCompare(`${right.kind}:${right.nodeId}`));
}

function applyLessons(graph, ledger, lessonInputs, options = {}) {
  let projected = structuredClone(graph);
  const summary = {
    applicableLessons: [], contextRefs: [], dependencies: [], recoveryHints: [],
    existingChecks: [], verificationFloors: [],
  };
  for (const candidate of includedCandidates(ledger)) {
    const context = {
      taskId: candidate.task,
      workTypes: candidate.workTypes || [],
      surface: candidate.surface || '',
      requiredConditions: candidate.requiredConditions || [],
      lifecycleStates: candidate.lifecycleStates,
      safetyRejections: candidate.safetyRejections || [],
      safetyPassed: candidate.sensitive !== true,
      repairBudget: options.repairBudget || { mode: 'quick', before: 0, after: 0, limit: 1 },
    };
    const attached = attachApplicableGraphLessons(projected, lessonInputs, context);
    projected = attached.graph;
    for (const key of Object.keys(summary)) summary[key].push(...(attached[key] || []));
    for (const dependency of attached.dependencies) {
      if (!isSafeTaskId(dependency)) continue;
      const from = graphTaskId(candidate.task);
      const to = graphTaskId(dependency);
      if (!projected.nodes.some(item => item.id === to)) continue;
      const application = attached.applicableLessons.find(item => item.treatment.type === 'add_dependency'
        && item.treatment.value === dependency);
      if (!application || projected.edges.some(item => item.from === from && item.to === to && item.type === 'depends-on')) continue;
      projected.edges.push({
        from, to, type: 'depends-on', status: 'confirmed', source: application.source,
        citation: { source: application.source },
      });
    }
  }
  for (const key of Object.keys(summary)) {
    summary[key] = key === 'applicableLessons'
      ? [...new Map(summary[key].map(item => [item.lessonId, item])).values()].sort((left, right) => left.lessonId.localeCompare(right.lessonId))
      : [...new Set(summary[key])].sort();
  }
  projected.nodes.sort((left, right) => left.id.localeCompare(right.id));
  projected.edges.sort((left, right) => `${left.from}:${left.to}:${left.type}`.localeCompare(`${right.from}:${right.to}:${right.type}`));
  return { graph: projected, ...summary };
}

function evidenceIsAuthoritative(root, evidence, expectedState, requiredTaskIds = []) {
  if (!evidence || taskState(evidence.state) !== expectedState) return false;
  try {
    const target = safeRelative(root, evidence.source, 'Evidence source');
    const content = fs.readFileSync(target.absolute, 'utf8');
    const states = {
      passed: /\bpass(?:ed)?(?:\s+verification)?\b/i,
      running: /(?:^|\n)\s*(?:state|status)\s*:\s*running\b/im,
      completed: /(?:^|\n)\s*(?:state|status)\s*:\s*completed\b/im,
    };
    if (!states[expectedState]?.test(content)) return false;
    if (expectedState === 'completed' && !states.passed.test(content)) return false;
    return requiredTaskIds.every(taskId => content.includes(normalizeTaskId(taskId)));
  } catch {
    return false;
  }
}

function integrationPass(root, candidates, evidence) {
  const taskIds = candidates.map(candidate => graphTaskId(candidate.task));
  const base = {
    state: 'planned', count: 0, taskIds, evidence: null,
    representation: 'single-product-integration-pass',
  };
  if (!evidence) return base;
  if (taskState(evidence.state) === 'running' && evidenceIsAuthoritative(root, evidence, 'running')) {
    return { ...base, state: 'running', evidence: { source: evidence.source, citation: { source: evidence.source } } };
  }
  const expected = [...candidates.map(candidate => candidate.task)].sort();
  const accepted = [...(evidence.acceptedTaskIds || [])].map(normalizeTaskId).sort();
  if (taskState(evidence.state) === 'completed' && evidence.passed === true
    && evidenceIsAuthoritative(root, evidence, 'completed', expected)
    && JSON.stringify(expected) === JSON.stringify(accepted)) {
    return {
      ...base,
      state: 'completed',
      count: 1,
      evidence: { source: evidence.source, citation: { source: evidence.source }, passed: true, acceptedTaskIds: accepted },
    };
  }
  return base;
}

function graphFindings(root, graph, ledger, scheduler, integration, invalidation) {
  const findings = [];
  const candidates = includedCandidates(ledger);
  for (const candidate of candidates) {
    if (!ACCEPTED_PRE_RELEASE_STATES.has(taskState(candidate.boardStatus))) {
      findings.push({ code: 'candidate-state-not-accepted', taskId: graphTaskId(candidate.task), source: candidate.relative, citation: { source: candidate.relative } });
    }
    if (!evidenceIsAuthoritative(root, candidate.verificationEvidence, 'passed', [candidate.task])) {
      findings.push({ code: 'missing-authoritative-verification', taskId: graphTaskId(candidate.task), source: candidate.relative, citation: { source: candidate.relative } });
    }
    if (candidate.sensitive === true) {
      findings.push({ code: 'sensitive-operation-gate', taskId: graphTaskId(candidate.task), source: candidate.relative, citation: { source: candidate.relative } });
    }
  }
  for (const item of ledger.approvalGates || []) findings.push({ code: 'approval-gate', taskId: graphTaskId(item.task), source: 'PROJECT_BOARD.md', citation: { source: 'PROJECT_BOARD.md' } });
  for (const item of ledger.externalBlockers || []) findings.push({ code: 'external-blocker', taskId: graphTaskId(item.task), source: 'PROJECT_BOARD.md', citation: { source: 'PROJECT_BOARD.md' } });
  for (const conflict of scheduler.conflicts) findings.push({ code: 'unresolved-conflict', taskId: conflict.task.id, source: conflict.conflict.source, citation: conflict.conflict.citation });
  for (const finding of graph.health?.findings || []) findings.push({ code: 'graph-unhealthy', source: 'PROJECT_BOARD.md', citation: { source: 'PROJECT_BOARD.md' } });
  if (integration.state !== 'completed') findings.push({ code: 'integration-not-completed', source: 'PROJECT_BOARD.md', citation: { source: 'PROJECT_BOARD.md' } });
  if ((invalidation.recentlyInvalidated || []).length) findings.push({ code: 'candidate-invalidated', source: 'PROJECT_BOARD.md', citation: { source: 'PROJECT_BOARD.md' } });
  return findings.sort((left, right) => `${left.code}:${left.taskId || ''}`.localeCompare(`${right.code}:${right.taskId || ''}`));
}

function projectScheduler(scheduler, invalidation, findings) {
  const current = [...scheduler.current, ...scheduler.parallelReady].map(compact);
  const next = scheduler.next.map(compact);
  const blocked = scheduler.blocked.map(compact);
  const deferred = scheduler.deferred.map(compact);
  const conflicts = scheduler.conflicts.map(compact);
  const open = current.length + next.length + blocked.length + deferred.length + conflicts.length
    + scheduler.releaseGates.length + findings.length;
  return {
    current,
    next,
    blocked,
    deferred,
    conflicts,
    recentlyInvalidated: invalidation.recentlyInvalidated.map(compact),
    readyToShip: { ready: open === 0, reasons: open === 0 ? [] : [...new Set(findings.map(item => item.code).concat(open ? ['unfinished-or-gated-candidate-work'] : []))] },
  };
}

function projectionDirectory(root) {
  return path.join(root, '.fb', 'graph');
}

function envelopeFor(result, graph) {
  return {
    schemaVersion: PROJECTION_SCHEMA_VERSION,
    route: result.route,
    reasons: result.reasons,
    selectedTask: result.selectedTask,
    sourceFingerprint: structuredClone(graph?.sourceFingerprint || { hash: '', sources: [] }),
    generatedAt: new Date().toISOString(),
    graphHealth: structuredClone(graph?.health || { valid: false, findings: ['Graph unavailable.'] }),
    projection: result.projection,
    graphDrivenSequencing: result.graphDrivenSequencing === true,
    notice: result.notice || '',
  };
}

function writeGraphProjection(root, result) {
  const directory = projectionDirectory(root);
  fs.mkdirSync(directory, { recursive: true });
  const envelope = result.envelope || envelopeFor(result, result.executableGraph);
  fs.writeFileSync(path.join(directory, 'bfm-projection.json'), `${JSON.stringify(envelope, null, 2)}\n`);
  fs.writeFileSync(path.join(directory, 'bfm-projection.md'), `${renderGraphProjection(envelope)}\n`);
}

function malformedProjectionFallback(parsed, reason) {
  return authoritativeFallback(parsed?.selectedTask || '', [reason]);
}

function readGraphProjection(root, options = {}) {
  const target = path.join(projectionDirectory(root), 'bfm-projection.json');
  if (!fs.existsSync(target)) return null;
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch {
    return malformedProjectionFallback(null, 'projection-malformed');
  }
  if (!parsed || parsed.schemaVersion !== PROJECTION_SCHEMA_VERSION
    || !['direct', 'graph-driven', 'authoritative-fallback'].includes(parsed.route)
    || !Array.isArray(parsed.reasons) || !isSafeTaskId(parsed.selectedTask)
    || !parsed.projection || PROJECTION_KEYS.some(key => !Object.hasOwn(parsed.projection, key))
    || !parsed.sourceFingerprint || typeof parsed.sourceFingerprint.hash !== 'string'
    || !parsed.graphHealth || typeof parsed.graphHealth.valid !== 'boolean') {
    return malformedProjectionFallback(parsed, 'projection-malformed');
  }
  if (parsed.route !== 'authoritative-fallback') {
    let currentGraph = options.currentGraph;
    try {
      currentGraph ||= buildProjectGraph(root, { generatedAt: parsed.generatedAt });
    } catch {
      return malformedProjectionFallback(parsed, 'projection-revalidation-failed');
    }
    if (parsed.graphHealth.valid !== true || currentGraph.health?.valid !== true
      || (currentGraph.sourceFingerprint?.hash || '') !== parsed.sourceFingerprint.hash) {
      return malformedProjectionFallback(parsed, 'projection-stale-or-unhealthy');
    }
  }
  return {
    ...parsed,
    mode: parsed.route,
    graphDrivenSequencing: parsed.route === 'graph-driven',
  };
}

function resolveGraphInput(root, options = {}) {
  if (options.graph) {
    return {
      graph: options.graph,
      previousGraph: options.previousGraph || null,
      graphStatus: options.graphStatus || (options.graph.health?.valid === false ? 'corrupt' : 'healthy'),
      refresh: options.refresh || { changedSources: [], removedSources: [], reusedSources: [] },
    };
  }
  if (typeof options.refreshGraph === 'function') {
    try {
      const refresh = options.refreshGraph(root);
      if (!refresh?.graph || refresh.graph.health?.valid === false) return { graph: refresh?.graph, previousGraph: options.previousGraph || null, graphStatus: 'corrupt', refresh: refresh || {} };
      return { graph: refresh.graph, previousGraph: options.previousGraph || null, graphStatus: 'healthy', refresh };
    } catch {
      return { graph: null, previousGraph: null, graphStatus: 'corrupt', refresh: {} };
    }
  }
  let persisted;
  try {
    persisted = readProjectGraph(root);
  } catch (error) {
    return { graph: null, previousGraph: null, graphStatus: error.code === 'ENOENT' ? 'missing' : 'corrupt', refresh: {} };
  }
  try {
    const validation = validateProjectGraph(root, persisted);
    if (persisted.health?.valid === false || validation.length) return { graph: persisted, previousGraph: persisted, graphStatus: 'corrupt', refresh: {} };
    const current = buildProjectGraph(root, { generatedAt: persisted.generatedAt });
    if (current.sourceFingerprint.hash !== persisted.sourceFingerprint?.hash) return { graph: persisted, previousGraph: persisted, graphStatus: 'stale', refresh: {} };
    return { graph: persisted, previousGraph: persisted, graphStatus: 'healthy', refresh: { changedSources: [], removedSources: [], reusedSources: current.sourceFingerprint.sources.map(item => item.relativePath) } };
  } catch {
    return { graph: persisted, previousGraph: persisted, graphStatus: 'corrupt', refresh: {} };
  }
}

function directBfmResult(selectedTask, preflight, graph, ledger) {
  const candidate = includedCandidates(ledger).find(item => item.task === selectedTask);
  const result = {
    route: 'direct',
    mode: 'direct',
    reasons: preflight.reasons,
    selectedTask,
    graphDrivenSequencing: false,
    projection: {
      ...emptyProjection('direct-bfm-active'),
      current: candidate ? [{
        id: graphTaskId(candidate.task), type: 'task', label: candidate.task,
        source: candidate.relative, citation: { source: candidate.relative },
      }] : [],
    },
    lifecycle: [...LIFECYCLE],
    releaseBoundary: 'Ready to ship',
    releaseAuthorized: false,
    handoffs: { role: 'queued-product-inputs', executable: false },
  };
  result.envelope = envelopeFor(result, graph);
  return result;
}

function prepareGraphDrivenBfm(root, options = {}) {
  const selectedTask = normalizeTaskId(options.taskId);
  if (!isSafeTaskId(selectedTask)) throw new Error('Graph-driven BFM requires a safe task ID.');
  if (!options.ledger || !Array.isArray(options.ledger.candidates)) {
    throw new Error('Graph-driven BFM requires the frozen intake ledger.');
  }
  const resolved = resolveGraphInput(root, options);
  if (resolved.graphStatus !== 'healthy' || !resolved.graph) {
    const fallback = authoritativeFallback(selectedTask, [`graph-${resolved.graphStatus}`]);
    fallback.selectedTask = selectedTask;
    fallback.envelope = envelopeFor(fallback, resolved.graph);
    if (options.writeProjection === true) writeGraphProjection(root, fallback);
    return fallback;
  }

  const executable = compileBfmCandidateGraph(resolved.graph, options.ledger, { selectedTask });
  const candidates = includedCandidates(options.ledger);
  const semanticChanges = detectSemanticGraphChanges(resolved.previousGraph, resolved.graph, {
    taskIds: candidates.map(candidate => candidate.task),
  });
  const lessonInputs = options.lessonInputs || (() => {
    try { return readLearningRegistry(root); } catch { return []; }
  })();
  const lessonResult = applyLessons(executable, options.ledger, lessonInputs, {
    repairBudget: options.repairBudget,
  });
  const preflight = preflightBfmRoute({
    ledger: options.ledger,
    graph: lessonResult.graph,
    graphStatus: resolved.graphStatus,
    semanticChanges,
    applicableLessons: lessonResult.applicableLessons,
  });
  if (preflight.route === 'authoritative-fallback') {
    const fallback = authoritativeFallback(selectedTask, preflight.reasons);
    fallback.selectedTask = selectedTask;
    fallback.envelope = envelopeFor(fallback, resolved.graph);
    if (options.writeProjection === true) writeGraphProjection(root, fallback);
    return fallback;
  }
  if (preflight.route === 'direct') {
    const direct = directBfmResult(selectedTask, preflight, resolved.graph, options.ledger);
    if (options.writeProjection === true) writeGraphProjection(root, direct);
    return direct;
  }

  const brief = buildBrief(root, options.buildBriefPath || `docs/handoffs/${selectedTask}.md`);
  const priorities = (options.productPriorities || options.ledger.recommendedOrder || []).map(graphTaskId);
  const scheduler = scheduleGraph(lessonResult.graph, { priorityOrder: priorities });
  const validChanges = semanticChanges.filter(change => lessonResult.graph.nodes.some(item => item.id === change.nodeId));
  const invalidation = calculateGraphInvalidation(lessonResult.graph, validChanges);
  const integration = integrationPass(root, candidates, options.integrationEvidence);
  const findings = graphFindings(root, lessonResult.graph, options.ledger, scheduler, integration, invalidation);
  const projection = projectScheduler(scheduler, invalidation, findings);
  const frozenGraph = deepFreeze(structuredClone(lessonResult.graph));
  const result = {
    route: 'graph-driven',
    mode: 'graph-driven',
    reasons: preflight.reasons,
    selectedTask,
    graphDrivenSequencing: true,
    buildBrief: brief,
    snapshot: { frozen: Object.isFrozen(frozenGraph), activeSubgraph: frozenGraph },
    executableGraph: lessonResult.graph,
    semanticChanges,
    lessons: {
      applicableLessons: lessonResult.applicableLessons,
      contextRefs: lessonResult.contextRefs,
      dependencies: lessonResult.dependencies,
      recoveryHints: lessonResult.recoveryHints,
      existingChecks: lessonResult.existingChecks,
      verificationFloors: lessonResult.verificationFloors,
    },
    findings,
    scheduler,
    projection,
    integrationPass: integration,
    handoffs: { role: 'queued-product-inputs', executable: false },
    lifecycle: [...LIFECYCLE],
    refresh: {
      changedSources: resolved.refresh.changedSources || [],
      removedSources: resolved.refresh.removedSources || [],
      reusedSources: resolved.refresh.reusedSources || [],
    },
    releaseBoundary: 'Ready to ship',
    releaseAuthorized: false,
  };
  result.envelope = envelopeFor(result, resolved.graph);
  if (options.writeProjection === true) writeGraphProjection(root, result);
  return result;
}

function prepareBfmOrchestration(root, options = {}) {
  return prepareGraphDrivenBfm(root, options);
}

function itemIds(items) {
  return items.map(item => item.id || item.task?.id).filter(Boolean).join(', ') || 'None';
}

function renderGraphProjection(result) {
  const projection = result.projection || result;
  const route = result.route || result.mode || 'authoritative-fallback';
  const lines = [];
  if (route === 'authoritative-fallback') {
    lines.push('AUTHORITATIVE FALLBACK');
    lines.push('Graph-driven sequencing: unavailable');
    lines.push(result.notice || 'Graph state is unavailable; use authoritative records.');
  } else if (route === 'direct') {
    lines.push('Direct BFM');
    lines.push('Graph-driven sequencing: not required');
  } else {
    lines.push('FB graph delivery projection');
    lines.push('Graph-driven sequencing: active');
  }
  lines.push(`Route reasons: ${(result.reasons || []).join(', ') || 'None'}`);
  lines.push(`Current: ${itemIds(projection.current || [])}`);
  lines.push(`Next: ${itemIds(projection.next || [])}`);
  lines.push(`Blocked: ${itemIds(projection.blocked || [])}`);
  lines.push(`Deferred: ${itemIds(projection.deferred || [])}`);
  lines.push(`Conflicts: ${itemIds(projection.conflicts || [])}`);
  lines.push(`Recently invalidated: ${itemIds(projection.recentlyInvalidated || [])}`);
  lines.push(`Ready to ship: ${projection.readyToShip?.ready ? 'yes' : 'no'}`);
  return lines.join('\n');
}

module.exports = {
  PROJECTION_KEYS,
  PROJECTION_SCHEMA_VERSION,
  compileBfmCandidateGraph,
  detectSemanticGraphChanges,
  preflightBfmRoute,
  prepareBfmOrchestration,
  prepareGraphDrivenBfm,
  renderGraphProjection,
  readGraphProjection,
  writeGraphProjection,
};
