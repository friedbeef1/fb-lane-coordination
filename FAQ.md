# FB-Lane FAQ

## What version is this?

The current GitHub documentation line is **FB-Lane 0.2.0-beta: Loop Engineering
public beta**.

Current plugin builds: Codex `0.2.0-beta+codex.20260707114230`; Claude Code
`1.0.1`. Use `codex plugin list | rg "fb-lane-coordination"` or
`claude plugin list | rg "fb-lane-coordination"` to see the installed build.

See [docs/versioning.md](docs/versioning.md) for the v1-to-latest before/after.

## Is this just project management?

No. Project management tracks work. Loop Engineering makes agent work return to
the approved goal, evidence, board state, and repo truth before Product calls it
complete.

The board matters because agents need durable state. It is not the product. The
product is the loop: approved Product/workstream OKRs, stable lane OKRs,
mini-loop evidence return, BFM reconciliation, and clean closeout.

## Does Codex, Claude Code, or Antigravity already do this?

They already provide a lot of the execution machinery:

- Codex has plugins, skills, subagents, MCP, and worktrees.
- Claude Code has subagents, MCP, slash commands, and worktrees.
- Antigravity has native multi-agent orchestration.

FB-Lane does not replace those primitives. It adds the coordination contract:
approved goal, owner, evidence, merge/defer decision, and BFM source-change gate.

Think of it as awareness, isolation, integration: the board and handoff index are
the shared standup, branches/worktrees are separate desks for execution, and BFM
is Product/release review.

## What is Loop Engineering?

Loop Engineering is the practice of keeping five things aligned:

1. the approved goal
2. the work that BFM executes from approved plans
3. the evidence they return
4. the board state Product uses to sequence
5. the repo truth in source, docs, tests, and git

Read the full model in [docs/loop-engineering.md](docs/loop-engineering.md).

## Does FB-Lane have its own OKR?

Yes. The framework OKR is the north star: help Product Leads run multi-agent
work without losing alignment between goals, evidence, board state, and repo
truth.

The numbers are directional. If a context-saving target is missed but the work
is still safe, Product/BFM flags `watch`. If the miss can affect sequencing,
scope, or closeout safety, Product/BFM flags `needs Product review` or
`blocked`.

## Is FB-Lane CI/CD?

No. FB-Lane is a coordination loop. It has CI readiness evidence for Product/BFM
closeout, and CI can be required before merge. Staging, live deploy, plugin
release, and publish decisions remain manual Product decisions.

## What are evals here?

Evals are checks for agent behavior. They ask whether Product/BFM ran the loop
properly: approved goal, plan-only lanes, accounted handoffs, matching evidence,
and honest blockers.

Do not start with an eval framework. Use a short Markdown scorecard when the
same agent mistake repeats. The reusable shape is in
`docs/evals/agent-behavior-scorecard-template.md`: non-Product execution gate,
BFM closeout accounting, evidence honesty, and goal/scope fit.

## When should I skip FB-Lane?

Skip it when none of the listed coordination triggers apply. Default to
normal/simple coding for:

- one-thread fixes
- read-only questions
- code explanations
- tiny quick edits
- isolated edits
- throwaway experiments
- independent work where native worktrees are enough

Use FB-Lane light when the objective mentions handoffs, board items, lanes, BFM,
Product, Design, Business, coordination files, board-locked files, multiple
threads/agents/workstreams, or durable context. Keep quick tasks lightweight:
read the board/locks and avoid extra handoff or OKR ceremony unless another lane
or Product must continue it.

Escalate to Product/BFM when the work requires deciding what to build, sequence,
defer, approve, merge, release, stage, or launch; crosses
pricing/payments/trials/subscriptions/promo codes, auth/privacy/analytics/secrets,
deploy/staging/live gates; touches camera/capture/save/export or another core
product flow; or needs multiple lane outputs reconciled before source changes.

## Are workstream threads read-only?

Yes. Product, Tech, Design, and Business workstream threads are planning lanes
by default. They can ask questions, inspect context, critique, and write
markdown plans or handoffs. They do not edit source code, branch, commit,
submit, merge, deploy, or change provider state from ordinary workstream chat.

