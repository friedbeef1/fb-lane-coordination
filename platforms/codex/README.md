# FB for Codex

FB is the supported Codex distribution for **FB 0.2.0-beta: AI Loop Engineering
for Everyday People**. Codex provides threads, skills, and worktrees; FB adds a
Product-led route from approved objective to evidence-backed closeout.

## Start

1. Install the plugin:

   ```bash
   codex plugin marketplace add friedbeef1/fb-lane-coordination
   codex plugin add fb-lane-coordination@fb-lane
   ```

2. In the project, read the generated `AGENTS.md`, board, handoff index, and
   linked handoff.
3. Use `$fb-lane status` for current coordination state, or describe the
   objective normally. Build For Me (BFM) builds and checks the plan only after
   Product approval and explicit `$bfm`.

## Operating routes

The canonical pack is [docs/fb](../../docs/fb/README.md):

- [start](../../docs/fb/start.md) for the Project Start Brief and reviewable plan;
- [workflow](../../docs/fb/workflow.md) for lanes, BFM, and source-of-truth roles;
- [evidence](../../docs/fb/evidence.md) for Test This Now and Verification Handoff;
- [guardrails](../../docs/fb/guardrails.md) for safety, sidechat routing, recovery, and Loop Learning.
- [sessions](../../docs/fb/sessions.md) for durable task intake, promotion, checkpoints, recall, review, and closeout.

For local rule snippets, use [workflow-rules.md](workflow-rules.md). See
[setup](../../docs/setup.md) and [versioning](../../docs/versioning.md) for
technical installation and release context.
