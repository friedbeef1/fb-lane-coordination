#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const GRAPH_SCHEMA_VERSION = 1;
const NODE_TYPES = new Set(['project', 'okr', 'workstream', 'task', 'handoff', 'decision', 'qa', 'commit', 'release']);
const EDGE_TYPES = new Set(['contains', 'supports', 'owned-by', 'documented-by', 'depends-on', 'supersedes', 'implemented-by', 'verified-by', 'released-as']);
const AUTHORITY_EDGE_TYPES = new Set(['approved-by', 'authorizes', 'releases']);
const SENSITIVE = /\b(?:authorization\s*:\s*bearer|api[_-]?key|password|secret|token)\b/i;

function relativePath(root, candidate) {
  return path.relative(root, candidate).split(path.sep).join('/');
}

function frontmatter(markdown) {
  const match = String(markdown).match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (field) result[field[1]] = field[2];
  }
  return result;
}

function markdownLinks(markdown) {
  return [...String(markdown).matchAll(/\[[^\]]+\]\(([^)#]+)(?:#[^)]+)?\)/g)].map(match => match[1]);
}

function boardRows(markdown) {
  const rows = [];
  for (const line of String(markdown).split(/\r?\n/)) {
    if (!/^\|\s*TASK-[^|]+\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length >= 2) rows.push({ task: cells[0], status: cells[1], owner: cells[2] || '', line });
  }
  return rows;
}

function sourceFiles(root) {
  const files = [];
  const add = relative => {
    const target = path.join(root, relative);
    if (fs.existsSync(target) && fs.statSync(target).isFile()) files.push(relative);
  };
  const walk = relative => {
    const directory = path.join(root, relative);
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const child = path.posix.join(relative.split(path.sep).join('/'), entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(child);
    }
  };
  add('PROJECT_BOARD.md');
  add('docs/handoffs/index.md');
  walk('docs/handoffs');
  walk('docs/workstreams');
  walk('docs/qa');
  return [...new Set(files)].sort();
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sourceFingerprint(root, files) {
  const sources = files.map(relative => ({
    relativePath: relative,
    sha256: sha256(fs.readFileSync(path.join(root, relative))),
    size: fs.statSync(path.join(root, relative)).size,
  }));
  return { hash: sha256(JSON.stringify(sources)), sources };
}

function addNode(nodes, node) {
  if (!nodes.has(node.id)) nodes.set(node.id, node);
}

function addEdge(edges, edge) {
  const key = `${edge.from}\0${edge.to}\0${edge.type}\0${edge.source}`;
  if (!edges.has(key)) edges.set(key, edge);
}

function resolvedMarkdownTarget(root, source, target) {
  if (/^(?:https?:|file:|#)/i.test(target)) return null;
  const absolute = path.resolve(root, path.dirname(source), target);
  const relative = relativePath(root, absolute);
  if (relative === '..' || relative.startsWith('../') || path.isAbsolute(relative)) return null;
  return relative;
}

function buildProjectGraph(root, options = {}) {
  const resolvedRoot = path.resolve(root);
  const files = sourceFiles(resolvedRoot);
  const fingerprint = sourceFingerprint(resolvedRoot, files);
  const nodes = new Map();
  const edges = new Map();
  const generatedAt = options.generatedAt || new Date().toISOString();
  addNode(nodes, { id: 'project:root', type: 'project', label: path.basename(resolvedRoot), source: 'PROJECT_BOARD.md', status: 'confirmed' });

  const boardPath = path.join(resolvedRoot, 'PROJECT_BOARD.md');
  const board = fs.existsSync(boardPath) ? fs.readFileSync(boardPath, 'utf8') : '';
  for (const row of boardRows(board)) {
    const taskId = `task:${row.task}`;
    addNode(nodes, { id: taskId, type: 'task', label: `${row.task} · ${row.status}`, source: 'PROJECT_BOARD.md', status: 'confirmed' });
    addEdge(edges, { from: 'project:root', to: taskId, type: 'contains', source: 'PROJECT_BOARD.md', status: 'confirmed' });
    for (const target of markdownLinks(row.line)) {
      const relative = resolvedMarkdownTarget(resolvedRoot, 'PROJECT_BOARD.md', target);
      if (!relative || !fs.existsSync(path.join(resolvedRoot, relative))) continue;
      if (relative.startsWith('docs/handoffs/')) {
        const id = `handoff:${relative}`;
        addNode(nodes, { id, type: 'handoff', label: path.basename(relative, '.md'), source: relative, status: 'confirmed' });
        addEdge(edges, { from: taskId, to: id, type: 'documented-by', source: 'PROJECT_BOARD.md', status: 'confirmed' });
      } else if (relative.startsWith('docs/qa/')) {
        const id = `qa:${relative}`;
        addNode(nodes, { id, type: 'qa', label: path.basename(relative, '.md'), source: relative, status: 'confirmed' });
        addEdge(edges, { from: taskId, to: id, type: 'verified-by', source: 'PROJECT_BOARD.md', status: 'confirmed' });
      }
    }
  }

  for (const relative of files.filter(file => file.startsWith('docs/handoffs/') && path.basename(file) !== 'index.md')) {
    const markdown = fs.readFileSync(path.join(resolvedRoot, relative), 'utf8');
    const meta = frontmatter(markdown);
    if (!meta.task) continue;
    const taskId = `task:${meta.task}`;
    const handoffId = `handoff:${relative}`;
    addNode(nodes, { id: taskId, type: 'task', label: meta.task, source: 'PROJECT_BOARD.md', status: 'confirmed' });
    addNode(nodes, { id: handoffId, type: 'handoff', label: path.basename(relative, '.md'), source: relative, status: 'confirmed' });
    addEdge(edges, { from: taskId, to: handoffId, type: 'documented-by', source: relative, status: 'confirmed' });
    if (meta.lane) {
      const laneId = `workstream:${meta.lane}`;
      addNode(nodes, { id: laneId, type: 'workstream', label: meta.lane, source: relative, status: 'confirmed' });
      addEdge(edges, { from: taskId, to: laneId, type: 'owned-by', source: relative, status: 'confirmed' });
    }
    if (/^##\s+(?:Approved Decision|User Decision|Decision)\b/im.test(markdown)) {
      const decisionId = `decision:${relative}`;
      addNode(nodes, { id: decisionId, type: 'decision', label: `${meta.task} approved decision`, source: relative, status: 'confirmed' });
      addEdge(edges, { from: taskId, to: decisionId, type: 'supports', source: relative, status: 'confirmed' });
    }
    for (const target of markdownLinks(markdown)) {
      const resolved = resolvedMarkdownTarget(resolvedRoot, relative, target);
      if (!resolved || !fs.existsSync(path.join(resolvedRoot, resolved))) continue;
      if (resolved.startsWith('docs/qa/')) {
        const qaId = `qa:${resolved}`;
        addNode(nodes, { id: qaId, type: 'qa', label: path.basename(resolved, '.md'), source: resolved, status: 'confirmed' });
        addEdge(edges, { from: taskId, to: qaId, type: 'verified-by', source: relative, status: 'confirmed' });
      } else if (resolved.startsWith('docs/handoffs/')) {
        const dependencyId = `handoff:${resolved}`;
        addNode(nodes, { id: dependencyId, type: 'handoff', label: path.basename(resolved, '.md'), source: resolved, status: 'confirmed' });
        addEdge(edges, { from: handoffId, to: dependencyId, type: 'depends-on', source: relative, status: 'confirmed' });
      }
    }
  }

  const graph = {
    schemaVersion: GRAPH_SCHEMA_VERSION,
    level: 1,
    generatedAt,
    sourceFingerprint: fingerprint,
    nodes: [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...edges.values()].sort((a, b) => `${a.from}:${a.to}:${a.type}`.localeCompare(`${b.from}:${b.to}:${b.type}`)),
    health: { valid: true, findings: [], sourceCount: files.length },
  };
  const findings = validateProjectGraph(resolvedRoot, graph);
  graph.health = { valid: findings.length === 0, findings, sourceCount: files.length };
  return graph;
}

function validateProjectGraph(root, graph) {
  const findings = [];
  const nodeIds = new Set((graph.nodes || []).map(node => node.id));
  for (const item of [...(graph.nodes || []), ...(graph.edges || [])]) {
    const source = String(item.source || '');
    if (!source || path.isAbsolute(source) || source === '..' || source.startsWith('../')
      || (!source.startsWith('git:') && !fs.existsSync(path.join(root, source)))) {
      findings.push({ code: 'unsafe-source', message: `Graph item has an unsafe or missing source: ${source}` });
    }
    if (SENSITIVE.test(String(item.label || ''))) findings.push({ code: 'sensitive-output', message: 'Graph output contains sensitive-looking content.' });
  }
  for (const node of graph.nodes || []) {
    if (!NODE_TYPES.has(node.type)) findings.push({ code: 'invalid-node-type', message: `Invalid node type: ${node.type}` });
  }
  for (const edge of graph.edges || []) {
    if (!EDGE_TYPES.has(edge.type)) findings.push({ code: 'invalid-edge-type', message: `Invalid edge type: ${edge.type}` });
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) findings.push({ code: 'missing-endpoint', message: 'Graph edge endpoint is missing.' });
    if (edge.status !== 'confirmed' && AUTHORITY_EDGE_TYPES.has(edge.type)) {
      findings.push({ code: 'inferred-authority', message: 'Inferred or ambiguous edges cannot carry authority.' });
    }
  }
  return findings;
}

function atomicWrite(target, contents) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`;
  fs.writeFileSync(temporary, contents);
  fs.renameSync(temporary, target);
}

function reportMarkdown(graph) {
  return `# FB Project Graph

- Level: ${graph.level}
- Health: ${graph.health.valid ? 'healthy' : 'unhealthy'}
- Sources: ${graph.health.sourceCount}
- Nodes: ${graph.nodes.length}
- Edges: ${graph.edges.length}
- Ambiguous relationships: ${graph.edges.filter(edge => edge.status === 'ambiguous').length}
- Source fingerprint: \`${graph.sourceFingerprint.hash}\`

## Example queries

- What is active and blocked?
- What decision governs TASK-…?
- What verifies TASK-…?
- What depends on TASK-…?
- Which release contains TASK-…?
`;
}

function reportHtml(graph) {
  const rows = graph.nodes.map(node => `<tr><td>${node.type}</td><td>${node.label.replace(/[<>&]/g, '')}</td><td>${node.source}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>FB Project Graph</title><body><main><h1>FB Project Graph</h1><p>Level ${graph.level}; ${graph.nodes.length} nodes; ${graph.edges.length} edges.</p><table><thead><tr><th>Type</th><th>Label</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table><script type="application/json" id="fb-project-graph">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script></main></body></html>\n`;
}

function writeProjectGraph(root, graph) {
  const outputDirectory = path.join(root, '.fb', 'graph');
  const outputs = new Map([
    ['project-graph.json', `${JSON.stringify(graph, null, 2)}\n`],
    ['project-graph.md', reportMarkdown(graph)],
    ['project-graph.html', reportHtml(graph)],
    ['graph-state.json', `${JSON.stringify({
      schemaVersion: graph.schemaVersion,
      level: graph.level,
      generatedAt: graph.generatedAt,
      sourceFingerprint: graph.sourceFingerprint,
      health: graph.health,
    }, null, 2)}\n`],
  ]);
  let changed = false;
  for (const [name, contents] of outputs) {
    const target = path.join(outputDirectory, name);
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== contents) {
      atomicWrite(target, contents);
      changed = true;
    }
  }
  return { changed, outputDirectory };
}

function readProjectGraph(root) {
  return JSON.parse(fs.readFileSync(path.join(root, '.fb', 'graph', 'project-graph.json'), 'utf8'));
}

function queryProjectGraph() {
  return [];
}

function evaluateGraduation() {
  return { currentLevel: 1, recommendedLevel: 1, action: 'remain-level-1', reasons: [], requiresApproval: false, allowedCorpus: [] };
}

module.exports = {
  GRAPH_SCHEMA_VERSION,
  buildProjectGraph,
  validateProjectGraph,
  writeProjectGraph,
  readProjectGraph,
  queryProjectGraph,
  evaluateGraduation,
};

