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
| TASK-059 - Three-tier real-work benchmark | FB-Product / BFM + FB-Tech | Staging QA | Six directional runs: equal local outcomes, Graph 44.0% fewer raw tokens and 7.3% less wall time; production-adjacent checks passed with real-camera gate remaining | Web, Android, standalone, iOS simulator, and device-target builds passed for both arms; no integration or release authority | [TASK-059.md](TASK-059.md); [Results](../benchmarks/difficulty-tiers/TASK-059-directional-results.md); [Production-adjacent verification](../benchmarks/difficulty-tiers/TASK-059-production-adjacent-verification.md); [QA](../qa/TASK-059.md) |
| TASK-058 - Automatic BFM worktree orchestration | FB-Product / BFM + FB-Tech | Ready | Approved for focused implementation; no merge, publication, installation, or deployment | Existing claim/quick primitives create linked worktrees; focused orchestration contract pending | [TASK-058.md](TASK-058.md) |
| TASK-057 - Shift OKR validation left | FB-Product / BFM + FB-Tech | Done | Merged and published as `708593a`; active build installed | Root/package records 15/15; 48 mirrors; doctor Ready; installed cache and MCP route verified | [TASK-057.md](TASK-057.md); [QA](../qa/TASK-057.md) |
| TASK-056 - Prospective repair-efficiency benchmark | FB-Product / BFM + FB-Tech | Staging QA | Efficient Graph passed the 10% time/token target on six pairs; no universal claim or release action | −23.6% wall time; −15.8% tokens; 3/6 versus 1/6 accepted outcomes; actual billed cost unavailable | [TASK-056.md](TASK-056.md); [Result](../benchmarks/repair-efficiency/README.md); [QA](../qa/TASK-056.md) |
| TASK-055 - Repair-context efficiency | FB-Product / BFM + FB-Tech | Staging QA | Local candidate complete and prospectively validated; publication/release remains separate | Approved changelog; TASK-056 measured −23.6% wall time and −15.8% tokens; focused 28/28 and 48-mirror parity passed | [TASK-055.md](TASK-055.md); [TASK-056 result](../benchmarks/repair-efficiency/README.md) |
| TASK-054 - Real-work paired benchmark | FB-Product / BFM + FB-Tech | Staging QA | Candidate rejected: Graph was 13.1% slower and used 34.7% more total tokens with equal 2/6 accepted outcomes | 12/12 counted first passes preserved; authoritative usage, bounded repairs, curated evidence, and privacy closeout passed | [TASK-054.md](TASK-054.md); [Result](../benchmarks/real-work/README.md); [QA](../qa/TASK-054.md) |
| TASK-053 - Hardened 95% readiness benchmark | FB-Product / BFM + FB-Tech | Staging QA | All three arms passed 20/20 deliverables plus 8/8 blockers in all three fresh repetitions; result is parity on one fixed fixture | Independent result review accepted the evidence with no findings; no plugin adoption or superiority claim | [TASK-053.md](TASK-053.md); [Result](../benchmarks/control-loop/readiness95.md); [Review](../benchmarks/control-loop/readiness95-v3-independent-review.md); [QA](../qa/TASK-053.md) |
| TASK-052 - Preventive context benchmark | FB-Product / BFM + FB-Tech | Staging QA | Controlled sensitivity valid; autonomous comparison rejected; no adoption | 91% needs 65.7% prevention and 99% needs 97.0%; neither demonstrated by auditable autonomous evidence | [TASK-052.md](TASK-052.md); [QA](../qa/TASK-052.md); [Result](../benchmarks/control-loop/preventive-context.md); [Independent review](../benchmarks/control-loop/preventive-context-autonomous-independent-review.md) |
| TASK-051 - Context and repair efficiency | FB-Product / BFM + FB-Tech | Staging QA | Candidate rejected; 310,358 modeled token units exceeded the frozen 298,080 maximum, privacy failed as implementation evidence, and Task 4/adoption remain closed | Modeled time passed but is not implementation proof; experimental runtime removed from the final tree while Git history and frozen evidence remain | [TASK-051.md](TASK-051.md); [QA](../qa/TASK-051.md); [Superseding review](../benchmarks/control-loop/context-efficiency-independent-review.md) |
| TASK-050 - Generic agent control loop and FB 0.5.0-beta | FB-Product / BFM + FB-Tech | Done | Published build `0.5.0-beta+codex.20260728113402` installed and enabled | Focused runtime/release evidence, independently reviewed benchmarks, marketplace upgrade, install, skill and MCP smoke | [TASK-050.md](TASK-050.md) |
| TASK-049 - Graph-directed plugin navigation and FB 0.4.0-beta | FB-Product / BFM | Done | PR #51 merged; `0.4.0-beta+codex.20260726101229` installed and enabled | Root/package MCP, project-specific IDs, MÉJA consumer smoke, metadata, parity, validator, and install smoke | [TASK-049.md](TASK-049.md) |
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
