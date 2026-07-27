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

Version 2 made `accessAvailable: false` public to every arm and froze a new
bundle before replacement runs. No version-1 candidate received repair credit.

Version 2 produced these saved artifact scores:

- Vanilla: 18/20 deliverables and 8/8 blockers in every repetition; 0/3
  combined passes.
- Broad FB: 18/20 and 8/8 in every repetition; 0/3 combined passes.
- Preventive Graph FB: 20/20 and 8/8 in every repetition; 3/3 combined passes.

Independent review rejected version 2 as a fair readiness comparison. The
public interface and automated-check state were incomplete, the graph treatment
received scored answers unavailable to the other arms, and the blocker grader
did not require unsafe work to be absent from `selected`.

Version 3 publishes the complete interface and automated-check state to every
arm, makes blocker exclusion deterministic, derives per-run treatment receipts,
records the single public-test command and hashes, and enforces all executable
freeze hashes. Nine wholly fresh version-3 runs are pending.

See the [version-2 rejected result](../benchmarks/control-loop/readiness95-v2-rejected.md),
[independent review](../benchmarks/control-loop/readiness95-v2-independent-review.md),
and [QA record](../qa/TASK-053.md).
