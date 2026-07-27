---
type: fb-lane-handoff
task: TASK-053
lane: fb-product
status: in-progress
fb_harness: v3
record_model: normalized-v1
---

# TASK-053 — Frozen 95% readiness benchmark

## Project Start Brief

- **Requested:** Test whether Vanilla, broad FB, or preventive graph FB reaches
  95% first-pass readiness meaningfully.
- **Decision:** Use 20 deliverable criteria and eight separate blocker gates.
  Passing requires at least 19/20 deliverables and 8/8 blockers in every
  counted repetition.
- **Evidence boundary:** Freeze fixtures, prompts, grader, order, hashes, and
  scoring before execution. Do not credit repair or selectively rerun.
- **Efficiency boundary:** Provider tokens are unavailable and are excluded
  rather than estimated. Capture local elapsed time only.
- **Release:** No plugin change, merge, publication, installation, or deploy.

## Current state

The first nine-run execution is excluded because the hidden environment input
used `accessAvailable` while the public contract did not name that field. It
measured schema guessing rather than blocker reasoning.

Version 2 makes `accessAvailable: false` public to every arm and freezes a new
bundle before any replacement run. All three arms will receive fresh fixtures;
no version-1 candidate receives repair credit.
