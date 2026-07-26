# Repository-Local Sessions

Session recaps are curated pointers, not another source of task truth. Follow
[records.md](records.md) for authoritative homes, verification fingerprints,
compact closeout, privacy-safe logs, and local efficiency metrics.

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
`Recovery attempted`, `Result`, and `Reusable lesson`; every individual
`Failure` block carries its own complete set of those five supporting fields.

A checkpoint requires current changes to both the recap and linked handoff. It
rejects unrelated staged files and stages only those two coordination records.
Planning and review also reject source dirt; execution may retain unstaged
source. Scope, decision, blocked, and verification checkpoints validate their
own evidence. A successful checkpoint commits and runs
`git push -u origin HEAD` only on a non-default branch. If push fails, the
commit stays intact, the session becomes blocked, and the CLI does not force,
rebase, roll back, or switch branches. Pending checkpoint state is persisted
before the commit so an interruption after commit and before push can resume by
pushing that exact commit and recording one milestone; a rerun never needs new
recap/handoff edits and never duplicates or rewrites the commit.

A verification checkpoint with selected evals records their IDs, authority,
results, and evidence. It keeps mechanical evidence separate from judgment and
does not run unrelated catalog evals.

Status also shows `Current`, `Next ready`, and `External blocks` so the active
queue is legible without reading every recap. After a successful verification
checkpoint, submit may reuse that broad proof when every later change is
coordination-only Markdown or a managed board/rules record. Any source,
runtime, configuration, or test change after the checkpoint runs the broad
gate again. This is verification reuse, not a bypass; `--no-tests` remains a
separate explicit exception.

## Receipt, validation, and closeout

The canonical linked handoff is the only completed-work authority; a recap
cannot substitute for missing handoff evidence. Its Task Receipt records the
approved brief and decisions; confirmed
assumptions and approved scope changes; branch, source commits, and changed
surfaces; checks, failures, recovery, and results; review state, direct links,
limits, and external gates; repository state; and remaining owner/action.
For a v3 Full BFM handoff it also records the changelog result defined in
[workflow.md](workflow.md#internal-approval-record). The Build Brief expectation
and Task Receipt decision must agree; a concrete not-required reason is copied
unchanged.

Brief Validation is `pass` or `blocked`. Product/BFM authors the semantic
comparison. The deterministic CLI only checks complete actionable structure:
satisfied criteria/evidence; missing criteria/reason/owner/next action; and
approved scope-change references. `None`, generated setup text, TODO/TBD,
bare example prompts, and placeholders do not satisfy completed evidence;
ordinary evidence prose may still use the lowercase word `example`.

Completed reviewable work requires passing Brief Validation, a complete Task
Receipt, verification checkpoint, Verification Handoff, reciprocal recap and
handoff links, and Test This Now. Verification Handoff requires its candidate,
plan, commands/results, environment, runnable links, manual pass criteria,
recovery, limits, and next recovery action. Test This Now requires actionable
outcome, links, numbered steps/expectations, pass criteria, limits, and failure
format. Blocked or deferred closeout requires blocked
validation plus a concrete reason, owner, and next action. `submit` applies the
same evidence gate and additionally requires one active execution session. It
revalidates the current board's In Progress approval, declared locks, linked
handoff, current branch, registered linked worktree, and lock conflicts after
tests/hooks and immediately before board mutation. Completed execution close
revalidates the same current authority before changing session state, accepting
only the normal In Progress or already-submitted Staging QA board states.
For v3 Full BFM sessions, completed close, submit, verification reuse, and the
release checkpoint additionally require a passing candidate-bound changelog
decision. Existing v2 records are historical-compatible; Quick and Normal work
remain exempt.

For selected evals, completed closeout leaves shadow failures visible,
requires an advisory fix or handoff explanation, and rejects unresolved
blocking/mechanical failure. Failure closure also requires classification,
revision, rerun, root cause, regression, fresh evidence, consistent
board/handoff/eval/session/Git records, and approval for changed user decisions.

## Recall, review, and privacy boundary

`recall` searches only explicit FB records: `PROJECT_BOARD.md`, workstream
cards, typed `fb-lane-handoff` files under `docs/handoffs/`, and typed
`fb-session-recap` files under `docs/sessions/`. `HEAD` is the default;
`--all-refs` adds only already-fetched local heads and remotes. It never fetches
or scans ordinary Markdown. Query and candidate content pass the same
transcript/private-reasoning/secret rejection before output. Results cite exact
source path and line, ref, full commit SHA, and matching text in deterministic
order.
`review` prints and copies a paste-ready Markdown packet while writing no
tracked review file; its only mutation is clone-local session state. If the
clipboard write fails, stdout still contains the complete packet and the
command exits nonzero with manual-copy recovery instead of claiming success.

Committed curated Markdown is the default durable record. Clone-local JSON is
transcript-free and should be deleted only after useful curated evidence is
preserved. Any hosted storage, transcript capture, analytics, or other external
capture needs a separate explicit approval and privacy review.

## Quick Records and local metrics

Quick BFM uses one `TASK-Q-*` Quick Record instead of the Full-BFM session
recap and reciprocal evidence set. It contains approval, scope, owner, locks,
focused verification, minimal worker context, its review requirement and
decision, one closeout, and an Efficiency Receipt. Status reads that record
without requiring a board row. Submit closes that same file and must not invoke
runtime suites or a full validator for coordination-only closeout.

Each new Quick Record says whether review is required. Documentation and
coordination records use `Review required: no`, `Reviewer: not required`,
`Reviewer decision: not required`, and `Reviewers: 0`; runtime and test records
use `Review required: yes` and require exactly one approved reviewer. A legacy
Quick Record without `Review required` keeps the previous exactly-one-reviewer
rule.

Each Quick Record represents one planned execution slice, not the total task.
Documentation/coordination slices normally target 5 minutes with two iterations
and one repair. Runtime/test slices normally target 15 minutes with three
iterations and one repair. Full BFM may coordinate many slices over hours;
timeout or exhaustion resplits or reroutes the unfinished slice while preserving
completed checkpoints. Independent, non-overlapping slices may run through
parallel agents or subagents; dependent or shared-file slices remain sequential.

For all modes, use a focused check by default. Sensitive work stops at its
immediate safety/approval gate. A Product-owned handoff must explicitly request
a release checkpoint before a full validator is eligible; a handoff Markdown
file, owner transfer, staging, or review alone is not that request.

The receipt records elapsed user wait, tool calls, focused and repeated checks,
broad-validator count, repair loops, reviewer count, provider tokens or
`unavailable`, and circuit-breaker state. Metrics are curated and local. They
exclude transcripts, hidden/private reasoning, secrets, authentication tokens,
environment values, and unredacted private data. Hosted metrics or external
integrations remain optional and require separate explicit approval and privacy
review.

## Install, upgrade, and removal

Bootstrap confirms the nine-page harness and adds or refreshes only the managed
FB route block in project-owned instructions. Upgrades replace the bundled
nine-page pack and managed route while preserving all text outside the markers.
For cleanup, close or preserve active session evidence first, then remove the
clone-local `fb-sessions` directory and dead mutation lock from the Git common
directory if no session command is running. Plugin removal does not delete
project-owned boards, handoffs, recaps, or instructions; remove those only as a
separate repository change with normal review.
