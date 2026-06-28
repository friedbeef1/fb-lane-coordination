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

## Verification

- `node --check tools/fb-lane.cjs`
- `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs`
- Root/package parity: `tools/fb-lane.cjs`, `tools/fb-lane.test.cjs`, and `agents/FB-Product/agent.json`
- Root/package parity: mirrored skills and agent/template instruction files
- `node tools/fb-lane.test.cjs` -> 15 checks passed
- Product agent JSON and plugin manifests parse
- Stale wording scan for per-task OKRs, old Goal/Success terms, and hard numeric scoring -> no matches
- `node tools/fb-lane.validate.cjs` -> failed only because `doctor` reports the expected dirty-worktree warning on this in-progress branch
- `node tools/fb-lane.cjs doctor` -> read-only, no coordination drift beyond the expected uncommitted-worktree warning
- `git diff --check`

## Closeout

Status: lane-verification-passed.
Health: watch.
Remaining: user diff review, commit/stage decision, and clean-worktree rerun so `node tools/fb-lane.validate.cjs` can pass its final doctor gate.
