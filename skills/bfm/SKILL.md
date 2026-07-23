---
name: bfm
description: Use when Product/Captain must sequence, execute, reconcile, or close approved FB handoffs.
---

# BFM

After actionable workstream handoffs are ready, `$bfm` activates Product
reconciliation and authorizes execution of already-approved ready scope. Read
[the FB harness](../../docs/fb/README.md), then
board truth, the handoff index, task-linked handoffs, and applicable workstream
cards.

Use the [durable records contract](../../docs/fb/records.md): read only the
current linked context, keep each fact in one authoritative home, store full
verification in a QA artifact, reuse checks only with a matching fingerprint,
and use the compact BFM closeout shape. Select light or broader lane review from
risk and overlap; the user does not choose the internal path.

The one loop has six planning/evidence workstreams: Product/User (technical slug
`product`), Business, Design, Tech, Discovery, and Bugs. Each workstream runs a
mini-loop and records ready or blocked evidence in `docs/handoffs/<TASK-ID>.md`.
At intake, call the runtime's exported scanner semantics directly:

```js
const { scanWorkstreamHandoffs } = require('./tools/fb-lane.cjs');
const scan = scanWorkstreamHandoffs(projectRoot);
```

Use `scan.selected` in canonical order, report blocked entries, and record
`None relevant` only when the six-workstream scan/report requires a disposition.
If the scanner raises `HANDOFF_READINESS_RECONCILIATION_REQUIRED`, do not report
that no Ready handoffs exist. Product must reconcile the bounded legacy or
linked-worktree evidence into the authoritative checkout first. Off-home
handoffs are drift evidence, not automatically executable scope.
The canonical record wins over a stale off-home copy at the same relative path.
Across different records, a newer decision wins only when its canonical
`normalized-v1` handoff is explicitly approved and links the older record with
`Supersedes:`; never infer replacement from a date or filename alone.
If the scanner raises `HANDOFF_AUTHORITY_UNAVAILABLE`, stop intake until Git can
identify the primary checkout and linked worktrees; never treat the caller's
current worktree as authoritative by fallback.
Stop on duplicate or contradictory ready-handoff errors. Product reconciles
duplicates, conflicts, and dependencies, prioritizes, and creates the Project
Start Brief plus Build Brief before execution. Pause only for a changed
decision, disputed priority, sensitive boundary, conflict, or unclear scope.
Do not duplicate scanner selection rules in the skill. Integrate only
relevant ready work and stop at **Ready to ship**. Only **Push Live** authorizes
merge or deployment.

- [Approval and first-project contract](../../docs/fb/start.md)
- [Five-lane ledger, locks, sequencing, and return loop](../../docs/fb/workflow.md)
- [Test This Now, Verification Handoff, and evidence](../../docs/fb/evidence.md)
- [Hard stops, recovery, sidechat routing, and escalation](../../docs/fb/guardrails.md)
- [Session promotion, checkpoints, recall, review, and closeout](../../docs/fb/sessions.md)
- [Selected evals, authority, Quality Gaps, and revision closure](../../docs/fb/evals.md)
- [Normalized records, verification reuse, and efficiency metrics](../../docs/fb/records.md)

For approval waits or genuine stops, use the canonical beginner pause card in
`guardrails.md`; keep internal evidence in durable records unless the user must
judge it.

Stop before claim/edit/deploy/closeout when ready-scope approval or locks are
unclear. Pre-`$bfm` approval attaches to the ready scope and handoffs. After
`$bfm`, Product records the consolidated Project Start Brief and Build Brief;
do not require those briefs to preexist invocation or request routine second
approval. Before source changes, require the board target's Goal Alignment
Session to match the reconciled briefs. Never invent an OKR merely to clear the gate.
Execute only ready, unlocked work in the approved scope; close only after the
board, source, docs, evidence, and Git state agree or exceptions are explicit.
Apply private agent routing and the
canonical progress, resource, reviewer, verification, and stop budgets. Reuse a matching
linked worktree or place a new one under the primary checkout's `.worktrees`,
and keep `Current`, `Next ready`, and `External blocks` visible.
For closely related low-risk skill, documentation, template, or contract edits,
produce one bounded candidate and test their distinct behavior with one focused
structural contract. Documentation and coordination Quick work closes with zero
reviewers after focused checks pass; runtime and test Quick work requires
exactly one reviewer. Review only the complete candidate with one focused
verification pass; stop immediately when it passes.
Quick BFM is one bounded slice. Documentation/coordination normally targets 5
minutes and two total iterations; runtime/test normally targets 15 minutes and
three. Both permit one consolidated repair. Full BFM may run for hours by
coordinating many slices. Before implementation, create the smallest useful
dependency graph with outcome, surfaces/locks, dependencies, completion
criteria, focused check, and safety triggers per slice. Run independent,
non-overlapping slices through agents or subagents in parallel; keep dependent,
shared-file, sensitive, and unresolved-decision work sequential.
Review the complete canonical candidate before generating package mirrors.
Use focused proof per slice, an integration check only when slices are
meaningfully combined, and broad validation only at a release checkpoint. If a
slice reveals unexpected complexity, keep completed slices and resplit only the
remaining work.
For durable work, promote the approved session in its linked worktree and keep
the Task Receipt, Brief Validation, reciprocal links, verification checkpoint,
Verification Handoff, and Test This Now aligned before submit or completed close.
For a v3 Full BFM run, also keep the Build Brief changelog expectation, matching
Task Receipt decision, candidate-bound entry evidence, and release-checkpoint
verification aligned. Do not report **Ready to ship** while that gate is
missing. Quick and Normal work remain exempt.
Classify failures before revision, keep insufficient products at the exact
Checking quality-gap state, and close selected evals only with fresh rerun and
regression evidence. Never weaken a target or change authority automatically.
