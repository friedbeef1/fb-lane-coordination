---
name: fb-lane-coordination
description: Use when an FB project needs board-aware routing, handoffs, current-state orientation, or Product/BFM integration.
---

# FB task coordination

FB is **Graph Engineering for Everyday People**: an open-source Codex plugin
that turns scattered AI conversations into a living product-delivery graph.
The graph is the map connecting workstreams, decisions, evidence, dependencies,
implementation, verification, and release state. Workstream loops move and
learn inside it; `$bfm` navigates and executes it; **Push Live** authorizes
release.

Read the [FB harness](../../docs/fb/README.md), then use
`node tools/fb-lane.cjs status --context` (or MCP
`fb_lane_status({context:true})`) for bounded current-state orientation. Follow
its links to the handoff index, current handoff, and relevant workstream card.
Open the full board only when that packet is incomplete or contradictory.
Use `node tools/fb-lane.cjs status` for state during ordinary health checks.

## Workstream and execution boundary

Start planning or evidence in the matching evidence-producing workstream:
User, Business, Design, Tech, Discovery, or Bugs. User is for user needs,
outcomes, requirements, feedback, acceptance criteria, and priority evidence;
Product/BFM is the control centre, not universal intake. Each relevant
workstream runs its mini-loop and creates a
blocked or ready handoff in `docs/handoffs/<TASK-ID>.md`. Ready means `ready for
Product intake`: queued for Product review, **not approval or execution**.

Only `$bfm` in the Product/BFM parent task starts delivery. It freezes the
complete intake ledger from the active canonical checkout, keeps all six
evidence workstreams plus Product/BFM visible, gives every candidate a
disposition, reconciles conflicts and dependencies, prioritizes the included
work, and records the consolidated Project Start Brief and Build Brief before
source execution. The gate requires the configured canonical checkout and a
verified exact-project receipt for all seven pinned tasks; every non-retired
manifest checkout is audited. Product/BFM control inputs remain separate, while
blocked inputs stay counted and linked without execution. Missing, pending,
partial, stale, unreadable, drifting, or contradictory intake fails
closed through the canonical runtime; guidance never duplicates its scanner
logic. BFM stops at
**Ready to ship**. Only **Push Live** authorizes merge or deployment.

Checkout changes use one transactional migration contract: disposition every
discovered difference, atomically record one canonical root, quarantine former
roots, rebind the exact seven project tasks, and require explicit approval
before retirement.

The public model is six evidence-producing workstreams plus one Product/BFM
control centre and seven pinned repository-scoped Codex tasks. Pinning never
starts work. `$bfm` executes only in Product/BFM.

An explicit workstream-to-workstream request creates a queued
`fb-workstream-handoff`. The destination receives
`<Source> handoff queued for <Destination> — planning only; waiting for you. Open: <handoff link>`
and stays idle until the user continues it. `$bfm` ignores that artifact; a
delivery recommendation needs a separate Product-ready `fb-lane-handoff`.
If task tools are unavailable, return the Markdown link and a paste-ready notice
instead of implying that another task was updated.

## Context and history

Routine reads use genuine active state, not completed narrative. For a known
task and question, call MCP `fb_project_context` and open only its cited
authoritative records. The graph is navigation, never a source of truth.

For on-demand historical retrieval, follow the board archive, handoff index,
exact handoff, QA artifact, changelog, and Git history as relevant. If graph
results are missing, stale, incomplete, or contradictory, use the canonical
board → index → exact handoff → workstream-card fallback. Completed history is
excluded from routine context, not deleted or made inaccessible.

## Shared policy

- Follow [start.md](../../docs/fb/start.md) for first-project guidance and the workstream-to-`$bfm` sequence.
- Apply [conversation execution authority](../../docs/fb/guardrails.md#execution-authority-by-conversation-context): Product/BFM parents may execute approved scope; workstream parents plan and hand off; sidechats need a named one-use exception and may route only to their originating parent.
- Follow [workflow.md](../../docs/fb/workflow.md) for ownership, intake, locks, worktrees, private execution routing, budgets, changelog decisions, and closeout.
- Follow [records.md](../../docs/fb/records.md) for one-fact-one-home records, verification reuse, compact cards, archive safety, and efficiency evidence.
- Follow [evidence.md](../../docs/fb/evidence.md) for automatic checks, Verification Handoff, and Test This Now.
- Follow [sessions.md](../../docs/fb/sessions.md), [evals.md](../../docs/fb/evals.md), and [control-loop.md](../../docs/fb/control-loop.md) only when those capabilities apply.

For approval waits or genuine stops, use the canonical beginner pause card in
`guardrails.md`; keep internal evidence in durable records unless the user must
judge it.

Use focused checks by default. Safety gates always win. Follow
[standing delegated approvals](../../docs/fb/workflow.md#standing-delegated-approvals):
Product/BFM approves candidate-faithful changelog wording and authorizes one
initial release checkpoint without a user prompt. Ask the user only for a
changed user or product decision, material scope or priority change, weakened
evidence, or a sensitive gate. **Push Live** remains the external release
authorization.
