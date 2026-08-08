#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const GRAPH_SCHEMA_VERSION = 1;
const NODE_TYPES = new Set([
  'project', 'workstream', 'user-decision', 'assumption', 'requirement', 'handoff', 'task',
  'implementation-slice', 'bug', 'verification', 'lesson', 'release',
  // Level-1 aliases remain readable for existing graphs and historical artifacts.
  'okr', 'decision', 'document', 'qa', 'commit',
]);
const EDGE_TYPES = new Set([
  'depends-on', 'blocks', 'conflicts-with', 'supersedes', 'affects', 'implements',
  'verified-by', 'learned-from', 'owned-by', 'included-in-release',
  // Level-1 aliases remain readable for existing graphs and historical artifacts.
  'contains', 'supports', 'documented-by', 'references', 'implemented-by', 'released-as',
]);
const AUTHORITY_EDGE_TYPES = new Set(['approved-by', 'authorizes', 'releases']);
const SENSITIVE = /\b(?:authorization\s*:\s*bearer|api[_-]?key|password|secret|token)\b/i;
const SAFE_TASK_ID = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9][A-Z0-9-]*)$/;

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

function graphFrontmatter(markdown) {
  const match = String(markdown).match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  if (!match) return {};
  const graph = {};
  let field = null;
  let inGraph = false;
  for (const line of match[1].split(/\r?\n/)) {
    if (/^graph:\s*$/.test(line)) {
      inGraph = true;
      field = null;
      continue;
    }
    if (/^\S/.test(line)) {
      inGraph = false;
      field = null;
      continue;
    }
    if (!inGraph) continue;
    const key = line.match(/^\s{2,}([a-z_]+):\s*$/i);
    if (key) {
      field = key[1];
      graph[field] = [];
      continue;
    }
    const item = line.match(/^\s{4,}-\s*(\S.*?)\s*$/);
    if (item && field) graph[field].push(item[1]);
  }
  return graph;
}

