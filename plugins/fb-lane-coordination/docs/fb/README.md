# FB Harness

FB is a Codex plugin and repository-local product-delivery harness. Six
workstreams run small evidence loops; `$bfm` consolidates their ready handoffs,
directs implementation and automated checking, and stops at **Ready to ship**.

Durable facts follow the [normalized records and efficient evidence contract](records.md):
one authoritative home per fact, direct links elsewhere, deterministic
verification reuse, and compact closeout.
Only **Push Live** authorizes merge or deployment.

For a known task and concrete question, agents first use
`fb_project_context` as described in [graph.md](graph.md). A healthy graph
routes to at most three relevant authoritative files. An insufficient or
unhealthy result uses the safe fallback route below. The graph never becomes a
source of truth.

## Source of truth

Read the smallest relevant layer, in this order:

1. `PROJECT_BOARD.md` — current task, owner, locks, approval, sequencing, and gates.
2. `docs/handoffs/index.md` — compact routing to the relevant handoff.
3. The linked detailed handoff — plan, rationale, evidence, and closeout.
4. `docs/workstreams/<lane>.md` — a revisit summary only.
5. These FB pages — reusable operating policy; they do not replace project facts.

`AGENTS.md` is a navigator into this pack. Project rules and task-specific
instructions take precedence when they are stricter.

## Start with the matching workstream

When planning or evidence is useful, start in whichever workstream matches the
question. Product/User is selected only for user needs, outcomes, requirements,
feedback, acceptance criteria, or product priorities. Relevant workstreams
create ready handoffs. After those handoffs are ready, the user says `$bfm` to
activate Product reconciliation and execution of approved scope. FB keeps its
risk and execution classification internal; the user never chooses a mode.
See [start.md](start.md) for the public sequence and [workflow.md](workflow.md)
for internal execution budgets and stop predicates.

Verification has three levels: focused check, immediate safety gate, and
release checkpoint. A full validator is eligible only when a Product-owned
handoff explicitly requests that release checkpoint; a handoff artifact,
owner transfer, staging, or review does not request one.

## Read by task

- Seeing the complete workstream-to-release system: [Full FB Loop Diagram](full-loop.md)
- Comparing FB with vanilla Codex or Kurrent Capacitor: [Why FB](../why-fb.md)
- Starting a project or explaining the plan: [start.md](start.md)
- Coordinating lanes or running approved work: [workflow.md](workflow.md)
- Asking someone to review or proving work: [evidence.md](evidence.md)
- Safety, recovery, sidechats, and loop escalation: [guardrails.md](guardrails.md)
- Resuming durable work, checkpoints, recall, review, or closeout: [sessions.md](sessions.md)
- Selecting harness/product evals, recording Quality Gaps, or closing revision loops: [evals.md](evals.md)
- Normalizing durable facts, reusing verification, or closing compactly: [records.md](records.md)
- Reducing broad orientation through source-cited targeted reading: [graph.md](graph.md)
