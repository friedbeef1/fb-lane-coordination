# Repository-Local Sessions

Use a session when work must survive a thread handoff, checkpoint, recovery, or
review. The board and linked handoff remain authoritative for approval, scope,
ownership, and locks. Session JSON is clone-local coordination state; the
committed recap is curated evidence. Neither is a transcript.

## Public commands

```text
session intake [--session-id <id>]
session promote <task-id> <lane> --mode planning|execution|review [--session-id <id>]
session status [--all] [--session-id <id>]
session checkpoint --reason scope|decision|blocked|verification [--session-id <id>]
session recall <query> [--all-refs]
session review <branch|commit> [--session-id <id>]
session close --outcome completed|blocked|deferred [--session-id <id>]
```

The CLI resolves an ID from `--session-id`, then `CODEX_THREAD_ID`, then
`FB_SESSION_ID`. IDs must be safe filename components. `intake` is an observer:
it validates and prints the effective ID without writing a registry, recap,
branch, or worktree. Sidechats remain observers and send accepted decisions to
their originating parent; they never promote themselves.

## Promotion gates

Accepted lanes are `product`, `tech`, `design`, `business`, `bfm`, and
`coordination`. Planning and review need a non-default session branch. Execution
also needs an approved In Progress board item, a linked handoff, declared
normalized repository-relative locks, and a linked Git worktree. Exact-file and
directory-prefix lock overlap both block promotion. Repeating the same active
ID/task/lane/mode is idempotent; a closed ID is not reusable for another task.

Live records are atomically replaced under the Git common directory at
`fb-sessions/<session-id>.json`. Linked worktrees therefore share one registry.
A shared mutation lock serializes writers and recovers a dead owner within a
bounded wait. After 24 hours without a milestone, status computes `stale`; it
does not release declared locks.

## Curated recaps and checkpoints

Promotion creates `docs/sessions/<session-id>.md`. Keep it concise and curated:
objective, scope, decisions or assumptions, Task Receipt, Brief Validation,
structured failure evidence, verification, repository state, and next owner.
Never add raw transcripts, private reasoning, secrets, credentials, tokens, or
environment values. Meaningful failures use `Failure`, `Observed`, `Cause`,
`Recovery attempted`, `Result`, and `Reusable lesson`.

A checkpoint requires current changes to both the recap and linked handoff. It
rejects unrelated staged files and stages only those two coordination records.
Planning and review also reject source dirt; execution may retain unstaged
source. Scope, decision, blocked, and verification checkpoints validate their
own evidence. A successful checkpoint commits and runs
`git push -u origin HEAD` only on a non-default branch. If push fails, the
commit stays intact, the session becomes blocked, and the CLI does not force,
rebase, roll back, or switch branches.

## Receipt, validation, and closeout

The canonical Task Receipt records the approved brief and decisions; confirmed
assumptions and approved scope changes; branch, source commits, and changed
surfaces; checks, failures, recovery, and results; review state, direct links,
limits, and external gates; repository state; and remaining owner/action.

Brief Validation is `pass` or `blocked`. Product/BFM authors the semantic
comparison. The deterministic CLI only checks complete actionable structure:
satisfied criteria/evidence; missing criteria/reason/owner/next action; and
approved scope-change references.

Completed reviewable work requires passing Brief Validation, a complete Task
Receipt, verification checkpoint, Verification Handoff, reciprocal recap and
handoff links, and Test This Now. Blocked or deferred closeout requires blocked
validation plus a concrete reason, owner, and next action. `submit` applies the
same evidence gate and additionally requires one active execution session.

## Recall, review, and privacy boundary

`recall` searches committed curated Markdown in `HEAD`; `--all-refs` adds only
already-fetched local heads and remotes. It never fetches. Results cite exact
source path and line, ref, commit, and matching text in deterministic order.
`review` prints and copies a paste-ready Markdown packet while writing no
tracked review file; its only mutation is clone-local session state.

Committed curated Markdown is the default durable record. Clone-local JSON is
transcript-free and should be deleted only after useful curated evidence is
preserved. Any hosted storage, transcript capture, analytics, or other external
capture needs a separate explicit approval and privacy review.

## Install, upgrade, and removal

Bootstrap confirms the six-page harness and adds or refreshes only the managed
FB route block in project-owned instructions. Upgrades replace the bundled
six-page pack and managed route while preserving all text outside the markers.
For cleanup, close or preserve active session evidence first, then remove the
clone-local `fb-sessions` directory and dead mutation lock from the Git common
directory if no session command is running. Plugin removal does not delete
project-owned boards, handoffs, recaps, or instructions; remove those only as a
separate repository change with normal review.
