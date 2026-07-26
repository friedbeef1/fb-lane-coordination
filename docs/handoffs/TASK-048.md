---
type: fb-lane-handoff
task: TASK-048
lane: fb-product
status: implemented
approval: approved
record_model: normalized-v1
okr_fit: aligned
---

# TASK-048 — FB Graduated Project Graph

## Approved Decision

Treat the graph as a graduated, repository-local navigation layer inside FB.
The graph maps relationships across existing Loop Engineering records; it does
not introduce another workstream, approval system, or source of product truth.

## Scope

Design and evaluate the Level 0–3 graduation model, deterministic Level 1
pilot, evidence gate for deeper Graphify mapping, fallback behavior, privacy
boundaries, and measurement. Plugin integration remains a later decision.

## Out of Scope

Hosted services, graph database requirements, automatic commit hooks,
transcript capture, cross-project exports, bootstrap or plugin integration,
publication, release, merge, deployment, or consumer-project mutation.

## User Decisions

- Proceed with the graduated graph approach.
- New long-term projects begin with lightweight deterministic links.
- Deeper mapping should expand automatically only when safe and useful.
- The graph is a map of the loops, not another operating loop or source of
  authority.

## Assumptions

- Demonstrated retrieval friction, not project age alone, governs graduation.
- The normalized FB record model supplies the initial authoritative inputs.
- The first delivery slice is a two-project deterministic pilot in FB and an
  isolated read-only snapshot of Unmirror; canonical Unmirror adoption remains
  separately authorized.
- A neutral or negative pilot result may stop further productization.

## Acceptance Criteria

- A written design defines architecture, graduation, data flow, failure
  handling, privacy, measurement, delivery slices, and focused verification.
- Product reviews the written design before implementation planning begins.
- Implementation remains separately authorized.

## Links

- [Design specification](../superpowers/specs/2026-07-26-fb-graduated-project-graph-design.md)
- [Normalized records contract](../fb/records.md)

## Current State

The focused prototype and comparisons are implemented. The first additive
real-agent trial was inconclusive because graph context duplicated broad
orientation. James approved a final replacement experiment using equal isolated
snapshots and minimal question-specific packets.

In that final six-concurrent-worker comparison, both arms remained 6/6 correct.
Graph-first routing used 33.9% fewer uncached input tokens, 54.6% fewer
tool-output orientation characters, and 27.3% less wall time. The controlled
orientation hypothesis is **demonstrated**.

The prototype remains repository-local and ignored under `.fb/graph/`. No
plugin, package, consumer repository, release, or deployment change was made.
The graph remains a router to authoritative records, not a source of truth.

## Implementation Plan

[Graduated project graph pilot](../superpowers/plans/2026-07-26-fb-graduated-project-graph-pilot.md)

## Verification Handoff

- [Experiment and results](../experiments/TASK-048-graduated-project-graph-pilot.md)
- [Focused QA](../qa/TASK-048.md)
- Outcome: Staging QA; controlled graph-first efficiency hypothesis
  demonstrated; not approved for plugin integration.
- Next owner: Product decides whether to authorize a separate plugin slice for
  graph-directed targeted reading with broad-route fallback.
