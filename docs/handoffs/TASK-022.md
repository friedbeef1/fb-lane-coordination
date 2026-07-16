---
type: fb-lane-handoff
task: TASK-022
lane: fb-product
status: ready
okr_fit: aligned
fb_harness: v2
Review state: not reviewable
---

# TASK-022 — Repository-Local Session Ledger

## Goal Alignment Session

Product Goal: Reduce the user's hands-on coordination between an approved brief and a reviewable result.
Workstream Goal: Give durable Codex work one resumable repository-local session record connected to the board, handoff, Git evidence, and verification.
Lane OKR Fit: aligned
User Approval Needed: no
Mini-loop Evidence: The clean starting branch passed both 45-check CLI suites, recovery routing, syntax, and doctor Ready before implementation.
Evidence Against Product OKR: None identified.

## Project Start Brief

What you asked for: Implement the full repository-local session ledger before the dependent eval loop.
Your decisions: Full ledger now; automatic validated checkpoint pushes on non-default branches; planning/review require a session branch; execution requires a linked worktree; TASK-023 follows only after this task's gate.
Assumptions to confirm: None — the implementation plan is explicitly approved.
What FB will build: Seven session commands, atomic shared live state, curated committed recaps, Task Receipts, Brief Validation, failure evidence, recall/review, bootstrap and doctor integration.
Out of scope: Transcripts, hosted services, external capture, dashboards, release, publication, deployment, merge, and consumer-repository changes.
Success looks like: Twelve concurrent sessions remain safe, completed reviewable work cannot close without complete evidence, and root/package/bootstrap behavior stays aligned.

## Build Brief

- Implement `tools/fb-session.cjs` and its packaged mirror as the cohesive session subsystem.
- Dispatch the seven approved session commands from the existing CLI.
- Keep clone-local live records atomic under the Git common directory; keep durable recaps under `docs/sessions/`.
- Enforce branch, worktree, approval, lock, checkpoint, closeout, privacy, Task Receipt, Brief Validation, Verification Handoff, and Test This Now contracts.
- Make `claim` and `quick` use worktrees by default while preserving the compatibility flag.
- Add the sixth harness page, bootstrap migration, doctor checks, mirrored tests, and full local verification.

## Lane Ledger

- FB-Lane: current board, index, canonical harness, and task locking used; no separate lane handoff.
- FB-Product: approved plan and this durable Build Brief.
- FB-Tech: Product-launched implementation and verification owner.
- FB-Design: no relevant handoff; no visual application surface.
- FB-Business: no relevant handoff; no pricing, positioning, or public claim change.

## Verification Handoff

Candidate: `codex/fb-session-ledger`; implementation commit pending.
Test plan: [approved plan](../superpowers/plans/2026-07-16-fb-session-ledger-and-eval-loop.md)
Commands and results: baseline root/package 45-check suites, recovery contract, syntax, and doctor Ready passed; implementation checks pending.
Environment: isolated linked worktree at `/Users/jamesyeang/.codex/worktrees/fb-lane-objective-checkpoints`.
Runnable evidence links: not reviewable — CLI and repository harness change only.
Manual pass criteria: Product branch-diff review confirms the command, evidence, privacy, bootstrap, and compatibility contracts.
Recovery attempted: none required.
Next Product/BFM recovery action: complete test-first implementation, focused tests, full gate, and independent review.

## Loop Learning

Feedback captured: repeated context reconstruction and manual test-plan prompting.
Repeated pattern?: yes
Tooling needed?: propose automation — explicitly approved as the session ledger.
Product approval needed?: no
