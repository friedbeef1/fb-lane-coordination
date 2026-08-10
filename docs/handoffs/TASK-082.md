---
type: fb-lane-handoff
task: TASK-082
lane: fb-product
status: ready
approval: approved
record_model: normalized-v1
fb_harness: v3
learning_contract: v1
worktree: /private/tmp/fb-task-081
sensitive: false
work_types: coordination, release, tooling, documentation
surface: FB canonical repository and packaged Codex plugin
---

# TASK-082 — FB coordination retro and release hardening

## Goal Alignment Session

Product Goal: Make FB releases repeatable and fail early on incomplete or contradictory durable evidence without adding duplicate ceremony.
Lane OKR Fit: aligned
Mini-loop Evidence: Focused contracts will prove the release preflight, skill boundary, dependency closure, package parity, and current-state repairs before the release checkpoint.
Evidence Against Product OKR: No contrary evidence identified; time and token effects remain unmeasured and will not be claimed.

## Approved Decision

Implement the user-approved TASK-082 plan exactly once as a bounded release candidate. Create only `fb-release`; strengthen existing skills for setup, Product/BFM, and record responsibilities.

## Build Brief

- Retrospect `1da10b5..74a017b`, separating observed facts from inference.
- Add a model-invoked `fb-release` skill triggered only by explicit **Push Live** in Product/BFM.
- Add one targeted complete-record preflight before broad release validation.
- Require `record_model: normalized-v1` on new normalized handoffs while preserving historical compatibility.
- Build archive/fallback dependency fixtures from `tools/fb-package-manifest.json`.
- Document proof boundaries for source, clone/CI, marketplace, and installed cache.
- Repair current-state drift in TASK-080 and TASK-081 without rewriting historical candidate evidence.
- Generate package mirrors mechanically and prepare `0.8.0-beta+codex.<UTC-build>`.
- Exact candidate build: `0.8.0-beta+codex.20260810034353`.
- Changelog expectation: required.
- Stop at **Ready to ship**; **Push Live** remains the release boundary.

## Decisions and assumptions

- Consumer repositories are supporting evidence only; their source is out of scope.
- The authoritative base is commit `74a017b` in the canonical FB repository.
- Focused proof per slice, one whole-candidate review, one consolidated repair maximum, and one final release checkpoint remain the execution budget.
- No elapsed-time or token-savings claim will be inferred from Git history.

## Scope

Canonical release tooling and tests, FB operating guidance, Product/BFM skills, one new release skill, current coordination records, changelog/version metadata, generated package mirrors, and review-candidate delivery.

## Dependencies

- Canonical package manifest and synchronizer.
- Existing normalized records, changelog closeout, Doctor, and release validator contracts.
- Explicit **Push Live** for any later merge, marketplace publication, or reinstall.
- Approved follow-up `MEJA-123` remains queued after TASK-082: strengthen the
  existing setup skill pair and onboarding runtime so stable task IDs receive a
  verified project display prefix and the post-mutation receipt proves all seven
  final titles. It is outside this already-reviewed candidate and receives the
  overlapping package/runtime lock only after TASK-082 releases it.

## Acceptance Criteria

- The focused release preflight reports every missing invariant in one run and handles omitted `record_model` on the selected candidate without weakening legacy scans.
- Incomplete, dirty, mismatched, unresolved, and contradictory release candidates fail early; complete legacy and normalized candidates pass.
- Archive fixtures inherit the full declared package dependency set.
- `fb-release` selects source-type-specific marketplace refresh, verifies installed runtime artifacts, and refuses root-only source-layout proof in installed-cache context.
- Root and packaged plugin guidance remain mechanically aligned.
- One whole-candidate review and one final release checkpoint pass before a review candidate is pushed.

## Project Learning

Learning: confirmed — repeated release failures should be prevented at the
cheapest authoritative boundary: one narrow release skill for the distinct
**Push Live** transaction, existing-skill guidance for owned behavior, and
mechanical checks for deterministic record and dependency facts.

