---
type: fb-lane-handoff-index
status: active
purpose: Read this before opening detailed handoffs.
---

# Handoff Index

Use this file as the first read for handoff discovery. `PROJECT_BOARD.md` remains the source of truth for task status, ownership, sequencing, gates, and file locks. This index is routing only; detailed handoffs hold plans, rationale, logs, full QA, copy variants, and implementation detail.

## Active / Decision-Relevant

| Task / Topic | Lane | Status | Depends / Blocks / Gate | Checks / Evidence | Detail |
|---|---|---|---|---|---|
| TASK-048 - FB graduated project graph | FB-Product / BFM | Staging QA | Controlled graph-first routing benefit demonstrated; plugin integration remains separate | 6/6 correctness with lower uncached input, orientation content, and wall time | [TASK-048.md](TASK-048.md) |
| TASK-047 - Durable efficiency and evidence normalization | FB-Product / BFM | Staging QA | Focused local gate passed; no release checkpoint or external action | Root/package 11/11; CLI/bootstrap 70/70; 41 mirrors; doctor, syntax, links, whitespace passed | [TASK-047.md](TASK-047.md) |
| TASK-031 - Full BFM changelog closeout and FB 0.3.1-beta | FB-Product / BFM | In Progress | PR #48; stop at Ready to ship; Push Live remains separate | Candidate `0.3.1-beta+codex.20260718021942`; focused changelog, session/submission/release, metadata, parity, syntax/link/whitespace, final validator | [TASK-031.md](TASK-031.md) |
| TASK-030 - FB 0.3.0-beta release | FB-Product / BFM | Done | [PR #44](https://github.com/friedbeef1/fb-lane-coordination/pull/44) merged; `0.3.0-beta+codex.20260717150502` installed and enabled | GitHub readiness; marketplace upgrade; installed six-skill, MCP-route, server-syntax, and diagram proof passed | [TASK-030.md](TASK-030.md) |
| TASK-029 - FB six-workstream loop | FB-Product / BFM + six workstreams | Staging QA | Ready to ship; Push Live remains separate; no publication, install, merge, deploy, or release checkpoint | Root/package runtime and skill contracts, 25-mirror parity, syntax, and whitespace passed; circuit breaker prevented repeated whole-gate work | [TASK-029.md](TASK-029.md) |
| TASK-028 - FB efficiency correction | FB-Product / BFM + FB-Tech execution | Staging QA | Local candidate `284e465`; no release checkpoint requested; a Product-owned explicit request is required before any full validator | Focused root/package release-first contracts, package sync, syntax, and whitespace; system smoke is the default review contract | [TASK-028.md](TASK-028.md) |
| TASK-027 - Complete the FB product story | FB-Product / BFM + FB-Business and FB-Design guidance | Staging QA | Final review repairs complete locally; Product re-review pending; no external action authorized | Evidence-target RED/GREEN; root/package positioning, CLI 70/70, session 32/32, eval 18/18, beginner 10/10, two-speed, parity, whitespace, clean-tree validator, and standalone doctor passed | [TASK-027.md](TASK-027.md) |
| TASK-026 - BFM two-speed efficiency | FB-Product / BFM + FB-Tech execution | Staging QA | Local Product review passed; no public migration or release action | Candidate `a6b00ab`; CLI 70/70, session 32/32, eval 18/18, beginner 10/10, positioning/two-speed contracts, validator, doctor Ready, parity, and whitespace passed | [TASK-026.md](TASK-026.md) |
| TASK-025 - FB product positioning and comparison | FB-Product / BFM + FB-Business and FB-Design guidance | Staging QA | Local Product review passed; no release/publish/deploy/merge | Candidate `3af1f17`; focused root/package contract, CLI 70/70, session 31/31, eval 18/18, beginner 10/10, validator, doctor Ready, parity, and whitespace passed | [TASK-025.md](TASK-025.md) |
| TASK-024 - FB beginner clarity and status | FB-Product / BFM + FB-Tech execution | Staging QA | Local Product review passed; release/install/merge/deploy remain separate and unauthorized | Candidate `cc13389`; CLI 70/70, session 31/31, eval 18/18, beginner 10/10 in each mirror; recovery, validator, doctor Ready, parity, whitespace, task reviews, and final whole-branch re-review passed | [TASK-024.md](TASK-024.md) |
| TASK-022 - Repository-local session ledger | FB-Product / BFM + FB-Tech execution | Staging QA | Final combined review passed; no release/publish/deploy/merge | Repair `f94dce9`; root/package session 31/31; root/package CLI 45/45; recovery, complete clean gate, doctor Ready, and review no findings | [TASK-022.md](TASK-022.md) |
| TASK-023 - Markdown eval loop | FB-Product / BFM + FB-Tech execution | Staging QA | Final combined review passed; no blocking promotion or external release action | Repairs `fe733a1` and `f94dce9`; root/package eval 18/18 and session 31/31; selected closeout, recovery, complete clean gate, doctor Ready, and review no findings | [TASK-023.md](TASK-023.md) |
| TASK-021 - FB Harness Redesign | FB-Product / BFM | Staging QA | Local Product gate only; `Review state: not reviewable`; merge/release require separate authorization; no push, publication, release, deployment, merge, plugin install, or consumer-repository change occurred | Final fix `8c54c1c`; setup/v2 authoring contracts; actionable placeholder rejection; focused v2 14/14 and full 45/45 mirrored suites; recovery; syntax/parity; validator/doctor Ready; diff; clean final whole-branch re-review | [TASK-021.md](TASK-021.md) |
| TASK-020 - FB first-project clarity | FB-Product / BFM | Staging QA | Local Product review only; no new command, push, publish, release, deployment, or merge | Creator-commerce bootstrap smoke; root/package 28-check suites; syntax/parity; validator; doctor Ready; whitespace; slice and final reviews | [TASK-020.md](TASK-020.md) |
| TASK-019 - FB documentation rebrand | FB-Product / BFM | In Progress | Product branch-diff review; no identifier migration, historic rewrite, publish, or deployment | Scoped wording audit plus root/package parity, tests, validator, doctor, and whitespace checks pending | [TASK-019.md](TASK-019.md) |
| TASK-Q-20260713-SIDECHAT-PARENT - Sidechat parent-thread routing | FB-Product | Done | Released in [PR #39](https://github.com/friedbeef1/fb-lane-coordination/pull/39); no app-level routing was added | Root/package 26-check suites, syntax/parity, clean-tree validator, doctor Ready, diff check, and marketplace build `0.2.0-beta+codex.20260716052513` | [TASK-Q-20260713-SIDECHAT-PARENT.md](TASK-Q-20260713-SIDECHAT-PARENT.md) |
| TASK-018 - Generic verification and workspace recovery handoff | FB-Product / BFM | Done | Released in PR #39; no consumer-repo change, runner, or dashboard | Focused recovery-contract test plus root/package 27-check suites, syntax/parity, clean-clone validator/doctor, whitespace check, Product review, and marketplace installation passed | [TASK-018.md](TASK-018.md) |
| TASK-CODEX-ONLY-001 - Codex-only support cut | FB-Product / BFM | Done | Released in PR #39; paused integrations remain out of scope | Clean-checkout validator/doctor/diff check, root/package 24-check suites, syntax/parity, and refreshed marketplace plugin install `0.2.0-beta+codex.20260716052513` passed | [TASK-CODEX-ONLY-001.md](TASK-CODEX-ONLY-001.md) |
| TASK-017 - Progressive disclosure + framework OKR hardening | FB-Tech | Done | [PR #31](https://github.com/friedbeef1/fb-lane-coordination/pull/31) merged; current plugin release in PR #39 | Syntax, parity, tests, JSON parse, scorecard, `/goal`, Sidechat-to-Main wording scans, validator, doctor, diff check, and installed marketplace build passed | [TASK-017.md](TASK-017.md) |
| TASK-016 - Codex plugin handoff index | FB-Product | Done | Product review of branch/PR | CLI syntax, tests, parity | [TASK-016.md](TASK-016.md) |
| CI readiness automation loop | FB-Product | Done | CI readiness model | Local validator, doctor | [TASK-013.md](TASK-013.md) |
| Ponytail cleanup pass | FB-Product | Done | Maintenance guidance | Release asset checks, validator | [TASK-014.md](TASK-014.md) |
| Stable OKR alignment | FB-Product | Done | Loop Engineering model | Doctor fixture matrix | [TASK-012.md](TASK-012.md) |

## Historical Evidence

Open these only when investigating the named area or reconciling old Product decisions.

| Topic | Area | Detail |
|---|---|---|
| Plugin upgrade docs | Codex plugin | [TASK-Q-5624.md](TASK-Q-5624.md) |
| BFM return-loop closeout | Coordination | [TASK-011.md](TASK-011.md) |
| CI readiness automation loop | CI | [TASK-013.md](TASK-013.md) |
| Stable OKR alignment | Coordination | [TASK-012.md](TASK-012.md) |
| Maintenance cleanup | Cleanup | [TASK-014.md](TASK-014.md) |

## Index Limits

Keep this index compact. Do not put full OKRs, full QA checklists, plans, logs, rationale, copy variants, or implementation detail here. Put those in the detailed handoff and link it from the Detail column.

## Lightweight Handoff Metadata

For new handoffs, add a short frontmatter block when useful:

```md
---
type: fb-lane-handoff
task: TASK-...
lane: fb-product | fb-tech | fb-design | fb-business
status: ready | implemented | blocked | deferred | done
okr_fit: aligned | suggest approach change | blocked by OKR ambiguity
---
```

Do not retrofit old handoffs unless Product/BFM is already touching them.
