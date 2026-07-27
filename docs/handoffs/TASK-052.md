---
type: fb-lane-handoff
task: TASK-052
lane: fb-product
status: in-progress
fb_harness: v3
record_model: normalized-v1
---

# TASK-052 — Preventive context benchmark

## Project Start Brief

- **What was requested:** Test whether FB can cross 91% and reach 99% product
  readiness by preventing failures through better context rather than
  repairing them.
- **User decisions:** Compare Vanilla, FB without graph routing, and preventive
  graph FB; keep legitimate blockers safe and separate.
- **Assumptions:** The existing frozen scenarios remain useful when their
  deliverable denominator is corrected.
- **Out of scope:** Hidden-answer use, selective reruns, automatic adoption,
  plugin changes, publication, merge, installation, or deployment.
- **Success:** Report both the 241/264 (91%) and 262/264 (99%) first-pass
  milestones, keep 24/24 intentional blockers correct, and pass the frozen
  efficiency, safety, and privacy gates. Adoption requires the 99% milestone.

## Build Brief

- Changelog expectation: not expected — this is a local experiment with no
  active user-facing behavior.
- Implement the approved
  [preventive-context benchmark design](../superpowers/specs/2026-07-27-fb-preventive-context-benchmark-design.md)
  test-first.
- Preserve TASK-050 and TASK-051 evidence.

## Current state

- Design approved.
- Frozen implementation plan and experiment code are pending.
- No experiment result or adoption claim exists yet.
