---
type: fb-verification-handoff
task: TASK-085
status: passed
---

# TASK-085 QA

Status: Source and packaged focused verification pass for the current
working-tree candidate; final candidate preflight and Doctor remain.

## Candidate

- Branch: `tech/TASK-085-select-canonical-user-handoffs-and-ready-to-ship-records-without-weakening-duplicate-drift-or-exact-project-gates-synchronize-and-verify-the-packaged-plugin`
- Worktree: `.worktrees/tech-TASK-085-select-canonical-user-handoffs-and-ready-to-ship-records-without-weakening-duplicate-drift-or-exact-project-gates-synchronize-and-verify-the-packaged-plugin`
- Base: `origin/main` at task claim
- Source candidate commit: pending after Product/BFM review
- Test mode: local, provider-dark, temporary fixtures only

## RED

Command:

```bash
node --test --test-name-pattern='canonical scan keeps User|repository-configured titles|routing receipt refresh' tools/fb-bfm-intake-ledger.test.cjs tools/fb-checkout-migration.test.cjs
```

Result: five independent failures: User was collapsed into Product, the valid
`Unmirror · …` receipt was `partial`, and `migration refresh-routing` was not
available; an ordinary migration erased existing receipts; and erased receipts
could not be rebuilt from their still-matching dispositioned migration hashes.

## Focused verification

Commands:

```bash
node --test --test-name-pattern='canonical scan keeps User|repository-configured titles|routing receipt refresh|migration inventory preserves existing routing receipts' tools/fb-bfm-intake-ledger.test.cjs tools/fb-checkout-migration.test.cjs
node --test tools/fb-bfm-intake-ledger.test.cjs tools/fb-checkout-migration.test.cjs tools/fb-onboarding.test.cjs
node tools/fb-package-sync.cjs --write
node tools/fb-package-sync.cjs --check
node --test plugins/fb-lane-coordination/tools/fb-bfm-intake-ledger.test.cjs plugins/fb-lane-coordination/tools/fb-checkout-migration.test.cjs plugins/fb-lane-coordination/tools/fb-onboarding.test.cjs
node --check tools/fb-lane.cjs
node --check plugins/fb-lane-coordination/tools/fb-lane.cjs
git diff --check
```

Current results:

- Focused regressions: 5/5 passed.
- Root suites: intake 16/16, migration 35/35, onboarding 39/39.
- Package synchronization: 86/86 mirrors match.
- Packaged suites: intake 16/16, migration 35/35, onboarding 39/39.
- Root/package syntax: passed.
- Whitespace: passed.

## Receipt-refresh safety proof

The successful CLI fixture starts from an existing dispositioned source-bound
receipt, changes only canonical board routing, atomically refreshes canonical
and source routing hashes, and then passes intake. After off-home handoff
content changes, the same refresh fails with `HANDOFF_CONTENT_DRIFT` and the
checkout-local manifest remains byte-identical. The command also requires the
managed canonical checkout, complete authoritative routes, unchanged source
roots, and no unresolved migration difference.

The preservation fixture proves a repeat migration keeps an existing receipt
unless the caller explicitly supplies replacement state. The recovery fixture
starts with an erased receipt and succeeds only because the recorded canonical
and source SHA-256 values, roots, and one disposition exactly match the current
handoff inventory; the rebuilt receipt then passes BFM intake.

## Whole-candidate review

Pending final Product/BFM candidate review. Current focused evidence shows the
shared predicate preserves the audit grammar, User is distinct from Product,
configured titles reuse the strict onboarding contract, and routing refresh
cannot authorize content drift.

## Release checkpoint

Requested plan: run the targeted candidate preflight after Product/BFM review
and commit, using the pre-claim base so the board claim remains inside the
candidate evidence range. The bounded local reinstall is separately approved;
do not merge, push, publish, deploy, or release without exact
current-conversation **Push Live**.

## Final checks

Current working-tree checks are 180/180 across root/package intake, migration,
and onboarding suites; 86/86 package mirrors; root/package syntax; and
whitespace. Final candidate preflight, Doctor, and committed-state checks remain.

## Safety and release boundary

- Duplicate-task and cross-root drift tests remain green.
- Exact-project onboarding and disposition gates remain green.
- No credentials or provider state were read or changed.
- No merge, push, marketplace publication, installation, or release occurred
  at this evidence checkpoint.
- James explicitly authorized a bounded local install and fresh-task reload on
  2026-08-16. Merge, push, publication, deployment, and release remain behind
  exact current-conversation **Push Live**.
