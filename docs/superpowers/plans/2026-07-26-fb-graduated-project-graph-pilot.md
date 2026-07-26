# FB Graduated Project Graph Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and evaluate a repository-local deterministic FB project graph that visibly demonstrates new-project, growing-project, and safe-fallback behavior before any permanent plugin workflow change.

**Architecture:** A focused CommonJS module reads normalized FB records, emits a source-cited Level 1 graph, evaluates explicit retrieval-friction records for Level 2 recommendation, and answers bounded navigation queries. Generated graphs remain ignored derived artifacts; a curated experiment report records fixture and real-repository results. No semantic extraction or consumer-repository write occurs in this pilot.

**Tech Stack:** Node.js built-ins (`fs`, `path`, `crypto`, `node:test`, `assert`), Markdown FB records, JSON graph artifacts, existing package synchronizer only if a later approved plugin slice adds the module.

## Global Constraints

- The board, index, handoffs, workstream cards, QA artifacts, and Git remain authoritative.
- Graph nodes and edges must cite an authoritative local source or explicit Git reference.
- Graph output must not contain transcripts, hidden reasoning, secrets, environment values, or copied raw evidence.
- Project age and record counts alone must never trigger Level 2.
- The graph must not authorize implementation, closeout, release, or Push Live.
- Missing, stale, or corrupt graph output must fall back to the normal board → index → handoff → workstream-card route.
- The pilot may read an isolated Unmirror snapshot but must not modify the canonical Unmirror repository.
- The pilot stops before plugin packaging, publication, release, deployment, or consumer-project adoption.

---

## File Structure

| File | Responsibility |
|---|---|
| `tools/fb-project-graph.cjs` | Parse source-backed FB relationships, fingerprint sources, build/query graphs, evaluate graduation, and provide the pilot CLI |
| `tools/fb-project-graph.test.cjs` | Canonical deterministic, graduation, privacy, incremental, query, and fallback contracts |
| `tools/fb-project-graph-pilot.cjs` | Run pre-registered examples and navigation comparisons without embedding hidden answers in graph input |
| `tools/fb-project-graph-pilot.test.cjs` | Prove fixture fairness, result recomputation, comparison fields, and consumer-repository non-mutation |
| `.gitignore` | Ignore generated `.fb/graph/` artifacts |
| `docs/experiments/TASK-048-graduated-project-graph-pilot.md` | Pre-registration followed by append-only curated results |
| `docs/qa/TASK-048.md` | Focused commands, candidate, exit status, and bounded evidence |
| `docs/handoffs/TASK-048.md` | Approved scope and compact pilot closeout |
| `PROJECT_BOARD.md` | Current TASK-048 state, gate, and links |
| `docs/handoffs/index.md` | Routing to TASK-048 |
| `docs/workstreams/fb-product.md` | Compact Product status and next action |

---

### Task 1: Source-Backed Level 1 Graph

**Files:**
- Create: `tools/fb-project-graph.cjs`
- Create: `tools/fb-project-graph.test.cjs`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `buildProjectGraph(root, options) -> Graph`
- Produces: `validateProjectGraph(root, graph) -> Finding[]`
- Produces: `writeProjectGraph(root, graph) -> { changed, outputDirectory }`
- `Graph` has `schemaVersion`, `level`, `generatedAt`, `sourceFingerprint`, `nodes`, `edges`, and `health`.

- [ ] **Step 1: Write the failing source-backed graph contract**

Create a temporary normalized fixture containing one board task, handoff,
workstream card, and QA artifact. Require:

```js
const graph = buildProjectGraph(root, { generatedAt: '2026-07-26T00:00:00.000Z' });
assert.strictEqual(graph.schemaVersion, 1);
assert.strictEqual(graph.level, 1);
assert.ok(graph.nodes.some(node => node.id === 'task:TASK-100' && node.source === 'PROJECT_BOARD.md'));
assert.ok(graph.nodes.some(node => node.id === 'handoff:docs/handoffs/TASK-100.md'));
assert.ok(graph.nodes.some(node => node.id === 'qa:docs/qa/TASK-100.md'));
assert.ok(graph.edges.some(edge =>
  edge.from === 'task:TASK-100'
  && edge.to === 'handoff:docs/handoffs/TASK-100.md'
  && edge.type === 'documented-by'
  && edge.status === 'confirmed'
));
assert.deepStrictEqual(validateProjectGraph(root, graph), []);
```

