---
type: fb-lane-handoff
task: TASK-Q-2803
lane: fb-product
status: staging-qa
okr_fit: aligned
---

# TASK-Q-2803 - Persistent BFM objective checkpoints

## Goal Alignment Session

Product Goal: Preserve the approved end-to-end outcome across long-running BFM execution.
Workstream Goal: Make Product/BFM establish one objective, definition of done, and checkpoint before claims, then prevent shorthand continuation prompts from widening scope.
Lane OKR Fit: aligned
User Approval Needed: no - approved in the initiating thread.
Mini-loop Evidence: The MirrorCam Actual Clip run reached verified local implementation but could not complete commit/staging after an uninterruptible Git process; later shorthand prompts risked changing the active objective.
Evidence Against Product OKR: None identified; the rule uses the existing Goal Alignment Session and adds no new goal system.

## Scope

- Require one persistent BFM objective and definition of done for non-trivial runs.
- Use a runtime task goal when available; otherwise use the board or handoff.
- Use one checkpoint: `intake`, `scope/locks`, `implementation`, `verification`, `commit`, `staging evidence`, or `closeout`.
- Treat `proceed` and `all` as continuation unless the user explicitly names a new task.
- Freeze scope and record exact evidence when a blocker cannot be safely cleared.

## Out of Scope

- A new goal system, a CLI command, automation, eval tooling, `doctor` changes, plugin publishing, or any deploy.

## Product/BFM Closeout

Status: staging QA.
Actioned By: FB-Product / BFM.
Result: Canonical BFM/Product guidance, root/package bootstrap guidance, templates, durable docs, and the Product revisit card now carry the single objective/checkpoint rule.
Evidence: `node --check` passed for root/package CLI; root/package CLI parity passed; `node tools/fb-lane.test.cjs` passed 16 checks; a fresh Codex bootstrap emitted the rule in `AGENTS.md` and `.codex/rules.md`; `git diff --check` passed; `node tools/fb-lane.cjs doctor` reported only the expected uncommitted-worktree gate.
Remaining: Commit and Product review of branch `codex/bfm-objective-checkpoints`; no deploy or plugin publish.
Closeout Note: TASK-Q-2803 is delivered and verification-passed locally; Product review remains the merge gate.
Loop Learning: Feedback captured: issue found; Repeated pattern?: yes; Tooling needed?: propose guardrail; Product approval needed?: no.
