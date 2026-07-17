---
name: fb-lane-coordination
description: Coordinates board-aware FB tasks, handoffs, staging submissions, and Product/BFM integration.
---

# FB task coordination

Read [the FB harness](../../docs/fb/README.md) before acting, then read the
board, index, linked handoff, and relevant workstream card. The harness owns
the durable policy:

Build For Me (BFM) is the execution mode used only after approval and explicit
`$bfm`. The beginner-facing mode messages and seven-field brief stay canonical
in the start guide.

Route clear isolated low-risk work to Normal Codex, approved bounded
corrections to one-record Quick BFM, and ambiguity or sensitive/material risk
to Full BFM. The canonical workflow owns progress, resource, reviewer,
verification, and stop budgets; do not reproduce or relax them here.
Use focused checks by default. Only a Product-owned handoff that explicitly
requests a release checkpoint makes a full validator eligible; sensitive work
keeps its immediate safety/approval gate.

- [Project Start Brief, lanes, and approval](../../docs/fb/start.md)
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
