---
type: fb-lane-handoff
task: TASK-083
lane: fb-product
status: ready
approval: approved
record_model: normalized-v1
fb_harness: v3
learning_contract: v1
worktree: /private/tmp/fb-task-083
sensitive: false
work_types: coordination, tooling, testing, documentation
surface: FB canonical onboarding runtime, setup skills, and packaged Codex plugin
---

# TASK-083 — Project-qualified sidebar task titles

## Goal Alignment Session

Product Goal: Make each repository's seven FB tasks visually unambiguous without weakening exact-project identity or duplicate protection.
Lane OKR Fit: aligned
Mini-loop Evidence: A configured-prefix fixture must plan seven stable-ID renames and zero creates, then a fresh prefixed inventory must strictly reconcile as seven reuses with unchanged pins and IDs; invalid or duplicate evidence must fail closed.
Evidence Against Product OKR: None identified; TASK-082's release decision remains a sequencing dependency.

## Approved Decision

Strengthen the existing setup skill pair and onboarding runtime. Do not create a new sidebar, rename, archive, or prefix skill.

## Build Brief

- Read an optional repository-visible `taskTitlePrefix` from `.fb-lane.json`; keep the project-specific value in the consumer repository.
- Derive the seven expected visible titles per repository while retaining the existing `FB` titles as the compatibility default and migration aliases.
- Migrate supported current/legacy bindings through deterministic stable-ID rename actions; never convert an existing exact role into a create.
- Preserve complete exact-project inventory, native-detail authority, pins, action order, post-mutation relist, strict reconciliation, and privacy-safe receipts.
- Route duplicate-looking, rename, prefix, archive, and repair requests through the existing `$fb-setup` and `project-coordination-setup` owners.
- Require a fresh Codex task after a plugin replacement before plugin-dependent mutation.
- Generate package mirrors mechanically only after canonical review.
- Exact candidate build: `0.8.1-beta+codex.20260810055302`.
- Changelog expectation: required.

## Decisions and assumptions

- Visible title prefix is presentation, not project identity authority.
- The canonical project ID, repository root, stable task ID, native title/pin detail, and complete inventory remain authoritative.
- The default prefix remains `FB` when the configuration file or key is absent.
- Invalid configured values fail closed instead of silently falling back.
- TASK-082 is released. TASK-083 is reconciled onto current `main` at
  `902c04275fbbd77b682be347285ef10f1c2feebf` before delivery.

## Scope

Canonical onboarding runtime and focused tests, existing setup skills, setup documentation, generated package mirrors, and TASK-083 coordination/QA records.

## Dependencies

- Released TASK-082 / FB 0.8.0 base at `902c042`.
- Existing exact-root local inventory and native task controls.
- Existing package manifest and synchronizer.
- Explicit **Push Live** for merge, publication, marketplace refresh, or reinstall.

## Acceptance Criteria

- Configured prefix plans exactly seven stable-ID renames and zero creates from a complete generic canonical inventory.
- A fresh prefixed inventory verifies all seven expected titles, unchanged IDs, and pins, then plans seven reuses with no mutation.
- Default configuration preserves the current `FB · …` contract.
- Empty, overlong, separator-bearing, control-character, unreadable, or malformed configuration fails closed.
- Separate projects cannot lend identity or bindings to one another; same-project duplicates still stop all actions.
- Existing setup skills cover project prefix, duplicate-looking suites, rename/archive repair, exact-project authority, receipt proof, and fresh-task reload after plugin replacement.
- Root and generated package files are byte-identical and focused checks, syntax, links, Doctor, and whitespace pass.

## Project Learning

Learning: not required — the verified failure is now enforced by deterministic runtime contracts and the existing setup skill pair; another project-local lesson or new skill would duplicate those owners.

## Other lanes

Other lanes: no impact detected — this changes coordination task presentation and setup mechanics only; it does not alter consumer product behavior, commercial decisions, visual product UI, or provider state.

