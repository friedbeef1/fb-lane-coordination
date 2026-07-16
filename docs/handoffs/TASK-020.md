---
type: fb-lane-handoff
task: TASK-020
lane: fb-product
status: ready
okr_fit: aligned
---

# TASK-020 - FB First-Project Clarity

## Goal Alignment Session

Product Goal: Let an everyday first-time user understand what FB will do now, what will be built later, what needs approval, and how to review a working result.
Workstream Goal: Align plugin skills, active documentation, bootstrap output, and tests around one concise first-project and user-review contract.
Lane OKR Fit: aligned
User Approval Needed: no - James explicitly approved the implementation plan.
Mini-loop Evidence: User feedback identified six clarity gaps: expected output, test responsibility, lane/BFM roles, build scope, decision versus assumption ownership, and proposed/blocked/completed state.
Evidence Against Product OKR: None identified.

## Scope

- Add a Project Start Brief and the immediately following How FB works card before first-project lane output or questions.
- Keep planning first and require explicit `$bfm` before building.
- Separate user decisions from assumptions, use clear progress language, and require lane-specific contributions.
- Require a direct-link, step-by-step Test This Now packet before asking users to review a runnable sandbox, staging candidate, or completed build.
- Keep root and packaged plugin guidance/tests aligned.

## Out Of Scope

- New persistent wizard or CLI command.
- A changed four-lane, board, or BFM ownership model.
- Publication, release, deployment, or consumer-project changes.

## Verification Handoff

Candidate: local branch `codex/fb-documentation-rebrand`.

Test plan: fresh bootstrap followed by a creator-commerce first-project walkthrough; then root/package test suites, syntax/parity, validator, doctor, and whitespace checks.

Manual pass criteria:

- The first response says FB prepares a build brief and is not yet building the app.
- The How FB works card appears before lane output and names lanes, Product, and BFM plainly.
- The review packet includes direct clickable links, exact test steps, expected results, pass criteria, known limits, and a failure-report instruction.
- Planning, approval, building, checking, complete, and blocked states are visibly distinct.

Recovery: Product/BFM owns routine test recovery; a missing review environment is reported as `Blocked — no review environment yet`, not handed to the user as an unqualified test request.

## Product/BFM Closeout

Status: In Progress.
Actioned By: FB-Product / BFM.
Result: Pending implementation and verification.
Evidence: This handoff, `PROJECT_BOARD.md`, and the approved plan.
Remaining: Source/package contract updates, tests, bootstrap smoke, verification, and review.
Closeout Note: No push, publish, release, deployment, or consumer-repository change is authorized.
Loop Learning: Feedback captured: issue found; Repeated pattern?: yes; Tooling needed?: propose guardrail; Product approval needed?: no - implementation is explicitly approved.
