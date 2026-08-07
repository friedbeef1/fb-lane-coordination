---
type: fb-qa-artifact
task: TASK-FB-PRODUCT-BFM-RELIABILITY-20260807
record_model: normalized-v1
status: passed
---

# TASK-FB-PRODUCT-BFM-RELIABILITY-20260807 QA

Candidate: `codex/product-bfm-reliability-20260807`
Release candidate: `0.5.11-beta+codex.20260807112648`
Environment: local FB-Lane candidate plus read-only Unmirror consumer smoke
Date: 2026-08-07
Release boundary: complete release validator passed; no publish, install, cache
replacement, merge, push, retirement, deployment, or **Push Live**.

## Outcome

The combined 0.5.11 candidate is **Ready to ship** after independent review and
the complete release checkpoint. Product/BFM guidance,
runtime prompts, plugin metadata, generated mirrors, and release records agree
on one canonical checkout, six evidence workstreams plus separate Product/BFM,
exact-project seven-task reconciliation, complete fail-closed intake, and a
visible dependency/lock-aware ledger. The declared package contains 65
byte-identical mirrors.

## Red-Green Evidence

The focused lifecycle/release contract first failed against the prior 0.5.10
manifest and missing 0.5.11 reliability language. It passed after the canonical
version, changelog, metadata, guidance, and declared test surface were aligned.

After the one permitted mirror generation, focused root/package checks exposed
stale wording and fixture assumptions. Those contracts and their byte-identical
package counterparts were repaired directly; package generation was not run a
second time, and the final parity check remained green.

## Focused Verification

| Proof | Result |
|---|---|
| Lifecycle/release contract | root and package pass |
| Plugin metadata contract | root and package pass |
| Product/BFM control-centre contract | root and package pass |
| `$fb-setup` shortcut and native onboarding | root and package pass |
| Six-skill and cross-workstream guidance | root and package pass |
| Product-positioning compatibility | root and package pass |
| Complete BFM intake ledger | root and package 10/10 pass |
| Exact-project onboarding | root and package 26/26 pass |
| Checkout migration | root and package 34/34 pass |
| Package sync contract | 10/10 pass |
| Package parity | 65/65 declared mirrors byte-identical |
| Changed root/package skills | validation pass |
| Codex plugin | validation pass |
| Changed JavaScript and JSON | syntax/parse pass |
| Changed Markdown links | 343 links pass |
| Whitespace | `git diff --check` pass |

## Consumer Evidence

The candidate runtime was invoked read-only against both known Unmirror roots.

- `/Users/jamesyeang/Documents/Testing FB Lanes/unmirror` reported the canonical
  root as `/Users/jamesyeang/Projects/unmirror`, lifecycle `quarantined`, zero
  unresolved drift, complete task rebind, and then failed closed with
  `FB_CHECKOUT_NOT_CANONICAL`.
- `/Users/jamesyeang/Projects/unmirror` reported itself as canonical and
  `active`, with zero unresolved drift and complete task rebind; status/context
  completed successfully.
- Existing dirty coordination files in canonical Unmirror were observed but not
  changed. No Unmirror source or coordination record was written.

## Disposable Migration Evidence

An isolated temporary project used a temporary migration registry and two
temporary Git roots. Inventory plus transactional commit produced exactly one
active canonical checkout, one quarantined former checkout, seven exact-project
task bindings, and zero lost former-root evidence. The former checkout failed
the canonical assertion as expected; no retirement transition ran. The entire
temporary project was removed after the smoke.

## Release Boundary And Rollback

This record is evidence for local review only. Product/BFM standing delegation
covers the candidate-faithful changelog wording and one later release
checkpoint, but publication, installation/cache replacement, merge, retirement,
deployment, and **Push Live** remain outside this task. The currently installed
rollback build remains `0.5.9-beta+codex.20260805042523` until a separately
approved release changes that state.

## Focused review repair

