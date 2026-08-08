# TASK-080 Task 3 — Dependency-aware scheduler

## Status

Implemented as an isolated, deterministic projection API. Runtime `$bfm`
integration remains out of scope for this slice.

## Delivered

- `scheduleGraph(graph, options)` in `tools/fb-graph-scheduler.cjs` returns
  exactly `current`, `parallelReady`, `next`, `blocked`, `deferred`,
  `conflicts`, and `releaseGates`.
- The projection is in-memory only: it does not read authoritative records,
  write derived state, execute source, select a conflicting user decision, or
  grant sensitive-operation authority.
- Dependency and blocker edges hold unfinished work out of ready work, expose a
  deterministic critical path, and remain source-cited in their reasons.
- Verification nodes connected by `verified-by` are attached to task entries;
  outstanding verification and sensitive operations stay visible as release
  gates.
- Independent tasks require distinct worktrees and non-overlapping locks for
  `parallelReady`; shared files, shared worktrees, active locks, sensitive
  tasks, unknown readiness, and missing worktree mappings fail closed into a
  sequential, deferred, blocked, or conflict projection.
- `approvedOutcomeSatisfied: true` stops further scheduling and defers all
  nonterminal tasks.

## TDD evidence

The focused suite was added before the module existed and failed with the
expected missing-module assertion. The implementation then made the same six
behavioral cases pass:

1. six isolated ready tasks and stop-on-approved-outcome;
2. dependency chains and critical paths;
3. unresolved user-decision conflicts without a winner;
4. explicit graph blockers and blocked activity;
5. sensitive operations and shared-lock serialization;
6. distinct versus overlapping/missing worktree mappings.

## Verification

```text
node --test tools/fb-graph-scheduler.test.cjs plugins/fb-lane-coordination/tools/fb-graph-scheduler.test.cjs
# 12 pass, 0 fail

node -c tools/fb-graph-scheduler.cjs
node -c plugins/fb-lane-coordination/tools/fb-graph-scheduler.cjs
node tools/fb-package-sync.cjs --check
# Checked 72 package mirrors.

git diff --check
```

## Mirror and review

Added the scheduler and its focused suite to `tools/fb-package-manifest.json`
and regenerated the package copy mechanically. A self-review confirmed the
module is a pure projection and that every scheduling classification is covered
by a focused behavioral assertion.

## Remaining boundary

Task 6 must wire this API into Product/BFM after the plan requires the active
subgraph snapshot and recorded Product priorities. This slice intentionally
does not alter `$bfm`, records, locks, worktree allocation, release authority,
or any source task.
