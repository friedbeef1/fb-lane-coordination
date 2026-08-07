---
name: bfm
description: Use when Product/Captain must intake, sequence, execute, reconcile, or close FB handoffs.
---

# BFM

BFM is the navigator and executor of FB's repository-local product-delivery
graph. The graph is the map; workstream loops produce learning inside it; BFM
reconciles, prioritizes, and executes the approved graph; **Push Live** remains
the release boundary.

If the Build Brief opts into the [generic control loop](../../docs/fb/control-loop.md),
coordinate its capabilities inside the existing slice and repair budgets.
Preserve the baseline, require evidence for pairwise criteria and selected
gates, and stop isolated configuration candidates at exact Product approval.
Never self-promote configuration or consume **Push Live**.

Only the Product/BFM main task may continue with this skill. In any other main
workstream, treat `$bfm` or `/bfm` as intent to open Product/BFM: create or
update that workstream's Product handoff and redirect without onboarding,
coordination-record mutation, or execution. In a sidechat, route only to the
originating parent; if it cannot be reached, return a paste-ready handoff.

`$bfm` executes only in Product/BFM. Pinning never starts work, approves scope,
invokes `$bfm`, or authorizes release.

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
- Whenever permission is granted, run
  `node tools/fb-onboarding.cjs needs-reconciliation`. It decides from the
  canonical seven roles recorded in `workstreams`; an existing `reconciledAt`
  never overrides a missing role.
- When that helper reports `needsReconciliation: true`, follow the canonical
  native exact-project reconciliation in
  [project-coordination-setup](../project-coordination-setup/SKILL.md). Its
  planner uses `planRepositoryTaskInventory`, requires a proven-complete
  inventory for the verified project ID and canonical repository root, records
  every attempted native action, and finishes only through the strict
  `reconcile` route. The seven canonical keys remain `product` (Product/BFM),
  `user`, `business`, `design`, `tech`, `discovery`, and `bugs`. In inventory
  order that is product, user, business, design, tech, discovery, bugs; success
  requires all seven exact tasks present and pinned.

The user’s explicit Yes authorizes these seven user-owned Codex tasks; it does
not authorize source work. If project/task tools are unavailable or a complete
repository-scoped inventory cannot be established, say that automatic Codex
task creation is unavailable in the current environment, create nothing, and
provide paste-ready prompts for the known missing workstreams. If the inventory
itself is incomplete, provide all seven prompts and tell the user to create only
those not already present. Generate prompts with
`node tools/fb-onboarding.cjs prompt <workstream> <repository-root>`. Never
claim sidebar tasks were created or pinned without tool results. A partial failure
remains unreconciled; rerun detection later and create only what is still
missing.

After actionable workstream handoffs are ready for Product intake, `$bfm`
activates Product reconciliation. It does not authorize execution from ready
status. Read [the FB harness](../../docs/fb/README.md), then use bounded current
board truth, the handoff index, task-linked handoffs, and applicable current
workstream cards.

