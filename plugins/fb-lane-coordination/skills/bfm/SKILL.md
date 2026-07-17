---
name: bfm
description: Use when Product/Captain must sequence, execute, reconcile, or close approved FB handoffs.
---

# BFM

Build For Me (BFM) executes a Product build brief only after approval and
explicit `$bfm`; it is not the default for simple coding. Read [the FB
harness](../../docs/fb/README.md), then
board truth, the handoff index, task-linked handoffs, and applicable workstream
cards.

The one loop has six planning/evidence workstreams: Product/User (technical slug
`product`), Business, Design, Tech, Discovery, and Bugs. Each workstream runs a
mini-loop and records ready or blocked evidence in `docs/handoffs/<TASK-ID>.md`.
At intake, call the runtime's exported scanner semantics directly:

```js
const { scanWorkstreamHandoffs } = require('./tools/fb-lane.cjs');
const scan = scanWorkstreamHandoffs(projectRoot);
```

Use `scan.selected` in canonical order, report blocked entries and `None
relevant`, and stop on the scanner's duplicate or contradictory ready-handoff
error. Do not duplicate scanner selection rules in the skill. Integrate only
relevant ready work and stop at **Ready to ship**. Only **Push Live** authorizes
merge or deployment.

- [Approval and first-project contract](../../docs/fb/start.md)
- [Five-lane ledger, locks, sequencing, and return loop](../../docs/fb/workflow.md)
- [Test This Now, Verification Handoff, and evidence](../../docs/fb/evidence.md)
- [Hard stops, recovery, sidechat routing, and escalation](../../docs/fb/guardrails.md)
- [Session promotion, checkpoints, recall, review, and closeout](../../docs/fb/sessions.md)
- [Selected evals, authority, Quality Gaps, and revision closure](../../docs/fb/evals.md)

For approval waits or genuine stops, use the canonical beginner pause card in
`guardrails.md`; keep internal evidence in durable records unless the user must
judge it.

Stop before claim/edit/deploy/closeout when approval or locks are unclear.
Execute only ready, unlocked work in the approved scope; close only after the
board, source, docs, evidence, and Git state agree or exceptions are explicit.
Route clear isolated work to Normal Codex, an approved bounded correction to
one-record Quick BFM, and ambiguity or material risk to Full BFM. Apply the
canonical progress, resource, reviewer, verification, and stop budgets. Reuse a matching
linked worktree or place a new one under the primary checkout's `.worktrees`,
and keep `Current`, `Next ready`, and `External blocks` visible.
For closely related low-risk skill, documentation, template, or contract edits,
produce one bounded candidate and test their distinct behavior with one focused
structural contract. Review only the complete candidate, with at most one
reviewer and one focused verification pass; stop immediately when it passes.
For durable work, promote the approved session in its linked worktree and keep
the Task Receipt, Brief Validation, reciprocal links, verification checkpoint,
Verification Handoff, and Test This Now aligned before submit or completed close.
Classify failures before revision, keep insufficient products at the exact
Checking quality-gap state, and close selected evals only with fresh rerun and
regression evidence. Never weaken a target or change authority automatically.
