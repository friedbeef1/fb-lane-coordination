---
type: fb-lane-handoff
task: TASK-085
lane: fb-product
status: ready
approval: approved
record_model: normalized-v1
fb_harness: v3
worktree: .worktrees/tech-TASK-085-select-canonical-user-handoffs-and-ready-to-ship-records-without-weakening-duplicate-drift-or-exact-project-gates-synchronize-and-verify-the-packaged-plugin
sensitive: false
work_types: tooling, reliability
surface: canonical BFM intake scanner and packaged Codex plugin
---

# TASK-085 — Six-workstream intake false-negative repair

## Status

Ready to ship — the committed source and packaged candidate includes
repository-aware onboarding evidence, a first-class User intake bucket, and a
transactional routing-receipt refresh/rebuild path and migration receipt
preservation. The bounded Unmirror recovery now also distinguishes historical
content receipts from active-candidate routing receipts and accepts an approved
post-migration revision only through an exact current-hash/source-root packet
that matches one prior disposition. Focused root/package suites, package parity,
syntax, whitespace, and second-pass whole-candidate review pass. Source commit
`87a5fcc` is local; the corrected record preflight and Doctor rerun remain.

## Product Start Brief

Let Unmirror Product/BFM freeze all current intake without losing the User
handoff or already verified Ready-to-ship candidates.

## Goal Alignment Session

Product Goal: Keep the six-workstream intake complete, fail-closed, and usable
from the exact installed runtime.

Workstream Goal: Align canonical selection with the audit's existing
ready-like status contract, keep User as its own evidence workstream, and honor
repository-configured task titles at the BFM execution boundary.

Lane OKR Fit: aligned.

User Approval Needed: no — James explicitly authorized the repair and local
upgrade on 2026-08-15.

Mini-loop Evidence: Eight behavioral regressions reproduce the independent
User-bucket, configured-title, routing-refresh, erased-receipt recovery, and
migration-preservation defects, plus historical, approved-current, and
multi-source recovery boundaries, and pass in both root and packaged runtimes
without weakening content-drift rejection.

Evidence Against Product OKR: The candidate-runtime scan against the full
Unmirror checkout stops on exact same-path iOS handoff drift, so consumer intake
is not yet claimed as passing.

## Reconciled root cause

The intake scanner collapsed `fb-user` into the historical Product slot rather
than representing the six evidence workstreams directly. Canonical selection
also accepted only exact `ready`, while the audit recognized Ready-like states.
Separately, BFM onboarding rebuilt expected titles from hardcoded `FB · …`
definitions instead of the repository-aware onboarding API, so valid
`Unmirror · …` strict receipts appeared partial. Finally, routing validation
was hash-bound and fail-closed but had no supported transaction for refreshing
only routing hashes after coherent authoritative-record edits.

## Build Brief

- Keep User and Product/BFM in distinct scanner buckets and reuse one shared
  ready-status predicate for canonical selection and audit recognition.
- Resolve expected onboarding titles through `workstreamsForRepository` and
  prove a strict `Unmirror · …` receipt verifies all seven roles.
- Expose an atomic routing-receipt refresh that requires an existing
  disposition and unchanged handoff content/source roots.
- Preserve existing identity-matched routing receipts when migration inventory
  does not explicitly replace them, and allow erased receipts to rebuild only
  from exact dispositioned migration hashes for every current source.
- Rebuild historical content receipts without inventing modern board/index/card
  routes; keep those exact routing requirements for every Ready-like candidate.
- Permit a changed approved handoff to reconcile only when the request names
  the exact current canonical/source hashes and roots and matches one
  unambiguous prior migration disposition; require a durable approval reference
  and atomically refresh exact migration evidence for every current source.
- Preserve duplicate-task, cross-root drift, exact-project, onboarding, and
  disposition gates.
- Synchronize package mirrors only after the root regression is green.
- Do not mutate Unmirror, installed cache, task bindings, credentials, or
  provider state from the implementation worktree.

Changelog expectation: Required — record candidate-faithful Unreleased wording;
versioning and release wording remain owned by a later explicit Push Live.

## Gate

James authorized the repair and local upgrade. The candidate must still stop
before merge, push, public marketplace publication, deployment, or release
because this conversation does not contain exact **Push Live**.

## Task Receipt

Approved brief and decisions: Repair the intake false negative, verify the
packaged plugin, and make the supported reload path ready without disturbing
Unmirror or weakening fail-closed gates.

Confirmed assumptions and approved scope changes: The repository onboarding
module is the canonical title source, User is one of six evidence workstreams,
and the existing atomic dual-manifest writer is the correct transaction
boundary for routing-only receipt refresh. Consumer content drift remains a
separate reconciliation gate.

Branch, source commits, and changed surfaces: Candidate branch
`tech/TASK-085-select-canonical-user-handoffs-and-ready-to-ship-records-without-weakening-duplicate-drift-or-exact-project-gates-synchronize-and-verify-the-packaged-plugin`;
source commit `87a5fcc`; root scanner/test plus mechanically
synchronized packaged mirrors and updated TASK-085 records.

Checks, failures, recovery, and results: RED failed independently on the
collapsed User bucket, partial configured-title onboarding state, absent
refresh command, legacy-record routing conflation, and missing exact-current
revision recovery. GREEN passed 19/19 intake, 35/35 migration, and 39/39
onboarding checks in each of root and packaged contexts, plus 86/86 package
parity, syntax, and whitespace. Final candidate preflight and Doctor remain.

Review state, direct links, limits, and external gates: Second-pass
whole-candidate review found no Critical or Important defect after verifying
all four first-pass findings were resolved. See [QA verification](../qa/TASK-085.md) and the
[Unreleased changelog](../../CHANGELOG.md#unreleased). The consumer drift and
exact **Push Live** release boundary remain external gates.

Repository state: Source candidate `87a5fcc` is committed in the isolated
TASK-085 worktree; the current durable record reconciliation is intentionally
dirty pending its docs-only commit. Canonical `main` is not merged, pushed,
published, or installed with this candidate.

Remaining owner and action: Product/BFM runs candidate preflight and Doctor,
commits the local candidate, performs the explicitly approved bounded local
reinstall, starts a fresh Codex task, repairs the erased Unmirror receipts
through the supported exact-evidence route, and resumes intake. Merge, push,
publication, deployment, and release remain blocked without **Push Live**.

Changelog: Updated — [Unreleased TASK-085 entry](../../CHANGELOG.md#unreleased).

## Verification Handoff

- Source candidate: current isolated TASK-085 working tree on the branch above;
  final commit pending Product/BFM integration.
- Test plan: [TASK-085 QA](../qa/TASK-085.md).
- Environment: local macOS source worktree; provider-dark; no consumer writes.
- Current Unmirror result: installed runtime remains fail-closed
  `HANDOFF_CONTENT_DRIFT`; the source candidate now contains the exact bounded
  recovery required before a fresh-task consumer rerun.
- Manual gate: none for the source repair. A fresh Codex task is required only
  after an authorized installed-plugin replacement.

## Test This Now

Run the focused root and packaged intake-ledger suites plus package parity,
syntax, and whitespace checks listed in [TASK-085 QA](../qa/TASK-085.md).
