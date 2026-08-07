# Coordinate and execute

The public workstream-first and `$bfm` reconciliation contract lives in
[start.md](start.md). Internal execution classification is not a user choice.
When the approved Build Brief opts into transformation routing, pairwise
comparison, layered gates, or diagnosed configuration evolution, follow the
[generic control-loop contract](control-loop.md). Its stages are capabilities,
not additional workstreams or mandatory agents.

## Ownership and durable records

- **User:** owns user outcomes, requirements, real feedback, priority evidence, and acceptance criteria. It labels inference as assumptions and never invents user evidence.
- **Tech:** owns schemas, APIs, serverless/security/configuration, and tests; it does not make styling, layout, font, or appearance changes.
- **Design:** owns CSS, tokens, assets, layout geometry, and visual viewports; it does not edit schemas, API routes, or backend logic.
- **Business:** owns pricing/copy/onboarding/docs/help/marketing; it is read-only on application code and does not deploy.
- **Discovery:** owns research, unknowns, experiments, competitor evidence, and feasibility evidence; it does not implement or set final priority.
- **Bugs:** owns reproduction, severity, affected-user impact, regression evidence, and verification requirements; it does not quietly fix source.
- **Product/BFM control centre:** owns reconciliation, sequencing, approved implementation, verification, and release gates. It is not an evidence-producing workstream.
- **All workstreams:** investigate and write plans/handoffs in ordinary chats; a handoff ready for Product intake is a candidate only, and none starts source execution without Product-launched BFM.
- **BFM execution workers:** may claim locked files, use an isolated branch/worktree, edit, verify, and submit only within an approved BFM run.

## Canonical checkout and complete intake

Product/BFM executes only from the active canonical checkout. Before claim,
source mutation, or execution routing, the runtime freezes and renders one
complete intake ledger. It covers canonical handoffs, linked worktrees,
every non-retired checkout registered by the migration manifest (plus explicit
audit roots), board/index routes, all six
workstream cards plus one Product/BFM control-centre card, active locks,
approval gates, external blockers, lifecycle state, unresolved drift, and
exact-project task rebind. The execution and empty-queue gates also require the
existing clone-local onboarding receipt to prove the exact project ID,
canonical repository path, all seven exact pinned task bindings, and its
reconciliation ledger. An absent, pending, declined, partial, or stale receipt
fails closed. User, Business, Design, Tech, Discovery, and Bugs
remain visible in canonical order; Product/BFM is shown separately as the
control centre, including compatible `lane: fb-product` inputs. Every candidate receives exactly one
allowed disposition or the execution gate stays closed.

Missing roots, inaccessible authoritative records, same-path content or routing
drift, hidden Ready work, incomplete role inventory, conflicting dispositions,
dependency cycles, and noncanonical execution fail closed. Guidance consumes
the runtime ledger; it does not duplicate scanner or checkout-discovery logic.
Blocked handoffs stay linked and counted in that ledger even though BFM excludes
them from execution; a blocked-only role never reports **None relevant**.

Checkout moves use a transactional migration. Product/BFM inventories and
dispositions every discovered branch, commit/tree, worktree, dirt, handoff, and
routing difference; atomically records one canonical root plus quarantined
former roots; rebinds the exact seven pinned tasks; verifies canonical
acceptance and former-root rejection; and requires fresh evidence plus explicit
approval before retirement. Former roots remain recoverable until that final
gate.

## Workstream-to-workstream routing

A main workstream may route a bounded planning question to a different main
workstream only when the user explicitly asks. Record it as
`type: fb-workstream-handoff` with `status: queued`, then give the destination
the passive notice `<Source> handoff queued for <Destination> — planning only; waiting for you. Open: <handoff link>`.
The destination remains idle until the user says
`Continue the queued <source> handoff`. It may investigate, gather evidence,
and recommend, but may not execute source. A delivery recommendation requires
a separate Product-ready `fb-lane-handoff`. `$bfm` ignores every
`fb-workstream-handoff` state.

If Codex task tools are unavailable, return the Markdown file and paste-ready
notice to the user. This main-workstream route does not weaken the sidechat
rule: a sidechat can route only to its originating parent.

