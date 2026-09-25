---
type: fb-lane-handoff
task: TASK-094
lane: fb-product
status: in-progress
record_model: normalized-v1
approval: approved
---

# Queue preview and existing-task adoption

Local plugin candidate: `0.10.2-beta+codex.20260925083556`.
Published/installed: `0.10.1-beta+codex.20260923044148`.

## Project Start Brief

James approved the queue-preview rollout on 2026-09-25 after verification that
the old no-second-approval guidance remains in all four consumers. Source input:
`/Users/jamesyeang/Documents/fb-lane/docs/handoffs/TASK-FB-USER-BFM-QUEUE-PREVIEW-20260925.md`.
The outcome is a complete, plain-language queue and one explicit okay before
its Include now scope executes. Existing chats, app changes and safety gates
remain intact. This explicit implementation approval applies to this scoped
change, not to the consumers' pending backlogs.

## Build Brief

- Include now: canonical approval guidance, BFM/Product skill references,
  focused proof, generated plugin mirrors, adoption in the four exact existing
  Product/BFM tasks (Unmirror, Memory App, MÉJA, Tough Talks).
- Sequence: prove old behavior; update the canonical contract; synchronize;
  instruct existing tasks to persist and demonstrate without executing intake.
- Reuse the existing complete frozen intake. No second scanner or new CLI.
- Verification: focused skill/structural contracts, package parity, links,
  whitespace, and per-consumer adoption acknowledgement/evidence.
- Out of scope: app source, recreated tasks, plugin publication/install,
  merge, deployment and any consumer backlog execution.
- Changelog expectation: required
- Success: every preview lists all dispositions, waits for okay, invalidates
  approval on material change and keeps Push Live separate.

## Goal Alignment Session

Product Goal: Predictable Product-controlled execution.
Workstream Goal: Make the intended queue visible before implementation.
Lane OKR Fit: aligned.
User Approval Needed: no for this approved implementation; yes for future queues.
Mini-loop Evidence: Old active guidance explicitly bypasses the requested okay.
Evidence Against Product OKR: None; avoid per-step approval or a second scanner.

## Status

### Approved completion amendment — 2026-09-25

James authorized repairing all four intake failures and making the projects
usable with the updated FB version. Extend this task through shared intake
runtime repairs, exact consumer coordination repairs, complete real previews,
and preparation of the next plugin candidate. Users can reorder, defer, remove
or add proposed items before approval; Product rechecks dependencies and gates
and shows the revised queue. Existing tasks remain in use. Consumer application
feature work is outside this repair. Prepare publication/install evidence;
Push Live remains the final release boundary.

Canonical implementation and focused proof passed. Consumer adoption evidence
is tracked in [QA](../qa/TASK-094.md); real intake blockers are not concealed as
successful previews. Source baseline be6f5fb; installed plugin remains
0.10.1-beta+codex.20260923044148. Publication is not authorized by this task.

## Task Receipt

- Approved brief and decisions: James approved the queue preview, editable priorities, and all four consumer intake repairs; backlog execution remains excluded.
- Confirmed assumptions and approved scope changes: completion amendment includes planning-only runtime and historical-worktree receipt consistency, preserving existing task IDs and dirty app changes.
- Branch, source commits, and changed surfaces: codex/TASK-093-consumer-rollout atop f70a0a2; runtime, regression tests, active guidance, generated plugin mirrors and 0.10.2 metadata.
- Checks, failures, recovery, and results: 28 intake checks pass after reproducing missing dispositions and false historical worktree drift; exact consumer results are in QA.
- Review state, direct links, limits, and external gates: not reviewable as an app build; [QA evidence](../qa/TASK-094.md); all-consumer health and final release checkpoint are still pending.
- Remaining owner and action: Product/BFM completes exact consumer intake recovery and release preparation; Push Live remains required before publication.
- Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#0102-beta-2026-09-25)

- Delivered: queue-specific approval rule and references in canonical and
  packaged BFM/Product/coordination skills and active harness guidance.
- Verification: root/package skill contract, 93 mirrors, changed-guide links,
  syntax and whitespace; fresh old/new skill scenario and candidate review.
- Evidence: [QA](../qa/TASK-094.md).
- Review state: not reviewable; framework runtime/guidance candidate, no app build.
- External gates: future publication/version/changelog/release checkpoint;
  Push Live not authorized here.
- Remaining owner/action: MÉJA and TT complete real previews; Memory App and
  Unmirror recovery remain in progress. Future framework publication is separate.
- Repository state: local source candidate atop preserved TASK-093 commits;
  consumer managed edits coexist with their intentionally preserved active work.
