# Task 4 Report: Migration evidence freshness and canonical identity

## Status

PASS — migration inventory now binds every root's Git `HEAD` commit and tree in
addition to branch, worktree registry, dirty files, handoffs, and routing
surfaces. Clean same-branch committed divergence produces disposition-bound
`head` and `tree` differences.

Inventory, direct commit, and task-rebind paths reject repository identities
that do not resolve to the exact canonical Git root. Retirement re-inventories
every non-retired registered root at the decision boundary and rejects any
branch, commit, tree, worktree, dirt, handoff, or routing evidence that changed
after the last dispositioned migration commit.

No publication, installation/cache replacement, merge, checkout retirement,
provider mutation, push, or deployment action was performed.

## Files

- `tools/fb-lane.cjs`
- `tools/fb-checkout-migration.test.cjs`
- `.superpowers/sdd/TASK-FB-PRODUCT-BFM-RELIABILITY-20260807/task-4-report.md`

## TDD evidence

The focused runner began at 28/28. New RED cases then failed in sequence:

1. clean same-branch divergence exposed missing `head` and `tree` fields;
2. foreign repository-path inventory did not throw;
3. a foreign-path manifest could satisfy task rebind;
4. a former root committed after migration could still enter retirement.

Minimal GREEN changes added commit/tree inventory and differences, exact-root
repository normalization at inventory and rebind, full root evidence in the
manifest, and a retirement-time fresh evidence comparison.

## Consolidated self-review repair

Self-review found one direct-interface bypass: an exported commit caller could
replace an otherwise valid inventory's repository identity with a foreign root.
The added RED assertion reproduced the bypass. The single consolidated repair
normalizes and validates repository identity again inside migration commit.

## Verification

- `node tools/fb-checkout-migration.test.cjs` — 32 checks passed.
- `node --check tools/fb-lane.cjs` — passed.
- `node --check tools/fb-checkout-migration.test.cjs` — passed.
- `git diff --check` — passed.

## Self-review

- Difference IDs bind both canonical and former `HEAD`/tree values, so stale
  dispositions cannot authorize later clean commits.
- The exact-root check covers path aliases through realpath resolution and also
  verifies Git's own top-level path.
- Commit re-validates repository identity instead of trusting a caller-supplied
  inventory; task rebind also rejects legacy or forged foreign-root manifests.
- Retirement compares the last committed per-root evidence with a fresh scan
  before either lifecycle transition and writes no state on mismatch.
- Existing migration APIs and lifecycle states remain intact; former roots stay
  recoverable and no actual retirement operation was executed.

## Remaining boundary

Task 4 is complete locally. Native sidebar onboarding remains Task 5. Package
generation, publication, installation/cache replacement, merge, actual checkout
retirement, deployment, and Push Live remain separately gated.

## Review fix round 1/5

Independent review found that task rebind compared a manifest and supplied
repository path to each other without resolving the manifest's `canonicalPath`
through Git. Matching values that both named a subdirectory inside the same
repository could therefore complete rebind even though Git's canonical
top-level was the parent directory.

Focused RED added a same-repository subdirectory manifest and supplied identity;
the rebind incorrectly completed. The repair now runs both the stored migration
identity and the supplied rebind identity through `canonicalMigrationRepository`
and verifies task inventory against the normalized canonical identity. Focused
GREEN is 33/33 migration checks; both amended CommonJS syntax checks and
whitespace validation pass. No broader suite or external action was run.

## Review fix round 2/5

Independent review found that snapshot and mutation guards could still trust a
manifest whose active `canonicalPath` was a subdirectory inside the repository.
The active-checkout record matched that same path, so load returned it before
the rebind-only Git-root validation ran.

Focused RED called `checkoutMigrationSnapshot` on a manifest whose canonical
path and repository path both named the same nested directory; snapshot
incorrectly accepted it. The repair now runs `canonicalMigrationRepository` at
the manifest-load trust boundary and returns only its normalized repository
identity. Existing noncanonical-guard fixtures were updated from plain temporary
directories to disposable Git repositories so they continue to model valid
canonical roots under the stricter invariant. Focused GREEN is 34/34 migration
checks; amended syntax and whitespace checks pass. No broader suite or external
action was run.
