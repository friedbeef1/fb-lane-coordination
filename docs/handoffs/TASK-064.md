---
type: fb-lane-handoff
task: TASK-064
lane: fb-product
status: implemented
okr_fit: aligned
---

# TASK-064 — Least-Privilege Workspace Access

## Goal Alignment Session

Product Goal: Keep FB autonomous inside approved scope without asking users for unnecessary machine-wide access.
Workstream Goal: Make approval-based workspace access the default and scope genuine escalations narrowly.
Lane OKR Fit: aligned
User Approval Needed: no — James explicitly asked for this guideline to be added to the FB-Lane plugin.
Mini-loop Evidence: The repeated permission loop was traced to explicit escalated operations, not a need for persistent Full access.
Evidence Against Product OKR: None identified.

## Scope

- Add the least-privilege rule to canonical and packaged guardrails.
- Require authoritative-checkout verification before broadening access.
- Forbid recommending Full access merely to suppress routine prompts.
- Preserve host permission prompts and Product/BFM governance as separate gates.
- Add one focused canonical/package contract.

Out of scope: Runtime permission automation, Codex host configuration, plugin publication, marketplace install, consumer-repository mutation, or weakening any existing approval gate.

## Verification Handoff

Candidate: `codex/TASK-064-least-privilege-access`.
Test plan: Run `node tools/fb-beginner-experience.test.cjs`, compare canonical/package files, and run `git diff --check`.
Manual pass criteria: Guidance says approval-based access by default, never uses Full access as a convenience fix, and asks only for narrowly scoped escalation at real boundaries.
Known limit: Plugin publication and installation remain separate release gates.

## Product/BFM Closeout

Status: Local Staging QA candidate.
Actioned By: FB-Product / BFM.
Result: Canonical and packaged plugin guardrails now contain the approved least-privilege contract.
Evidence: Focused RED contract added before guidance; canonical and packaged GREEN passed 11/11; mirror parity and `git diff --check` passed. Doctor accepts TASK-064 and remains blocked only by unrelated pre-existing TASK-059 normalized-record drift.
Remaining: Integrate locally, then include in a future plugin release only through the normal release gate.
Closeout Note: No Full access, publication, install, push, merge, or consumer-project change was performed.
Loop Learning: Feedback captured: yes; repeated pattern: yes; tooling needed: none; Product approval needed: no for this candidate, yes for any release.
