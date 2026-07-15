# FB-Lane Coordination for Codex

Current model name: **FB-Lane 0.2.0-beta: Loop Engineering public beta**.
Current plugin build: Codex `0.2.0-beta+codex.20260707114230`. See
[`docs/versioning.md`](../../docs/versioning.md) for the v1-to-latest
before/after.

This package is the supported FB-Lane distribution for Codex.

This Codex plugin packages FB-Lane's Loop Engineering workflow:

- skills for BFM, Product, Tech, Design, Business, and overall lane coordination
- an `fb-lane` MCP server backed by `tools/fb-lane.cjs`
- a repo marketplace entry at `.agents/plugins/marketplace.json`

Codex already provides the concurrency. FB-Lane provides the Product Lead loop
around it: approved Product/workstream OKRs, plan-only workstreams, BFM execution, evidence return,
BFM reconciliation, and clean closeout. The full operating model lives in
[`docs/loop-engineering.md`](../../docs/loop-engineering.md).

FB-Lane's framework OKR is simple: help Product Leads run multi-agent work
without losing alignment between goals, evidence, board state, and repo truth.
Use closeout health flags (`healthy`, `watch`, `needs Product review`,
`blocked`) instead of per-task OKRs or numeric loop scoring.

Bootstrapped projects use `PROJECT_BOARD.md` as the source of truth and
`docs/handoffs/index.md` as the first-read routing layer. Detailed handoffs are
the detail layer. Read or refresh the index before opening detailed handoffs so
Codex does not load stale historical closeouts by default. Keep the index
compact with `Task / Topic`, `Lane`, `Status`, `Depends / Blocks / Gate`,
`Checks / Evidence`, and `Detail`.

Bootstrapped projects also include `docs/workstreams/<lane>.md` status cards.
Product/BFM updates the detailed handoff with `## Product/BFM Closeout`, then
refreshes the relevant card after executing or explicitly deferring a lane
handoff so returning lanes can see what already happened, what remains pending
or blocked, and where the evidence lives. Cards are summaries only, not a second
board.

Use the awareness, isolation, integration rule: `PROJECT_BOARD.md` and
`docs/handoffs/index.md` create shared awareness like a standup;
branches/worktrees isolate execution like separate desks; BFM integrates
outcomes like Product/release review. Worktrees do not replace coordination: no
private worktree should produce a huge unannounced diff, edit source without
board/lock awareness, or close without BFM reconciliation when multiple outputs
exist.

Regular cleanup includes external test state: if checks touch a real provider,
database, payment system, email system, or analytics workspace, closeout names
test mode, created records/resources, cleanup evidence, or the pending cleanup
gate.

## BFM Workflow

For BFM/all-handoff processing, Product/BFM must use the same visible workflow
on every plugin surface:

- **Pre-Execution Card Snapshot**: before claims, edits, deploys, or completion,
  show the board card ID, status, lane/owner, area, scope, locks, linked
  handoffs, blockers, gates, checks, branch/PR/staging URL if known, intentional dirty
  state, objective, key results, definition of done, approval state, and
  justification.
- **Goal Approval Gate**: if multiple cards match, show candidates and recommend
  one. If approval is missing, pending, stale, changed, or unclear, stop before
  claiming files, editing, deploying, or completing.
- **five-lane handoff ledger**: check `FB-Lane`, `FB-Product`, `FB-Tech`,
  `FB-Design`, and `FB-Business`; name matching handoffs or record
  `no handoff found`; end every found handoff as `implemented`, `already done`,
  `blocked`, `out of scope`, or `explicitly deferred`.
- **Story Split Pass**: before prioritizing, decide whether the run should be
  split into smaller stories. Split mixed lanes, risks, locks, gates, review
  surfaces, blocked work, and ready-now work; otherwise say `No split needed`.
- **Dependency And Lock Pass**: classify each ledger item or child story from
  status, owner, locks, dependencies, blockers, gates, approval, and required checks as
  `ready now`, `blocked by lock`, `blocked by dependency`,
  `needs Product decision`, `out of scope`, or `explicitly deferred`.
- **Unblocked Sequence**: execute only `ready now` work; split independent
  unlocked work, defer locked overlap with the blocking task named, or stop with
  the next unblock action when everything is blocked.
- **BFM Auto-Unblock Rule**: when the user says `BFM`, flag each blocker,
  recommend how to address it, execute the recommended safe unblock path inside
  the approved scope, and keep looping until every task is done, explicitly
  deferred, out of scope, or blocked by a real stop point.
