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

Candidate: `codex/fb-session-ledger` at base implementation `9a55314`, coordination `a5b0a7e`, first repair `38710ca`, and the second review-repair commit at branch HEAD.
Test plan: [approved plan](../superpowers/plans/2026-07-16-fb-session-ledger-and-eval-loop.md)
Commands and results: `node tools/fb-lane.test.cjs` and packaged mirror passed 45 checks each; `node tools/fb-session.test.cjs` and packaged mirror passed 23 checks each; recovery contract, nine syntax checks, source/test/skill/six-page parity, validator, doctor Ready, task-diff whitespace, creator-commerce bootstrap, and existing-project migration passed with `TASK_022_SECOND_REPAIR_FULL_GATE_OK`.
Environment: isolated linked worktree plus a clean temporary Git copy of the frozen candidate; local bare remotes only.
Runnable evidence links: [root session module](../../tools/fb-session.cjs), [focused tests](../../tools/fb-session.test.cjs), and [session guide](../fb/sessions.md).
Manual pass criteria: Product branch-diff review confirms the exact seven-command interface, privacy boundary, checkpoint/closeout evidence gates, bootstrap preservation, and compatibility flag.
Recovery attempted: corrected the original packaged focused-test root resolver; repaired every Critical/Important review finding regression-first; corrected two repair-fixture assertions that used a blank-line section boundary and an obsolete managed-route marker, then reran the authoritative gate.
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

Failure: Product review found completed-evidence bypasses, broad unsafe recall, non-resumable checkpoint pushes, stale submit authority, shallow worktree tests, incomplete doctor resolution, truncated recall SHAs, and invisible clipboard failure.
Observed: The first candidate could accept recap fallback/generated placeholders, search ordinary or unsafe Markdown, lose commit-before-push progress, trust stale execution JSON, and report review success when clipboard delivery failed.
Cause: Structural validators and fixtures proved happy paths but did not re-read every canonical authority or simulate the failure boundaries deeply enough.
Recovery attempted: Added one focused regression before each runtime repair, preserved the expected RED, implemented the smallest mirrored change, and reran focused GREEN before continuing.
Result: All review regressions pass in both 19-check focused suites; both 45-check legacy suites and the complete clean-copy repair gate pass.
Reusable lesson: Evidence gates must validate the authoritative record at the final mutation boundary, and recovery/privacy tests must reach the exact unsafe operation rather than accept source-pattern or earlier-gate proxies.

Failure: The second Product review found a submit TOCTOU window, stale completed-close authority, cross-block failure-field masking, and an overbroad `example` placeholder rule.
Observed: A pre-submit hook could change authority after the initial check and the CLI still committed/pushed; completed execution close ignored current board drift; one complete Failure block satisfied an incomplete second block; and legitimate evidence containing lowercase `example` failed while `1. Example` passed.
Cause: Authority was read only before long-running work, completed close reused evidence without execution revalidation, structured failure fields were searched globally, and placeholder matching ignored field context.
Recovery attempted: Added one public-behavior regression per boundary, recorded each expected RED, repaired only the final authority/block/field boundaries, mirrored the changes, and reran focused plus complete gates.
Result: CLI and MCP reject hook-induced authority drift before board mutation/commit/push; completed close preserves active state on authority drift; every Failure block validates independently; legitimate prose passes and numbered example/TODO/TBD/prompt placeholders fail. Mirrored focused suites pass 23/23 and the complete gate passes.
Reusable lesson: Revalidate mutable authority at the last irreversible boundary, and scope structural evidence checks to the individual record and field being judged.

## Task Receipt