The board is truth; the handoff index is routing; detailed handoffs are detail;
workstream cards are compact revisit summaries. Awareness comes from the board
and index, isolation from branches/worktrees, and integration from BFM.
The exact ownership boundaries, prospective consistency checks, risk-triggered
review rule, and compact closeout shapes live in [records.md](records.md).

Every lane leaves a passive closeout with task ID, status, delivered work,
evidence, remaining gates, and handoff path. Product/BFM additionally records a
loop-health flag: `healthy`, `watch`, `needs Product review`, or `blocked`.
Never call a lane done or executed without its required evidence. Passive
closeouts contain no commands, invocations, or instructions to start another
lane; the board and handoffs remain the trigger source.

Read or refresh the index before detailed handoffs, then open only relevant
detail unless doing a full closeout. For non-quick sequencing, refresh a
missing, stale, or vague index. Its compact columns are `Task / Topic`, `Lane`,
`Status`, `Depends / Blocks / Gate`, `Checks / Evidence`, and `Detail`; full
plans, OKRs, logs, and QA stay in the detailed handoff. Product/BFM adds
`## Product/BFM Closeout` to that handoff, then refreshes the relevant compact
workstream card after execution or explicit deferral.

## Internal approval record

For non-trivial work, Product owns one approved Goal Alignment Session on the
board: `Objective`, `Key Results`, `Definition of Done`, `Gate / Review Point`,
`Approval`, and `Justification`. Each relevant lane handoff has a compact
`## Goal Alignment Session` with:

```md
Product Goal: <existing approved Product/workstream goal, if known>
Workstream Goal: <plain-language lane contribution for Product/user approval>
Lane OKR Fit: aligned | suggest approach change | blocked by OKR ambiguity
User Approval Needed: yes | no
Mini-loop Evidence: <smallest real verification evidence>
Evidence Against Product OKR: <weakening/blocking evidence> | None identified
```

Worker lanes return evidence against the existing goal; they do not create a
new OKR for every task. `/goal` is only a Product/BFM shortcut into this same
session. Quick `TASK-Q-*` work may skip this extra ceremony.

After `$bfm`, Product freezes intake and must disposition every candidate as
**Include now**, **Blocked**, **Deferred**, **Duplicate**, **Rejected**, or
**Superseded** before source execution. A handoff ready for Product intake is
not approval or execution authority. A disposition does not auto-close a task;
all genuinely nonterminal candidates remain visible in authoritative records.
Product then records the consolidated Build Brief for the **Include now** scope.
This does not require a routine second approval; pause only for changed
decisions, disputed priorities, sensitive boundaries, conflicts, or unclear
scope. The Build Brief repeats the quality bar, selected eval IDs and authority,
mechanical versus judgment evidence, and remaining user judgment. See
[evals.md](evals.md). Product defines concrete product scenarios with Good and
Bad examples; reusable categories alone are not a test.

The Build Brief may opt into `controlLoop` capabilities and name the applicable
criteria, profile manifest, golden-fixture manifest, gates, and evidence. Clear
routes remain deterministic; ambiguity requires assigned judgment. Exact
Product approval is required before an isolated configuration candidate can
change canonical configuration.

Every new Full BFM handoff uses `fb_harness: v3`. Its Build Brief records one
changelog expectation before implementation:

```md
Changelog expectation: required
```

or `Changelog expectation: not expected — <concrete reason>`. At closeout the
Task Receipt records either `Changelog: updated — [CHANGELOG.md](../../CHANGELOG.md#<entry-anchor>)`
or the matching `Changelog: not required — <same concrete reason>`. A required
entry has its own heading and concrete **What changed**, **Why it matters**,
**Compatibility**, and **Installation or upgrade** fields. Product decides
whether the result is user-visible; deterministic checks only enforce the
record, candidate range, link, fields, and agreement. Historical v2 handoffs,
Quick BFM, and Normal Codex are exempt. Meaningful Quick changes may be
consolidated into the next Full BFM or release entry.

### Standing delegated approvals

