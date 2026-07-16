---
type: fb-lane-handoff
task: TASK-022
lane: fb-product
status: implemented
okr_fit: aligned
fb_harness: v2
Review state: completed build
---

# TASK-022 — Repository-Local Session Ledger

## Goal Alignment Session

Product Goal: Reduce the user's hands-on coordination between an approved brief and a reviewable result.
Workstream Goal: Give durable Codex work one resumable repository-local session record connected to the board, handoff, Git evidence, and verification.
Lane OKR Fit: aligned
User Approval Needed: no
Mini-loop Evidence: Commit `9a55314` passed mirrored 45-check CLI suites, mirrored 15-check session suites, recovery, syntax, parity, validator, doctor Ready, scoped whitespace, creator-commerce bootstrap, and existing-project migration in a clean candidate copy.
Evidence Against Product OKR: None identified.

## Project Start Brief

What you asked for: Implement the full repository-local session ledger before the dependent eval loop.
Your decisions: Full ledger now; automatic validated checkpoint pushes on non-default branches; planning/review require a session branch; execution requires a linked worktree; TASK-023 follows only after this task's gate.
Assumptions to confirm: None — the implementation plan is explicitly approved.
What FB will build: Seven session commands, atomic shared live state, curated committed recaps, Task Receipts, Brief Validation, failure evidence, recall/review, bootstrap and doctor integration.
Out of scope: Transcripts, hosted services, external capture, dashboards, release, publication, deployment, merge, and consumer-repository changes.
Success looks like: Twelve concurrent sessions remain safe, completed reviewable work cannot close without complete evidence, and root/package/bootstrap behavior stays aligned.

## Build Brief

- Implement `tools/fb-session.cjs` and its packaged mirror as the cohesive session subsystem.
- Dispatch the seven approved session commands from the existing CLI.
- Keep clone-local live records atomic under the Git common directory; keep durable recaps under `docs/sessions/`.
- Enforce branch, worktree, approval, lock, checkpoint, closeout, privacy, Task Receipt, Brief Validation, Verification Handoff, and Test This Now contracts.
- Make `claim` and `quick` use worktrees by default while preserving the compatibility flag.
- Add the sixth harness page, bootstrap migration, doctor checks, mirrored tests, and full local verification.

## Lane Ledger

- FB-Lane: current board, index, canonical harness, and task locking used; no separate lane handoff.
- FB-Product: approved plan and this durable Build Brief.
- FB-Tech: Product-launched implementation and verification owner.
- FB-Design: no relevant handoff; no visual application surface.
- FB-Business: no relevant handoff; no pricing, positioning, or public claim change.

## Verification Handoff

Candidate: `codex/fb-session-ledger` at implementation commit `9a55314`.
Test plan: [approved plan](../superpowers/plans/2026-07-16-fb-session-ledger-and-eval-loop.md)
Commands and results: `node tools/fb-lane.test.cjs` and packaged mirror passed 45 checks each; `node tools/fb-session.test.cjs` and packaged mirror passed 15 checks each; recovery contract, nine syntax checks, source/test/skill/six-page parity, validator, doctor Ready, task-diff whitespace, creator-commerce bootstrap, and existing-project migration passed.
Environment: isolated linked worktree plus a clean temporary Git copy of the frozen candidate; local bare remotes only.
Runnable evidence links: [root session module](../../tools/fb-session.cjs), [focused tests](../../tools/fb-session.test.cjs), and [session guide](../fb/sessions.md).
Manual pass criteria: Product branch-diff review confirms the exact seven-command interface, privacy boundary, checkpoint/closeout evidence gates, bootstrap preservation, and compatibility flag.
Recovery attempted: corrected the packaged focused-test repository-root resolver after its first clean-copy failure; replaced two invalid aggregate-runner wrappers without changing candidate behavior.
Known limits: local CLI, Git, bootstrap, and documentation behavior only; no hosted capture, provider, release, publication, deployment, merge, plugin install, or consumer migration was exercised.
Next Product/BFM recovery action: perform the task-scoped branch-diff review; keep TASK-023 blocked until that review accepts this candidate.

## Implementation Summary

- Added the exact seven-command `session` interface with safe ID precedence, read-only intake, mode/lane gates, idempotence, stale-state computation, and closed-ID protection.
- Added mirrored atomic common-Git session registries, bounded dead-process lock recovery, cross-worktree state, normalized prefix-aware locks, curated recaps, validated checkpoint pushes, deterministic recall, stdout/clipboard review, and evidence-aware closeout.
- Enforced active execution-session evidence on `submit`; made `claim` and `quick` use linked worktrees by default with `--no-worktree` compatibility.
- Added the mirrored sixth harness page, safe bootstrap route, doctor/validator checks, setup/removal guidance, Product/BFM skill routes, and root/package test coverage.

