# Changelog

## Unreleased - 2026-06-27

- Coordination: added lightweight Sidechat-to-Main Prompt Handoff guidance.
  Sidechats are discussion/planning spaces that can ask questions, compare
  options, review tradeoffs, recommend a path, and produce a paste-ready
  Product/BFM prompt. Product/BFM remains the execution owner for board updates,
  handoff files, source changes, commits, validation, and closeout; sidechat
  prompts are not source of truth until Product/BFM records them in durable repo
  docs. No command, dashboard, `doctor`, runtime, or required tiny-question
  ceremony was added.
- Coordination: clarified that repeated workflow failures can trigger a compact
  retro scorecard, but each repeated pattern yields at most one small guardrail.
  Quick tasks stay lightweight, and eval runners, dashboards, numeric scoring,
  CI eval jobs, bigger `doctor` checks, and per-task OKRs remain out of scope
  without a separate approved proposal.
- Plugin docs: added same-version cache-refresh verification guidance. After a
  reinstall or update, verify the active installed cache contains the expected
  wording; if not, reinstall while preserving plugin data where supported.
- Docs: clarified the Loop Engineering diagram as one Product loop containing
  smaller slice mini-loops. BFM now visibly returns to the board after each
  slice, continues only inside the approved OKR/scope, and stops or recommends
  before starting unrelated board work.
- Docs: refreshed the current version and upgrade guidance across README, FAQ,
  setup, Codex platform docs, versioning, and packaged plugin README now that
  the Codex and Claude Code plugin builds have been released.
- Plugin: refreshed visible plugin versions for the Loop Engineering public beta
  line: Codex `0.2.0-beta+codex.20260707114230` and Claude Code `1.0.1`.
- Coordination: tightened frontend visual planning guidance. Visible UI plans
  now default to a pre-build visual preview, using browser screenshot/mockup or
  imagegen asset/style option, with `skip with reason` reserved for non-visual
  work, tiny copy, spacing, or single-control fixes.
- Coordination: added Product/BFM execution-continuation guidance so approved
  safe work proceeds through routine diagnosis, implementation, verification,
  board/handoff updates, commit, staging, and cleanup without pausing before
  every routine step, while hard gates still stop.
- Coordination: added the awareness/isolation/integration rule across docs,
  templates, skills, generated prompts, and packaged plugin mirrors. Board plus
  handoff index provide shared awareness, branches/worktrees isolate execution,
  and BFM integrates outcomes; worktrees no longer read as a replacement for
  board/lock awareness or BFM reconciliation.
- Coordination: added a compact `Loop Learning` closeout field so repeated
  friction can escalate to a Product-approved guardrail, automation, or eval
  proposal without adding a new command or expanding `doctor`.
- Coordination: added a generic optional agent-behavior eval scorecard template
  for repeated loop failures. It stays Markdown-only and does not add eval
  runners, dashboards, numeric scoring, CI eval jobs, or `doctor` rules.
- Coordination: added phased approval-autonomy guidance so Product/BFM starts in
  Shadow Approval, may recommend bounded self-approval only after matching safe
  decisions, and never self-approves risky scope, live, data, provider, or
  unclear-goal surfaces.
- Coordination: documented `/goal` as a Product/BFM shortcut into the existing
  Goal Alignment Session, not a second goal system. Workstream handoffs now ask
  for `Product Goal`, `Workstream Goal`, and `User Approval Needed` so Product
  and the user can approve goal fit before BFM execution.
- Docs: named the current documentation line `FB-Lane 0.2.0-beta: Loop
  Engineering public beta` and added `docs/versioning.md` with the v1-to-latest
  before/after.
- Cleanup: closeouts now include external-service test state when checks create
  provider records/resources: test mode, cleanup evidence, or a pending cleanup
  gate.
- Docs/plugin guidance: added the objective mode-selection trigger rule. Agents
  now default to normal/simple coding unless the objective triggers FB-Lane
  light or Product/BFM through coordination files, lane/board/handoff mentions,
  payment/auth/privacy/analytics/secret/deploy gates, core product flows,
  locked files, multi-thread work, or build/sequence/approve/merge/release
  decisions.
- Handoff context: added OKF-lite progressive disclosure for Codex plugin projects.
  Bootstrap now creates `docs/handoffs/index.md`, `doctor` warns once a project
  has enough handoffs to need an index, BFM/Product skills read the index before
  detailed handoffs, and docs explain that `PROJECT_BOARD.md` remains the source
  of truth.
- CI readiness: added a GitHub Actions automation loop for pull requests and
  pushes to `main`, plus a local `tools/fb-lane.validate.cjs` runner so agents
  and CI use the same FB-Lane validation evidence. This is CI readiness only;
  CI passing is required before merge once `main` branch protection is enabled,
  while staging, live deploy, plugin release, and publish decisions remain
  manual Product decisions.
- Loop Engineering: clarified OKRs as stable Product/workstream and lane
  alignment anchors, not per-task planning churn. Mini-loops now return
  `Workstream Goal`, `Lane OKR Fit`, `User Approval Needed`, `Mini-loop Evidence`, and `Evidence Against Product OKR`
  against the approved OKR tree, and Product/BFM must stop for explicit user
  approval before any OKR addition or change.
- Doctor: kept checks advisory while warning when non-quick handoffs lack
  alignment to approved OKRs or imply a new/changed OKR without an approved
  board update. `TASK-Q-*` quick tasks remain exempt, and `submit` behavior is
  unchanged.
- Plugin: bumped the Codex plugin build suffix to
  `0.1.2+codex.20260627210000`.
- Upgrade notice: after this branch merges, reinstall the Codex plugin so local
  plugin caches pick up the packaged skill, template, and prompt changes:
  `codex plugin add fb-lane-coordination@fb-lane`.
- Maintenance cleanup: moved tracked demo MP4 assets out of git into GitHub release assets, added release asset links in demo READMEs, and documented canonical vs packaged maintenance boundaries in `docs/maintenance.md`.
- Docs: labeled Codex support as public beta and Claude Code / Antigravity support as alpha.
- Coordination: made normal workstream threads plan-only and documented Product-launched BFM as the source-change execution gate.
- Docs: added evals as lightweight agent-behavior scorecards for repeated loop failures, distinct from tests, `doctor`, CI readiness, and Definition of Done.
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
  integration, ordinary workstreams produce markdown plans/handoffs, and
  source changes happen only inside Product-launched BFM execution.
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
