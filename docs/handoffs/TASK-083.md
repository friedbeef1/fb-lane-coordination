---
type: fb-lane-handoff
task: TASK-083
lane: fb-product
status: implemented
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
- Changelog expectation: required.

## Decisions and assumptions

- Visible title prefix is presentation, not project identity authority.
- The canonical project ID, repository root, stable task ID, native title/pin detail, and complete inventory remain authoritative.
- The default prefix remains `FB` when the configuration file or key is absent.
- Invalid configured values fail closed instead of silently falling back.
- TASK-083 is stacked on TASK-082 commit `79475ccb7fcc526906da017b8a24b33d4e892a16`; its later merge/release decision must be reconciled before TASK-083 delivery.

## Scope

Canonical onboarding runtime and focused tests, existing setup skills, setup documentation, generated package mirrors, and TASK-083 coordination/QA records.

## Dependencies

- TASK-082 frozen candidate and later upstream decision.
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
- **Branch, source commits, and changed surfaces:** Branch `codex/task-083-sidebar-identity-hardening`, source range `79475ccb7fcc526906da017b8a24b33d4e892a16..HEAD`; onboarding runtime/tests, existing setup skills, setup documentation, changelog, TASK-083 records, and five generated package mirrors.
- **Checks, failures, recovery, and results:** Root and package onboarding passed 37/37 each; root and package native-setup and shortcut contracts passed; 86 mirrors are byte-identical; root/package runtime syntax, four skill validations, and whitespace passed. The one whole-candidate review found two Important identity/wording issues and one changelog gap; one consolidated behavioral repair closed them. The scoped re-review confirmed identity and wording behavior, and its changelog hierarchy observation was corrected as record-only closeout.
- **Review state, direct links, limits, and external gates:** Candidate checking; see [QA evidence](../qa/TASK-083.md) and the [TASK-083 changelog entry](../../CHANGELOG.md#task-083--project-qualified-sidebar-task-titles). Consumer acceptance is bounded local evidence, not installed-package proof. No merge, publication, marketplace refresh, reinstall, task mutation, or deployment is authorized before **Push Live**.
- **Repository state:** The candidate is confined to the TASK-083 worktree and must be committed cleanly before the targeted preflight, Doctor Ready proof, and one final release checkpoint. TASK-082's frozen branch remains untouched.
- **Remaining owner and action:** Product/BFM freezes the exact source candidate, runs the clean-candidate preflight and final checkpoint once, records closeout, and stops at **Ready to ship**.
- **Changelog:** updated — [TASK-083 project-qualified sidebar task titles](../../CHANGELOG.md#task-083--project-qualified-sidebar-task-titles).

## Brief Validation

Status: checking — approved implementation, root/package focused evidence, one whole-candidate review, and the single consolidated behavioral repair are complete. Clean-candidate preflight, Doctor Ready proof, and the final checkpoint remain.