Product can edit coordination markdown such as the board, plans, handoffs, OKRs,
Definition of Done, sequencing notes, and closeout notes. Source changes happen
only after Product launches BFM.

If you say `PLEASE IMPLEMENT THIS PLAN` in a non-Product/BFM lane, the lane
should confirm whether to hand it to Product/BFM or treat that lane as an
explicit one-off execution exception.

## How does code change if lanes are read-only?

Product launches **BFM (Build Flow Manager)**. BFM reads the approved markdown
plans, checks whether the batch should be split into smaller stories, sequences
the work, claims files, dispatches implementation workers, runs verification,
and returns evidence before closeout.

Before source execution, the worker reads board/status/locks plus the relevant
handoff index. During isolated work, it names the task, branch/worktree, lane,
and locked files. At closeout, it reports whether the branch/worktree is clean,
merged, stale, blocked, or intentionally dirty.
If checks touched a real provider, database, payment system, email system, or
analytics workspace, the same closeout names test mode, created records or
resources, cleanup evidence, or the pending cleanup gate.

## What does Product approve?

For non-quick BFM runs, Product and the user discuss the Product/workstream OKR
first. After explicit user approval, Product records the Goal Alignment Session
on `PROJECT_BOARD.md`:

- `Objective`
- `Key Results`
- `Definition of Done`
- `Gate / Review Point`
- `Approval`
- `Justification`

Stable lane OKRs are the standing Tech, Design, Business, and Product quality
anchors that lanes use while planning or proving their slice. Mini-loop evidence is the
proof each lane returns from its smallest real check, review, or smoke.

Once approved, BFM should change the approach, scope, or sequence to fit the
Product/workstream OKR. It should not silently rewrite the approved OKR or
dynamically create a new one during execution. OKRs are added or changed only
after discussion and explicit user approval.

Do not generate a fresh OKR for every task. Reuse or clarify the approved
Product/workstream or BFM-target OKR, and let tasks report fit, caveats, and
evidence.

## What does `doctor` check?

`doctor` is read-only:

```bash
node tools/fb-lane.cjs doctor
```

It checks whether the repo's loop state looks healthy: board files, rules,
handoff folder, handoff index, active locks, git state, non-quick handoff
`Workstream Goal`, `Lane OKR Fit`, `User Approval Needed`, `Mini-loop Evidence`, `Evidence Against Product OKR`, approved
Goal Alignment Session OKRs, and handoffs that imply unapproved OKR changes.

In the current public beta it warns. It does not change `submit` behavior and
does not hard-block quick `TASK-Q-*` work.

It should not become a giant rule engine. Use `doctor` for obvious missing or
stale structure; use Product/BFM judgment for loop health.

## Does FB-Lane improve itself automatically?

Not silently. Product/BFM should proactively propose a small guardrail when the
same workflow failure, stale state, missing evidence, or preventable rework
repeats. The proposal names the pattern, benefit, cost, affected files/rules,
and approval needed. It should skip one-off or low-impact issues.

Closeout carries the trigger:

```md
Loop Learning:
- Feedback captured: <none | issue found>
- Repeated pattern?: no | yes
- Tooling needed?: none | propose guardrail | propose automation | propose eval
- Product approval needed?: no | yes
```

That is how the system knows when heavier tooling is worth discussing without
building it by default.

## Should I use `/goal`?

Use `/goal` when you want to pull the existing Goal Alignment Session forward
before execution. It should show, create, clarify, or ask approval for the
current Product/BFM goal. It is not a second goal system, and workstream chats
should not own it. Workstreams put `Workstream Goal` and `User Approval Needed`
in their handoff for Product/BFM and the user to approve.

## Can the loops self-approve?

Eventually, for low-risk continuation work. Start with **Shadow Approval**:
Product/BFM asks the user and records `Would self-approve: yes/no` with the
reason. After the user approves a safe task or problem, Product/BFM should keep
going through routine diagnosis, implementation, verification, board/handoff
updates, commit, staging, and cleanup until solved or explicitly blocked. It
reports after closeout. It still stops for live deploy, secrets/credentials,
payments, auth/privacy, destructive data or provider-state changes, new scope or
OKR changes, unclear goals, lock conflicts, failed evidence needing risk
acceptance, or an explicit pause.
It may recommend Phase 2 after one day or three matching decisions with
no material miss. It may recommend Phase 3 after five safe self-approvals with
no rollback, stale dirty state, or hidden gate.

