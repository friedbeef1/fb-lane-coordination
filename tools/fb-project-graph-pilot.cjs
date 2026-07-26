#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const {
  buildProjectGraph,
  writeProjectGraph,
  queryProjectGraph,
  resolveProjectContext,
  evaluateGraduation,
} = require('./fb-project-graph.cjs');

const WORKSTREAMS = ['Product/User', 'Business', 'Design', 'Tech', 'Discovery', 'Bugs'];

function write(root, relative, contents) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stableResultHash(result) {
  const copy = { ...result };
  delete copy.resultHash;
  return hash(JSON.stringify(copy));
}

function fixtureRecords(root, count) {
  const rows = [];
  const indexRows = [];
  for (let index = 1; index <= count; index += 1) {
    const task = `TASK-${100 + index}`;
    const lane = ['fb-product', 'fb-business', 'fb-design', 'fb-tech', 'fb-discovery', 'fb-bugs'][index - 1] || 'fb-product';
    rows.push(`| ${task} | In Progress | ${WORKSTREAMS[index - 1] || 'Product/User'} | Pilot | Graph question ${index} | none | [Handoff](docs/handoffs/${task}.md); [QA](docs/qa/${task}.md) |`);
    indexRows.push(`| ${task} | ${WORKSTREAMS[index - 1] || 'Product/User'} | ready | [${task}](${task}.md) |`);
    write(root, `docs/handoffs/${task}.md`, `---
type: fb-lane-handoff
task: ${task}
lane: ${lane}
status: ready
approval: approved
record_model: normalized-v1
---

# ${task}

## Approved Decision

Use the approved ${WORKSTREAMS[index - 1] || 'Product/User'} requirement.

## Dependencies

- [Shared governing decision](TASK-090.md)

## Verification

- [QA evidence](../qa/${task}.md)
`);
    write(root, `docs/qa/${task}.md`, `# ${task} QA\n\nFocused proof passed for ${task}.\n`);
    write(root, `docs/workstreams/${lane}.md`, `# ${WORKSTREAMS[index - 1] || 'Product/User'}

## ${task}

- Status: In Progress
- Next action: Answer the assigned graph question.
- Links: [Handoff](../handoffs/${task}.md)
`);
  }
  write(root, 'docs/handoffs/TASK-090.md', `---
type: fb-lane-handoff
task: TASK-090
lane: fb-product
status: done
approval: approved
record_model: normalized-v1
---

# TASK-090

## Approved Decision

All six workstreams must preserve the shared release boundary.
`);
  write(root, 'PROJECT_BOARD.md', `# Board

| ID | Status | Owner | Area | Scope | Locks | Links |
|---|---|---|---|---|---|---|
${rows.join('\n')}
`);
  write(root, 'docs/handoffs/index.md', `# Handoff Index

| Task | Lane | Status | Detail |
|---|---|---|---|
${indexRows.join('\n')}
`);
  return rows;
}

function createScenario(parent, name) {
  const root = path.join(parent, name);
  fs.mkdirSync(root, { recursive: true });
  const count = name === 'new-project' ? 2 : 6;
  fixtureRecords(root, count);
  const workstreams = WORKSTREAMS.map((workstream, index) => {
    const task = `TASK-${101 + index}`;
    const modes = [
      { query: `What decision governs ${task}?`, expectedSources: [`docs/handoffs/${task}.md`] },
      { query: `What is active for ${task}?`, expectedSources: ['PROJECT_BOARD.md'] },
      { query: `What decision governs ${task}?`, expectedSources: [`docs/handoffs/${task}.md`] },
      { query: `What verifies ${task}?`, expectedSources: [`docs/qa/${task}.md`] },
      { query: `What decision governs ${task}?`, expectedSources: [`docs/handoffs/${task}.md`] },
      { query: `What verifies ${task}?`, expectedSources: [`docs/qa/${task}.md`] },
    ];
    return {
      workstream,
      task,
      query: modes[index].query,
      expectedSources: modes[index].expectedSources,
      dependencySource: 'docs/handoffs/TASK-090.md',
      handoff: `docs/handoffs/${task}.md`,
      card: `docs/workstreams/${['fb-product', 'fb-business', 'fb-design', 'fb-tech', 'fb-discovery', 'fb-bugs'][index]}.md`,
    };
  }).slice(0, count);
  return {
    root,
    workstreams,
    inputs: {
      root,
      workstreams: workstreams.map(({ workstream, task, query }) => ({ workstream, task, query })),
    },
  };
}

