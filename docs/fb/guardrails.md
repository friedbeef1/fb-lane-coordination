# Safety, recovery, and learning

The graph is the product-delivery map. Workstream loops investigate and improve
parts of it. Product/BFM navigates the graph, and Codex executes its approved
sequence.

Default execution uses focused proof per slice, one consolidated behavioral
repair maximum across the candidate, one whole-candidate review, and one final
release checkpoint. Do not create separate review or re-review loops for
individual slices. Safety, sensitive-operation, authority, worktree/lock,
changelog, and **Push Live** gates remain unchanged.

The [generic control loop](control-loop.md) inherits every safety, approval,
repair, time, and release boundary here. Routing cannot bypass a safety trigger;
diagnosis cannot create extra repair loops; a candidate cannot promote itself.

Use the risk-triggered review and event-driven health-check rules in
[records.md](records.md). Sensitive, cross-lane, unclear-scope, and release
triggers always override the light path.

## Hard boundaries

Do not self-approve new scope or OKRs, live deploys, secrets, payments,
auth/privacy changes, destructive data, provider-state changes, unclear goals,
failed evidence needing risk acceptance, lock conflicts, or unresolved dirt.
Approval autonomy is phased and user-approved:

- **Phase 1 — Shadow Approval:** ask the user for every approval and record
  `Would self-approve: yes/no` with a reason; no approval is automatic.
- **Phase 2 — bounded routine autonomy:** after one day or three matching safe
  decisions, Product/BFM may self-approve only the documented, repeated,
  low-risk decision type. Continue only while it stays within the approved
  scope, known pattern, locks, and evidence requirements.
- **Phase 3 — trusted routine autonomy:** after five safe self-approvals with
  no rollback, stale dirt, or hidden gate, Product/BFM may continue Phase 2
  work without a per-decision prompt. New scope, risk, or decision types still
  require user approval.

The user approves every phase transition. Any material miss, rollback, stale
or unresolved dirt, hidden gate, failed evidence, or changed risk immediately
downshifts to Phase 1 until the user reviews and re-approves a phase.

After a user approves a safe Product/BFM task, continue routine diagnosis,
implementation, verification, board/handoff updates, commit, staging, and
cleanup until solved or explicitly blocked. Stop for the hard boundaries above,
an unclear goal, failed evidence needing risk acceptance, a lock conflict, or
an explicit pause; report after closeout rather than at each routine step.

## Least-privilege workspace access

Default to approval-based access and the permissions already granted to the
active workspace. Before mutation, confirm that the authoritative checkout is
the active workspace; route to it rather than broadening access around a wrong
or stale checkout.

Never ask the user to enable **Full access** merely to avoid or suppress routine
permission prompts. Use ordinary workspace permissions first. When a required
operation genuinely crosses the writable workspace, network, device, or
provider boundary, request one narrowly scoped escalation for that operation
and explain the outcome it enables. Do not request a broader persistent rule
when a smaller scope is sufficient.

A host-level permission prompt is separate from FB governance and does not
replace Product/BFM goal approval, board claims, file locks, evidence gates,
provider boundaries, or **Push Live**. Likewise, an FB approval never implies
operating-system or Codex host access that was not granted.

Never edit outside declared locks, commit directly to main, overwrite another
lane's work, or treat a worktree as a substitute for board awareness. Keep docs
commits separate from code/styling when practical. For normal lane chats,
`PLEASE IMPLEMENT THIS PLAN` requires confirmation of a Product/BFM handoff or
an explicit one-off execution exception.

Normal workstream chats may write markdown plans/handoffs but not application
source, branches, commits, submissions, merges, deployments, or provider state.
An active `.codex/current_task.md` unlocks writes only for the declared locked
files in a Product-launched BFM run. Micro-edits may use the project quick-task
route. Run focused tests before submission; if a branch is rejected, preserve
the evidence and mark it `Blocked` or `Rejected` on the board. Fix only on its
feature branch, or close it and release locks when permanently rejected. Verify
staging before requesting production promotion, and adapt to another lane’s
change rather than reverting it.

