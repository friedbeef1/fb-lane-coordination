# FB Versions

## Current Naming

The current GitHub documentation line uses the FB 0.5.5-beta product name.

The Codex plugin manifest for this line is
`0.5.5-beta+codex.20260803212323`. This is the current release candidate.

Codex is the only supported and released integration. Claude Code and
Antigravity are paused; contributors can use the
[revival checklist](paused-integrations.md) before proposing renewed support.

## Before And After

| Area | v1: four-lane coordination plugin | Latest: FB 0.5.5-beta |
|---|---|---|
| Core idea | Split work across Product, Tech, Design, and Business lanes. | Keep goal, plans, evidence, board state, and repo truth aligned through a return loop. |
| Product role | Sequence and review lane work. | Own goals, BFM execution launch, reconciliation, merge gates, and release decisions. |
| Workstreams | Product, Tech, Design, and Business could drift from planning into implementation. | Product/User, Business, Design, Tech, Discovery, and Bugs follow evidence mini-loops; source changes happen through Product-launched BFM. |
| First setup | Workstream sidebar tasks were created manually. | Bootstrap asks once for permission, adds only missing repository-scoped workstream tasks, and leaves them idle. |
| Agent control | Agent workflows depended on task-specific orchestration. | An optional rules-first control loop preserves baselines, records flat clone-local evidence, compares named criteria, and keeps configuration candidates isolated behind Product approval. |
| Goals | Lightweight goal alignment. | Approved OKRs with Definition of Done, gate, justification, and explicit approval. |
| Handoffs | Detailed markdown handoffs. | `PROJECT_BOARD.md` is truth, `docs/handoffs/index.md` is routing, detailed handoffs are detail. |
| Execution | Lane claims and submits work. | BFM runs story split, dependency/lock pass, unblocked sequence, verification, and return checks. |
| Closeout | Mark task done after implementation and review. | Every handoff ends as implemented, already done, blocked, out of scope, or explicitly deferred. |
| Closeout visibility | Status could live in chat or a summary card. | Detailed handoffs get `## Product/BFM Closeout` before workstream cards are refreshed. |
| Safety | Basic board locks and lane boundaries. | `doctor`, CI readiness, clean/intentionally dirty state, and provider cleanup evidence. |
| Learning | Mostly manual retros. | `Loop Learning` proposes guardrails, automation, or evals only after repeated failures. |
| Autonomy | User approves most decisions. | Shadow Approval first; bounded self-approval only after user-approved phase changes. |
| Safe unblock | Blockers often became user prompts. | BFM recommends and executes safe unblock paths inside approved scope; hard gates still stop. |
| Frontend planning | Visual decisions could stay in chat. | Frontend handoffs name `Visual Preview Decision` before source execution when visual uncertainty matters. |
| Returning lanes | Re-read board and handoffs. | Workstream status cards show what Product/BFM already executed or deferred. |
| Plugin builds | Build labels could look stale after docs changed. | The current Codex release candidate is `0.5.5-beta+codex.20260803212323`. |

## Practical Meaning

v1 was useful for avoiding collisions. The latest version is meant to reduce
rework: agents can move fast, but they must return to the approved goal,
evidence, board, docs, tests, and git state before calling work complete.

Use FB when coordination risk is real. Skip it for one-thread fixes,
read-only questions, tiny edits, and independent experiments.