- **Recheck Before Claim**: rerun lane status immediately before claiming or
  editing; resequence if locks changed.
- **Post-Action Card Summary**: before closeout, summarize card ID, final
  status, changed files, checks run, remaining gates, next owner, and whether
  live deploy is still blocked.

BFM returns to the board after each slice, but the board is not an infinite job
queue. BFM continues only through work that belongs to the same approved OKR or
scope. A different board item requires Product approval unless a separately
approved self-approval phase allows it.

Tech, Design, and Business BFM execution workers wait for Product/BFM to clear
the Pre-Execution Card Snapshot, Goal Approval Gate, Story Split Pass,
Dependency And Lock Pass, Unblocked Sequence, and Recheck Before Claim before
claiming, editing, or submitting.

Treat FB-Lane as an optional coordination protocol, not as the thing that makes Codex parallel.
Default to normal/simple coding for single-thread work, simple fixes, read-only questions, code
explanations, isolated edits, or independent work where Codex worktrees are enough.

Use FB-Lane light when the objective mentions handoffs, board items, lanes, BFM, Product, Design,
Business, coordination files, board-locked files, multiple threads/agents/workstreams, or durable
context. Keep quick tasks lightweight: read the board/locks and avoid extra handoff or OKR ceremony
unless another lane or Product must continue it.

Escalate to Product/BFM when the work requires deciding what to build, sequence, defer, approve,
merge, release, stage, or launch; crosses pricing, payments, trials, subscriptions, promo codes,
auth, privacy, analytics, secrets, deploy, staging, or live gates; touches camera/capture/save/export
or another core product flow; or needs multiple lane outputs reconciled before source changes.

## Install

From Codex, add this repo as a marketplace and install the plugin:

```bash
codex plugin marketplace add friedbeef1/fb-lane-coordination
codex plugin add fb-lane-coordination@fb-lane
```

Then start a new Codex thread and ask for `$fb-lane` or one of the bundled skills. Natural
language also works, and `@fb-lane` remains a useful human convention when you want to force the
lane workflow in a prompt.

## Use It Immediately

You do not need to read the full repo README first. After installing, start with:

```text
$fb-lane status
```

Then describe the work in normal language:

```text
$fb-lane
Split this across Product, Tech, Design, and Business.
Ask each workstream for a markdown plan or handoff.
Launch BFM when source-changing execution is approved.
Product should sequence the final integration and tell me what is ready to merge.
```

Common prompts:

```text
$bfm process the prepared handoffs for this task and sequence execution.
$fb-product what is ready to merge?
$fb-design plan prep-screen icon options.
$fb-tech check whether this auth flow is safe.
$fb-business draft onboarding copy options.
```

## Typical Prompt

```text
$fb-lane
Run these concurrently:
$fb-design plan prep-screen icon options.
$fb-tech check whether the auth flow is safe.
$fb-business draft onboarding copy options.
Then have Product sequence the handoffs and flag conflicts.

$bfm
Read the prepared handoff markdowns for the active task, gather the Product, Tech, Design,
Business, and lane-coordination view, then sequence and execute to completion.
```

For non-trivial BFM work, use the Goal Alignment Session and return-loop rules
described in [`docs/loop-engineering.md`](../../docs/loop-engineering.md).
`/goal` is a Product/BFM shortcut into that same Goal Alignment Session: it
shows, creates, clarifies, or asks approval for the current goal. It is not a
second goal system. Workstream chats should put proposed `Workstream Goal` and
`User Approval Needed` fields in handoffs for Product/BFM to reconcile.
If the same loop failure repeats, add a small Markdown eval scorecard using the
generic shape in `docs/evals/agent-behavior-scorecard-template.md`; do not
install an eval framework by default. A compact retro or scorecard may produce
at most one small guardrail for each repeated pattern. Keep quick tasks
lightweight unless the same failure pattern repeats, and do not add an eval
runner, dashboard, numeric score, CI eval job, larger `doctor`, or per-task OKRs
without a separate Product/BFM proposal and explicit approval.
Approval autonomy starts in Shadow Approval: Product/BFM still asks the user but
records `Would self-approve: yes/no` and the reason. Product/BFM may recommend
Phase 2 after one day or three matching decisions with no material miss, and
Phase 3 after five safe self-approvals with no rollback, stale dirty state, or
hidden gate. The user approves phase changes. Never self-approve new scope, new
OKRs, live deploys, secrets, payments, auth/privacy, destructive data,
provider-state changes, unclear goals, failed evidence, lock conflicts, or
unresolved dirty state.
For already-approved safe Product/BFM work, continue through routine diagnosis,
implementation, verification, board/handoff updates, commit, staging, and
cleanup until solved or explicitly blocked. Report after closeout. Still stop
for live deploy, secrets/credentials, payments, auth/privacy, destructive data
or provider-state changes, new scope or OKR changes, unclear goals, lock
conflicts, failed evidence needing risk acceptance, or an explicit pause.