The user's standing delegation lets Product/BFM approve routine internal
release gates. When a changelog entry faithfully describes the approved
candidate and introduces no changed user or product decision, Product/BFM
approves the changelog without a user prompt and records
`Changelog approval: approved — Product/BFM standing delegation; Reference: <handoff/commit/date>`.

After focused checks and candidate-bound changelog verification pass,
Product/BFM also authorizes one initial release checkpoint without a user
prompt. The existing one-repair and no-progress circuit breakers still apply.
This delegation never authorizes a changed product outcome, material scope or
priority decision, weakened evidence, privacy/auth/payment/provider/destructive
operation, or other sensitive gate. Ask the user only for that concrete
decision. **Push Live** remains the only merge, publication, installation, and
deployment authorization.

For a historical `Changelog approval: pending` record, Product/BFM either
resolves it under this standing delegation when it is candidate-faithful or
converts it into the exact material-decision or sensitive gate that genuinely
needs the user. Do not repeatedly resurface a routine wording approval in later
documentation reviews.

For a user-visible UI plan, record `browser screenshot/mockup`, `imagegen
asset/style option`, or `skip with reason`. Skip only for non-visual work or a
tiny copy, spacing, or single-control change. Attach a feasible material visual
preview before BFM source execution; Product/BFM blocks or asks only when that
material decision lacks a preview.

## Before BFM source execution

1. Read `AGENTS.md`, board, current-task record if present, the handoff index, then only linked handoffs.
2. Show the target card: status, owner, scope, locks, blockers, gates, checks, links, intentional dirt, and approved goal.
3. Scan the six evidence-producing workstreams in order: User, Business, Design, Tech,
   Discovery, Bugs. Each is linked to ready/blocked output or recorded as **None
   relevant**. Include only valid `ready` handoffs as candidates; exclude
   implemented, done, and deferred work; stop to reconcile duplicates or
   contradictions.
4. `$bfm` freezes intake. Product must disposition every candidate as **Include
   now**, **Blocked**, **Deferred**, **Duplicate**, **Rejected**, or
   **Superseded** before source execution. A ready candidate is not approval or
   execution authority. Do not auto-close tasks: preserve all genuinely
   nonterminal candidates in the board and handoff records.
5. If the resulting **Include now** scope is missing, stale, changed, or
   unclear approval, stop before claim, edit, deploy, or closeout. Product then
   records the Project Start Brief and Build Brief that authorize BFM execution.
6. Run a Story Split Pass before execution, like backlog grooming and sprint
   planning. Build the smallest useful dependency graph and split predictable
   work into independently finishable slices, normally 15 minutes or less
   (documentation-only slices may target 5). Each slice records its outcome,
   expected surfaces and locks, dependencies, completion criteria, smallest
   focused check, and safety triggers. Avoid slices that add ceremony without
   isolating dependency, risk, ownership, or verification.
7. Mark independent, non-overlapping slices parallel-ready for agents or
   subagents. Keep dependent slices, shared-file edits, and unresolved decisions
   sequential. Split mixed risks, gates, review surfaces, blocked work, and
   ready work; otherwise say `No split needed`.
8. Classify work as `ready now`, `blocked by lock`, `blocked by dependency`, `needs Product decision`, `out of scope`, or `explicitly deferred`. Recheck status immediately before a claim.
9. Select only relevant eval IDs from [evals.md](evals.md), record their authority, and separate mechanical evidence from Product/user judgment.

## Automatic implementation worktrees

After the Story Split Pass, BFM must automatically create or reuse one linked
worktree for every independent, non-overlapping source-changing slice. For each
eligible slice, Product first records a **unique approved child task ID**, its
inherited brief, dependencies, locks, and focused proof. BFM then invokes
`fb_lane_claim` or
`node tools/fb-lane.cjs claim <task-id> <lane> <locked-files>` and captures the
returned branch and worktree path before starting its worker. The claim path
reuses an exact clean branch match; otherwise it creates the worktree beneath
the primary checkout's `.worktrees/` directory.

BFM creates claims one at a time from the primary checkout so authoritative
board and lock mutations cannot race. After all claims are registered, BFM may
start independent workers concurrently. A parent outcome with one slice may
reuse its existing task ID; several implementation slices never share one claim
identity.