The review repair closed four consistency findings without changing the
candidate's pending release boundary: the current handoff is now implemented,
TASK-076 is superseded in current routing records, `$bfm` documentation now
places Product reconciliation and the recorded Build Brief before source
execution, and the intake description now counts six workstream cards plus one
Product/BFM control-centre card. Historical TASK-076 handoff and QA evidence
remain unchanged.

Focused rerun evidence: root and packaged intake-ledger tests passed 10/10
each; root and packaged lifecycle/release contracts passed; package-sync tests
passed 10/10; all 65 declared mirrors matched; 178 changed-document links and
anchors resolved; and `git diff --check` passed.

## Whole-branch reliability repair

The whole-branch review found two fail-open seams and three consistency gaps.
One consolidated TDD repair now:

- accepts compatible ready `lane: fb-product` files as separately displayed
  Product/BFM control-centre inputs;
- audits every non-retired checkout named only by the committed migration
  manifest and fails closed when one is inaccessible;
- binds execution and empty-queue proof to the existing exact-project
  seven-task onboarding receipt and reports absent, pending, partial, stale, or
  verified evidence plus missing roles;
- keeps blocked handoff counts and links visible without executing them; and
- aligns the authoritative TASK-075 summary with its completed handoff/index.

The new real `claim ... bfm` integration first failed on the Product/BFM role
mismatch, then passed with six evidence inputs, one Product/BFM control input,
a manifest-only former root, and a verified onboarding receipt. Removing the
former root or staling the receipt closes the gate.

| Focused proof | Result |
|---|---|
| Root and packaged BFM intake integration | 12/12 each |
| Checkout migration | 34/34 |
| Exact-project onboarding | 26/26 |
| Root CLI | 72/72 |
| Sessions | 39/39 |
| Package sync contract | 10/10 |
| Declared package parity | 65/65 |
| Changed Markdown links | 288 resolved |
| Product/BFM, native setup, lifecycle, syntax, whitespace | pass |

No full validator or external action ran. Independent whole-branch re-review is
the next local gate.

## Exact-project identity follow-up

Whole-branch re-review confirmed the original reliability findings were closed
and exposed two bounded compatibility gaps. The onboarding receipt now requires
an explicit canonical repository path and an exact project-ID match with the
migration manifest; a missing path can no longer resolve implicitly through the
process working directory. The established six-workstream scanner contract now
also records blocked candidates and the current Product/BFM/BFM lane vocabulary
without stale four/six-task assertions.

Focused RED/GREEN evidence covered a missing receipt path and mismatched project
ID. Final root and packaged intake tests passed 12/12 each, both six-workstream
contracts passed, package-sync tests passed 10/10, all 65 mirrors matched, both
runtime files passed syntax checks, and whitespace checks passed.

Final complete validation passed: CLI 72/72, migration 34/34, sessions 39/39,
evals 19/19, beginner experience 11/11, efficiency 25/25, positioning,
two-speed, syntax, 65-mirror parity, committed whitespace, and doctor Ready.

## Release-checkpoint repair

Product/BFM used the standing delegated approval for this candidate's single
release checkpoint. The initial complete validator passed all runtime, migration,
session, eval, beginner, positioning, two-speed, and efficiency suites, then
doctor stopped on two normalized-record conflicts: TASK-075 and TASK-076 still
carried their former active handoff statuses after the current board truth had
been corrected to Done and Superseded.

The one permitted consolidated checkpoint repair changed only those current
handoff status fields and clarified that 0.5.10 was superseded before
publication. Historical test and release evidence remains intact. A focused
doctor run then reported no blocking normalized-record conflicts; the remaining
OKR notices belong to the historical checkout-guard handoff and are disclosed,
not treated as candidate failures.

The post-repair complete pass then showed those three notices prevented the
validator's strict Ready assertion even though the imported handoff already
contained equivalent bold-list evidence. Product/BFM used the documented single
bounded circuit-breaker recovery: it added the three canonical plain-field
forms without changing the decision or evidence. Focused doctor proof then
showed every OKR contract green; only the expected dirty-worktree notice remained
before this recovery commit.
