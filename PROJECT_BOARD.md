# Project Board

## Statuses
- `Inbox`: Newly requested tasks requiring triage.
- `Ready`: Triaged tasks, fully scoped, ready to be claimed.
- `In Progress`: Tasks currently being worked on by an owner.
- `Staging QA`: Candidate awaiting verification. Record the actual local, sandbox, staging, or completed-build environment separately.
- `Done`: Checked, verified, and merged to production by FB-Product.

---

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-049 | Checking | FB-Product / BFM | Plugin Navigation | Integrate graph-directed targeted reading into the bundled Codex plugin, support repository-specific task IDs, and release `0.4.0-beta+codex.20260726101229` | `tools/fb-project-graph*`, MCP surface, release metadata, canonical/package graph guidance and skills | [Handoff](docs/handoffs/TASK-049.md); [QA](docs/qa/TASK-049.md); MÉJA consumer smoke; changelog wording approval pending |
| TASK-048 | Staging QA | FB-Product / BFM | Project Navigation | Evaluate graduated graph navigation and a minimal graph-first route without changing product-truth authority | `tools/fb-project-graph*`, `.fb/graph/`, TASK-048 experiment/QA/coordination records | [Handoff](docs/handoffs/TASK-048.md); [Results](docs/experiments/TASK-048-graduated-project-graph-pilot.md); [QA](docs/qa/TASK-048.md) |
| TASK-047 | Staging QA | FB-Product / BFM | Harness Efficiency | Normalize durable evidence, add risk-triggered review and deterministic verification reuse, and reduce duplicated coordination context | `tools/fb-records.*`, validator/doctor integration, canonical/package harness and skills, templates, TASK-047 records | [Handoff](docs/handoffs/TASK-047.md); [Pilot](docs/experiments/TASK-047-real-task-pilot.md); [Plan](docs/superpowers/plans/2026-07-23-fb-durable-efficiency-evidence-normalization.md); [QA](docs/qa/TASK-047.md); focused local gate passed |
| TASK-031 | In Progress | FB-Product / BFM | Closeout + Plugin Release | Require a Full BFM changelog decision before Ready to ship and rebuild FB as 0.3.1-beta | Closeout/session/runtime contracts, canonical/package docs and skills, release metadata and records | [Handoff](docs/handoffs/TASK-031.md); PR #48; `0.3.1-beta+codex.20260718021942`; Push Live remains separate |
| TASK-030 | Done | FB-Product / BFM | Codex Plugin Release | Release the Codex plugin as `0.3.0-beta`, align active metadata/prompts/docs with the six-workstream loop, and prove the packaged install | None | [Handoff](docs/handoffs/TASK-030.md); [PR #44](https://github.com/friedbeef1/fb-lane-coordination/pull/44) merged; `0.3.0-beta+codex.20260717150502` installed and enabled; GitHub readiness and live cache proof passed |
| TASK-029 | Staging QA | FB-Product / BFM + six workstreams | Product Model | Expand FB to Product/User, Business, Design, Tech, Discovery, and Bugs; make `$bfm` reconcile all six ready-handoff sources and align the plugin and public story | Runtime/session/CLI/MCP, bootstrap, skills, canonical/package docs/tests, TASK-029 records | [Handoff](docs/handoffs/TASK-029.md); branch `codex/fb-six-workstreams`; root/package focused contracts, 25-mirror parity, syntax, and whitespace passed; Ready to ship; no release checkpoint |
| TASK-028 | Staging QA | FB-Product / BFM + FB-Tech execution | Harness Efficiency | Revise the local harness to focused checks, immediate safety gates, and explicit Product-owned release checkpoints; retain the three-mode router, Quick Record, budgets, and generated mirrors | Canonical/package efficiency and documentation contracts, canonical harness and skills, board/handoff/index/current-task/Product card | [Handoff](docs/handoffs/TASK-028.md); [spec](docs/superpowers/specs/2026-07-17-fb-efficiency-correction-design.md); local candidate `284e465`; no release checkpoint requested; focused local QA only |
| TASK-027 | Staging QA | FB-Product / BFM + FB-Business and FB-Design guidance | Product Positioning | Extend the canonical Why FB story with evidence-backed TASK-026 two-speed pain points, mapped solutions, an updated delivery-loop diagram, and a corrective-patch example | `docs/why-fb.md`, packaged mirror, mirrored evidence, root/package positioning tests, board/handoff/index/current-task/Product card | [Handoff](docs/handoffs/TASK-027.md); final review found repairs; local candidate repair and Product re-review pending; all external-action gates remain closed |
| TASK-026 | Staging QA | FB-Product / BFM + FB-Tech execution | BFM Efficiency | Add internal Quick/Full BFM classification, matching worktree reuse and primary placement, compact queue visibility, proportional verification, and optional project preflight | Mirrored CLI/session modules and tests, canonical/package workflow/session/guardrail/BFM guidance, board/handoff/index/current-task/Product card | [Handoff](docs/handoffs/TASK-026.md); candidate `a6b00ab`; CLI 70/70, session 32/32, eval 18/18, beginner 10/10, positioning/two-speed root/package, validator, doctor Ready, parity, and whitespace passed; local-only gate |
| TASK-025 | Staging QA | FB-Product / BFM + FB-Business and FB-Design guidance | Product Positioning | Explain FB beside vanilla Codex and Kurrent Capacitor with honest overlap, evidence-backed pain points, rendered diagrams, and concrete examples | Canonical/package comparison page, public/harness README routers, FAQ, focused test/validator, board/handoff/index/current-task/Product card | [Handoff](docs/handoffs/TASK-025.md); candidate `3af1f17`; focused root/package positioning contract, CLI 70/70, session 31/31, eval 18/18, beginner 10/10, validator, doctor Ready, parity, and whitespace passed; local-only gate |
| TASK-024 | Staging QA | FB-Product / BFM + FB-Tech execution | Beginner Experience | Add a beginner-facing mode, status, pause, and next-action layer while preserving the existing technical coordination engine | Canonical/package harness, public docs, root/package skills, mirrored CLI/MCP and tests, bootstrap examples/templates, shadow evals, `PROJECT_BOARD.md`, handoff/index/current-task/Product card | [Handoff](docs/handoffs/TASK-024.md); candidate `cc13389`; root/package CLI 70/70, session 31/31, eval 18/18, beginner 10/10; recovery, validator, doctor Ready, parity, whitespace, task reviews, and final whole-branch re-review passed; local-only release gate remains closed |
| TASK-022 | Staging QA | FB-Product / BFM + FB-Tech execution | FB Session Harness | Add repository-local session intake, promotion, status, checkpoint, recall, review, and closeout with shared clone-local coordination state and curated committed evidence | Mirrored session/CLI modules and tests, session/harness docs, bootstrap and doctor integration, Product/BFM skills, `PROJECT_BOARD.md`, handoff index, TASK-022 handoff, Product workstream card | [Handoff](docs/handoffs/TASK-022.md); final submit repair `f94dce9`; CLI/MCP final validation, board commit, and push share the session lifecycle lock; session 31/31, full gate, and final combined review passed with no findings |
| TASK-023 | Staging QA | FB-Product / BFM + FB-Tech execution | FB Eval Harness | Add the Markdown-first harness/product eval lifecycle, quality-gap revision loop, authority transitions, and deterministic structural enforcement on top of TASK-022 evidence | Canonical/package eval harness pages and templates, mirrored validators/tests, Product/BFM skills, bootstrap routes, `PROJECT_BOARD.md`, handoff index, TASK-023 handoff, Product workstream card | [Handoff](docs/handoffs/TASK-023.md); final integrated repair `fe733a1` plus submit compatibility `f94dce9`; eval 18/18, session 31/31, full gate, and final combined review passed with no findings; no release action |
| TASK-021 | Staging QA | FB-Product / BFM | FB Harness | Replace duplicated operating prose with a mirrored canonical `docs/fb/` harness pack, safely route fresh/existing projects into it, and enforce opt-in v2 review evidence through the existing validator/doctor | Root/package harness pack, navigational instructions, active docs/skills, mirrored bootstrap/tests, validator/doctor, `PROJECT_BOARD.md`, handoff index, TASK-021 handoff, Product workstream card | [Handoff](docs/handoffs/TASK-021.md); [plan](docs/superpowers/plans/2026-07-16-fb-harness-redesign.md); final fix `8c54c1c`; setup and canonical v2 authoring contracts; actionable placeholder/TODO/TBD rejection; focused v2 14/14 and full 45/45 mirrored suites; recovery, syntax/parity, validator/doctor Ready, diff checks, and final whole-branch re-review passed; local review only; no push, publication, release, deployment, merge, or consumer-repository change authorized |
| TASK-020 | Staging QA | FB-Product / BFM | Codex Plugin Onboarding | Make FB understandable to first-time project starters: planning-before-build boundary, plain-language progress, decision/assumption separation, distinct lane roles, and review-ready Test This Now packets | Root/package skills and docs, bootstrap-generated instructions, root/package CLI tests, `PROJECT_BOARD.md`, handoff index, TASK-020 handoff, Product workstream card | [Handoff](docs/handoffs/TASK-020.md); [plan](docs/superpowers/plans/2026-07-16-fb-first-project-clarity.md); creator-commerce bootstrap smoke, root/package 28-check suites, syntax/parity, validator, doctor Ready, whitespace, and final review passed; local branch only, no push, publish, release, deployment, or merge authorized |
| TASK-019 | Staging QA | FB-Product / BFM | Documentation | Rebrand active documentation to FB and use the approved primary tagline/current model line only on approved primary surfaces, while retaining all `fb-lane` technical identifiers and historical records | Active README/FAQ/setup/platform/plugin docs, agent guidance/templates/examples, scorecards, root/package bootstrap text and associated tests, board/index/handoff/workstream records | [Handoff](docs/handoffs/TASK-019.md); [plan](docs/superpowers/plans/2026-07-16-fb-documentation-rebrand.md); root/package 27-check suites, syntax/parity, scoped audit, JSON parse, demo check, clean-worktree validator, doctor Ready, whitespace check, and whole-branch review passed; branch retained locally; no package/API rename, push, publish, deployment, or historical rewrite |
| TASK-Q-20260713-SIDECHAT-PARENT | Done | FB-Product | Coordination | Define and distribute a parent-thread-only sidechat handoff rule for this project and the Codex FB-Lane plugin | `docs/sidechat-parent-thread-routing.md`, `AGENTS.md`, bundled FB-Lane coordination skills and docs | [Handoff](docs/handoffs/TASK-Q-20260713-SIDECHAT-PARENT.md); released in [PR #39](https://github.com/friedbeef1/fb-lane-coordination/pull/39) as `0.2.0-beta+codex.20260716052513` |
| TASK-018 | Done | FB-Product / BFM | Coordination | Add a generic Verification Handoff and workspace-recovery contract so Product/BFM owns routine test recovery, explicit 15 GiB/15-second bounded health defaults, clean-clone recovery, and evidence before user testing | `tools/fb-lane.cjs`, packaged CLI/test copies, root/package rules, templates, skills, scorecards, loop docs, board/handoff/workstream records | [Handoff](docs/handoffs/TASK-018.md); [plan](docs/superpowers/plans/2026-07-15-verification-handoff-contract.md); focused recovery-contract test, root/package 27-check suites, syntax/parity, clean-clone validator/doctor, whitespace checks, Product review, and [PR #39](https://github.com/friedbeef1/fb-lane-coordination/pull/39) release passed |
| TASK-CODEX-ONLY-001 | Done | FB-Product / BFM | Codex Plugin | Make Codex the sole supported, shipped, documented, and tested FB-Lane integration; disable Claude Code and Antigravity paths while preserving concise contributor reference notes | `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, both CLI tests, `.claude-plugin/**`, `.claude/agents/**`, `platforms/claude-code/**`, `platforms/antigravity/**`, `README.md`, `FAQ.md`, `CHANGELOG.md`, `docs/setup.md`, `docs/versioning.md`, `docs/paused-integrations.md`, `plugins/fb-lane-coordination/.mcp.json`, `PROJECT_BOARD.md`, `docs/handoffs/index.md`, `docs/handoffs/TASK-CODEX-ONLY-001.md`, `docs/workstreams/fb-product.md` | [Handoff](docs/handoffs/TASK-CODEX-ONLY-001.md); Product review, [PR #39](https://github.com/friedbeef1/fb-lane-coordination/pull/39), and installed-marketplace smoke passed for `0.2.0-beta+codex.20260716052513` |
| TASK-017 | Done | FB-Tech | Coordination | Harden progressive-disclosure handoff index semantics, FB-Lane framework OKR, drift health guardrails, eval escalation, phased approval autonomy, Product/BFM execution continuation, frontend visual planning, Sidechat-to-Main Prompt Handoff guidance, and version positioning | `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, `tools/fb-lane.test.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`, `AGENTS.md`, `.codex/rules.md`, `.claude/agents/**`, `templates/*.md`, `skills/**`, `plugins/fb-lane-coordination/skills/**`, `agents/**`, `plugins/fb-lane-coordination/agents/**`, `README.md`, `FAQ.md`, `docs/loop-engineering.md`, `docs/setup.md`, `docs/versioning.md`, `platforms/codex/README.md`, `platforms/codex/workflow-rules.md`, `plugins/fb-lane-coordination/README.md`, `docs/handoffs/index.md`, `docs/handoffs/TASK-017.md`, `CHANGELOG.md`, `PROJECT_BOARD.md` | [Handoff](docs/handoffs/TASK-017.md); [PR #31](https://github.com/friedbeef1/fb-lane-coordination/pull/31) and [PR #39](https://github.com/friedbeef1/fb-lane-coordination/pull/39) are merged |
| TASK-016 | Done | FB-Product | Codex Plugin | Add handoff index progressive-disclosure support to the Codex plugin | `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, `plugins/fb-lane-coordination/skills/**`, `templates/*.md`, `docs/**`, `README.md`, `FAQ.md`, `CHANGELOG.md` | [Handoff](docs/handoffs/TASK-016.md) |
| TASK-Q-20260627223437 | Done | FB-Product | Documentation | Document FB-Lane evals as lightweight agent-behavior scorecards | `README.md`, `FAQ.md`, `docs/loop-engineering.md`, `plugins/fb-lane-coordination/README.md`, `CHANGELOG.md`, `PROJECT_BOARD.md` | `codex/evals-docs` |
| TASK-015 | Done | FB-Product | Coordination | Make workstream threads read-only planning lanes and gate source changes through Product-launched BFM execution | `AGENTS.md`, `CLAUDE.md`, `.codex/rules.md`, `README.md`, `FAQ.md`, `docs/loop-engineering.md`, `docs/setup.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`, `templates/*.md`, `skills/**/*.md`, `agents/**`, `.claude/agents/**`, `plugins/fb-lane-coordination/**`, `tools/fb-lane.cjs` | [PR #29](https://github.com/friedbeef1/fb-lane-coordination/pull/29) |
| TASK-014 | Done | FB-Product | Cleanup | Ponytail cleanup: move rendered demo videos out of git and clarify canonical/generated maintenance surfaces | `codex-lane-demo/renders/*.mp4`, `platforms/*/how-to-interact-demo/renders/*.mp4`, `.gitignore`, `README.md`, `CHANGELOG.md`, `docs/maintenance.md`, `codex-lane-demo/README.md`, `platforms/claude-code/how-to-interact-demo/README.md`, `platforms/antigravity/how-to-interact-demo/README.md`, `PROJECT_BOARD.md`, `docs/handoffs/TASK-014.md` | [PR #28](https://github.com/friedbeef1/fb-lane-coordination/pull/28) |
| TASK-013 | Done | FB-Product | CI | Add CI readiness automation loop for FB-Lane validation evidence | `.github/workflows/fb-lane-readiness.yml`, `tools/fb-lane.validate.cjs`, `.gitignore`, `.codex/rules.md`, `README.md`, `FAQ.md`, `docs/loop-engineering.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`, `docs/handoffs/TASK-013.md` | `codex/ci-readiness-loop`, `docs/handoffs/TASK-013.md` |
| TASK-012 | Done | FB-Product | Coordination | Clarify stable OKR alignment so OKRs anchor the loop instead of multiplying during execution | `AGENTS.md`, `README.md`, `FAQ.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`, `docs/loop-engineering.md`, `docs/handoffs/TASK-012.md`, `templates/*.md`, `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/**`, `skills/**/*.md`, `agents/**`, `.claude/agents/**` | `codex/stable-okr-alignment`, `docs/handoffs/TASK-012.md` |
| TASK-011 | Done | FB-Product | Coordination | Add BFM return-loop closeout checks | `AGENTS.md`, `README.md`, `FAQ.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`, `docs/loop-engineering.md`, `docs/setup.md`, `docs/handoffs/TASK-011.md`, `templates/*.md`, `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/**`, `skills/fb-lane-coordination/SKILL.md`, `skills/project-coordination-setup/SKILL.md`, `skills/quickstart/SKILL.md`, `agents/**`, `.claude/agents/**`, `platforms/*/README.md` | [PR #25](https://github.com/friedbeef1/fb-lane-coordination/pull/25), `docs/handoffs/TASK-011.md` |
| TASK-Q-5624 | Done | FB-Product | Quick-Fix | Document plugin upgrade process and changelog | (None) | [PR #20](https://github.com/friedbeef1/fb-lane-coordination/pull/20) |
| TASK-Q-5217 | Done | FB-Tech | Quick-Fix | Improve Codex plugin setup UX | (None) | [PR #17](https://github.com/friedbeef1/fb-lane-coordination/pull/17) |
| TASK-Q-8688 | Done | FB-Tech | Quick-Fix | Quick test hooks | (None) | [Branch](https://github.com/friedbeef1/fb-lane-coordination/tree/quick/TASK-Q-8688-quick-test-hooks) |
| TASK-001 | Done | FB-Tech | Setup | Bootstrap repository files | (None) | [Branch](https://github.com/example/repo/tree/main) |
| TASK-002 | Done | FB-Tech | Core | Implement user authentication endpoints | (None) | (None) |
| TASK-003 | Done | FB-Design | UI | Design responsive dashboard navigation | (None) | (None) |
| TASK-004 | Done | FB-Product | Codex | Package FB-Lane as a Codex plugin | (None) | PR #7 |
| TASK-005 | Done | FB-Product | Codex Docs | Clarify Codex plugin pain point and value | (None) | `codex/pain-point-docs` |
| TASK-006 | Done | FB-Product | Codex Docs | Explain how FB-Lane works with Codex worktrees | `README.md`, `FAQ.md`, `platforms/codex/README.md` | `codex/pain-point-docs` |
| TASK-007 | Done | FB-Tech | CLI | Fix quick-task ID parsing for `TASK-Q-####` board rows | `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs` | `codex/quick-task-id-parser-fix` |
| TASK-008 | Done | FB-Product | Documentation | Refresh plugin docs after merged Codex and quick-task work | `README.md`, `FAQ.md`, `plugins/fb-lane-coordination/README.md`, `plugins/fb-lane-coordination/.codex-plugin/plugin.json`, `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`, `PROJECT_BOARD.md` | `codex/docs-refresh-after-merges` |
| TASK-009 | Done | FB-Product | Documentation | Trim front page and move setup/platform details to focused docs | `README.md`, `docs/setup.md`, `platforms/codex/README.md`, `PROJECT_BOARD.md` | `codex/front-page-docs-trim` |
| TASK-010 | Done | FB-Product | Coordination | Add lightweight goal alignment to FB-Lane handoffs and BFM sequencing | (None) | [PR #19](https://github.com/friedbeef1/fb-lane-coordination/pull/19) |
| TASK-011 | Done | FB-Tech | Security | Harden fb-lane CLI against shell command injection | `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs` | [PR #21](https://github.com/friedbeef1/fb-lane-coordination/pull/21) |

---

### TASK-049 - Graph-Directed Plugin Navigation

*   **Status**: Staging QA
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Plugin Navigation
*   **Scope**: Add one read-only MCP context tool that refreshes the derived Level 1 graph, returns a capped task-specific packet, directs agents to authoritative sources, and falls back safely when graph context is unhealthy or insufficient.
*   **Out of Scope**: Replacing normalized records, semantic graph extraction, hosted storage, automatic transcript capture, plugin publication, release, merge, deployment, or consumer-project installation.
*   **Approval**: approved in conversation after TASK-048's final controlled comparison.
*   **Definition of Done**: Root/package behavior agrees; unknown, stale, unsafe, and insufficient graph context cannot create inferred authority; active skills and harness guidance use graph-first targeted reading with explicit fallback.
*   **Affected Screens / Locks**: `tools/fb-project-graph*`, `tools/fb-lane.cjs`, `docs/fb/graph.md`, active skills, package manifest and generated mirrors.
*   **Links & Deliverables**: [Handoff](docs/handoffs/TASK-049.md); [TASK-048 evidence](docs/experiments/TASK-048-graduated-project-graph-pilot.md).
*   **Latest Update**: *2026-07-26*: Root graph contracts 19/19, packaged context 5/5, CLI 70/70, eval/bootstrap 18/18, metadata, 44-mirror parity, synchronizer 10/10, syntax, whitespace, and Codex plugin validation passed. Changelog and QA closeout recorded. Local candidate is Ready to ship; release remains separate.

---

### TASK-048 - FB Graduated Project Graph

*   **Status**: Staging QA (controlled graph-first benefit demonstrated)
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Project Navigation
*   **Scope**: Design a graduated project graph derived from normalized FB records, with deterministic Level 1 navigation, evidence-gated semantic expansion, safe fallback, privacy boundaries, measurement, and future plugin integration.
*   **Out of Scope**: Implementation before written-spec review, hosted services, graph databases, automatic commit hooks, transcript capture, cross-project export, release, publication, merge, deployment, or consumer-repository mutation.
*   **Goal Alignment Session**:
    *   **Objective**: Reduce repeated context reconstruction while preserving FB's existing Loop Engineering authority and normalized evidence model.
    *   **Key Results**: The graph remains derived; new projects start cheaply; deeper mapping requires demonstrated retrieval friction; graph failure never blocks normal FB; pilot cost and navigation benefit are measured.
*   **Definition of Done**: Visible new/growing/fallback examples and a pre-registered navigation comparison produce an evidence-backed stop, revise, or plugin-integration recommendation.
*   **Gate / Review Point**: Focused local pilot review only.
*   **Approval**: design, inline prototype, and focused pilot approved in conversation.
    *   **Justification**: James explicitly chose the graduated graph approach after distinguishing FB's loops from the graph that maps them.
*   **Affected Screens / Locks**: `tools/fb-project-graph*`, `.fb/graph/`, `docs/experiments/TASK-048-graduated-project-graph-pilot.md`, `docs/qa/TASK-048.md`, TASK-048 coordination records.
*   **Links & Deliverables**: [Handoff](docs/handoffs/TASK-048.md); [Design](docs/superpowers/specs/2026-07-26-fb-graduated-project-graph-design.md); [Plan](docs/superpowers/plans/2026-07-26-fb-graduated-project-graph-pilot.md); branch `codex/fb-graduated-project-graph`.
*   **Latest Update**: *2026-07-26*: The deterministic comparison reduced ongoing navigation bytes 66.9% and repeated reads 73.7% without correctness loss. Six real concurrent Codex tasks remained 6/6 correct, but the corrected graph arm used 2.5% more gross input tokens and 12.3% more wall time. Result: promising but inconclusive. The one-repair circuit breaker is reached; plugin integration requires a separate Product decision.
*   **Latest Decision**: *2026-07-26*: James approved one final, separately preregistered graph-first experiment. Both arms will run from equal isolated snapshots; the graph packet replaces broad orientation and is capped to question-specific cited sources.
*   **Final Result**: *2026-07-26*: Both six-worker arms were 6/6 correct. Minimal graph-first routing reduced uncached input tokens 33.9%, tool-output orientation characters 54.6%, and concurrent wall time 27.3%. All graph workers used targeted cited sources; none used the broad board/index route. Controlled benefit demonstrated; plugin integration remains a separate Product decision.

---

### TASK-047 - Durable Efficiency and Evidence Normalization

*   **Status**: Staging QA (focused local gate passed)
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Harness Efficiency
*   **Scope**: Add prospective normalized-record ownership, deterministic consistency and verification-reuse checks, risk-triggered review, event-driven health checks, compact closeout, privacy-safe QA artifacts, and local efficiency measurement.
*   **Out of Scope**: Historical retrofit, semantic automatic judgment, hosted monitoring, transcript capture, external telemetry, release checkpoint, push, merge, publication, or deployment.
*   **Goal Alignment Session**:
    *   **Objective**: Reduce FB coordination overhead without weakening evidence, cross-lane risk detection, or release safety.
    *   **Key Results**: One authoritative home per fact; stale verification invalidates deterministically; light work avoids broad review and repeated health checks; root/package guidance stays mechanically aligned.
    *   **Definition of Done**: Focused normalized-record and bootstrap contracts, doctor integration, package parity, affected syntax, links, and whitespace pass with a compact QA artifact.
    *   **Gate / Review Point**: Local focused verification only; no release checkpoint or external action.
    *   **Approval**: approved
    *   **Justification**: James approved the normalized-evidence plan and explicitly requested implementation.
*   **Affected Screens / Locks**: `tools/fb-records.*`, `tools/fb-lane.cjs`, package manifest/mirrors, canonical harness, Product/BFM/coordination/setup/workstream skills, normalized templates, TASK-047 records.
*   **Links & Deliverables**: [Handoff](docs/handoffs/TASK-047.md); [Pilot](docs/experiments/TASK-047-real-task-pilot.md); [Plan](docs/superpowers/plans/2026-07-23-fb-durable-efficiency-evidence-normalization.md); [QA](docs/qa/TASK-047.md); branch `codex/fb-durable-efficiency-evidence`.
*   **QA Checklist**:
    *   [x] Focused normalized-record contract observed RED before implementation and now passes in root and package contexts.
    *   [x] Existing CLI/bootstrap contract passes 70 checks.
    *   [x] Final package parity, doctor, syntax, links, and whitespace evidence is recorded after closeout updates.
*   **Latest Update**: *2026-07-23*: GitHub readiness exposed one stale fallback-bootstrap fixture after the local focused gate. The fixture now includes `fb-records.cjs` and the eighth harness page; the focused eval contract passes 18/18. PR #49 remains draft and no merge, release, marketplace, install, or deployment action is authorized.

---

### TASK-031 - Full BFM Changelog Closeout and FB 0.3.1-beta Release
*   **Status**: In Progress (release checkpoint at coordination correction)
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Closeout + Codex Plugin Release
*   **Scope**: Require a candidate-bound changelog decision before v3 Full BFM can close, submit, reuse verification, or pass a release checkpoint; rebuild active plugin surfaces as `0.3.1-beta+codex.20260718021942`.
*   **Out of Scope**: Historical retrofit, identifier migration, merge, marketplace publication, reinstall, or deployment before Push Live.
*   **Goal Alignment Session**:
    *   **Objective**: Keep FB release history clear to users without adding changelog noise to Quick BFM or ordinary Codex work.
    *   **Key Results**: New v3 Full BFM handoffs record matching Build Brief and Task Receipt decisions; required entries resolve and contain four user-facing fields; not-required reasons are concrete and agree; historical v2, Quick, and Normal work remain compatible; active plugin surfaces agree on `0.3.1-beta+codex.20260718021942`.
    *   **Definition of Done**: Focused root/package closeout, efficiency, session, metadata, fallback, parity, syntax, and whitespace checks pass; the single release checkpoint reaches a clean doctor result; PR #48 is prepared at Ready to ship without consuming Push Live.
    *   **Gate / Review Point**: Stop at Ready to ship. Only Push Live authorizes merge, GitHub marketplace upgrade, reinstall, and public installed-plugin verification.
    *   **Approval**: approved
    *   **Justification**: James explicitly approved the Full BFM changelog closeout and FB 0.3.1-beta release plan, including the separate Push Live boundary.
*   **Affected Screens / Locks**: Closeout/session/runtime contracts, canonical/package docs and skills, fallback installation, release metadata, and TASK-031 coordination records.
*   **Links & Deliverables**: [Handoff](docs/handoffs/TASK-031.md); [PR #48](https://github.com/friedbeef1/fb-lane-coordination/pull/48); release build `0.3.1-beta+codex.20260718021942`.
*   **Latest Update**: *2026-07-18*: The initial release validator exposed the manual fallback omission. Repair `1c17435` added `fb-changelog-closeout.cjs` to the documented archive fallback and its executable root/package regression. The final validator then reached doctor, which correctly found this detailed board OKR record missing. This coordination-only correction copies the already-approved goal record; no local validator pass is claimed and the full validator is not rerun in this correction.

---

### TASK-030 - FB 0.3.0-beta Plugin Release
*   **Status**: Done (released and installed)
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Codex Plugin Release
*   **Scope**: Rebuild and release the existing GitHub marketplace plugin as `0.3.0-beta+codex.20260717150502`, with six-workstream metadata, prompts, generated mirrors, current diagrams, and verified bundled MCP resolution.
*   **Out of Scope**: Identifier migration, non-Codex integrations, consumer-repository mutation, hosted telemetry, or publication outside the existing GitHub marketplace.
*   **Goal Alignment Session**:
    *   **Objective**: Make the latest six-workstream FB system installable and usable through the existing GitHub Codex marketplace.
    *   **Key Results**: Both manifests and active release records agree on the exact build; packaged prompts and skills cover all six workstreams and the `$bfm`/Ready-to-ship/Push-Live flow; generated mirrors agree; the plugin installs in an isolated Codex home; the bundled MCP route resolves; GitHub readiness passes.
    *   **Definition of Done**: PR #44 is merged to `main`, marketplace upgrade and reinstall report `0.3.0-beta+codex.20260717150502` installed and enabled, and TASK-030 records the release evidence.
    *   **Gate / Review Point**: Passed. Push Live was approved, GitHub readiness passed, and public install verification succeeded.
    *   **Approval**: approved
    *   **Justification**: James approved the 0.3.0-beta release plan and explicitly authorized Push Live.
*   **Affected Screens / Locks**: Plugin manifests, marketplace copy, package mirrors, active release docs/tests, and TASK-030 coordination records.
*   **Links & Deliverables**: [Handoff](docs/handoffs/TASK-030.md); [plan](docs/superpowers/plans/2026-07-17-fb-0.3.0-beta-release.md); [PR #44](https://github.com/friedbeef1/fb-lane-coordination/pull/44).
*   **Latest Update**: *2026-07-17*: PR #44 merged as `7e122ae`; the GitHub marketplace upgraded and Codex installed/enabled `0.3.0-beta+codex.20260717150502`; six skills, MCP route, server syntax, and current diagrams passed installed-cache proof.

---

### TASK-029 - FB Six-Workstream Loop
*   **Status**: Staging QA (Ready to ship; GitHub release gate active)
*   **Owner / Thread**: FB-Product / BFM + six workstreams
*   **Area**: Product Model
*   **Scope**: Expand FB to Product/User, Business, Design, Tech, Discovery, and Bugs; make `$bfm` reconcile all six ready-handoff sources; align runtime, plugin skills, bootstrap, public documentation, generated mirrors, and focused contracts.
*   **Out of Scope**: Transcript capture, automatic chat discovery, mandatory six-way approval, marketplace publication, consumer migration, or release without explicit Push Live.
*   **Goal Alignment Session**:
    *   **Objective**: Make FB understandable and operable as one continuous product-delivery loop that reduces the user's manual coordination across six distinct workstreams.
    *   **Key Results**: All six workstreams are accepted by runtime, sessions, handoffs, bootstrap, and skills; `$bfm` selects only valid ready handoffs in canonical order; blocked and None relevant dispositions remain visible; public guidance explains one workflow from chat to handoff to BFM to Ready to ship to Push Live; low-risk execution follows the low-ceremony rule.
    *   **Definition of Done**: Root/package six-workstream runtime and skill contracts pass, 25 generated mirrors agree, the release validator reports Ready, and GitHub's required check passes before merge.
    *   **Gate / Review Point**: Push Live was approved; merge remains blocked until the required GitHub validator passes. Marketplace publication remains separate.
    *   **Approval**: approved
    *   **Justification**: James supplied and approved the six-workstream implementation plan and separately approved the release/test-contract and missing-OKR corrections.
*   **Affected Screens / Locks**: Runtime/session/CLI/MCP, bootstrap, skills, canonical/package docs/tests, and TASK-029 coordination records.
*   **Links & Deliverables**: [Handoff](docs/handoffs/TASK-029.md); [plan](docs/superpowers/plans/2026-07-17-fb-six-workstream-loop.md); [PR #43](https://github.com/friedbeef1/fb-lane-coordination/pull/43).

---

### TASK-028 - FB Efficiency Correction
*   **Status**: Staging QA (local candidate; no release checkpoint requested)
*   **Owner / Thread**: FB-Product / BFM + FB-Tech execution
*   **Area**: Harness Efficiency
*   **Scope**: Implement the approved three-mode router, one-record Quick flow, proportional verification and resource budgets, progress-delta gate, efficiency circuit breaker, minimal worker context, canonical package generation, structural documentation contracts, and repository-local Efficiency Receipt.
*   **Out of Scope**: Dashboard, hosted telemetry, transcript capture, autonomous judge, public command or identifier change, release, publication, deployment, install, consumer migration, push, PR, merge, or origin reconciliation.
*   **Goal Alignment Session**:
    *   **Objective**: Reduce user wait, tool calls, repeated checks, review loops, and token use for low-risk work without weakening sensitive-action or release gates.
    *   **Key Results**: Normal Codex creates no FB ceremony; Quick BFM creates one Quick Record and one review/closeout path; Full BFM retains safety; focused checks are default; sensitive triggers retain immediate safety/approval gates; a full validator is eligible only for an explicit Product-owned release checkpoint; resource, progress, context, and loop budgets stop waste; package mirrors are generated; local efficiency metrics are recorded.
*   **Definition of Done**: Approved acceptance criteria pass in focused root/package tests, mirrors are generated and current, and the branch remains local. A release checkpoint, validator, and final release approval are separate Product-owned gates when explicitly requested.
    *   **Gate / Review Point**: Local Product review only. All external actions remain closed.
    *   **Approval**: approved
    *   **Justification**: James approved the written efficiency design and explicitly asked for execution.
*   **Affected Screens / Locks**: Canonical/package CLI and session modules/tests; new efficiency/package-sync modules, tests, and manifest; validator; canonical harness/applicable skills; TASK-028 coordination records.
*   **Links & Deliverables**: [Spec](docs/superpowers/specs/2026-07-17-fb-efficiency-correction-design.md); [Plan](docs/superpowers/plans/2026-07-17-fb-efficiency-correction.md); [Handoff](docs/handoffs/TASK-028.md); branch `codex/fb-beginner-clarity`.
*   **QA Checklist**:
    *   [x] Mode, Quick Record, verification-budget, circuit-breaker, generator, structural-doc, and receipt contracts pass in focused root/package checks.
    *   [x] Root/package runtime behavior and generated surfaces align; package-sync checks 22 generated mirrors.
    *   [x] Local candidate `284e465` is retained for Staging QA with no release checkpoint requested; its obsolete blocked-validator debt is removed.
    *   [ ] Product may explicitly request a release checkpoint later; only then is a full validator eligible.
*   **Latest Update**: *2026-07-17*: Release-first revision replaces routine runtime-candidate full validation with focused checks, immediate safety gates, and Product-owned release checkpoints. System smoke is the default review contract. TASK-028 is a local Staging QA candidate at `284e465`; no release checkpoint, broad validator, review repetition, or external action is requested.

---

### TASK-027 - Complete the FB Product Story
*   **Status**: Staging QA (candidate repair complete only after full local gate; Product re-review pending)
*   **Owner / Thread**: FB-Product / BFM + FB-Business and FB-Design guidance
*   **Area**: Product Positioning
*   **Scope**: Extend the existing Why FB page and focused contract with the real TASK-026 two-speed pain points, implemented responses, updated delivery loop, and corrective-patch example.
*   **Out of Scope**: Runtime, command, package identifier, release, publication, deployment, push, merge, or origin/main reconciliation.
*   **Goal Alignment Session**:
    *   **Objective**: Explain how FB turns real coordination friction into a faster, safer product-delivery loop without overstating its relationship to Codex or Kurrent Capacitor.
    *   **Key Results**: TASK-026 evidence is mapped to five implemented responses; Quick and Full BFM plus verification reuse and safe fallback appear in the rendered loop; four examples and official product links are enforced in both mirrors.
    *   **Definition of Done**: Focused root/package positioning tests, byte parity, evidence-link and Mermaid checks, CLI/session/eval/beginner/two-speed suites, validator, doctor Ready, whitespace, and independent review pass.
    *   **Gate / Review Point**: Keep the branch local and review-ready; reconciliation, push, PR, merge, release, and publication remain separate.
    *   **Approval**: approved
    *   **Justification**: James explicitly requested implementation of the Complete the FB Product Story plan.
*   **Affected Screens / Locks**: Canonical/package Why FB page, root/package positioning tests, and TASK-027 coordination records.
*   **Links & Deliverables**: [Plan](docs/superpowers/plans/2026-07-17-complete-fb-product-story.md); [Handoff](docs/handoffs/TASK-027.md); branch `codex/fb-beginner-clarity`.
*   **QA Checklist**:
    *   [x] The evidence-target regression failed in both distribution contexts before the mirrored link/artifact repair, then passed.
    *   [x] Canonical/package comparison, positioning-test, and TASK-026 evidence mirrors are byte-identical; each delivered page resolves `evidence/TASK-026-two-speed.md` in its own filesystem context.
    *   [x] Root/package CLI 70/70, session 32/32, eval 18/18, beginner 10/10, positioning and two-speed suites, page/test/evidence parity, link resolution, syntax, whitespace, clean-tree validator, and standalone doctor passed.
    *   [ ] Product re-review accepts the repaired whole slice.
*   **Latest Update**: *2026-07-17*: Final review found a stale current-task pointer, a non-portable TASK-026 evidence link, and overstated review closeout. The focused RED/GREEN, all requested root/package suites, mirror parity, evidence-target checks, whitespace, clean-tree validator, and standalone doctor passed after the one focused repair commit. Product re-review remains pending. Reconciliation, fetch, push, PR, merge, publication, release, deployment, install, runtime changes, and identifier changes remain unauthorized.

---

### TASK-026 - BFM Two-Speed Efficiency
*   **Status**: Staging QA (local Product review only)
*   **Owner / Thread**: FB-Product / BFM + FB-Tech execution
*   **Area**: BFM Efficiency
*   **Scope**: Amend existing session-ledger, claim/worktree, status, submit, and guidance seams with the approved two-speed efficiency contract.
*   **Out of Scope**: New commands/statuses, global Node pin, dashboard, runner, provider/deploy behavior, MirrorCam source, release, publication, install, deployment, or merge.
*   **Goal Alignment Session**:
    *   **Objective**: Make long Product/BFM runs faster to resume and harder to mis-route without weakening safety or evidence.
    *   **Key Results**: Matching worktrees are reused; nested worktrees are prevented; ambiguous work classifies Full; queue fields are explicit; docs-only closeout reuses proven runtime evidence; project preflight failure is actionable.
    *   **Definition of Done**: All six supplied acceptance checks, root/package parity, full validator, doctor Ready, and whitespace pass.
    *   **Gate / Review Point**: Local Product review only; release, publication, deployment, merge, plugin install, and consumer-project changes remain separate.
    *   **Approval**: approved
    *   **Justification**: James supplied the MirrorCam-approved handoff and asked upstream FB to act on it.
*   **Affected Screens / Locks**: Mirrored CLI/session modules and tests, canonical/package workflow/session/guardrail/BFM guidance, board/handoff/index/current-task/Product card.
*   **Links & Deliverables**: [Plan](docs/superpowers/plans/2026-07-17-bfm-two-speed-efficiency.md); [Handoff](docs/handoffs/TASK-026.md); branch `codex/fb-beginner-clarity`.
*   **QA Checklist**:
    *   [x] Quick/Full, worktree, queue, proportional-verification, and preflight acceptance checks pass.
    *   [x] Root/package sources, tests, and guidance remain aligned.
    *   [x] Full validator, doctor Ready, and whitespace pass.
*   **Latest Update**: *2026-07-17*: Candidate `a6b00ab` passed CLI 70/70, session 32/32, eval 18/18, beginner 10/10, root/package positioning and two-speed contracts, full validator, doctor Ready, source/test/doc parity, syntax, and whitespace. The MirrorCam Node pin remains project-only evidence; no external action is authorized.

---

### TASK-025 - FB Product Positioning and Comparison
*   **Status**: Staging QA (local Product review only)
*   **Owner / Thread**: FB-Product / BFM + FB-Business and FB-Design guidance
*   **Area**: Product Positioning
*   **Scope**: Publish an honest Codex/Capacitor/FB comparison, rendered diagrams, evidence-backed pain-point mapping, and concrete examples with root/package parity.
*   **Out of Scope**: Runtime behavior, external integrations, telemetry, transcript capture, hosted storage, autonomous evaluation, release, publication, deployment, merge, or consumer-repository changes.
*   **Goal Alignment Session**:
    *   **Objective**: Help everyday users understand when vanilla Codex, Kurrent Capacitor, and FB are useful without hiding their overlap.
    *   **Key Results**: The canonical comparison states the approved three-system emphasis; every pain point links to existing user-feedback or eval evidence; root/package mirrors and focused tests pass.
    *   **Definition of Done**: Two rendered Mermaid diagrams, three concrete examples, concise entry-point links, focused contract, validator, doctor Ready, parity, wording, and whitespace checks pass.
    *   **Gate / Review Point**: Local Product review only; release, publication, deployment, merge, plugin install, and consumer-project changes remain separate and unauthorized.
    *   **Approval**: approved
    *   **Justification**: James explicitly supplied the positioning, honest-comparison rules, concrete example, and real-pain-point requirement.
*   **Affected Screens / Locks**: Canonical/package comparison page, root/package public and harness README routers, FAQ, focused test/validator, board/handoff/index/current-task/Product card.
*   **Links & Deliverables**: [Plan](docs/superpowers/plans/2026-07-17-fb-product-positioning.md); [Handoff](docs/handoffs/TASK-025.md); branch `codex/fb-beginner-clarity`.
*   **QA Checklist**:
    *   [x] Focused positioning contract passes after observed red state.
    *   [x] All pain points cite existing user-feedback or eval evidence.
    *   [x] Root/package page and test mirrors are byte-identical.
    *   [x] Validator, doctor, wording, and whitespace checks pass.
*   **Latest Update**: *2026-07-17*: Candidate `3af1f17` plus board repair `53b387e` passed the focused root/package positioning contract, CLI 70/70, session 31/31, eval 18/18, beginner 10/10, full validator, doctor Ready, mirror parity, and whitespace. No release, publication, deployment, merge, plugin install, or consumer-project change is authorized.

---

### TASK-024 - FB Beginner Clarity and Status Layer
*   **Status**: Staging QA (local Product review passed; release remains separate)
*   **Owner / Thread**: FB-Product / BFM + FB-Tech execution
*   **Area**: Beginner Experience
*   **Scope**: Make ordinary-task mode, coordinated planning, BFM execution, status, pauses, next actions, and review instructions understandable to everyday non-technical users while preserving the technical coordination engine.
*   **Out of Scope**: Popup, wizard, dashboard, persistent tutorial, technical identifier or board-enum migration, autonomous judging, release, publication, deployment, merge, plugin install, or consumer-repository change.
*   **Goal Alignment Session**:
    *   **Objective**: Let an everyday user understand what FB is doing now, why it paused, what they need to do, and what happens next without reading internal coordination terminology.
    *   **Key Results**:
        *   Simple work, coordinated planning, and approved BFM execution have distinct plain-language entry messages and examples.
        *   CLI/MCP status defaults to a beginner card with objective, stage, progress, pause, next owner/action, and review link while technical details remain opt-in.
        *   Approval waits and genuine blockers use one visible pause contract, and three shadow evals preserve the feedback as regression scenarios.
    *   **Definition of Done**: Tiny-task, creator-commerce, and approved-BFM walkthroughs; status-stage fixtures; pause/recovery fixtures; root/package parity; complete CLI/session/eval/recovery/validator/doctor/whitespace gate; task and whole-branch independent reviews pass.
    *   **Gate / Review Point**: Stop after the local candidate passes Product review. Version bump, merge, marketplace install, release, publication, deployment, and consumer migration require separate explicit approval.
    *   **Approval**: approved
    *   **Justification**: James approved the beginner-clarity plan after the current candidate was audited against older user feedback.
*   **Affected Screens / Locks**:
    *   **Screens**: Codex plugin first replies, status responses, pause/recovery updates, generated project guidance, public documentation, and manual eval scenarios.
    *   **Locked Files**: canonical/package harness pages, public docs, root/package coordination/Product/BFM/setup skills, mirrored CLI/MCP sources and tests, bootstrap examples/templates, shadow eval records, `PROJECT_BOARD.md`, `docs/handoffs/index.md`, `docs/handoffs/TASK-024.md`, `.codex/current_task.md`, and `docs/workstreams/fb-product.md`.
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/fb-beginner-clarity` (isolated local worktree; no PR or release action authorized)
    *   **Plan**: [FB beginner clarity and status layer](docs/superpowers/plans/2026-07-17-fb-beginner-clarity-and-status-layer.md)
    *   **Handoff**: [TASK-024](docs/handoffs/TASK-024.md)
*   **QA Checklist**:
    *   [x] Beginner contract and BFM terminology are aligned across active root/package/bootstrap surfaces.
    *   [x] CLI and MCP status card fixtures pass, including details-mode parity, worktree-safe task resolution, and linked-handoff review evidence.
    *   [x] Pause-card and exactly three shadow eval scenarios pass the focused walkthroughs.
    *   [x] Full local gate and independent task/whole-branch reviews pass.
*   **Latest Update**:
    *   *2026-07-17*: Candidate `cc13389` passed root/package CLI 70/70, session 31/31, eval 18/18, beginner 10/10, recovery, validator, doctor Ready, syntax/parity, committed-diff whitespace, all task reviews, and final whole-branch re-review with no Critical, Important, or Minor finding. Product accepted the local candidate in Staging QA. No eval authority changed and no push, merge, marketplace install, publication, deployment, release, or consumer migration is authorized.
    *   *2026-07-17*: Product/BFM claimed the approved task on the isolated branch. Baseline root/package CLI suites passed 45/45. Release and all external-action gates remain closed.

---

### TASK-022 - Repository-Local Session Ledger
*   **Status**: Staging QA (local Product review only)
*   **Owner / Thread**: FB-Product / BFM + FB-Tech execution
*   **Area**: FB Session Harness
*   **Scope**: Add the approved repository-local session command family, atomic shared live registry, durable session recaps, Task Receipts, Brief Validation, structured failure evidence, deterministic recall/review, default execution worktrees, submit/doctor enforcement, and root/package/bootstrap parity.
*   **Out of Scope**: Transcript capture, hosted storage, external providers, dashboards, autonomous judging, release, publication, deployment, merge, or consumer-repository changes.
*   **Goal Alignment Session**:
    *   **Objective**: Let every durable Codex task resume and close from repository truth without requiring James to reconstruct decisions, state, tests, or recovery history.
    *   **Key Results**:
        *   All seven session commands behave identically in root and packaged CLIs and remain safe under twelve concurrent sessions.
        *   Completed reviewable work cannot close without a passing Brief Validation, complete Task Receipt, verification checkpoint, Verification Handoff, and Test This Now evidence.
        *   Fresh and existing-project bootstrap safely inherit the six-page harness while preserving project-owned instructions.
    *   **Definition of Done**: Focused session tests, root/package suites, concurrency and local-bare-remote smokes, syntax/parity, validator, doctor, whitespace, creator-commerce/migration smokes, and independent review pass.
    *   **Gate / Review Point**: TASK-023 may begin only after the TASK-022 local gate and task review pass. No release, publication, deployment, merge, or consumer migration is authorized.
    *   **Approval**: approved
    *   **Justification**: James explicitly requested implementation of the full session-ledger plan and chose automatic non-default-branch checkpoint pushes and linked-worktree execution.
*   **Affected Screens / Locks**:
    *   **Screens**: Codex CLI/session coordination, generated harness guidance, handoff closeout evidence, and setup/doctor output.
    *   **Locked Files**: `tools/fb-session.cjs`, `plugins/fb-lane-coordination/tools/fb-session.cjs`, focused session tests and mirrored CLI tests, `tools/fb-lane.cjs`, packaged CLI mirror, `docs/fb/sessions.md`, packaged harness mirror, `docs/sessions/**`, relevant skills/templates/setup docs, `PROJECT_BOARD.md`, `docs/handoffs/index.md`, `docs/handoffs/TASK-022.md`, `.codex/current_task.md`, and `docs/workstreams/fb-product.md`.
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/fb-session-ledger` (isolated local worktree; no PR yet)
    *   **Plan**: [FB Session Ledger and Eval Loop](docs/superpowers/plans/2026-07-16-fb-session-ledger-and-eval-loop.md)
    *   **Handoff**: [TASK-022](docs/handoffs/TASK-022.md)
*   **QA Checklist**:
    *   [x] Session command, validation, concurrency, recall, review, checkpoint-push, and closeout fixtures pass.
    *   [x] Root/package behavior, source, test, and six-page harness parity pass.
    *   [x] Validator, doctor, bootstrap smokes, syntax, whitespace, and final combined review pass.
*   **Latest Update**:
    *   *2026-07-17*: Final combined TASK-022/TASK-023 review approved the complete 21-commit package with no Critical, Important, or Minor issue. Fresh verification passed CLI 45/45, root/package session 31/31, root/package eval 18/18, recovery, doctor Ready, parity, and committed-diff checks. The branch remains local Staging QA; all external-action gates remain closed.
    *   *2026-07-17*: Final submit lifecycle repair `f94dce9` wraps CLI and MCP final `assertSubmitReady`, board mutation/commit, and push in the same per-session transaction as checkpoint/close/review. Deterministic submit-versus-close, submit-versus-blocking-checkpoint, and close-wins-first regressions pass for both routes; unrelated sessions retain independent locks. Root/package session suites pass 31/31 and the complete clean gate passes. External-action boundaries are unchanged.
    *   *2026-07-17*: Final integrated TASK-022/TASK-023 repair `fe733a1` added a clone-wide per-session mutation boundary across checkpoint, close, and review state changes; deterministic two-checkpoint and checkpoint-versus-close regressions; non-actionable generated closeout placeholders; and MCP claim parity with the CLI linked-worktree path. Root/package session suites pass 28/28, recovery passes, and the complete clean gate passes. Staging QA and external-action boundaries are unchanged.
    *   *2026-07-17*: Product accepted TASK-023 after final independent re-review found no remaining Critical, Important, or Minor issue. The exact no-change approval boundary and Quality Gap privacy repair at `fe4c62e`, durable evidence at `d2bd03c`, root/package eval 18/18, session 24/24, legacy CLI 45/45, doctor Ready, and `TASK_023_THIRD_REPAIR_FULL_GATE_OK` form the accepted local candidate. No eval changed authority and no external action is authorized.
    *   *2026-07-17*: Product accepted TASK-022 after final independent re-review found no remaining Critical, Important, or Minor issue. Commits `9a55314`, `a5b0a7e`, `38710ca`, and `acdd1a6` plus `TASK_022_SECOND_REPAIR_FULL_GATE_OK` form the verified base; TASK-023 dependency is cleared.
    *   *2026-07-17*: Second review repair completed regression-first: CLI/MCP submit now revalidates after hooks/tests at the mutation boundary, completed execution close revalidates current authority, every Failure block validates independently, and legitimate lowercase `example` prose remains valid while numbered placeholders fail. Mirrored focused suites pass 23/23 and the complete gate passed with `TASK_022_SECOND_REPAIR_FULL_GATE_OK`; TASK-023 remains blocked pending Product acceptance.
    *   *2026-07-17*: Critical/Important review repairs completed with strict regression-first evidence. Mirrored focused suites now pass 19/19, mirrored legacy suites pass 45/45, and the clean-copy repair gate passed recovery, syntax/parity, validator, doctor Ready, whitespace, creator-commerce bootstrap, and existing-project migration with `TASK_022_REPAIR_FULL_GATE_OK`. TASK-023 remains blocked pending Product acceptance.
    *   *2026-07-16*: Implementation commit `9a55314` passed mirrored 45/45 CLI suites, mirrored 15/15 session suites, recovery, syntax/parity, validator, doctor Ready, scoped whitespace, creator-commerce bootstrap, existing-project migration, and self-review. Moved to local Staging QA; TASK-023 remains blocked pending Product task review.
    *   *2026-07-16*: Approved plan claimed on `codex/fb-session-ledger` after clean 45-check root/package baselines, recovery contract, syntax, and doctor Ready. TASK-023 remains dependency-blocked.

---

### TASK-023 - Markdown Eval Loop
*   **Status**: Staging QA (local review only; no release action)
*   **Owner / Thread**: FB-Product / BFM + FB-Tech execution
*   **Area**: FB Eval Harness
*   **Scope**: Add the approved Markdown-first harness/product eval lifecycle, authority levels, failure classification, Quality Gap revision loop, regression closure, initial harness catalog, reusable product-quality categories, and deterministic structural checks.
*   **Out of Scope**: Autonomous judges, semantic scoring, dashboards, numeric scores, CI eval jobs, hosted capture, automatic promotion, blocking promotion during this task, release, publication, deployment, merge, or consumer-repository changes.
*   **Goal Alignment Session**:
    *   **Objective**: Turn repeated harness and product-quality failures into evidence-backed improvement loops without silently expanding policy or weakening quality criteria.
    *   **Key Results**:
        *   Root/package harness and templates share one eval record and authority contract.
        *   Selected eval results flow through Build Brief, Verification Handoff, Test This Now, Task Receipt, and session closeout without running irrelevant evals.
        *   The two required harness/product walkthroughs prove revision, rerun, regression capture, and honest Checking behavior.
    *   **Definition of Done**: Eval lifecycle fixtures, both walkthroughs, root/package/template/bootstrap seven-page parity, validator, doctor, CLI suites, syntax, whitespace, and independent review pass.
    *   **Gate / Review Point**: Begin only from TASK-022's verified commit. No new eval is promoted to blocking; no external release action is authorized.
    *   **Approval**: approved
    *   **Justification**: James explicitly approved the consecutive-task sequence and the Markdown-first eval-loop plan.
*   **Affected Screens / Locks**:
    *   **Screens**: Build Brief selection, Verification Handoff, Test This Now, session closeout, eval records, and bootstrap guidance.
    *   **Locked Files**: `docs/fb/evals.md`, packaged harness mirror, `docs/evals/**`, template/package mirrors, relevant Product/BFM skills, bootstrap routes, validator/doctor and tests, `PROJECT_BOARD.md`, `docs/handoffs/index.md`, `docs/handoffs/TASK-023.md`, `.codex/current_task.md`, and `docs/workstreams/fb-product.md`.
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/fb-eval-loop`, stacked from the accepted TASK-022 commit; no PR yet
    *   **Plan**: [FB Session Ledger and Eval Loop](docs/superpowers/plans/2026-07-16-fb-session-ledger-and-eval-loop.md)
    *   **Handoff**: [TASK-023](docs/handoffs/TASK-023.md)
*   **QA Checklist**:
    *   [x] Authority, transition, failure, Quality Gap, regression, and session-integration fixtures pass.
    *   [x] Harness and creator-commerce product-quality walkthroughs pass.
    *   [x] Root/package/template/bootstrap seven-page parity and full local gate pass.
*   **Latest Update**:
    *   *2026-07-17*: Final combined TASK-022/TASK-023 review approved the complete 21-commit package with no Critical, Important, or Minor issue. Product Quality Gap, selected-anchor, authority, privacy, and submit-serialization repairs remain intact; both walkthrough evals remain shadow and all external-action gates remain closed.
    *   *2026-07-17*: Final integrated TASK-022/TASK-023 repair `fe733a1` requires complete private-safe Quality Gaps for open failed/blocked subjective Product Eval failures, applies the rule through selected session close/submit, and resolves each selected evidence reference through one exact explicit Markdown heading. Root/package eval suites pass 18/18, session suites pass 28/28, legacy CLI passes 45/45, selected closeout and recovery pass, doctor is Ready, and the complete clean gate passes. Both walkthrough evals remain shadow and no external action occurred.
    *   *2026-07-17*: Implementation commit `240b1b2` and selected-eval handoff commit `83ee9f0` passed root/package eval 13/13, session 23/23, legacy CLI 45/45, ten syntax checks, source/test/skill/template/seven-page parity, doctor Ready, whitespace, bootstrap preservation, and both required walkthroughs. No eval changed from shadow; independent Product review is the remaining local gate.
    *   *2026-07-17*: Review repair commit `3d44afc` closed all six findings regression-first: positive-only approval evidence, coherent blocking/mechanical closeout through a real session-close path, six-surface selected-record consistency, open/closed Quality Gap history, complete fallback copies, and explicit subjective/objective judgment. Root/package eval 15/15, session 24/24, legacy CLI 45/45, the clean complete gate, doctor Ready, mirror parity, and whitespace passed; independent Product re-review remains.
    *   *2026-07-17*: Second re-review repair commit `2b48f98` closed the three remaining findings regression-first: the exact fallback archive flow now bootstraps with all runtime/docs/template assets, one positive approval parser governs every approval context, and mixed closed/open Quality Gaps validate per record/file. Root/package eval 18/18, session 24/24, legacy CLI 45/45, and clean full gate `TASK_023_SECOND_REREVIEW_FULL_GATE_OK` passed; independent Product re-review remains.
    *   *2026-07-17*: Third repair commit `fe4c62e` closed two Important findings regression-first: no-change decisions now use one exact allowlisted sentence with no suffixes, and every Quality Gap field receives the record privacy/secret boundary. Root/package eval 18/18, session 24/24, legacy CLI 45/45, and clean full gate `TASK_023_THIRD_REPAIR_FULL_GATE_OK` passed; independent Product re-review remains.
    *   *2026-07-17*: TASK-022 passed its complete local gate and independent review with no remaining findings. Product/BFM cleared the dependency and claimed TASK-023 for test-first execution on `codex/fb-eval-loop`.

---

### TASK-021 - FB Harness Redesign
*   **Status**: Staging QA (local review only; no deployment)
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: FB Harness
*   **Scope**: Establish a compact, mirrored `docs/fb/` operational pack; reduce active entry points to navigation; safely add/update only marked FB route blocks during bootstrap; and make the existing validator/doctor enforce complete review evidence for opt-in harness-v2 reviewable handoffs.
*   **Out of Scope**: New CLI command, wizard, dashboard, eval runner, CI job, board-status replacement, release, deployment, publication, consumer-project changes, technical-ID migration, or wholesale existing-project rewrite.
*   **Goal Alignment Session**:
    *   **Objective**: Let an everyday user move from an idea to an approved build brief and testable evidence while FB carries routine coordination and QA work.
    *   **Key Results**:
        *   Root and packaged plugin share one small repository-local harness pack, and active entry points route into it instead of duplicating policy.
        *   Fresh bootstrap creates the pack; existing-project reruns preserve project-owned instructions and replace only explicit managed route blocks.
        *   New harness-v2 reviewable handoffs fail the existing closeout checks until their Test This Now packet is complete, while historical/planning handoffs remain valid.
    *   **Definition of Done**: Fresh and existing-project smokes prove the pack and idempotent routing; root/package tests, syntax/parity, validator, doctor, whitespace, and independent review pass without any release action.
    *   **Gate / Review Point**: Product branch-diff review after all local verification. No push, publication, plugin install, release, deployment, or merge is authorized.
    *   **Approval**: approved
    *   **Justification**: James explicitly approved the FB Harness Redesign after first-project feedback showed duplicated instructions and manual test coordination were creating avoidable friction.
*   **Affected Screens / Locks**:
    *   **Screens**: Codex plugin onboarding, generated repository guidance, durable handoffs, user review packets, and active documentation only.
    *   **Locked Files**: `AGENTS.md`, `templates/AGENTS.md`, `README.md`, `FAQ.md`, `docs/loop-engineering.md`, `platforms/codex/README.md`, `plugins/fb-lane-coordination/README.md`, relevant root/package skills, `docs/fb/**`, `plugins/fb-lane-coordination/docs/fb/**`, `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, root/package CLI tests, `PROJECT_BOARD.md`, `docs/handoffs/index.md`, `docs/handoffs/TASK-021.md`, and `docs/workstreams/fb-product.md`.
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/fb-documentation-rebrand` (existing isolated branch; local execution only)
    *   **Plan**: [FB Harness Redesign](docs/superpowers/plans/2026-07-16-fb-harness-redesign.md)
    *   **Handoff**: [TASK-021](docs/handoffs/TASK-021.md)
*   **QA Checklist**:
    *   [x] Canonical root/package harness packs and concise navigators are aligned.
    *   [x] Fresh and existing-project bootstrap routing is complete, safe, and idempotent.
    *   [x] Harness-v2 authoring guidance is canonical and complete; actionable-value enforcement rejects placeholder-only values, numbered `TODO`/`TBD` steps, angle-bracket prompts, and non-actionable blocked next actions without retrofitting old handoffs.
    *   [x] Focused v2 root/package suites pass 14 checks each; full root/package suites pass 45 checks each; syntax/parity, validator, doctor Ready, whitespace/diff, recovery contract, and standalone smokes pass.
    *   [x] Final whole-branch re-review found no remaining Critical, Important, or Minor issue after setup guidance, v2 authoring-contract, and placeholder-rejection fixes in `8c54c1c`.
    *   [ ] Product local gate and any separately authorized merge/release decision remain.
    *   [x] No push, publication, release, deployment, merge, or consumer-repository change occurred.
*   **Latest Update**:
    *   *2026-07-16*: Final fix `8c54c1c` aligned mirrored setup guidance with the completed five-page bootstrap, made the canonical evidence page author the complete opt-in v2 contract, and rejected placeholder-only/TODO/TBD/angle-bracket review values and blocked next actions. Focused v2 suites passed 14/14 in each mirror; full suites passed 45/45 in each mirror; recovery, four syntax checks, root/package source/test/setup/five-page parity, validator, doctor Ready, and diff checks passed. The final whole-branch re-review found no remaining Critical, Important, or Minor issue. TASK-021 remains in Staging QA for the local Product gate only; `Review state: not reviewable`; no push, publication, release, deployment, merge, plugin install, or consumer-repository change occurred.
    *   *2026-07-16*: Local integration verification passed: fresh creator-commerce and existing-project migration smokes; workspace-recovery contract; root/package 41-check suites; four Node syntax checks; root/package source, test, and five-page-pack parity; clean-clone validator; doctor Ready; and whitespace checks. Review state is `not reviewable` because this reusable harness/plugin change has no deployed UI. TASK-021 is in Staging QA for local Product branch-diff review only; merge and release remain separate Product gates.
    *   *2026-07-16*: Product/BFM claimed the approved harness redesign on the isolated branch. The existing first-project clarity contract remains in scope; source hierarchy, safe migration, and review-evidence enforcement are the new work. No external release action is authorized.

---

### TASK-020 - FB First-Project Clarity
*   **Status**: Staging QA (local review only; no deployment)
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Codex Plugin Onboarding
*   **Scope**: Make first-project guidance unmistakably explain that lanes plan, Product assembles and approves the build brief, and BFM builds only after explicit `$bfm` approval. Add decision/assumption separation, a plain-language progress card, distinct lane contributions, and a short user-facing `Test This Now` review packet with direct links and step-by-step criteria.
*   **Out of Scope**: New persistent wizard/state, new CLI commands, board/status-model replacement, changes to the four-lane or BFM ownership model, plugin publication, release, deployment, technical identifier migration, or consumer-repository changes.
*   **Goal Alignment Session**:
    *   **Objective**: Let a first-time everyday user understand what FB will produce now, what will be built later, what requires their approval, and exactly how to review a runnable result.
    *   **Key Results**:
        *   Plugin skills, active guides, and bootstrap output share one first-project and build-boundary contract.
        *   Every user-facing review request supplies a direct link, step-by-step test plan, pass criteria, known limits, and a failure-report format.
        *   Root and packaged tests prove generated guidance carries the contract and remains byte-aligned.
    *   **Definition of Done**: A fresh creator-commerce walkthrough unambiguously distinguishes plan, approval, build, verification, complete, and blocked states; selected lanes state their distinct contribution; root/package checks and documentation parity pass.
    *   **Gate / Review Point**: Product branch-diff review after root/package tests, syntax/parity, validator, doctor, whitespace, and fresh bootstrap smoke. No publication, release, or deployment is authorized.
    *   **Approval**: approved
    *   **Justification**: James approved the new-user clarity plan after feedback showed confusion about expected outputs, BFM/lane roles, assumptions, statuses, and test responsibilities.
*   **Affected Screens / Locks**:
    *   **Screens**: Codex plugin first-project prompts, generated project instructions, user-facing review handoffs, and active setup documentation.
    *   **Locked Files**: `README.md`, `FAQ.md`, `platforms/codex/README.md`, `docs/loop-engineering.md`, `plugins/fb-lane-coordination/README.md`, relevant root/package skills, `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, root/package CLI tests, `PROJECT_BOARD.md`, `docs/handoffs/index.md`, `docs/handoffs/TASK-020.md`, and `docs/workstreams/fb-product.md`.
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/fb-documentation-rebrand` (existing isolated branch; local only)
    *   **Plan**: [FB first-project clarity](docs/superpowers/plans/2026-07-16-fb-first-project-clarity.md)
    *   **Handoff**: [TASK-020](docs/handoffs/TASK-020.md)
*   **QA Checklist**:
    *   [x] First-project contract, How FB works card, exact progress states, lane contribution rule, and Test This Now packet are aligned across skills and active docs.
    *   [x] Bootstrap-generated `AGENTS.md` and `.codex/rules.md` carry the concise contract, including the four ordered How FB works steps and the explicit approval-before-`$bfm` boundary.
    *   [x] Fresh creator-commerce bootstrap smoke, root/package 28-check suites, syntax/parity, validator, doctor Ready, whitespace, and independent slice/final reviews passed.
    *   [x] No new command, publish, release, deployment, merge, or consumer-repository change occurred.
*   **Latest Update**:
    *   *2026-07-16*: Product/BFM claimed the approved first-project clarity implementation in the existing isolated branch. Work is local only; no publication, release, or deployment is authorized.
    *   *2026-07-16*: Implemented and independently reviewed the Project Start Brief, immediate four-step How FB works card, adaptive lane explanation, decision/assumption separation, exact user-facing progress and blocked states, Test This Now review packet, and explicit BFM build boundary. Fresh creator-commerce bootstrap smoke passed; root/package 28-check suites, syntax/parity, readiness validation, doctor Ready, whitespace, and final review passed. Branch remains local; no push, publication, release, deployment, or merge is authorized.

---

### TASK-019 - FB documentation rebrand
*   **Status**: Staging QA
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Documentation
*   **Scope**: Rebrand all active human-facing and agent-facing documentation, templates, examples, skills, and bootstrap-generated project entry points to `FB`. Use the approved primary tagline/current model line only on primary brand surfaces.
*   **Out of Scope**: Renaming `fb-lane` / `fb-lane-coordination` package IDs, plugin IDs, CLI commands, paths, MCP names, configuration keys, historical handoffs/plans/changelog entries, archived upstream material, publishing, release, or deployment.
*   **Goal Alignment Session**:
    *   **Objective**: Give everyday users one clear, consistent public name and value proposition without breaking the installed Codex integration or rewriting historical evidence.
    *   **Key Results**:
        *   Active documentation and generated project instructions show `FB` as the product name and the approved tagline on primary surfaces.
        *   Technical identifiers remain exactly compatible.
        *   Historical records keep their original wording and remain auditable.
    *   **Definition of Done**: Scoped wording audit, root/package parity, tests, validator, doctor, and whitespace checks pass; board, index, detailed handoff, and workstream card agree.
    *   **Gate / Review Point**: Product branch-diff review; no publication or deployment is authorized.
    *   **Approval**: approved
    *   **Justification**: James explicitly approved the public rebrand and chose to preserve history and technical identifiers.
*   **Affected Screens / Locks**:
    *   **Screens**: Public documentation, generated bootstrap docs, Codex plugin instructions, templates, examples, and agent skills only.
    *   **Locked Files**: Active Markdown guidance and templates, `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, related CLI tests, `PROJECT_BOARD.md`, `docs/handoffs/index.md`, `docs/handoffs/TASK-019.md`, and `docs/workstreams/fb-product.md`.
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/fb-documentation-rebrand` (local; no PR or publish authorized)
    *   **Plan**: [FB documentation rebrand](docs/superpowers/plans/2026-07-16-fb-documentation-rebrand.md)
    *   **Handoff**: [TASK-019](docs/handoffs/TASK-019.md)
*   **QA Checklist**:
    *   [x] Public docs, internal guidance, templates, examples, bootstrap output, and visible package metadata use the FB brand and preserve technical identifiers.
    *   [x] Slice reviews caught and resolved tagline-placement, technical-ledger, and exact-assertion issues.
    *   [x] Root/package 27-check CLI suites, syntax, CLI/test parity, JSON parsing, demo check, scoped audit, and whitespace checks passed.
    *   [x] Clean-worktree `node tools/fb-lane.validate.cjs`, `node tools/fb-lane.cjs doctor`, and demo `npm run check` passed.
    *   [x] Independent whole-branch review passed. The branch remains local; no push, publication, or deployment is authorized.
*   **Latest Update**:
    *   *2026-07-16*: Implemented the active-doc rebrand on `codex/fb-documentation-rebrand`. Product display copy is now FB; the tagline is limited to primary public/bootstrap surfaces; historical records and `fb-lane` technical identifiers are retained. Root/package 27-check suites, syntax/parity, scoped audit, JSON parse, demo check, clean-worktree validator, doctor Ready, whitespace checks, and whole-branch review passed; the branch remains local and unreleased.

---

### TASK-018 - Generic verification handoff and workspace recovery contract
*   **Status**: Done
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Coordination
*   **Scope**: Require a generic `## Verification Handoff` before Product/BFM asks a user to test. The handoff names the candidate, test-plan link, exact commands and environments, results, runnable evidence links, manual pass criteria, recovery attempted, and next Product/BFM recovery action. For repeated workspace instability, Product/BFM runs a bounded preflight for capacity (15 GiB free by default unless stricter policy applies), File Provider ancestry, stable reads, and bounded Git probes (15 seconds each); a second consecutive failure triggers clean-clone recovery without copying damaged Git/index/worktree metadata.
*   **Out of Scope**: New CLI commands, test runners, dashboards, CI/eval jobs, `doctor` expansion, plugin publication, deployment, or application changes in MirrorCam or another consumer repository.
*   **Goal Alignment Session**:
    *   **Objective**: Let future FB-Lane projects move from an approved task to review-ready evidence with the user supervising only real external gates.
    *   **Key Results**:
        *   Root templates, bootstrap output, packaged plugin skills, and public loop guidance carry one consistent Verification Handoff contract.
        *   Root and packaged CLI regression suites prove newly bootstrapped projects receive the contract.
        *   The contract distinguishes safe Product/BFM recovery from genuine user approval, device, account, or other external gates.
    *   **Definition of Done**: The focused workspace-recovery contract test, root/package suites, syntax, parity, clean-clone validator/doctor, and whitespace checks are recorded with current results; the board, index, detailed handoff, and Product workstream card agree; no publish or deploy occurs.
    *   **Gate / Review Point**: Product branch-diff review passed after verification. No publication, release, or merge to main is authorized.
    *   **Approval**: approved
    *   **Justification**: James asked for a generic FB-Lane harness that later projects such as MirrorCam can inherit, and explicitly required agents to run/recover routine verification rather than hand it to him.
*   **Affected Screens / Locks**:
    *   **Screens**: Bootstrap-generated coordination rules, bundled Codex skills, documentation, and verification handoffs only.
    *   **Locked Files**: `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, `tools/workspace-recovery-contract.test.cjs`, root/package CLI tests, `AGENTS.md`, `.codex/rules.md`, templates, root/package skills, scorecards, README/loop docs, `PROJECT_BOARD.md`, `docs/handoffs/index.md`, `docs/handoffs/TASK-018.md`, `docs/workstreams/fb-product.md`.
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/codex-only-cut`, released through [PR #39](https://github.com/friedbeef1/fb-lane-coordination/pull/39)
    *   **Plan**: [Verification Handoff contract](docs/superpowers/plans/2026-07-15-verification-handoff-contract.md)
    *   **Handoff**: [TASK-018](docs/handoffs/TASK-018.md)
*   **QA Checklist**:
    *   [x] Root and packaged CLI regression suites passed 27 checks each, including default/explicit Codex bootstrap contract coverage.
    *   [x] Focused workspace-recovery contract regression passed, including fresh Codex bootstrap output.
    *   [x] Root/package CLI parity and Node syntax checks passed.
    *   [x] Clean-clone `node tools/fb-lane.validate.cjs`, `node tools/fb-lane.cjs doctor`, and `git diff --check` passed.
    *   [x] Product branch-diff review passed; released through PR #39. No deployment or consumer-repository change occurred.
*   **Intentional Dirty State**: Clean at release closeout.
*   **Latest Update**:
    *   *2026-07-15*: Added the generic contract across root/package rules, generated bootstrap output, scorecards, public loop guidance, and Product/BFM skills. The regression first failed on the missing contract, then root/package suites passed 27 checks each. Clean-worktree syntax/parity, validator, doctor Ready, and whitespace checks passed at commit `a7dd3bc`; Product diff review remains the only gate.
    *   *2026-07-16*: Transferred the proven MirrorCam TASK-Q-0736 recovery lesson with explicit 15 GiB and 15-second defaults. Independent review found and cleared the initial missing-default gap; focused/root/package/clean-clone checks and Product branch-diff review passed.
    *   *2026-07-16*: Released with the Codex-only bundle in PR #39; `main` now carries the contract and the installed marketplace plugin reports `0.2.0-beta+codex.20260716052513`.

---

### TASK-CODEX-ONLY-001 - Codex-only FB-Lane cut
*   **Status**: Done
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Codex Plugin
*   **Scope**: Make Codex the only supported, shipped, documented, and tested FB-Lane integration. Disable Claude Code and Antigravity install, bootstrap, release, and validation paths; retain only concise contributor reference notes.
*   **Out of Scope**: Installation of paused integrations, any Claude Code or Antigravity validation, and changes to the FB-Lane coordination model itself.
*   **Goal Alignment Session**:
    *   **Objective**: Give users one honest, verified Codex installation path without implying support for integrations that are not maintained or tested.
    *   **Key Results**:
        *   Default and explicit Codex bootstrap produce only Codex artifacts.
        *   All non-Codex platform flags fail before writing files and point contributors to the paused-integration note.
        *   Only the Codex marketplace/plugin remains an active distribution surface.
        *   Root and packaged CLIs, docs, and MCP configuration agree on the Codex-only contract.
    *   **Definition of Done**: Root/package test and behavior parity pass, active docs contain no install or release claim for paused integrations, and the installed Codex plugin smoke passes from the published marketplace source.
    *   **Gate / Review Point**: Product review and live plugin publication are complete in PR #39.
    *   **Approval**: approved
    *   **Justification**: James approved a Codex-only support policy because the other integrations are not currently tested.
*   **QA Checklist**:
    *   [x] Root and packaged CLI suites passed 24 checks each in a clean checkout.
    *   [x] Root/package CLI and test files are byte-identical; both CLI syntax checks pass.
    *   [x] Validator and doctor pass from a clean checkout; `git diff --check` passes.
    *   [x] Temporary-`CODEX_HOME` local marketplace/plugin smoke installed and enabled `fb-lane-coordination@fb-lane` version `0.2.0-beta+codex.20260707114230`.
    *   [x] Plugin marketplace manifest, package manifests, and bundled MCP JSON parse locally.
    *   [x] Product reviewed the branch diff; PR #39 merged and the published plugin was installed from marketplace source.
*   **Latest Update**:
    *   *2026-07-13*: Approved, claimed on `codex/codex-only-cut`, and baseline root/package CLI suites passed (16 checks each). Current checkpoint: implementation.
    *   *2026-07-13*: Staging QA evidence completed in a clean detached checkout at `c9833db`: root/package suites passed 24 checks each; root/package syntax and CLI/test byte parity passed; `node tools/fb-lane.validate.cjs`, `node tools/fb-lane.cjs doctor`, and `git diff --check` passed. A disposable `CODEX_HOME` added only the local checkout as marketplace `fb-lane`, installed and enabled `fb-lane-coordination@fb-lane` version `0.2.0-beta+codex.20260707114230`, then was removed.
    *   *2026-07-16*: Product review and live release completed in PR #39. The marketplace plugin was refreshed and installed as `0.2.0-beta+codex.20260716052513`.

---

### TASK-017 - Generic progressive disclosure hardening
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: Coordination
*   **Scope**: Harden the generic handoff-index progressive-disclosure contract so future projects inherit `PROJECT_BOARD.md` as truth, `docs/handoffs/index.md` as routing, detailed handoffs as evidence/detail, one FB-Lane framework OKR, lightweight Product/BFM loop health flags, optional Markdown eval scorecards for repeated agent-behavior failures, phased approval-autonomy guidance, Product/BFM execution continuation after approval, lightweight Sidechat-to-Main Prompt Handoff guidance, and clear 0.2.0-beta version positioning.
*   **Out of Scope**: Live deploys, plugin publish/reinstall, hard-blocking `submit`, requiring this for `TASK-Q-*` quick tasks, silently creating missing handoff index files from `doctor`, eval runners, dashboards, numeric scoring, CI eval jobs, bigger `doctor` rules, automatic phase promotion, or a CLI approval state machine.
*   **Goal Alignment Session**:
    *   **Objective**: Make future FB-Lane projects route through compact handoff indexes without weakening board-based sequencing.
    *   **Key Results**:
        *   Bootstrap templates and generated CLI output use compact index columns: Task / Topic, Lane, Status, Depends / Blocks / Gate, Checks / Evidence, Detail.
        *   `doctor` remains read-only and warns when the handoff index is missing or old-style without dependency/gate columns.
        *   Product/BFM guidance creates or refreshes the index before non-quick sequencing when handoffs exist and lookup state is missing, stale, or too vague.
        *   Product/BFM guidance uses `healthy`, `watch`, `needs Product review`, and `blocked` health flags instead of per-task OKRs or numeric loop scoring.
        *   `Loop Learning: propose eval` points to a small generic Markdown scorecard and does not add heavy eval tooling without separate approval.
        *   Product/BFM approval autonomy starts in Shadow Approval, may recommend phase changes after safe matching decisions, and never self-approves risky or unclear work.
        *   Once a safe Product/BFM task or problem is approved, Product/BFM continues routine diagnosis, implementation, verification, board/handoff updates, commit, staging, and cleanup until solved or explicitly blocked, while still stopping at hard gates.
        *   Frontend/UI plans and handoffs name `Visual Preview Decision` so Product/BFM can request browser screenshots/mockups or imagegen assets before execution when visual uncertainty matters.
        *   Sidechats produce recommendations and a paste-ready Product/BFM prompt with explicit scope, affected files/docs, acceptance criteria, gates/risks, and exact Product/BFM instruction, while Product/BFM remains the source-of-truth execution owner.
        *   `/goal` is a Product/BFM shortcut into the existing Goal Alignment Session, while workstream handoffs propose `Workstream Goal` and `User Approval Needed` for Product/user approval.
        *   Public docs name the current model as `FB-Lane 0.2.0-beta: Loop Engineering public beta` and explain the v1-to-latest before/after.
    *   **Definition of Done**: Root and packaged CLI copies match, docs/templates/skills/package copies carry the board/index/handoff contract, relevant checks pass, and remaining risks are named.
    *   **Gate / Review Point**: Product review and CI completed; PR #31 is merged and its release bundle is included in PR #39.
    *   **Approval**: approved
    *   **Justification**: The user explicitly assigned Worker B to implement generic FB-Lane plugin/source hardening for future projects.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation, generated bootstrap output, generated Product agent prompts, and CLI diagnostics only
    *   **Locked Files**: `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, `tools/fb-lane.test.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`, `AGENTS.md`, `.codex/rules.md`, `.claude/agents/**`, `templates/*.md`, `templates/docs/**`, `skills/**`, `plugins/fb-lane-coordination/skills/**`, `agents/**`, `plugins/fb-lane-coordination/agents/**`, `README.md`, `FAQ.md`, `docs/loop-engineering.md`, `docs/setup.md`, `docs/evals/**`, `docs/workstreams/**`, `platforms/codex/README.md`, `platforms/codex/workflow-rules.md`, `plugins/fb-lane-coordination/README.md`, `plugins/fb-lane-coordination/docs/**`, `docs/handoffs/index.md`, `docs/handoffs/TASK-017.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/okf-lite-handoff-index`
    *   **Handoff**: [TASK-017](docs/handoffs/TASK-017.md)
*   **QA Checklist**:
    *   [x] Root and packaged CLI syntax checks pass.
    *   [x] Root/package CLI parity passes.
    *   [x] Regression tests pass; full validator passes on a clean worktree.
    *   [x] `doctor` remains read-only and reports `Ready`.
    *   [x] `git diff --check` passes.
*   **Modified Files**:
    *   `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`
    *   `tools/fb-lane.test.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`
    *   `AGENTS.md`, `.codex/rules.md`, `CLAUDE.md`, `templates/AGENTS.md`, `templates/CLAUDE.md`, `templates/PROJECT_BOARD.md`, `templates/docs/evals/agent-behavior-scorecard-template.md`
    *   `README.md`, `FAQ.md`, `docs/loop-engineering.md`, `docs/setup.md`, `docs/versioning.md`, `plugins/fb-lane-coordination/README.md`
    *   `skills/fb-lane-coordination/SKILL.md`, `skills/project-coordination-setup/SKILL.md`, `plugins/fb-lane-coordination/skills/bfm/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-business/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-design/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-product/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-tech/SKILL.md`, `plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md`
    *   `agents/**`, `plugins/fb-lane-coordination/agents/**`, `.claude/agents/**`
    *   `docs/evals/agent-behavior-scorecard-template.md`, `plugins/fb-lane-coordination/docs/evals/agent-behavior-scorecard-template.md`
    *   `docs/handoffs/index.md`, `docs/handoffs/TASK-017.md`, `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-28*: Worker B claimed the generic progressive-disclosure hardening slice on the existing handoff-index branch.
    *   *2026-06-28*: Implemented the board/index/detail hardening across CLI bootstrap output, packaged plugin copies, templates, docs, Product/BFM skills, and Product prompt artifacts. Syntax, parity, regression tests, `doctor`, and `git diff --check` passed; `node tools/fb-lane.validate.cjs` failed only because the validator expects `doctor` to report `Ready` on a clean worktree.
    *   *2026-06-28*: Added the FB-Lane framework OKR, directional health flags (`healthy`, `watch`, `needs Product review`, `blocked`), and anti-bloat guidance that replaces per-task OKRs, numeric scoring, giant `doctor` behavior, second-board indexes, and quick-task ceremony. Syntax, parity, JSON parse, regression tests, stale-wording scan, `doctor`, and `git diff --check` passed; `node tools/fb-lane.validate.cjs` still fails only on the expected dirty-worktree doctor gate.
    *   *2026-06-28*: Added objective mode-selection guidance across docs, templates, skills, generated bootstrap text, Product prompts, and packaged plugin mirrors so agents default to normal/simple coding unless FB-Lane light or Product/BFM triggers appear.
    *   *2026-06-28*: Added the awareness/isolation/integration rule across docs, templates, Product/BFM skills, generated Product prompts, CLI bootstrap text, and packaged plugin mirrors. Syntax, parity, regression tests, JSON parse, lane status, clean-worktree validator, `doctor`, and `git diff --check` passed.
    *   *2026-06-28*: Added external-service cleanup evidence to regular closeout guidance and corrected the TASK-017 table status to `Staging QA`.
    *   *2026-07-03*: Added the BFM Story Split Pass across source/plugin skills, generated agent prompts, setup templates, Codex rules, and docs so BFM decides whether to split smaller stories before prioritizing or claiming work.
    *   *2026-07-03*: Added Proactive Loop Hardening across MirrorCam and reusable FB-Lane docs/skills/templates so Product/BFM proposes one small approved guardrail when repeated workflow friction, stale state, missing evidence, or preventable rework appears.
    *   *2026-07-04*: Added the compact `Loop Learning` closeout field across reusable FB-Lane docs, Product/BFM skills, templates, and generated Product prompts so heavier tooling escalates only as `none`, `propose guardrail`, `propose automation`, or `propose eval` with Product approval.
    *   *2026-07-04*: Added the generic optional agent-behavior scorecard template for `Loop Learning: propose eval` and wired Product/BFM guidance to keep evals Markdown-only unless heavier tooling is separately proposed and approved.
    *   *2026-07-04*: Added phased approval-autonomy guidance across docs, templates, Product/BFM skills, generated Product prompts, bootstrap output, and packaged plugin mirrors. Product/BFM starts in Shadow Approval, may recommend Phase 2 or Phase 3 only after safe matching decisions, and never self-approves risky surfaces.
    *   *2026-07-04*: Added public version positioning for `FB-Lane 0.2.0-beta: Loop Engineering public beta`, including a v1-to-latest before/after in `docs/versioning.md`.
    *   *2026-07-04*: Added `/goal` as a Product/BFM shortcut into the existing Goal Alignment Session and expanded workstream handoffs with `Product Goal`, `Workstream Goal`, and `User Approval Needed` so Product/user approval stays explicit without creating a second goal system.
    *   *2026-07-04*: Verification passed for CLI syntax, test syntax, root/package parity, generated Product JSON and manifest parsing, regression tests, scorecard/approval wording scans, and `git diff --check`. `doctor` and the validator stop only because this TASK-017 update is intentionally dirty pending commit. Owner: Product/BFM. Next gate: commit/push current TASK-017 update or explicitly defer before starting new source work.
    *   *2026-07-05*: Added Product/BFM execution-continuation guidance across docs, templates, source skills, packaged plugin mirrors, generated Product prompts, and CLI bootstrap output. Approved safe Product/BFM work now continues through routine diagnosis, implementation, verification, board/handoff updates, commit, staging, and cleanup until solved or explicitly blocked; hard gates still stop.
    *   *2026-07-08*: Tightened frontend visual planning guidance across generic FB-Lane docs, templates, Product/BFM/Design skills, packaged plugin mirrors, generated Product prompts, and bootstrap output. Visible UI plans now default to a pre-build visual preview: browser screenshot/mockup, imagegen asset/style option, or `skip with reason` only for non-visual/tiny changes. This updates the earlier 2026-07-05 visual-planning rule.
    *   *2026-07-08*: Ported reusable last-48h retro lessons into generic FB-Lane docs only: repeated workflow failures can trigger a compact retro scorecard, each repeated pattern yields at most one small guardrail, quick tasks stay lightweight unless the same failure repeats, heavier eval/doctor/CI/dashboard/numeric/per-task-OKR tooling remains out of scope without separate approval, and same-version plugin updates require installed-cache wording verification with reinstall/data-preserve fallback where supported. Next gate: Product/BFM review, separate docs commit, CI readiness, and plugin cache refresh after merge.
    *   *2026-07-09*: Added lightweight Sidechat-to-Main Prompt Handoff guidance across reusable docs, templates, skills, generated/source agent prompts, packaged plugin docs/skills, board, handoff, and changelog. Sidechats now produce recommendations plus a paste-ready Product/BFM prompt, but are not source of truth until Product/BFM records the decision in the board, handoff, or durable docs. No command, dashboard, `doctor`, runtime behavior, or tiny-question ceremony was added.
    *   *2026-07-09*: Review fix added the same Sidechat-to-Main Prompt Handoff guidance to root and packaged bootstrap CLI output for fresh `PROJECT_BOARD.md`, `AGENTS.md`, Codex rules, Claude rules, and Antigravity agent JSON generation.
    *   *2026-07-16*: Verified PR #31 merged, then released the integrated bundle in PR #39 and refreshed the installed Codex marketplace plugin to `0.2.0-beta+codex.20260716052513`.


---

### TASK-016 - Codex plugin handoff index progressive disclosure
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Codex Plugin
*   **Scope**: Add OKF-lite handoff-index behavior to the Codex plugin so projects keep `PROJECT_BOARD.md` central while agents use `docs/handoffs/index.md` before opening detailed handoffs.
*   **Out of Scope**: Chrome/browser plugin changes, full OKF import, retrofitting every historical handoff with frontmatter, or changing `submit` behavior.
*   **Goal Alignment Session**:
    *   **Objective**: Reduce token waste from historical handoffs without weakening board-based Product sequencing.
    *   **Key Results**:
        *   Bootstrap creates `docs/handoffs/index.md`.
        *   `doctor` warns when projects have enough handoffs to need an index.
        *   BFM/Product guidance reads the index before detailed handoffs.
    *   **Definition of Done**: Root and packaged CLI copies match, docs and Codex plugin skills mention index-first lookup, and validation passes.
    *   **Gate / Review Point**: Product review of this branch/PR.
    *   **Approval**: approved
    *   **Justification**: MirrorCam showed naive board-plus-all-handoffs reads can burn tens of thousands of tokens.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation and Codex plugin behavior only
    *   **Locked Files**: `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, `plugins/fb-lane-coordination/skills/**`, `skills/**`, `templates/*.md`, `docs/**`, `README.md`, `FAQ.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/okf-lite-handoff-index`
    *   **Handoff**: [TASK-016](docs/handoffs/TASK-016.md)
*   **QA Checklist**:
    *   [x] Bootstrap creates the handoff index.
    *   [x] `doctor` warns only when enough handoffs exist and no index is present.
    *   [x] Root/package CLI parity passes.
    *   [x] Docs and Codex plugin skills use index-first handoff lookup language.
*   **Modified Files**:
    *   `tools/fb-lane.cjs`
    *   `plugins/fb-lane-coordination/tools/fb-lane.cjs`
    *   `tools/fb-lane.test.cjs`
    *   `docs/handoffs/index.md`
    *   `docs/handoffs/TASK-016.md`
    *   `README.md`, `FAQ.md`, `docs/loop-engineering.md`, `docs/setup.md`, `platforms/codex/README.md`, `plugins/fb-lane-coordination/README.md`
    *   `AGENTS.md`, `CLAUDE.md`, `.codex/rules.md`, `templates/*.md`, `skills/**`, `plugins/fb-lane-coordination/skills/**`
*   **Latest Update**:
    *   *2026-06-27*: Added OKF-lite handoff index behavior for Codex plugin projects and documented the index-first read path. Chrome/browser plugin remains unchanged.


### TASK-015 - Workstream plan-only BFM gate
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Coordination
*   **Scope**: Make Product, Tech, Design, and Business workstream threads read-only planning/conversation lanes by default, with all source-code changes happening only inside a Product-launched BFM execution run.
*   **Out of Scope**: Changing CLI command behavior, removing lane ownership, changing CI/CD, or removing BFM return checks.
*   **Goal Alignment Session**:
    *   **Objective**: Reduce accidental source edits and lane drift by making markdown plans the normal workstream output and BFM the deliberate execution gate.
    *   **Key Results**:
        *   Workstream docs, skills, templates, and generated prompts say normal lanes may investigate, ask questions, and write markdown plans/handoffs only.
        *   Product is source-read-only but may edit board, plan, handoff, OKR, Definition of Done, sequencing, and closeout markdown.
        *   Source changes, branches, commits, verification, PRs, merges, and deployments are described as BFM-run execution activities.
    *   **Definition of Done**: Durable docs, templates, skills, generated agent JSON, and packaged plugin copies carry the same plan-only workstream rule, and validation/parity checks pass or are explicitly reported as dirty-worktree expected.
    *   **Gate / Review Point**: User reviews staged diff before commit/PR.
    *   **Approval**: approved
    *   **Justification**: The user approved replacing direct workstream execution with markdown planning plus Product-launched BFM execution.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation and plugin instructions only
    *   **Locked Files**: `AGENTS.md`, `CLAUDE.md`, `.codex/rules.md`, `README.md`, `FAQ.md`, `docs/loop-engineering.md`, `docs/setup.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`, `templates/*.md`, `skills/**/*.md`, `agents/**`, `.claude/agents/**`, `plugins/fb-lane-coordination/**`, `tools/fb-lane.cjs`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [PR #29](https://github.com/friedbeef1/fb-lane-coordination/pull/29)
*   **QA Checklist**:
    *   [x] Wording scan confirms plan-only workstream rule.
    *   [x] Root/package CLI parity passes.
    *   [x] Generated agent JSON parses.
    *   [x] Skill metadata validation passes.
    *   [x] Repo doctor status is reviewed.
    *   [x] Git diff whitespace check passes.
*   **Modified Files**:
    *   Core rules/docs: `AGENTS.md`, `CLAUDE.md`, `.codex/rules.md`, `README.md`, `FAQ.md`, `CHANGELOG.md`, `docs/loop-engineering.md`, `docs/setup.md`, `PROJECT_BOARD.md`, `docs/handoffs/TASK-015.md`
    *   Platform docs/templates: `platforms/codex/README.md`, `platforms/codex/workflow-rules.md`, `platforms/claude-code/README.md`, `platforms/antigravity/README.md`, `templates/AGENTS.md`, `templates/CLAUDE.md`
    *   Skills/agents: `skills/**`, `agents/**`, `.claude/agents/**`, `plugins/fb-lane-coordination/skills/**`, `plugins/fb-lane-coordination/agents/**`
    *   Packaged plugin/CLI: `.claude-plugin/**`, `plugins/fb-lane-coordination/.codex-plugin/plugin.json`, `plugins/fb-lane-coordination/README.md`, `plugins/fb-lane-coordination/plugin.json`, `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`
*   **Latest Update**:
    *   *2026-06-27*: Product claimed the plan-only workstream / BFM execution gate wording update for staging.
    *   *2026-06-27*: Implemented plan-only workstream and Product-launched BFM source-change gate across docs, skills, templates, generated agents, packaged plugin copies, and platform docs. Verification passed for CLI syntax, root/package parity, generated JSON parity, JSON parsing, skill metadata, regression tests, stale wording scan, and `git diff --check`; `doctor` only reports the expected uncommitted local patch before staging.
    *   *2026-06-27*: Ran Ponytail documentation clarity pass: shortened Codex, Claude Code, and Antigravity platform docs; removed stale direct-lane execution tutorials; clarified quick tasks as BFM execution slices, not a source-change bypass.
    *   *2026-06-27*: PR #29 merged to `main`; `doctor` reported Ready on clean `main`.


### TASK-Q-20260627223437 - Document evals as lightweight scorecards
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Documentation
*   **Scope**: Explain evals as lightweight checks for agent behavior in the FB-Lane loop.
*   **Out of Scope**: Adding eval tooling, CI jobs, dependencies, or formal scorecard templates.
*   **Goal Alignment Session**:
    *   **Objective**: Make evals understandable without adding a new framework.
    *   **Key Results**:
        *   README, FAQ, loop deep dive, and plugin README explain evals in plain language.
        *   Docs distinguish evals from tests, doctor, CI, and Definition of Done.
        *   Docs recommend Markdown scorecards only after repeated agent-behavior failures.
    *   **Definition of Done**: Documentation names what evals are, when to use them, and where they fit in the loop.
    *   **Gate / Review Point**: Documentation diff review.
    *   **Approval**: approved
    *   **Justification**: The user asked to ensure evals are part of the documentation.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation only
    *   **Locked Files**: `README.md`, `FAQ.md`, `docs/loop-engineering.md`, `plugins/fb-lane-coordination/README.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/evals-docs`
*   **QA Checklist**:
    *   [x] Documentation uses lightweight eval language.
    *   [x] No eval framework, package, CI job, or new tool was added.
    *   [x] `git diff --check` passes.
*   **Modified Files**:
    *   `README.md`
    *   `FAQ.md`
    *   `docs/loop-engineering.md`
    *   `plugins/fb-lane-coordination/README.md`
    *   `CHANGELOG.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-27*: Added lightweight evals documentation as agent-behavior scorecards, distinct from tests, doctor, CI, and Definition of Done.


### TASK-014 - Ponytail cleanup pass
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Cleanup
*   **Scope**: Keep FB-Lane behavior intact while moving rendered demo MP4s out of git and documenting the canonical vs packaged/generated maintenance surfaces.
*   **Out of Scope**: CLI rewrite, plugin behavior changes, new generator framework, removal of packaged plugin copies, or changes to `claim`, `submit`, `merge`, `doctor`, BFM, OKR, or CI behavior.
*   **Goal Alignment Session**:
    *   **Objective**: Make the FB-Lane repo lighter and easier to maintain without changing the installed plugin or coordination behavior.
    *   **Key Results**:
        *   Rendered demo MP4s are hosted as GitHub release assets and no longer tracked in git.
        *   Future rendered demo video/contact-sheet outputs are ignored by default.
        *   Maintainers can quickly tell which files are canonical and which are packaged/generated copies.
    *   **Definition of Done**: CI readiness validation, repo doctor, whitespace check, and release-asset link checks pass with no behavior changes.
    *   **Gate / Review Point**: Product verifies the diff only removes repo weight and adds maintenance guidance.
    *   **Approval**: approved
    *   **Justification**: The user approved a Ponytail cleanup pass that keeps all functionality while making the repo more elegant and moving demo videos out of git.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation and repository maintenance only
    *   **Locked Files**: `codex-lane-demo/renders/*.mp4`, `platforms/*/how-to-interact-demo/renders/*.mp4`, `.gitignore`, `README.md`, `CHANGELOG.md`, `docs/maintenance.md`, `codex-lane-demo/README.md`, `platforms/claude-code/how-to-interact-demo/README.md`, `platforms/antigravity/how-to-interact-demo/README.md`, `PROJECT_BOARD.md`, `docs/handoffs/TASK-014.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [PR #28](https://github.com/friedbeef1/fb-lane-coordination/pull/28), `codex/ponytail-cleanup-fb-lane`
    *   **GitHub Release Assets**:
        *   [codex-lane-demo.mp4](https://github.com/friedbeef1/fb-lane-coordination/releases/download/demo-assets-2026-06-27/codex-lane-demo.mp4)
        *   [claude-code-how-to-interact.mp4](https://github.com/friedbeef1/fb-lane-coordination/releases/download/demo-assets-2026-06-27/claude-code-how-to-interact.mp4)
        *   [antigravity-how-to-interact.mp4](https://github.com/friedbeef1/fb-lane-coordination/releases/download/demo-assets-2026-06-27/antigravity-how-to-interact.mp4)
*   **QA Checklist**:
    *   [x] Demo release asset links resolve.
    *   [x] No tracked MP4 render outputs remain.
    *   [x] CI readiness validator passes on a clean worktree.
    *   [x] Repo doctor passes on a clean worktree.
    *   [x] Git diff whitespace check passes.
*   **Modified Files**:
    *   `codex-lane-demo/README.md`
    *   `platforms/claude-code/how-to-interact-demo/README.md`
    *   `platforms/antigravity/how-to-interact-demo/README.md`
    *   `codex-lane-demo/renders/codex-lane-demo.mp4`
    *   `platforms/claude-code/how-to-interact-demo/renders/claude-code-how-to-interact.mp4`
    *   `platforms/antigravity/how-to-interact-demo/renders/antigravity-how-to-interact.mp4`
    *   `.gitignore`
    *   `docs/maintenance.md`
    *   `README.md`
    *   `CHANGELOG.md`
    *   `PROJECT_BOARD.md`
    *   `docs/handoffs/TASK-014.md`
*   **Latest Update**:
    *   *2026-06-27*: Demo MP4 outputs now live in GitHub release assets and demo READMEs link them directly. Tracked render MP4 files were removed, render folders are ignored, and maintenance parity guidance was added. Release asset checks returned HTTP 200, `git ls-files '*renders/*.mp4'` returned no matches, `node tools/fb-lane.validate.cjs` passed, `node tools/fb-lane.cjs doctor` passed, and `git diff --check` passed.


### TASK-013 - Add FB-Lane CI readiness automation loop
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: CI
*   **Scope**: Add a GitHub Actions CI readiness loop that runs the repo's FB-Lane validation evidence on pull requests and pushes to `main`.
*   **Out of Scope**: Publishing packages, deploying docs, auto-tagging releases, or adding secrets-backed CD.
*   **Goal Alignment Session**:
    *   **Objective**: Make FB-Lane produce automatic CI readiness evidence before Product/BFM uses a branch as merge-ready.
    *   **Key Results**:
        *   PRs and pushes to `main` run the same local validation script.
        *   The validation script covers CLI syntax, source/package parity, JSON parsing, skill metadata, regression tests, `doctor`, and whitespace checks.
        *   Docs explain that FB-Lane is not CI/CD, but now includes a CI readiness automation loop.
        *   CI passing is required before merge once `main` branch protection is enabled;
            the intended operating model is automated merge safety with manual release
            control (staging, live deploy, plugin release, and publish remain manual
            Product decisions).
    *   **Definition of Done**: The workflow and local runner pass locally without new dependencies or secrets, and docs/board/handoff record CI readiness as part of Loop Engineering evidence.
    *   **Gate / Review Point**: `node tools/fb-lane.validate.cjs`, `node --check tools/fb-lane.validate.cjs`, `node tools/fb-lane.cjs doctor`, and `git diff --check` pass before closeout.
    *   **Approval**: approved
    *   **Justification**: The user approved adding a real automation loop after choosing CI readiness on PR and `main` pushes, with CD intentionally deferred.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation and CI only
    *   **Locked Files**: `.github/workflows/fb-lane-readiness.yml`, `tools/fb-lane.validate.cjs`, `.gitignore`, `.codex/rules.md`, `README.md`, `FAQ.md`, `docs/loop-engineering.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`, `docs/handoffs/TASK-013.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/ci-readiness-loop`
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Local CI runner passes.
    *   [x] CI runner syntax check passes.
    *   [x] Repo doctor passes.
    *   [x] Git diff whitespace check passes.
    *   [x] Workflow has no secrets requirement.
*   **Modified Files**:
    *   `.github/workflows/fb-lane-readiness.yml`
    *   `tools/fb-lane.validate.cjs`
    *   `.gitignore`
    *   `.codex/rules.md`
    *   `README.md`
    *   `FAQ.md`
    *   `docs/loop-engineering.md`
    *   `CHANGELOG.md`
    *   `docs/handoffs/TASK-013.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-27*: Implemented the CI readiness automation loop. `node tools/fb-lane.validate.cjs`, runner syntax, repo doctor, workflow sanity, and whitespace checks passed.
    *   *2026-06-27*: Fixed the GitHub Actions doctor mismatch by tracking `.codex/rules.md`; the CI readiness gate now runs against the same repo state as local validation.


### TASK-012 - Clarify stable OKR alignment in FB-Lane
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Coordination
*   **Scope**: Refine Loop Engineering so Product/workstream OKRs and lane OKRs stay stable, mini-loops produce evidence against those OKRs, and BFM stops for explicit approval before any OKR addition or change.
*   **Out of Scope**: Creating more per-task OKR ceremony, changing submit behavior, hard-blocking work, or adding dynamic OKR generation during execution.
*   **Goal Alignment Session**:
    *   **Objective**: Make FB-Lane treat OKRs as stable, plain-English alignment anchors that reduce rework instead of becoming dynamic planning clutter.
    *   **Key Results**:
        *   Docs, skills, templates, generated prompts, and packaged plugin copies distinguish Product/workstream OKRs, lane OKRs, and mini-loop evidence.
        *   Handoff guidance uses `Product Goal`, `Workstream Goal`, `Lane OKR Fit`, `User Approval Needed`, `Mini-loop Evidence`, and `Evidence Against Product OKR`.
        *   `doctor` remains advisory, warns on missing approved OKR alignment or implied unapproved new goals, and keeps `TASK-Q-*` quick tasks exempt.
    *   **Definition of Done**: Source and packaged guidance consistently require stable OKR reuse, explicit approval before OKR additions/changes, PM-readable wording, and mini-loop evidence instead of dynamic OKR creation.
    *   **Gate / Review Point**: Wording scans, CLI syntax/parity, manifest/generated JSON parsing, doctor fixture checks, repo doctor, and `git diff --check` pass before closeout.
    *   **Approval**: approved
    *   **Justification**: The user approved the implementation plan after clarifying that OKRs should be for everyone, stable by default, and added only when they make clarity better after discussion.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation and plugin coordination behavior only
    *   **Locked Files**: `AGENTS.md`, `README.md`, `FAQ.md`, `CHANGELOG.md`, `PROJECT_BOARD.md`, `docs/loop-engineering.md`, `docs/handoffs/TASK-012.md`, `templates/*.md`, `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/**`, `skills/**/*.md`, `agents/**`, `.claude/agents/**`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/stable-okr-alignment`
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Stable OKR wording scan passes.
    *   [x] Root and packaged CLI pass syntax checks.
    *   [x] Root and packaged CLI stay byte-identical.
    *   [x] `doctor` fixture checks cover aligned, implied new goal, and quick-task cases.
    *   [x] Plugin manifests and generated agent JSON parse.
    *   [x] Repo `doctor` and `git diff --check` pass.
*   **Modified Files**:
    *   `README.md`, `FAQ.md`, `docs/loop-engineering.md`
    *   `AGENTS.md`, `CLAUDE.md`, `templates/AGENTS.md`, `templates/CLAUDE.md`, `templates/PROJECT_BOARD.md`
    *   `skills/fb-lane-coordination/SKILL.md`, `skills/project-coordination-setup/SKILL.md`, `skills/quickstart/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/**`, `plugins/fb-lane-coordination/agents/**`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, `plugins/fb-lane-coordination/.codex-plugin/plugin.json`, `plugins/fb-lane-coordination/plugin.json`, `plugins/fb-lane-coordination/README.md`
    *   `tools/fb-lane.cjs`, `agents/**`, `.claude/agents/**`
    *   `docs/handoffs/TASK-002.md`, `docs/handoffs/TASK-003.md`, `docs/handoffs/TASK-010.md`, `docs/handoffs/TASK-011.md`, `docs/handoffs/TASK-012.md`
    *   `CHANGELOG.md`, `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-27*: Implemented stable OKR alignment across docs, skills, templates, generated prompts, packaged plugin files, and advisory doctor checks. Verification passed: wording scan, CLI syntax/parity, doctor fixture matrix, JSON parse, skill validation, repo doctor, regression tests, and `git diff --check`.


### TASK-001 - Project Setup & Bootstrap
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: Setup
*   **Scope**: Create initial files, initialize repository layout.
*   **Out of Scope**: Writing application business logic.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [Branch Link](https://github.com/example/repo/tree/main)
    *   **Staging URL**: [Staging Link](https://staging.example.com)
    *   **Design Specs**: (None)
    *   **Decision Memo**: [docs/decisions/001-setup.md](file:///./docs/decisions/001-setup.md)
*   **QA Checklist**:
    *   [x] Repository structure is clean and follows design guidelines.
    *   [x] File names and paths are correct.
    *   [x] Documentation has zero typos or placeholders.
*   **Modified Files**:
    *   `docs/decisions/001-setup.md`
*   **Latest Update**:
    *   *2026-06-15*: Completed repository bootstrapping and documented layout decisions.


### TASK-002 - Implement user authentication endpoints
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: Core
*   **Scope**: Implement user registration and login API endpoints.
*   **Out of Scope**: Unrelated styling edits.
*   **Goal Alignment Session**:
    *   **Objective**: Provide a minimal local authentication surface for registration, login, logout, and current-session lookup.
    *   **Key Results**:
        *   Auth routes validate input and return expected success/error states.
        *   Passwords are hashed and session tokens expire.
        *   A self-contained auth smoke passes.
    *   **Definition of Done**: `src/auth.ts` and `src/db.ts` support the documented auth endpoints with runnable local verification.
    *   **Gate / Review Point**: FB-Tech verification evidence is present in `docs/handoffs/TASK-002.md`.
    *   **Approval**: approved
    *   **Justification**: Legacy completed work needs approved OKRs so non-quick handoff doctor checks remain actionable.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: (None)
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Registration works and hashes passwords.
    *   [x] Session tokens generated securely.
    *   [x] Unit tests pass.
*   **Modified Files**:
    *   `src/auth.ts`
    *   `src/db.ts`
*   **Latest Update**:
    *   *2026-06-22*: Implemented password hashing, session tokens, in-memory DB interface, HTTP handlers, and self-contained integration tests.


### TASK-003 - Design responsive dashboard navigation
*   **Status**: Done
*   **Owner / Thread**: FB-Design
*   **Area**: UI
*   **Scope**: Design a responsive sidebar navigation menu.
*   **Out of Scope**: Editing database schemas or APIs.
*   **Goal Alignment Session**:
    *   **Objective**: Provide responsive dashboard sidebar styling that stays contained across desktop, tablet, and mobile widths.
    *   **Key Results**:
        *   Sidebar desktop, collapsed, and mobile states are documented.
        *   Text containment rules prevent label spill.
        *   Visual QA notes cover representative viewport sizes.
    *   **Definition of Done**: `src/navigation.css` contains the responsive sidebar styling and the handoff records viewport evidence.
    *   **Gate / Review Point**: FB-Design verification evidence is present in `docs/handoffs/TASK-003.md`.
    *   **Approval**: approved
    *   **Justification**: Legacy completed work needs approved OKRs so non-quick handoff doctor checks remain actionable.
*   **Affected Screens / Locks**:
    *   **Screens**: Dashboard
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: (None)
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Sidebar collapses cleanly on mobile viewports.
    *   [x] Colors align with the design system.
*   **Modified Files**:
    *   `src/navigation.css`
*   **Latest Update**:
    *   *2026-06-22*: Designed responsive sidebar navigation styling with collapsible states, text containment, and design system color mappings.



### TASK-004 - Package FB-Lane as a Codex plugin
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Codex
*   **Scope**: Add a repo-local Codex plugin package that bundles FB-Lane skills, MCP configuration, and install documentation so Codex users can install the coordination workflow with minimal setup.
*   **Out of Scope**: Changing Antigravity runtime behavior or replacing the existing Claude Code plugin.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation only
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: PR #7
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Codex plugin manifest validates.
    *   [x] Marketplace entry points at the plugin package.
    *   [x] Docs explain install and usage.
*   **Modified Files**:
    *   `.agents/plugins/marketplace.json`
    *   `plugins/fb-lane-coordination/`
    *   `tools/fb-lane.cjs`
    *   `README.md`
    *   `FAQ.md`
    *   `platforms/codex/README.md`
*   **Latest Update**:
    *   *2026-06-19*: Added and validated the Codex plugin package, including bundled skills and MCP workspace-path support.


### TASK-005 - Clarify Codex plugin pain point and value
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Codex Docs
*   **Scope**: Update Codex-facing docs to make the real pain point explicit and avoid overstating Codex limitations.
*   **Out of Scope**: Changing plugin code, videos, or non-Codex platform behavior.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation only
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/pain-point-docs`
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Codex claims are verified against current Codex docs/manual.
    *   [x] Pain point is framed as coordination risk, not missing Codex capability.
    *   [x] Fix/value proposition is clear and practical.
*   **Modified Files**:
    *   `README.md`
    *   `FAQ.md`
    *   `platforms/codex/README.md`
*   **Latest Update**:
    *   *2026-06-21*: Clarified that Codex already provides subagents/worktrees/plugins/skills/MCP; FB-Lane solves the cross-lane product coordination layer.


### TASK-006 - Explain how FB-Lane works with Codex worktrees
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Codex Docs
*   **Scope**: Update Codex-facing docs to explain, in non-technical terms, when to use FB-Lane alone, Codex worktrees alone, or both together.
*   **Out of Scope**: Changing plugin code, videos, or non-Codex platform behavior.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation only
    *   **Locked Files**: `README.md`, `FAQ.md`, `platforms/codex/README.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/pain-point-docs`
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Current Codex worktree behavior is reflected accurately.
    *   [x] Docs clearly separate physical workspace isolation from product coordination.
    *   [x] Docs show how Product/Captain uses worktrees and lane handoffs together.
*   **Modified Files**:
    *   `README.md`
    *   `FAQ.md`
    *   `platforms/codex/README.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-21*: Added Codex worktrees guidance and clarified that worktrees provide Git/workspace isolation while FB-Lane provides product coordination, claims, handoffs, and Product sequencing.


### TASK-007 - Fix quick-task ID parsing for `TASK-Q-####` board rows
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: CLI
*   **Scope**: Update board parsing and rewriting so quick tasks created as `TASK-Q-####` are visible to status, submit, merge, and plugin MCP flows.
*   **Out of Scope**: Example icon assets from draft PR #4.
*   **Affected Screens / Locks**:
    *   **Screens**: CLI / MCP behavior only
    *   **Locked Files**: `tools/fb-lane.cjs`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/quick-task-id-parser-fix`
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Root CLI parses `TASK-Q-####` rows and detail headers.
    *   [x] Plugin-packaged CLI parses `TASK-Q-####` rows and detail headers.
    *   [x] Normal `TASK-###` IDs still parse.
*   **Modified Files**:
    *   `tools/fb-lane.cjs`
    *   `plugins/fb-lane-coordination/tools/fb-lane.cjs`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-21*: Applied the parser-only fix from draft PR #4 to both CLI copies and verified quick-task read/write behavior without merging optional example icon assets.


### TASK-008 - Refresh plugin docs after merged Codex and quick-task work
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Documentation
*   **Scope**: Update user-facing docs so the repo reflects the merged Codex worktree guidance, immediate post-install usage, quick-task parser support, and remaining draft PR state.
*   **Out of Scope**: Changing runtime behavior, videos, platform-specific claims, or draft PR #3 content.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation only
    *   **Locked Files**: `README.md`, `FAQ.md`, `plugins/fb-lane-coordination/README.md`, `plugins/fb-lane-coordination/.codex-plugin/plugin.json`, `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`, `PROJECT_BOARD.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/docs-refresh-after-merges`
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Install-time docs include a first prompt that works without reading the full README.
    *   [x] Quick-task docs mention `TASK-Q-####` status/submit/merge support.
    *   [x] Outstanding draft PR state is documented without implying it is merged.
*   **Modified Files**:
    *   `README.md`
    *   `FAQ.md`
    *   `plugins/fb-lane-coordination/README.md`
    *   `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
    *   `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-21*: Added immediate Codex post-install prompts, quick-task lifecycle documentation, and Codex plugin metadata version `0.1.1`. Current repo state: PR #8 and PR #10 are merged; PR #4 is closed as superseded; PR #3 remains a conflicting draft and is not documented as merged.


### TASK-009 - Trim front page and move setup/platform details to focused docs
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Documentation
*   **Scope**: Make the front page shorter, remove platform-specific usage from the front page, move AI-powered/manual setup into a dedicated setup page, and keep Codex usage inside the Codex platform guide.
*   **Out of Scope**: Changing plugin behavior, generated videos, or platform runtime claims.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation only
    *   **Locked Files**: `README.md`, `docs/setup.md`, `platforms/codex/README.md`, `PROJECT_BOARD.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: `codex/front-page-docs-trim`
    *   **Staging URL**: (None)
*   **QA Checklist**:
    *   [x] Front page is shorter and links to platform guides instead of embedding platform-specific usage.
    *   [x] AI-powered bootstrap and manual CLI bootstrap live on a separate setup page.
    *   [x] Codex-specific usage prompts live in the Codex guide and are only linked from the front page.
*   **Modified Files**:
    *   `README.md`
    *   `docs/setup.md`
    *   `platforms/codex/README.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-21*: Reworked the front page into a concise overview and platform-router, moved AI-powered/manual bootstrap to `docs/setup.md`, and kept Codex first-use prompts in the Codex platform guide.


### TASK-Q-8688 - Quick test hooks
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: Quick-Fix
*   **Scope**: Quick test hooks
*   **Out of Scope**: Unrelated codebase changes.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [Branch Link](https://github.com/friedbeef1/fb-lane-coordination/tree/quick/TASK-Q-8688-quick-test-hooks)
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Changes compile without error.
    *   [x] Modified files are verified and checked.
*   **Modified Files**:
    *   (None)
*   **Latest Update**:
    *   *2026-06-21*: Initialized quick edit task.


### TASK-Q-5217 - Improve Codex plugin setup UX
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: Quick-Fix
*   **Scope**: Improve Codex plugin setup UX
*   **Out of Scope**: Unrelated codebase changes.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [PR #17](https://github.com/friedbeef1/fb-lane-coordination/pull/17)
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Root and packaged CLI pass `node --check`.
    *   [x] Codex plugin manifest validates.
    *   [x] Codex-only bootstrap smoke creates no Claude or Antigravity artifacts.
    *   [x] `git diff --check` passes.
*   **Modified Files**:
    *   `tools/fb-lane.cjs`
    *   `plugins/fb-lane-coordination/tools/fb-lane.cjs`
    *   `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
    *   `plugins/fb-lane-coordination/plugin.json`
    *   `plugins/fb-lane-coordination/README.md`
    *   `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-product/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md`
    *   `platforms/codex/README.md`
    *   `README.md`
    *   `docs/handoffs/TASK-Q-5217.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-23*: Added Codex-only bootstrap, read-only doctor, `$fb-lane` docs, plugin metadata alignment, and handoff; local verification passed.
    *   *2026-06-24*: Added thin-protocol guidance so FB-Lane is optional and skipped for simple single-thread Codex work.


### TASK-010 - Add lightweight goal alignment to FB-Lane handoffs and BFM sequencing
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Coordination
*   **Scope**: Add canonical Goal Alignment to non-trivial FB-Lane work, keep lane handoffs lightweight, and make BFM reconcile goal drift before sequencing execution.
*   **Out of Scope**: Hard-blocking `submit`, changing quick-task behavior, or creating a standalone goal-management framework.
*   **Goal Alignment Session**:
    *   **Objective**: Make non-trivial FB-Lane handoffs preserve a clear Product/BFM-owned OKR while preserving lane caveats and evidence.
    *   **Key Results**:
        *   Skills and bootstrap guidance describe the board OKR contract.
        *   Lane handoffs report fit without rewriting board OKRs.
        *   `doctor` warns on missing non-quick handoff alignment and keeps `TASK-Q-*` exempt.
    *   **Definition of Done**: Skills, bootstrap guidance, packaged plugin files, and doctor checks all consistently express the Goal Alignment contract, with quick tasks exempt.
    *   **Gate / Review Point**: Source validation, plugin validation, CLI syntax checks, and doctor fixture checks pass before submit.
    *   **Approval**: approved
    *   **Justification**: This merged coordination change established the predecessor contract this follow-up replaces with OKR language.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation and CLI behavior only
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [PR #19](https://github.com/friedbeef1/fb-lane-coordination/pull/19)
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Modified skills validate.
    *   [x] Plugin manifest validates.
    *   [x] Root and packaged CLI pass syntax checks.
    *   [x] `doctor` warns for missing Goal Alignment on non-quick handoffs and exempts `TASK-Q-*`.
*   **Modified Files**:
    *   `AGENTS.md`
    *   `templates/AGENTS.md`
    *   `templates/CLAUDE.md`
    *   `templates/PROJECT_BOARD.md`
    *   `README.md`
    *   `platforms/codex/README.md`
    *   `platforms/codex/workflow-rules.md`
    *   `platforms/antigravity/README.md`
    *   `agents/fb-product.md`
    *   `skills/fb-lane-coordination/SKILL.md`
    *   `skills/project-coordination-setup/SKILL.md`
    *   `skills/quickstart/SKILL.md`
    *   `plugins/fb-lane-coordination/README.md`
    *   `plugins/fb-lane-coordination/agents/FB-Business/agent.json`
    *   `plugins/fb-lane-coordination/agents/FB-Design/agent.json`
    *   `plugins/fb-lane-coordination/agents/FB-Product/agent.json`
    *   `plugins/fb-lane-coordination/agents/FB-Tech/agent.json`
    *   `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
    *   `plugins/fb-lane-coordination/plugin.json`
    *   `plugins/fb-lane-coordination/skills/bfm/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-business/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-design/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-product/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-tech/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md`
    *   `tools/fb-lane.cjs`
    *   `plugins/fb-lane-coordination/tools/fb-lane.cjs`
    *   `docs/handoffs/TASK-002.md`
    *   `docs/handoffs/TASK-003.md`
    *   `docs/handoffs/TASK-010.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-25*: Product claimed the goal-alignment loop implementation and locked the skill, bootstrap, CLI, and handoff files.
    *   *2026-06-25*: Implemented lightweight Goal Alignment guidance, BFM reconciliation, generated/static bootstrap updates, doctor warnings, metadata bump, and handoff evidence; final review passed after fixes requiring real `## Goal Alignment` handoff headings, worker handoff-only goal feedback, full board-block wording (`Objective`, `Definition of Done`, `Gate / Review Point`), and doctor warnings for wrong heading levels.
    *   *2026-06-25*: Addressed final review gaps in the manual board template and quickstart entrypoint.
    *   *2026-06-25*: Backfilled legacy TASK-002/TASK-003 handoffs and completed setup skill example alignment so `doctor` can stay warning-clean.
    *   *2026-06-25*: Tightened generated prompts so Product/BFM owns board goal updates and worker lanes report goal feedback only in handoffs.
    *   *2026-06-26*: Tightened Product/Lane execution boundaries for the then-current model; this direct lane execution rule is superseded by TASK-015, where normal workstream threads become plan-only and source changes move behind Product-launched BFM execution. Added advisory doctor checks for stale Git lock files and long-running local lane git/test/build processes so Product can record a blocked/pending gate instead of looping on execution.
    *   *2026-06-26*: Follow-up Product/Lane boundary checks passed: skill/plugin/CLI validation, source/package CLI parity, JSON manifest parse, `git diff --check`, stale-lock doctor fixture, and repo doctor process/lock check.
    *   *2026-06-26*: PR #19 merged to `main`, local marketplace source refreshed, and `codex plugin add fb-lane-coordination@fb-lane` reinstalled active cache version `0.1.2+codex.20260625082239`.


### TASK-011 - Harden fb-lane CLI against shell command injection
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: Security
*   **Scope**: Stop running `git` through a shell in `fb-lane.cjs`, and validate task IDs and lane names so attacker-controlled values (including MCP tool arguments) can no longer inject commands.
*   **Out of Scope**: Changing the coordination model, lane boundaries, or board protocol.
*   **Goal Alignment**:
    *   **Objective**: Remove the command-injection surface in the CLI without changing legitimate behavior.
    *   **Definition of Done**: `git` runs with no shell, untrusted values are validated, and a regression suite proves shell metacharacters are inert.
    *   **Gate / Review Point**: CLI syntax check, regression tests, and source/packaged CLI parity pass before merge.
*   **Affected Screens / Locks**:
    *   **Screens**: CLI behavior only
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [PR #21](https://github.com/friedbeef1/fb-lane-coordination/pull/21)
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] `git` is invoked via `execFileSync` with an args array (no shell).
    *   [x] Task IDs and lane names are validated at the CLI and MCP entry points.
    *   [x] `node tools/fb-lane.test.cjs` passes (validators + no-shell proofs).
    *   [x] Root and packaged CLI stay byte-identical and pass syntax checks.
*   **Modified Files**:
    *   `tools/fb-lane.cjs`
    *   `tools/fb-lane.test.cjs`
    *   `plugins/fb-lane-coordination/tools/fb-lane.cjs`
    *   `plugins/fb-lane-coordination/tools/fb-lane.test.cjs`
    *   `docs/fb-lane-upstream/0001-harden-fb-lane-cli.patch`
    *   `docs/fb-lane-upstream/README.md`
    *   `CHANGELOG.md`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-27*: Replaced shell `git ${args}` execution with `execFileSync('git', argv)`, de-shelled the `submit` fallback and `lsof` lookup, added task ID / lane allowlists and an option-like branch-name guard, made the CLI importable, and added `tools/fb-lane.test.cjs` (10 checks pass). Resynced the bundled plugin copy and captured the change as an upstream `git format-patch`.

### TASK-Q-5624 - Document plugin upgrade process and changelog
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Quick-Fix
*   **Scope**: Document plugin upgrade process and changelog
*   **Out of Scope**: Unrelated codebase changes.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [PR #20](https://github.com/friedbeef1/fb-lane-coordination/pull/20)
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Changes compile without error.
    *   [x] Modified files are verified and checked.
*   **Modified Files**:
    *   `README.md`
    *   `docs/setup.md`
    *   `platforms/codex/README.md`
    *   `CHANGELOG.md`
    *   `PROJECT_BOARD.md`
    *   `docs/handoffs/TASK-Q-5624.md`
    *   `docs/handoffs/TASK-010.md`
*   **Latest Update**:
    *   *2026-06-25*: Initialized quick edit task.
    *   *2026-06-26*: Added changelog and documented the Codex plugin upgrade/reinstall process.
    *   *2026-06-26*: PR #20 merged to `main`; locks released.


### TASK-011 - Add BFM return-loop closeout checks
*   **Status**: Done
*   **Owner / Thread**: FB-Product
*   **Area**: Coordination
*   **Scope**: Make BFM and lane execution close only after every relevant handoff has an explicit status that agrees with board, source, docs, and test evidence, or the mismatch is named; frame the public docs around Loop Engineering as the Product Lead operating model.
*   **Out of Scope**: Changing submit behavior, adding a new framework, or requiring return-loop ceremony for quick micro-tasks.
*   **Goal Alignment Session**:
    *   **Objective**: BFM and lane closeouts behave like a real loop: read handoffs, execute/route work, return to board/source/docs/tests, and close only when all handoffs are accounted for under approved OKRs.
    *   **Key Results**:
        *   BFM blocks before execution when OKR approval is missing, OKRs are unclear, or handoffs conflict with approved OKRs.
        *   Lane handoffs report `OKR Fit`.
        *   Skills, docs, templates, generated prompts, packaged plugin copies, changelog, and handoff docs consistently use `Goal Alignment Session`.
        *   `doctor` warns, without blocking, for missing/unapproved non-quick OKRs and missing handoff OKR Fit.
    *   **Definition of Done**: Skills, bootstrap guidance, generated CLI prompts, packaged plugin copies, changelog, and handoff docs consistently require approved Goal Alignment Session OKRs, explicit handoff status, and return checks.
    *   **Gate / Review Point**: Wording scans, skill/manifest validation, CLI syntax checks, and source/package parity checks pass before commit.
    *   **Approval**: approved
    *   **Justification**: This follow-up tightens BFM sequencing around approved OKRs without changing submit behavior or quick-task flow.
*   **Affected Screens / Locks**:
    *   **Screens**: Documentation and plugin behavior guidance only
    *   **Locked Files**: `.claude/agents/fb-business.md`, `.claude/agents/fb-design.md`, `.claude/agents/fb-product.md`, `.claude/agents/fb-tech.md`, `AGENTS.md`, `CHANGELOG.md`, `FAQ.md`, `README.md`, `agents/FB-Business/agent.json`, `agents/FB-Design/agent.json`, `agents/FB-Product/agent.json`, `agents/FB-Tech/agent.json`, `agents/fb-business.md`, `agents/fb-design.md`, `agents/fb-product.md`, `agents/fb-tech.md`, `docs/loop-engineering.md`, `docs/setup.md`, `docs/handoffs/TASK-011.md`, `platforms/antigravity/README.md`, `platforms/claude-code/README.md`, `platforms/codex/README.md`, `plugins/fb-lane-coordination/.codex-plugin/plugin.json`, `plugins/fb-lane-coordination/README.md`, `plugins/fb-lane-coordination/agents/FB-Business/agent.json`, `plugins/fb-lane-coordination/agents/FB-Design/agent.json`, `plugins/fb-lane-coordination/agents/FB-Product/agent.json`, `plugins/fb-lane-coordination/agents/FB-Tech/agent.json`, `plugins/fb-lane-coordination/plugin.json`, `plugins/fb-lane-coordination/skills/bfm/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-business/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-design/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-product/SKILL.md`, `plugins/fb-lane-coordination/skills/fb-tech/SKILL.md`, `plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md`, `plugins/fb-lane-coordination/tools/fb-lane.cjs`, `skills/fb-lane-coordination/SKILL.md`, `skills/project-coordination-setup/SKILL.md`, `skills/quickstart/SKILL.md`, `templates/AGENTS.md`, `templates/CLAUDE.md`, `tools/fb-lane.cjs`, `PROJECT_BOARD.md`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [PR #25](https://github.com/friedbeef1/fb-lane-coordination/pull/25)
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
*   **QA Checklist**:
    *   [x] Modified skills validate by frontmatter/wording scan.
    *   [x] Plugin manifests parse.
    *   [x] Root and packaged CLI pass syntax checks.
    *   [x] Source/package CLI copies stay byte-identical.
    *   [x] Codex bootstrap smoke generated return-loop guidance.
    *   [x] Rewritten GitHub docs pass local Markdown link checks.
    *   [x] Stale primary-positioning scan passes.
    *   [x] Setup and platform docs retain install/bootstrap commands.
*   **Modified Files**:
    *   `.claude/agents/fb-business.md`
    *   `.claude/agents/fb-design.md`
    *   `.claude/agents/fb-product.md`
    *   `.claude/agents/fb-tech.md`
    *   `AGENTS.md`
    *   `CHANGELOG.md`
    *   `CLAUDE.md`
    *   `FAQ.md`
    *   `README.md`
    *   `agents/FB-Business/agent.json`
    *   `agents/FB-Design/agent.json`
    *   `agents/FB-Product/agent.json`
    *   `agents/FB-Tech/agent.json`
    *   `agents/fb-business.md`
    *   `agents/fb-design.md`
    *   `agents/fb-product.md`
    *   `agents/fb-tech.md`
    *   `docs/loop-engineering.md`
    *   `docs/setup.md`
    *   `docs/handoffs/TASK-002.md`
    *   `docs/handoffs/TASK-003.md`
    *   `docs/handoffs/TASK-010.md`
    *   `docs/handoffs/TASK-011.md`
    *   `platforms/antigravity/README.md`
    *   `platforms/claude-code/README.md`
    *   `platforms/codex/README.md`
    *   `plugins/fb-lane-coordination/.codex-plugin/plugin.json`
    *   `plugins/fb-lane-coordination/README.md`
    *   `plugins/fb-lane-coordination/agents/FB-Business/agent.json`
    *   `plugins/fb-lane-coordination/agents/FB-Design/agent.json`
    *   `plugins/fb-lane-coordination/agents/FB-Product/agent.json`
    *   `plugins/fb-lane-coordination/agents/FB-Tech/agent.json`
    *   `plugins/fb-lane-coordination/plugin.json`
    *   `plugins/fb-lane-coordination/skills/bfm/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-business/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-design/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-lane/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-product/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/fb-tech/SKILL.md`
    *   `plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md`
    *   `plugins/fb-lane-coordination/tools/fb-lane.cjs`
    *   `skills/fb-lane-coordination/SKILL.md`
    *   `skills/project-coordination-setup/SKILL.md`
    *   `skills/quickstart/SKILL.md`
    *   `templates/AGENTS.md`
    *   `templates/CLAUDE.md`
    *   `templates/PROJECT_BOARD.md`
    *   `tools/fb-lane.cjs`
    *   `PROJECT_BOARD.md`
*   **Latest Update**:
    *   *2026-06-27*: Product claimed the return-loop coordination update and locked the process docs, skill files, bootstrap templates, generated CLI prompts, packaged CLI copy, changelog, handoff, and board.
    *   *2026-06-27*: Implemented BFM return-loop guidance across skills, docs, bootstrap templates, generated prompts, and packaged plugin files; syntax, manifest parse, CLI parity, Codex bootstrap smoke, doctor setup checks, and whitespace checks passed.
    *   *2026-06-27*: Opened PR #25 for Product review; remaining gate is merge and plugin reinstall/refresh after merge.
    *   *2026-06-27*: Added the visible BFM return-loop Mermaid diagram to the root README, packaged plugin README, and BFM skill; bumped the Codex plugin build suffix to `0.1.2+codex.20260627163830`.
    *   *2026-06-27*: Updated Codex plugin metadata/default prompts so installed plugin users see BFM as a return loop; bumped the Codex plugin build suffix to `0.1.2+codex.20260627164153`.
    *   *2026-06-27*: Renamed the canonical Goal Alignment evidence field to `Definition of Done` across docs, skills, templates, generated prompts, packaged plugin copies, and CLI output; bumped the Codex plugin build suffix to `0.1.2+codex.20260627171622`.
    *   *2026-06-27*: Implemented the BFM Goal Alignment Session with approved OKRs, `OKR Fit` handoffs, warning-only `doctor` checks for missing/unapproved non-quick OKRs, and packaged plugin build suffix `0.1.2+codex.20260627174151`.
    *   *2026-06-27*: Reframed the public GitHub docs around Loop Engineering for Product Leads, added `docs/loop-engineering.md`, shortened `FAQ.md`, and kept setup/platform pages tactical.
    *   *2026-06-27*: Merged PR #25, refreshed the Codex plugin, replaced user-specific approval wording with generic `the user` language, moved plugin display ownership to `FB-Lane Contributors`, and bumped the packaged plugin build suffix to `0.1.2+codex.20260627183826`.
