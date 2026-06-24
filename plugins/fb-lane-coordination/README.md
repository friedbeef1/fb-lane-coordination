# FB-Lane Coordination for Codex

This Codex plugin packages the FB-Lane coordination workflow:

- skills for Product, Tech, Design, Business, and overall lane coordination
- an `fb-lane` MCP server backed by `tools/fb-lane.cjs`
- a repo marketplace entry at `.agents/plugins/marketplace.json`

Codex already provides the concurrency. FB-Lane provides the shared state and guardrails:
`PROJECT_BOARD.md`, file claims, `.codex/current_task.md`, handoff docs, and Product/Captain
integration gates.

Treat FB-Lane as an optional coordination protocol, not as the thing that makes Codex parallel.
Skip it for single-thread work, simple fixes, read-only questions, or independent work where Codex
worktrees are enough. Use it when parallel Codex work needs shared ownership, file claims, durable
handoffs, or Product/Captain sequencing.

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
Use worktrees for code-writing lanes where helpful.
Each lane should claim files, write a handoff, and return to Product.
Product should sequence the final integration and tell me what is ready to merge.
```

Common prompts:

```text
$fb-product what is ready to merge?
$fb-design improve the prep-screen icons.
$fb-tech check whether this auth flow is safe.
$fb-business rewrite the onboarding copy.
```

For depth, read the main `README.md`, `FAQ.md`, and `platforms/codex/README.md`.

## Typical Prompt

```text
$fb-lane
Run these concurrently:
$fb-design create prep-screen icon options.
$fb-tech check whether the auth flow is safe.
$fb-business rewrite the onboarding copy.
Then have Product sequence the handoffs and flag conflicts.
```

## Quick Edits

For small changes, use the fast-track task command:

```bash
node tools/fb-lane.cjs quick Tech "src/utils.ts" "Fix db indexing"
```

This creates a `TASK-Q-####` board item, claims the files, and checks out a quick branch. Current plugin tooling supports these generated quick-task IDs in `status`, `submit`, and `merge`.

## Workspace Requirement

The target repo should have `AGENTS.md`, `PROJECT_BOARD.md`, and `tools/fb-lane.cjs`.
If they are missing, ask Codex to bootstrap FB-Lane from this plugin before starting lane work.

For a Codex-only project bootstrap, use:

```bash
node tools/fb-lane.cjs bootstrap --platform codex
node tools/fb-lane.cjs doctor
```

`doctor` is read-only. It reports whether the board, rules, MCP config, handoff folder, active
locks, and git workspace are ready before lane work begins.
