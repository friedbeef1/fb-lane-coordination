# TASK-017 - Progressive Disclosure And Framework OKR Hardening

## Goal Alignment Session

Lane OKR Fit: aligned
Mini-loop Evidence: Root/package syntax, parity, JSON parse, regression tests, stale-wording scan, doctor, and whitespace checks passed. Full validator reaches doctor and fails only because this branch is intentionally dirty before commit.
Evidence Against Product OKR: None identified

## Scope

Harden FB-Lane progressive disclosure so bootstrapped projects keep:

- `PROJECT_BOARD.md` as truth for status, ownership, sequencing, gates, and locks.
- `docs/handoffs/index.md` as routing for which detailed handoffs to open.
- Detailed handoff files as evidence, rationale, plans, QA, and implementation detail.

## Requirements

- Default index columns: Task / Topic, Lane, Status, Depends / Blocks / Gate, Checks / Evidence, Detail.
- `doctor` stays read-only.
- `doctor` warns for missing indexes and old-style indexes without dependency/gate columns.
- Fix text points to bootstrap or Product/BFM lookup repair; it must not silently create files.
- Product/BFM refreshes the index before non-quick sequencing when handoffs exist and lookup state is missing, stale, or too vague.
- Do not hard-block submit.
- Do not require this for `TASK-Q-*` quick tasks.
- Keep anti-bloat guidance explicit: no full OKRs, full QA checklists, plans, logs, rationale, copy variants, or implementation detail in the index.
- Add one FB-Lane framework OKR as a north star, not a per-project ritual.
- Use directional Key Results and Product/BFM health flags instead of brittle numeric scoring.
- Product/BFM closeout health flags are `healthy`, `watch`, `needs Product review`, and `blocked`.
- Explicitly avoid per-task OKR generation, giant `doctor` behavior, second-board handoff indexes, and quick-task ceremony.
- Add objective mode selection so future agents default to normal/simple coding unless coordination, Product/BFM, security/payment/release, core product flow, lock, multi-thread, or durable-context triggers appear.
- Clarify the escalation ladder: normal/simple coding, FB-Lane light, then Product/BFM.
- Add the awareness/isolation/integration rule: board plus handoff index create shared awareness, branches/worktrees isolate execution, and BFM integrates outcomes.
- Make clear that worktrees do not replace coordination: no private-worktree disappearance, huge unannounced diff, source edits without board/lock awareness, or closeout without BFM reconciliation when multiple outputs exist.
- Require BFM to run a Story Split Pass before prioritizing: split mixed lanes, risks, locks, gates, review surfaces, blocked work, and ready-now work into smaller stories, or say `No split needed`.
- Require closeout to name whether the branch/worktree is clean, merged, stale, blocked, or intentionally dirty, and record session-boundary action for intentional dirt.
- Require closeout to name external-service test mode, created records/resources, cleanup evidence, or a pending cleanup gate when checks touch real providers.
- Require Product/BFM to proactively propose one small guardrail when repeated workflow failure, coordination friction, stale state, missing evidence, or preventable rework appears. The proposal names the observed pattern, guardrail, cost, benefit, affected files/rules, and approval needed; it does not silently change the process.
- When `Loop Learning` chooses `propose eval`, use a generic Markdown scorecard under `docs/evals/` with sections for non-Product execution gate, BFM closeout accounting, evidence honesty, and goal/scope fit. Do not add eval runners, dashboards, numeric scoring, CI eval jobs, or bigger `doctor` rules without separate approval.
- Add phased approval autonomy: start Product/BFM in Shadow Approval, let Product/BFM recommend Phase 2 or Phase 3 only after safe matching decisions, require user approval for phase changes, and never self-approve risky surfaces.

## Story Split Update - 2026-07-03

Added the BFM Story Split Pass across source and packaged plugin skills, generated Product/worker prompts, bootstrap templates, Codex rules, and user-facing docs. This makes BFM decide whether a broad run should be split into smaller stories before prioritizing, running dependency/lock classification, or claiming files.

Verification:
- `node --check tools/fb-lane.cjs`, packaged plugin CLI, and active Codex cache CLI passed.
- Root, packaged, and active-cache agent JSON parse checks passed.
- `node tools/fb-lane.cjs status` shows TASK-017 locks include agent, template, skill, Codex rule, and platform-doc surfaces touched by this rule.
- `node tools/fb-lane.cjs doctor` reports only the expected uncommitted-worktree warning.
- `git diff --check` passed.

## Proactive Loop Hardening Update - 2026-07-03

Added the proactive self-optimization rule across MirrorCam and generic FB-Lane surfaces. Product/BFM now proposes one small guardrail for approval when repeated coordination friction, stale state, missing evidence, or preventable rework appears, while skipping one-off or low-impact issues and avoiding silent process mutation.

Touched reusable surfaces include README/FAQ/loop docs, Codex platform docs, AGENTS/CLAUDE templates, PROJECT_BOARD template, source and packaged CLI bootstrap prompts, generated Product agent JSON, Product/BFM/coordination skills, and packaged plugin mirrors.

