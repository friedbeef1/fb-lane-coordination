# FB Graduated Project Graph Design

Date: 2026-07-26  
Owner: Product / BFM  
Status: Design approved in conversation; implementation awaits written-spec review

## Purpose

Add an optional, repository-local navigation layer to FB's existing Loop
Engineering model. FB continues to run the workstream and delivery loops. The
project graph maps their durable relationships so agents can find governing
decisions, dependencies, evidence, implementation, and release history without
reconstructing them from broad repository reads.

The graph is derived navigation, never a source of product authority:

```text
FB loops = the work and feedback motion
Project graph = the map of relationships inside those loops
```

## Product Decision

Use a graduated graph:

1. New projects begin with deterministic links derived from records FB already
   creates.
2. Growing projects expand incrementally when demonstrated retrieval friction
   makes deeper mapping useful.
3. Cross-project aggregation remains an explicit opt-in boundary.

Project age and handoff count alone do not justify deeper extraction. The
graduation decision must be tied to a concrete navigation problem.

## Existing Foundation

The normalized FB record model remains authoritative:

| Surface | Authoritative content |
|---|---|
| Project board | Active status, owner, scope, gate, blockers, and links |
| Handoff index | Routing |
| Task handoff | Decisions, assumptions, scope, dependencies, acceptance, and supersession |
| Workstream card | Current task IDs, blockers, next action, and links |
| QA artifact | Candidate-bound verification evidence |
| Git | Source and commit history |

The graph points to these homes. It does not copy their full content or accept
edits that bypass them.

## Graduation Levels

### Level 0 — No graph

Use for disposable prototypes and isolated mechanical tasks. No graph
artifacts or graph maintenance are required.

### Level 1 — Deterministic record graph

New long-term FB projects receive Level 1 during setup. FB builds relationships
it can prove without semantic interpretation:

```text
Project → OKR → Workstream → Handoff → Task → QA → Commit → Release
                         ├→ Decision
                         ├→ Dependency
                         └→ Supersedes
```

Level 1 updates incrementally from changed normalized records at existing
durable checkpoints. It does not scan transcripts, infer undocumented product
decisions, or semantically analyze the whole repository.

### Level 2 — Expanded project graph

Level 2 adds selected code and document relationships when Level 1 cannot
efficiently answer repeated project-navigation questions.

Graduation requires a recorded friction signal such as:

- repeated broad searches for the same governing decision;
- a material relationship existing only in unstructured documents;
- missed or repeatedly rediscovered cross-workstream dependencies;
- contradictory records that deterministic links cannot contextualize;
- repeated cross-document investigation before the first correct action.

At an existing FB checkpoint, Product/BFM records the signal, affected query,
estimated extraction scope, privacy boundary, and expected navigation benefit.
FB then expands only the relevant corpus. Extracted relationships are labeled
`confirmed`, `inferred`, or `ambiguous`.

Graduation is non-blocking unless the underlying missing evidence is itself a
product or safety blocker. A failed or stale graph falls back to normal FB
records.

### Level 3 — Curated portfolio graph

A mature project may export selected, curated relationships for cross-project
navigation. This always requires explicit approval because information crosses
repository boundaries.

The export excludes transcripts, secrets, environment values, hidden
reasoning, private user data, and unapproved project material. Repository-local
records remain authoritative after export.

## Automatic Behavior

FB checks graph health and possible graduation only at meaningful transitions:

- project setup;
- a handoff becoming ready;
- `$bfm` intake;
- BFM closeout;
- release closeout;
- an explicit graph query exposing stale or insufficient navigation.

Level 1 refreshes automatically when its deterministic inputs change. Level 2
incremental refreshes only the changed, previously approved corpus. FB does not
rebuild the graph on every source edit or commit.

Users do not choose an internal graph level during ordinary work. FB reports a
graduation only when it materially expands scope, cost, or privacy exposure.
Large semantic scans and all cross-project exports require approval.

## Interfaces and Artifacts

The first implementation slice exposes no hosted service and no graph database.
Repository-local generated artifacts use one declared directory:

```text
.fb/graph/
  project-graph.json
  project-graph.md
  project-graph.html
  graph-state.json
```

- `project-graph.json` is the agent-readable derived graph.
- `project-graph.md` summarizes coverage, health, ambiguous relationships, and
  useful queries.
- `project-graph.html` is the optional human-readable visualization.
- `graph-state.json` records level, source fingerprints, refresh time, coverage,
  and construction/maintenance usage when authoritative usage is available.

Every node and edge contains its source location and extraction status. Graph
artifacts must not contain copied secrets, raw transcripts, or private
reasoning.

