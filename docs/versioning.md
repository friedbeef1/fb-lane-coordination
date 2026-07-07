# FB-Lane Versions

## Current Naming

Call the current GitHub documentation line **FB-Lane 0.2.0-beta: Loop
Engineering public beta**.

The Codex plugin manifest for this line is
`0.2.0-beta+codex.20260707114230`. Treat that as the installed plugin build ID;
the product model name is still **FB-Lane 0.2.0-beta: Loop Engineering public beta**.

## Before And After

| Area | v1: four-lane coordination plugin | Latest: 0.2.0-beta Loop Engineering |
|---|---|---|
| Core idea | Split work across Product, Tech, Design, and Business lanes. | Keep goal, plans, evidence, board state, and repo truth aligned through a return loop. |
| Product role | Sequence and review lane work. | Own goals, BFM execution launch, reconciliation, merge gates, and release decisions. |
| Workstreams | Could drift from planning into implementation. | Plan-only by default; source changes happen through Product-launched BFM. |
| Goals | Lightweight goal alignment. | Approved OKRs with Definition of Done, gate, justification, and explicit approval. |
| Handoffs | Detailed markdown handoffs. | `PROJECT_BOARD.md` is truth, `docs/handoffs/index.md` is routing, detailed handoffs are detail. |
| Execution | Lane claims and submits work. | BFM runs story split, dependency/lock pass, unblocked sequence, verification, and return checks. |
| Closeout | Mark task done after implementation and review. | Every handoff ends as implemented, already done, blocked, out of scope, or explicitly deferred. |
| Safety | Basic board locks and lane boundaries. | `doctor`, CI readiness, clean/intentionally dirty state, and provider cleanup evidence. |
| Learning | Mostly manual retros. | `Loop Learning` proposes guardrails, automation, or evals only after repeated failures. |
| Autonomy | User approves most decisions. | Shadow Approval first; bounded self-approval only after user-approved phase changes. |
| Returning lanes | Re-read board and handoffs. | Workstream status cards show what Product/BFM already executed or deferred. |

## Practical Meaning

v1 was useful for avoiding collisions. The latest version is meant to reduce
rework: agents can move fast, but they must return to the approved goal,
evidence, board, docs, tests, and git state before calling work complete.

Use FB-Lane when coordination risk is real. Skip it for one-thread fixes,
read-only questions, tiny edits, and independent experiments.
