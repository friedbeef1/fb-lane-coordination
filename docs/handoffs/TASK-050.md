---
type: fb-lane-handoff
task: TASK-050
lane: fb-product
status: implemented
fb_harness: v3
record_model: normalized-v1
review_state: not reviewable
---

# TASK-050 — Generic agent control loop and FB 0.5.0-beta

## Project Start Brief

- **What was requested:** Evaluate production-grade multimodal-agent practices
  and adopt the useful generic parts in FB.
- **User decisions:** Implement the approved bounded repository-local plan.
- **Assumptions:** The capabilities must work beyond image pipelines and remain
  optional inside the six-workstream model.
- **What FB will plan:** Routing, evidence, comparison, gates, diagnosis,
  configuration evolution, plugin guidance, and release preparation.
- **Out of scope:** Hosted telemetry, transcripts, mandatory agent-per-stage
  orchestration, autonomous promotion, merge, publication, installation, or
  deployment.
- **Success:** Deterministic focused contracts and independent review pass; one
  later release checkpoint is clean; release stops at **Ready to ship**.

## Build Brief

- Changelog expectation: required
- Add a rules-first generic control loop with flat clone-local stage events,
  pairwise evidence, layered gates, bounded diagnosis, frozen golden fixtures,
  isolated candidates, and exact Product promotion approval.
- Preserve the six workstreams, internal execution selection, repair budgets,
  technical identifiers, and **Push Live**.
- Release candidate: `0.5.0-beta+codex.20260726130257`.

## Brief Validation

- Status: pass
- Approved scope is implemented by the Task 1 and Task 2 candidates and routed
  through the canonical Task 3 documentation and plugin package.
- Remaining release evidence is explicitly separated below.

## Task Receipt

- Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#050-beta--2026-07-26)
- Changelog approval: approved — James, originating conversation, 2026-07-26
- Changed surfaces: control-loop runtime/contracts, session/MCP/doctor
  integration, canonical harness and skills, generated plugin package, active
  version metadata, and TASK-050 records.
- Verification: [TASK-050 QA](../qa/TASK-050.md)
- Quantified evidence: [controlled before/after experiment](../benchmarks/control-loop/README.md)
- Review state: not reviewable
- External gates: whole-branch review, one complete release checkpoint,
  review-branch push, and later explicit **Push Live**.
- Repository state: local candidate branch; no publication or deployment.
- Remaining owner/action: Product/BFM completes focused verification and review,
  completes whole-branch review, then runs the single release checkpoint.

## Release boundary

This handoff does not authorize merge, marketplace publication, plugin
installation, or deployment. Only **Push Live** authorizes those actions.
