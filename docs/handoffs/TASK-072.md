---
type: fb-lane-handoff
task: TASK-072
lane: fb-product
status: implemented
okr_fit: aligned
approval: approved
fb_harness: v3
record_model: normalized-v1
---

# TASK-072 — Lifecycle truth and historical retrieval

Release candidate: `0.5.6-beta+codex.20260804045203`

## Goal Alignment Session

Product Goal: Reduce routine FB context overhead without losing durable history or release safety.
Workstream Goal: Make active state the default orientation and historical evidence a precise on-demand read.
Lane OKR Fit: aligned
User Approval Needed: no — James approved execution of this Product/BFM plan.
Mini-loop Evidence: Lifecycle diagnostics, a 21-task evidence reconciliation, compact current-state projections, and exact archive retrieval are implemented with focused tests.
Evidence Against Product OKR: None identified.

## Project Start Brief

- **What you asked for:** Fix the cause of bloated Product orientation while
  preserving access to completed work whenever it matters.
- **Your decisions:** Ready means queued for Product intake; Product decides
  disposition and sequence; only `$bfm` starts reconciliation and execution.
- **Assumptions to confirm:** None remaining for the implementation candidate.
- **What FB will plan:** Lifecycle truth, current projections, archived lookup,
  active guidance, packaging, and release evidence.
- **Out of scope:** Deleting history, changing identifiers, publication, merge,
  reinstall, or deployment.
- **Success looks like:** Current orientation is small and truthful; completed
  evidence remains exactly retrievable; canonical and package guidance agree.
- **Next action:** Run the approved release checkpoint.

## Build Brief

1. Treat ready handoffs as Product intake candidates, never executable scope.
2. Diagnose lifecycle inconsistencies without silently changing state or locks.
3. Preserve completed board detail in durable monthly archives and retrieve it
   through archive, index, exact handoff, QA, changelog, and Git citations.
4. Project genuine current state into bounded packets and managed workstream
   cards, retaining three recent terminal references.
5. Align active docs, Product/BFM/setup/coordination skills, plugin metadata,
   and mechanically generated package mirrors for FB 0.5.6-beta.

Changelog expectation: required
Release checkpoint: authorized after changelog approval

## Task Receipt

- **Approved brief:** Implement the lifecycle/history plan without deleting
  durable evidence or changing public technical identifiers.
- **Changed surfaces:** CLI lifecycle/context/graph behavior, focused tests,
  board archive and projections, active harness and skills, package mirrors,
  plugin metadata, release docs, and changelog.
- **Changelog:** updated — [FB 0.5.6-beta](../../CHANGELOG.md#056-beta--2026-08-04).
- **Changelog approval:** approved by James on 2026-08-04.
- **Review state:** not reviewable.
- **External gates:** Final release validator is now authorized;
  publication, merge, marketplace upgrade, reinstall, and deployment remain
  unauthorized.
- **Remaining owner/action:** Product/BFM runs the one release checkpoint.

## Brief Validation

Status: pass

- **Satisfied:** Lifecycle reconciliation is evidence-led; active state stays
  visible; historical records remain exact and queryable; ready semantics and
  `$bfm` authority are explicit.
- **Missing:** Final release-validator evidence before **Ready to ship**.
- **Next action:** Run the one authorized release checkpoint.

## Verification Handoff

Candidate: `codex/TASK-072-lifecycle-history` at the committed release slice.
System verification: focused lifecycle, board-context, project-graph,
six-workstream, beginner-experience, metadata, package parity, syntax, link,
and whitespace checks are recorded in [TASK-072 QA](../qa/TASK-072.md).
Known limits: The complete release validator, publication, active installation,
and fresh-task behavior are not claimed before their explicit gates.

### Release checkpoint failure evidence

- **Failure:** The initial full release-validator pass stopped in the root CLI
  contract after coordination-skill compaction.
- **Observed:** The compact skill omitted direct `start.md` and default `status`
  routes; other focused contracts still expected stale wording or duplicated
  workflow detail.
- **Cause:** Canonical skill guidance was reduced correctly, but several legacy
  assertions still tested exact duplicated prose instead of factual links and
  structural behavior.
- **Recovery attempted:** Restored the two concise navigation routes, retained
  the ready-for-intake boundary, updated stale structural assertions, and
  regenerated all declared package mirrors once for the consolidated repair.
- **Result:** The failed CLI proof and directly affected positioning,
  efficiency, worktree, changelog, and six-skill contracts pass; the final full
  validator pass remains pending.
- **Reusable lesson:** When a frequently loaded skill becomes a canonical route,
  tests should verify its links and role boundary rather than require copied
  operating-manual prose.

## Product/BFM Closeout

Status: Checking — release checkpoint.
Actioned By: FB-Product / BFM.
Result: The local candidate keeps routine orientation current-state focused and
preserves complete on-demand historical retrieval.
Remaining: One release checkpoint, then separate **Push Live** authority for
external delivery.
