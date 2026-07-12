# FB-Product Workstream Status

Last Updated: 2026-07-13
Lane: FB-Product

## Current Summary
TASK-CODEX-ONLY-001 is in Staging QA on `codex/codex-only-cut`. Clean-checkout proof passed: root/package 24-check CLI suites, syntax, CLI/test byte parity, validator, doctor, whitespace check, manifest/MCP JSON parsing, and a disposable-`CODEX_HOME` local marketplace/plugin install for `fb-lane-coordination@fb-lane` version `0.2.0-beta+codex.20260707114230`. Product must review the branch diff; publishing and releasing remain explicitly unauthorized.

TASK-017 remains the active reusable framework hardening task. Product/BFM now has a generic Markdown-only eval scorecard path for repeated agent-behavior failures via `Loop Learning: propose eval`, phased approval-autonomy guidance that starts in Shadow Approval before any bounded self-approval, and public version positioning for `FB-Lane 0.2.0-beta: Loop Engineering public beta`.

## Already Executed By Product/BFM
- Added the compact `Loop Learning` closeout field across reusable FB-Lane surfaces.
- Added `docs/evals/agent-behavior-scorecard-template.md` and the packaged plugin mirror so Product/BFM can propose a lightweight scorecard before heavier tooling.
- Kept eval runners, dashboards, numeric scoring, CI eval jobs, and bigger `doctor` rules out of scope unless separately proposed and approved.
- Added approval-autonomy phases across docs, templates, Product/BFM skills, generated Product prompts, bootstrap output, and packaged plugin mirrors.
- Completed Codex-only Staging QA proof in a clean checkout and a temporary Codex home; retained Product branch-diff review and the no-publish gate.
- Added `docs/versioning.md` with the v1-to-latest before/after and linked it from public docs.

## Still Pending / Blocked
- Product review of TASK-017 / PR #31 before merge.
- Commit/push of the current generic eval scorecard, approval-autonomy, and version-positioning update after verification.

## Evidence Links
- PROJECT_BOARD.md
- docs/handoffs/index.md
- docs/handoffs/TASK-017.md
- docs/evals/agent-behavior-scorecard-template.md
- docs/versioning.md

This card is a revisit summary only. PROJECT_BOARD.md remains the source of truth for status, owner, locks, approved goals, and sequencing. docs/handoffs/index.md remains the routing layer. Do not add full OKRs, QA logs, plans, rationale, or implementation details here.
