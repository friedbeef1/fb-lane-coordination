---
type: fb-lane-handoff
task: TASK-056
lane: fb-product
status: staging-qa
fb_harness: v3
record_model: normalized-v1
---

# TASK-056 — Prospective repair-efficiency benchmark

## Goal Alignment Session

Product OKR: Reduce FB coordination and repair overhead while preserving or improving product readiness, safety, and explicit release control.
Lane OKR Fit: aligned
Mini-loop Evidence: Twelve counted runs measured 23.6% lower wall time, 15.8% fewer provider tokens, fewer repairs, and higher mean readiness for the efficient Graph treatment.
Evidence Against Product OKR: The efficient treatment used slightly more first-pass time and tokens; the measured benefit came from preventing repeated repair context.

## Project Start Brief

- **Objective:** Measure actual time and token use after TASK-055 rather than
  relying on a forecast.
- **Comparison:** fresh Vanilla Codex versus fresh efficient-Graph FB on the
  same six TASK-054 historical tasks.
- **Treatment:** efficient Graph uses bounded execution slices and a fresh
  criterion-specific delta repair. Vanilla uses ordinary Codex task context.
- **Metrics:** observed wall time; provider-reported input, cached input,
  output, and total tokens; first-pass and repair totals; readiness; accepted
  outcomes; repair incidence. Any currency figure is labeled as an estimate,
  not an actual Codex subscription charge.
- **Execution:** one excluded real-Codex shakedown, then exactly 12 counted runs
  once. Valid failures and unfavorable outcomes remain.
- **Safety:** isolated exported fixtures only; source repositories remain
  read-only. No network/provider writes, production change, deployment,
  publication, merge, or release.

## Build Brief

- Reuse the TASK-054 task registry, exporters, grader, and proven Codex JSONL
  usage parser.
- Use a new experiment ID and evidence directory; never modify TASK-054.
- Stop each arm after one repair. Efficient Graph repairs are fresh tasks with
  delta-only context and rerun only the failed criterion.
- Freeze schedule and treatment receipts before counted spend.
- Changelog expectation: not expected — benchmark-only internal evidence does
  not change shipped user behavior.

## Approval

Approved by James in the parent task on 2026-07-28: “Lets do that. Measure time
and cost again.”

## Task Receipt

- **Branch:** `codex/fb-real-work-paired-benchmark`
- **Review state:** not reviewable — evidence experiment
- **Result:** Efficient Graph used 15.8% fewer provider-reported tokens and
  23.6% less wall time, reduced repair tokens 69.3%, and produced 3/6 accepted
  outcomes versus Vanilla's 1/6.
- **Cost:** standard API-equivalent estimate $6.15 versus $7.60; actual billed
  Codex subscription cost unavailable.
- **Evidence:** [result](../benchmarks/repair-efficiency/README.md);
  [machine-readable data](../benchmarks/repair-efficiency/results.json);
  [QA](../qa/TASK-056.md).
- **Current:** completed evidence study in Staging QA.
- **External gates:** no push, merge, publication, plugin installation,
  release, production change, or deployment authorized