Also assert that the graph contains paths and compact labels, not full decision
or QA prose.

- [ ] **Step 2: Run the focused contract and observe RED**

Run:

```bash
node --test tools/fb-project-graph.test.cjs
```

Expected: FAIL because `tools/fb-project-graph.cjs` does not exist.

- [ ] **Step 3: Implement the minimal deterministic parser and schema**

Implement these exact exports:

```js
module.exports = {
  GRAPH_SCHEMA_VERSION,
  buildProjectGraph,
  validateProjectGraph,
  writeProjectGraph,
  readProjectGraph,
  queryProjectGraph,
  evaluateGraduation,
};
```

The parser may reuse or locally mirror the small frontmatter and board-row
parsing shapes from `tools/fb-records.cjs`, but it must not modify normalized
records. Emit:

```js
{
  schemaVersion: 1,
  level: 1,
  generatedAt,
  sourceFingerprint,
  nodes: [
    { id, type, label, source, status: 'confirmed' }
  ],
  edges: [
    { from, to, type, source, status: 'confirmed' }
  ],
  health: {
    valid: true,
    findings: [],
    sourceCount,
  },
}
```

Allowed Level 1 node types are `project`, `okr`, `workstream`, `task`,
`handoff`, `decision`, `qa`, `commit`, and `release`. Allowed edge types are
`contains`, `supports`, `owned-by`, `documented-by`, `depends-on`,
`supersedes`, `implemented-by`, `verified-by`, and `released-as`.

Only emit an edge when its source contains an explicit task ID, Markdown link,
frontmatter field, or Git reference. Do not infer relationships from proximity
or prose similarity.

- [ ] **Step 4: Add privacy and authority rejection cases**

Require `validateProjectGraph` to reject:

```js
{ source: 'transcripts/session.txt' }
{ label: 'Authorization: Bearer abc123' }
{ status: 'inferred', type: 'approved-by' }
{ source: '/absolute/outside/repository.md' }
```

Require all graph nodes and edges to use relative repository paths or explicit
`git:<commit>` sources. Redact secret-like label content before writing and
report `sensitive-output` rather than preserving the value.

- [ ] **Step 5: Implement atomic derived output**

Write graph artifacts under:

```text
.fb/graph/project-graph.json
.fb/graph/project-graph.md
.fb/graph/project-graph.html
.fb/graph/graph-state.json
```

Use temporary-file plus rename semantics. Add:

```gitignore
.fb/graph/
```

The Markdown report must show level, health, sources, node/edge counts,
ambiguous count, stale state, and five example queries. The HTML output must
embed only the JSON graph and a dependency-free accessible node/edge table; no
network assets or hosted service.

- [ ] **Step 6: Run the focused contract and observe GREEN**

Run:

```bash
node --test tools/fb-project-graph.test.cjs
node --check tools/fb-project-graph.cjs
git diff --check
```

Expected: all project-graph tests pass; syntax and whitespace pass.

- [ ] **Step 7: Commit Task 1**

```bash
git add .gitignore tools/fb-project-graph.cjs tools/fb-project-graph.test.cjs
git commit -m "feat: add deterministic FB project graph"
```

---

### Task 2: Incremental Refresh, Query, and Safe Fallback

**Files:**
- Modify: `tools/fb-project-graph.cjs`
- Modify: `tools/fb-project-graph.test.cjs`

**Interfaces:**
- Consumes: Task 1 `Graph`
- Produces: `refreshProjectGraph(root, options) -> { graph, changedSources, removedSources, reusedSources }`
- Produces: `resolveProjectContext(root, query) -> { route, results, findings }`

- [ ] **Step 1: Write failing incremental and fallback tests**

Require:

