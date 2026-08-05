---
type: fb-lane-handoff
task: TASK-074
lane: fb-product
status: done
okr_fit: aligned
approval: approved
fb_harness: v3
record_model: normalized-v1
---

# TASK-074 — Graph Engineering positioning

Release candidate: `0.5.8-beta+codex.20260804153114`

## Intake Snapshot

| Workstream | Ready inputs | Disposition |
|---|---:|---|
| Product/User | 2 | Include now — Graph Engineering positioning and industry-context amendment |
| Business | None | None relevant |
| Design | None | None relevant |
| Tech | None | None relevant |
| Discovery | None | None relevant |
| Bugs | None | None relevant |

Snapshot boundary: the original Product positioning handoff plus the 2026-08-05
industry-context amendment supplied before this `$bfm` invocation. Later
ordinary handoffs wait for the next cycle.

## Goal Alignment Session

Product Goal: Make FB understandable and useful to everyday Codex users.
Workstream Goal: Establish Graph Engineering as the accurate headline category.
Lane OKR Fit: aligned
User Approval Needed: no — James invoked `$bfm` on the ready Product handoff.
Mini-loop Evidence: Existing graph runtime, six workstreams, handoffs, BFM
reconciliation, verification, and release boundaries already support the model.
Evidence Against Product OKR: None identified.

## Project Start Brief

### What you asked for

Give Graph Engineering the primary spotlight throughout FB and explain the
relationship between the graph, workstream loops, `$bfm`, and **Push Live**.

### Your decisions

- Primary tagline: **Graph Engineering for Everyday People**.
- FB is an open-source Codex plugin that turns scattered AI conversations into
  a living product-delivery graph.
- The graph is the map; loops are how work moves and learns inside it.
- `$bfm` navigates, reconciles, prioritizes, and executes the graph.
- **Push Live** remains the release boundary.

### Assumptions to confirm

- None. Existing technical identifiers and runtime behavior remain unchanged.

### Out of scope

- Graph databases, GraphQL, technical identifier migration, consumer-project
  changes, and publication before explicit release approval.

### Success looks like

An everyday reader sees the category, accessible explanation, and primary graph
diagram immediately; public and packaged guidance agree without changing FB's
operating contracts.

## Build Brief

1. Replace the active public tagline with **Graph Engineering for Everyday
   People** and add the concise open-source Codex-plugin description.
2. Add a prominent **What is graph engineering?** explanation that distinguishes
   the delivery map from knowledge graphs, databases, or GraphQL.
3. Make the six-workstream graph and delivery loop the primary diagram.
4. Reframe Loop Engineering as behavior inside the graph rather than the
   headline category.
5. Align public docs, plugin guidance, marketplace copy, metadata, setup and
   active version records; preserve histories and identifiers.
6. Update focused structural contracts, generate declared mirrors once, and run
   proportional release-candidate checks.
7. Explain the terminology honestly: graph-based agent orchestration has nodes,
   edges, shared state, routing, branches, gates, and loops, while “graph
   engineering” remains ambiguous with graph-database and knowledge-graph work.
   Map those concepts to FB and state that no graph database is required.
8. Make first-run workstream creation automatically pin all six tasks, verify
   sidebar visibility, and repair unpinned tasks without duplication.

Changelog expectation: required — this user-visible positioning and plugin
release becomes `0.5.8-beta+codex.20260804153114`.

## Task Receipt

- **Changed surfaces:** headline product copy; accessible graph explanation;
  README and full graph diagrams; public/harness/Codex setup and version docs;
  Product/BFM/setup/coordination skills; marketplace and plugin metadata;
  focused positioning, metadata, and release contracts; generated mirrors.
- **Verification:** [TASK-074 QA](../qa/TASK-074.md).
- **Review state:** not reviewable.
- **Changelog:** drafted — [FB 0.5.8-beta](../../CHANGELOG.md#058-beta--2026-08-04).
- **Changelog approval:** approved by James on 2026-08-05.
- **External gates:** Complete. James approved **Push Live**; PR #58 merged as
  `72bfab0`; marketplace upgrade, reinstall, and active verification passed.
- **Remaining owner/action:** None. Start a new Codex task to load the release.

## Brief Validation

Status: pass

- **Satisfied:** Graph Engineering is the primary active category; explanations,
  diagrams, plugin metadata/guidance, release records, and generated mirrors
  agree; focused checks pass; runtime contracts and identifiers remain intact.
- **Missing:** No implementation criterion. Changelog and release approvals are
  external gates.
- **Next action:** None.

## Failure Evidence

- **Failure:** Initial release checkpoint stopped at normalized-record Doctor.
- **Observed:** Board status was `Staging QA` while handoff frontmatter remained
  `ready`.
- **Cause:** The handoff was moved back to `ready` during candidate preparation
  even though implementation and focused verification were complete.
- **Recovery attempted:** Align handoff status to `implemented` without changing
  source, product scope, evidence, or release authority.
- **Result:** Doctor returned Ready and the permitted final checkpoint passed.
- **Reusable lesson:** Candidate state transitions must update board and handoff
  status together before the release checkpoint.

## Product/BFM Closeout

Status: Done — published and installed.
Actioned By: FB-Product / BFM.
Result: FB `0.5.8-beta+codex.20260804153114` makes Graph Engineering the
headline, explains its industry context and no-database boundary, and
automatically pins verified first-run workstream tasks.
Remaining: None. Start a new Codex task to load the refreshed plugin.
