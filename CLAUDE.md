# CLAUDE.md

<!-- fb-lane-start -->
## FB-Lane Coordination

This project uses the **FB-Lane Four-Lane Coordination Model**.
Source of truth for active tasks and file locks: `PROJECT_BOARD.md`.

### Lane Boundaries

| Lane | Owns | Never touches |
|------|------|--------------|
| **FB-Product** | Backlog, merges, deployments, release gates | Feature code |
| **FB-Tech** | APIs, DB schemas, serverless functions, tests | CSS, layout, copy |
| **FB-Design** | CSS, tokens, layout geometry, visual QA | Backend, schemas |
| **FB-Business** | Copy, docs, marketing text | Source code (read-only) |

### Starting a Session
1. Read `PROJECT_BOARD.md` — check active tasks and file locks.
2. Read `.codex/current_task.md` if it exists — it has your exact branch and locked files.
3. Confirm your branch: `git rev-parse --abbrev-ref HEAD`.
4. Never modify files locked by another active task.

### CLI Commands
```bash
node tools/fb-lane.cjs status               # View all tasks and locks
node tools/fb-lane.cjs claim <id> <lane>    # Claim a task, checkout branch, lock files
node tools/fb-lane.cjs submit <id>          # Submit for QA, push branch
node tools/fb-lane.cjs merge <id>           # Merge to main, release locks (FB-Product only)
```

### Rules
- Never commit directly to `main` — always use a feature branch.
- Commit docs separately from code changes.
- Run tests before submitting — the `submit` command does this automatically.
- Max 5 debug retries — if still failing, mark task `Blocked` and notify the user.
- Do not revert others — merge `main` into your branch to resolve conflicts.
<!-- fb-lane-end -->

## Lane Subagents (Claude Code)

The non-orchestrator lanes are available as Claude Code subagents in `.claude/agents/`. You can
invoke any of them directly, or let the main session delegate to them:

- **`fb-tech`** — backend/APIs/schemas/migrations/security/tests (CLI lane `Tech`)
- **`fb-design`** — CSS/tokens/layout geometry/visual QA (CLI lane `Design`)
- **`fb-business`** — copy/docs/positioning; read-only on code (CLI lane `Business`)

The **main session acts as FB-Product** (the orchestrator): scope tasks on `PROJECT_BOARD.md`,
delegate to a lane subagent, review the result, then merge. Full lane ownership boundaries and
the board/locking protocol live in `AGENTS.md`.

## Default Coding Style: Ponytail (auto-active)

The vendored `ponytail` skill (`.claude/skills/ponytail/`) is the **default coding posture**.
Apply it at `full` intensity whenever you write or change code — you decide, no `/ponytail`
needed. Climb the ladder (YAGNI → reuse → stdlib → native → one line → minimum) and ship the
shortest diff that actually works.

Apply it when:
- writing new code, refactoring, or fixing a bug (any lane that edits source — FB-Tech, FB-Design).

Do **not** apply it when:
- the task is copy, docs, or positioning (FB-Business), or pure config/data;
- the user explicitly asks for the full/thorough version, or says "stop ponytail" / "normal mode";
- it would trade away correctness, input validation, error handling, security, or accessibility —
  ponytail never simplifies these away.

Escalate to `ultra` only when the user signals heavy over-engineering; drop to `lite` when they
want to see the lazier option but keep the fuller build. The `ponytail-review` / `-audit` /
`-debt` skills stay on-demand (invoke when reviewing a diff, auditing the repo, or listing
deferred shortcuts).
