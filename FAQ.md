# FB-Lane FAQ

## Is this just project management?

No. Project management tracks work. Loop Engineering makes agent work return to
the approved goal, evidence, board state, and repo truth before Product calls it
complete.

The board matters because agents need durable state. It is not the product. The
product is the loop: approved OKRs, lane execution, evidence return, BFM
reconciliation, and clean closeout.

## Does Codex, Claude Code, or Antigravity already do this?

They already provide a lot of the execution machinery:

- Codex has plugins, skills, subagents, MCP, and worktrees.
- Claude Code has subagents, MCP, slash commands, and worktrees.
- Antigravity has native multi-agent orchestration.

FB-Lane does not claim to replace those primitives. It adds the coordination
contract around them: who owns the work, what goal was approved, what files are
claimed, what evidence came back, and what Product can safely merge or defer.

## What is Loop Engineering?

Loop Engineering is the practice of keeping five things aligned:

1. the approved goal
2. the work that agents execute
3. the evidence they return
4. the board state Product uses to sequence
5. the repo truth in source, docs, tests, and git

Read the full model in [docs/loop-engineering.md](docs/loop-engineering.md).

## When should I skip FB-Lane?

Skip it when the loop adds more weight than risk reduction:

- one-thread fixes
- read-only questions
- tiny quick edits
- throwaway experiments
- independent work where native worktrees are enough

Use it when multiple lanes, shared files, durable handoffs, Product sequencing,
or release evidence matter.

## What does Product approve?

For non-quick BFM runs, Product proposes and James approves the Goal Alignment
Session OKRs on `PROJECT_BOARD.md`:

- `Objective`
- `Key Results`
- `Definition of Done`
- `Gate / Review Point`
- `Approval`
- `Justification`

Once approved, BFM should change the approach, scope, or sequence to fit the
OKR. It should not silently rewrite the approved OKR.

## What does `doctor` check?

`doctor` is read-only:

```bash
node tools/fb-lane.cjs doctor
```

It checks whether the repo's loop state looks healthy: board files, rules,
handoff folder, active locks, git state, non-quick handoff `OKR Fit`, and
approved Goal Alignment Session OKRs for non-quick BFM targets.

In v1 it warns. It does not change `submit` behavior and does not hard-block
quick `TASK-Q-*` work.

## Are the lanes mandatory?

No. The lanes are roles inside the loop:

- Product/BFM owns goals, sequencing, and closeout.
- Tech owns logic, data, integrations, reliability, and tests.
- Design owns UI, layout, visual QA, and assets.
- Business owns positioning, onboarding copy, pricing, and marketing text.

If one thread can safely do the work, use one thread. If ownership is split,
lanes keep the split visible.

## Is Definition of Done the same as TDD?

No. Definition of Done says what must be true before closeout. TDD is one way to
build and prove behavior when a feature or bugfix has a clear testable contract.

Use TDD for risky logic and regressions. Use other evidence for docs, visual QA,
copy, sequencing, or Product approval.

## Where do I install it?

Start with the platform guide:

- [Antigravity](platforms/antigravity/README.md)
- [Claude Code](platforms/claude-code/README.md)
- [Codex](platforms/codex/README.md)

Fallback bootstrap paths are in [docs/setup.md](docs/setup.md).

## How do I upgrade the Codex plugin?

After the repo changes are merged, reinstall from the configured marketplace:

```bash
codex plugin add fb-lane-coordination@fb-lane
codex plugin list | rg "fb-lane-coordination"
```

Start a new Codex thread after reinstalling so the refreshed plugin context is
loaded.
