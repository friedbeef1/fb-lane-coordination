# FB-Lane Coordination for Codex

This Codex plugin packages FB-Lane's Loop Engineering workflow:

- skills for BFM, Product, Tech, Design, Business, and overall lane coordination
- an `fb-lane` MCP server backed by `tools/fb-lane.cjs`
- a repo marketplace entry at `.agents/plugins/marketplace.json`

Codex already provides the concurrency. FB-Lane provides the Product Lead loop
around it: approved Product/workstream OKRs, plan-only workstreams, BFM execution, evidence return,
BFM reconciliation, and clean closeout. The full operating model lives in
[`docs/loop-engineering.md`](../../docs/loop-engineering.md).

Bootstrapped projects use `PROJECT_BOARD.md` as the source of truth and
`docs/handoffs/index.md` as the first-read lookup table. Read the index before
opening detailed handoffs so Codex does not load stale historical closeouts by
default.

Treat FB-Lane as an optional coordination protocol, not as the thing that makes Codex parallel.
Skip it for single-thread work, simple fixes, read-only questions, or independent work where Codex
worktrees are enough. Use it when parallel Codex work needs shared ownership, markdown
handoffs, BFM execution claims, or Product/Captain sequencing.

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
If the same loop failure repeats, add a small Markdown eval scorecard; do not
install an eval framework by default.

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

For a Codex-only project bootstrap, use:

```bash
node tools/fb-lane.cjs bootstrap --platform codex
node tools/fb-lane.cjs doctor
```

`doctor` is read-only. It reports whether the board, rules, MCP config, handoff folder/index,
active locks, git workspace, non-quick handoff `Lane OKR Fit`, and approved Goal Alignment Session
OKRs are ready before lane work begins.
