---
type: fb-lane-handoff
task: TASK-026
lane: fb-product
status: staging-qa
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

Status: Staging QA — local Product review complete.
Actioned By: FB-Product / BFM.
Result: The existing FB workflow now classifies approved corrections internally, reuses matching linked worktrees, places new workers under the primary checkout, shows the three queue buckets, reuses proven broad verification only after coordination-only changes, and runs an optional project preflight before mutation. No public command or status was added.
Evidence: Candidate `a6b00ab`; the focused contract first failed on missing helpers, then passed in root/package. CLI 70/70, session 32/32 (including real worktree reuse/placement and preflight failure), eval 18/18, beginner 10/10, positioning/two-speed contracts, full validator, doctor Ready, source/test/doc parity, syntax, and whitespace passed.
Remaining: Product may review or merge the local branch. Release, publication, deployment, plugin install, and consumer-project changes remain separate and unauthorized.
Loop Learning: Feedback captured: yes; Repeated pattern?: yes; Tooling needed?: small amendments to existing seams; Product approval needed?: no - explicitly approved.
