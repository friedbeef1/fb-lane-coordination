---
type: fb-qa-artifact
task: TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807
record_model: normalized-v1
status: passed-local-candidate
---

# TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807 QA

Candidate: `codex/checkout-migration-guard-20260807`
Environment: local clean FB-Lane source checkout
Date: 2026-08-07
Release boundary: no publish, install, cache replacement, merge, push, or
consumer rollout.

## Red-Green Evidence

The first focused run failed because same-relative-path content was treated as
reconciled by filename alone and produced `READINESS_FALSE_NEGATIVE` instead of
`HANDOFF_CONTENT_DRIFT`. After implementation, 13 focused checks passed.

Covered behavior:

- SHA-256 plus task/status drift evidence for the same relative handoff path.
- Canonical-hash-bound dispositions and stale receipt rejection.
- Unique Ready orphan detection and workstream ordering remain unchanged.
- Unique non-ready and unreadable off-home content fail closed.
- `active`, `quarantined`, `retirement-pending`, and `retired` remain distinct.
- Task rebind cannot close, and retirement cannot complete, while tasks remain.
- Status exposes current path, canonical path, lifecycle, unresolved drift, and
  task-rebind state.
- Quarantined checkout status fails `FB_CHECKOUT_NOT_CANONICAL` after showing
  diagnostics.
- Claim, bootstrap, and quick handoff paths fail before board, context, or
  handoff mutation outside the canonical checkout.

## Verification

| Command | Result |
|---|---|
| `node tools/fb-checkout-migration.test.cjs` | 13/13 pass |
| `node tools/fb-lane.test.cjs` | 72/72 pass |
| `node tools/fb-package-sync.test.cjs` | 10/10 pass |
| `node tools/fb-package-sync.cjs --check` | 61 mirrors pass |
| `node --check tools/fb-lane.cjs` | pass |
| `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs` | pass |
| `node tools/fb-lane.validate.cjs` | Runtime suites pass; pre-commit run stopped only at normalized task-record and dirty-worktree doctor gates, addressed in this closeout commit |
| `git diff --check` | pass after task-context EOF cleanup |

The full validator's completed runtime suites were CLI 72/72, migration 13/13,
sessions 39/39, evals 19/19, beginner 11/11, positioning pass, two-speed pass,
and efficiency 25/25. The clean committed-candidate rerun is the final local
gate.

## Existing Baseline Note

`node tools/fb-six-workstreams.test.cjs` completes its scanner scenarios, then
fails an unrelated pre-existing 0.5.9 candidate assertion that still expects
`Product/User` in README while the current README uses the approved `User`
terminology. This task does not alter that unrelated release-candidate contract.

## Privacy And Release

The manifest is machine-local under the Git common directory and is not added
to the package or repository. No consumer checkout was touched. No network,
publication, installation, cache replacement, merge, push, or release action
occurred.