## Other lanes

Other lanes: no impact detected — this task changes the reusable FB coordination harness and does not change any consumer product behavior.

## Links

- Board: [PROJECT_BOARD.md](../../PROJECT_BOARD.md)
- QA: [TASK-082 QA](../qa/TASK-082.md)
- Retro: [2026-08-10 FB coordination retro](../retros/2026-08-10-fb-coordination-retro.md)

## Changelog expectation

Changelog expectation: required — this adds a user-visible release skill and changes release validation behavior.

## Task Receipt

- **Approved brief and decisions:** Implement TASK-082 as approved: exactly one new `fb-release` skill, an early complete-record release preflight, manifest-derived fallback dependency coverage, environment-specific proof, and FB `0.8.0-beta` preparation without live release.
- **Confirmed assumptions and approved scope changes:** Consumer projects remain evidence only; historical records are preserved; the selected current release handoff must declare `record_model: normalized-v1`; no scope expansion or sensitive operation was introduced.
- **Branch, source commits, and changed surfaces:** Branch `codex/task-082-retro-release-hardening`, source range `74a017b..HEAD`; release runtime and contracts, canonical operating guidance, BFM/Product/release skills, current TASK-080/TASK-081 state, version metadata, changelog, retro, and generated plugin package.
- **Checks, failures, recovery, and results:** Focused root/package release and normalized-record contracts passed 31/31 in each context; eval/archive fallback passed 19/19; package-sync unit contracts passed 10/10; 86 generated mirrors agree; metadata, lifecycle/version, syntax, skill validation, links, Doctor, and whitespace passed. Three read-only fresh-agent probes correctly stopped incomplete evidence, selected the local-marketplace path, and rejected installed-build/public-copy mismatches. The one whole-candidate review found three Important record/integration issues and no Critical issue; one consolidated repair closed all three. The final release validator passed once at source candidate `bd32dd2` with 72 core, 34 checkout-migration, 39 session, 19 eval, 11 beginner, and 25 efficiency checks plus focused positioning, two-speed, Doctor, parity, and whitespace gates.
- **Review state, direct links, limits, and external gates:** Ready to ship after GitHub review readiness; see [QA evidence](../qa/TASK-082.md), [retrospective](../retros/2026-08-10-fb-coordination-retro.md), and [0.8.0-beta changelog](../../CHANGELOG.md#080-beta--2026-08-10). No merge, publication, marketplace refresh, reinstall, or deployment is authorized before **Push Live**.
- **Repository state:** Source candidate `bd32dd2` is clean and committed on the TASK-082 branch; canonical `main` remains at `74a017b` until a later release decision. The coordination-only closeout changes no runtime or package bytes and reuses the passing checkpoint through targeted record/Doctor/whitespace proof.
- **Remaining owner and action:** Product/BFM pushes the review PR, observes GitHub readiness once, and stops at **Ready to ship**. A later explicit **Push Live** is required for merge, publication, marketplace refresh, and reinstall.
- **Changelog:** updated — [0.8.0-beta](../../CHANGELOG.md#080-beta--2026-08-10).

## Brief Validation

Status: pass — the approved scope, focused evidence, single whole-candidate
review, consolidated repair, clean-candidate preflight, Doctor, and one final
release checkpoint all passed for the frozen source candidate.

Satisfied criteria and evidence: The focused contracts prove selected-record completeness, historical compatibility, source-type-aware release behavior, installed-runtime proof boundaries, archive dependency closure, version consistency, and the intended one-skill boundary.

Missing criteria and next actions: GitHub readiness remains before the review
candidate is reported Ready to ship. Merge, publication, marketplace refresh,
reinstall, and live verification remain outside this candidate until **Push
Live**. No approved scope change is pending.

## Verification Handoff

The durable test record is [TASK-082 QA](../qa/TASK-082.md). It separates focused observed checks, read-only fresh-agent simulations, the integrated candidate review, and the final release checkpoint.
