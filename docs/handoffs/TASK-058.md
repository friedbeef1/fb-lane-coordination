---
type: fb-lane-handoff
task: TASK-058
lane: fb-product
status: implemented
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

Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#unreleased--automatic-bfm-worktrees)

Changelog approval: approved by James on 2026-07-29.

## Brief Validation

Status: pass

- Automatic claim allocation is mandatory for every independent,
  non-overlapping source-changing slice.
- Planning-only work creates no implementation worktree.
- Dependent, overlapping, shared-file, sensitive, and unresolved work remains
  sequential.
- BFM uses the existing create-or-reuse claim path and reports a
  slice/branch/worktree mapping without asking the user to manage worktrees.
- Parallel slices receive unique child task IDs and claims are recorded
  serially before independent workers start.
- Integration runs from the primary checkout and removes only a registered,
  present, clean worktree whose branch is merged.
- Dirty, unmerged, missing, blocked, and deferred worktrees remain owned with
  their task and locks open for a concrete next action.
- Canonical and packaged contracts are mechanically aligned.

Missing criteria: None.

## Task Receipt

- **Delivered:** Canonical workflow and installed-skill sources now require BFM
  to invoke the existing linked-worktree claim path for each eligible slice,
  serialize claim mutations, integrate from the primary checkout, and safely
  clean only a merged, clean task worktree.
- **Runtime boundary:** Existing `claim` and `quick` implementation remains the
  execution primitive. The merge path now removes its registered worktree
  before releasing task locks, rejects worker-checkout integration, selects
  exact task branches, and fails closed for unsafe cleanup states.
- **Changed surfaces:** Workflow, BFM and coordination skills, README,
  changelog, focused contract, package manifest, generated plugin mirrors, and
  TASK-058 evidence.
- **Automated checks:** Focused root/package and real-Git contract 11/11;
  fresh session/CLI/MCP compatibility suite 39/39; 49 generated mirrors
  matched; affected syntax, README anchor, and whitespace passed.
- **Failure and recovery:** The first real CLI proof exposed Git's `+` marker
  for branches checked out in linked worktrees. Branch normalization and exact
  task-token matching fixed the integration path; the regression now passes.
- **Changelog:** updated —
  [CHANGELOG.md](../../CHANGELOG.md#unreleased--automatic-bfm-worktrees);
  wording approved by James on 2026-07-29.
- **Review state:** not reviewable
- **External gates:** Merge, publication, plugin installation, and deployment
  remain unauthorized pending explicit **Push Live**.
- **Repository state:** Candidate remains on the TASK-058 linked-worktree
  branch for focused Product review.
- **Remaining owner/action:** Candidate is **Ready to ship**. James retains
  **Push Live** authority for merge, publication, plugin installation, and
  deployment.

## Verification Handoff

See [TASK-058 QA](../qa/TASK-058.md).
