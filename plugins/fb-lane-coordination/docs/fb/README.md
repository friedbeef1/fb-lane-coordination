# FB Harness

FB is an optional, repository-local coordination harness. It helps a Product
lead carry an approved objective from planning to testable evidence without
turning ordinary coding into ceremony.

## Source of truth

Read the smallest relevant layer, in this order:

1. `PROJECT_BOARD.md` — current task, owner, locks, approval, sequencing, and gates.
2. `docs/handoffs/index.md` — compact routing to the relevant handoff.
3. The linked detailed handoff — plan, rationale, evidence, and closeout.
4. `docs/workstreams/<lane>.md` — a revisit summary only.
5. These FB pages — reusable operating policy; they do not replace project facts.

`AGENTS.md` is a navigator into this pack. Project rules and task-specific
instructions take precedence when they are stricter.

## Choose the smallest mode

- **Normal work:** one-thread questions, explanations, tiny fixes, and isolated edits.
- **FB light:** handoffs, board items, lanes, locks, multiple threads, or durable context.
- **Product planning:** deciding scope or sequence; handling sensitive surfaces (payments, auth, privacy, analytics, secrets); core product flows; or reconciling several lane outputs before source changes.
- **Build For Me (BFM):** source execution, checks, merge, staging, release, or launch only after approval and explicit `$bfm`.

## Read by task

- Starting a project or explaining the plan: [start.md](start.md)
- Coordinating lanes or running approved work: [workflow.md](workflow.md)
- Asking someone to review or proving work: [evidence.md](evidence.md)
- Safety, recovery, sidechats, and loop escalation: [guardrails.md](guardrails.md)
- Resuming durable work, checkpoints, recall, review, or closeout: [sessions.md](sessions.md)
- Selecting harness/product evals, recording Quality Gaps, or closing revision loops: [evals.md](evals.md)