Planning-only work does not receive an implementation worktree. Dependent,
overlapping, shared-file, sensitive, or unresolved-decision slices remain
sequential until their blocking condition is cleared; BFM may still isolate a
sequential source-changing slice when that protects the primary checkout. BFM
must not ask the user to create, choose, organize, or manage implementation
worktrees.

Before workers start, BFM reports a compact **slice / branch / worktree map**.
After each worker returns, BFM verifies the claimed branch and worktree,
integrates only the approved candidate, and records whether each worktree is
clean, merged, blocked, stale, or retained. Integration and cleanup run from
the primary checkout. After a branch is merged, FB removes its worktree only
when it is registered, present, and clean. Cleanup never removes the primary
checkout and never uses broad or forced pruning. A dirty, unmerged, missing,
blocked, or deferred worktree remains registered with an owner and next action;
the task and locks remain open when cleanup blocks.

Worktree isolation does not make a handoff visible across checkouts:
Product/BFM must integrate ready handoff commits into its coordination checkout
before reconciliation.

## Internal execution routing

Agents classify clear isolated low-risk work, approved bounded corrections, and
ambiguous or material-risk work internally; do not expose this as a menu.
Safety gates run first. Quick BFM owns exactly one committed
`docs/handoffs/TASK-Q-*.md` Quick Record; it does not add a board row, index
row, workstream card, session recap, separate Task Receipt, or separate
Verification Handoff. Needing any of those reclassifies the task Full BFM.

The time budget applies per execution slice, not to the complete outcome. Quick
BFM is one bounded slice: documentation/coordination normally targets 5
minutes, two total agent iterations, one consolidated repair, and zero reviewers
after focused checks pass; runtime/test normally targets 15 minutes with three total agent
iterations, one consolidated repair, and exactly one reviewer. Quick work stays
with the current owner and uses no implementation subagent. Full BFM may run
for hours by coordinating many such slices. It runs independent, non-overlapping
slices concurrently through agents or subagents and sequences dependencies,
shared-file edits, and unresolved decisions. A slice timeout, second repair,
exhausted iteration budget, repeated broad gate, or one cycle without a material
source, evidence, test-state, blocker-recovery, or approved-direction delta
stops that slice for resplitting or Full-BFM routing; it does not discard
completed slices or stop an otherwise healthy multi-slice outcome. Authoritative
provider token/cost ceilings apply only when supplied; otherwise record
`unavailable` and never estimate them from a transcript.

Before implementation, put the smallest adversarial contract in RED: the
expected path, a mixed or unknown path, and the sensitive boundary. Implement
the canonical source once and run its focused root check. Runtime/test work gets
one focused review of that complete canonical candidate. If required, make one
consolidated repair and rerun only the failed proof. Generate package mirrors
once after review passes, then run parity and only package-context checks that
exercise a different path.

Before every repeated worker, repair, review, or gate, compare the candidate
with its predecessor. Reworded reports, repeated checks, another opinion, and
equivalent evidence are not progress. Workers receive only the current brief,
candidate/diff, specific feedback, and required evidence—never accumulated
conversation history, transcripts, unrelated reports, or private reasoning.
Stop immediately when the explicit success predicates pass.

When a focused proof fails, start a fresh repair worker with one **fresh delta repair packet**.
It contains only the failed criterion and observed proof,
changed files, candidate reference, relevant decisions, and one concrete
correction. It does not resume or replay the accumulated worker conversation.
Rerun only the failed proof. If no concrete correction can be identified, stop
before starting the worker. No candidate change or no readiness improvement is
a harness failure and ends the repair path; it is not permission for broader
rediscovery or another diagnosis loop.

Product direction is not automatically a user prompt. After a circuit breaker,
Product/BFM may own one bounded Product-directed recovery when there is a
concrete cause, the correction remains inside approved scope, and no user
decision or safety/hard gate changes. Apply one consolidated correction, run
the focused proof, then the necessary final release pass if already
authorized. Ask the user only if the recovery changes product outcome, scope,
or priority; weakens evidence; crosses a safety or hard gate; lacks concrete
progress; or that single Product-directed recovery fails.

