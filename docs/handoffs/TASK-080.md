---
type: fb-lane-handoff
fb_harness: v3
learning_contract: v1
task: TASK-080
lane: fb-product
status: in-progress
review_state: not reviewable
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
Mini-loop Evidence: pending focused RED/GREEN implementation and task review.
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
- Verification: focused proof per slice, one consolidated behavioral repair
  maximum, one independent whole-candidate review, then one complete release
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

Current: Task 1 — graph schema and normalized compiler.
Next: active-subgraph context, scheduler, propagation, learning integration,
Product/BFM projections, plugin/docs/migration, release checkpoint.
Blocked: none.
Deferred: all live release actions until **Push Live**.

## Process decision — 2026-08-08

FB's default plugin and generated-project execution process is now focused proof
per slice, one consolidated behavioral repair, one whole-candidate review, and
one final release checkpoint. Mandatory per-slice reviewer/re-review ceremony is
removed. Safety, sensitive-operation, authority, worktree/lock, changelog, and
**Push Live** gates remain unchanged.