```js
const first = refreshProjectGraph(root, { generatedAt: fixedTime });
const second = refreshProjectGraph(root, { generatedAt: laterTime });
assert.deepStrictEqual(second.changedSources, []);
assert.ok(second.reusedSources.length > 0);

write(root, 'docs/handoffs/TASK-100.md', changedHandoff);
const third = refreshProjectGraph(root, { generatedAt: newestTime });
assert.deepStrictEqual(third.changedSources, ['docs/handoffs/TASK-100.md']);
```

Then corrupt `.fb/graph/project-graph.json` and require:

```js
const context = resolveProjectContext(root, 'What verifies TASK-100?');
assert.strictEqual(context.route, 'normalized-record-fallback');
assert.ok(context.results.some(result => result.source === 'docs/qa/TASK-100.md'));
assert.ok(context.findings.includes('Project graph is unreadable; used normalized FB records.'));
```

- [ ] **Step 2: Run focused RED**

Run:

```bash
node --test tools/fb-project-graph.test.cjs
```

Expected: new incremental/fallback cases fail because the exports are absent.

- [ ] **Step 3: Implement source fingerprints and incremental refresh**

Fingerprint only files actually used by Level 1:

```js
{
  relativePath,
  sha256,
  size,
  modifiedTimeMilliseconds
}
```

Hash file contents for correctness; modified time is diagnostic only. Preserve
unchanged source-derived nodes and edges, replace changed-source relationships,
and remove relationships whose source disappeared.

- [ ] **Step 4: Implement bounded query traversal**

`queryProjectGraph(graph, query)` must:

1. Extract safe task IDs and normalized keywords.
2. Score direct node matches before one-hop neighbors.
3. Return at most 20 results.
4. Include `source`, `relationshipPath`, and `status`.
5. Never convert inferred or ambiguous paths into approval claims.

Support these pre-registered queries:

```text
What is active and blocked?
What decision governs TASK-100?
What verifies TASK-100?
What depends on TASK-100?
Which release contains TASK-100?
```

- [ ] **Step 5: Implement normal-record fallback**

`resolveProjectContext` uses a graph only when:

- JSON parses;
- schema version is supported;
- validation has no authority, path, privacy, or stale-source finding.

Otherwise return the normal route:

```text
PROJECT_BOARD.md → docs/handoffs/index.md → current handoff → workstream card
```

The fallback must be usable even when `.fb/graph/` is absent.

- [ ] **Step 6: Run focused GREEN and commit**

Run:

```bash
node --test tools/fb-project-graph.test.cjs
node --check tools/fb-project-graph.cjs
git diff --check
```

Expected: all focused cases pass.

Commit:

```bash
git add tools/fb-project-graph.cjs tools/fb-project-graph.test.cjs
git commit -m "feat: refresh and query FB project graphs safely"
```

---

### Task 3: Retrieval-Friction Graduation

**Files:**
- Modify: `tools/fb-project-graph.cjs`
- Modify: `tools/fb-project-graph.test.cjs`
- Create: `docs/experiments/TASK-048-graduated-project-graph-pilot.md`

**Interfaces:**
- Consumes: explicit friction records
- Produces: `evaluateGraduation(input) -> GraduationDecision`
- `GraduationDecision` has `currentLevel`, `recommendedLevel`, `action`,
  `reasons`, `requiresApproval`, and `allowedCorpus`.

- [ ] **Step 1: Pre-register graduation behavior**

Create the experiment document before running examples. Record:

- hypothesis;
- exact Level 0, Level 1, Level 2-recommended, stale, and corrupt scenarios;
- allowed metrics;
- query answer keys stored separately from graph inputs;
- stopping rules;
- statement that Level 2 semantic extraction is not run in this pilot;
- statement that unfavorable results are preserved.

- [ ] **Step 2: Write failing graduation tests**

Require:

```js
assert.deepStrictEqual(evaluateGraduation({
  projectClass: 'disposable',
  currentLevel: 0,
  frictionSignals: [],
}).action, 'remain-level-0');

assert.deepStrictEqual(evaluateGraduation({
  projectClass: 'long-lived',
  currentLevel: 1,
  projectAgeDays: 90,
  handoffCount: 40,
  frictionSignals: [],
}).action, 'remain-level-1');

const decision = evaluateGraduation({
  projectClass: 'long-lived',
  currentLevel: 1,
  frictionSignals: [{
    type: 'repeated-governing-decision-search',
    query: 'Which approved decision governs camera orientation?',
    occurrences: 2,
    source: 'docs/experiments/TASK-048-friction.json',
  }],
  allowedCorpus: ['docs/handoffs', 'docs/design'],
});
assert.strictEqual(decision.recommendedLevel, 2);
assert.strictEqual(decision.action, 'recommend-scoped-level-2');
```

