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
Mini-loop Evidence: The regression was added first and failed because the scorecard had no Verification Handoff section; after the contract was added across root, packaged, and bootstrap surfaces, root and packaged CLI suites passed 27 checks each. Syntax, byte parity, clean-worktree validator, doctor Ready, and whitespace checks also passed.
Evidence Against Product OKR: None identified.

## Scope

- Add `## Verification Handoff` to root and packaged guidance, generated bootstrap output, scorecards, setup skills, and public loop documentation.
- Require the candidate, Test plan link, exact checks and environment, current result, runnable evidence link, manual pass criteria, recovery attempted, and Next Product/BFM recovery action.
- Make Product/BFM perform safe recovery before involving the user.
- Preserve the distinction between routine recoverable failures and real approval, external account, physical-device, or manual-action gates.

## Out Of Scope

- New CLI commands, test runners, dashboards, CI/eval jobs, or `doctor` rules.
- Publishing, marketplace release, deployment, or paused-integration testing.
- Changes to MirrorCam or any other FB-Lane consumer repository.

## Verification Handoff

Candidate: `codex/codex-only-cut` in the `fb-lane-objective-checkpoints` worktree.
Test plan: [Verification Handoff contract plan](../superpowers/plans/2026-07-15-verification-handoff-contract.md).
Automated checks:

- `node tools/fb-lane.test.cjs` — root Node CLI suite — passed, 27 checks.
- `node plugins/fb-lane-coordination/tools/fb-lane.test.cjs` — packaged Node CLI suite — passed, 27 checks.
- `cmp -s tools/fb-lane.cjs plugins/fb-lane-coordination/tools/fb-lane.cjs` — root/package CLI parity — passed.
- `node --check tools/fb-lane.cjs`, `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs`, and both test files — Node syntax — passed.
- `node tools/fb-lane.validate.cjs` — clean committed worktree — passed.
- `node tools/fb-lane.cjs doctor` — clean committed worktree — passed; `FB-Lane doctor: Ready`.
- `git diff --check` — committed-diff whitespace — passed.

Runnable evidence:

- [Root scorecard template](../evals/agent-behavior-scorecard-template.md) — confirms the reusable checklist exists.
- [Canonical loop guidance](../loop-engineering.md#verification-handoff) — confirms the detailed handoff shape and pass criteria future projects inherit.

Recovery attempted: Added the regression first; it failed on the missing scorecard section. Added the contract to root/package scorecards, templates, skills, generated CLI output, and public guidance; reran both suites successfully.
Next Product/BFM recovery action: Product reviews the branch diff. If it finds a safe issue, Product/BFM fixes and reruns the named checks; no user action is expected unless a real external gate appears.
User gate: None.

## Product/BFM Closeout

Status: Staging QA; awaiting Product branch-diff review.
Actioned By: FB-Product / BFM.
Result: The reusable Verification Handoff contract is present in root/package rules, templates, scorecards, public loop guidance, Product/BFM skills, and the CLI bootstrap output. It requires safe recovery and complete test/evidence handoff before user testing.
Evidence: Root and packaged suites passed 27 checks each; CLI/test syntax and root/package CLI parity passed; clean-worktree `node tools/fb-lane.validate.cjs`, `node tools/fb-lane.cjs doctor`, and `git diff --check` passed at `a7dd3bc`.
Remaining: Product branch-diff review. No publish, marketplace release, deployment, new runner/dashboard, or MirrorCam change is authorized.
Closeout Note: Staging-only generic harness evidence is complete; Product review remains.
Loop Learning: Feedback captured: issue found; Repeated pattern?: yes; Tooling needed?: propose guardrail; Product approval needed?: no.
