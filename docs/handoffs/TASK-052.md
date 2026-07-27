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
- **User decisions:** Compare autonomous Vanilla, autonomous FB without graph
  routing, and autonomous preventive graph FB; let each system choose its agent
  topology; use Features, Bugs, Tech, and Design scenario families; keep
  legitimate blockers safe and separate.
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
  through the
  [test-first implementation plan](../superpowers/plans/2026-07-27-fb-preventive-context-benchmark.md).
- Preserve TASK-050 and TASK-051 evidence.

## Current state

- Design approved.
- The controlled diagnostic is complete: Vanilla 183/264, broad-context FB
  195/264, and graph-routed FB 197/264 first-pass deliverables; every arm kept
  24/24 intentional blockers correct.
- From the graph baseline, 91% requires 44/67 avoidable failures prevented
  (65.7%); 99% requires 65/67 (97.0%).
- No preventive accuracy was assumed. The autonomous holdout that supplies
  observed prevention evidence recorded Vanilla 9/13 median, broad FB 9/13
  median, and preventive graph FB 13/13 median across three counted runs.
- Preventive graph ranged from 12/13 to 13/13: the 91% milestone was supported
  in every run, but 99% was not robust because one run missed a privacy blocker.
- Every arm chose one inline agent and one integration pass. Provider tokens
  and elapsed time were unavailable, so efficiency adoption remains blocked.
- The controlled fixtures use Features, Bugs, Tech, and Design. Earlier generic
  scenario results remain historical and are not pooled.
- No adoption is authorized.
