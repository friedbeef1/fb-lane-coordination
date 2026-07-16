---
type: fb-lane-handoff
task: TASK-023
lane: fb-product
status: implemented
okr_fit: aligned
fb_harness: v2
Review state: completed build
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
Quality bar: Deterministic structure catches lifecycle inconsistency while subjective quality remains explicit Product/user judgment.
Selected eval IDs and authority: EVAL-HARNESS-DIRECT-LINK-001 (shadow); EVAL-PRODUCT-CREATOR-SPECIFICITY-001 (shadow).
Selected eval records: EVAL-HARNESS-DIRECT-LINK-001 (shadow, pass, docs/evals/TASK-023-walkthroughs.md#eval-harness-direct-link-001); EVAL-PRODUCT-CREATOR-SPECIFICITY-001 (shadow, pass, docs/evals/TASK-023-walkthroughs.md#eval-product-creator-specificity-001).
Mechanical versus judgment evidence: Link, schema, parity, and closeout structure are mechanical; creator-commerce specificity remains Product judgment.
Remaining user judgment: Product review decides whether future repeated evidence warrants an authority change; TASK-023 makes none.

## Build Brief

- Begin only from the verified TASK-022 commit.
- Add canonical/package eval harness guidance and a reusable eval-record template while preserving the existing scorecard path.
- Integrate selected evals with Build Brief, Verification Handoff, Test This Now, Task Receipt, session checkpoints, and closeout.
- Enforce only deterministic structure and already-mechanical checks; do not add a runner or semantic judge.
- Verify the required harness-link failure and creator-commerce quality-gap walkthroughs plus full seven-page parity.
Quality bar: Preserve honest direct-review access and context-specific creator-commerce output without weakening either target.
Selected eval IDs and authority: EVAL-HARNESS-DIRECT-LINK-001 (shadow); EVAL-PRODUCT-CREATOR-SPECIFICITY-001 (shadow); do not run unrelated catalog evals.
Selected eval records: EVAL-HARNESS-DIRECT-LINK-001 (shadow, pass, docs/evals/TASK-023-walkthroughs.md#eval-harness-direct-link-001); EVAL-PRODUCT-CREATOR-SPECIFICITY-001 (shadow, pass, docs/evals/TASK-023-walkthroughs.md#eval-product-creator-specificity-001).
Mechanical versus judgment evidence: Node fixtures validate deterministic fields and transitions; Product compares the creator output with concrete Good/Bad examples.
Remaining user judgment: Product decides any later promotion, demotion, or changed product direction with explicit evidence.

## Dependency

Cleared. TASK-022 passed `TASK_022_SECOND_REPAIR_FULL_GATE_OK` and independent Product task review with no remaining findings.

## Verification Handoff

Candidate: `codex/fb-eval-loop`, stacked from the accepted TASK-022 commit.
Test plan: [approved plan](../superpowers/plans/2026-07-16-fb-session-ledger-and-eval-loop.md)
Commands and results: `node tools/fb-eval.test.cjs` and packaged mirror passed 15/15 each; root/package session suites passed 24/24 each; root/package legacy CLI suites passed 45/45 each; `node tools/fb-lane.validate.cjs` passed ten syntax checks, source/test/skill/template/seven-page parity, validator, doctor Ready, and whitespace at repair commit `3d44afc`.
Environment: isolated linked worktree on `codex/fb-eval-loop` at implementation commit `240b1b2` plus selected-eval handoff commit `83ee9f0`.
Runnable evidence links: [eval lifecycle](../fb/evals.md), [walkthrough records](../evals/TASK-023-walkthroughs.md), [root validator](../../tools/fb-eval.cjs), and [focused tests](../../tools/fb-eval.test.cjs).
Manual pass criteria: Product confirms every authority/transition boundary, both walkthrough closures, the exact Checking/Quality Gap behavior, seven-page preservation, and absence of a judge, runner, score, dashboard, CI job, external integration, or automatic promotion.
Recovery attempted: The sandbox blocked mechanical mirror writes; scoped write approval was used only for root/package/template parity copies. One packaged-test path resolved from the plugin root and was corrected to the repository root. No product/runtime recovery was needed.
Known limits: Product-quality evaluation remains explicit Product/user judgment; no hosted or external integration was exercised; independent Product review remains.
Next Product/BFM recovery action: Perform the independent TASK-023 branch review and keep the candidate in local Staging QA unless separately authorized.
Selected eval results and evidence: EVAL-HARNESS-DIRECT-LINK-001 (shadow) passed after missing-link revision/rerun/regression capture; EVAL-PRODUCT-CREATOR-SPECIFICITY-001 (shadow) passed after the complete Quality Gap and fresh specific candidate. Neither authority changed.
Selected eval records: EVAL-HARNESS-DIRECT-LINK-001 (shadow, pass, docs/evals/TASK-023-walkthroughs.md#eval-harness-direct-link-001); EVAL-PRODUCT-CREATOR-SPECIFICITY-001 (shadow, pass, docs/evals/TASK-023-walkthroughs.md#eval-product-creator-specificity-001).

## Task Receipt

Approved brief and decisions: Implemented the approved Markdown-first eval loop from the accepted TASK-022 base with no runner, judge, score, dashboard, CI job, hosted integration, or authority promotion.
Confirmed assumptions and approved scope changes: No assumption or scope change was required; both new walkthrough records remained shadow.
Branch, source commits, and changed surfaces: `codex/fb-eval-loop`; implementation `240b1b2`; selected-eval handoff `83ee9f0`; review repair `3d44afc`; canonical/package harness, templates, skills, validator/doctor/session integration, tests, and bootstrap routes changed.
Checks, failures, recovery, and results: Expected missing-module RED plus review-repair REDs for authority spoofing and contradictory session closeout; focused 15/15 root/package GREEN; legacy 45/45 CLI and 24/24 session root/package; complete local gate and doctor Ready passed. Scoped sandbox approval handled mirror writes; packaged fixture path was corrected.
Review state, direct links, limits, and external gates: Completed local repository build; [walkthrough records](../evals/TASK-023-walkthroughs.md); subjective quality stays Product/user judgment; independent Product review is the only remaining local gate.
Repository state: Implementation and selected-eval handoff are committed; coordination closeout is the final documentation commit.
Remaining owner and action: Product/BFM performs independent branch review; release, publish, deploy, merge, plugin install, and consumer migration remain unauthorized.
Selected eval results and evidence: Both selected shadow evals passed their original scenarios with revision, fresh rerun evidence, regression cases, and no authority change.
Selected eval records: EVAL-HARNESS-DIRECT-LINK-001 (shadow, pass, docs/evals/TASK-023-walkthroughs.md#eval-harness-direct-link-001); EVAL-PRODUCT-CREATOR-SPECIFICITY-001 (shadow, pass, docs/evals/TASK-023-walkthroughs.md#eval-product-creator-specificity-001).

## Brief Validation

Status: pass
Satisfied criteria and evidence: Record schema, all authority levels and transitions, approval/demotion, advisory/blocking/mechanical/shadow closeout, selected-eval integration, failure classifications, Quality Gaps, closure evidence, catalog/categories/privacy, bootstrap preservation, and parity have named passing fixtures.
Missing criteria: No approved implementation criterion remains missing; independent Product review is a post-implementation gate.
Reason: Focused walkthroughs and the complete local gate satisfy the approved local implementation brief without expanding scope.
Owner: Product/BFM
Next action: Perform independent branch review and record findings before any later integration decision.
Approved scope-change references: The original approved TASK-023 brief applies unchanged.

## Test This Now

- **Outcome type:** Completed local Markdown eval harness
- **Direct links:** [Eval lifecycle](../fb/evals.md), [walkthrough records](../evals/TASK-023-walkthroughs.md), [validator](../../tools/fb-eval.cjs), and [focused tests](../../tools/fb-eval.test.cjs)
- **Exact steps and expectations:**
  1. Open the walkthrough records and confirm both Eval IDs remain shadow, preserve root cause/revision/rerun/regression/fresh evidence, and make no authority change.
  2. Inspect the creator-commerce Quality Gap and confirm the initial functional/generic output remains `Checking — product quality target missed` until a fresh specific candidate passes the unchanged target.
  3. Inspect the validator and focused tests and confirm advisory explanation, blocking/mechanical Product-boundary closeout, valid/invalid transition approval, privacy, uniqueness, integration, bootstrap preservation, and seven-page parity are deterministic structure checks only.
- **Pass criteria:** The lifecycle and records match the approved contract, both original walkthrough scenarios close with fresh evidence, and no prohibited automation or promotion exists.
- **Known limits:** No semantic judge, numeric score, hosted capture, external integration, CI eval job, release, deployment, merge, plugin install, or consumer migration was exercised.
- **Failure-report format:** Eval ID; observed field/behavior; expected contract; file and commit; authority and result; environment.
What was evaluated: Direct-review-link harness completeness and creator-commerce recommendation specificity for the two selected shadow Eval IDs.
Selected eval records: EVAL-HARNESS-DIRECT-LINK-001 (shadow, pass, docs/evals/TASK-023-walkthroughs.md#eval-harness-direct-link-001); EVAL-PRODUCT-CREATOR-SPECIFICITY-001 (shadow, pass, docs/evals/TASK-023-walkthroughs.md#eval-product-creator-specificity-001).
Exact scenarios and expected results: Missing link fails then resolves after revision; generic creator output stays Checking with a complete Quality Gap until a fresh contextual candidate passes.
Known quality gaps: No gap remains for the two selected scenarios; broader catalog scenarios were intentionally not run.
Required user judgment: Product confirms subjective creator-commerce specificity and decides any future authority recommendation; no authority change is requested now.

## Verification Checkpoint

Selected eval results and evidence: Both selected shadow records passed their original scenarios at `240b1b2`; the complete local gate passed at `83ee9f0`; walkthrough, handoff, board, and Git evidence agree.
Selected eval records: EVAL-HARNESS-DIRECT-LINK-001 (shadow, pass, docs/evals/TASK-023-walkthroughs.md#eval-harness-direct-link-001); EVAL-PRODUCT-CREATOR-SPECIFICITY-001 (shadow, pass, docs/evals/TASK-023-walkthroughs.md#eval-product-creator-specificity-001).

## Loop Learning

Feedback captured: repeated failures should improve behavior and product quality.
Repeated pattern?: yes
Tooling needed?: propose eval — explicitly approved.
Product approval needed?: no
Failure: Initial harness packet omitted a direct review link; initial creator-commerce candidate was functional but generic.
Observed: Focused fixtures rejected the missing link and kept generic product output at `Checking — product quality target missed` with a complete Quality Gap.
Cause: The direct-link field was absent, and the initial product candidate did not use supplied commerce context.
Recovery attempted: Added the link and contextual revision without weakening either quality target, then reran the original scenarios.
Result: Both shadow evals passed with fresh evidence and regression cases; no automatic or blocking promotion occurred.
Reusable lesson: Record classification before revision and preserve the original scenario, root cause, rerun, regression, and authority recommendation in one consistent evidence chain.

## Repair after review

Repair commit: `3d44afc`.

- Authority promotion now accepts only structured positive Product approval and rejects negated, automatic, or self-promoted evidence, including the two exact adversarial review strings.
- Completed closeout now requires coherent Latest result, Rerun result, Disposition, Product-boundary approval, and an approved brief revision for supersession. A real session-close regression proves fail/blocked/not-run cannot hide behind a passing rerun.
- Project Start, Build Brief, Verification Handoff, Task Receipt, Test This Now, and Verification Checkpoint now repeat one exact selected-record syntax; IDs, authority, result, and repo-local evidence references are cross-checked against the Eval Record.
- Quality Gap history now has explicit open/closed state. Open gaps require exact Checking progress; closed gaps keep the historical evidence, require non-Checking progress, and name fresh closure evidence tied to a passed record.
- Both documented fallback setup paths copy `fb-eval.cjs`; an executable isolated-copy fixture proves the local CLI loads and runs through the complete module chain.
- Every eval records subjective/objective judgment. Subjective product evals require Good/Bad examples; objective product evals may omit them; mechanical evals must be objective.

Repair verification: root/package eval `15/15`, root/package session `24/24`, legacy CLI `45/45`, complete readiness validation, doctor `Ready`, mirror parity, and whitespace all passed from clean commit `3d44afc`. Independent Product re-review remains the next local gate; no authority promotion or external release action occurred.