Approved brief and decisions: Implemented the approved TASK-022 brief only, including automatic validated checkpoint pushes, non-default planning/review branches, linked-worktree execution, and no TASK-023 work.
Confirmed assumptions and approved scope changes: No unresolved assumption or scope change; local bare remotes represented push behavior and external capture remained excluded.
Branch, source commits, and changed surfaces: `codex/fb-session-ledger`; base `9a55314`, coordination `a5b0a7e`, first repair `38710ca`, and second repair at branch HEAD; mirrored session/CLI/test modules, six-page harness, active guidance, and TASK-022 evidence changed.
Checks, failures, recovery, and results: Strict RED-to-GREEN repair evidence, mirrored 45/45 and 23/23 suites, recovery, syntax/parity, validator, doctor Ready, whitespace, creator-commerce, migration, and self-review passed.
Review state, direct links, limits, and external gates: completed build; direct source/test/guide links above; local-only evidence; Product task review remains the external gate before TASK-023.
Repository state: Base implementation and coordination commits plus two logical local review-repair commits; no push, merge, release, publication, deployment, plugin install, or consumer-repository change is authorized or performed.
Remaining owner and action: FB-Product/BFM reviews the TASK-022 branch diff and either accepts the gate or records an actionable blocker; TASK-023 remains blocked meanwhile.

## Brief Validation

Status: pass
Satisfied criteria and evidence: Every interface, state, safety, evidence, concurrency, checkpoint, recall/review, bootstrap, parity, doctor, and local-smoke criterion in the approved brief maps to passing focused or full-gate evidence.
Missing criteria: No approved TASK-022 implementation criterion remains missing after the local repair; Product review remains the declared sequence gate.
Reason: The named focused and full-gate evidence covers every approved local criterion; Product still owns acceptance of the repaired branch diff.
Owner: FB-Product/BFM.
Next action: Complete task-scoped review of base `9a55314`, coordination `a5b0a7e`, first repair `38710ca`, and the second repair at branch HEAD.
Approved scope-change references: The original approved TASK-022 brief remains unchanged; both review repairs narrow unsafe behavior without expanding scope.

## Test This Now

- **Outcome type:** Completed repository-local CLI and harness build
- **Direct links:** [Root session module](../../tools/fb-session.cjs), [focused tests](../../tools/fb-session.test.cjs), and [session guide](../fb/sessions.md)
- **Exact steps and expectations:**
  1. Open the focused tests and confirm they cover intake, gates, concurrency, checkpoint pushes, privacy, closeout, recall/review, bootstrap, and package behavior.
  2. Open the root and packaged session modules and confirm they are byte-identical.
  3. Review base `9a55314`, coordination `a5b0a7e`, first repair `38710ca`, and the second repair at branch HEAD; confirm no TASK-023, release, provider, deployment, merge, or consumer-repository surface changed.
- **Pass criteria:** The exact seven-command contract and safety/evidence boundaries match the approved brief, mirrors remain aligned, and the branch diff stays inside TASK-022.
- **Known limits:** Local CLI/Git and documentation evidence only; no hosted service or deployed UI exists for this task.
- **Failure-report format:** Finding severity; exact file and line; observed behavior; expected brief clause; reproduction command or fixture.

## Delivery Status

Implementation is present in the expected mirrored modules, tests, harness, setup, templates, skills, and validator/doctor integration.

## Verification Evidence

The authoritative complete second-repair gate ended with `TASK_022_SECOND_REPAIR_FULL_GATE_OK`; mirrored suites passed 45/45 and 23/23, validator passed, and doctor reported Ready with registered execution-worktree and bundled MCP route checks.

## Remaining Gates

Product task-scoped branch-diff review only. TASK-023 remains blocked. Live deploy, release, publication, merge, plugin installation, and consumer migration remain unauthorized.

## Product Status Recommendation

lane-verification-passed

Closeout note - TASK-022: lane-verification-passed after the second review repair. Delivered: repository-local session ledger, final-boundary submit/close authority, per-Failure validation, field-aware evidence placeholders, canonical privacy gates, crash-resume checkpoints, six-page bootstrap, real default-worktree fixtures, and mirrored validation. Evidence: base `9a55314`, coordination `a5b0a7e`, first repair `38710ca`, second repair at branch HEAD, `TASK_022_SECOND_REPAIR_FULL_GATE_OK`, and self-review. Remaining: Product task review; TASK-023 stays blocked. Handoff: docs/handoffs/TASK-022.md.

## Loop Learning

Feedback captured: repeated context reconstruction and manual test-plan prompting.
Repeated pattern?: yes
Tooling needed?: propose automation — explicitly approved as the session ledger.
Product approval needed?: no