Before asking the user to test, Product/BFM writes a `## Verification Handoff`:
the candidate branch or commit, test plan link, exact commands and environments,
current results, runnable evidence links, manual pass criteria, recovery already
attempted, and the next Product/BFM recovery action. A missing or stalled check
is pending or blocked evidence, not a reason to hand routine recovery to the
user. The user is involved only for a genuine approval or external manual,
device, or account gate.

Frontend/UI plans and handoffs default to a pre-build visual preview. Include
`Visual Preview Decision`: `browser screenshot/mockup`,
`imagegen asset/style option`, or `skip with reason`. Use `skip with reason`
only for non-visual work, tiny copy, spacing, or single-control fixes. Use
browser screenshots/mockups for concrete layout, responsive, component, or flow
decisions. Use imagegen for brand direction, logos, hero/illustration assets,
camera/lens concepts, or visual style options. If the plan changes what the user
will see and a preview is feasible, create or attach the preview before
Product/BFM source execution; Product/BFM blocks or asks only when the preview is
missing and the visual decision is material.
Product/BFM should also proactively propose one small guardrail when repeated
workflow failure, coordination friction, stale state, missing evidence, or
preventable rework appears. Name the cost, benefit, affected files/rules, and
approval needed before changing the process.

Closeout also records `Loop Learning`: feedback captured, whether the pattern
repeated, tooling needed (`none`, `propose guardrail`, `propose automation`, or
`propose eval`), and whether Product approval is needed. Heavier tooling starts
from that field; it is not created automatically.

After reinstalling or updating a same-version plugin package, verify the active
installed cache contains the expected new wording. If the cache is stale, refresh
by reinstalling the plugin; where supported, preserve plugin data during the
uninstall/reinstall step.

## Sidechat-to-Main Prompt Handoff

Sidechats are discussion and planning spaces by default. Use them to ask questions, compare options, review tradeoffs, produce recommendations, and generate a paste-ready handoff for their originating parent main thread. They do not own board updates, handoff files, source changes, commits, validation, or closeout; Product/BFM retains those execution and durable-record responsibilities.

Parent-thread routing: read `docs/sidechat-parent-thread-routing.md` in the target project. Do not infer another destination from role, project, name, recency, or Product/BFM status. If the parent is unavailable, return the handoff to the user; a non-parent main treats it as ordinary user-provided context.

A sidechat prompt is not source of truth until Product/BFM records it in `PROJECT_BOARD.md`, the relevant handoff, or durable docs. Keep tiny questions lightweight: no new command, dashboard, `doctor` expansion, source behavior, or required ceremony is needed for a quick clarification.

When a sidechat prepares work for Product/BFM, use this output shape:

- Decision summary:
- Scope:
- Out of scope:
- Recommended owner/lane:
- Files/docs likely affected:
- Acceptance criteria:
- Gates/risks:
- Exact instruction for Product/BFM:


## Quick Edits

For a tiny BFM execution slice, use the fast-track task command:

```bash
node tools/fb-lane.cjs quick Tech "src/utils.ts" "Fix db indexing"
```

This creates a `TASK-Q-####` board item, claims the files, and checks out a
quick branch. Quick tasks skip the OKR approval gate; they do not bypass the BFM
source-change boundary.

## Workspace Requirement

The target repo should have `AGENTS.md`, `PROJECT_BOARD.md`, and `tools/fb-lane.cjs`.
If they are missing, ask Codex to bootstrap FB-Lane from this plugin before starting lane work.

Before source execution, read board/status/locks and the relevant handoff index.
During isolated work, name the task, branch/worktree, lane, and locked files. At
closeout, report whether the branch/worktree is clean, merged, stale, blocked,
or intentionally dirty.

For a Codex-only project bootstrap, use:

```bash
node tools/fb-lane.cjs bootstrap --platform codex
node tools/fb-lane.cjs doctor
```

`doctor` is read-only. It reports whether the board, rules, handoff
folder/index, active locks, git workspace, non-quick handoff `Lane OKR Fit`,
and approved Goal Alignment Session OKRs are ready before lane work begins. If
the index is missing or old-style, fix it through bootstrap or Product/BFM
lookup repair; `doctor` does not silently create files.
