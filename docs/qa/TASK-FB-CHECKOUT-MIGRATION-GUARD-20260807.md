---
type: fb-qa-artifact
task: TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807
record_model: normalized-v1
status: passed
---

# TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807 QA

Candidate: `codex/checkout-migration-guard-20260807`
Environment: local clean FB-Lane source checkout
Date: 2026-08-07
Release boundary: guard absorbed into FB 0.5.11; PR #60 merged and the exact
plugin build is installed. Checkout retirement remains separately gated.

## Red-Green Evidence

The repair red run failed because a receipt bound only to the canonical digest
continued authorizing drift after the off-home source changed. After the repair,
20 focused checks passed.

Covered behavior:

- SHA-256 plus task/status drift evidence for the same relative handoff path.
- Canonical plus exact source-root/digest-set receipts; later off-home changes
  reopen `HANDOFF_CONTENT_DRIFT`.
- Unique Ready orphan detection and workstream ordering remain unchanged.
- Unique non-ready and unreadable off-home content fail closed; configured
  missing and inaccessible audit roots fail `READINESS_AUDIT_INCOMPLETE`.
- `active`, `quarantined`, `retirement-pending`, and `retired` remain distinct.
- Task rebind cannot close, and retirement cannot complete, while tasks remain.
- CLI and MCP status expose current path, canonical path, lifecycle, unresolved
  drift, and task-rebind state; both fail on a noncanonical checkout.
- Quarantined checkout status fails `FB_CHECKOUT_NOT_CANONICAL` after showing
  diagnostics.
- CLI claim/bootstrap/quick/submit/merge, MCP record/claim/submit/merge, and
  session promote/checkpoint/close fail before mutation outside canonical.
- Read-only session status remains available.

## Machine-Local Manifest Discovery

Discovery is explicit and host-local, in this order:

1. `FB_CHECKOUT_MIGRATION_MANIFEST` selects one manifest directly.
2. The checkout Git common directory may contain `fb-checkout-migration.json`.
3. `FB_CHECKOUT_MIGRATION_REGISTRY`, or the default
   `~/.codex/fb-lane/checkout-migrations`, is scanned for JSON manifests that
   explicitly register the current checkout path.

Multiple matching registered manifests fail invalid. Registry and manifest
paths remain outside tracked repository content, so host paths are not committed.

## Verification

| Command | Result |
|---|---|
| `node tools/fb-checkout-migration.test.cjs` | 20/20 pass |
| `node tools/fb-lane.test.cjs` | 72/72 pass |
| `node tools/fb-session.test.cjs` | 39/39 pass |
| `node tools/fb-package-sync.test.cjs` | 10/10 pass |
| `node tools/fb-package-sync.cjs --check` | Historical guard-only snapshot: 61 mirrors pass; superseded for release evidence by the combined 65-mirror manifest. |
| `node --check tools/fb-lane.cjs` | pass |
| `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs` | pass |
| `git diff --check` | pass |

## Existing Baseline Note

`node tools/fb-six-workstreams.test.cjs` completes its scanner scenarios, then
fails an unrelated pre-existing 0.5.9 candidate assertion that still expects
`Product/User` in README while the current README uses the approved `User`
terminology. This task does not alter that unrelated release-candidate contract.

## Privacy And Release

Manifests remain machine-local under the Git common directory or explicit local
registry and are not added to the package or repository. No consumer checkout
was touched. No network, publication, installation, cache replacement, merge,
push, or release action occurred.
