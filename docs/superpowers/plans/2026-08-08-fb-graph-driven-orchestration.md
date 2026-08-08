# FB Graph-Driven Orchestration Implementation Plan

## Summary

Upgrade FB from a graph-assisted loop into a graph-driven product-delivery
system. Git, Markdown, handoffs, QA, and Git history remain authoritative. A
derived repository-local graph determines relevant context, dependencies,
sequencing, concurrency, change invalidation, and human-readable projections.
Product/BFM remains the decision and execution authority; **Push Live** remains
the release boundary.

This extends `tools/fb-project-graph.cjs`. It does not add a graph database,
hosted service, automatic cross-project learning, or a second source of truth.

## Global Constraints

- Existing projects and historical handoffs remain valid without migration.
- Every derived node and edge cites an authoritative repository source.
- Unknown or ambiguous relationships remain unknown; the compiler never
  guesses approval, release authority, user decisions, sensitive-operation
  authorization, or successful verification.
- `.fb/graph/` is derived, repository-local, safely rebuildable, and contains
  no transcripts, secrets, hidden reasoning, or copied historical narrative.
- Stale, corrupt, or incomplete derived graph data visibly falls back to the
  authoritative board, index, handoff, card, QA, and Git inspection path.
- Product/BFM resolves conflicts and applies priorities. The scheduler only
  executes the recorded graph-derived plan.
- Sensitive-operation, worktree, lock, verification, changelog, and release
  gates remain unchanged. The user does not select internal execution mode.
- Learning may add applicable context, dependencies, or verification floors;
  it cannot change product decisions, source code, repair budgets, or release
  authority.
- Generate package mirrors mechanically after canonical review.
- Stop at **Ready to ship**. Merge, marketplace publication, reinstall, and
  deployment require **Push Live**.

## Target Architecture

```text
Authoritative records → deterministic graph compiler → active product subgraph
→ Product/BFM planner → dependency-aware scheduler → isolated Codex slices
→ verification nodes → authoritative records
                                  ↓
                           bounded learning
                                  ↓
                        active product subgraph
```

## Graph Model

Node types: Project, Workstream, User decision, Assumption, Requirement,
Handoff, Task, Implementation slice, Bug, Verification, Lesson, Release.

Edge types: `depends-on`, `blocks`, `conflicts-with`, `supersedes`, `affects`,
`implements`, `verified-by`, `learned-from`, `owned-by`,
`included-in-release`.

New handoffs may optionally declare:

```yaml
graph:
  depends_on:
    - TASK-101
  conflicts_with:
    - DECISION-023
  affects:
    - FEATURE-EXPORT
  supersedes:
    - REQUIREMENT-011
```

Missing structured fields compile from existing exact links when deterministic;
otherwise they remain unknown.

## Task 1: Graph schema and normalized compiler

Extend `tools/fb-project-graph.cjs` and focused tests with the complete node and
edge vocabulary, source citations, deterministic IDs, optional handoff graph
frontmatter, and normalized compilation from `PROJECT_BOARD.md`, the handoff
index, handoffs, workstream cards, QA artifacts, project-learning records, and
Git/release references. Preserve all existing graph APIs and historical
records. Reject unresolved edge targets, ambiguous inference represented as
fact, inferred approval, inferred release authority, and derived proof of test
success. Corrupt derived data must be safely rebuildable.

Run the smallest canonical and packaged graph compiler tests, generate mirrors
once, and commit the slice.

## Task 2: Active-subgraph context compiler

Add a graph query that returns only ready nodes, blocked nodes, unresolved
conflicts, recently changed decisions, affected verification, applicable
learning, and direct dependencies/dependants. Context packets contain the
current objective, governing decisions, relevant assumptions, dependency state,
acceptance criteria, applicable lessons, and exact source links—not copied
handoffs or board history. Completed historical nodes remain retrievable through
explicit graph-linked lookups but stay outside routine context. Unrelated
workstreams and lessons must remain excluded.

Run focused context-selection tests and commit the slice.

## Task 3: Dependency-aware scheduler

