# Safety, recovery, and learning

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

The time limits apply per planned slice, not to the whole product outcome.
Quick BFM is one slice: documentation/coordination normally targets 5 minutes,
two total iterations, or one consolidated repair; runtime/test normally targets
15 minutes, three iterations, or one consolidated repair. Runtime/test adds one
reviewer and documentation/coordination adds none. Full BFM may run for hours by
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
complete candidate before review. Quick documentation and coordination work
uses zero reviewers after its focused checks pass; Quick runtime and test work
requires exactly one reviewer. Quick BFM permits one focused verification pass
and one consolidated repair.
Do not add another reviewer, narration loop,
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
