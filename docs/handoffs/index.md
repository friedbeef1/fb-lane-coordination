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
