# FB Harness Redesign Implementation

## Global constraints

- Keep the existing ownership model and the shipped first-project flow: lanes plan, Product records approval, and BFM builds and verifies only after explicit approval.
- The small `docs/fb/` pack is the canonical operational manual. `AGENTS.md` is a short navigation layer, not a duplicate operating manual.
- Preserve technical identifiers and commands, including `fb-lane`, `fb-lane-coordination`, plugin IDs, MCP names, paths, and the existing validator and `doctor` commands.
- Do not add a CLI command, wizard, dashboard, eval runner, CI job, replacement board-status model, release, deployment, publication, or consumer-repository change.
- Keep root and packaged plugin copies aligned. Existing-project bootstrap may modify only explicit managed FB route blocks; it must preserve all project-owned text.
- Historical and planning-only handoffs remain valid. New enforcement applies only to `fb_harness: v2` handoffs that declare a reviewable state.

## Task 1: Canonical harness pack and concise entry points

- Add the canonical root pack at `docs/fb/README.md`, `start.md`, `workflow.md`, `evidence.md`, and `guardrails.md`; mirror the same pack in `plugins/fb-lane-coordination/docs/fb/`.
- Make the pack own the source-of-truth hierarchy, Project Start Brief, four-step How FB works card, plain-language progress, selected/skipped lanes, clarification format, board/index/handoff roles, approval and BFM execution boundary, Test This Now, Verification Handoff, recovery, Loop Learning, and small-check escalation policy.
- Reduce the root `AGENTS.md` and `templates/AGENTS.md` to short navigators that preserve every existing ownership, safety, sidechat-parent, recovery, and coordination rule through links to the pack.
- Replace duplicated operating-manual prose in the active public README, FAQ, Codex guide, packaged README, loop guide, and relevant coordination/Product/BFM/setup skill entry points with concise task-oriented routes into the pack.
- Keep the user-facing Project Start Brief and Test This Now contract intact.

## Task 2: Safe bootstrap migration and parity coverage

- Add root/package tests first for fresh bootstrap creation of the complete `docs/fb/` pack, thin route guidance, correct read order, and root/package parity.
- Add tests for rerunning bootstrap in an existing project: preserve user-owned `AGENTS.md` and `.codex/rules.md` content; create or idempotently replace only `<!-- fb-harness-route-start -->` through `<!-- fb-harness-route-end -->`.
- Update the mirrored CLI to write the pack, generate a thin managed route in fresh projects, and insert/update only the managed route block for existing projects.
- Retain the legacy FB route marker only as a compatibility implementation detail if needed; its content must route to the canonical pack rather than duplicate policy.

## Task 3: Harness-v2 handoff review evidence gate

- Add root/package fixtures and tests before implementation for a harness-v2 approved initial handoff with `## Project Start Brief` and `## Build Brief`; a planning-only v2 handoff; and every reviewable state with a complete review packet.
- Define visible `Review state` values: `not reviewable`, `runnable sandbox`, `staging candidate`, and `completed build`.
- For a v2 reviewable handoff require `## Test This Now` with outcome type, direct Markdown links, exact steps and expectations, pass criteria, known limits, failure-report format, and an explicit `Blocked — no review environment yet` state when access is unavailable.
- Extend the existing validator/doctor logic: direct local links resolve when applicable; remote links only require valid Markdown-link shape; incomplete review packets block with an actionable result. Historical/non-v2 handoffs remain exempt.
- Keep technical board statuses unchanged; Product/BFM updates retain the plain-language progress sequence and an explicit blocked next action.

## Task 4: Integration, migration smokes, and closeout

- Run a fresh creator-commerce bootstrap smoke and an existing-project migration smoke; verify generated root/package pack parity, links/read order, and idempotent managed blocks.
- Run root/package suites, Node syntax, source/test parity, validator, doctor, whitespace checks, and an independent whole-branch review.
- Update the board, handoff index, detailed handoff, and Product workstream card with exact verification evidence and remaining Product gate. Do not push, publish, release, deploy, or merge without separate authorization.

## Session handoff

Status: Task claimed. No implementation slice has been dispatched.

Decision: Use Markdown `fb_harness: v2` as the opt-in enforcement marker. The human-readable `Review state: ...` line carries the four specified values. A v2 handoff with `Review state: not reviewable` is planning-only and does not need Test This Now evidence.

Next step: Dispatch Task 1 for the canonical pack and entry-point consolidation, then review it before changing bootstrap behavior.