Also prove that blank queries, invented sources, simple handoff counts, and age
do not graduate. Sensitive or cross-project corpora set
`requiresApproval: true` and cannot start extraction.

- [ ] **Step 3: Run focused RED**

Run:

```bash
node --test tools/fb-project-graph.test.cjs
```

Expected: graduation cases fail until the policy is implemented.

- [ ] **Step 4: Implement the evidence-gated classifier**

Accepted friction types:

```js
new Set([
  'repeated-governing-decision-search',
  'missed-cross-workstream-dependency',
  'unstructured-authoritative-relationship',
  'unresolved-record-contradiction',
  'repeated-broad-orientation-read',
])
```

A signal is actionable only when it has a concrete query/problem, source link,
and either two observed occurrences or one material missed dependency or
contradiction. The result recommends scoped Level 2; it does not execute
Graphify.

- [ ] **Step 5: Run focused GREEN and commit**

Run:

```bash
node --test tools/fb-project-graph.test.cjs
git diff --check
```

Expected: Level 0, Level 1, Level 2 recommendation, approval, and rejection
cases pass.

Commit:

```bash
git add tools/fb-project-graph.cjs tools/fb-project-graph.test.cjs docs/experiments/TASK-048-graduated-project-graph-pilot.md
git commit -m "feat: gate project graph graduation on retrieval friction"
```

---

### Task 4: Visible Examples and Comparative Pilot

**Files:**
- Create: `tools/fb-project-graph-pilot.cjs`
- Create: `tools/fb-project-graph-pilot.test.cjs`
- Modify: `docs/experiments/TASK-048-graduated-project-graph-pilot.md`

**Interfaces:**
- Consumes: Task 1–3 graph APIs
- Produces: `runScenario(name, fixture) -> ScenarioResult`
- Produces: `compareNavigation(root, queries) -> ComparisonResult`

- [ ] **Step 1: Write failing fixture-fairness and result tests**

Create fixtures at runtime rather than checking generated fixture repositories
into Git. Require three visible examples:

1. `new-project`: one OKR, two workstreams, one ready handoff, one task, one QA
   record; expected Level 1.
2. `growing-project`: four workstreams, six handoffs, dependencies and
   supersession, plus one valid repeated-search friction record; expected
   Level 2 recommendation without semantic extraction.
3. `damaged-graph`: the same growing records with corrupt graph JSON; expected
   normalized-record fallback.

Require:

```js
assert.strictEqual(results.newProject.level, 1);
assert.strictEqual(results.growingProject.graduation.action, 'recommend-scoped-level-2');
assert.strictEqual(results.growingProject.semanticExtractionRan, false);
assert.strictEqual(results.damagedGraph.route, 'normalized-record-fallback');
```

- [ ] **Step 2: Run focused RED**

Run:

```bash
node --test tools/fb-project-graph-pilot.test.cjs
```

Expected: FAIL because the pilot controller is absent.

- [ ] **Step 3: Implement the pilot controller**

For each scenario, record:

```js
{
  scenario,
  level,
  graphNodes,
  graphEdges,
  graphBuildMilliseconds,
  graphBytes,
  sourceFilesRead,
  sourceBytesRead,
  queries: [{
    query,
    expectedSources,
    actualSources,
    correct,
    route,
    filesRead,
    bytesRead,
  }],
  graduation,
  semanticExtractionRan: false,
}
```

For comparison, run every query through:

- baseline normalized navigation;
- graph-assisted navigation.

The baseline may use the documented board/index/handoff/card route but receives
no graph. The graph arm receives the graph first, then opens only cited
authoritative sources. Count exact files and bytes read. Do not label byte
counts as provider tokens.

- [ ] **Step 4: Add the current FB repository example**

Run the same pre-registered questions against the current repository:

