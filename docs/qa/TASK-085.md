---
type: fb-verification-handoff
task: TASK-085
status: passed
---

# TASK-085 QA

Status: Source and packaged focused verification plus second-pass review pass
for committed source candidate `87a5fcc`; corrected record preflight and Doctor
rerun remain.

## Candidate

- Branch: `tech/TASK-085-select-canonical-user-handoffs-and-ready-to-ship-records-without-weakening-duplicate-drift-or-exact-project-gates-synchronize-and-verify-the-packaged-plugin`
- Worktree: `.worktrees/tech-TASK-085-select-canonical-user-handoffs-and-ready-to-ship-records-without-weakening-duplicate-drift-or-exact-project-gates-synchronize-and-verify-the-packaged-plugin`
- Base: `origin/main` at task claim
- Source candidate commit: `87a5fcc`
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

The Unmirror rerun added three bounded RED cases: historical handoffs were
incorrectly forced through current board/index/card routing, and an approved
post-migration handoff revision had no source-bound exact-current recovery.
The review follow-up also proved a newly observed source root could not be
accepted without being enumerated in the exact packet and recorded in refreshed
migration evidence. They failed on the pre-repair runtime with the expected
`BFM_INTAKE_INCOMPLETE` / `HANDOFF_ROUTING_RECEIPT_REQUIRED` boundaries.

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

- Focused regressions: 8/8 passed.
- Root suites: intake 19/19, migration 35/35, onboarding 39/39.
- Package synchronization: 86/86 mirrors match.
- Packaged suites: intake 19/19, migration 35/35, onboarding 39/39.
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

The historical fixture proves non-candidate records receive content-only
receipts and do not acquire invented modern routing. The approved-revision
fixture rejects a wrong current hash, accepts only an exact canonical/source
hash-and-root packet tied to one prior disposition and durable approval
reference, rejects duplicate roots, and still fails when that prior migration
evidence is absent. The multi-source fixture rejects an omitted current root
and atomically records exact migration evidence for every enumerated source.

## Whole-candidate review

Second-pass review passed with no Critical or Important findings. It verified
that reconciliation exact-enumerates every current source, rejects duplicate or
malformed entries, atomically refreshes source-bound migration evidence with a
durable approval reference, leaves historical non-Ready recovery independent
of absent modern routing surfaces, and preserves the complete Push Live gate.

## Release checkpoint

Requested plan: run the targeted candidate preflight after Product/BFM review
and commit, using the pre-claim base so the board claim remains inside the
candidate evidence range. The bounded local reinstall is separately approved;
do not merge, push, publish, deploy, or release without exact
current-conversation **Push Live**.

## Final checks

Current candidate checks are 186/186 across root/package intake, migration,
and onboarding suites; 86/86 package mirrors; root/package syntax; and
whitespace. The first committed-state preflight and Doctor correctly found the
board/handoff status-family mismatch now repaired in the pending docs commit;
their corrected-record rerun remains.

## Safety and release boundary

- Duplicate-task and cross-root drift tests remain green.
- Exact-project onboarding and disposition gates remain green.
- No credentials or provider state were read or changed.
- No merge, push, marketplace publication, installation, or release occurred
  at this evidence checkpoint.
- James explicitly authorized a bounded local install and fresh-task reload on
  2026-08-16. Merge, push, publication, deployment, and release remain behind
  exact current-conversation **Push Live**.
