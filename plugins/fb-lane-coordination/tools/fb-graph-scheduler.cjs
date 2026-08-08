#!/usr/bin/env node
'use strict';

// This module deliberately accepts an already-derived graph and produces a plan.
// It does not refresh the graph, read source records, execute tasks, or decide
// Product/BFM authority. Those operations remain at the integration boundary.

const TERMINAL_STATES = new Set(['done', 'complete', 'completed', 'resolved', 'retired', 'superseded']);
const READY_STATES = new Set(['ready', 'in progress', 'in-progress', 'active']);

function state(node) {
  return String(node?.activityState || node?.state || '').trim().toLowerCase();
}

function isTask(node) {
  return node?.type === 'task';
}

function isComplete(node) {
  return TERMINAL_STATES.has(state(node));
}

function isReady(node) {
  return READY_STATES.has(state(node));
}

function isCurrent(node) {
  return ['in progress', 'in-progress', 'active'].includes(state(node));
}

function citation(item) {
  return { source: item?.citation?.source || item?.source || '' };
}

function values(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  if (value instanceof Map) return [...value.keys()].map(item => String(item).trim()).filter(Boolean);
  if (value && typeof value === 'object') return Object.keys(value).filter(key => value[key] !== false).sort();
  return typeof value === 'string' && value.trim() ? [value.trim()] : [];
}

function hasLockDeclaration(node) {
  if (!Object.hasOwn(node || {}, 'locks')) return false;
  const locks = node.locks;
  return Array.isArray(locks) || locks instanceof Map || (locks !== null && typeof locks === 'object')
    || (typeof locks === 'string' && Boolean(locks.trim()));
}

function relation(edge, code, target) {
  return {
    code,
    ...(target ? { target } : {}),
    source: edge?.source || '',
    citation: citation(edge),
  };
}

function taskProjection(node, requirements, criticalPath, reasons = []) {
  return {
    id: node.id,
    type: node.type,
    label: node.label,
    source: node.source,
    citation: citation(node),
    ...(node.worktree ? { worktree: node.worktree } : {}),
    ...(hasLockDeclaration(node) ? { locks: values(node.locks).sort() } : {}),
    criticalPath,
    verificationRequirements: requirements,
    reasons,
  };
}

function compareId(left, right) {
  return left.id.localeCompare(right.id);
}

function edgeIndex(edges) {
  const from = new Map();
  const to = new Map();
  for (const edge of edges) {
    if (!from.has(edge.from)) from.set(edge.from, []);
    if (!to.has(edge.to)) to.set(edge.to, []);
    from.get(edge.from).push(edge);
    to.get(edge.to).push(edge);
  }
  for (const items of [...from.values(), ...to.values()]) {
    items.sort((a, b) => `${a.type}:${a.from}:${a.to}`.localeCompare(`${b.type}:${b.from}:${b.to}`));
  }
  return { from, to };
}

function taskDependencies(taskId, nodes, index) {
  const dependencies = [];
  for (const edge of index.from.get(taskId) || []) {
    if (edge.type === 'depends-on') dependencies.push({ edge, node: nodes.get(edge.to) });
  }
  for (const edge of index.to.get(taskId) || []) {
    if (edge.type === 'blocks') dependencies.push({ edge, node: nodes.get(edge.from) });
  }
  return dependencies.sort((a, b) => `${a.node?.id || a.edge.to}:${a.edge.type}`.localeCompare(`${b.node?.id || b.edge.to}:${b.edge.type}`));
}

function criticalPathFor(taskId, nodes, index, visiting = new Set()) {
  if (visiting.has(taskId)) return { path: [taskId], cyclic: true };
  const nextVisiting = new Set(visiting).add(taskId);
  const candidates = taskDependencies(taskId, nodes, index)
    .filter(item => isTask(item.node))
    .map(item => criticalPathFor(item.node.id, nodes, index, nextVisiting));
  if (!candidates.length) return { path: [taskId], cyclic: false };
  candidates.sort((left, right) => right.path.length - left.path.length || left.path.join('\0').localeCompare(right.path.join('\0')));
  const selected = candidates[0];
  return { path: [...selected.path, taskId], cyclic: selected.cyclic };
}

function verificationRequirements(taskId, nodes, index) {
  const requirements = [];
  for (const edge of [...(index.from.get(taskId) || []), ...(index.to.get(taskId) || [])]) {
    if (edge.type !== 'verified-by') continue;
    const verification = nodes.get(edge.from === taskId ? edge.to : edge.from);
    if (!verification || !['verification', 'qa'].includes(verification.type)) continue;
    requirements.push({
      id: verification.id,
      source: verification.source,
      citation: citation(verification),
    });
  }
  return [...new Map(requirements.map(item => [item.id, item])).values()].sort(compareId);
}

function unresolvedConflict(taskId, nodes, index) {
  const conflicts = [];
  for (const edge of [...(index.from.get(taskId) || []), ...(index.to.get(taskId) || [])]) {
    if (edge.type !== 'conflicts-with' || edge.status === 'resolved') continue;
    const conflict = nodes.get(edge.from === taskId ? edge.to : edge.from);
    if (conflict) conflicts.push({ edge, node: conflict });
  }
  return conflicts.sort((left, right) => left.node.id.localeCompare(right.node.id));
}

function collides(left, right) {
  if (left.worktree && right.worktree && left.worktree === right.worktree) return 'worktree-overlap';
  const leftLocks = new Set(values(left.locks));
  if (values(right.locks).some(lock => leftLocks.has(lock))) return 'shared-lock';
  return null;
}

