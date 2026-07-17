# TASK-026 Two-Speed Evidence

This is a concise distribution-safe mirror of the evidence recorded in the
canonical `docs/handoffs/TASK-026.md`. The verified local candidate is
`a6b00ab` on `codex/fb-beginner-clarity`.

## Observed pain and implemented response

| Observed pain | Implemented response |
|---|---|
| Repeated runtime and worktree rediscovery | `project-preflight` runs an optional project-owned check before mutation, while `matching-worktree-reuse` resumes one exact existing worker. |
| Nested worktree placement | `primary-checkout-placement` puts new workers beneath the primary checkout's `.worktrees/` directory rather than beneath another linked worktree. |
| Unnecessary broad reruns after documentation-only closeout | `proportional-verification` reuses a proven broad checkpoint only when every subsequent change remains on the coordination-only path allowlist; ambiguity or any other path returns to fresh broad verification. |
| Obscured queue state | `compact-queue-status` names Current, Next ready, and External blocks, including explicit empty states. |

These are five implemented responses: project preflight, matching-worktree
reuse, primary-checkout placement, proportional verification with checkpoint
reuse, and compact queue status. Full BFM remains the safe fallback.

## Exact verification recorded by TASK-026

- Root and packaged CLI suites: 70/70 each.
- Root and packaged session suites: 32/32 each, including real worktree reuse,
  placement, and preflight failure coverage.
- Root and packaged eval suites: 18/18 each.
- Root and packaged beginner suites: 10/10 each.
- Root and packaged positioning and two-speed contracts passed.
- Full validator passed; standalone doctor reported Ready.
- Source, test, and documentation parity, syntax, and whitespace passed.

## Distribution status

This evidence describes a local-only candidate. It has not been reconciled,
pushed, merged, published, released, deployed, or installed.
