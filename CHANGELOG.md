# Changelog

## Unreleased - 2026-06-27

- Reliability: the `fb-lane` MCP server now resolves `PROJECT_BOARD.md`
  independent of the launcher's working directory. `resolveWorkspaceStart`
  honors `CLAUDE_PROJECT_DIR` (which Claude Code injects into the spawned
  server's environment), the root `.mcp.json` uses
  `${CLAUDE_PROJECT_DIR:-.}/tools/fb-lane.cjs`, and the plugin `.mcp.json`
  uses `${CLAUDE_PLUGIN_ROOT}`. This addresses intermittent "Could not attach
  to MCP server fb-lane" failures when the server was started from a different
  directory.
- Security: hardened the `fb-lane` CLI against shell command injection. `runGit`
  now executes `git` with `execFileSync` and an argument array instead of
  building a `git ${args}` string for a shell, so task IDs, lane names, branch
  names, and commit messages — including values supplied as MCP tool arguments —
  can no longer inject commands. Task IDs and lane names are validated against
  strict allowlists at the CLI and MCP entry points, and option-like
  (`-`-prefixed) branch names are refused before reaching git.
- Added `tools/fb-lane.test.cjs`, a dependency-free regression suite covering the
  validators and proving shell metacharacters in arguments are inert. The CLI is
  now importable (guarded `main()`, exported helpers) so it can be unit-tested.
- Added `docs/fb-lane-upstream/` holding the change as a `git format-patch`
  (`0001-harden-fb-lane-cli.patch`) for upstream contribution.

## 0.1.2+codex.20260625082239 - 2026-06-26

- Added lightweight Goal Alignment guidance for non-trivial FB-Lane work:
  `Working Goal`, `Success Measure`, and `Gate / Review Point` stay canonical on
  `PROJECT_BOARD.md`, while lane handoffs report compact alignment, caveats, and
  evidence.
- Added the BFM skill for Product/Captain review, sequencing, routing, and
  integration of prepared handoffs.
- Clarified the Product/Lane execution boundary: Product gives direction and
  integration, while Tech, Design, and Business claim and execute their own
  task/files.
- Added `doctor` warnings for missing exact `## Goal Alignment` sections on
  non-quick handoffs. `TASK-Q-*` quick tasks remain exempt.
- Added `doctor` checks for stale Git lock files and long-running local lane
  git/test/build processes so Product can record pending or blocked gates
  instead of absorbing lane execution.
- Updated Codex, Claude Code, and Antigravity bootstrap prompts/templates so new
  projects inherit the Goal Alignment loop and Product/Lane execution boundary.
- Refreshed the Codex marketplace source and reinstalled
  `fb-lane-coordination@fb-lane`; active Codex cache version is
  `0.1.2+codex.20260625082239`.

## 0.1.2+codex.20260625064349 - 2026-06-25

- Added Codex-first setup improvements, including Codex-only bootstrap guidance,
  `$fb-lane` invocation docs, and read-only `doctor` setup checks.
- Improved quick-task handling for generated `TASK-Q-*` IDs.
- Repositioned FB-Lane as a thin optional coordination protocol for work that
  benefits from lane ownership, file claims, durable handoffs, and Product
  sequencing.
