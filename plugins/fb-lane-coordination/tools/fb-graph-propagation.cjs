#!/usr/bin/env node
'use strict';

// Pure change-impact projection. Authoritative records remain unchanged; callers
// decide whether and how to record the returned effects.

const CHANGE_KINDS = new Set([
  'changed-decision',
  'failed-verification',
  'superseded-requirement',
  'fixed-bug',
  'changed-dependency',
]);

function normalizedState(node) {
  return String(node?.activityState || node?.state || node?.status || '').trim().toLowerCase();
}

function isUnstarted(node) {
  return ['ready', 'queued', 'planned', 'pending', 'todo', 'to do', 'not started'].includes(normalizedState(node));
}

function indexes(graph) {
  const nodes = new Map((graph.nodes || []).map(node => [node.id, node]));
  const outgoing = new Map();
  const incoming = new Map();
  for (const edge of graph.edges || []) {
    if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
    if (!incoming.has(edge.to)) incoming.set(edge.to, []);
    outgoing.get(edge.from).push(edge);
    incoming.get(edge.to).push(edge);
  }
  for (const collection of [...outgoing.values(), ...incoming.values()]) {
    collection.sort((left, right) => left.type.localeCompare(right.type)
      || left.from.localeCompare(right.from) || left.to.localeCompare(right.to));
  }
  return { nodes, outgoing, incoming };
}

function descendants(startId, nextIds) {
  const found = new Set();
  const queue = [startId];
  while (queue.length) {
    const current = queue.shift();
    for (const next of nextIds(current)) {
      if (next === startId || found.has(next)) continue;
      found.add(next);
      queue.push(next);
    }
  }
  return [...found];
}

function impact(node, change, effect, code, detail) {
  return {
    id: node.id,
    type: node.type,
    effect,
    changedNodeId: change.nodeId,
    changedSource: change.source,
    source: node.source,
    citation: { source: change.source },
    affectedCitation: node.citation || { source: node.source },
    reason: { code, detail },
  };
}

function sortImpacts(items) {
  const byId = new Map();
  for (const item of items) if (!byId.has(item.id)) byId.set(item.id, item);
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function calculateGraphInvalidation(graph = {}, changes = []) {
  const { nodes, outgoing, incoming } = indexes(graph);
  const result = {
    reopened: [],
    blocked: [],
    retired: [],
    requiredVerification: [],
    resequenced: [],
    recentlyInvalidated: [],
  };

  for (const rawChange of changes) {
    const kind = String(rawChange?.kind || '');
    if (!CHANGE_KINDS.has(kind)) throw new Error(`Graph change kind ${kind || '(missing)'} is not supported.`);
    const changedNode = nodes.get(rawChange.nodeId);
    if (!changedNode) throw new Error(`Changed graph node ${rawChange.nodeId || '(missing)'} is not present.`);
    const change = { ...rawChange, source: String(rawChange.source || changedNode.source || '') };
    if (!change.source) throw new Error(`Changed graph node ${change.nodeId} requires an authoritative source citation.`);

    if (kind === 'changed-decision') {
      const affected = descendants(change.nodeId, current => {
        const forward = (outgoing.get(current) || [])
          .filter(edge => ['affects', 'verified-by'].includes(edge.type))
          .map(edge => edge.to);
        const implementers = (incoming.get(current) || [])
          .filter(edge => edge.type === 'implements')
          .map(edge => edge.from);
        return [...forward, ...implementers];
      });
      for (const id of affected) {
        const node = nodes.get(id);
        if (!node || !['task', 'implementation-slice', 'verification', 'qa'].includes(node.type)) continue;
        result.reopened.push(impact(node, change, 'reopen', 'changed-decision-descendant',
          `${node.id} became stale because changed decision ${change.nodeId} is an authoritative ancestor.`));
      }
    }

    if (kind === 'failed-verification') {
      const implementations = (incoming.get(change.nodeId) || [])
        .filter(edge => edge.type === 'verified-by')
        .map(edge => edge.from);
      const releases = descendants(change.nodeId, current => {
        const directImplementations = (incoming.get(current) || [])
          .filter(edge => edge.type === 'verified-by')
          .map(edge => edge.from);
        const containers = (incoming.get(current) || [])
          .filter(edge => edge.type === 'included-in-release')
          .map(edge => edge.from);
        return [...directImplementations, ...containers];
      }).filter(id => nodes.get(id)?.type === 'release');
      for (const id of [...implementations, ...releases]) {
        const node = nodes.get(id);
        if (!node) continue;
        result.blocked.push(impact(node, change, 'block', 'failed-verification-block',
          `${node.id} became stale because verification ${change.nodeId} failed.`));
      }
    }

    if (kind === 'superseded-requirement') {
      const implementers = (incoming.get(change.nodeId) || [])
        .filter(edge => edge.type === 'implements')
        .map(edge => nodes.get(edge.from))
        .filter(node => node && ['task', 'implementation-slice'].includes(node.type) && isUnstarted(node));
      for (const node of implementers) {
        result.retired.push(impact(node, change, 'retire', 'superseded-requirement-retirement',
          `${node.id} became stale before execution because requirement ${change.nodeId} was superseded.`));
      }
    }

    if (kind === 'fixed-bug') {
      const checks = (outgoing.get(change.nodeId) || [])
        .filter(edge => edge.type === 'verified-by')
        .map(edge => nodes.get(edge.to))
        .filter(node => node && ['verification', 'qa'].includes(node.type));
      for (const node of checks) {
        result.requiredVerification.push(impact(node, change, 'require-verification', 'fixed-bug-regression-required',
          `${node.id} must run because fixed bug ${change.nodeId} is connected to this regression check.`));
      }
    }

    if (kind === 'changed-dependency') {
      const downstream = descendants(change.nodeId, current => (incoming.get(current) || [])
        .filter(edge => edge.type === 'depends-on')
        .map(edge => edge.from));
      for (const id of downstream) {
        const node = nodes.get(id);
        if (!node || !['task', 'implementation-slice'].includes(node.type)) continue;
        result.resequenced.push(impact(node, change, 'resequence', 'changed-dependency-downstream',
          `${node.id} sequencing became stale because dependency ${change.nodeId} changed.`));
      }
    }
  }

  for (const key of ['reopened', 'blocked', 'retired', 'requiredVerification', 'resequenced']) {
    result[key] = sortImpacts(result[key]);
  }
  result.recentlyInvalidated = sortImpacts([
    ...result.reopened,
    ...result.blocked,
    ...result.retired,
    ...result.requiredVerification,
    ...result.resequenced,
  ]);
  return result;
}

module.exports = { CHANGE_KINDS, calculateGraphInvalidation };