## Links

- Board: [PROJECT_BOARD.md](../../PROJECT_BOARD.md)
- QA: [TASK-083 QA](../qa/TASK-083.md)
- Consumer acceptance: MÉJA `MEJA-122` in `/Users/jamesyeang/Documents/meja-current/docs/qa/MEJA-122-sidebar-task-naming.md` is separate local evidence summarized by TASK-083 QA, not package proof.

## Changelog expectation

Changelog expectation: required — repository-qualified task titles change visible first-run and repair behavior.

## Task Receipt

- **Approved brief and decisions:** Implement generic repository-visible `taskTitlePrefix` support in the canonical FB source, strengthen the existing setup skill pair, preserve exact-project authority and stable IDs, generate package mirrors mechanically, and stop at **Ready to ship**.
- **Confirmed assumptions and approved scope changes:** `FB` remains the missing-key default; invalid configuration and configured-prefix drift fail closed; receipt-bound IDs cannot be replaced or adopted by title; `docs/setup.md` remains root-only because it is not manifest-managed; no new sidebar skill, archive planner action, consumer mutation, or sensitive operation was added.
- **Branch, source commits, and changed surfaces:** Branch `codex/task-083-sidebar-identity-hardening`; reviewed runtime candidate `883d786`, current-main integration `bc8b4d3`, versioned candidate `202b050`, and completion-audit duplicate guard `79a813f` over release base `902c042`; onboarding runtime/tests, existing setup skills, setup documentation, changelog/version metadata, TASK-083 records, and generated package mirrors.
- **Checks, failures, recovery, and results:** Root and package onboarding passed 38/38 each after the completion-audit repair; root and package native-setup and shortcut contracts passed; 86 mirrors are byte-identical; root/package runtime syntax, changelog, metadata, lifecycle/version, and whitespace checks passed. The whole-candidate review found two Important identity/wording issues and one changelog gap; its consolidated repair closed them. A later requirement-by-requirement completion audit proved that an unreceipted exact-project suite with another qualified prefix could still plan seven duplicate creates. A focused RED reproduced that behavior, and `79a813f` now stops with identity-repair evidence and zero actions. Runtime candidate `883d786` passed the earlier full validator: 72 core, 34 checkout-migration, 39 session, 19 eval, 11 beginner, and 25 efficiency checks plus product-positioning and two-speed contracts; the runtime-affecting completion repair requires one current-candidate checkpoint before release readiness is restored.
- **Review state, direct links, limits, and external gates:** Ready to ship; see [QA evidence](../qa/TASK-083.md) and the [0.8.1-beta changelog entry](../../CHANGELOG.md#081-beta--2026-08-10). Consumer acceptance is bounded local evidence, not installed-package proof. No merge, publication, marketplace refresh, reinstall, task mutation, or deployment is authorized before **Push Live**.
- **Repository state:** Completion-audit runtime repair `79a813f` and its committed candidate records produced clean checkpoint input `d137fce` in the isolated TASK-083 worktree over current `main` `902c042`; targeted preflight, Doctor, and the complete validator passed there.
- **Remaining owner and action:** Product/BFM pushes the repaired review candidate and observes GitHub readiness once. Only a later explicit **Push Live** may authorize merge, publication, marketplace refresh, reinstall, or consumer reconciliation.
- **Changelog:** updated — [0.8.1-beta project-qualified sidebar task titles](../../CHANGELOG.md#081-beta--2026-08-10).

External gates: explicit **Push Live** before merge, publication, marketplace refresh, reinstall, or consumer reconciliation.
Remaining owner/action: Product/BFM pushes the repaired review candidate, observes GitHub readiness once, and then waits for **Push Live**.

## Brief Validation

Status: passed — the approved behavior, focused root/package evidence, completion-audit duplicate guard, current-candidate preflight, Doctor, and final checkpoint all pass. The candidate stops at **Ready to ship**.
