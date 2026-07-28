---
type: fb-lane-handoff
task: TASK-055
lane: fb-product
status: staging-qa
fb_harness: v3
record_model: normalized-v1
---

# TASK-055 — Repair-context efficiency

## Project Start Brief

- **Requested:** Apply the six changes proposed after TASK-054 so FB preserves
  first-pass context savings instead of losing them during repair.
- **Evidence:** TASK-054 measured Graph first-pass tokens 20.6% below Vanilla,
  but Graph repair tokens 161.9% above Vanilla. The largest repair sessions
  reloaded accumulated context and often produced no readiness improvement.
- **Scope:** criterion-specific public failure evidence; fresh delta repair
  packets; changed-file, decision, proof, and correction-only context; stop
  without a concrete correction; retain upfront bounded execution slices; mark
  no-improvement repair as a harness failure.
- **Out of scope:** altering TASK-054 evidence, rerunning paid Codex subjects,
  changing safety gates, publishing the plugin, release, merge, deployment, or
  provider/production action.
- **Success:** deterministic contracts prove the packet excludes accumulated
  history, stops unactionable repair, and ends no-change/no-improvement loops;
  canonical and packaged guidance agree.

## Build Brief

- Implement the repair contract in the existing efficiency module rather than
  the frozen TASK-054 runner.
- Preserve `planExecutionSlices` as the upfront decomposition mechanism.
- Generate declared plugin mirrors mechanically after canonical changes.
- Verification: focused efficiency contract, package-context two-speed proof,
  package parity, affected syntax, and whitespace only.
- Changelog expectation: required — this changes user-visible BFM repair
  behavior and packaged plugin guidance.

## Brief Validation

Status: **pass**

- The implementation is directly supported by measured TASK-054 repair
  evidence.
- The frozen unfavorable result remains unchanged.
- Existing privacy, auth, payment, destructive-data, provider, migration, and
  release gates remain intact.

## Task Receipt

- **Branch:** `codex/fb-real-work-paired-benchmark`
- **Review state:** not reviewable — harness behavior and documentation change
- **Delivered:** reusable root/package repair packet and outcome contracts;
  canonical/package workflow, guardrails, and BFM skill guidance.
- **System checks:** focused root/package gate passed 26/26; all 48 declared
  package mirrors match; affected Node syntax and whitespace passed.
- **Current:** local candidate complete in Staging QA.
- **External gates:** no paid benchmark rerun, push, merge, publication,
  installation, release, or deployment authorized
- **Changelog:** updated —
  [CHANGELOG.md](../../CHANGELOG.md#050-beta-repair-efficiency-update--2026-07-28)
- **Changelog approval:** approved — James requested the framework, plugin,
  changelog, artifacts, and GitHub update in the originating task on
  2026-07-28.

## Proposed changelog wording

### Repair context efficiency

- **What changed:** FB repairs now use a fresh criterion-specific delta packet
  containing only the failed proof, changed files, relevant decisions, and one
  concrete correction.
- **Why it matters:** Failed checks no longer justify replaying accumulated
  conversation history or open-ended rediscovery; unchanged or unimproved
  repairs stop as harness failures.
- **Compatibility:** Existing commands, plugin identifiers, safety gates, and
  execution-slice behavior remain unchanged.
- **Installation or upgrade:** No action yet. This wording would enter the next
  approved plugin release and apply after upgrade.

## Evidence interpretation

The implementation addresses the measured cause, but it does not retroactively
change TASK-054 or prove the forecast token saving. The next paid paired run is
justified only after changelog approval and an explicit spend decision.
