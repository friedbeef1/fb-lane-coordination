---
name: fb-user
description: Use when user needs, user outcomes, requirements, feedback, acceptance criteria, or product-priority evidence must be clarified before delivery.
---

# FB User

FB has six evidence-producing workstreams in canonical order: User, Business,
Design, Tech, Discovery, and Bugs. Product/BFM is the control centre that
reconciles their handoffs and executes approved scope; it is not a seventh
evidence-producing workstream.

User owns the human outcome: user needs, desired outcomes, requirements,
observed or recorded feedback, acceptance criteria, and product-priority
evidence. It separates actual user evidence from decisions and AI assumptions.
Never fabricate or impersonate user feedback. Label every inference as an
assumption until the user or an authoritative record confirms it.

User is a planning/evidence workstream, not an execution task. It runs the
smallest useful mini-loop, records a ready or blocked
`docs/handoffs/<TASK-ID>.md`, and routes delivery to the Product/BFM control
centre. BFM stops at **Ready to ship**; only **Push Live** authorizes merge or
deployment.

If the user says `$bfm` or `/bfm` here, finish or update the Product-ready
handoff and redirect to Product/BFM. `$bfm` executes only in Product/BFM.
Pinning never starts work, approves scope, invokes `$bfm`, or authorizes
release.

## Cross-workstream planning handoff

On an explicit user request, a main workstream may route planning or evidence
to another evidence-producing workstream with a Markdown artifact containing
`type: fb-workstream-handoff`, distinct `from_workstream` and `to_workstream`,
and `status: queued`. Send this passive notice to the destination:
`<Source> handoff queued for <Destination> — planning only; waiting for you. Open: <handoff link>`.
The destination remains idle until the user says
`Continue the queued <source> handoff`. It may investigate and plan, but it
does not execute source work. If its result should enter delivery, it creates a
separate Product-ready `type: fb-lane-handoff` with `status: ready`. If task
tools are unavailable, return the Markdown link and a paste-ready notice. A
sidechat still routes only to its originating parent.

Follow the canonical [execution authority by conversation
context](../../docs/fb/guardrails.md#execution-authority-by-conversation-context).
Ordinary User tasks plan and hand off; sidechat mutation requires a named,
one-use exception.

Use [records.md](../../docs/fb/records.md): keep user evidence, assumptions,
decisions, scope, and acceptance criteria in the task handoff. Put detailed
verification in the QA artifact and keep the User card to task IDs, blockers,
next action, and links.

For a known task and concrete question, call MCP `fb_project_context` first and
open only its relevant cited sources. The graph routes to authoritative
records; it is not a source of truth. Use the board → index → handoff → card
fallback when the packet says fallback or is incomplete or contradictory.

## Mini-loop

1. Read `AGENTS.md`, `PROJECT_BOARD.md`, `docs/handoffs/index.md`, the linked
   handoff, `docs/workstreams/fb-user.md`, and relevant user evidence.
2. State the user, need, desired outcome, decision to make, known evidence,
   assumptions, scope, and success signal.
3. Gather the smallest useful evidence. Distinguish direct user input,
   observed behavior, approved decisions, and inference.
4. Recommend the priority and acceptance criteria. Name conflicting evidence,
   open assumptions, dependencies, and the next owner.
5. Create or update `docs/handoffs/<TASK-ID>.md`; do not edit application
   source, branch, commit, submit, merge, deploy, or change provider state from
   ordinary User chat.

## Ready handoff contract

Use frontmatter Product/BFM can scan:

```md
---
type: fb-lane-handoff
task: <TASK-ID>
lane: fb-user
status: ready
---
```

Use `status: blocked` when the user need, evidence, material decision, or
acceptance boundary is missing. The handoff includes the target user, need and
outcome, actual evidence, decisions, assumptions, requirements, acceptance
criteria, priority rationale, risks, recommendation, and next owner.

For non-trivial work include:

```md
## Goal Alignment Session

Product Goal: <approved Product/workstream goal>
Workstream Goal: <plain-language user outcome>
Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
User Approval Needed: yes | no
Mini-loop Evidence: <observed or recorded user evidence>
Evidence Against Product OKR: <counter-evidence> | None identified
```

Before closeout, re-read the user need, evidence, assumptions, recommendation,
acceptance criteria, and approved goal. If the evidence is insufficient, name
the exact gap. Product/BFM owns reconciliation, prioritization, implementation,
verification, and release gates.