### Cross-workstream queue boundary

An explicit user request may route a planning artifact between two different
main workstreams. It uses `type: fb-workstream-handoff` and `status: queued`.
The destination receives `<Source> handoff queued for <Destination> — planning only; waiting for you. Open: <handoff link>`
and remains idle until the user explicitly continues it. Arrival never grants
source, Git, board, provider, or release authority. The destination may produce
planning and evidence; delivery requires a separate Product-ready handoff, and
`$bfm` ignores the queued artifact. If task tools are unavailable, return a
paste-ready notice. Sidechats remain parent-only.

A project may define `hooks.preflight` in `.fb-lane.json`. FB runs it before
claim or quick-task mutation and surfaces the exact project command on failure.
The hook is optional and project-owned: FB assumes no global Node version,
package manager, provider, or runtime. A failed preflight stops before board or
worktree mutation.

A project may also define `hooks.focusedTest` for its smallest relevant
runtime proof. Focused checks default to 5 minutes;
`timeouts.focusedTestMinutes` may raise the bound to at most 10 minutes.
Without that hook, FB uses `npm test` under the same bound. A timeout does not
loop or weaken the check; it reclassifies the candidate Full BFM.

## Canonical beginner pause card

Use one visible card whenever FB must pause for safe recovery, a lock conflict,
missing review access, or an external-only action. Keep the explanation about
the user’s outcome and the next safe move:

```text
Paused here

Why:
What FB already tried:
What can continue safely:
What I need from you:
Next action and owner:
What happens after:
```

An approval wait uses the same fields but changes the title to
`Waiting for your approval`; it is never `Blocked`. Reserve `Blocked` for a genuine
inability to continue. Product/BFM owns safe recovery and lock resolution
before asking the user to act. Ask the user only for a real approval or an
external-only manual, device, account, or provider action.

Keep internal evidence in durable records. This includes commands, retries,
hashes, lock details, and eval metadata. Hide them from the beginner update
unless the user must judge that evidence or needs one detail to complete the
requested action.

## Sidechats and recovery

### Execution authority by conversation context

| Context | Default authority |
|---|---|
| Product/BFM parent thread | Sequence and execute approved work |
| Workstream parent thread | Planning and Product/BFM handoff only |
| Side conversation | Discussion and paste-ready parent handoff only |
| Confirmed one-off sidechat exception | Execute only the explicitly confirmed task |

`Proceed`, `do it`, `merge it`, and `install it` do not authorize sidechat
mutation. Before changing files, Git state, deployments, installations,
provider state, or coordination records from a sidechat, ask:

> This is a side conversation. Do you want me to execute [named scope] here as
> a one-off exception rather than hand it to the parent Product/BFM thread?

Do not mutate anything until the user explicitly confirms that named scope.
The exception is consumed after that task; a later sidechat task requires a new
confirmation. Read-only inspection, explanation, and paste-ready handoffs
remain allowed.

The exception never bypasses live-release, provider-state, privacy, payment,
destructive-operation, lock-conflict, or physical-device gates. If fresh-task
evidence shows this guidance repeatedly fails, Product may propose separate
mechanical enforcement; this contract does not add runtime permission state.

Sidechats are discussion/planning spaces. They hand off only to their
originating parent main thread, never to a guessed destination. If the parent
is unavailable, return the paste-ready handoff to the user. Product/BFM owns
board updates, durable records, source changes, validation, and closeout. Use
the project’s `docs/sidechat-parent-thread-routing.md` when available.

A sidechat is not source of truth until Product/BFM records it on the board, in
a relevant handoff, or in durable docs. Keep quick clarifications light: do not
create a command, dashboard, doctor expansion, source behavior, or ceremony.
For Product/BFM, hand over only a decision summary, scope/out-of-scope,
recommended lane, likely files/docs, acceptance criteria, gates/risks, and an
exact instruction.

