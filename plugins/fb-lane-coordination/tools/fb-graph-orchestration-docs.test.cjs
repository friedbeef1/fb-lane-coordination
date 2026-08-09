#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const explanation = 'The graph is the product-delivery map. Workstream loops investigate and improve parts of it. Product/BFM navigates the graph, and Codex executes its approved sequence.';
const leanProcess = /focused proof per slice[\s\S]{0,220}one consolidated behavioral\s+repair[\s\S]{0,220}one whole-candidate review[\s\S]{0,220}one final\s+release checkpoint/i;

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function prose(relative) {
  return read(relative).replace(/\s+/g, ' ');
}

const graphSkills = [
  'skills/bfm/SKILL.md',
  'skills/fb-product/SKILL.md',
  'skills/fb-lane-coordination/SKILL.md',
  'skills/project-coordination-setup/SKILL.md',
  'skills/fb-setup/SKILL.md',
  'skills/fb-user/SKILL.md',
  'skills/fb-business/SKILL.md',
  'skills/fb-design/SKILL.md',
  'skills/fb-tech/SKILL.md',
  'skills/fb-discovery/SKILL.md',
  'skills/fb-bugs/SKILL.md',
];

test('all canonical roles use one consistent graph explanation', () => {
  for (const relative of graphSkills) {
    assert.ok(prose(relative).includes(explanation), `${relative} must contain the canonical graph explanation`);
  }
  for (const relative of ['docs/fb/graph.md', 'docs/fb/workflow.md', 'docs/fb/learning.md', 'docs/fb/evidence.md', 'docs/setup.md', 'README.md', 'templates/AGENTS.md']) {
    assert.ok(prose(relative).includes(explanation), `${relative} must contain the canonical graph explanation`);
  }
  assert.ok(prose('plugins/fb-lane-coordination/README.md').includes(explanation), 'plugin README must contain the canonical graph explanation');
});

test('default execution is lean at candidate level and rejects mandatory per-slice review loops', () => {
  const processFiles = [
    'skills/bfm/SKILL.md',
    'skills/fb-product/SKILL.md',
    'skills/fb-lane-coordination/SKILL.md',
    'skills/project-coordination-setup/SKILL.md',
    'docs/fb/workflow.md',
    'docs/fb/guardrails.md',
    'templates/AGENTS.md',
  ];
  for (const relative of processFiles) {
    const source = read(relative);
    assert.match(source, leanProcess, `${relative} must state the lean whole-candidate process`);
    assert.doesNotMatch(source, /runtime(?:\/test| and test)[\s\S]{0,80}(?:exactly one|one) reviewer/i, `${relative} must not require the retired runtime per-slice reviewer`);
    assert.doesNotMatch(source, /(?:review|reviewer|re-review)[^\n]{0,80}(?:after|for) each slice/i, `${relative} must not require review after every slice`);
  }
});

test('graph guidance documents hybrid authority, safe rebuild, relationships, history, invalidation, and storage boundary', () => {
  const graph = read('docs/fb/graph.md');
  assert.match(graph, /Markdown[\s\S]{0,100}Git[\s\S]{0,160}authoritative/i);
  assert.match(graph, /derived[\s\S]{0,120}(?:delete|rebuild)[\s\S]{0,120}safely/i);
  assert.match(graph, /optional structured relationships/i);
  for (const relationship of ['depends_on', 'conflicts_with', 'affects', 'supersedes']) assert.match(graph, new RegExp(relationship));
  assert.match(graph, /historical retrieval/i);
  assert.match(graph, /changed decision[\s\S]{0,160}failed verification[\s\S]{0,160}superseded requirement[\s\S]{0,160}fixed bug[\s\S]{0,160}changed dependency/i);
  assert.match(graph, /no graph\s+database/i);
  assert.match(graph, /Push Live[\s\S]{0,100}(?:only|release)/i);
});

test('setup and migration add rebuildable graph support without overwriting project records', () => {
  const setup = read('docs/setup.md');
  assert.match(setup, /bootstrap|upgrade/i);
  assert.match(setup, /derived graph support/i);
  assert.match(setup, /without overwriting\s+project-owned (?:boards|records|handoffs|learning)/i);
  assert.match(setup, /former roots[\s\S]{0,120}recoverable/i);
  for (const tool of ['fb-graph-scheduler', 'fb-graph-propagation', 'fb-graph-learning', 'fb-graph-bfm']) {
    assert.match(setup, new RegExp(tool), `manual setup must include ${tool}`);
  }
});

test('package manifest declares every graph runtime and focused contract', () => {
  const manifest = JSON.parse(read('tools/fb-package-manifest.json'));
  for (const relative of [
    'tools/fb-graph-propagation.cjs',
    'tools/fb-graph-propagation.test.cjs',
    'tools/fb-graph-learning.cjs',
    'tools/fb-graph-learning.test.cjs',
    'tools/fb-graph-bfm.cjs',
    'tools/fb-graph-bfm.test.cjs',
    'tools/fb-graph-orchestration-integration.test.cjs',
    'tools/fb-graph-orchestration-docs.test.cjs',
  ]) assert.ok(manifest.includes(relative), `${relative} must be package-managed`);
});

test('BFM guidance matches automatic candidate-scoped routing and evidence readiness', () => {
  for (const relative of ['skills/bfm/SKILL.md', 'docs/fb/graph.md']) {
    const source = read(relative);
    assert.match(source, /automatic route preflight|deterministic preflight/i);
    assert.match(source, /Direct BFM[\s\S]{0,300}(?:one|1)[\s\S]{0,180}isolat/i);
    assert.match(source, /frozen[\s\S]{0,220}(?:candidate-scoped executable graph|Include now)[\s\S]{0,260}dependency closure/i);
    assert.match(source, /verified-by[\s\S]{0,120}(?:never proof|never proves|requirement, never proof)/i);
    assert.match(source, /planned[\s\S]{0,80}running[\s\S]{0,80}completed[\s\S]{0,160}authoritative evidence/i);
  }
});

test('declared package mirrors are byte-identical after the single mechanical sync', () => {
  const manifest = JSON.parse(read('tools/fb-package-manifest.json'));
  for (const relative of manifest) {
    const packaged = `plugins/fb-lane-coordination/${relative}`;
    assert.ok(fs.existsSync(path.join(root, packaged)), `${packaged} must exist`);
    assert.deepEqual(fs.readFileSync(path.join(root, packaged)), fs.readFileSync(path.join(root, relative)), `${packaged} must mirror ${relative}`);
  }
});
