---
type: fb-lane-handoff
task: TASK-064
lane: fb-product
status: implemented
okr_fit: aligned
approval: approved
fb_harness: v3
record_model: normalized-v1
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

## Project Start Brief

- **Requested:** Put the least-privilege access guideline inside FB-Lane, merge
  it, publish the updated plugin, reinstall it, and verify the active cache.
- **Decision:** Approval-based workspace access is the default; Full access is
  never a convenience fix; real boundary crossings receive one narrowly scoped
  escalation.
- **Safety:** Host permissions and FB Product/BFM governance remain independent.
- **Out of scope:** Runtime permission automation, weakening locks or release
  gates, and universal claims from TASK-059's directional benchmark.
- **Success:** The published and installed plugin contains the exact guidance
  and reports the new build.

## Build Brief

1. Preserve the canonical/package least-privilege guidance and focused test.
2. Integrate the separately approved TASK-059 records without broadening its
   directional claim.
3. Build FB `0.5.2-beta+codex.20260801121142`, run the complete release
   validator, push GitHub `main`, upgrade the marketplace, reinstall, and
   verify the active cache.

Changelog expectation: required
Release checkpoint: requested and Push Live approved by James on 2026-08-01
Release build: `0.5.2-beta+codex.20260801121142`

## Task Receipt

- **Approved brief:** Release the merged least-privilege rule through the
  existing GitHub marketplace and verify the active Codex installation.
- **Changed surfaces:** Canonical/package guardrails, focused access contract,
  release metadata, active docs, changelog, manifests, and Product records.
- **Changelog:** updated and approved —
  [FB 0.5.2-beta](../../CHANGELOG.md#052-beta--2026-08-01).
- **Checks:** Focused access and TASK-059 suites, package parity, metadata,
  complete release validator, GitHub state, marketplace upgrade, reinstall,
  and installed-cache wording/version proof.
- **External gate:** Push Live was explicitly approved by James on 2026-08-01.

## Brief Validation

Status: pass

- Approval-based least privilege remains the canonical/package default.
- Product/BFM and host permission gates remain separate.
- TASK-059 is integrated with its directional limitations intact.
- Release metadata and active surfaces target one exact build.

## Verification Handoff

Candidate: `codex/TASK-059-integration` release build `0.5.2-beta+codex.20260801121142`.
Test plan: Run `node tools/fb-beginner-experience.test.cjs`, compare canonical/package files, and run `git diff --check`.
Manual pass criteria: Guidance says approval-based access by default, never uses Full access as a convenience fix, and asks only for narrowly scoped escalation at real boundaries.
Known limit: Plugin publication and installation remain separate release gates.

## Product/BFM Closeout

Status: Local Staging QA candidate.
Actioned By: FB-Product / BFM.
Result: Canonical and packaged plugin guardrails now contain the approved least-privilege contract.
Evidence: Focused RED contract added before guidance; canonical and packaged GREEN passed 11/11; mirror parity and `git diff --check` passed. TASK-059 integration passes 23/23 with one intentional skip; doctor is Ready.
Remaining: Complete the approved release checkpoint, GitHub push, marketplace upgrade, reinstall, and installed-cache verification.
Closeout Note: No Full access, publication, install, push, merge, or consumer-project change was performed.
Loop Learning: Feedback captured: yes; repeated pattern: yes; tooling needed: none; Product approval needed: no for this candidate, yes for any release.
