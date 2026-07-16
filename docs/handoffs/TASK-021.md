---
type: fb-lane-handoff
task: TASK-021
lane: fb-product
status: in-progress
okr_fit: aligned
fb_harness: v2
Review state: not reviewable
---

# TASK-021 - FB Harness Redesign

## Goal Alignment Session

Product Goal: Let an everyday user move from an idea to an approved build brief and testable evidence with FB carrying routine coordination and QA work.
Workstream Goal: Turn the existing coordination model into a compact repository-local harness with an explicit hierarchy, safe migration path, and enforceable review evidence.
Lane OKR Fit: aligned
User Approval Needed: no - James explicitly approved the FB Harness Redesign implementation plan.
Mini-loop Evidence: First-project feedback showed that duplicated instructions obscured the plan/build boundary, lane roles, and test responsibilities. The shipped clarity contract now needs a compact canonical home and a small enforceable evidence gate.
Evidence Against Product OKR: None identified.

## Project Start Brief

What you asked for: Redesign FB as a reusable repository-local harness that reduces user coordination and testing burden while preserving the established ownership model.

Your decisions:

- The canonical manual is a small `docs/fb/` pack.
- Existing projects receive only a managed route block plus the pack; project-owned instructions stay intact.
- Review evidence is enforced only for new harness-v2 handoffs explicitly marked reviewable.
- There is no new command, wizard, dashboard, CI job, release, deployment, publication, or consumer-repository change.

Assumptions to confirm: None. The implementation plan supplies the defaults and explicit exclusions.

What FB will plan: A source hierarchy, concise entry points, safe bootstrap migration, and validator/doctor checks for complete review packets.

Out of scope: Changing technical identifiers, four-lane ownership, board technical statuses, historical handoffs, or an installed/released plugin.

Success looks like: A fresh or existing project has a compact, durable FB route; new v2 reviewable handoffs cannot close without actionable Test This Now evidence; old work remains valid.

Progress: Building.

Next action: Implement and independently review the canonical harness pack before bootstrap and validation changes.

## Build Brief

Build a mirrored root/package `docs/fb/` harness pack; route active instructions to it; update bootstrap to create the pack and safely maintain only explicit route blocks; and extend the existing doctor/validator to enforce the opt-in v2 handoff evidence contract. Preserve the current first-project clarity behavior, board statuses, technical identifiers, and no-release boundary.

## Scope

- Root and packaged `docs/fb/` harness pack.
- Root/template/generated navigation-layer instructions and concise active docs/skills.
- Root/package bootstrap behavior and matching tests.
- Existing doctor/validator review-evidence validation with targeted fixtures.
- Coordination records and final verification only.

## Out Of Scope

- New commands, wizard, dashboard, eval runner, CI job, board-status replacement, release, deployment, publication, technical-ID migration, or consumer-project changes.
- Retrofitting or rewriting historical handoffs and project-owned instructions.

## Verification Handoff

Candidate: local branch `codex/fb-documentation-rebrand`.

Test plan: fresh creator-commerce bootstrap; existing-project bootstrap migration; root/package suites, syntax/parity, validator, doctor, whitespace, and independent reviews.

Manual pass criteria:

- `AGENTS.md` is concise and routes readers to the durable pack, board, index, and handoff.
- Fresh bootstrap creates all five pack pages and thin route guidance.
- Existing-project bootstrap retains user text and updates only the marked route blocks.
- V2 reviewable handoffs require complete Test This Now evidence; planning-only and historical handoffs still pass.

Recovery: Missing review access is recorded as `Blocked — no review environment yet` with the exact next action. Routine verification recovery remains Product/BFM-owned before asking the user to intervene.

## Product/BFM Closeout

Status: In Progress.
Actioned By: FB-Product / BFM.
Result: Task claimed; implementation has not started.
Evidence: Approved user plan and this durable brief.
Remaining: Canonical pack, migration, review gate, verification, and independent review.
Closeout Note: No publication, release, deployment, or merge is authorized.
Loop Learning: Feedback captured: repeated instruction duplication and unstructured review evidence; Repeated pattern?: yes; Tooling needed?: smallest existing validator/doctor extension; Product approval needed?: no - explicit implementation approval received.
