---
type: fb-lane-handoff
task: TASK-091
lane: fb-product
status: done
approval: approved
record_model: normalized-v1
fb_harness: v3
worktree: /private/tmp/fb-graph-loops
sensitive: false
work_types: runtime, tests, coordination, plugin
surface: exact-project onboarding and project graph contract
---

# TASK-091 — Versioned graph contract and legacy exact-task adapter

Candidate build: `0.10.0-beta+codex.20260827100222`.

## Goal Alignment Session

Product Goal: Make FB's product-delivery graph deterministic and inspectable
without weakening exact-project identity, verification, or release authority.

Lane OKR Fit: aligned.

Mini-loop Evidence: The exact FB project reproduced the legacy null-project-ID
failure; a focused regression now passes while conflicting IDs still fail.

Evidence Against Product OKR: None identified. A monolithic graph/loop rewrite
would increase migration risk, so this run stops after the contract slice.

## Approved Decision

Preserve and reconcile the original seven pinned sidebar tasks. Then implement
only the first Discovery slice: one versioned graph/state/transition contract
with v1 read compatibility and canonical new writes.

## Build Brief

- Accept a pinned legacy `projectId: null` only when one saved project, exact
  canonical root, complete local candidates, native pinned metadata, exact
  read-thread details, titles, and stable IDs all agree.
- Continue rejecting any conflicting non-null project ID, root mismatch,
  missing candidate, missing detail, duplicate ID, or title disagreement.
- Recognize the historical `FB-LANE` prefix only to reuse and migrate proven
  stable task IDs; never create replacements from guessed titles.
- Add a machine-readable versioned contract for canonical node types, edge
  types, aliases, directionality, entity-scoped states, terminal states, and
  allowed transitions.
- Preserve v1 aliases for reads. New contract-backed writes emit canonical
  types and states.
- Treat approval, verification, release, and **Push Live** as authority that a
  graph edge or state transition cannot infer or grant.
- Defer loop-run entities, scheduler expansion, and orchestration decomposition.

Changelog expectation: required.

## Assumptions

- The current 0.9.4 branch is the canonical source lineage for this candidate.
- Existing v1 graph artifacts remain valid inputs.
- A standalone clone under `/private/tmp` prevents marketplace-source mutation.

## Dependencies

- [Discovery recommendation](TASK-FB-GRAPH-LOOPS-20260826.md)
- Existing graph compiler and validation runtime.
- Strict onboarding receipt for the exact FB project.

## Acceptance Criteria

- The seven original task IDs reconcile with no replacement or duplicate.
- Invalid node/edge types, wrong directionality, invalid transitions, ambiguous
  aliases, and authority inference fail closed with actionable diagnostics.
- Existing v1 types and aliases remain readable.
- Contract-backed new writes use canonical names.
- Root and packaged focused contracts, package parity, affected syntax, links,
  and whitespace pass.

## Verification Plan

Use RED/GREEN proof for the onboarding compatibility case and graph contract.
Run one whole-candidate review after both slices, then one final release
checkpoint only if the candidate remains release-worthy.

## Scope Boundaries

No graph database, transcript capture, consumer project mutation, task
replacement, global plugin installation, merge, publication, or live release.

## Brief Validation

Result: pass.

Satisfied criteria and evidence: User approval, exact-project identity, source
provenance, Product disposition, scope, safety boundaries, acceptance criteria,
and focused proof are explicit.

Missing criteria and next actions: None for the approved implementation scope;
the release checkpoint and **Push Live** remain separate gates.

Approved scope-change references: James's current-task approval of the legacy
identity adapter and the Discovery recommendation.

## Task Receipt

Approved brief and decisions: Preserve the existing task suite and implement
the compatibility-first graph contract only.

Confirmed assumptions and approved scope changes: Loop-run evidence and orchestration
decomposition are deferred; no release is authorized.

Branch, source commits, and changed surfaces: `codex/TASK-091-graph-contract`;
identity repair `67030fe`, graph candidate `b4f56e7`, record normalization through
`a47bf41`; onboarding, graph contract/runtime/tests, plugin package,
documentation, and release records.

Checks, failures, recovery, and results: Focused graph proof passed 72 checks;
root/package onboarding passed 76 checks plus both native contracts; metadata,
91-file package parity, syntax, and whitespace passed. One stale metadata
assertion batch was corrected without changing runtime behavior. GitHub's first
readiness run found that the documented archive fallback omitted the new graph
contract dependencies; one focused repair added them and its clean-room eval
proof passed 19/19. See
[TASK-091 QA](../qa/TASK-091.md).

Review state, direct links, limits, and external gates: completed build. No
preview is applicable to this nonvisual plugin slice. The approved **Push Live**
release completed through [PR #70](https://github.com/friedbeef1/fb-lane-coordination/pull/70).

Repository state: reviewed candidate `5bdcecd`, ancestry-only identical-tree
refresh `e1db933`, and public `main` merge `e1fcac5`.

Remaining owner and action: None for TASK-091. Open a new Codex task so the
installed 0.10.0 skills and MCP runtime load.

Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#0100-beta--2026-08-27).

External gates: complete — James explicitly said **Push Live**; PRs #69 and
#70, Git marketplace publication, reinstall, and installed-runtime verification
completed without consumer-project mutation.

Remaining owner/action: none for TASK-091; a fresh Codex task must load the
replaced plugin before further plugin-dependent work.

## Live release verification

- PR #69 merged as `4527b6aa8167ba1d68acdbfc2bdf23ed54cb57f4`.
- PR #70 merged the reviewed candidate as
  `e1fcac5f41e0b040983d3808c90269c79e08fe32` after an ancestry-only refresh
  proved the exact same tree hash and passed GitHub readiness.
- The configured `fb-lane` Git marketplace now tracks `main` at `e1fcac5`.
- Codex reports `0.10.0-beta+codex.20260827100222` installed and enabled.
- All 91 declared package files plus three distribution manifests are
  byte-identical between marketplace and installed cache: 94/94.
- Installed manifests and graph contract JSON parse; required skills exist;
  installed runtime modules pass syntax; bundled MCP returns 14 tools including
  `fb_project_context`.
- This task remains loaded from 0.9.4. A new Codex task is required.

## Links

- [Board](../../PROJECT_BOARD.md#task-091---versioned-graph-contract-and-legacy-exact-task-adapter)
- [QA](../qa/TASK-091.md)
