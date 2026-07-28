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

## Goal Alignment Session

Product OKR: Reduce FB coordination and repair overhead while preserving or improving product readiness, safety, and explicit release control.
Lane OKR Fit: aligned
Mini-loop Evidence: Focused contracts, package parity, independent review, and the release checkpoint tested the bounded control loop without weakening release authority.
Evidence Against Product OKR: The graduated benchmark found excess-control overhead, so its faster-decay policy was rejected rather than adopted.

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
- Graduated evidence: [three-arm mixed-complexity experiment](../benchmarks/control-loop/graduated.md)
- Rejected policy evidence: [four-arm fast-decay experiment](../benchmarks/control-loop/fast-decay.md)
  (replacement result; the invalid `ebe22ed` result is identified by hash in
  the report). Independent review of the repaired evidence and metadata
  binding passed with zero Critical or Important findings. The adoption gate
  still failed at 85 excess-control cases versus the frozen maximum of 81, so
  no operating-guidance or plugin change was adopted.
- Superseded evidence: the original graduated result from `06b292d` is
  non-publishable because the process-all arm omitted the promised final QA.
  The linked replacement is the only current graduated result.
- Review state: not reviewable
- External gate: explicit **Push Live**.
- Repository state: **Ready to ship** after independent review accepted the
  graduated benchmark as transparent deterministic modeled evidence; no merge,
  publication, installation, or deployment.
- Remaining owner/action: James may inspect the GitHub evidence and say
  **Push Live** to authorize release.

## Release boundary

This handoff does not authorize merge, marketplace publication, plugin
installation, or deployment. Only **Push Live** authorizes those actions.
