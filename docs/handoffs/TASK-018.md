---
type: fb-lane-handoff
task: TASK-018
lane: fb-product
status: in-progress
okr_fit: aligned
---

# TASK-018 - Generic Verification Handoff And Recovery Contract

## Goal Alignment Session

Product Goal: Make FB-Lane reduce routine coordination work for future projects while preserving explicit approval and external-action gates.
Workstream Goal: Give Product/BFM one reusable Verification Handoff contract that shows testing evidence and completes safe recovery before asking the user to intervene.
Lane OKR Fit: aligned
User Approval Needed: no - James explicitly approved this generic harness change.
Mini-loop Evidence: The regression was added first and failed because the scorecard had no Verification Handoff section; after the contract was added across root, packaged, and bootstrap surfaces, root and packaged CLI suites passed 27 checks each.
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
- Remaining: Node syntax, validator, doctor, and whitespace checks after the coordination records are complete.

Runnable evidence:

- [Root scorecard template](../evals/agent-behavior-scorecard-template.md) — confirms the reusable checklist exists.
- [Canonical loop guidance](../loop-engineering.md#verification-handoff) — confirms the detailed handoff shape and pass criteria future projects inherit.

Recovery attempted: Added the regression first; it failed on the missing scorecard section. Added the contract to root/package scorecards, templates, skills, generated CLI output, and public guidance; reran both suites successfully.
Next Product/BFM recovery action: Complete the remaining local checks, repair any safe failure, then update this handoff, board, index, and workstream card with the evidence. No user action is expected unless a real external gate appears.
User gate: None.

## Product/BFM Closeout

Status: In Progress.
Actioned By: FB-Product / BFM.
Result: Contract implementation and root/package regression proof are complete; full local verification and closeout accounting remain.
Evidence: See Verification Handoff above.
Remaining: Syntax, validator, doctor, whitespace verification, and Product branch-diff review. No publish or release is authorized.
Closeout Note: Pending final local verification.
Loop Learning: Feedback captured: issue found; Repeated pattern?: yes; Tooling needed?: propose guardrail; Product approval needed?: no.
