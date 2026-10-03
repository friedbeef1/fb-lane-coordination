---
type: fb-lane-handoff
task: TASK-096
lane: fb-product
status: staging-qa
record_model: normalized-v1
---

# TASK-096 — PM-first priorities and explainer

## Project Start Brief

James approved the bounded proposal to explain FB as a delivery coordinator for
the human PM, standardize the queue and priority-change explanation, verify the
existing dependency behavior, and preserve native execution and safety gates.
His follow-up asks for consistent GitHub documentation and an explainer script.

Your decisions: explain observable help rather than unmeasured savings; users
set business importance; Product/BFM recommends feasible sequence. Notifications
may consume a small acknowledgment turn but must not launch a BFM cycle.

Assumptions: use the existing graph, dispositions and Build Brief, not a new
priority engine. Prepare a 60–90 second script, not an unapproved rendered or
published video. Preserve the existing historical demo.

## Goal Alignment Session

Product OKR: Make the delivery queue understandable to the human PM without adding execution ceremony.
Lane OKR Fit: aligned
Mini-loop Evidence: Baseline guidance review exposed blanket-pause and priority-impact ambiguity; focused proof and one fresh candidate review address them.
Evidence Against Product OKR: The change does not prove time savings or live recipient compliance; those claims are excluded.

## Build Brief

- Base: PR #75 candidate `4d055cc7d5e7025ab49b817c1df63e9e4e4491a8`, public main
  `6a7c3cb09e75935fd96f0f897682e7da51f15dc3`; isolated branch
  `codex/pm-priority-explainer` in `/tmp/fb-pm-priorities-20261003`.
- Scope: human-readable recommended next/prerequisite/parallel/blocked/deferred/
  priority-impact guidance; named override and displacement contract; passive
  acknowledgment correction; public copy and explainer script; focused proof.
- Sequence: prove existing scheduler and guidance gaps, change canonical
  guidance, review candidate once, generate mirrors, focused verification.
- Safety: priority never changes execution eligibility or overrides auth,
  privacy, payments, destructive operations, provider or release authority.
- Completion criteria: concrete queue example; forced blocked priority cannot
  bypass prerequisites; unchanged/unrelated work preserved; notification does
  not start work; plugin/docs aligned; script labels illustrative scenarios.
- Out of scope: automatic model switching, paid benchmarks, consumer updates,
  app source, new task topology, rendering, plugin install, merge and release.
- Changelog expectation: required; add candidate-faithful unreleased note.
- Review state: not reviewable (guidance and documentation candidate).

## Task Receipt

Completed canonical guidance, public explanation, focused scheduler contracts,
generated mirrors and the [explainer script](../media/fb-priorities-explainer.md).
Checks and remaining limits: [QA](../qa/TASK-096.md). One independent candidate
review found no actionable defects. No runtime engine change was needed.

Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#unreleased--product-priorities-and-delivery-implications)

This follow-up supersedes TASK-095's unshipped no-message guidance; its historical
evidence remains intact. Product/BFM owns the next release decision. GitHub main,
installed plugin and consumer repositories remain unchanged; no video rendered.

## Brief Validation

pass — bounded source/documentation/script criteria satisfied by the focused
checks and fresh behavior smoke in [QA](../qa/TASK-096.md). This is not release,
installation or live native-message proof. Product/BFM owns those separate gates.
