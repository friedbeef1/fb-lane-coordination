# Changelog

## Unreleased - 2026-06-27

- CI readiness: added a GitHub Actions automation loop for pull requests and
  pushes to `main`, plus a local `tools/fb-lane.validate.cjs` runner so agents
  and CI use the same FB-Lane validation evidence. This is CI readiness only;
  CI passing is required before merge once `main` branch protection is enabled,
  and CD/publish automation remains intentionally deferred.
- Loop Engineering: clarified OKRs as stable Product/workstream and lane
  alignment anchors, not per-task planning churn. Mini-loops now return
  `Lane OKR Fit`, `Mini-loop Evidence`, and `Evidence Against Product OKR`
  against the approved OKR tree, and Product/BFM must stop for explicit user
  approval before any OKR addition or change.
- Doctor: kept checks advisory while warning when non-quick handoffs lack
  alignment to approved OKRs or imply a new/changed OKR without an approved
  board update. `TASK-Q-*` quick tasks remain exempt, and `submit` behavior is
  unchanged.
- Plugin: bumped the Codex plugin build suffix to
  `0.1.2+codex.20260627191525`.
- Docs/plugin metadata: replaced user-specific approval wording with generic
  `the user` language, moved plugin display ownership to `FB-Lane Contributors`,
  and bumped the Codex plugin build suffix to `0.1.2+codex.20260627183826`.
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

## 0.1.2+codex.20260627174151 - 2026-06-27

- Reframed the public GitHub docs around Loop Engineering for Product Leads:
  concise README thesis, `docs/loop-engineering.md` deep dive, shorter FAQ, and
  tactical setup/platform pages.
- Added the BFM Goal Alignment Session with approved OKRs on `PROJECT_BOARD.md`
  for non-quick/non-trivial BFM runs: `Objective`, `Key Results`, `Definition
  of Done`, `Gate / Review Point`, `Approval`, and `Justification`.
- Updated BFM guidance to block before execution when OKR approval is missing,
  OKRs are unclear, or handoffs conflict with approved OKRs; conflicting work
  now routes to recommended aligned approach/scope/sequence alternatives.
- Updated lane handoffs to report `OKR Fit: aligned | suggest approach change |
  blocked by OKR ambiguity`.
- Added warning-only `doctor` checks for missing Goal Alignment Session sections,
  missing `OKR Fit`, and missing/unapproved board OKRs on non-quick handoff
  targets. `TASK-Q-*` remains exempt and `submit` behavior is unchanged.

## 0.1.2+codex.20260627171622 - 2026-06-27

- Renamed the canonical Goal Alignment evidence field to `Definition of Done`
  across docs, skills, bootstrap templates, generated prompts, packaged plugin
  copies, and CLI output.

## 0.1.2+codex.20260627164153 - 2026-06-27

- Updated the Codex plugin metadata/default prompts so the installed plugin
  explicitly presents BFM as a return loop: board and handoffs first,
  source/docs/tests reconciliation, durable state update, and no close until each
  handoff has an explicit final status.

## 0.1.2+codex.20260627163830 - 2026-06-27

- Added the visible BFM return-loop Mermaid diagram to the root README, packaged
  plugin README, and BFM skill so the loop is captured in reusable FB-Lane
  guidance.

## 0.1.2+codex.20260627161927 - 2026-06-27

- Added the BFM return-loop closeout standard: every processed handoff must be
  marked `implemented`, `already done`, `blocked`, `out of scope`, or
  `explicitly deferred`.
- Added return checks across BFM/Product and lane guidance so agents return to
  board, handoffs, source/docs/tests, lane status, and git status before
  closeout.
- Updated bootstrap templates, generated CLI prompts, and packaged plugin agent
  files so newly bootstrapped projects inherit the return-loop rule.

## 0.1.2+codex.20260625082239 - 2026-06-26

- Added lightweight Goal Alignment guidance for non-trivial FB-Lane work:
  `Working Goal`, `Definition of Done`, and `Gate / Review Point` stay canonical on
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
