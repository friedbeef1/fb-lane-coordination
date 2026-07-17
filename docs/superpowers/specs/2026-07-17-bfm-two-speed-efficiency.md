# BFM Two-Speed Efficiency Design

## Purpose

Carry the proven MirrorCam delivery-loop lessons into FB without adding a competing workflow or public command. Product/BFM should resume faster, avoid nested worktrees, make the queue legible, and verify in proportion to risk while keeping ambiguous or risk-bearing work in Full BFM.

## Approved contract

- `Quick BFM Patch` is an internal class for bounded corrective work on an already-approved task with no lock conflict or new provider, privacy, auth, payment, analytics, live-release, core-flow, multi-lane, or OKR decision. Uncertainty falls back to `Full BFM`.
- Reuse an exact matching linked worktree. Otherwise resolve the primary checkout from `git worktree list --porcelain` and create a sibling execution directory under `<primary>/.worktrees/`; never nest below a linked worktree.
- Existing status output shows `Current`, `Next ready`, and `External blocks` with explicit empty states.
- After a successful verification checkpoint, coordination-only Markdown changes reuse that proof; source/runtime changes require the broad gate again.
- A project may configure a preflight hook before claim. FB does not impose Node, a package manager, or any global runtime version.

No new command, public board status, dashboard, runner, release, publish, install, provider behavior, or MirrorCam source change is included.
