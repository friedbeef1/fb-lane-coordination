---
type: fb-lane-handoff
task: TASK-053
lane: fb-product
status: staging-qa
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

Version 3 published the complete interface and automated-check state to every
arm, made blocker exclusion deterministic, derived per-run treatment receipts,
recorded the single public-test command and hashes, and enforced all executable
freeze hashes before execution.

Nine wholly fresh version-3 runs then produced:

| Arm | Combined passes | Deliverables | Blockers | Median elapsed |
|---|---:|---:|---:|---:|
| Vanilla | 3/3 | 20/20 every run | 8/8 every run | 207.61 s |
| Broad FB | 3/3 | 20/20 every run | 8/8 every run | 228.74 s |
| Preventive Graph FB | 3/3 | 20/20 every run | 8/8 every run | 189.06 s |

The result is **parity on this fixed benchmark**. It does not show an FB
quality advantage, and the small topology-confounded timing sample does not
support a speed claim. No plugin adoption or product-process change follows
from this result.

See the [version-3 result](../benchmarks/control-loop/readiness95.md),
[independent result review](../benchmarks/control-loop/readiness95-v3-independent-review.md),
and [QA record](../qa/TASK-053.md).

## Task Receipt

- **Approved brief:** Compare Vanilla, Broad FB, and Preventive Graph FB at a
  fixed 95% deliverable gate plus mandatory blocker gate.
- **Candidate range:** `d16f745` through the version-3 result closeout on
  `codex/fb-preventive-context-benchmark`.
- **Changed surfaces:** TASK-053 fixture, prompts, grader, freeze, focused
  contract, result documentation, QA, board, and handoff routing.
- **Execution:** three fresh isolated repetitions per arm; one candidate and
  one recorded public test per subject; no repair or selective rerun.
- **Failures and recovery:** versions 1 and 2 were excluded rather than
  repaired after methodology defects were found. Version 3 was frozen only
  after a bounded independent pre-run review returned GO.
- **Verification:** focused contract 9/9; all nine evidence bindings and grades
  recomputed; independent result review ACCEPT with 0 Critical and 0 Important
  findings.
- **Review state:** not reviewable — benchmark evidence only; there is no app
  candidate or review environment.
- **External gates:** no push, merge, publication, plugin installation, or
  deployment authorized.
- **Remaining owner/action:** Product may design a different real-project
  incremental-benefit study only if its result would change a product decision.

## Brief Validation

- **Result:** pass
- **Satisfied:** frozen threshold, equivalent scored facts, isolated subjects,
  one-pass scoring, blocker integrity, reproducible evidence, honest exclusions,
  and independent review.
- **Not established:** token savings, causal graph advantage, real-project
  production readiness, or universal FB superiority.
