#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { refreshProjectGraph, buildActiveSubgraph } = require('./fb-project-graph.cjs');
const { scheduleGraph } = require('./fb-graph-scheduler.cjs');
const { calculateGraphInvalidation } = require('./fb-graph-propagation.cjs');

const PROJECTION_KEYS = [
  'current', 'next', 'blocked', 'deferred', 'conflicts', 'recentlyInvalidated', 'readyToShip',
];
const LIFECYCLE = [
  'refresh-graph', 'freeze-active-subgraph', 'detect-gaps', 'apply-product-priorities',
  'schedule-bounded-slices', 'execute-ready-slices', 'update-authoritative-records',
  'refresh-graph-after-results', 'stop-at-ready-to-ship',
];

function safeRelative(root, relative, label) {
  const value = String(relative || '').replace(/\\/g, '/');
  const absolute = path.resolve(root, value);
  const prefix = `${path.resolve(root)}${path.sep}`;
  if (!value || path.isAbsolute(value) || (!absolute.startsWith(prefix) && absolute !== path.resolve(root))) {
    throw new Error(`${label} must be a repository-relative path.`);
  }
  return { value, absolute };
}

function buildBrief(root, relative) {
  const target = safeRelative(root, relative, 'Build Brief source');
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

function taskId(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized.startsWith('TASK:') ? `task:${normalized.slice(5)}` : `task:${normalized}`;
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

function authoritativeFallback(task, error) {
  return {
    mode: 'authoritative-fallback',
    graphDrivenSequencing: false,
    notice: `Graph refresh failed (${error.message}); using the visible authoritative fallback.`,
    authoritativeSources: [
      'PROJECT_BOARD.md', 'docs/handoffs/index.md', `docs/handoffs/${task}.md`, 'Git history',
    ],
    projection: emptyProjection('graph-refresh-failed'),
    lifecycle: [...LIFECYCLE],
    releaseBoundary: 'Ready to ship',
    releaseAuthorized: false,
    handoffs: { role: 'queued-product-inputs', executable: false },
  };
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
    readyToShip: { ready: open === 0, reasons: open === 0 ? [] : ['unfinished-or-gated-graph-work'] },
  };
}

function graphFindings(graph, scheduler) {
  const findings = [];
  const verifiedTasks = new Set((graph.edges || []).filter(edge => edge.type === 'verified-by').map(edge => edge.from));
  for (const node of graph.nodes || []) {
    if (node.type !== 'task') continue;
    const state = String(node.activityState || '').toLowerCase();
    if (!['done', 'complete', 'completed', 'closed'].includes(state) && !verifiedTasks.has(node.id)) {
      findings.push({ code: 'missing-verification', taskId: node.id, source: node.source, citation: node.citation || { source: node.source } });
    }
  }
  for (const conflict of scheduler.conflicts) {
    findings.push({ code: 'unresolved-conflict', taskId: conflict.task.id, source: conflict.conflict.source, citation: conflict.conflict.citation });
  }
  for (const finding of graph.health?.findings || []) {
    findings.push({ code: 'graph-stale', detail: String(finding), source: 'PROJECT_BOARD.md', citation: { source: 'PROJECT_BOARD.md' } });
  }
  return findings.sort((left, right) => `${left.code}:${left.taskId || ''}:${left.detail || ''}`.localeCompare(`${right.code}:${right.taskId || ''}:${right.detail || ''}`));
}

function projectionDirectory(root) {
  return path.join(root, '.fb', 'graph');
}

function writeGraphProjection(root, result) {
  const directory = projectionDirectory(root);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'bfm-projection.json'), `${JSON.stringify(result.projection, null, 2)}\n`);
  fs.writeFileSync(path.join(directory, 'bfm-projection.md'), `${renderGraphProjection(result)}\n`);
}

function readGraphProjection(root) {
  const target = path.join(projectionDirectory(root), 'bfm-projection.json');
  if (!fs.existsSync(target)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
    if (!parsed || PROJECTION_KEYS.some(key => !Object.prototype.hasOwnProperty.call(parsed, key))) return null;
    return parsed;
  } catch {
    return null;
  }
}

function prepareGraphDrivenBfm(root, options = {}) {
  const selectedTask = String(options.taskId || '').trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9-]*-[0-9]+$/.test(selectedTask)) throw new Error('Graph-driven BFM requires a safe task ID.');
  const brief = buildBrief(root, options.buildBriefPath || `docs/handoffs/${selectedTask}.md`);
  const refreshGraph = options.refreshGraph || refreshProjectGraph;
  let refresh;
  try {
    refresh = refreshGraph(root);
    if (!refresh?.graph || refresh.graph.health?.valid === false) throw new Error('derived graph is unhealthy');
  } catch (error) {
    const fallback = authoritativeFallback(selectedTask, error);
    if (options.writeProjection === true) writeGraphProjection(root, fallback);
    return fallback;
  }

  const graph = refresh.graph;
  const priorities = (options.productPriorities || []).map(taskId);
  const scheduler = scheduleGraph(graph, { priorityOrder: priorities });
  const invalidation = calculateGraphInvalidation(graph, options.changes || []);
  const findings = graphFindings(graph, scheduler);
  const activeSubgraph = deepFreeze(structuredClone(buildActiveSubgraph(graph, { taskId: selectedTask })));
  const projection = projectScheduler(scheduler, invalidation, findings);
  const result = {
    mode: 'graph-driven',
    graphDrivenSequencing: true,
    buildBrief: brief,
    snapshot: { frozen: Object.isFrozen(activeSubgraph), activeSubgraph },
    findings,
    scheduler,
    projection,
    integrationPass: {
      count: 1,
      taskIds: scheduler.parallelReady.map(item => item.id),
      representation: 'single-product-integration-pass',
    },
    handoffs: { role: 'queued-product-inputs', executable: false },
    lifecycle: [...LIFECYCLE],
    refresh: {
      changedSources: refresh.changedSources || [],
      removedSources: refresh.removedSources || [],
      reusedSources: refresh.reusedSources || [],
    },
    releaseBoundary: 'Ready to ship',
    releaseAuthorized: false,
  };
  if (options.writeProjection === true) writeGraphProjection(root, result);
  return result;
}

function itemIds(items) {
  return items.map(item => item.id || item.task?.id).filter(Boolean).join(', ') || 'None';
}

function renderGraphProjection(result) {
  const projection = result.projection || result;
  const lines = [];
  if (result.mode === 'authoritative-fallback') {
    lines.push('AUTHORITATIVE FALLBACK');
    lines.push('Graph-driven sequencing: unavailable');
    lines.push(result.notice);
  } else {
    lines.push('FB graph delivery projection');
    lines.push('Graph-driven sequencing: active');
  }
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
  prepareGraphDrivenBfm,
  renderGraphProjection,
  readGraphProjection,
  writeGraphProjection,
};
