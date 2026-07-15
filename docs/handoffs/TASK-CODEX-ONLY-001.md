---
type: fb-lane-handoff
task: TASK-CODEX-ONLY-001
lane: fb-product
status: done
okr_fit: aligned
---

# TASK-CODEX-ONLY-001 - Codex-only FB-Lane support cut

## Goal Alignment Session

Product Goal: Make the public support boundary match the integrations the maintainer actively updates and verifies.
Workstream Goal: Ship one Codex-only install, bootstrap, package, documentation, and test contract while preserving a concise path for contributors to revive paused integrations.
Lane OKR Fit: aligned
User Approval Needed: no - James approved the Codex-only support policy and explicitly requested implementation.
Mini-loop Evidence: Root and packaged CLI suites both passed their 16-check baseline on 2026-07-13 before the behavior change.
Evidence Against Product OKR: None identified.

## Scope

- Codex is the only supported and packaged integration.
- The default bootstrap and `--platform codex` create only Codex artifacts; `--codex-only` stays as an alias.
- `all`, `claude`, `claude-code`, and `antigravity` fail without writing files and direct collaborators to the paused-integration note.
- Claude Code and Antigravity distribution/setup surfaces are removed; brief archived references invite a future contributor-owned revival.
- Root/package CLI behavior, docs, and bundled MCP configuration are kept in parity.

## Out Of Scope

- Installing or testing Claude Code or Antigravity.
- Changing the shared coordination model beyond platform support boundaries.

## Product/BFM Closeout

Status: Done.
Actioned By: FB-Product / BFM.
Result: The Codex-only contract, distribution cleanup, documentation/archival updates, parity, validation, and marketplace plugin smoke passed. Product review and the separately approved release completed in PR #39.
Evidence:

- Root `node tools/fb-lane.test.cjs` and packaged `node plugins/fb-lane-coordination/tools/fb-lane.test.cjs` each passed 24 checks.
- Root `node --check tools/fb-lane.cjs` and packaged `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs` passed; `diff -q tools/fb-lane.cjs plugins/fb-lane-coordination/tools/fb-lane.cjs` and `diff -q tools/fb-lane.test.cjs plugins/fb-lane-coordination/tools/fb-lane.test.cjs` passed.
- `node tools/fb-lane.validate.cjs`, `node tools/fb-lane.cjs doctor`, and `git diff --check` passed in the clean checkout; doctor reported `FB-Lane doctor: Ready`.
- Marketplace manifest, both plugin manifests, and bundled `.mcp.json` parsed locally.
- With a fresh temporary `CODEX_HOME`, `codex plugin marketplace add . --json` registered the local checkout as marketplace `fb-lane`; `codex plugin add fb-lane-coordination@fb-lane --json` installed version `0.2.0-beta+codex.20260707114230`; `codex plugin list` reported it `installed, enabled`. The temporary home was removed after the smoke.

Validator Resolution: The initial validation attempt correctly exposed stale `.claude-plugin` JSON reads after the approved Codex-only removal. The subsequent scoped cleanup removed those obsolete validator dependencies; validation passed at `c9833db`.
Remaining: No release gate remains. Claude Code and Antigravity installation/testing remain explicitly out of scope.
Closeout Note: PR #39 merged to `main`; the refreshed marketplace plugin installed as `0.2.0-beta+codex.20260716052513`.
Loop Learning: Feedback captured: issue found; Repeated pattern?: no; Tooling needed?: none; Product approval needed?: no.
