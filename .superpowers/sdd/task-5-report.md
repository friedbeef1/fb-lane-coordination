# Task 5 — Legacy Runtime Entry Point Removal

## Scope

Removed only the active repository-level legacy runtime/configuration paths:

- `.mcp.json`
- `tools/run_lane.py`
- `CLAUDE.md`
- `templates/CLAUDE.md`

Added the same root/package regression contract and readiness-validator guard.
The validator still parses the packaged Codex plugin manifest and bundled MCP
JSON after checking that the legacy paths are absent.

## RED

Before deletion, `node tools/fb-lane.test.cjs` failed the new regression with:

```
AssertionError [ERR_ASSERTION]: expected .mcp.json to be absent
```

This demonstrated the test detects the repository-level legacy configuration
that Task 5 removes.

## GREEN

- `node tools/fb-lane.test.cjs` — 24 checks passed.
- `node plugins/fb-lane-coordination/tools/fb-lane.test.cjs` — 24 checks
  passed.
- `node --check tools/fb-lane.cjs` — passed.
- `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs` — passed.
- `cmp -s tools/fb-lane.cjs plugins/fb-lane-coordination/tools/fb-lane.cjs` —
  passed.
- Clean detached temporary worktree: `node tools/fb-lane.validate.cjs` —
  passed, including Codex manifest/bundled MCP JSON parsing and `doctor: Ready`.
- Clean detached temporary worktree: `git diff --check HEAD^..HEAD` — passed.

## Files

- Deleted `.mcp.json`, `tools/run_lane.py`, `CLAUDE.md`, and
  `templates/CLAUDE.md`.
- Updated `tools/fb-lane.test.cjs` and
  `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`.
- Updated `tools/fb-lane.validate.cjs`.

## Commit

Implementation: `e6a5a31 fix: remove legacy runtime entry points`

## Concerns

None. Existing unrelated board/handoff changes remain unmodified and unstaged.