```text
What is TASK-048's current state?
Which decision defines its graph authority boundary?
What is its next approval gate?
What normalized-record contract does it depend on?
```

Write generated graph files only under ignored `.fb/graph/`. Append aggregate
and query-level results to the experiment document.

- [ ] **Step 5: Add an isolated Unmirror snapshot example**

If `/Users/jamesyeang/Projects/mirrorcam` is readable, copy only its board,
handoff index, relevant normalized handoffs, workstream cards, and QA metadata
into a temporary directory. Record hashes of the canonical files before and
after and prove they are unchanged.

If it is unavailable or lacks normalized records, record:

```text
Unmirror pilot: blocked — canonical normalized inputs unavailable.
Recovery: Product may authorize repository-local adoption separately.
```

Do not fabricate compatibility or rewrite legacy records for the experiment.

- [ ] **Step 6: Run the visible pilot once**

Run:

```bash
node tools/fb-project-graph-pilot.cjs run --experiment TASK-048
```

Expected output includes:

```text
new-project: Level 1
growing-project: Level 2 recommended; semantic extraction not run
damaged-graph: normalized-record fallback
FB repository: comparison complete
Unmirror snapshot: complete or explicit blocked result
```

- [ ] **Step 7: Recompute results and preserve unfavorable outcomes**

Run:

```bash
node tools/fb-project-graph-pilot.cjs verify --experiment TASK-048
node --test tools/fb-project-graph.test.cjs tools/fb-project-graph-pilot.test.cjs
```

Expected: stored results recompute exactly; no selective reruns are needed.

- [ ] **Step 8: Commit Task 4**

```bash
git add tools/fb-project-graph-pilot.cjs tools/fb-project-graph-pilot.test.cjs docs/experiments/TASK-048-graduated-project-graph-pilot.md
git commit -m "test: evaluate graduated FB project graph"
```

---

### Task 5: Focused Review Package

**Files:**
- Create: `docs/qa/TASK-048.md`
- Modify: `docs/handoffs/TASK-048.md`
- Modify: `PROJECT_BOARD.md`
- Modify: `docs/handoffs/index.md`
- Modify: `docs/workstreams/fb-product.md`

**Interfaces:**
- Consumes: pilot outputs and focused test evidence
- Produces: Product decision packet for stop, revise, or plan plugin integration

- [ ] **Step 1: Record focused QA**

Record:

```text
Candidate:
Commands:
Scenario results:
Graph health:
Privacy checks:
Fallback checks:
Unmirror canonical hash comparison:
Known limits:
```

Do not paste raw graph JSON or full test output into the handoff.

- [ ] **Step 2: Classify the result**

Use exactly one result:

```text
demonstrated — proceed to plugin-integration design
promising but inconclusive — revise the pilot once
not demonstrated — stop graph productization
```

`demonstrated` requires at least 20 percent lower orientation bytes in the
pre-registered comparison or another predefined material improvement without
more incorrect answers. Bytes remain a context proxy, not token evidence.

- [ ] **Step 3: Run the final focused gate**

Run:

```bash
node --test tools/fb-project-graph.test.cjs tools/fb-project-graph-pilot.test.cjs
node --check tools/fb-project-graph.cjs
node --check tools/fb-project-graph-pilot.cjs
node tools/fb-package-sync.cjs --check
git diff --check
```

Expected: focused graph tests, syntax, existing package parity, and whitespace
pass. No full validator or unrelated runtime suite runs.

- [ ] **Step 4: Commit closeout**

```bash
git add PROJECT_BOARD.md docs/handoffs/index.md docs/handoffs/TASK-048.md docs/workstreams/fb-product.md docs/qa/TASK-048.md docs/experiments/TASK-048-graduated-project-graph-pilot.md
git commit -m "docs: close graduated project graph pilot"
```

- [ ] **Step 5: Stop for Product review**

Report:

- rendered Markdown and HTML example locations;
- fixture-level results;
- FB and Unmirror result or blocker;
- exact navigation savings and graph-maintenance cost;
- correctness and fallback evidence;
- recommendation.

Do not add the graph to bootstrap, package mirrors, installed plugin, or other
projects until Product approves the pilot result and a separate plugin
integration slice.

