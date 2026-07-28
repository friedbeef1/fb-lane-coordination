---
type: fb-lane-handoff
task: TASK-058
lane: fb-product
status: ready
approval: approved
fb_harness: v3
record_model: normalized-v1
---

# TASK-058 — Automatic BFM worktree orchestration

## Goal Alignment Session

Product OKR: Reduce hands-on user coordination and file collisions while preserving FB product authority, bounded verification, and explicit release control.
Lane OKR Fit: aligned
Mini-loop Evidence: Existing `claim` and `quick` paths already create or reuse linked worktrees by default, but BFM guidance does not yet require automatic claim allocation for every eligible execution slice.
Evidence Against Product OKR: None identified.

## Project Start Brief

- **Requested:** Make FB set up implementation worktrees automatically.
- **Existing capability:** The root and packaged CLI already create or reuse a
  linked worktree for `claim` and `quick` unless the legacy compatibility flag
  is explicitly used.
- **Gap:** `$bfm` can create an execution graph without deterministically
  translating every independent source-changing slice into an automatic claim
  and visible worktree assignment.
- **Scope:** Canonical BFM/workflow/coordination guidance, public explanation,
  a focused orchestration contract, generated plugin mirrors, and task evidence.
- **Out of scope:** Creating worktrees for planning-only chats, automatic chat
  discovery, parallel overlapping edits, release, merge, publication, install,
  or deployment.
- **Success:** The contract requires one automatic create-or-reuse claim per
  eligible parallel slice, sequential execution for overlaps/dependencies, no
  user worktree setup, and a visible integration map.

## Build Brief

1. Specify the eligibility and safety rules once in the canonical workflow.
2. Require the BFM skill to execute automatic claims rather than merely suggest
   worktrees.
3. Keep the coordination skill and README concise and link to the canonical rule.
4. Add a focused root/package contract and generate declared mirrors once.
5. Record focused evidence and stop before external release actions.

Changelog expectation: required

## Changelog Decision

Changelog: pending — add a candidate-matched entry describing automatic
worktree allocation before Ready to ship.