Create `tools/fb-graph-scheduler.cjs` plus focused tests. Its deterministic
projection is:

```json
{
  "current": [],
  "parallelReady": [],
  "next": [],
  "blocked": [],
  "deferred": [],
  "conflicts": [],
  "releaseGates": []
}
```

Never schedule unresolved dependencies or conflicting user decisions. Calculate
eligible parallel work and the critical path; attach verification requirements;
keep overlapping, sensitive, shared-file, and unresolved work sequential;
preserve worktree/lock isolation; use one Product/BFM integration pass; stop
when the approved outcome is satisfied. Cover six independent ready tasks,
dependency chains, conflicts, blocked work, sensitive operations, and
concurrent worktree mappings.

Generate the package mirror and commit the slice.

## Task 4: Change propagation and invalidation

Add deterministic descendant impact calculation. A changed decision reopens
only affected implementation and QA; failed verification blocks its
implementation and release; a superseded requirement retires its unstarted
tasks; a fixed bug requires its connected regression check; a changed
dependency recalculates only downstream sequencing. Every invalidation cites
the changed source and states why the node became stale. Never reopen unrelated
completed work.

Run focused propagation tests and commit the slice.

## Task 5: Bounded learning integration

Attach active project lessons to matching graph patterns only when work type,
surface, required conditions, and lifecycle state match and no safety rejection
exists. Learning may add context, dependencies, recovery hints, existing checks,
or a higher verification floor through the current allowlist. It may not change
decisions, source, prompts, repair budgets, eval authority, sensitive policy, or
release authority. Preserve the one-revision lifecycle and existing Quick/Full
repair limits.

Run focused graph-plus-learning tests and commit the slice.

## Task 6: Product/BFM integration and generated projections

Change `$bfm` guidance and runtime integration to refresh the graph, freeze an
active-subgraph snapshot, detect conflicts/missing evidence/staleness, apply
Product priorities, calculate parallel work and critical path, create bounded
slices, attach verification, execute ready slices, update authoritative
records, refresh the graph, and stop at **Ready to ship**. Product must record
the consolidated Build Brief before scheduler execution. Handoffs remain queued
Product inputs, not executable instructions.

Generate compact graph projections for Current, Next, Blocked, Deferred,
Conflicts, Recently invalidated, and Ready-to-ship conditions. The board remains
a readable active-work projection; full history remains available through exact
links. A failed graph refresh must visibly use the authoritative fallback and
must not claim graph-driven sequencing.

Run focused BFM, status, board-projection, fallback, root/package, syntax, and
parity tests; commit the slice.

## Task 7: Plugin, documentation, setup, and migration

Update Product/BFM, coordination, six workstream, setup, and BFM skills; graph,
workflow, learning, evidence, setup/migration, plugin README, and public README
guidance. Use this explanation consistently:

> The graph is the product-delivery map. Workstream loops investigate and
> improve parts of it. Product/BFM navigates the graph, and Codex executes its
> approved sequence.

Document hybrid authority, graph rebuild/fallback, optional structured
relationships, historical retrieval, change invalidation, and no graph database
requirement. Bootstrap or upgrade adds derived graph support without overwriting
project-owned records. Mechanically regenerate all declared package mirrors
once after canonical review.

Run focused documentation, migration/bootstrap, link, parity, syntax, and
whitespace contracts; commit the slice.

## Task 8: Release checkpoint and evidence

Product/BFM chooses the next appropriate beta version, records a candidate-
faithful changelog entry, creates TASK-080 board/handoff/QA evidence, and runs
the complete repository validator once at the final release checkpoint. Verify
product readiness has no material reduction, deterministic dependency handling
is 100% on the declared fixtures, missed safety controls and invented decisions
remain zero, repeated context reads are lower in the fixtures, unnecessary
reopened work is zero, and package mirrors are aligned. Report fixture-level
token/context direction without publishing universal savings percentages.

Create or update one GitHub pull request and allow one GitHub readiness run.
Stop at **Ready to ship**. Do not merge, publish, reinstall, or deploy without
**Push Live**.