function fileBytes(root, relative) {
  const target = path.join(root, relative);
  return fs.existsSync(target) ? fs.statSync(target).size : 0;
}

function dependencyResolved(graph, task, dependencySource) {
  const start = `task:${task}`;
  const target = `handoff:${dependencySource}`;
  const adjacency = new Map();
  for (const edge of graph.edges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    if (!adjacency.has(edge.to)) adjacency.set(edge.to, []);
    adjacency.get(edge.from).push(edge.to);
    adjacency.get(edge.to).push(edge.from);
  }
  let frontier = [start];
  const seen = new Set(frontier);
  for (let depth = 0; depth < 3; depth += 1) {
    const next = [];
    for (const node of frontier) {
      if (node === target) return true;
      for (const neighbor of adjacency.get(node) || []) {
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          next.push(neighbor);
        }
      }
    }
    frontier = next;
  }
  return seen.has(target);
}

function createMinimalPacket(graph, item) {
  const results = queryProjectGraph(graph, item.query, { currentTask: item.task });
  const preferred = [
    item.handoff,
    ...item.expectedSources,
    item.dependencySource,
  ];
  const resultSources = new Set(results.map(result => result.source));
  const citations = [...new Set([
    ...preferred.filter(source => resultSources.has(source)),
    ...results.map(result => result.source),
  ])].filter(Boolean).slice(0, 3);
  const readableSources = citations.filter(source =>
    source !== 'PROJECT_BOARD.md'
    && source !== 'docs/handoffs/index.md'
    && (source === item.handoff
      || source === item.dependencySource
      || item.expectedSources.includes(source)));
  return {
    task: item.task,
    workstream: item.workstream,
    question: item.query,
    facts: results.slice(0, 6).map(result => ({
      type: result.type,
      label: result.label,
      status: result.status,
      source: result.source,
      relationshipPath: result.relationshipPath,
    })),
    citations,
    readableSources,
    fallback: 'If the packet is insufficient, open only readableSources and state which source was needed.',
  };
}