The detailed command surface is deferred to implementation planning. The
product interface should remain task-oriented: set up, refresh, and query a
project map. Ordinary FB work may consult an existing healthy graph without
requiring a separate user command.

## Query and Fallback Flow

For substantial project work:

1. Read the board's active section.
2. Query a healthy graph for the task, decision, dependency, or evidence path.
3. Open the linked authoritative records needed for the task.
4. Treat graph-only claims as navigation hints, not approval or product truth.
5. Fall back to the normal board → index → handoff → card route if the graph is
   absent, stale, incomplete, or unhealthy.

No closeout, release, safety, or ownership decision may depend solely on an
inferred or ambiguous graph edge.

## Measurement

The first pilot compares existing normalized FB navigation against normalized
FB plus the deterministic graph in FB and an isolated read-only snapshot of
Unmirror. It does not write generated artifacts into the canonical Unmirror
repository during this task.

Measure:

- context tokens before the first correct action, when authoritative usage is
  available;
- files opened for orientation;
- repeated searches and repeated file reads;
- time to locate the governing decision;
- incorrect context assumptions and resulting repairs;
- graph construction and refresh tokens and elapsed time;
- total task tokens as a secondary measure.

The first slice succeeds when the graph either reduces orientation tokens by at
least 20 percent or produces another material, evidenced navigation improvement
without increasing context-related errors. A neutral or negative result is
reported honestly and stops automatic expansion work pending Product review.

Level 2 is not part of the initial measurement until Level 1 has established
incremental value.

## Failure and Safety Handling

- Missing graph: continue through normalized FB records.
- Stale source fingerprint: ignore affected relationships and refresh only
  changed deterministic inputs.
- Invalid source link: mark the edge unhealthy; do not substitute an inference.
- Ambiguous relationship: surface it for navigation but never treat it as an
  approved decision.
- Extraction exceeds its declared scope or budget: stop expansion and continue
  without it.
- Sensitive material encountered: exclude it and record only the bounded reason.
- Cross-project request without approval: do not export.

The graph cannot block normal execution merely because graph generation failed.
Existing safety, scope, lock, verification, and Push Live gates remain
authoritative.

## Delivery Slices

### Slice A — Deterministic pilot

- Define the graph schema and source citations.
- Generate Level 1 from normalized records and Git references.
- Add incremental fingerprints, health reporting, query fallback, and local
  metrics.
- Pilot in FB and an isolated Unmirror snapshot without changing the canonical
  consumer repository.

### Slice B — Plugin integration

- Add new-project Level 1 setup and existing-project adoption.
- Add focused agent guidance for querying before broad context reads.
- Keep prototypes and isolated tasks graph-free.
- Mechanically generate packaged mirrors.

### Slice C — Evidence-gated Level 2

- Proceed only after Product accepts the pilot evidence.
- Integrate scoped Graphify extraction for selected unresolved corpora.
- Preserve extraction-status labels and normal-record fallback.

### Slice D — Optional portfolio graph

- Proceed only through a separate approved design.
- Define curated export, project boundaries, removal, and privacy behavior.

## Verification Strategy

Focused deterministic contracts must prove:

- authoritative records remain unchanged and graph artifacts are derived;
- Level 1 contains only source-backed nodes and edges;
- every relationship resolves to an allowed local record or Git reference;
- incremental refresh changes only affected relationships;
- stale, missing, or corrupt graphs fall back without blocking FB;
- project age and simple record counts do not independently trigger Level 2;
- recorded retrieval friction is required for semantic graduation;
- inferred and ambiguous edges cannot authorize execution or release;
- sensitive content and transcripts are rejected;
- cross-project export requires explicit approval;
- root and packaged plugin behavior remain mechanically aligned.

The pilot records its methodology before comparative tasks begin. It preserves
valid unfavorable results and does not publish a universal token-saving claim.

## Out of Scope

- A separate Graph Engineering workstream or ceremony
- A hosted FB graph service
- A graph database requirement
- Automatic commit hooks
- Transcript or hidden-reasoning capture
- Autonomous product decisions
- Automatic cross-project aggregation
- Release, marketplace publication, merge, or consumer-project rollout

## Acceptance Criteria

- The graph is clearly defined as a derived map of existing FB loops.
- New long-term projects can start cheaply at Level 1.
- Deeper graduation requires demonstrated retrieval friction.
- Normal FB operation continues when the graph is absent or unhealthy.
- Construction and maintenance costs are measured against navigation benefits.
- The implementation can stop after the deterministic pilot if value is not
  demonstrated.
