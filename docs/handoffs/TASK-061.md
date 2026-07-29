---
type: fb-lane-handoff
task: TASK-061
lane: fb-product
status: staging-qa
approval: approved
fb_harness: v3
record_model: normalized-v1
---

# TASK-061 — Compact active board context

## Goal Alignment Session

Product OKR: Reduce FB coordination and context overhead while preserving shared-project safety, durable evidence, and explicit release control.
Lane OKR Fit: aligned
Mini-loop Evidence: The current board is about 171 KB while its active table is about 24 KB, so full-file orientation carries materially more context than current coordination requires.
Evidence Against Product OKR: A complicated archival service would cost more process than it saves; the approved solution is deliberately mechanical and repository-local.

## Project Start Brief

- **Requested:** Prevent a long-lived board from consuming excessive agent
  context as completed history accumulates.
- **Decision:** Agents load a generated active-only board packet. The Markdown
  board remains authoritative, and older terminal entries move to monthly
  Markdown archives only after a conservative size threshold.
- **Safety:** Active ownership, locks, blockers, staging candidates, and ready
  work remain visible. Handoffs, QA, Git history, and archived content are
  preserved.
- **Out of scope:** Database, dashboard, hosted service, automatic deletion,
  release, merge, publication, or deployment.
- **Success:** Routine orientation no longer requires reading the full board;
  archive behavior is exact, bounded, and idempotent.

## Build Brief

- Add one focused board-context module mirrored in the plugin.
- Make the existing status surface expose compact active context without
  requiring users to choose an FB mode.
- Archive older terminal rows and matching detail blocks only when the board
  exceeds the threshold, retaining three recent terminal rows.
- Invoke compaction at normal board mutation/closeout boundaries rather than
  adding a new maintenance ceremony.
- Route active agent guidance through the compact packet; direct full-board
  reads become a fallback for contradictions or archive investigation.
- Changelog expectation: not expected — this is an internal context-efficiency
  correction without a published plugin release in this task.

## Task Receipt

- Delivered: bounded CLI and MCP active-board context; automatic threshold
  archival on completed-task closeout; canonical and packaged operating
  guidance.
- Changed surfaces: root and packaged CLI/runtime, focused tests, managed
  bootstrap route, record guidance, setup skill, examples, and package
  manifest.
- Checks: 8/8 focused board-context tests and 70/70 affected CLI tests passed.
- Evidence: [TASK-061 verification](../qa/TASK-061.md)
- Repository state: isolated branch
  `tech/TASK-061-compact-board-context`; no push, merge, or publication.
- Remaining owner/action: Product/BFM may review and integrate this stacked
  candidate after TASK-060.
- Changelog: not required — no installed release is authorized.
- Review state: not reviewable
- External gate: no push, merge, plugin publication, installation, or
  deployment.

## Brief Validation

- Result: pass
- Satisfied: active-only bounded context, visible active locks, exact
  threshold archival, three retained terminal rows, idempotent retry, CLI/MCP
  parity, and mechanical package generation.
- Missing: none within the approved local scope.