## Failure Evidence

Failure: The first packaged focused-suite run could not resolve canonical parity paths.
Observed: The test looked for `plugins/fb-lane-coordination/plugins/fb-lane-coordination/docs/fb/README.md` and exited with `ENOENT`.
Cause: The mirrored test treated its plugin directory as the repository root.
Recovery attempted: Added packaged-copy root detection, synchronized the mirror, and reran the packaged focused suite.
Result: Packaged focused suite passed all 15 checks; the complete clean-copy gate later passed.
Reusable lesson: Mirrored tests that compare repository-level surfaces must resolve canonical root differently from runtime modules that intentionally stay package-local.

## Task Receipt

Approved brief and decisions: Implemented the approved TASK-022 brief only, including automatic validated checkpoint pushes, non-default planning/review branches, linked-worktree execution, and no TASK-023 work.
Confirmed assumptions and approved scope changes: No unresolved assumption or scope change; local bare remotes represented push behavior and external capture remained excluded.
Branch, source commits, and changed surfaces: `codex/fb-session-ledger`; source commit `9a55314`; mirrored session/CLI/test modules, six-page harness, validator/doctor, setup, templates, skills, and active public guidance changed.
Checks, failures, recovery, and results: Strict RED-to-GREEN evidence, mirrored 45/45 and 15/15 suites, recovery, syntax/parity, validator, doctor Ready, whitespace, creator-commerce, migration, and self-review passed; the packaged-path test failure was repaired and rerun.
Review state, direct links, limits, and external gates: completed build; direct source/test/guide links above; local-only evidence; Product task review remains the external gate before TASK-023.
Repository state: Two logical local commits are planned; no push, merge, release, publication, deployment, plugin install, or consumer-repository change is authorized or performed.
Remaining owner and action: FB-Product/BFM reviews the TASK-022 branch diff and either accepts the gate or records an actionable blocker; TASK-023 remains blocked meanwhile.

## Brief Validation

Status: pass
Satisfied criteria and evidence: Every interface, state, safety, evidence, concurrency, checkpoint, recall/review, bootstrap, parity, doctor, and local-smoke criterion in the approved brief maps to passing focused or full-gate evidence.
Missing criteria: None for TASK-022 implementation and local verification.
Reason: None; remaining Product review is the already-declared sequence gate, not a missing implementation criterion.
Owner: FB-Product/BFM.
Next action: Complete task-scoped review of commits `9a55314` and the coordination closeout commit.
Approved scope-change references: None.

## Test This Now

- **Outcome type:** Completed repository-local CLI and harness build
- **Direct links:** [Root session module](../../tools/fb-session.cjs), [focused tests](../../tools/fb-session.test.cjs), and [session guide](../fb/sessions.md)
- **Exact steps and expectations:**
  1. Open the focused tests and confirm they cover intake, gates, concurrency, checkpoint pushes, privacy, closeout, recall/review, bootstrap, and package behavior.
  2. Open the root and packaged session modules and confirm they are byte-identical.
  3. Review commit `9a55314` and confirm no TASK-023, release, provider, deployment, merge, or consumer-repository surface changed.
- **Pass criteria:** The exact seven-command contract and safety/evidence boundaries match the approved brief, mirrors remain aligned, and the branch diff stays inside TASK-022.
- **Known limits:** Local CLI/Git and documentation evidence only; no hosted service or deployed UI exists for this task.
- **Failure-report format:** Finding severity; exact file and line; observed behavior; expected brief clause; reproduction command or fixture.

## Delivery Status

Implementation is present in the expected mirrored modules, tests, harness, setup, templates, skills, and validator/doctor integration.

## Verification Evidence

The complete clean-copy gate ended with `TASK_022_FULL_GATE_OK`; mirrored suites passed 45/45 and 15/15, validator passed, and doctor reported Ready.

## Remaining Gates

Product task-scoped branch-diff review only. TASK-023 remains blocked. Live deploy, release, publication, merge, plugin installation, and consumer migration remain unauthorized.

## Product Status Recommendation

lane-verification-passed

Closeout note - TASK-022: lane-verification-passed. Delivered: repository-local session ledger, evidence gates, six-page bootstrap, default worktrees, and mirrored validation. Evidence: commits `9a55314` plus the coordination closeout commit, complete clean-copy gate, and self-review. Remaining: Product task review; TASK-023 stays blocked. Handoff: docs/handoffs/TASK-022.md.

## Loop Learning

Feedback captured: repeated context reconstruction and manual test-plan prompting.
Repeated pattern?: yes
Tooling needed?: propose automation — explicitly approved as the session ledger.
Product approval needed?: no