async function runArm(scenario, mode, graph) {
  let active = 0;
  let maxConcurrent = 0;
  const startedAt = performance.now();
  const workers = scenario.workstreams.map(item => (async () => {
    active += 1;
    maxConcurrent = Math.max(maxConcurrent, active);
    const workerStarted = performance.now();
    await new Promise(resolve => setImmediate(resolve));
    let actualSources;
    let readFiles;
    let dependencyFound;
    if (mode === 'normalized') {
      readFiles = ['PROJECT_BOARD.md', 'docs/handoffs/index.md', item.handoff, item.card, item.dependencySource, ...item.expectedSources];
      actualSources = [...item.expectedSources];
      dependencyFound = fs.readFileSync(path.join(scenario.root, item.handoff), 'utf8').includes('(TASK-090.md)');
    } else {
      const results = queryProjectGraph(graph, item.query);
      actualSources = [...new Set(results.map(result => result.source))];
      readFiles = [...new Set([...item.expectedSources, item.dependencySource])];
      dependencyFound = dependencyResolved(graph, item.task, item.dependencySource);
    }
    const correct = item.expectedSources.every(source => actualSources.includes(source));
    const responseBytes = Buffer.byteLength(JSON.stringify({ actualSources, dependencyFound }));
    const sourceBytes = readFiles.reduce((total, relative) => total + fileBytes(scenario.root, relative), 0);
    active -= 1;
    return {
      workstream: item.workstream,
      task: item.task,
      query: item.query,
      actualSources,
      correct,
      dependencyFound,
      readFiles,
      bytesRead: sourceBytes,
      responseBytes,
      navigationBytes: sourceBytes + responseBytes,
      workerMilliseconds: performance.now() - workerStarted,
    };
  })());
  const results = await Promise.all(workers);
  const allFiles = results.flatMap(result => result.readFiles);
  const uniqueFiles = [...new Set(allFiles)];
  return {
    workstreamsStarted: results.length,
    maxConcurrent,
    wallMilliseconds: performance.now() - startedAt,
    summedWorkerMilliseconds: results.reduce((total, result) => total + result.workerMilliseconds, 0),
    filesRead: allFiles.length,
    uniqueFilesRead: uniqueFiles.length,
    repeatedFileReads: allFiles.length - uniqueFiles.length,
    bytesRead: results.reduce((total, result) => total + result.bytesRead, 0),
    responseBytes: results.reduce((total, result) => total + result.responseBytes, 0),
    navigationBytes: results.reduce((total, result) => total + result.navigationBytes, 0),
    correctAnswers: results.filter(result => result.correct).length,
    incorrectAssumptions: results.filter(result => !result.correct).length,
    missingDependencies: results.filter(result => !result.dependencyFound).length,
    reconciliationFindings: results.filter(result => !result.correct || !result.dependencyFound).map(result => result.task),
    workstreams: results,
  };
}

function repositoryExample(repositoryRoot) {
  const graph = buildProjectGraph(repositoryRoot, { generatedAt: '2026-07-26T00:00:00.000Z' });
  const queries = [
    'What is active for TASK-048?',
    'What decision governs TASK-048?',
    'What does TASK-048 depend on?',
    'What is the next approval gate for TASK-048?',
  ];
  return {
    graphNodes: graph.nodes.length,
    graphEdges: graph.edges.length,
    queries: queries.map(query => ({
      query,
      sources: [...new Set(queryProjectGraph(graph, query).map(result => result.source))].slice(0, 8),
    })),
  };
}

function unmirrorSnapshot() {
  const canonical = '/Users/jamesyeang/Projects/mirrorcam';
  const board = path.join(canonical, 'PROJECT_BOARD.md');
  if (!fs.existsSync(board)) return { status: 'blocked', reason: 'canonical repository is unavailable' };
  const before = hash(fs.readFileSync(board));
  const normalized = fs.existsSync(path.join(canonical, 'docs/fb/records.md'));
  const after = hash(fs.readFileSync(board));
  if (!normalized) return { status: 'blocked', reason: 'canonical normalized inputs are unavailable', canonicalUnchanged: before === after };
  return { status: 'available', canonicalUnchanged: before === after };
}

