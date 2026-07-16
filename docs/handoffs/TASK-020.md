---
type: fb-lane-handoff
task: TASK-020
lane: fb-product
status: staging-qa
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

Status: Staging QA — local review complete; no deployment was created.
Actioned By: FB-Product / BFM.
Result: FB now begins a clear new-project conversation with a Project Start Brief, followed immediately by a four-step How FB works card. It separates user decisions from assumptions, names selected and skipped lane contributions, gives every clarification a rationale/default/consequence, and reserves source changes for explicit `$bfm` after approval. User-facing progress is now `Understanding your idea → Ready for your approval → Building → Checking → Complete`; blocked work uses `Blocked — <reason> / next action`. Review requests use Test This Now with direct links, exact steps and expectations, pass criteria, known limits, a failure-report format, and a missing-access block.
Evidence: Commits `13bc37f`, `2579bc4`, `f9d8d9f`, `962725f`, `37acc4c`, and `9bf95fd`; independent Task 1/Task 2 reviews and final whole-branch review passed after two test-coverage repairs. Fresh creator-commerce bootstrap smoke confirmed the generated `AGENTS.md` and `.codex/rules.md` carry the plan-before-build, decisions/assumptions, exact progress/blocked, four-step flow, `$bfm`, and Test This Now contracts. Root/package suites each pass 28 checks; root/package CLI and tests are byte-identical; syntax, `node tools/fb-lane.validate.cjs`, `node tools/fb-lane.cjs doctor` (Ready), and `git diff --check` pass.
Remaining: Product may review or merge the local branch. No push, publication, plugin install, release, deployment, or consumer-repository change is authorized.
Closeout Note: The test plan and evidence are complete; there is no deployed preview because this task changes a reusable plugin contract rather than a user app. A missing preview must remain `Blocked — no review environment yet` under the new contract.
Loop Learning: Feedback captured: issue found; Repeated pattern?: yes; Tooling needed?: propose guardrail implemented; Product approval needed?: no - implementation was explicitly approved.

## Verification Handoff

Candidate: local branch `codex/fb-documentation-rebrand` at `9bf95fd`.

Test plan: run `node tools/fb-lane.test.cjs`, `node plugins/fb-lane-coordination/tools/fb-lane.test.cjs`, and `node tools/fb-lane.validate.cjs`; then bootstrap a fresh temporary workspace with `node tools/fb-lane.cjs bootstrap --platform codex` and inspect its generated `AGENTS.md` and `.codex/rules.md` against the Project Start Brief, How FB works, and Test This Now contracts.

Environment and results: local macOS worktree; root/package suites each passed 28 checks; readiness validation passed; doctor reported Ready; syntax, byte parity, and whitespace checks passed. The fresh creator-commerce smoke used “I want a simple web shop where creators sell digital template packs.” and confirmed the planning/approval path without invoking BFM.

Runnable evidence: no application preview exists for this reusable plugin-only change. The generated artifacts are the reviewable output; direct review targets are `AGENTS.md` and `.codex/rules.md` in the temporary bootstrap workspace. No missing review environment remains for contract verification.

Manual pass criteria: the first-project material says FB plans rather than builds; the card explains lanes → Product brief → user approval → explicit `$bfm` build/check; decisions and assumptions are separate; progress/blocked states match exactly; and Test This Now supplies its required fields.

Recovery: routine test recovery was completed before closeout. No user or external account/device action is required. Next Product/BFM action: retain the local candidate for Product review or explicit merge authorization.
