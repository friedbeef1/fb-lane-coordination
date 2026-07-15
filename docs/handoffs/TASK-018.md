---
type: fb-lane-handoff
task: TASK-018
lane: fb-product
status: staging-qa
okr_fit: aligned
---

# TASK-018 - Generic Verification Handoff And Recovery Contract

## Goal Alignment Session

Product Goal: Make FB-Lane reduce routine coordination work for future projects while preserving explicit approval and external-action gates.
Workstream Goal: Give Product/BFM one reusable Verification Handoff contract that shows testing evidence and completes safe recovery before asking the user to intervene.
Lane OKR Fit: aligned
User Approval Needed: no - James explicitly approved this generic harness change.
Mini-loop Evidence: The original Verification Handoff regression passed across root, package, and bootstrap surfaces. After MirrorCam TASK-Q-0736 proved a clean-clone workspace recovery, the new workspace-recovery contract regression was added first and failed on the missing preflight rule; it now passes alongside both 27-check CLI suites, syntax, root/package parity, and whitespace checks.
Evidence Against Product OKR: None identified.

## Scope

- Add `## Verification Handoff` to root and packaged guidance, generated bootstrap output, scorecards, setup skills, and public loop documentation.
- Require the candidate, Test plan link, exact checks and environment, current result, runnable evidence link, manual pass criteria, recovery attempted, and Next Product/BFM recovery action.
- Make Product/BFM perform safe recovery before involving the user.
- Preserve the distinction between routine recoverable failures and real approval, external account, physical-device, or manual-action gates.
- Transfer the proven generic workspace-recovery lesson: bounded health preflight, capacity/File Provider/read-stability/Git probes, second-failure clean-clone recovery, and never copying damaged Git metadata.

## Out Of Scope

- New CLI commands, test runners, dashboards, CI/eval jobs, or `doctor` rules.
- Publishing, marketplace release, deployment, or paused-integration testing.
- Changes to MirrorCam or any other FB-Lane consumer repository.

## Verification Handoff

Candidate: `codex/TASK-018-workspace-recovery` in the `fb-lane-objective-checkpoints` worktree, based on the existing TASK-018 candidate.
Test plan: [Verification Handoff contract plan](../superpowers/plans/2026-07-15-verification-handoff-contract.md).
Automated checks:

- `node tools/fb-lane.test.cjs` — root Node CLI suite — passed, 27 checks.
- `node plugins/fb-lane-coordination/tools/fb-lane.test.cjs` — packaged Node CLI suite — passed, 27 checks.
- `node tools/workspace-recovery-contract.test.cjs` — focused generic workspace-recovery contract and fresh Codex bootstrap output — passed.
- `cmp -s tools/fb-lane.cjs plugins/fb-lane-coordination/tools/fb-lane.cjs` — root/package CLI parity — passed.
- `node --check tools/fb-lane.cjs`, `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs`, and all focused test files — Node syntax — passed.
- `node tools/fb-lane.validate.cjs` — clean committed worktree — passed.
- `node tools/fb-lane.cjs doctor` — clean committed worktree — passed; `FB-Lane doctor: Ready`.
- `git diff --check` — committed-diff whitespace — passed.

Runnable evidence:

- [Root scorecard template](../evals/agent-behavior-scorecard-template.md) — confirms the reusable checklist exists.
- [Canonical loop guidance](../loop-engineering.md#verification-handoff) — confirms the detailed handoff shape and pass criteria future projects inherit.
- [MirrorCam TASK-Q-0736 recovery proof](/Users/jamesyeang/Projects/mirrorcam/docs/qa/2026-07-15-workspace-recovery/verification.md) — consumer-repository evidence that the generic lesson was proven before transfer.

Recovery attempted: Added the focused workspace-recovery regression first; it failed because the reusable rule was absent. Added a bounded preflight and clean-clone recovery contract to root/package rules, templates, scorecards, skills, CLI bootstrap output, and public guidance; reran the focused and root/package suites successfully.
Next Product/BFM recovery action: Product reviews the branch diff. TASK-Q-2802 currently locks `PROJECT_BOARD.md` and the overlapping BFM/setup surfaces, so its board reconciliation must wait for that lock to release; no user action is expected unless a real external gate appears.
User gate: None.

## Product/BFM Closeout

Status: Staging QA; workspace-recovery amendment delivered, awaiting Product branch-diff review and shared-board reconciliation.
Actioned By: FB-Product / BFM.
Result: The reusable Verification Handoff contract now includes the TASK-Q-0736 workspace-recovery lesson in root/package rules, templates, scorecards, public loop guidance, Product/BFM skills, and CLI bootstrap output. It requires a bounded workspace-health preflight (capacity, File Provider ancestry, stable double reads, bounded Git probes), clean-clone recovery after the second consecutive failure, and preserves commits/owned artifacts without copying damaged `.git`, index, or worktree metadata.
Evidence: `node tools/workspace-recovery-contract.test.cjs` passed; root and packaged suites passed 27 checks each; CLI/test syntax and root/package CLI parity passed; `git diff --check` passed. Earlier clean-worktree `node tools/fb-lane.validate.cjs` and `node tools/fb-lane.cjs doctor` proof remains recorded at `a7dd3bc`.
Remaining: Product branch-diff review; shared-board reconciliation after TASK-Q-2802 releases its active `PROJECT_BOARD.md` and BFM/setup-surface lock. An unrelated `FAQ.md` edit is intentionally preserved outside this task and excluded from its commit. No publish, marketplace release, deployment, new runner/dashboard, or MirrorCam change is authorized.
Closeout Note: Staging-only generic harness evidence is delivered; the shared coordination update is deferred only by TASK-Q-2802's active lock.
Loop Learning: Feedback captured: issue found; Repeated pattern?: yes; Tooling needed?: propose guardrail; Product approval needed?: no.
