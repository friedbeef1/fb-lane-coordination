---
name: fb-lane-coordination
description: Coordinates board-aware FB tasks, handoffs, staging submissions, and Product/BFM integration.
---

# FB task coordination

Read [the FB harness](../../docs/fb/README.md) before acting, then read the
board, index, linked handoff, and relevant workstream card. The harness owns
the durable policy:

The public path starts in whichever of the six planning/evidence workstreams
matches the question: Product/User (technical slug
`product`), Business, Design, Tech, Discovery, and Bugs. Each relevant
workstream runs a mini-loop and records a ready or blocked
`docs/handoffs/<TASK-ID>.md`. Product/User applies only to user needs, outcomes,
requirements, feedback, acceptance criteria, and product priorities; it is not
the universal intake coordinator. Inactive workstreams need no manufactured
work or `None relevant` entry except in a six-workstream scan/report. After
actionable handoffs are ready, `$bfm` activates Product reconciliation and
execution of already-approved scope. Delivery stops at **Ready to
ship**. Only **Push Live** authorizes merge or deployment.

Keep agent classification private: FB selects internal routing rather than
asking users to choose a mode. The canonical workflow owns progress, resource, reviewer,
verification, and stop budgets; do not reproduce or relax them here.
Use focused checks by default. Only a Product-owned handoff that explicitly
requests a release checkpoint makes a full validator eligible; sensitive work
keeps its immediate safety/approval gate.
Quick documentation and coordination work needs no independent reviewer after
its focused checks pass. Quick runtime and test work requires exactly one;
sensitive or ambiguous work remains Full BFM. Keep this routing private.
Quick work uses the current owning agent, one consolidated repair at most, and
the surface-specific 5- or 15-minute budget in the canonical workflow.

- [Workstream-first start and `$bfm` reconciliation](../../docs/fb/start.md)
- [Source hierarchy, locks, BFM, and closeout](../../docs/fb/workflow.md)
- [Test This Now and Verification Handoff](../../docs/fb/evidence.md)
- [Hard stops, parent-only sidechats, recovery, and Loop Learning](../../docs/fb/guardrails.md)
- [Durable sessions, checkpoints, recall, review, and closeout](../../docs/fb/sessions.md)
- [Eval selection, authority, Quality Gaps, and revision closure](../../docs/fb/evals.md)

For approval waits or genuine stops, use the canonical beginner pause card in
`guardrails.md`; keep internal evidence in durable records unless the user must
judge it.

Use `node tools/fb-lane.cjs status` for state. Claims, submissions, merges, and
source-changing work are BFM actions after Product clears the approval and lock
gates. For a durable task, intake is read-only and Product/BFM promotes the
approved session; submit and completed closeout require the reciprocal receipt,
validation, verification, and Test This Now evidence. Keep technical command
names unchanged; do not reproduce the manual here.
Selected evals start from the approved Build Brief. Keep mechanical evidence
separate from judgment, never weaken a quality target, and never self-promote
authority.
