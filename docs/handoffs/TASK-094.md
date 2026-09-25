---
type: fb-lane-handoff
task: TASK-094
lane: fb-product
status: staging-qa
record_model: normalized-v1
---

# Queue preview and existing-task adoption

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
- Changelog expectation: required at release; this is an unpublished candidate.
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

Canonical implementation and focused proof passed. Consumer adoption evidence
is tracked in [QA](../qa/TASK-094.md); real intake blockers are not concealed as
successful previews. Source baseline be6f5fb; installed plugin remains
0.10.1-beta+codex.20260923044148. Publication is not authorized by this task.

## Task Receipt

- Delivered: queue-specific approval rule and references in canonical and
  packaged BFM/Product/coordination skills and active harness guidance.
- Verification: root/package skill contract, 93 mirrors, changed-guide links,
  syntax and whitespace; fresh old/new skill scenario and candidate review.
- Evidence: [QA](../qa/TASK-094.md).
- Review state: not reviewable; guidance-only candidate, no app build.
- External gates: future publication/version/changelog/release checkpoint;
  Push Live not authorized here.
- Remaining owner/action: all four existing tasks adopted. Consumer Product/BFM
  owners retain the exact intake blockers in QA; complete real previews are
  still unproven. Future framework publication is separate.
- Repository state: local source candidate atop preserved TASK-093 commits;
  consumer managed edits coexist with their intentionally preserved active work.
