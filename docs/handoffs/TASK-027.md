---
type: fb-lane-handoff
task: TASK-027
lane: fb-product
status: staging-qa
okr_fit: aligned
---

# TASK-027 - Complete the FB Product Story

## Goal Alignment Session

Product Goal: Help everyday users understand how FB turns an approved outcome into verified delivery while honestly overlapping with Codex and Kurrent Capacitor.
Workstream Goal: Extend the canonical comparison with TASK-026's real coordination pain, implemented two-speed responses, and a practical corrective-patch story.
Lane OKR Fit: aligned
User Approval Needed: no - James explicitly approved this implementation plan.
Mini-loop Evidence: TASK-026 records repeated runtime/worktree rediscovery, nested worktree placement, unnecessary broad reruns after documentation-only closeout, and obscured queue state, together with the implemented preflight, reuse, placement, proportional-verification, and queue responses.
Evidence Against Product OKR: None identified.

## Scope

- Preserve the existing comparison, six feedback-backed pain points, three examples, and Capacitor/FB overlap.
- Add the TASK-026 pain-point mapping and corrective-patch example.
- Update the delivery-loop Mermaid to show Quick BFM Patch, Full BFM, verification checkpoint reuse, and safe fallback.
- Enforce official product links, evidence, diagrams, examples, and root/package parity in the focused positioning contract.

## Out Of Scope

- Runtime, commands, identifiers, publication, release, deployment, origin reconciliation, push, PR, or merge.

## Verification Handoff

Candidate: local branch `codex/fb-beginner-clarity`, based on TASK-027 candidate `081dd6c` after verified TASK-026, with final-review repairs pending one focused local commit.

Test plan: focused positioning red/green, canonical/package byte parity, evidence-link and Mermaid checks, CLI/session/eval/beginner/two-speed suites, validator, doctor, and whitespace.

Manual pass criteria: the added pain points are traceable to TASK-026; every pain maps to an implemented response and user-visible effect; Quick and Full BFM are understandable; Capacitor overlap remains honest; and the fourth example shows bounded correction plus safe fallback.

Recovery: Product/BFM owns wording, evidence, parity, test, and diagram repair before local review.

## Product/BFM Closeout

Status: Staging QA candidate; Product re-review pending.
Actioned By: FB-Product / BFM.
Result: Final review reopened the gate after finding a stale current-task pointer, a packaged-distribution TASK-026 evidence-link failure, and overstated review approval. The link-resolution regression failed first in both distribution contexts, then passed after adding byte-identical evidence mirrors and the identical relative destination `evidence/TASK-026-two-speed.md` to both Why FB pages.
Evidence: Root/package positioning first failed on the missing mirrored evidence link, then passed. Root/package CLI 70/70, session 32/32, eval 18/18, beginner 10/10, positioning, and two-speed suites passed. Canonical/package Why FB pages, positioning tests, and TASK-026 evidence artifacts are byte-identical; both delivered pages resolve `evidence/TASK-026-two-speed.md` from their own filesystem context. Syntax, whitespace, the full clean-tree validator, and standalone doctor passed. No final whole-slice approval is claimed.
Remaining: Obtain Product re-review. Reconciliation, fetch, push, PR, merge, publication, release, deployment, install, runtime changes, and package-identifier changes remain separate and unauthorized; none occurred.
Health: needs Product review
Branch/worktree state: clean local branch
Loop Learning: Feedback captured: yes; Repeated pattern?: yes; Tooling needed?: focused documentation contract; Product approval needed?: no - explicitly approved.
