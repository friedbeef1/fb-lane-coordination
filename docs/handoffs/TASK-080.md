---
type: fb-lane-handoff
fb_harness: v3
learning_contract: v1
task: TASK-080
lane: fb-product
status: implemented
review_state: completed build
---

# TASK-080 — FB graph-driven orchestration

## Goal Alignment Session

Product Goal: Make the repository-local graph drive context, dependencies,
sequencing, concurrency, invalidation, and compact status without replacing
authoritative Markdown or Git.
Workstream Goal: Extend the current graph and learning runtime through eight
bounded implementation and release slices.
Lane OKR Fit: aligned
User Approval Needed: no — James supplied the plan and asked the current
Product/BFM task to confirm and run it.
Approval: approved — James approved the implementation plan and explicitly
authorized the live release, publication, and installation in this task.
Mini-loop Evidence: focused router, compiler, scheduler, propagation, learning,
intake, and package contracts passed; one whole-candidate review found the
optional repository-wide path, and one consolidated repair produced the
automatic candidate-scoped route verified in TASK-080 QA.
Evidence Against Product OKR: current FB has graph-assisted context but does not
yet prove deterministic graph-driven scheduling and change propagation.

## Project Start Brief

User decision: Upgrade FB to graph-driven orchestration using hybrid storage.
Git, Markdown, handoffs, QA, and Git history remain authoritative; the derived
graph controls navigation and execution planning.

Assumptions: Existing `fb-project-graph` and project-learning interfaces are the
foundation; historical records remain compatible; derived graph state may be
discarded and rebuilt; user-facing execution mode remains automatic.

Success: Relevant-only context, exact dependency handling, safe concurrency,
targeted invalidation, bounded learning, compact projections, visible fallback,
zero invented decisions or missed safety gates, and aligned plugin guidance.

## Build Brief

- Include now: graph schema/compiler, active subgraph, scheduler, propagation,
  learning integration, Product/BFM and status integration, documentation,
  migration, package mirrors, focused task reviews, release evidence, and one
  final checkpoint.
- Out of scope: graph database, hosted storage, cross-project learning,
  autonomous product/sensitive decisions, changed repair budgets, merge,
  publication, reinstall, or deployment.
- Sequencing: follow Tasks 1–8 in the approved
  [implementation plan](../superpowers/plans/2026-08-08-fb-graph-driven-orchestration.md).
- Verification: focused proof per slice, one independent whole-candidate
  review, one consolidated repair if needed, then one complete release
  validator. Individual slices do not require reviewer/re-review ceremonies.
- Changelog expectation: required.
- Release boundary: stop at **Ready to ship**. Only **Push Live** authorizes
  merge, marketplace publication, reinstall, or deployment.

## Intake disposition

Include now: the supplied Graph-Driven Orchestration Plan.
Blocked: none.
Deferred: graph database, hosted service, automatic cross-project learning.
Duplicate: none.
Rejected: inferred authority or universal fixture-savings claims.
Superseded: none.

## Current execution state

Current: Complete — `0.7.0-beta+codex.20260809013127` is published and installed.
Next: no TASK-080 action remains; the required reload completed before later FB
release work and newer releases now supersede this installed build.
Blocked: none.
Deferred: none inside the authorized release scope.

## Process decision — 2026-08-08

FB's default plugin and generated-project execution process is now focused proof
per slice, one whole-candidate review, one consolidated repair if needed, and one
final release checkpoint. Mandatory per-slice reviewer/re-review ceremony is
removed. Safety, sensitive-operation, authority, worktree/lock, changelog, and
**Push Live** gates remain unchanged.

## Automatic orchestration router decision — 2026-08-09

`$bfm` runs a cheap deterministic preflight and selects its own route. Direct
BFM is allowed only for one isolated bounded item with no graph-relevant signal.
Multiple items, dependencies, conflicts, changed decisions, blocked/stale work,
shared locks, applicable lessons, or release relationships require graph-driven
orchestration. The selected route and reasons are visible. Missing, stale, or
corrupt graph data uses the authoritative-record fallback. The user is never
asked to choose.

## Task Receipt

- Approved brief: implement Tasks 1–8 from the linked plan, including the
  automatic router added before the whole-candidate repair.
- Decisions: Direct BFM is limited to one isolated bounded item; all declared
  graph signals route to graph-driven orchestration; unhealthy graph state uses
  visible authoritative records.
- Scope changes: mandatory per-slice reviewer/re-review ceremony was removed;
  focused proof per slice, one whole-candidate review, one consolidated repair,
  and one final release checkpoint are retained.
- Branch and commits: `codex/graph-driven-orchestration`; implementation range
  begins at `e0f4e0d`; consolidated router repair is `025a8cb`.
- Changed surfaces: graph compiler/context, router, scheduler, propagation,
  learning attachment, BFM projections, skills, templates, plugin manifests,
  documentation, focused contracts, and release records.
- Verification: focused results and final checkpoint are recorded in
  [TASK-080 QA](../qa/TASK-080.md).
- Failures and recovery: the whole-candidate review found the graph runtime was
  opt-in and repository-wide; one consolidated repair connected automatic
  candidate-scoped routing and closed all findings.
- Review state: completed build.
- Limits: no graph database, hosted graph service, cross-project learning, or
  autonomous sensitive/product decisions.
- External gates: James explicitly authorized push, merge, publication, and
  reinstall in the current Product/BFM task on 2026-08-09.
- Repository state: PR #63 merged as `c9d5d49`; GitHub `main` and the local
  marketplace checkout agree.
- Remaining owner/action: none for TASK-080. The release-time new-task reload
  completed before later FB tasks; no current action remains in this record.
- Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#070-beta--2026-08-09).

## Brief Validation

Status: pass.

Satisfied criteria: automatic route selection, graph triggers, visible reasons,
authoritative fallback, candidate-scoped scheduling, lock serialization,
bounded learning, semantic invalidation, privacy redaction, evidence-based
readiness, lean review process, and package parity all have focused proof.

Missing criteria and next action: none. GitHub readiness passed and the exact
installed plugin skill and bundled MCP route were verified.
