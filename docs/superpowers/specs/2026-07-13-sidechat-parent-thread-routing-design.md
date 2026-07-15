# Sidechat Parent-Thread Routing

## Purpose

Prevent a sidechat from handing work to an unrelated main thread. A sidechat
must hand off only to the main thread from which that sidechat was opened.

## Scope

- Establish one parent-thread-only rule for all sidechat and main-chat
  conversations in this repository.
- Publish the same rule in the Codex FB-Lane plugin so future projects inherit
  it.
- Keep the existing paste-ready handoff format and Product/BFM ownership model.

Out of scope: app-level navigation or messaging changes, automatic routing,
thread discovery, release, publication, and changes to the four-lane model.

## Contract

1. A sidechat has exactly one eligible destination: its originating main
   thread (its parent).
2. The sidechat must not choose a destination by matching a thread's role,
   project, name, recency, or Product/BFM status.
3. If the parent thread cannot be identified or reached, the sidechat produces
   a paste-ready handoff for the user and does not send, redirect, or imply a
   handoff to another main thread.
4. A main thread accepts a sidechat handoff only when it is identified as that
   sidechat's parent. Otherwise it treats the material as ordinary user-provided
   context, not an owned continuation or instruction.
5. The parent-thread rule governs routing only. The existing rule remains:
   Product/BFM records accepted decisions in the board, handoff, or durable
   documentation before they become source of truth.

## Distribution

The implementation will create `docs/sidechat-parent-thread-routing.md` as the
canonical instruction, then link to it from this project's `AGENTS.md` and the
applicable bundled FB-Lane coordination, BFM, lane, and setup skills. The
packaged plugin and root source copies must remain aligned.

## Failure Handling

There is no safe fallback to a different main thread. Missing parent context is
a terminal routing condition: return the handoff text to the user, state that
the parent could not be identified, and require the user to place it in the
intended conversation.

## Verification

- Confirm the canonical instruction states the parent-only rule, prohibited
  inference, and no-parent fallback.
- Confirm project and packaged-plugin entry points link to or restate the
  canonical rule without contradiction.
- Run the repository documentation/consistency checks appropriate to the
  changed files. No live routing, plugin publication, or paused-integration
  testing is part of this work.