Apply the canonical [execution authority by conversation
context](../../docs/fb/guardrails.md#execution-authority-by-conversation-context).
Product/BFM parent work may execute approved scope; a sidechat requires a named,
one-use exception before mutation.

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

Routine BFM orientation reads genuine active state. Retrieve completed work on
demand when a predecessor, regression, shared surface, release, conflict, or
explicit user question requires it: follow the board archive, index, exact
handoff, QA artifact, changelog, and Git history. Do not rehydrate unrelated
completed narrative into every intake.

The one loop has six evidence-producing workstreams in canonical order: User,
Business, Design, Tech, Discovery, and Bugs, plus one Product/BFM control
centre. Each evidence-producing workstream runs a
mini-loop and records ready or blocked evidence in `docs/handoffs/<TASK-ID>.md`.
`$bfm` ignores `fb-workstream-handoff` artifacts because they are queued
planning requests, not Product delivery inputs.
Before intake or any source mutation, require the active canonical checkout.
Then call the runtime's complete intake semantics directly:

```js
const {
  freezeBfmIntake,
  renderBfmIntakeLedger,
} = require('./tools/fb-lane.cjs');
const intake = freezeBfmIntake(projectRoot);
const ledger = renderBfmIntakeLedger(intake);
```

Show the complete intake ledger before execution. It keeps User, Business,
Design, Tech, Discovery, and Bugs visible, then shows Product/BFM separately as
the control centre. It includes canonical handoffs, linked worktrees,
registered audit/former roots, board/index routes, workstream cards, active
locks, approval gates, external blockers, and task-rebind state. Missing or
contradictory inventory fails closed. Do not duplicate scanner or
checkout-discovery logic in this skill; the runtime owns those rules.

Product must disposition every candidate as **Include now**, **Blocked**, **Deferred**, **Duplicate**,
**Rejected**, or **Superseded** before source execution. A ready handoff is
ready for Product intake, not approval or execution authority. A disposition
does not auto-close a task: preserve all genuinely nonterminal visibility in
the board and handoff records. Record `None relevant` only when the
six-workstream scan/report requires a disposition.
Never report an empty Ready queue after a runtime intake failure. One selected
item must never conceal additional Ready work. Product must reconcile each
artifact into its authoritative home.
Planning work is not Ready when board, index, handoff, or workstream routing
failed to persist. Record it as blocked with its recovery path instead.
Stop on duplicate or contradictory ready-handoff errors. Product reconciles
duplicates, conflicts, and dependencies, then prioritizes and sequences only
**Include now** candidates. Product creates the Project Start Brief plus Build
Brief before BFM execution. Pause only for a changed decision, disputed
priority, sensitive boundary, conflict, or unclear scope. Do not duplicate
scanner selection rules in the skill. Integrate only relevant **Include now**
work and stop at **Ready to ship**. Only **Push Live** authorizes merge or
deployment.

- [Approval and first-project contract](../../docs/fb/start.md)
- [Six-workstream ledger, locks, sequencing, and return loop](../../docs/fb/workflow.md)
- [Test This Now, Verification Handoff, and evidence](../../docs/fb/evidence.md)
- [Hard stops, recovery, sidechat routing, and escalation](../../docs/fb/guardrails.md)
- [Session promotion, checkpoints, recall, review, and closeout](../../docs/fb/sessions.md)
- [Selected evals, authority, Quality Gaps, and revision closure](../../docs/fb/evals.md)
- [Normalized records, verification reuse, and efficiency metrics](../../docs/fb/records.md)
- [Graph-directed context and fallback](../../docs/fb/graph.md)

For approval waits or genuine stops, use the canonical beginner pause card in
`guardrails.md`; keep internal evidence in durable records unless the user must
judge it.

Stop before claim/edit/deploy/closeout when Product's **Include now** scope or
locks are unclear. Ready status does not attach approval to a handoff. After
`$bfm`, Product records the dispositioned Project Start Brief and Build Brief;
do not require those briefs to preexist invocation or request routine second
approval. Before source changes, require the board target's Goal Alignment
Session to match the reconciled briefs. Never invent an OKR merely to clear the
gate. Execute only **Include now**, unlocked work in the approved scope; close
only after the board, source, docs, evidence, and Git state agree or exceptions
are explicit.
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
and one concrete correction. Require the smallest **sufficient and causally
relevant** correction, not the smallest diff: it must address the diagnosed
cause, pass the original failed scenario, add or pass a focused regression, and
materially improve behavior or evidence without weakening the eval or moving
the failure elsewhere. Start a fresh repair worker rather than resuming
accumulated conversation context, then rerun only the failed proof. If there is
no concrete correction, no candidate change, or no readiness improvement, stop
after one no-progress cycle and classify it as a harness failure; do not broaden
diagnosis automatically.
Product direction is not automatically a user prompt. When a circuit breaker
has a concrete cause and the correction stays inside approved scope without a
changed user decision or safety/hard gate, Product/BFM owns one bounded
Product-directed recovery: make one consolidated correction, run the focused
proof, then the necessary final release pass if already authorized.
Ask the user only for a changed product outcome, scope, or priority; weakened
evidence; a safety or hard gate; no concrete progress; or failure of that one
recovery.
For durable work, promote the approved session in its linked worktree and keep
the Task Receipt, Brief Validation, reciprocal links, verification checkpoint,
Verification Handoff, and Test This Now aligned before submit or completed close.
For a v3 Full BFM run, also keep the Build Brief changelog expectation, matching
Task Receipt decision, candidate-bound entry evidence, and release-checkpoint
verification aligned. Do not report **Ready to ship** while that gate is
missing. Quick and Normal work remain exempt.
Follow [standing delegated approvals](../../docs/fb/workflow.md#standing-delegated-approvals).
Product/BFM approves candidate-faithful changelog wording and authorizes one
initial release checkpoint without a user prompt after focused checks pass.
Ask the user only for a changed user or product decision, material scope or
priority change, weakened evidence, or a sensitive gate. **Push Live** remains
the external release authorization.
Classify failures before revision, keep insufficient products at the exact
Checking quality-gap state, and close selected evals only with fresh rerun and
regression evidence. Never weaken a target or change authority automatically.