When Git, reads, worktrees, or runners repeatedly stall or look implausible,
run bounded workspace-health checks: documented free-space threshold (15 GiB by
default), File Provider/synchronized-storage ancestry where relevant, stable
double-read hashes, and 15-second bounded Git status/diff probes. After the
second consecutive failure in the same checkout, use clean-clone recovery; do
not copy damaged Git/index/worktree metadata or treat manual object plumbing or
an unbounded temporary runner as passing evidence. If checks hang, record a
`pending-gate` or `blocked` result with evidence and return it to BFM sequencing.
After five failed debug retries, label the board task `Blocked - Debug Retry
Limit Exceeded`, attach current logs, and notify the user rather than loop.

## Efficiency stop predicates

### Visible-progress SOP

During active work, give the user a concrete progress update at least every 60
seconds. If two minutes pass without a completed checkpoint, name the exact
failing check, blocker, or current gate. Stop or narrow any work that produces
no material change in source, evidence, test state, blocker recovery, or an
approved decision. Never leave the user watching unexplained work.

FB uses three explicit verification levels: a focused check for the changed
surface, an immediate safety gate for sensitive work, and a release checkpoint.
The full validator is eligible only when a Product-owned handoff explicitly
requests a release checkpoint. Integration, staging, owner transfer, review,
or the existence of a handoff file do not request one. Preserve every sensitive
trigger and its immediate safety/approval gate.

## Trustworthy recovery reporting

Routine recovery exposes exactly three plain-language states to the user:

1. **Ready** — the exact real project snapshot passed the declared checks with
   the same final command, and no later edit, mutation, or evidence change has
   invalidated that result.
2. **Safely paused** — nothing unsafe changed; Product/BFM is repairing or
   validating internal records automatically. A fixture-only pass is reported
   exactly as **candidate checks passed; exact project proof pending**. A later
   failure or any change after a pass supersedes the earlier claim and returns
   the visible state to **Safely paused** until the exact snapshot passes again.
3. **Need your decision** — a genuine product, destructive, provider, privacy,
   payment, authority, or release choice requires the user. State the decision
   in plain language and do not use this state for routine recoverable work.

Receipt names, quarantine state, hashes, canonical-drift codes, and fail-closed
reasons remain complete in diagnostics and durable QA. They are not the
headline narrative and the user does not need to interpret them while
Product/BFM has a safe bounded recovery. Do not say `green`, `ready`, `fixed`,
`verified`, or equivalent consumer-success wording before the exact real
project snapshot reaches **Ready**. Preserve every fail-closed check; this
contract changes reporting and completion semantics only.

### Product-directed circuit-breaker recovery

Product direction is not automatically a user prompt. A circuit breaker stops
automatic workers and repeated gates; it does not return routine recovery
ownership to the user. Product/BFM may authorize one bounded Product-directed
recovery when the failure has a concrete cause, the correction stays inside
approved scope, and no user decision or safety/hard gate changes. Make one
consolidated correction, run the focused proof, then run the necessary final
release pass when that checkpoint was already approved.

Ask the user only when recovery changes the product outcome, scope, or priority;
weakens acceptance or evidence; crosses a safety or hard gate; has no concrete
correction or material progress; or the one Product-directed recovery fails.
There is at most one such recovery per checkpoint.

