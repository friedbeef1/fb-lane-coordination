# TASK-Q-5217 - Improve Codex plugin setup UX

## Task

- **ID**: TASK-Q-5217
- **Lane**: FB-Tech
- **Scope**: Improve Codex plugin setup UX.

## What Changed

- Added `node tools/fb-lane.cjs doctor` as a read-only setup health check.
- Added `node tools/fb-lane.cjs bootstrap --platform codex` and `--codex-only` so Codex setup skips Claude and Antigravity artifacts.
- Synced the root CLI into the packaged Codex plugin CLI.
- Updated Codex-facing docs, skill prompts, and plugin default prompts to prefer `$fb-lane`.
- Aligned legacy plugin metadata with `.codex-plugin/plugin.json` at version `0.1.2`.
- Added thin-protocol positioning so FB-Lane is framed as optional coordination,
  not as the layer that makes Codex parallel.

## Modified Files

- `tools/fb-lane.cjs`
- `plugins/fb-lane-coordination/tools/fb-lane.cjs`
- `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
- `plugins/fb-lane-coordination/plugin.json`
- `plugins/fb-lane-coordination/README.md`
- `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`
- `plugins/fb-lane-coordination/skills/fb-product/SKILL.md`
- `plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md`
- `platforms/codex/README.md`
- `README.md`
- `PROJECT_BOARD.md`

## Verification

- `node --check tools/fb-lane.cjs`
- `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs`
- `diff -q tools/fb-lane.cjs plugins/fb-lane-coordination/tools/fb-lane.cjs`
- `python3 /Users/jamesyeang/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/fb-lane-coordination`
- `git diff --check`
- Temp smoke: `bootstrap --platform codex` creates `PROJECT_BOARD.md`, `AGENTS.md`, `.codex/rules.md`, and `.mcp.json` without creating `CLAUDE.md`, `.claude/`, or `agents/`.

## Risks

- `doctor` intentionally warns, rather than failing, when `.codex/rules.md` is absent or the git workspace is dirty.
- The default `bootstrap` behavior remains cross-platform for backward compatibility; users must pass `--platform codex` for Codex-only setup.

## Next Owner

FB-Product should review the branch and decide whether to merge the `0.1.2` Codex plugin UX update.
