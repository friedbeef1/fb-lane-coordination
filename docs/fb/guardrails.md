# Safety, recovery, and learning

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
