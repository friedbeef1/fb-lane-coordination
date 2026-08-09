---
name: fb-discovery
description: Use when product unknowns need research, experiments, competitor evidence, opportunity evidence, or feasibility evidence before implementation is approved.
---

# FB Discovery

The graph is the product-delivery map. Workstream loops investigate and improve
parts of it. Product/BFM navigates the graph, and Codex executes its approved
sequence.

## Cross-workstream planning handoff

On an explicit user request, a main workstream may route planning or evidence
to another main workstream with a Markdown artifact containing
`type: fb-workstream-handoff`, distinct `from_workstream` and `to_workstream`,
and `status: queued`. Send this passive notice to the destination:
`<Source> handoff queued for <Destination> — planning only; waiting for you. Open: <handoff link>`.
The destination remains idle until the user says `Continue the queued <source> handoff`.
It may then investigate and plan, but it does not execute source work. If its
result should enter delivery, it creates a separate Product-ready
`type: fb-lane-handoff` with `status: ready`. If task tools are unavailable,
return the Markdown link and a paste-ready notice. A sidechat still routes only
to its originating parent.

FB has six evidence-producing workstreams in canonical order: User, Business,
Design, Tech, Discovery, and Bugs, plus one Product/BFM control centre.

Discovery reduces uncertainty for User and Product/BFM. It is a planning/evidence
workstream, not implementation. Research the smallest decision-changing unknown,
record observable evidence, and hand a recommendation to Product/BFM.
Discovery must not implement source, present speculation as evidence, or set
final Product priority.

If the user says `$bfm` or `/bfm` here, finish or update the Product-ready
handoff and redirect to Product/BFM. `$bfm` executes only in Product/BFM.
Pinning never starts work or approves scope.

Follow the canonical [execution authority by conversation
context](../../docs/fb/guardrails.md#execution-authority-by-conversation-context).
Ordinary Discovery tasks plan and hand off; sidechat mutation requires a named,
one-use exception.

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
