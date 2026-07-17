---
type: fb-lane-handoff
task: TASK-026
lane: fb-product
status: in-progress
okr_fit: aligned
---

# TASK-026 - BFM Two-Speed Efficiency

## Goal Alignment Session

Product Goal: Make long Product/BFM runs faster to resume and harder to mis-route without weakening safety or evidence.
Workstream Goal: Amend the existing session-ledger and beginner-status workflow with internal Quick/Full classification, correct worktree reuse/placement, compact queue visibility, proportional verification, and optional project preflight.
Lane OKR Fit: aligned
User Approval Needed: no - James supplied the approved MirrorCam pilot handoff for upstream action.
Mini-loop Evidence: MirrorCam observed repeated runtime/worktree rediscovery, unnecessary broad reruns after docs-only closeout, obscured queue state, and nested worktree placement.
Evidence Against Product OKR: None identified; the amendments reduce coordination overhead while preserving approval and evidence gates.

## Scope

- Amend existing CLI/session/status seams only; no parallel workflow or public command.
- Preserve Full BFM as the safe fallback.
- Keep project runtime/preflight ownership local.

## Out Of Scope

- Global Node pin, dashboard, CI eval runner, numeric score, provider/deploy changes, MirrorCam source, release, publication, install, deployment, or merge.

## Verification Handoff

Candidate: local branch `codex/fb-beginner-clarity` after verified TASK-025.
Test plan: focused red/green acceptance checks, root/package mirrors, complete validator, doctor, and whitespace.
Recovery: Product/BFM owns implementation and test recovery; ambiguity falls back to Full BFM.

## Product/BFM Closeout

Status: In Progress.
Actioned By: FB-Product / BFM.
Result: Pending implementation.
Evidence: MirrorCam pilot handoff accepted as upstream requirements; TASK-025 gate is clean.
Remaining: Implement and verify locally; all external-action gates remain closed.
Loop Learning: Feedback captured: yes; Repeated pattern?: yes; Tooling needed?: small amendments to existing seams; Product approval needed?: no - explicitly approved.