Run only the smallest focused proof after each slice. At an integration or
release checkpoint, run only the proof appropriate to that boundary: an
integration check when dependent slices are meaningfully combined, and broad
validation only for an explicit release checkpoint. If implementation exposes unexpected
complexity, preserve completed slices, resplit only the remaining work, refresh
the dependency graph, and continue within the declared locks and safety gates.

The ordinary delivery finish is intentionally simple:

1. FB runs the selected automated checks and owns bounded recovery when a
   required check fails.
2. FB shows any review URLs as **Optional review links**; routine QA is not
   transferred to the user.
3. When the candidate-bound checks and required safety gates pass, FB reports
   **Ready to ship** only after the Full BFM changelog decision also passes.
4. FB says: `Automated checks passed. Optional review links are available
   above.` followed by `Say **Push Live** to deploy.`
5. FB does not merge, deploy, publish, or otherwise consume live approval until
   the user explicitly says **Push Live**.

A failed required check remains `Checking` while FB makes only scoped changes
supported by the failure evidence and within the declared repair budget. FB
may fix the implementation, test fixture, configuration, or documented build
brief when that is the classified cause; it must not silently change the
approved product outcome or weaken a valid check to obtain a pass.

Reuse an exact matching linked worktree. If none exists, resolve the primary
checkout from `git worktree list --porcelain` and create the worker under
`<primary>/.worktrees/`; never create `.worktrees` beneath a linked worktree.
Status keeps the queue compact with `Current`, `Next ready`, and `External
blocks`, including `None` when a bucket is empty.

Verification is proportional: coordination-only closeout runs one combined
structure-and-link check plus whitespace; documentation runs its factual,
structural, link, and render contract; test-only work runs the affected suite. Runtime,
validator, generated runtime, or execution configuration runs focused tests
plus at most one full validator after the final runtime checkpoint. Sensitive
work uses Full-BFM safety/release gates. A later runtime change invalidates the
checkpoint; coordination-only closeout reuses it without runtime suites.
Projects may define `hooks.focusedTest` in `.fb-lane.json`; its check defaults
to a 5-minute timeout and `timeouts.focusedTestMinutes` may raise that to at
most 10 minutes. Without the hook, FB safely falls back to `npm test` under
the same bound. A timeout reclassifies the candidate Full BFM.

Execute only ready, unlocked work within the same approved goal or scope. A
different board item needs Product approval. During execution, record task,
lane, branch/worktree, and locks. At closeout, name clean, merged, stale,
blocked, or intentionally dirty state; intentional dirt requires owner,
reason, next gate, and session-boundary action.

BFM blocks before execution, audit, or merge when approval is missing, stale,
or unclear; OKRs are unclear; or a handoff implies an unapproved OKR change or
conflicts with the approved OKR tree. Product must reconcile the conflict in
the board/handoff by choosing and recording an aligned approach, scope, or
sequence (and renewed approval when needed). BFM does not create or rewrite
OKRs dynamically to make a conflict disappear.

The board flow is: drift audit; plan/approved goal; story split; BFM claim and
exact affected screens/locks; isolated verification and staging QA; branch/PR/
staging links; structured handoff, unlock, and closeout. Before resuming, check
board status, outside changes, current deployment authorization, uncommitted
scope/dirt, and whether the next action still belongs to the assigned lane.

`Staging QA` is the internal board enum for a candidate awaiting verification;
it does not claim that the candidate is deployed to a staging host. Record the
actual review environment separately as local, sandbox, staging, or completed
build.

## Return loop

After each slice, return to the board. After coding, return to the handoff;
after checks, compare source, docs, and board; after coordination updates, run
the project status check; after commit/push, check Git state. Close only when
board, source, docs, evidence, and Git agree, or every disagreement is
explicitly marked. See [evidence.md](evidence.md) for review evidence and
[guardrails.md](guardrails.md) for stop points. Before revising a failed eval,
classify it as Build, Brief, Eval, or Environment failure. BFM does not weaken
the target; insufficient product output stays
`Checking — product quality target missed` with a complete Quality Gap.
