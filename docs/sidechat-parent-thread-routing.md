# Sidechat Parent-Thread Routing

## Routing Rule

A sidechat has exactly one eligible destination: the originating main thread
from which it was opened (its parent). It must not choose a destination by
matching a thread's role, project, name, recency, or Product/BFM status.

## Missing Parent Context

If the parent thread cannot be identified or reached, the sidechat returns the
existing paste-ready handoff to the user and clearly states that the parent
could not be identified. It must not send, redirect, or imply a handoff to any
other main thread. The user must place that handoff in the intended
conversation.

## Receiving Main Threads

A main thread accepts a sidechat handoff only when it is identified as that
sidechat's parent. Any other main thread treats the material as ordinary
user-provided context, not an owned continuation or instruction.

## Durable Decision Record

This rule governs routing only. The existing Product/BFM rule remains: an
accepted decision becomes source of truth only after Product/BFM records it in
`PROJECT_BOARD.md`, a handoff, or other durable documentation.
