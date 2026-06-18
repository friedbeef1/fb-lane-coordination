# FB-Lane — How to Interact (one guide per AI)

You've bootstrapped the **FB-Lane Four-Lane Coordination Model**. Four role-isolated lanes —
**FB-Product** (orchestrator / merges), **FB-Tech** (backend), **FB-Design** (UI/CSS), and
**FB-Business** (copy; read-only on code) — work concurrently on the same repo, coordinating
through `PROJECT_BOARD.md` (the single source of truth for tasks and file locks).

How you *drive* the lanes depends on which AI you use. Open the guide for yours:

| AI | Guide | How you invoke a lane |
|----|-------|-----------------------|
| **Claude Code** (CLI / web / IDE) | [claude-code.md](claude-code.md) | `@fb-tech` in chat, or the `/agents` picker; the main session is FB-Product |
| **Claude Desktop / Cursor / Projects** | [claude-desktop.md](claude-desktop.md) | one fresh chat per lane; paste the lane's prompt (or use the MCP tools) |
| **Antigravity 2.0** | [antigravity.md](antigravity.md) | lanes appear in the left sidebar; FB-Product spawns them via `invoke_subagent` |
| **Codex** | [codex.md](codex.md) | `.codex/current_task.md` context injection (or the MCP tools) |

## The task loop (every AI, same CLI)

Whatever the platform, work flows through one lifecycle on `PROJECT_BOARD.md`:

```bash
node tools/fb-lane.cjs status                            # see tasks + active file locks
node tools/fb-lane.cjs claim  TASK-101 Tech "src/api.ts" # lock files, checkout tech/TASK-101
node tools/fb-lane.cjs submit TASK-101                   # run tests, push branch, -> Staging QA
node tools/fb-lane.cjs merge  TASK-101                   # FB-Product only: merge, unlock, -> Done
```

- **Two ways to work:** talk only to **FB-Product** and let it scope / delegate / merge (hands-off),
  or invoke a lane **directly** to pair-program. Both keep the board and locks honest.
- **FB-Product is the gate:** it is the only lane that merges, and it cross-reads every submitted
  branch first to catch cross-lane drift (API/UI mismatches, copy referencing unbuilt features,
  shared-file conflicts) before integrating.
- **Full rules:** lane boundaries and the board/lock protocol live in [`AGENTS.md`](../../AGENTS.md).
