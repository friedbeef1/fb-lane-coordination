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

## Fix round 1 — lock and verification gates

- A task now needs an explicit `locks` array or map before it can enter
  `parallelReady`; an explicit empty array/map means no locks, while a missing
  declaration emits a source-cited `missing-lock-isolation-gate` instead of
  assuming safe isolation.
- Current work with unknown locks remains visible as current but is marked with
  a source-cited missing-lock reason and prevents new ready work from running
  concurrently with it.
- Unfinished `verified-by` requirements are collected before classification, so
  blocked, deferred, and conflicted tasks keep their verification release gates
  visible without asserting passed or failed proof.

Focused verification command and output:

```text
$ node --test tools/fb-graph-scheduler.test.cjs plugins/fb-lane-coordination/tools/fb-graph-scheduler.test.cjs
✔ projects six independent ready tasks in deterministic isolated parallel lanes
✔ keeps dependency chains out of ready work and exposes their critical paths
✔ reports unresolved user-decision conflicts without choosing a winner
✔ reports explicit blockers and blocked activity without scheduling either task
✔ defers sensitive work and serializes ready tasks that overlap a shared lock
✔ permits only distinct concurrent worktree mappings and defers an unmapped task
✔ fails closed when ready or current work omits its lock declaration
✔ keeps unfinished verification gates visible for blocked deferred and conflicted tasks
✔ projects six independent ready tasks in deterministic isolated parallel lanes
✔ keeps dependency chains out of ready work and exposes their critical paths
✔ reports unresolved user-decision conflicts without choosing a winner
✔ reports explicit blockers and blocked activity without scheduling either task
✔ defers sensitive work and serializes ready tasks that overlap a shared lock
✔ permits only distinct concurrent worktree mappings and defers an unmapped task
✔ fails closed when ready or current work omits its lock declaration
✔ keeps unfinished verification gates visible for blocked deferred and conflicted tasks
ℹ tests 16
ℹ pass 16
ℹ fail 0
```

```text
$ node -c tools/fb-graph-scheduler.cjs
$ node -c plugins/fb-lane-coordination/tools/fb-graph-scheduler.cjs
$ node tools/fb-package-sync.cjs --check
Checked 72 package mirrors.
$ git diff --check
```