function scheduleGraph(graph = {}, options = {}) {
  const nodes = new Map((graph.nodes || []).map(node => [node.id, node]));
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const index = edgeIndex(edges);
  const tasks = [...nodes.values()].filter(isTask).sort(compareId);
  const projection = {
    current: [],
    parallelReady: [],
    next: [],
    blocked: [],
    deferred: [],
    conflicts: [],
    releaseGates: [],
  };
  const gateById = new Map();
  const addGate = (item, reason) => {
    const key = `${item.id}\0${reason.code}`;
    if (!gateById.has(key)) gateById.set(key, { ...item, reasons: [reason] });
  };
  const details = new Map(tasks.map(task => {
    const critical = criticalPathFor(task.id, nodes, index);
    return [task.id, {
      task,
      criticalPath: critical.path,
      cyclic: critical.cyclic,
      requirements: verificationRequirements(task.id, nodes, index),
      dependencies: taskDependencies(task.id, nodes, index),
      conflicts: unresolvedConflict(task.id, nodes, index),
    }];
  }));
  const make = (detail, reasons = []) => taskProjection(detail.task, detail.requirements, detail.criticalPath, reasons);

  for (const detail of details.values()) {
    const { task } = detail;
    if (isCurrent(task)) {
      projection.current.push(make(detail, hasLockDeclaration(task)
        ? []
        : [relation(task, 'missing-lock-declaration')]));
    }
  }

  for (const detail of details.values()) {
    for (const requirement of detail.requirements) {
      const verification = nodes.get(requirement.id);
      if (!verification || !isComplete(verification)) {
        addGate({ ...requirement, type: 'verification-gate', label: verification?.label || requirement.id }, relation(detail.task, 'verification-required', requirement.id));
      }
    }
  }

  const candidates = [];
  for (const detail of details.values()) {
    const { task } = detail;
    if (isComplete(task) || isCurrent(task)) continue;
    if (options.approvedOutcomeSatisfied === true) {
      projection.deferred.push(make(detail, [relation(null, 'approved-outcome-satisfied')]));
      continue;
    }
    if (state(task) === 'blocked') {
      projection.blocked.push(make(detail, [relation(null, 'activity-blocked')]));
      continue;
    }
    if (detail.conflicts.length) {
      for (const conflict of detail.conflicts) {
        projection.conflicts.push({
          task: make(detail, [relation(conflict.edge, 'unresolved-conflict', conflict.node.id)]),
          conflict: {
            id: conflict.node.id,
            type: conflict.node.type,
            label: conflict.node.label,
            source: conflict.node.source,
            citation: citation(conflict.node),
          },
          reasons: [relation(conflict.edge, 'unresolved-conflict', conflict.node.id)],
        });
      }
      continue;
    }
    if (!isReady(task)) {
      projection.deferred.push(make(detail, [relation(null, 'not-ready')]));
      continue;
    }
    const blocking = detail.dependencies.filter(item => !item.node || !isComplete(item.node));
    if (detail.cyclic) {
      projection.blocked.push(make(detail, [relation(null, 'cyclic-dependency')]));
      continue;
    }
    if (blocking.some(item => item.edge.type === 'blocks' || state(item.node) === 'blocked')) {
      projection.blocked.push(make(detail, blocking.map(item => relation(item.edge, 'blocked-by', item.node?.id || item.edge.from))));
      continue;
    }
    if (blocking.length) {
      projection.next.push(make(detail, blocking.map(item => relation(item.edge, 'unresolved-dependency', item.node?.id || item.edge.to))));
      continue;
    }
    if (task.sensitive === true) {
      const entry = make(detail, [relation(null, 'sensitive-operation-gate')]);
      projection.deferred.push(entry);
      addGate(entry, relation(null, 'sensitive-operation-gate'));
      continue;
    }
    if (!task.worktree) {
      projection.deferred.push(make(detail, [relation(null, 'worktree-isolation-gate')]));
      continue;
    }
    if (!hasLockDeclaration(task)) {
      projection.deferred.push(make(detail, [relation(task, 'missing-lock-isolation-gate')]));
      continue;
    }
    candidates.push(detail);
  }

  const reserved = projection.current.map(entry => nodes.get(entry.id)).filter(Boolean);
  for (const detail of candidates) {
    const unknownCurrentLocks = reserved.filter(task => !hasLockDeclaration(task));
    if (unknownCurrentLocks.length) {
      projection.deferred.push(make(detail, unknownCurrentLocks.map(task => relation(task, 'missing-lock-isolation-gate', task.id))));
      continue;
    }
    const collisions = [...candidates.filter(other => other.task.id !== detail.task.id).map(other => collides(detail.task, other.task)),
      ...reserved.map(other => collides(detail.task, other))]
      .filter(Boolean)
      .sort();
    if (collisions.length) {
      projection.next.push(make(detail, [...new Set(collisions)].map(code => relation(null, code))));
    } else {
      projection.parallelReady.push(make(detail));
    }
  }

  projection.current.sort(compareId);
  projection.parallelReady.sort(compareId);
  projection.next.sort(compareId);
  projection.blocked.sort(compareId);
  projection.deferred.sort(compareId);
  projection.conflicts.sort((left, right) => left.task.id.localeCompare(right.task.id) || left.conflict.id.localeCompare(right.conflict.id));
  projection.releaseGates = [...gateById.values()].sort(compareId);
  return projection;
}

module.exports = { scheduleGraph };