The time limits apply per planned slice, not to the whole product outcome.
Quick BFM is one slice: documentation/coordination normally targets 5 minutes
and two total iterations; runtime/test normally targets 15 minutes and three
iterations. Both remain within the one consolidated behavioral repair maximum.
No slice gets its own review loop; the combined candidate gets one
whole-candidate review. Full BFM may run for hours by
coordinating multiple slices. It may use agents or subagents concurrently only
for independent, non-overlapping locks; dependencies, shared files, sensitive
work, and unresolved decisions remain sequential. All slices stop on success, a
repeated broad validator, one no-progress cycle, or an exceeded declared slice
budget. Replan or resplit unfinished work without invalidating completed slices.
A release checkpoint permits one initial full
pass and, only after that pass fails and a consolidated material repair batch,
one final pass. A third repair, no progress, an unjustified repeated broad gate,
or a final failure blocks for Product direction. Authoritative token and cost
ceilings also stop a run when the provider supplies those values; unavailable
usage is recorded as `unavailable`, not estimated. Product/BFM then records one
decision: correct an invalid process/test, narrow the claim to required
evidence, reclassify Full BFM, or mark a genuine Product/external blocker. It
does not automatically add another reviewer, worker, durable record, or broad
gate.

### Standing delegated approvals

Under the user's standing delegation, Product/BFM approves a candidate-faithful
changelog and authorizes one initial release checkpoint without a user prompt
after focused checks and candidate-bound changelog verification pass. Product/BFM
records both approvals with the handoff, candidate, and date. Ask the user only
for a changed user or product decision, material scope or priority change,
weakened evidence, or a sensitive gate. **Push Live** remains the only merge,
publication, installation, and deployment authorization. The standing
delegation does not weaken the repair budget or permit repeated broad gates.

Package mirrors are generated only after the complete canonical candidate and
its required review pass. They come from canonical root sources declared in
`tools/fb-package-manifest.json`. Use `node tools/fb-package-sync.cjs --write`
to generate and `--check` to detect drift. Fix a broken mirror at its canonical
source or manifest, never by independently editing generated package files.

## Low-ceremony execution rule

For closely related, low-risk documentation, skill, template, or contract
changes, make one bounded candidate rather than assigning sibling changes
sequentially. Do not require each sibling to fail and pass independently when
one focused structural contract can prove their distinct behavior. Prepare the
complete candidate before review. Quick documentation, coordination, runtime,
and test slices use focused proof without their own review ceremony. The
complete candidate gets the single whole-candidate review and permits one
consolidated behavioral repair.
Do not add another review, narration loop,
mirror-by-mirror check, or broad validator after the success predicates pass.
Report progress only when source, evidence, test state, blocker recovery, or an
approved decision materially changes. A second Quick repair, one no-progress
cycle, one repeated broad gate, or the surface-specific time/iteration limit
triggers Full-BFM reconsideration rather than more automatic work.
Every permitted repair receives a fresh delta repair packet. It contains the
failed criterion, changed files, relevant decisions, focused proof output, and
one concrete correction. Never forward accumulated conversation history. If a
concrete correction is unavailable, do not start the repair. No candidate
change or no readiness improvement is a harness failure and stops that repair
path rather than widening it.
For multi-slice Full BFM, focused checks prove each slice, integration checks
prove meaningful combinations, and broad validation waits for the release
checkpoint. Parallel execution is an optimization derived from the dependency
graph, never a reason to invent slices or accept overlapping locks.

## Loop Learning and small escalation

Project-local recursive learning follows the stricter bounded lifecycle in
[learning.md](learning.md): relevant lessons only, one revision, immediate
safety rejection, and no reset of Quick or Full repair budgets.

Closeout records `Loop Learning`: feedback captured, whether the pattern
repeated, tooling needed (`none`, `propose guardrail`, `propose automation`, or
`propose eval`), and whether Product approval is needed. For repeated friction,
propose one small guardrail with observed pattern, recommendation, cost,
benefit, affected files/rules, and approval needed. Skip one-off or low-impact
issues; do not silently change process.

`propose eval` starts with a small Markdown scorecard under `docs/evals/`.
New records follow [the canonical eval lifecycle](evals.md) and start shadow.
Nothing self-promotes. Promotion to blocking or mechanical requires explicit
Product approval evidence; no new blocking promotion occurs during TASK-023.
Do not add an eval runner, semantic judge, dashboard, numeric scoring, CI job,
hosted capture, external integration, or automatic promotion.
