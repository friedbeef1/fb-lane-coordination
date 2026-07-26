---
type: fb-lane-handoff
task: TASK-048
lane: fb-product
status: ready
approval: design-approved
record_model: normalized-v1
okr_fit: aligned
---

# TASK-048 — FB Graduated Project Graph

## Approved Decision

Treat the graph as a graduated, repository-local navigation layer inside FB.
The graph maps relationships across existing Loop Engineering records; it does
not introduce another workstream, approval system, or source of product truth.

## Scope

Design the Level 0–3 graduation model, deterministic Level 1 pilot, evidence
gate for deeper Graphify mapping, fallback behavior, privacy boundaries,
measurement, and eventual plugin integration.

## Out of Scope

Implementation before James reviews the written design, hosted services, graph
database requirements, automatic commit hooks, transcript capture,
cross-project exports, plugin publication, release, merge, deployment, or
consumer-project mutation.

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

Design written for Product review. No runtime, plugin, package, consumer
repository, release, or deployment change has been made.
