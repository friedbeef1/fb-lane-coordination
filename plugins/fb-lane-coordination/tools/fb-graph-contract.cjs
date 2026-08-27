#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CONTRACT_PATH = path.join(__dirname, 'fb-graph-contract.json');
const CONTRACT = Object.freeze(JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8')));

function normalized(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function list(values) {
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(', ')}, or ${values.at(-1)}`;
}

function supportsGraphRead(schemaVersion) {
  return CONTRACT.graphSchema.read.includes(Number(schemaVersion));
}

function canonicalNodeType(value) {
  const type = normalized(value);
  const canonical = CONTRACT.nodeTypes[type] ? type : CONTRACT.nodeAliases[type];
  if (!canonical) throw new Error(`Unsupported graph node type: ${value}`);
  return canonical;
}

function canonicalEdgeType(value) {
  const type = normalized(value);
  if (CONTRACT.edgeTypes[type]) return { type, reverse: false };
  const alias = CONTRACT.edgeAliases[type];
  if (!alias) throw new Error(`Unsupported graph edge type: ${value}`);
  return { type: alias.type, reverse: alias.reverse === true };
}

function canonicalState(nodeType, value) {
  const type = canonicalNodeType(nodeType);
  const state = normalized(value);
  const descriptor = CONTRACT.nodeTypes[type];
  if (!descriptor.states.includes(state)) throw new Error(`Unsupported ${type} state: ${value}`);
  return state;
}

function validateStateTransition(nodeType, fromValue, toValue) {
  let type;
  let from;
  let to;
  try {
    type = canonicalNodeType(nodeType);
    from = canonicalState(type, fromValue);
    to = canonicalState(type, toValue);
  } catch (error) {
    return { valid: false, code: 'invalid-state', message: error.message };
  }
  if (from === to) return { valid: true };
  if (CONTRACT.nodeTypes[type].terminal.includes(from)) {
    return { valid: false, code: 'terminal-state-transition', message: `${type} is terminal at ${from}.` };
  }
  if (!(CONTRACT.nodeTypes[type].transitions[from] || []).includes(to)) {
    return { valid: false, code: 'invalid-state-transition', message: `${type} cannot transition from ${from} to ${to}.` };
  }
  return { valid: true };
}

function validateGraphEdge(edge) {
  const rawType = normalized(edge?.type);
  if (CONTRACT.authority.forbiddenEdgeTypes.includes(rawType)) {
    return {
      valid: false,
      code: 'forbidden-authority-edge',
      message: `${rawType} cannot grant approval, verification, release, or Push Live authority.`,
    };
  }
  let canonical;
  let fromType;
  let toType;
  try {
    canonical = canonicalEdgeType(rawType);
    fromType = canonicalNodeType(edge?.fromType);
    toType = canonicalNodeType(edge?.toType);
  } catch (error) {
    return { valid: false, code: 'invalid-graph-type', message: error.message };
  }
  if (canonical.reverse) [fromType, toType] = [toType, fromType];
  const descriptor = CONTRACT.edgeTypes[canonical.type];
  const permits = (allowed, observed) => allowed.includes('*') || allowed.includes(observed);
  if (!permits(descriptor.from, fromType) || !permits(descriptor.to, toType)) {
    return {
      valid: false,
      code: 'invalid-edge-direction',
      message: `${canonical.type} must point from ${list(descriptor.from)} to ${list(descriptor.to)}.`,
    };
  }
  return { valid: true };
}

function normalizeGraphWrite(value = {}) {
  const nodes = (value.nodes || []).map(node => {
    const type = canonicalNodeType(node.type);
    const stateValue = node.state ?? node.activityState ?? node.verificationState;
    return {
      ...node,
      type,
      ...(stateValue === undefined ? {} : { state: canonicalState(type, stateValue) }),
      ...(stateValue === undefined ? {} : { activityState: undefined, verificationState: undefined }),
    };
  }).map(node => Object.fromEntries(Object.entries(node).filter(([, item]) => item !== undefined)));
  const nodeTypes = new Map(nodes.map(node => [node.id, node.type]));
  const edges = (value.edges || []).map(edge => {
    const rawType = normalized(edge.type);
    if (CONTRACT.authority.forbiddenEdgeTypes.includes(rawType)) {
      throw new Error(`${rawType} cannot grant approval, verification, release, or Push Live authority.`);
    }
    const canonical = canonicalEdgeType(rawType);
    const from = canonical.reverse ? edge.to : edge.from;
    const to = canonical.reverse ? edge.from : edge.to;
    const result = validateGraphEdge({
      ...edge,
      type: canonical.type,
      fromType: nodeTypes.get(from),
      toType: nodeTypes.get(to),
    });
    if (!result.valid) throw new Error(result.message);
    return { ...edge, from, to, type: canonical.type };
  });
  return {
    ...value,
    schemaVersion: CONTRACT.graphSchema.write,
    contractVersion: CONTRACT.contractVersion,
    nodes,
    edges,
  };
}

module.exports = {
  CONTRACT,
  CONTRACT_PATH,
  supportsGraphRead,
  canonicalNodeType,
  canonicalEdgeType,
  canonicalState,
  validateStateTransition,
  validateGraphEdge,
  normalizeGraphWrite,
};
