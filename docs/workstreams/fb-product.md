# FB-Product Workstream Status

Last Updated: 2026-07-04
Lane: FB-Product

## Current Summary
TASK-017 remains the active reusable framework hardening task. Product/BFM now has a generic Markdown-only eval scorecard path for repeated agent-behavior failures via `Loop Learning: propose eval`, plus phased approval-autonomy guidance that starts in Shadow Approval before any bounded self-approval.

## Already Executed By Product/BFM
- Added the compact `Loop Learning` closeout field across reusable FB-Lane surfaces.
- Added `docs/evals/agent-behavior-scorecard-template.md` and the packaged plugin mirror so Product/BFM can propose a lightweight scorecard before heavier tooling.
- Kept eval runners, dashboards, numeric scoring, CI eval jobs, and bigger `doctor` rules out of scope unless separately proposed and approved.
- Added approval-autonomy phases across docs, templates, Product/BFM skills, generated Product prompts, bootstrap output, and packaged plugin mirrors.

## Still Pending / Blocked
- Product review of TASK-017 / PR #31 before merge.
- Commit/push of the current generic eval scorecard and approval-autonomy update after verification.

## Evidence Links
- PROJECT_BOARD.md
- docs/handoffs/index.md
- docs/handoffs/TASK-017.md
- docs/evals/agent-behavior-scorecard-template.md

This card is a revisit summary only. PROJECT_BOARD.md remains the source of truth for status, owner, locks, approved goals, and sequencing. docs/handoffs/index.md remains the routing layer. Do not add full OKRs, QA logs, plans, rationale, or implementation details here.
