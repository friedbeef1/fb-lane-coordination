---
name: bfm
description: Use when Product/Captain must sequence, execute, reconcile, or close approved FB handoffs.
---

# BFM

If the Build Brief opts into the [generic control loop](../../docs/fb/control-loop.md),
coordinate its capabilities inside the existing slice and repair budgets.
Preserve the baseline, require evidence for pairwise criteria and selected
gates, and stop isolated configuration candidates at exact Product approval.
Never self-promote configuration or consume **Push Live**.

## First-run sidebar onboarding

`$bfm` is the supported invocation. Treat an explicit `/bfm` from the user as
intent to invoke this skill when possible; do not document or implement it as a
second runtime command.

After bootstrap, inspect the clone-local receipt with
`node tools/fb-onboarding.cjs status`. Bootstrap already displayed the
permission question once. Do not ask it again on a later `$bfm`.

- On explicit **Yes**, record
  `node tools/fb-onboarding.cjs permission granted`.
- On explicit **No**, record
  `node tools/fb-onboarding.cjs permission declined` and continue without
  sidebar setup.
- When permission is pending and the current message is not the answer, do not
  infer consent or block ordinary `$bfm` work.
- When permission is granted and `reconciledAt` is absent, use Codex task tools
  only if they are available:
  1. Call `list_projects` and select the exact current repository project.
  2. Call `list_threads` using only arguments supported by the current Codex
     app, then filter by the exact project ID or repository path. If a search
     argument is rejected, retry without it. Page only while the tool exposes a
     reliable continuation cursor. If the repository-scoped inventory is
     truncated or cannot be proved complete, stop and use the manual fallback;
     never guess that a workstream is missing.
  3. Recognize exact current/legacy titles: Product/User or Product, Business,
     Design, Tech or Technical, Discovery, and Bugs, with or without an `FB`
     prefix. Do not treat a general task such as “Design homepage” as the
     Design workstream.
  4. Create only missing tasks with `create_thread`, using the exact project ID
     and a local environment—not a worktree. Generate each initial prompt with
     `node tools/fb-onboarding.cjs prompt <workstream> <repository-root>`, then
     title it `FB · <workstream>` with `set_thread_title`.
  5. Do not send follow-up work. Each created task acknowledges setup and then
     remains idle until the user asks it a concrete question.
  6. After all six are observed, record
     `node tools/fb-onboarding.cjs reconcile product,business,design,tech,discovery,bugs`.

The user’s explicit Yes authorizes these six user-owned Codex tasks; it does
not authorize source work. If project/task tools are unavailable or a complete
repository-scoped inventory cannot be established, say that automatic Codex
task creation is unavailable in the current environment, create nothing, and
provide paste-ready prompts for the known missing workstreams. If the inventory
itself is incomplete, provide all six prompts and tell the user to create only
those not already present. Generate prompts with
`node tools/fb-onboarding.cjs prompt <workstream> <repository-root>`. Never
claim sidebar tasks were created without tool results. A partial failure
remains unreconciled; rerun detection later and create only what is still
missing.

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

Run every safe, locally executable test or check automatically and record its
result before asking the user for verification. This includes available unit,
integration, end-to-end, build, lint, typecheck, package-parity, Git, browser,
simulator, deployment-source, and non-destructive smoke checks that fit the
approved scope and verification budget. Do not delegate routine checks or test
recovery to the user. Ask only for evidence that Codex genuinely cannot provide:
a physical-device action, unavailable credential or account access, payment or
provider-state approval, subjective Product judgment, destructive action, or
explicit live release approval.

For each known task question, call MCP `fb_project_context` before broad
orientation and open only its relevant cited sources. The graph routes to
authoritative records; it is not a source of truth. Use the board → index →
handoff → card fallback when the packet says fallback or is incomplete,
ambiguous, or contradictory.

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
The scanner fails closed on Ready-like orphan or off-home handoffs listed by
linked worktrees, `FB_HANDOFF_AUDIT_ROOTS`, or the clone-local
`.git/fb-handoff-audit-roots` registry. Never report an empty Ready queue after
that failure. The audit remains active even when another handoff was selected;
one selected item must never conceal additional Ready work. Product must
reconcile each artifact into its authoritative home.
Planning work is not Ready when board, index, handoff, or workstream routing
failed to persist. Record it as blocked with its recovery path instead.
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
- [Graph-directed context and fallback](../../docs/fb/graph.md)

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
BFM must automatically allocate one linked worktree for every independent,
non-overlapping source-changing slice. Give each eligible slice a **unique
approved child task ID** with inherited brief, dependencies, locks, and focused
proof. Invoke `fb_lane_claim` or
`node tools/fb-lane.cjs claim <task-id> <lane> <locked-files>` for each eligible
slice, reuse the exact clean match when returned, and record the resulting
**slice / branch / worktree mapping** before workers start. Create claims one at
a time from the primary checkout; after all claims are registered, start
independent workers concurrently. Planning-only work does not receive a
worktree. Dependent, overlapping, shared-file, sensitive, and
unresolved-decision slices stay sequential. BFM must not ask the user to create,
choose, organize, or manage worktrees.

Product/BFM integrates committed handoffs into its coordination checkout before
scanning because unmerged files inside another worktree are not automatically
visible. Merge and cleanup run from the primary checkout. Cleanup removes only
a registered, present, clean worktree whose branch is merged. If cleanup finds
a dirty, unmerged, missing, blocked, or deferred worktree, retain it, keep the
task and locks open, and record its owner plus next action. Never force-remove
or broadly prune worktrees.
Review the complete canonical candidate before generating package mirrors.
Use focused proof per slice, an integration check only when slices are
meaningfully combined, and broad validation only at a release checkpoint. If a
slice reveals unexpected complexity, keep completed slices and resplit only the
remaining work.
After a focused failure, create one fresh delta repair packet. Include the
failed criterion and proof, changed files, candidate reference, relevant decisions,
and one concrete correction. Start a fresh repair worker rather than resuming
accumulated conversation context, then rerun only the failed proof. If there is
no concrete correction, no candidate change, or no readiness improvement, stop
and classify it as a harness failure; do not broaden diagnosis automatically.
For durable work, promote the approved session in its linked worktree and keep
the Task Receipt, Brief Validation, reciprocal links, verification checkpoint,
Verification Handoff, and Test This Now aligned before submit or completed close.
For a v3 Full BFM run, also keep the Build Brief changelog expectation, matching
Task Receipt decision, candidate-bound entry evidence, and release-checkpoint
verification aligned. Do not report **Ready to ship** while that gate is
missing. Quick and Normal work remain exempt.
For a major user-visible release, Product must show the drafted entry to the
user and record explicit changelog approval before **Ready to ship**. Keep the
candidate at `Checking — changelog approval needed` until then; build approval
and **Push Live** do not substitute for this wording approval.
An unanswered request becomes a durable `Changelog approval: pending` gate.
Every later documentation or plugin-guidance review must surface it again with
the entry link until the user approves, rejects, or explicitly defers it.
Unrelated documentation may continue, but never silently clear the affected
release gate.
Classify failures before revision, keep insufficient products at the exact
Checking quality-gap state, and close selected evals only with fresh rerun and
regression evidence. Never weaken a target or change authority automatically.
