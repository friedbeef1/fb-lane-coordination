# TASK-078 QA — One-sentence GitHub setup

Candidate: `0.5.12-beta+codex.20260808093008`

## System verification

Status: passed — published and installed.

| Check | Result |
|---|---|
| Root setup contract | Passed |
| Packaged setup contract | Passed |
| Root/package onboarding | Passed — 26/26 in each context |
| Product/BFM setup guidance | Passed in root and package contexts |
| Metadata and release contracts | Passed in root and package contexts |
| Package parity | Passed — 65 mirrors aligned |
| Affected syntax and whitespace | Passed |
| Doctor | Ready on committed candidate |
| Complete release checkpoint | Passed — CLI 72/72; migration 34/34; sessions 39/39; evals 19/19; beginner 11/11; efficiency 25/25 |

## Review state

Completed build — this is a plugin/setup release with complete automated proof
and no application preview. James authorized **Push Live**.

## Live release evidence

| Check | Result |
|---|---|
| GitHub PR | [PR #61](https://github.com/friedbeef1/fb-lane-coordination/pull/61) merged to `main` as `414b191` |
| GitHub readiness | [Validation run 31250951121](https://github.com/friedbeef1/fb-lane-coordination/actions/runs/31250951121) passed |
| Installed build | `0.5.12-beta+codex.20260808093008` installed and enabled |
| Installed skills | All 12 expected FB skills present |
| Bundled MCP | Relative `node ./tools/fb-lane.cjs mcp` route with `cwd: "."` resolved in the installed bundle |
| Installed syntax | `fb-lane.cjs` and `fb-onboarding.cjs` passed Node syntax checks |

## Outcome

FB now exposes one GitHub sentence for fresh installation or upgrade, explains
repeat setup without specialist terminology, reuses matching tasks, and creates
only missing roles. The plugin and canonical documentation agree on the new
entry point and the required new-task transition after installation. The exact
release is live in the configured marketplace and active in Codex.
