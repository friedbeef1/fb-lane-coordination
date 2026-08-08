---
type: fb-lane-handoff
fb_harness: v3
learning_contract: v1
task: TASK-079
lane: fb-product
status: staging-qa
review_state: completed build
---

# TASK-079 — Project-local continuous learning and FB 0.6.0-beta

## Goal Alignment Session

Product Goal: Let every FB consumer project learn from its own verified
delivery outcomes without turning learning into more retries or context bloat.
Workstream Goal: Add a bounded lesson lifecycle, relevant-only selection,
closeout evidence, reusable plugin guidance, and a release candidate.
Lane OKR Fit: aligned
User Approval Needed: no — James approved the design and said to proceed.
Mini-loop Evidence: focused RED/GREEN tests proved privacy-safe records,
concurrent writes, lifecycle transitions, no repair reset, closeout, bootstrap,
CLI/MCP, and documentation behavior.
Evidence Against Product OKR: no production telemetry yet proves that lessons
improve real consumer-project outcomes; provisional lessons therefore require
later comparable evidence before confirmation.

## Project Start Brief

User decision: FB consumer projects should learn recursively after feature
delivery, while rejecting lessons that fail and preventing excessive correction
loops.

Assumptions: repository-local curated evidence is sufficient; clone-local JSONL
may store validated observation state; automatic treatments remain structural;
existing project repair and release gates remain authoritative.

Success: relevant future tasks receive only matching active lessons; lessons
confirm only through later evidence; one revision is permitted; failures and
safety regressions reject; old handoffs remain compatible; the plugin and
documentation agree.

## Build Brief

- Include now: learning runtime, durable registry, clone-local observations,
  lifecycle/rollback, relevant selection, CLI/MCP, doctor/bootstrap, Full BFM
  closeout, public and plugin guidance, focused contracts, and `0.6.0-beta`.
- Out of scope: autonomous application-source or prompt changes, cross-project
  transmission, hosted telemetry, semantic scoring, new repair budgets, merge,
  publication, reinstall, or deployment.
- Verification: focused learning/session/CLI/docs/metadata tests, package
  parity, syntax, links, whitespace, doctor, and one final release validator.
- Changelog expectation: required.
- Release boundary: stop at **Ready to ship**. Only **Push Live** authorizes
  GitHub merge, marketplace publication, or reinstall.

## Task Receipt

Approved brief and decisions: The approved project-first, bounded-learning
design and one-revision limit were implemented without widening repair or
release authority.
Confirmed assumptions and approved scope changes: Repository-local Markdown
and Git-common JSONL were sufficient; no approved scope change was required.
Branch, source commits, and changed surfaces: `codex/project-recursive-learning`;
design `55fb5ec`, plan `cf602f0`, records `59d4bd3`, lifecycle `58601f3`,
integration `ea099d5`, and guidance `9a0ebdf`; runtime, templates, harness,
skills, metadata, tests, and release records changed.
Checks, failures, recovery, and results: Focused RED/GREEN caught the missing
manual-bootstrap dependency and one line-sensitive documentation assertion;
both were corrected without another broad loop. Final results are in
[TASK-079 QA](../qa/TASK-079.md).
Review state, direct links, limits, and external gates: completed plugin build;
[QA](../qa/TASK-079.md); no application preview; real consumer-project benefit
still requires later comparable evidence; **Push Live** remains external.
Repository state: Candidate branch is committed through the guidance slice;
release records and final checkpoint are being completed.
Remaining owner and action: Product/BFM runs one release checkpoint, pushes a
review candidate, and stops at **Ready to ship** for **Push Live**.

## Brief Validation

Status: pass
Satisfied criteria and evidence: The project-local record, bounded lifecycle,
relevant selection, rollback, repair-budget, closeout, bootstrap, privacy, and
plugin-guidance criteria have focused evidence.
Missing criteria: External merge, marketplace publication, reinstall, and real
consumer-project lesson confirmation remain outside this candidate checkpoint.
Reason: Local implementation satisfies the approved candidate scope while live
delivery remains separately gated.
Owner: Product/BFM
Next action: Run the final release checkpoint and prepare the GitHub review.
Approved scope-change references: None — the approved design remains unchanged.

## Project Learning

Learning: recorded — LESSON-RELEASE-FALLBACK-001
Registry: [LESSON-RELEASE-FALLBACK-001](../learning/index.md#lesson-release-fallback-001)
Evidence: [Focused repair evidence](../qa/TASK-079.md#focused-repair-evidence)
Repair budget: unchanged — the missing fallback dependency was corrected in the existing focused repair allowance.

## Verification Handoff

Candidate: `0.6.0-beta+codex.20260808104938` on
`codex/project-recursive-learning`.
Test plan: Run the focused project-learning, session, CLI, documentation,
metadata, package-parity, syntax, link, whitespace, doctor, and final release
checkpoint contracts.
Commands and results: See [TASK-079 QA](../qa/TASK-079.md).
Environment: Local macOS Git linked worktree with the packaged plugin generated
from canonical sources.
Runnable evidence links: [QA](../qa/TASK-079.md) and
[learning contract](../fb/learning.md).
Manual pass criteria: Product confirms the changelog describes the candidate
and no interface gains release authority.
Recovery attempted: Added the learning runtime/page/template to the manual
fallback and corrected the focused structural assertion.
Known limits: No production telemetry or consumer-project confirmation run is
claimed by this release.
Next Product/BFM recovery action: If the final release checkpoint fails, make
one consolidated material repair and rerun the failed proof before the allowed
final validator pass.

## Test This Now

- **Outcome type:** Completed Codex plugin candidate
- **Direct links:** [Learning guide](../fb/learning.md) · [QA](../qa/TASK-079.md)
- **Exact steps and expectations:**
  1. Open the learning guide and expect the five states, one revision, relevant-only context, privacy boundary, and unchanged repair budget.
  2. Open QA and expect the focused runtime, closeout, bootstrap, metadata, parity, and release-checkpoint results.
- **Pass criteria:** The plugin records and selects bounded lessons without source mutation, extra repair, cross-project transfer, or release authority.
- **Known limits:** Later consumer-project runs must provide comparable evidence before a provisional lesson becomes confirmed.
- **Failure-report format:** Name the missing contract, file or command, observed result, expected result, and candidate build.

## Closeout

Reason: The local candidate scope is implemented and undergoing its single
release checkpoint.
Owner: Product/BFM
Next action: Push the verified candidate for review, report **Ready to ship**,
and wait for **Push Live**.
