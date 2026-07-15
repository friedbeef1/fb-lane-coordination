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
Mini-loop Evidence: The original Verification Handoff regression passed across root, package, and bootstrap surfaces. After MirrorCam TASK-Q-0736 proved a clean-clone workspace recovery, the new workspace-recovery contract regression was added first and failed on the missing preflight rule; it now passes alongside both 27-check CLI suites, syntax, root/package parity, and a clean-clone validator/doctor check.
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
- `node tools/fb-lane.validate.cjs` — fresh local clean clone — passed.
- `node tools/fb-lane.cjs doctor` — fresh local clean clone — passed; `FB-Lane doctor: Ready` with zero active locks.
- `git diff --check` — fresh local clean clone — passed.

Runnable evidence:

- [Root scorecard template](../evals/agent-behavior-scorecard-template.md) — confirms the reusable checklist exists.
- [Canonical loop guidance](../loop-engineering.md#verification-handoff) — confirms the detailed handoff shape and pass criteria future projects inherit.
- [MirrorCam TASK-Q-0736 recovery proof](/Users/jamesyeang/Projects/mirrorcam/docs/qa/2026-07-15-workspace-recovery/verification.md) — consumer-repository evidence that the generic lesson was proven before transfer.

Recovery attempted: Added the focused workspace-recovery regression first; it failed because the reusable rule was absent. Added a bounded preflight and clean-clone recovery contract to root/package rules, templates, scorecards, skills, CLI bootstrap output, and public guidance; reran the focused and root/package suites successfully.
Next Product/BFM recovery action: Product reviews the branch diff. The shared board is reconciled and has zero active locks; no user action is expected unless a real external gate appears.
User gate: None.

## Product/BFM Closeout

Status: Staging QA; workspace-recovery amendment delivered and clean-clone verified, awaiting Product branch-diff review.
Actioned By: FB-Product / BFM.
Result: The reusable Verification Handoff contract now includes the TASK-Q-0736 workspace-recovery lesson in root/package rules, templates, scorecards, public loop guidance, Product/BFM skills, and CLI bootstrap output. It requires a bounded workspace-health preflight (capacity, File Provider ancestry, stable double reads, bounded Git probes), clean-clone recovery after the second consecutive failure, and preserves commits/owned artifacts without copying damaged `.git`, index, or worktree metadata.
Evidence: `node tools/workspace-recovery-contract.test.cjs` passed; root and packaged suites passed 27 checks each; CLI/test syntax and root/package CLI parity passed. In a fresh local clean clone, `node tools/fb-lane.validate.cjs`, `node tools/fb-lane.cjs doctor`, and `git diff --check` all passed; doctor reported a clean worktree and zero active locks.
Remaining: Product branch-diff review. An unrelated `FAQ.md` edit is intentionally preserved outside this task and excluded from its commit; its originating owner must resolve it separately. No publish, marketplace release, deployment, new runner/dashboard, or MirrorCam change is authorized.
Closeout Note: Staging-only generic harness evidence and shared-board reconciliation are complete; Product review remains.
Loop Learning: Feedback captured: issue found; Repeated pattern?: yes; Tooling needed?: propose guardrail; Product approval needed?: no.
