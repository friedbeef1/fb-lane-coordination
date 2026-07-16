---
type: fb-lane-handoff
task: TASK-023
lane: fb-product
status: ready
okr_fit: aligned
fb_harness: v2
Review state: not reviewable
---

# TASK-023 — Markdown Eval Loop

## Goal Alignment Session

Product Goal: Improve FB behavior and product quality from repeated evidence without adding opaque automation.
Workstream Goal: Add a Markdown-first eval lifecycle that uses TASK-022 evidence and keeps authority changes explicit.
Lane OKR Fit: aligned
User Approval Needed: no
Mini-loop Evidence: The approved plan separates this task behind the complete TASK-022 gate.
Evidence Against Product OKR: None identified.

## Project Start Brief

What you asked for: Implement the approved eval loop immediately after the session ledger passes.
Your decisions: Consecutive tasks with separate commits and review gates; no runner or blocking promotion in the first implementation.
Assumptions to confirm: None — the implementation plan is explicitly approved.
What FB will build: Eval records, authority lifecycle, Build Brief selection, result handoff, Quality Gaps, failure classification, regression closure, initial catalog, and deterministic validation.
Out of scope: Autonomous judging, semantic scoring, dashboards, CI eval jobs, hosted capture, automatic promotion, release, publication, deployment, merge, and consumer-repository changes.
Success looks like: The harness and product-quality walkthroughs close only with honest fresh evidence while root/package/template/bootstrap parity remains intact.

## Build Brief

- Begin only from the verified TASK-022 commit.
- Add canonical/package eval harness guidance and a reusable eval-record template while preserving the existing scorecard path.
- Integrate selected evals with Build Brief, Verification Handoff, Test This Now, Task Receipt, session checkpoints, and closeout.
- Enforce only deterministic structure and already-mechanical checks; do not add a runner or semantic judge.
- Verify the required harness-link failure and creator-commerce quality-gap walkthroughs plus full seven-page parity.

## Dependency

Cleared. TASK-022 passed `TASK_022_SECOND_REPAIR_FULL_GATE_OK` and independent Product task review with no remaining findings.

## Verification Handoff

Candidate: `codex/fb-eval-loop`, stacked from the accepted TASK-022 commit.
Test plan: [approved plan](../superpowers/plans/2026-07-16-fb-session-ledger-and-eval-loop.md)
Commands and results: TASK-023 implementation checks pending; TASK-022 dependency evidence passed.
Environment: same isolated FB worktree after TASK-022 gate.
Runnable evidence links: not reviewable — repository harness change only.
Manual pass criteria: Product review confirms authority, quality-gap, failure, regression, and no-runner boundaries.
Recovery attempted: none.
Next Product/BFM recovery action: implement TASK-023 test-first, run the two required walkthroughs and complete local gate, then request task review.

## Loop Learning

Feedback captured: repeated failures should improve behavior and product quality.
Repeated pattern?: yes
Tooling needed?: propose eval — explicitly approved.
Product approval needed?: no
