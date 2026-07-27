---
type: fb-lane-handoff
task: TASK-051
lane: fb-product
status: ready
fb_harness: v3
record_model: normalized-v1
review_state: not reviewable
---

# TASK-051 — Context and repair efficiency

## Project Start Brief

- **What was requested:** Make graph engineering save materially more raw time
  and tokens while preserving FB reliability.
- **User decisions:** Keep the graduated graph and safety controls; target at
  least 10% lower raw tokens and elapsed time than no-FB work.
- **Assumptions:** Context delta compression and repair reuse are the primary
  opportunities; internal execution selection remains automatic.
- **Out of scope:** Weaker safety controls, transcript capture, hosted
  telemetry, selective benchmark reruns, merge, publication, installation, or
  deployment.
- **Success:** Both frozen modeled and observed real-Codex gates pass before
  canonical/plugin adoption.

## Build Brief

- Changelog expectation: not expected — experimental candidate behavior is not
  user-visible unless both adoption gates pass.
- Implement the approved
  [context and repair efficiency plan](../superpowers/plans/2026-07-27-fb-context-repair-efficiency.md).
- Preserve reviewed TASK-050 evidence and active policy until adoption passes.

## Brief Validation

- Status: pass
- The plan has exact candidate interfaces, frozen thresholds, conditional
  adoption, privacy boundaries, and release exclusions.

## Task Receipt

- Changelog: not required — candidate implementation and evidence are
  experimental until every adoption predicate passes.
- Review state: not reviewable
- External gate: explicit **Push Live** after a separately authorized release.
- Repository state: In Progress on `codex/fb-context-repair-efficiency`.
- Remaining owner/action: FB-Tech implements focused slices; Product applies
  or rejects the candidate from frozen evidence.

