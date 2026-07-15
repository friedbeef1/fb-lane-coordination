# Task 4 Report — Stale Non-Codex Runtime Artifacts

## Result

Complete. The CLI no longer contains Claude/Antigravity bootstrap generator
branches or static agent definitions. Root and packaged `agents/` artifacts are
removed, and readiness validation now reads only the Codex plugin manifest and
its bundled MCP JSON.

## RED

- `node tools/fb-lane.test.cjs` — failed as expected at `CLI source contains no
  non-Codex bootstrap generator surface`; the source still matched
  `includeClaude`, `includeAntigravity`, and `agentConfigs`.
- `node plugins/fb-lane-coordination/tools/fb-lane.test.cjs` — failed for the
  same expected source-level regression.

## GREEN

- `node tools/fb-lane.test.cjs` — passed, 23 checks.
- `node plugins/fb-lane-coordination/tools/fb-lane.test.cjs` — passed, 23
  checks.
- `node --check tools/fb-lane.cjs` and
  `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs` — passed.
- `cmp -s tools/fb-lane.cjs plugins/fb-lane-coordination/tools/fb-lane.cjs`
  and the matching test-file parity check — passed.
- `node tools/fb-lane.validate.cjs` — passed from a clean detached worktree at
  the implementation commit; it reported `FB-Lane doctor: Ready` and passed
  its committed-diff whitespace check.
- `git diff --check HEAD^..HEAD` — passed in that clean worktree.

## Changed and Deleted

- Updated root and packaged CLI copies to remove the unused platform generators
  and static agent prompt/configuration code.
- Added the matching root/package source regression.
- Updated `tools/fb-lane.validate.cjs` to parse only
  `plugins/fb-lane-coordination/.codex-plugin/plugin.json` and
  `plugins/fb-lane-coordination/.mcp.json`.
- Deleted `agents/**` and `plugins/fb-lane-coordination/agents/**`.

## Commit

- Implementation: `a68cc77 fix: remove stale non-Codex runtime artifacts`

## Concerns

- The shared worktree has unrelated, pre-existing Task 3 documentation changes.
  The first in-place validator run therefore stopped at its expected dirty-tree
  doctor gate. Verification was repeated in a clean detached worktree at
  `a68cc77`, where the validator passed.

## Review Fix — Codex-Native Claim Flow

### RED

- Added the same source-level regression to the root and packaged CLI suites,
  then ran both suites. Each failed as expected because the distributed CLI
  still contained the `CLAUDE_PROJECT_DIR` workspace fallback. The regression
  also guards the stale worktree-launch and user-facing platform guidance.

### GREEN

- Normal worktree claims now tell the user to open the worktree in Codex and
  start a new thread; they no longer print a shell command for another runtime.
- Normal and quick startup-prompt paths now direct users to fresh Codex threads.
- Root-dir resolution no longer reads the obsolete `CLAUDE_PROJECT_DIR`
  environment variable.
- `node tools/fb-lane.test.cjs` and
  `node plugins/fb-lane-coordination/tools/fb-lane.test.cjs` — passed, 23
  checks each.
- Root/package CLI and test syntax checks, stale-guidance scan, and byte-parity
  checks passed.
- `node tools/fb-lane.validate.cjs` and `git diff --check HEAD^..HEAD` passed
  from a clean detached temporary worktree; `doctor` reported `Ready`.
