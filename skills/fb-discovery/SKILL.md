---
name: fb-discovery
description: Use when product unknowns need research, experiments, competitor evidence, opportunity evidence, or feasibility evidence before implementation is approved.
---

# FB Discovery

Discovery reduces uncertainty for Product/User. It is a planning/evidence
workstream, not implementation. Research the smallest decision-changing unknown,
record observable evidence, and hand a recommendation to Product/BFM.
Discovery must not implement source, present speculation as evidence, or set
final Product priority.

Use [records.md](../../docs/fb/records.md): research decisions and limits stay
in the task handoff, raw bounded proof stays in the QA artifact, and the
Discovery card carries only current task IDs, blockers, next action, and links.

For a known task and concrete question, call MCP `fb_project_context` first and
open only its relevant cited sources. The graph routes to authoritative
records; it is not a source of truth. Use the board → index → handoff → card
fallback when the packet says fallback or is incomplete or contradictory.

## Mini-loop

1. Read `AGENTS.md`, `PROJECT_BOARD.md`, `docs/handoffs/index.md`, the linked
   handoff, `docs/workstreams/fb-discovery.md`, and relevant existing evidence.
2. State the unknown, decision it blocks, hypothesis, success/failure signal,
   scope, and timebox before research or an experiment.
3. Gather the smallest useful research, experiment, competitor, opportunity, or
   feasibility evidence. Label direct findings, inference, and unresolved
   hypotheses separately.
4. Compare evidence with the approved Product goal. Recommend proceed, change
   approach, run another bounded experiment, defer, or stop.
5. Create or update `docs/handoffs/<TASK-ID>.md`; do not edit application source,
   branch, commit, submit, merge, deploy, or change provider state from ordinary
   Discovery chat.

## Ready handoff contract

Use frontmatter Product/BFM can scan:

```md
---
type: fb-lane-handoff
task: <TASK-ID>
lane: fb-discovery
status: ready
---
```

Use `status: blocked` when required evidence cannot be gathered. Do not mark a
hypothesis or an unrun experiment ready as if it were a finding. The handoff
must include the unknown and decision, method and sample/source limits, findings,
hypotheses/inferences, competitor and opportunity evidence when relevant,
feasibility evidence when relevant, risks, recommendation, and next owner.

For non-trivial work include:

```md
## Goal Alignment Session

Product Goal: <approved Product/workstream goal>
Workstream Goal: <decision-changing unknown>
Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
User Approval Needed: yes | no
Mini-loop Evidence: <observable research or experiment evidence>
Evidence Against Product OKR: <counter-evidence> | None identified
```

Before closeout, re-read the unknown, evidence, recommendation, and Product goal.
If evidence is insufficient, report the exact gap instead of manufacturing
confidence. Product/BFM owns prioritization, integration, and source execution.
