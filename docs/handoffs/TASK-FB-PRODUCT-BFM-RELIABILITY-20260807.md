---
type: fb-lane-handoff
task: TASK-FB-PRODUCT-BFM-RELIABILITY-20260807
lane: fb-product
status: implemented
approval: approved
okr_fit: aligned
fb_harness: v3
record_model: normalized-v1
---

# Product/BFM canonical-project and complete-intake reliability

Date: 2026-08-07
Owner: Product/BFM
Source: James-approved Unmirror handoff

## Approved Decision

Build on the verified checkout-migration guard while preserving the FB 0.5.10
setup and delegated-approval behavior in the combined FB 0.5.11 candidate.
Product/BFM must operate from
one canonical project, inspect all six evidence workstreams, show Product/BFM
separately, compare same-path records by content and routing state, display a
complete intake ledger before execution, and keep former roots recoverable
until explicit retirement approval.

## Scope

- Canonical checkout detection and fail-closed mutation gates.
- Exact-project reconciliation of Product/BFM, User, Business, Design, Tech,
  Discovery, and Bugs.
- Complete intake across canonical records, worktrees, registered audit/former
  roots, board/index routing, and workstream cards.
- One disposition per candidate plus a compact dependency/lock-aware sequence.
- Transactional migration and task rebind.
- Canonical plugin guidance, generated mirrors, focused tests, local candidate,
  and consumer smokes.

Out of scope: Unmirror application behavior, destructive checkout retirement,
provider state, publication, installation/cache replacement, merge, and live
deployment.

## Goal Alignment Session

Product Goal: make BFM a reliable visible control centre that cannot lose
approved work or operate from the wrong project.

Workstream Goal: turn canonical checkout, complete intake, seven-role
visibility, safe sequencing, and migration into one fail-closed contract.

Lane OKR Fit: aligned

Approval: approved

Mini-loop Evidence: the Unmirror split-brain incident hid a real Design
amendment when filename-only matching and incomplete sidebar reconciliation
were treated as sufficient.

Evidence Against Product OKR: the installed behavior does not yet include the
verified local guard or complete exact-project rebind and intake contract.

## Build Brief

1. Preserve the FB 0.5.10 setup and standing-delegation behavior inside the
   next truthful combined beta.
2. Import guard commits `e4715d1` and `5b4a226`; do not reimplement them.
3. Complete runtime intake, ledger, onboarding, migration, and documentation in
   bounded reviewed slices.
4. Generate mirrors only after canonical changes pass focused review.
5. Verify against the canonical Unmirror checkout and a disposable project.
6. Stop before publication, cache replacement, retirement, merge, or live work.

Changelog expectation: required — this changes visible Product/BFM onboarding,
intake, and reliability behavior. Product/BFM standing delegation may approve
candidate-faithful wording; **Push Live** remains user-owned.

## Task Receipt

- **Branch:** `codex/product-bfm-reliability-20260807`.
- **Candidate:** `0.5.11-beta+codex.20260807112648` on the reviewed Task 6
  candidate plus the focused whole-branch reliability repair.
- **Changelog:** updated — [0.5.11-beta](../../CHANGELOG.md#0511-beta--2026-08-07).
- **Changelog approval:** approved — Product/BFM standing delegation;
  Reference: TASK-FB-PRODUCT-BFM-RELIABILITY-20260807, 2026-08-07.
- **Review state:** Ready to ship — independent whole-branch review and the
  complete release checkpoint pass.
- **External gates:** publication/cache replacement, checkout retirement,
  sensitive operations, and **Push Live**.
- **Remaining owner/action:** James may say **Push Live** to authorize push,
  merge, publication, installation/cache replacement, and live verification;
  no release action ran.

## Brief Validation

Status: pass

- **Satisfied:** Runtime, intake, exact-project onboarding, transactional
  migration, canonical guidance, version, changelog, 65-mirror package parity,
  and consumer-bound evidence are aligned.
- **Missing:** Publication, install/cache replacement, merge, retirement,
  deployment, and **Push Live** remain separate gates.
- **Evidence:** [Task 6 QA](../qa/TASK-FB-PRODUCT-BFM-RELIABILITY-20260807.md).

## Product/BFM Closeout

Status: Ready to ship

- One-time package generation produced 65 declared mirrors; final byte parity
  and package contract checks pass.
- Focused root and package onboarding, intake, migration, guidance, metadata,
  syntax, validation, link, JSON, and whitespace checks pass.
- The actual BFM claim gate now accepts compatible Product/BFM control inputs,
  audits every non-retired manifest checkout, requires verified exact-project
  seven-task onboarding evidence, and keeps blocked links visible without
  executing them.
- The quarantined Unmirror root fails closed, the canonical Unmirror root
  succeeds read-only, and an isolated migration preserves the former root while
  recording seven exact-project task bindings.
- Independent whole-branch review passed. The final complete validator passed
  after one consolidated record repair and one bounded Product-directed
  recovery; doctor reported Ready.
- No publication, installation/cache replacement, retirement, merge, push,
  deployment, or **Push Live** occurred.
