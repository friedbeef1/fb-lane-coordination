---
type: fb-lane-handoff
task: TASK-049
lane: fb-product
status: checking
approval: approved
record_model: normalized-v1
okr_fit: aligned
---

# TASK-049 — Graph-Directed Plugin Navigation

## Approved Decision

Integrate the demonstrated TASK-048 behavior as a read-only Codex-plugin route:
use a minimal graph packet to select authoritative evidence, not to replace it.

## Scope

- Add MCP `fb_project_context(taskId, question, workspacePath?)`.
- Refresh deterministic Level 1 derived state automatically.
- Return compact facts and at most three readable authoritative sources.
- Fall back to board → index → handoff → card when the task is unknown or graph
  state is unhealthy, ambiguous, contradictory, or insufficient.
- Align canonical and packaged harness pages and active skills mechanically.
- Accept safe repository-specific task prefixes such as `MEJA-*`.
- Release the verified candidate as `0.4.0-beta+codex.20260726101229`.

## Out of Scope

Semantic graph extraction, graph databases, hosted services, transcript
capture, inferred approval, plugin publication, release, merge, deployment, or
consumer-project installation.

## Acceptance

- Targeted packets never treat graph output as source of truth.
- Unknown task IDs do not guess.
- Existing repositories with safe project-specific task IDs receive the same
  targeted graph route.
- Stale derived state refreshes from authoritative records.
- Root/package focused contracts, syntax, package parity, and whitespace pass.

## Build Brief

- Changelog expectation: required
- Deliver the read-only MCP context tool, capped task-specific routing,
  automatic deterministic refresh, safe fallback, canonical guidance, and
  generated plugin mirrors under the 0.4.0-beta release line.
- Publish and install only after the release checkpoint, approved changelog
  wording, and explicit **Push Live**.

## Evidence

- [TASK-048 controlled experiment](../experiments/TASK-048-graduated-project-graph-pilot.md)
- Focused plugin contract: `tools/fb-project-graph-plugin.test.cjs`
- [Focused QA](../qa/TASK-049.md)

## Task Receipt

- Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#040-beta--2026-07-26)
- Changelog approval: approved — James, originating conversation, 2026-07-26
- Delivered: bundled MCP context tool, graph runtime, nine-page harness route,
  active workstream guidance, generated package mirrors, and fallback install
  guidance.
- Verification: [TASK-049 focused QA](../qa/TASK-049.md)
- Review state: staging candidate
- Remaining owner/action: complete the release checkpoint, then honor the
  already approved **Push Live** boundary.

## Release boundary

The candidate may publish only after the release checkpoint. Refreshed
changelog wording and **Push Live** are approved.
