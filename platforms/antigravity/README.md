# FB-Lane on Antigravity

This page is the tactical Antigravity setup guide. For the Product Lead
operating model, read [Loop Engineering](../../docs/loop-engineering.md).

> **Status:** FB-Lane on Antigravity is alpha.

## What FB-Lane Adds

Antigravity already has native multi-agent execution. FB-Lane adds the loop
around that execution:

- Product approves the Product/workstream OKR.
- Tech, Design, and Business workstreams produce markdown plans or handoffs.
- Product launches BFM when source-changing execution is approved.
- BFM execution workers claim files, verify, and return evidence.
- Product/BFM closes only when board, source, docs, tests, and git state agree.

Normal workstream chats do not edit source, branch, submit, merge, deploy, or
change provider state. They plan.

## Install

Add this plugin to your workspace marketplace:

```json
{
  "plugins": [
    {
      "name": "fb-lane-coordination",
      "source": {
        "source": "local",
        "path": "./plugins/fb-lane-coordination"
      }
    }
  ]
}
```

This registers the FB-Lane skills and the Product, Tech, Design, and Business
lane agents.

## Bootstrap A Project

From the target project root:

```bash
node tools/fb-lane.cjs bootstrap
node tools/fb-lane.cjs doctor
```

Bootstrap creates or updates the board, lane rules, MCP config, and lane agent
definitions. It should not overwrite existing project rules without merging
them conservatively.

## Recommended Prompt

```text
Use FB-Lane.
Ask Tech, Design, and Business for markdown plans or handoffs.
Do not edit source from normal workstream chats.
When the plans are approved, Product should launch BFM for execution.
```

## BFM Execution

Use claim/submit/merge only after Product launches BFM execution:

```bash
node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts"
node tools/fb-lane.cjs submit TASK-102 "https://staging.example.com"
node tools/fb-lane.cjs merge TASK-102
```

Use `--worktree` when two BFM execution workers need separate branches:

```bash
node tools/fb-lane.cjs claim TASK-102 Tech "src/auth.ts" --worktree
```

## Demo

The Antigravity demo lives in
[how-to-interact-demo/](how-to-interact-demo/).

Rendered MP4:
[GitHub release asset](https://github.com/friedbeef1/fb-lane-coordination/releases/download/demo-assets-2026-06-27/antigravity-how-to-interact.mp4).