Phase changes are recommended by Product/BFM and approved by the user. Workstream
loops can mark work `safe to auto-accept`, but Product/BFM owns actual
self-approval. Never self-approve new scope, new OKRs, live deploys, secrets,
payments, auth/privacy, destructive data, provider-state changes, unclear goals,
failed evidence, lock conflicts, or unresolved dirty state.

## Why is there a handoff index?

To avoid token waste. `PROJECT_BOARD.md` stays the source of truth. The index is
a compact routing layer so agents can find the one or two relevant handoffs
without reading every historical closeout.

The index is routing, not detail. Use compact columns: `Task / Topic`, `Lane`,
`Status`, `Depends / Blocks / Gate`, `Checks / Evidence`, and `Detail`. Keep
full OKRs, QA checklists, plans, logs, rationale, copy variants, and
implementation detail in the detailed handoff files.

If the index starts duplicating the board, it is wrong. The board is truth; the
index is lookup.

Worktrees do not replace this lookup. No lane should disappear into a private
worktree, build a huge unannounced diff, edit source without board/lock
awareness, or close without BFM reconciliation when multiple outputs exist.

## What are workstream status cards?

They are small lane revisit summaries at `docs/workstreams/<lane>.md`.

Product/BFM updates the detailed handoff with `## Product/BFM Closeout`, then
updates the relevant card after executing or explicitly deferring a lane handoff.
When someone returns to Tech, Design, Business, or Product, the lane reads the
board, the handoff index, then its card to see what Product/BFM already did,
what is still pending or blocked, and where the evidence lives.

They are not a second board. Do not put full OKRs, QA logs, plans, rationale,
copy variants, or implementation detail there.

## Are the lanes mandatory?

No. The lanes are roles inside the loop:

- Product/BFM owns goals, sequencing, and closeout.
- Tech owns technical plans, logic risks, data/integration recommendations, reliability, and test strategy.
- Design owns UI plans, layout critique, visual QA plans, and asset guidance.
- Business owns positioning, onboarding copy, pricing, and marketing text plans.

If one thread can safely do the work, use one thread. If ownership is split,
lanes keep the split visible.

## Do frontend changes need generated images?

No. Frontend/UI plans should name a `Visual Preview Decision`: `skip`, `browser
screenshot/mockup`, or `imagegen asset/style option`.

Use the actual browser or a mockup for layout, responsive, component, or flow
decisions. Use imagegen only for brand direction, logos, hero or illustration
assets, camera/lens concepts, or visual style options where generated bitmap
exploration helps. Skip it for tiny copy, spacing, or single-control fixes.

## Is Definition of Done the same as TDD?

No. Definition of Done says what must be true before closeout. TDD is one way to
build and prove behavior when a feature or bugfix has a clear testable contract.

Use TDD for state-changing logic and regressions. Use other evidence for docs,
visual QA, copy, sequencing, or Product approval.

## Where do I install it?

Start with the platform guide:

- [Antigravity](platforms/antigravity/README.md) - Alpha
- [Claude Code](platforms/claude-code/README.md) - Alpha
- [Codex](platforms/codex/README.md) - Public beta

Fallback bootstrap paths are in [docs/setup.md](docs/setup.md).

## How do I upgrade the Codex plugin?

After the repo changes are merged, reinstall from the configured marketplace:

```bash
codex plugin marketplace upgrade fb-lane
codex plugin add fb-lane-coordination@fb-lane
codex plugin list | rg "fb-lane-coordination"
```

Start a new Codex thread after reinstalling so the refreshed plugin context is
loaded.

## How do I upgrade the Claude Code plugin?

After the repo changes are merged, refresh the marketplace and plugin:

```bash
claude plugin marketplace update fb-lane
claude plugin update fb-lane-coordination@fb-lane
claude plugin list | rg "fb-lane-coordination"
```

Start a new Claude Code session after upgrading so refreshed agents and commands
are loaded.