function markdownLinks(markdown) {
  return [...String(markdown).matchAll(/\[[^\]]+\]\(([^)#]+)(?:#[^)]+)?\)/g)].map(match => match[1]);
}

function boardRows(markdown) {
  const rows = [];
  for (const line of String(markdown).split(/\r?\n/)) {
    if (!line.trimStart().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    const task = String(cells[0] || '').toUpperCase();
    if (cells.length >= 2 && SAFE_TASK_ID.test(task)) {
      rows.push({ task, status: cells[1], owner: cells[2] || '', scope: cells[4] || '', line });
    }
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
  add('CHANGELOG.md');
  add('docs/handoffs/index.md');
  walk('docs/handoffs');
  walk('docs/workstreams');
  walk('docs/qa');
  walk('docs/learning');
  walk('docs/releases');
  walk('docs/board/archive');
  return [...new Set(files)].sort();
}

function gitSources(root) {
  try {
    const output = execFileSync('git', ['log', '--format=%H', '-n', '200'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return output.trim().split(/\r?\n/).filter(Boolean).map(hash => ({ source: `git:${hash}`, hash }));
  } catch {
    return [];
  }
}

function validGitSources(root, sources) {
  const hashes = [...new Set(sources
    .filter(source => /^git:[0-9a-f]{40}$/i.test(source))
    .map(source => source.slice('git:'.length)))];
  if (!hashes.length) return new Set();
  try {
    const output = execFileSync('git', ['cat-file', '--batch-check=%(objecttype)'], {
      cwd: root,
      input: `${hashes.join('\n')}\n`,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const kinds = output.trim().split(/\r?\n/);
    return new Set(hashes.filter((hash, index) => kinds[index] === 'commit').map(hash => `git:${hash}`));
  } catch {
    return new Set();
  }
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
  for (const commit of gitSources(root)) {
    sources.push({ relativePath: commit.source, sha256: commit.hash, size: 0 });
  }
  return { hash: sha256(JSON.stringify(sources)), sources };
}

function addNode(nodes, node) {
  if (!nodes.has(node.id)) nodes.set(node.id, {
    ...node,
    citation: node.citation || { source: node.source },
  });
}

function addEdge(edges, edge) {
  const key = `${edge.from}\0${edge.to}\0${edge.type}\0${edge.source}`;
  if (!edges.has(key)) edges.set(key, {
    ...edge,
    citation: edge.citation || { source: edge.source },
  });
}

function safeEntityId(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
}

function sourceScopedEntityId(type, key, source) {
  return `${type}:${key || 'UNTITLED'}--${sha256(source).slice(0, 12)}`;
}

function addHeadingEntities(markdown, source, nodes, edges, taskId) {
  const kinds = new Map([
    ['user decision', 'user-decision'], ['assumption', 'assumption'],
    ['requirement', 'requirement'], ['implementation slice', 'implementation-slice'],
    ['bug', 'bug'], ['verification', 'verification'], ['lesson', 'lesson'], ['release', 'release'],
  ]);
  for (const [index, line] of String(markdown).split(/\r?\n/).entries()) {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (!heading) continue;
    const matched = [...kinds.entries()].find(([label]) => new RegExp(`^${label}(?:\\s*:|\\s+|$)`, 'i').test(heading[1]));
    if (!matched) continue;
    const [label, type] = matched;
    const suffix = heading[1].replace(new RegExp(`^${label}(?:\\s*:\\s*|\\s*)`, 'i'), '');
    const key = safeEntityId(suffix) || `LINE-${index + 1}`;
    const id = sourceScopedEntityId(type, key, source);
    addNode(nodes, { id, type, label: heading[1], source, status: 'confirmed' });
    if (taskId) addEdge(edges, { from: taskId, to: id, type: type === 'implementation-slice' ? 'implements' : 'supports', source, status: 'confirmed' });
  }
}

function resolvedMarkdownTarget(root, source, target) {
  if (/^(?:https?:|file:|#)/i.test(target)) return null;
  const absolute = path.resolve(root, path.dirname(source), target);
  const relative = relativePath(root, absolute);
  if (relative === '..' || relative.startsWith('../') || path.isAbsolute(relative)) return null;
  return relative;
}

function addBoardRows(root, markdown, source, nodes, edges) {
  for (const row of boardRows(markdown)) {
    const taskId = `task:${row.task}`;
    addNode(nodes, {
      id: taskId,
      type: 'task',
      label: `${row.task} · ${row.status}`,
      source,
      status: 'confirmed',
      activityState: row.status,
      objective: row.scope,
    });
    addEdge(edges, { from: 'project:root', to: taskId, type: 'contains', source, status: 'confirmed' });
    for (const target of markdownLinks(row.line)) {
      const relative = resolvedMarkdownTarget(root, source, target);
      if (!relative || !fs.existsSync(path.join(root, relative))) continue;
      if (relative.startsWith('docs/handoffs/')) {
        const id = `handoff:${relative}`;
        addNode(nodes, { id, type: 'handoff', label: path.basename(relative, '.md'), source: relative, status: 'confirmed' });
        addEdge(edges, { from: taskId, to: id, type: 'documented-by', source, status: 'confirmed' });
      } else if (relative.startsWith('docs/qa/')) {
        const id = `qa:${relative}`;
        addNode(nodes, { id, type: 'qa', label: path.basename(relative, '.md'), source: relative, status: 'confirmed' });
        addEdge(edges, { from: taskId, to: id, type: 'references', source, status: 'confirmed' });
      }
    }
  }
}

function buildProjectGraph(root, options = {}) {
  const resolvedRoot = path.resolve(root);
  const files = sourceFiles(resolvedRoot);
  const fingerprint = sourceFingerprint(resolvedRoot, files);
  const nodes = new Map();
  const edges = new Map();
  const generatedAt = options.generatedAt || new Date().toISOString();
  const compileFindings = [];
  const declaredRelationships = [];
  addNode(nodes, { id: 'project:root', type: 'project', label: path.basename(resolvedRoot), source: 'PROJECT_BOARD.md', status: 'confirmed' });

  const boardPath = path.join(resolvedRoot, 'PROJECT_BOARD.md');
  const board = fs.existsSync(boardPath) ? fs.readFileSync(boardPath, 'utf8') : '';
  addBoardRows(resolvedRoot, board, 'PROJECT_BOARD.md', nodes, edges);
  for (const relative of files.filter(file => file.startsWith('docs/board/archive/'))) {
    addBoardRows(resolvedRoot, fs.readFileSync(path.join(resolvedRoot, relative), 'utf8'), relative, nodes, edges);
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
    addHeadingEntities(markdown, relative, nodes, edges, taskId);
    declaredRelationships.push({ taskId, source: relative, graph: graphFrontmatter(markdown) });
    if (meta.lane) {
      const laneId = `workstream:${meta.lane}`;
      addNode(nodes, { id: laneId, type: 'workstream', label: meta.lane, source: relative, status: 'confirmed' });
      addEdge(edges, { from: taskId, to: laneId, type: 'owned-by', source: relative, status: 'confirmed' });
    }
    for (const target of markdownLinks(markdown)) {
      const resolved = resolvedMarkdownTarget(resolvedRoot, relative, target);
      if (!resolved || !fs.existsSync(path.join(resolvedRoot, resolved))) continue;
      if (resolved.startsWith('docs/qa/')) {
        const qaId = `qa:${resolved}`;
        addNode(nodes, { id: qaId, type: 'qa', label: path.basename(resolved, '.md'), source: resolved, status: 'confirmed' });
        addEdge(edges, { from: handoffId, to: qaId, type: 'references', source: relative, status: 'confirmed' });
      } else if (resolved.startsWith('docs/handoffs/')) {
        const dependencyId = `handoff:${resolved}`;
        addNode(nodes, { id: dependencyId, type: 'handoff', label: path.basename(resolved, '.md'), source: resolved, status: 'confirmed' });
        addEdge(edges, { from: handoffId, to: dependencyId, type: 'references', source: relative, status: 'confirmed' });
      } else if (resolved.endsWith('.md')) {
        const documentId = `document:${resolved}`;
        addNode(nodes, { id: documentId, type: 'document', label: path.basename(resolved, '.md'), source: resolved, status: 'confirmed' });
        addEdge(edges, { from: handoffId, to: documentId, type: 'references', source: relative, status: 'confirmed' });
      }
    }
  }

  const indexSource = 'docs/handoffs/index.md';
  if (files.includes(indexSource)) {
    const markdown = fs.readFileSync(path.join(resolvedRoot, indexSource), 'utf8');
    const indexId = `document:${indexSource}`;
    addNode(nodes, { id: indexId, type: 'document', label: 'Handoff index', source: indexSource, status: 'confirmed' });
    for (const target of markdownLinks(markdown)) {
      const resolved = resolvedMarkdownTarget(resolvedRoot, indexSource, target);
      if (!resolved?.startsWith('docs/handoffs/') || !fs.existsSync(path.join(resolvedRoot, resolved))) continue;
      const handoffId = `handoff:${resolved}`;
      addNode(nodes, { id: handoffId, type: 'handoff', label: path.basename(resolved, '.md'), source: resolved, status: 'confirmed' });
      addEdge(edges, { from: indexId, to: handoffId, type: 'references', source: indexSource, status: 'confirmed' });
    }
  }

  for (const relative of files.filter(file => file.startsWith('docs/workstreams/'))) {
    const lane = path.basename(relative, '.md');
    const workstreamId = `workstream:${lane}`;
    addNode(nodes, { id: workstreamId, type: 'workstream', label: lane, source: relative, status: 'confirmed' });
  }

  for (const relative of files.filter(file => file.startsWith('docs/qa/'))) {
    const key = path.basename(relative, '.md').toUpperCase();
    const qaId = `qa:${relative}`;
    const verificationId = `verification:${key}`;
    addNode(nodes, { id: qaId, type: 'qa', label: path.basename(relative, '.md'), source: relative, status: 'confirmed' });
    addNode(nodes, { id: verificationId, type: 'verification', label: path.basename(relative, '.md'), source: relative, status: 'confirmed', verificationState: 'unknown' });
    if (key.startsWith('BUG-')) {
      const bugId = `bug:${key}`;
      addNode(nodes, { id: bugId, type: 'bug', label: key, source: relative, status: 'confirmed' });
    }
  }

  for (const relative of files.filter(file => file.startsWith('docs/learning/'))) {
    const markdown = fs.readFileSync(path.join(resolvedRoot, relative), 'utf8');
    for (const line of String(markdown).split(/\r?\n/)) {
      const lesson = line.match(/^#{1,6}\s+(LESSON-[A-Z0-9][A-Z0-9-]*)\b/i);
      if (!lesson) continue;
      const lessonId = `lesson:${lesson[1].toUpperCase()}`;
      addNode(nodes, { id: lessonId, type: 'lesson', label: lesson[1], source: relative, status: 'confirmed' });
    }
  }

  if (files.includes('CHANGELOG.md')) {
    const source = 'CHANGELOG.md';
    const markdown = fs.readFileSync(path.join(resolvedRoot, source), 'utf8');
    for (const line of String(markdown).split(/\r?\n/)) {
      const heading = line.match(/^#{1,6}\s+(?:\[)?v?(\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?)(?:\])?\b/i);
      if (heading) {
        addNode(nodes, { id: `release:${heading[1]}`, type: 'release', label: heading[1], source, status: 'confirmed' });
      }
    }
  }

  for (const commit of gitSources(resolvedRoot)) {
    addNode(nodes, { id: `commit:${commit.hash}`, type: 'commit', label: commit.hash, source: commit.source, status: 'confirmed' });
  }

  const declaredEdgeTypes = new Map([
    ['depends_on', 'depends-on'], ['blocks', 'blocks'], ['conflicts_with', 'conflicts-with'],
    ['affects', 'affects'], ['supersedes', 'supersedes'], ['implements', 'implements'],
    ['verified_by', 'verified-by'], ['learned_from', 'learned-from'], ['owned_by', 'owned-by'],
    ['included_in_release', 'included-in-release'],
  ]);
  for (const declaration of declaredRelationships) {
    for (const [field, targets] of Object.entries(declaration.graph)) {
      const type = declaredEdgeTypes.get(field);
      if (!type) continue;
      for (const target of targets) {
        const value = String(target).trim();
        const key = safeEntityId(value.includes(':') ? value.slice(value.indexOf(':') + 1) : value);
        const candidates = [value, `task:${value}`, ...[...nodes.keys()].filter(id => id.endsWith(`:${value}`) || id.includes(`:${key}--`))];
        const resolved = [...new Set(candidates)].filter(id => nodes.has(id));
        if (resolved.length !== 1) {
          compileFindings.push({ code: 'unresolved-edge-target', message: `Declared ${type} target is unresolved or ambiguous: ${value}`, source: declaration.source });
          continue;
        }
        addEdge(edges, { from: declaration.taskId, to: resolved[0], type, source: declaration.source, status: 'confirmed' });
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
    compileFindings,
    health: { valid: true, findings: [], sourceCount: files.length },
  };
  const findings = validateProjectGraph(resolvedRoot, graph);
  graph.health = { valid: findings.length === 0, findings, sourceCount: files.length };
  return graph;
}

function validateProjectGraph(root, graph) {
  const findings = [...(graph.compileFindings || [])];
  const items = [...(graph.nodes || []), ...(graph.edges || [])];
  const nodeIds = new Set((graph.nodes || []).map(node => node.id));
  const knownGitSources = validGitSources(root, items.map(item => String(item.source || '')));
  for (const item of items) {
    const source = String(item.source || '');
    if (!source || path.isAbsolute(source) || source === '..' || source.startsWith('../')
      || (source.startsWith('git:') ? !knownGitSources.has(source) : !fs.existsSync(path.join(root, source)))) {
      findings.push({ code: 'unsafe-source', message: `Graph item has an unsafe or missing source: ${source}` });
    }
    if (!item.citation || typeof item.citation !== 'object' || typeof item.citation.source !== 'string') {
      findings.push({ code: 'missing-citation', message: `Graph item is missing a source citation: ${source}` });
    } else if (item.citation.source !== source) {
      findings.push({ code: 'invalid-citation', message: `Graph item citation does not match its source: ${source}` });
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
    if (edge.type === 'verified-by' && edge.verificationState === 'passed') {
      findings.push({ code: 'derived-test-success', message: 'A derived graph cannot prove successful verification.' });
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
- What decision governs <PROJECT>-…?
- What verifies <PROJECT>-…?
- What depends on <PROJECT>-…?
- Which release contains <PROJECT>-…?
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

function refreshProjectGraph(root, options = {}) {
  let previous = null;
  try {
    previous = readProjectGraph(root);
  } catch {
    previous = null;
  }
  const graph = buildProjectGraph(root, options);
  const oldSources = new Map((previous?.sourceFingerprint?.sources || []).map(source => [source.relativePath, source.sha256]));
  const newSources = new Map(graph.sourceFingerprint.sources.map(source => [source.relativePath, source.sha256]));
  const changedSources = [...newSources].filter(([relative, hash]) => oldSources.get(relative) !== hash).map(([relative]) => relative).sort();
  const removedSources = [...oldSources.keys()].filter(relative => !newSources.has(relative)).sort();
  const reusedSources = [...newSources].filter(([relative, hash]) => oldSources.get(relative) === hash).map(([relative]) => relative).sort();
  writeProjectGraph(root, graph);
  return { graph, changedSources, removedSources, reusedSources };
}

function queryProjectGraph(graph, query, options = {}) {
  const value = String(query || '').toLowerCase();
  const keywords = value.split(/[^a-z0-9-]+/).filter(word => word.length >= 3);
  const adjacency = new Map();
  for (const edge of graph.edges || []) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    if (!adjacency.has(edge.to)) adjacency.set(edge.to, []);
    adjacency.get(edge.from).push({ edge, nodeId: edge.to });
    adjacency.get(edge.to).push({ edge, nodeId: edge.from });
  }
  const nodes = new Map((graph.nodes || []).map(node => [node.id, node]));
  const upperQuery = value.toUpperCase();
  const taskIds = [...nodes.values()]
    .filter(node => node.type === 'task')
    .map(node => node.id.slice('task:'.length))
    .filter(taskId => upperQuery.includes(taskId));
  const scopedDistances = new Map();
  if (options.currentTask) {
    const start = `task:${String(options.currentTask).toUpperCase()}`;
    if (nodes.has(start)) {
      scopedDistances.set(start, 0);
      let frontier = [start];
      for (let depth = 1; depth <= 3; depth += 1) {
        const next = [];
        for (const nodeId of frontier) {
          if (nodes.get(nodeId)?.type === 'workstream') continue;
          for (const neighbor of adjacency.get(nodeId) || []) {
            if (neighbor.edge.type === 'contains') continue;
            if (!scopedDistances.has(neighbor.nodeId)) {
              scopedDistances.set(neighbor.nodeId, depth);
              next.push(neighbor.nodeId);
            }
          }
        }
        frontier = next;
      }
    }
  }
  const scores = new Map();
  for (const node of nodes.values()) {
    if (scopedDistances.size && !scopedDistances.has(node.id)) continue;
    const haystack = `${node.id} ${node.label} ${node.type} ${node.source}`.toLowerCase();
    let score = scopedDistances.has(node.id) ? 100 - scopedDistances.get(node.id) * 20 : 0;
    if (taskIds.some(task => haystack.includes(task.toLowerCase()))) score += 100;
    for (const keyword of keywords) if (haystack.includes(keyword)) score += 5;
    if (value.includes('verif') && node.type === 'qa') score += 20;
    if (value.includes('decision') && node.type === 'decision') score += 20;
    if (value.includes('release') && node.type === 'release') score += 20;
    if (value.includes('workstream') && node.type === 'workstream') score += 20;
    if (score) scores.set(node.id, { score, relationshipPath: [] });
  }
  const direct = [...scores.entries()].sort((a, b) => b[1].score - a[1].score).slice(0, 8);
  for (const [nodeId, match] of direct) {
    for (const neighbor of adjacency.get(nodeId) || []) {
      if (scopedDistances.size && !scopedDistances.has(neighbor.nodeId)) continue;
      const bonus = value.includes('verif') && neighbor.edge.type === 'verified-by' ? 50
        : value.includes('depend') && neighbor.edge.type === 'depends-on' ? 50
          : value.includes('decision') && neighbor.edge.type === 'supports' ? 40 : 10;
      const existing = scores.get(neighbor.nodeId);
      const candidate = {
        score: match.score + bonus,
        relationshipPath: [nodeId, neighbor.edge.type, neighbor.nodeId],
      };
      if (!existing || candidate.score > existing.score) scores.set(neighbor.nodeId, candidate);
    }
  }
  return [...scores.entries()]
    .map(([id, match]) => ({ ...nodes.get(id), relationshipPath: match.relationshipPath, score: match.score }))
    .filter(result => result.id)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 20);
}

function compactGraphNode(node) {
  const result = {
    id: node.id,
    type: node.type,
    label: node.label,
    source: node.source,
    citation: { source: node.citation?.source || node.source },
  };
  if (node.activityState) result.activityState = node.activityState;
  return result;
}

function activityState(node) {
  return String(node?.activityState || '').trim().toLowerCase();
}

function buildActiveSubgraph(graph, options = {}) {
  const taskId = String(options.taskId || '').toUpperCase();
  const currentId = `task:${taskId}`;
  const nodes = new Map((graph.nodes || []).map(node => [node.id, node]));
  const current = nodes.get(currentId);
  const recentSources = new Set((options.recentSources || []).map(source => String(source)));
  const relatedEdges = (graph.edges || []).filter(edge => edge.from === currentId || edge.to === currentId);
  const neighborFor = edge => nodes.get(edge.from === currentId ? edge.to : edge.from);
  const uniqueNodes = values => [...new Map(values.filter(Boolean).map(node => [node.id, node])).values()]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(compactGraphNode);
  const directBy = predicate => uniqueNodes(relatedEdges.filter(predicate).map(neighborFor));
  const directTyped = directBy(edge => new Set(['depends-on', 'blocks']).has(edge.type));
  const governingDecisions = directBy(edge => edge.type === 'supports' && neighborFor(edge)?.type === 'user-decision');
  const assumptions = directBy(edge => edge.type === 'supports' && neighborFor(edge)?.type === 'assumption');
  const acceptanceCriteria = directBy(edge => edge.type === 'supports' && neighborFor(edge)?.type === 'requirement');
  const directDependencies = directBy(edge => (edge.from === currentId && edge.type === 'depends-on')
    || (edge.to === currentId && edge.type === 'blocks'));
  const directDependants = directBy(edge => (edge.to === currentId && edge.type === 'depends-on')
    || (edge.from === currentId && edge.type === 'blocks'));
  const activeTasks = directTyped.filter(node => node.type === 'task');
  const conflicts = relatedEdges
    .filter(edge => edge.type === 'conflicts-with' && edge.status !== 'resolved')
    .map(edge => ({
      node: compactGraphNode(neighborFor(edge)),
      relationship: {
        type: edge.type,
        source: edge.source,
        citation: { source: edge.citation?.source || edge.source },
      },
    }))
    .sort((a, b) => a.node.id.localeCompare(b.node.id));

  return {
    taskId,
    objective: current?.objective || '',
    readyNodes: activeTasks.filter(node => activityState(node) === 'ready'),
    blockedNodes: activeTasks.filter(node => activityState(node) === 'blocked'),
    unresolvedConflicts: conflicts,
    governingDecisions,
    recentDecisions: governingDecisions.filter(node => recentSources.has(node.source)),
    assumptions,
    dependencyState: { directDependencies, directDependants },
    directDependencies,
    directDependants,
    acceptanceCriteria,
    affectedVerification: directBy(edge => ['verified-by', 'affects'].includes(edge.type)
      && ['verification', 'qa'].includes(neighborFor(edge)?.type)),
    applicableLessons: directBy(edge => edge.type === 'learned-from' && neighborFor(edge)?.type === 'lesson'),
  };
}

function activeSubgraphFacts(taskNode, activeSubgraph) {
  const relatedNodes = [
    taskNode,
    ...activeSubgraph.readyNodes,
    ...activeSubgraph.blockedNodes,
    ...activeSubgraph.unresolvedConflicts.map(conflict => conflict.node),
    ...activeSubgraph.governingDecisions,
    ...activeSubgraph.recentDecisions,
    ...activeSubgraph.assumptions,
    ...activeSubgraph.directDependencies,
    ...activeSubgraph.directDependants,
    ...activeSubgraph.acceptanceCriteria,
    ...activeSubgraph.affectedVerification,
    ...activeSubgraph.applicableLessons,
  ];
  const unique = new Map();
  for (const node of relatedNodes) {
    if (node?.id && !unique.has(node.id)) unique.set(node.id, node);
  }
  return [...unique.values()].map(node => ({
    id: node.id,
    type: node.type,
    label: node.label,
    status: node.status,
    source: node.source,
    citation: { source: node.citation?.source || node.source },
  }));
}

function resolveProjectContext(root, query) {
  const findings = [];
  try {
    const graph = readProjectGraph(root);
    const current = buildProjectGraph(root, { generatedAt: graph.generatedAt });
    const validation = validateProjectGraph(root, graph);
    if (graph.schemaVersion !== GRAPH_SCHEMA_VERSION) findings.push('Project graph schema is unsupported.');
    if (graph.sourceFingerprint?.hash !== current.sourceFingerprint.hash) findings.push('Project graph is stale; used normalized FB records.');
    findings.push(...validation.map(finding => finding.message));
    if (!findings.length) {
      const task = String(query).toUpperCase().match(/[A-Z][A-Z0-9]*(?:-[A-Z0-9][A-Z0-9-]*)/);
      return { route: 'project-graph', results: queryProjectGraph(graph, query, { currentTask: task?.[0] }), findings: [] };
    }
  } catch {
    findings.push('Project graph is unreadable; used normalized FB records.');
  }
  const fallbackGraph = buildProjectGraph(root);
  const task = String(query).toUpperCase().match(/[A-Z][A-Z0-9]*(?:-[A-Z0-9][A-Z0-9-]*)/);
  return { route: 'normalized-record-fallback', results: queryProjectGraph(fallbackGraph, query, { currentTask: task?.[0] }), findings };
}

function resolveTaskHandoff(root, taskId) {
  const index = 'docs/handoffs/index.md';
  const board = 'PROJECT_BOARD.md';
  const findLinkedHandoff = (source, markdown) => {
    const line = String(markdown).split(/\r?\n/).find(candidate => candidate.toUpperCase().includes(taskId));
    if (!line) return null;
    for (const target of markdownLinks(line)) {
      const relative = resolvedMarkdownTarget(root, source, target);
      if (relative?.startsWith('docs/handoffs/') && fs.existsSync(path.join(root, relative))) return relative;
    }
    return null;
  };

  for (const source of [index, board]) {
    const target = path.join(root, source);
    if (!fs.existsSync(target)) continue;
    const linked = findLinkedHandoff(source, fs.readFileSync(target, 'utf8'));
    if (linked) return linked;
  }
  const conventional = `docs/handoffs/${taskId}.md`;
  return fs.existsSync(path.join(root, conventional)) ? conventional : null;
}

function authoritativeFallback(root, taskId) {
  const readableSources = ['PROJECT_BOARD.md', 'docs/handoffs/index.md'];
  const handoff = SAFE_TASK_ID.test(taskId) ? resolveTaskHandoff(root, taskId) : null;
  if (handoff) readableSources.push(handoff);
  return {
    citations: [...readableSources],
    readableSources,
    instructions: [
      'Use the authoritative route in order: PROJECT_BOARD.md, then docs/handoffs/index.md.',
      handoff
        ? `Then read the exact handoff: ${handoff}.`
        : 'Then resolve the exact handoff from the board or handoff index when one is available.',
      'If the normalized records are insufficient, inspect Git history; Git history is an investigation step, not a Markdown source or citation.',
    ],
  };
}

function projectContextPacket(root, options = {}) {
  const taskId = String(options.taskId || '').toUpperCase();
  const question = String(options.question || '').trim();
  if (!SAFE_TASK_ID.test(taskId) || !question) {
    const fallback = authoritativeFallback(root, taskId);
    return {
      route: 'normalized-record-fallback',
      taskId,
      question,
      reason: 'A safe task ID and concrete question are required.',
      facts: [],
      citations: fallback.citations,
      readableSources: fallback.readableSources,
      instructions: fallback.instructions,
    };
  }

  let refresh;
  try {
    refresh = refreshProjectGraph(root);
  } catch (error) {
    const fallback = authoritativeFallback(root, taskId);
    return {
      route: 'normalized-record-fallback',
      taskId,
      question,
      reason: `Project graph could not be refreshed: ${error.message}`,
      facts: [],
      citations: fallback.citations,
      readableSources: fallback.readableSources,
      instructions: fallback.instructions,
    };
  }

  const taskNode = refresh.graph.nodes.find(node => node.id === `task:${taskId}`);
  const validation = validateProjectGraph(root, refresh.graph);
  if (!taskNode || validation.length) {
    const fallback = authoritativeFallback(root, taskId);
    return {
      route: 'normalized-record-fallback',
      taskId,
      question,
      reason: taskNode
        ? 'Project graph is unhealthy; use authoritative normalized records.'
        : `${taskId} is not represented in the project graph; context is insufficient.`,
      findings: validation,
      facts: [],
      citations: fallback.citations,
      readableSources: fallback.readableSources,
      instructions: fallback.instructions,
      refresh: {
        changedSources: refresh.changedSources,
        removedSources: refresh.removedSources,
        reusedSources: refresh.reusedSources,
      },
    };
  }

  const activeSubgraph = buildActiveSubgraph(refresh.graph, {
    taskId,
    // An initial derived-state build has no prior graph baseline, so its sources
    // are not evidence that a governing decision changed recently.
    recentSources: refresh.reusedSources.length ? refresh.changedSources : [],
  });
  const facts = activeSubgraphFacts(taskNode, activeSubgraph);
  const readableSources = [...new Set(facts.map(fact => fact.source).filter(Boolean))];
  const hasActiveEvidence = facts.some(fact => fact.id !== taskNode.id);
  if (!readableSources.length || !hasActiveEvidence) {
    const fallback = authoritativeFallback(root, taskId);
    return {
      route: 'normalized-record-fallback',
      taskId,
      question,
      reason: 'Project graph active context is insufficient for targeted reading.',
      facts: [],
      citations: fallback.citations,
      readableSources: fallback.readableSources,
      instructions: fallback.instructions,
      refresh: {
        changedSources: refresh.changedSources,
        removedSources: refresh.removedSources,
        reusedSources: refresh.reusedSources,
      },
    };
  }

  return {
    route: 'project-graph',
    taskId,
    question,
    facts,
    objective: activeSubgraph.objective,
    readyNodes: activeSubgraph.readyNodes,
    blockedNodes: activeSubgraph.blockedNodes,
    unresolvedConflicts: activeSubgraph.unresolvedConflicts,
    governingDecisions: activeSubgraph.governingDecisions,
    recentDecisions: activeSubgraph.recentDecisions,
    assumptions: activeSubgraph.assumptions,
    dependencyState: activeSubgraph.dependencyState,
    directDependencies: activeSubgraph.directDependencies,
    directDependants: activeSubgraph.directDependants,
    acceptanceCriteria: activeSubgraph.acceptanceCriteria,
    affectedVerification: activeSubgraph.affectedVerification,
    applicableLessons: activeSubgraph.applicableLessons,
    citations: readableSources,
    readableSources,
    instructions: [
      'Read only the active-subgraph sources cited in this packet.',
      'The graph routes to evidence; authoritative records remain source of truth.',
      'If the packet is ambiguous, incomplete, or contradictory, use PROJECT_BOARD.md, then docs/handoffs/index.md, the exact handoff, and Git history.',
    ],
    refresh: {
      changedSources: refresh.changedSources,
      removedSources: refresh.removedSources,
      reusedSources: refresh.reusedSources,
    },
  };
}

function evaluateGraduation(input = {}) {
  const currentLevel = Number.isInteger(input.currentLevel) ? input.currentLevel : 1;
  if (input.projectClass === 'disposable') {
    return {
      currentLevel,
      recommendedLevel: 0,
      action: 'remain-level-0',
      reasons: ['Disposable or isolated work does not require a project graph.'],
      requiresApproval: false,
      allowedCorpus: [],
    };
  }
  const acceptedTypes = new Set([
    'repeated-governing-decision-search',
    'missed-cross-workstream-dependency',
    'unstructured-authoritative-relationship',
    'unresolved-record-contradiction',
    'repeated-broad-orientation-read',
  ]);
  const actionable = (input.frictionSignals || []).filter(signal => {
    if (!acceptedTypes.has(signal.type)) return false;
    if (typeof signal.query !== 'string' || signal.query.trim().length < 12) return false;
    if (typeof signal.source !== 'string' || !signal.source || path.isAbsolute(signal.source)
      || signal.source === '..' || signal.source.startsWith('../')) return false;
    const materialSingle = signal.material === true
      && ['missed-cross-workstream-dependency', 'unresolved-record-contradiction'].includes(signal.type);
    return Number(signal.occurrences) >= 2 || materialSingle;
  });
  if (currentLevel <= 1 && actionable.length) {
    const risks = new Set((input.risks || []).map(value => String(value).toLowerCase()));
    const sensitive = ['privacy', 'authentication', 'auth', 'payments', 'secrets', 'security', 'cross-project'];
    const requiresApproval = input.crossProject === true || sensitive.some(risk => risks.has(risk));
    return {
      currentLevel,
      recommendedLevel: 2,
      action: 'recommend-scoped-level-2',
      reasons: actionable.map(signal => `${signal.type}: ${signal.query}`),
      requiresApproval,
      allowedCorpus: [...new Set(input.allowedCorpus || [])].sort(),
    };
  }
  return {
    currentLevel,
    recommendedLevel: currentLevel,
    action: `remain-level-${currentLevel}`,
    reasons: ['No source-cited retrieval friction justifies deeper mapping.'],
    requiresApproval: false,
    allowedCorpus: [],
  };
}

module.exports = {
  GRAPH_SCHEMA_VERSION,
  buildProjectGraph,
  validateProjectGraph,
  writeProjectGraph,
  readProjectGraph,
  refreshProjectGraph,
  queryProjectGraph,
  buildActiveSubgraph,
  resolveProjectContext,
  projectContextPacket,
  evaluateGraduation,
};
