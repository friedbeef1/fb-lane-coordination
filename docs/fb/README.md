# FB Harness

FB is a Codex plugin and repository-local product-delivery harness. Six
workstreams run small evidence loops; `$bfm` consolidates their ready handoffs,
directs implementation and automated checking, and stops at **Ready to ship**.
Only **Push Live** authorizes merge or deployment.

## Source of truth

Read the smallest relevant layer, in this order:

1. `PROJECT_BOARD.md` — current task, owner, locks, approval, sequencing, and gates.
2. `docs/handoffs/index.md` — compact routing to the relevant handoff.
3. The linked detailed handoff — plan, rationale, evidence, and closeout.
4. `docs/workstreams/<lane>.md` — a revisit summary only.
5. These FB pages — reusable operating policy; they do not replace project facts.

`AGENTS.md` is a navigator into this pack. Project rules and task-specific
instructions take precedence when they are stricter.

## Choose the smallest execution mode

Build For Me (BFM) is FB's execution path only after Product approval and
explicit `$bfm`; Normal Codex remains the default when that coordination is
unnecessary.

- **Normal Codex:** clear, isolated, low-risk work. It creates no FB record and runs only directly relevant checks.
- **Quick BFM:** an approved bounded correction with one owner, explicit locks and success criteria, one `TASK-Q-*` Quick Record, one reviewer, proportional focused checks, and one closeout in that same record.
- **Full BFM:** material product, architecture, security, provider, release, multi-lane, conflicting-lock, or unclear work. It keeps the board, index, handoff, session, evidence, and closeout model.

Auth, privacy, payments, secrets, destructive data, provider state, releases,
deployments, publications, production migrations, material architecture/core
flows, multiple owners, and ambiguity always require Full BFM. Normal Codex is
the default when no durable coordination is needed. See
[workflow.md](workflow.md) for execution budgets and stop predicates.

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