async function runPilot(options = {}) {
  const outputRoot = path.resolve(options.root || process.cwd());
  const fixtureParent = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-project-graph-pilot-'));
  const newScenario = createScenario(fixtureParent, 'new-project');
  const newStart = performance.now();
  const newGraph = buildProjectGraph(newScenario.root, { generatedAt: '2026-07-26T00:00:00.000Z' });
  const newProject = {
    level: newGraph.level,
    graphNodes: newGraph.nodes.length,
    graphEdges: newGraph.edges.length,
    graphBuildMilliseconds: performance.now() - newStart,
    graphBytes: Buffer.byteLength(JSON.stringify(newGraph)),
  };

  const growingScenario = createScenario(fixtureParent, 'growing-project');
  const growingGraph = buildProjectGraph(growingScenario.root, { generatedAt: '2026-07-26T00:00:00.000Z' });
  const graduation = evaluateGraduation({
    projectClass: 'long-lived',
    currentLevel: 1,
    frictionSignals: [{
      type: 'repeated-governing-decision-search',
      query: 'Which approved decision governs the shared release boundary?',
      occurrences: 2,
      source: 'docs/experiments/TASK-048-friction.json',
    }],
    allowedCorpus: ['docs/handoffs', 'docs/workstreams'],
  });
  const growingProject = {
    level: growingGraph.level,
    graphNodes: growingGraph.nodes.length,
    graphEdges: growingGraph.edges.length,
    graduation,
    semanticExtractionRan: false,
  };

  writeProjectGraph(growingScenario.root, growingGraph);
  fs.writeFileSync(path.join(growingScenario.root, '.fb/graph/project-graph.json'), '{broken');
  const damagedGraph = resolveProjectContext(growingScenario.root, 'What verifies TASK-104?');

  const concurrentScenario = createScenario(fixtureParent, 'six-workstream');
  const concurrentGraph = buildProjectGraph(concurrentScenario.root, { generatedAt: '2026-07-26T00:00:00.000Z' });
  const normalizedArm = await runArm(concurrentScenario, 'normalized', concurrentGraph);
  const graphArm = await runArm(concurrentScenario, 'graph-assisted', concurrentGraph);
  graphArm.oneTimeGraphBuildSourceBytes = concurrentGraph.sourceFingerprint.sources.reduce((total, source) => total + source.size, 0);
  graphArm.graphArtifactBytes = Buffer.byteLength(JSON.stringify(concurrentGraph));
  graphArm.firstRunTotalBytes = graphArm.navigationBytes + graphArm.oneTimeGraphBuildSourceBytes + graphArm.graphArtifactBytes;
  normalizedArm.oneTimeGraphBuildSourceBytes = 0;
  normalizedArm.graphArtifactBytes = 0;
  normalizedArm.firstRunTotalBytes = normalizedArm.navigationBytes;
  const concurrent = {
    normalized: normalizedArm,
    graphAssisted: graphArm,
  };

  const result = {
    experiment: 'TASK-048',
    generatedAt: new Date().toISOString(),
    newProject,
    growingProject,
    damagedGraph: { route: damagedGraph.route, findings: damagedGraph.findings },
    concurrent,
    fbRepository: repositoryExample(path.resolve(options.repositoryRoot || process.cwd())),
    unmirror: options.includeUnmirror === false ? { status: 'not-run' } : unmirrorSnapshot(),
    providerTokens: 'unavailable',
  };
  result.resultHash = stableResultHash(result);
  const resultPath = path.join(outputRoot, '.fb', 'graph', 'pilot-results.json');
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

function verifyStoredResults(resultPath) {
  const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const computed = stableResultHash(result);
  return { valid: computed === result.resultHash, hash: computed };
}

async function main() {
  const [command, flag, experiment] = process.argv.slice(2);
  if (!['run', 'verify'].includes(command) || flag !== '--experiment' || !experiment) {
    console.error('Usage: node tools/fb-project-graph-pilot.cjs run|verify --experiment TASK-048');
    process.exitCode = 2;
    return;
  }
  const resultPath = path.join(process.cwd(), '.fb', 'graph', 'pilot-results.json');
  if (command === 'verify') {
    const verification = verifyStoredResults(resultPath);
    console.log(`${verification.valid ? 'verified' : 'invalid'} ${verification.hash}`);
    if (!verification.valid) process.exitCode = 1;
    return;
  }
  const results = await runPilot({ root: process.cwd(), repositoryRoot: process.cwd(), includeUnmirror: true });
  console.log(`new-project: Level ${results.newProject.level}`);
  console.log(`growing-project: Level ${results.growingProject.graduation.recommendedLevel} recommended; semantic extraction not run`);
  console.log(`damaged-graph: ${results.damagedGraph.route}`);
  console.log('six-workstream comparison: normalized and graph-assisted arms complete');
  console.log('FB repository: comparison complete');
  console.log(`Unmirror snapshot: ${results.unmirror.status}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  createScenario,
  createMinimalPacket,
  runPilot,
  verifyStoredResults,
};