Verification after this update:
- `node --check tools/fb-lane.cjs`
- `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs`
- Root/package CLI and Product agent JSON parity
- Product agent JSON and plugin manifest parse
- `node tools/fb-lane.test.cjs` -> 15 checks passed
- `git diff --check`
- `node tools/fb-lane.cjs doctor` -> expected `Needs attention` because the branch has uncommitted changes
- `node tools/fb-lane.validate.cjs` -> reaches the doctor gate and fails only because doctor correctly does not report `Ready` on an uncommitted worktree

## Loop Learning Escalation Update - 2026-07-04

Added the compact Product/BFM `Loop Learning` closeout field so heavier tooling has an explicit trigger without adding a new command or expanding `doctor`.

Closeouts now record:

- feedback captured
- repeated pattern: `no` or `yes`
- tooling needed: `none`, `propose guardrail`, `propose automation`, or `propose eval`
- Product approval needed: `no` or `yes`

Touched reusable surfaces include README/FAQ/loop docs, packaged plugin README, AGENTS/CLAUDE templates, PROJECT_BOARD template, source and packaged CLI bootstrap prompts, generated Product agent JSON, Product/BFM/coordination skills, and packaged plugin mirrors.

## Generic Eval Scorecard Template Update - 2026-07-04

Added a reusable, Markdown-only agent-behavior scorecard template for the `Loop Learning: propose eval` path. The template is generic to FB-Lane projects and covers:

- non-Product execution gate
- BFM closeout accounting
- evidence honesty
- goal and scope fit

Updated source and packaged plugin docs, bootstrap templates, Product/BFM/coordination skills, generated Product prompts, packaged plugin mirrors, and bootstrap CLI output so `propose eval` points to the scorecard without adding eval runners, dashboards, numeric scoring, CI eval jobs, or larger `doctor` rules. New bootstrap runs now create `docs/evals/agent-behavior-scorecard-template.md` as a passive template.

Verification after this update:
- `node --check tools/fb-lane.cjs` and packaged plugin CLI passed.
- `node --check tools/fb-lane.test.cjs` and packaged plugin test copy passed.
- Root/package parity passed for CLI, tests, generated Product agent JSON, and scorecard template copies.
- Product agent JSON and plugin manifests parse.
- `node tools/fb-lane.test.cjs` passed 15 checks, including bootstrap creation of the optional eval scorecard template.
- `git diff --check` passed.
- `node tools/fb-lane.cjs doctor` reports `Needs attention` only because the branch has uncommitted TASK-017 work.
- `node tools/fb-lane.validate.cjs` reaches the doctor gate and fails only because `doctor` correctly does not report `Ready` on an intentionally dirty worktree.

## Approval Autonomy Phase Update - 2026-07-04

Added a lightweight phase model for Product/BFM self-approval:

- Phase 1 Shadow Approval: ask the user, but record `Would self-approve: yes/no` and the reason.
- Phase 2 Bounded Self-Approval: only low-risk continuation work after one day or three matching decisions with no material miss.
- Phase 3 Exception-Only Approval: only after five safe self-approvals with no rollback, stale dirty state, or hidden gate.

Product/BFM may recommend phase changes; the user approves them. Workstreams may mark work `safe to auto-accept`, but Product/BFM owns actual self-approval. The rule explicitly blocks self-approval for new scope, unapproved OKR additions or revisions, live deploys, secrets, payments, auth/privacy, destructive data, provider-state changes, unclear goals, failed evidence, lock conflicts, or unresolved dirty state.

Touched reusable surfaces include README/FAQ/loop docs, packaged plugin README, AGENTS/CLAUDE templates, PROJECT_BOARD template, Codex rules, source and packaged CLI bootstrap prompts, generated Product agent JSON, Product/BFM/coordination skills, and packaged plugin mirrors.

## Current Verification Summary

- `node --check tools/fb-lane.cjs`
- `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs`
- `node --check tools/fb-lane.test.cjs`
- `node --check plugins/fb-lane-coordination/tools/fb-lane.test.cjs`
- Root/package parity: `tools/fb-lane.cjs`, `tools/fb-lane.test.cjs`, `agents/FB-Product/agent.json`, and scorecard template copies
- Product agent JSON and plugin manifests parse
- `node tools/fb-lane.test.cjs` -> 15 checks passed
- `node tools/fb-lane.cjs status` -> TASK-017 remains `Staging QA`
- Wording scan confirms approval autonomy phases and never-self-approve boundaries across docs, templates, skills, generated prompts, packaged plugin mirrors, and CLI bootstrap output
- `node tools/fb-lane.cjs doctor` -> `Needs attention` only for intentionally dirty TASK-017 work
- `node tools/fb-lane.validate.cjs` -> reaches the doctor gate and fails only because the worktree is intentionally dirty pending commit
- `git diff --check`

## Closeout

Status: lane-verification-passed for the current generic eval scorecard and approval-autonomy update; TASK-017 remains in `Staging QA`.
Health: healthy.
Branch/worktree state: intentionally dirty on `codex/okf-lite-handoff-index` pending commit. Dirty state is owned by TASK-017 / Product-BFM; reason is the reusable framework hardening update, including eval escalation and approval autonomy; next gate is commit/push and Product review of PR #31.
Remaining: commit/push current TASK-017 update, then Product review of PR #31 before merge.
