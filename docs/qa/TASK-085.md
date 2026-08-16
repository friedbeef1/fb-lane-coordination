---
type: fb-verification-handoff
task: TASK-085
status: passed
---

# TASK-085 QA

Status: Source and packaged focused verification pass for committed follow-up
candidate `ef0d064`; candidate preflight passed at `338f997`, Doctor reports
Ready, and the bounded local reinstall remains.

## Candidate

- Branch: `tech/TASK-085-select-canonical-user-handoffs-and-ready-to-ship-records-without-weakening-duplicate-drift-or-exact-project-gates-synchronize-and-verify-the-packaged-plugin`
- Worktree: `.worktrees/tech-TASK-085-select-canonical-user-handoffs-and-ready-to-ship-records-without-weakening-duplicate-drift-or-exact-project-gates-synchronize-and-verify-the-packaged-plugin`
- Base: `origin/main` at task claim
- Source candidate commits: `87a5fcc`, `ef0d064`
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

The 2026-08-17 consumer follow-up added two RED cases. Exact task IDs wrapped
in Markdown code ticks produced a false missing-index route, and an erased
receipt could not be rebuilt when an additional linked checkout was byte-for-
byte canonical-identical but therefore had no migration difference row. A
negative control changed that linked handoff and still required exact evidence.

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

- Focused regressions: 10/10 passed.
- Root suites: intake 21/21, migration 35/35, onboarding 60/60.
- Package synchronization: 86/86 mirrors match.
- Packaged suites: intake 21/21, migration 35/35, onboarding 60/60.
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
The linked-copy fixture accepts only a current source whose content SHA-256 is
exactly canonical-identical while retaining the one prior disposition; its
content-different control remains blocked. The index fixture accepts only an
exact code-wrapped token that still passes the existing safe task-ID validator.

## Whole-candidate review

Second-pass review passed with no Critical or Important findings. It verified
that reconciliation exact-enumerates every current source, rejects duplicate or
malformed entries, atomically refreshes source-bound migration evidence with a
durable approval reference, leaves historical non-Ready recovery independent
of absent modern routing surfaces, and preserves the complete Push Live gate.

## Release checkpoint

Result: targeted candidate preflight passed at `338f997` against pre-claim base
`00c13928d0a12fbabca1584d230f93408e9ab496`; Doctor reported Ready with a clean
committed worktree. Next plan: perform the separately approved bounded local
reinstall and stop for a fresh-task runtime reload;
do not merge, push, publish, deploy, or release without exact
current-conversation **Push Live**.

## Final checks

Current candidate checks are 232/232 across root/package intake, migration,
and onboarding suites; 86/86 package mirrors; root/package syntax; and
whitespace. The first committed-state preflight and Doctor correctly found the
board/handoff status-family mismatch repaired in status commit `308feb1`;
the corrected-record rerun passed. Final docs-only closeout changes are
covered by the same candidate preflight and Doctor rerun before install.

## Safety and release boundary

- Duplicate-task and cross-root drift tests remain green.
- Exact-project onboarding and disposition gates remain green.
- No credentials or provider state were read or changed.
- No merge, push, marketplace publication, installation, or release occurred
  at this evidence checkpoint.
- James explicitly authorized the runtime repair, bounded local install, and
  fresh-task reload on 2026-08-17. Merge, push, publication, deployment, and release remain behind
  exact current-conversation **Push Live**.
