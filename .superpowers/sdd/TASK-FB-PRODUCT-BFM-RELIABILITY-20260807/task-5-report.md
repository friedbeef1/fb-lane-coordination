# Task 5 Report: Native exact-project sidebar onboarding

## Status

PASS — the canonical `$fb-setup` workflow now owns the real Codex-native
project/task discovery, create, rename, and pin calls. It runs the verified Node
planner first, records each attempted native action, re-lists the exact project,
and invokes the strict reconcile/receipt CLI only after all seven exact titles,
task IDs, and pinned states are proven.

The Node onboarding module remains the pure planner/verifier/receipt boundary.
Its misleading injectable native-action executor and executor-only tests were
removed. Native control failure, incomplete inventory, ambiguous project
identity, missing created-task IDs, and strict-reconcile failure remain honest
unreconciled outcomes with role-specific fallback. Successful or uncertain
creates are never retried as duplicate creates.

No package mirrors were generated. No publication, installation/cache
replacement, merge, push, deployment, checkout retirement, provider mutation,
or **Push Live** action was performed.

## Files

- `skills/project-coordination-setup/SKILL.md`
- `tools/fb-onboarding.cjs`
- `tools/fb-onboarding.test.cjs`
- `tools/fb-setup-native-onboarding.test.cjs`
- `tools/fb-package-manifest.json`
- `.superpowers/sdd/TASK-FB-PRODUCT-BFM-RELIABILITY-20260807/task-5-report.md`

## TDD evidence

The focused structural contract was written before the production edit.

Initial RED:

```text
AssertionError: setup must define project discovery
```

This proved the canonical setup skill lacked the required native
exact-project route. A second focused RED proved the new contract was not yet
declared for later package generation. Self-review added one final RED for
created-task exact-title correction before adding that instruction.

GREEN:

```text
FB setup native onboarding contract passed.
```

## Verification

- `node tools/fb-setup-native-onboarding.test.cjs` — passed.
- `quick_validate.py skills/project-coordination-setup` — `Skill is valid!`.
- `node --check tools/fb-onboarding.cjs` — passed.
- `node --check tools/fb-onboarding.test.cjs` — passed.
- `node --check tools/fb-setup-native-onboarding.test.cjs` — passed.
- Changed skill relative-link check — 11 links valid.
- `tools/fb-package-manifest.json` parse — passed.
- `git diff --check` — passed.

Per the task boundary, no broad suite, package synchronization, mirror
generation, release validator, or doctor run was performed.

## Self-review

- Exact project identity requires both the selected project ID and canonical
  repository path before discovery can authorize a plan.
- Raw arrays, truncated/search-only pages, unreliable pagination, and mixed
  project inventories cannot trigger mutation.
- Only planner actions are executed. `reuse` is non-mutating; reruns re-list
  and re-plan, then create only roles still missing.
- Every native call is entered in the attempted-action ledger before it runs
  and receives its returned ID/outcome afterward.
- Created tasks use the exact project and idle prompt. If creation cannot set
  the exact title, the returned ID is titled through a separately recorded
  native call before pinning.
- A failed or uncertain create is never blindly repeated. Partial failure
  stops immediately and cannot reach the success receipt.
- Strict reconcile remains the only receipt-writing completion route and
  verifies all seven exact titles, executable IDs, and pinned states.
- `$fb-setup`, standing delegated approvals, idle tasks, `$bfm` separation,
  and the **Push Live** release boundary remain intact.

## Remaining boundary

Task 5 is complete locally. Task 6 owns one-time generation of the declared
package mirrors, aligned broader guidance and release records, package/consumer
evidence, and the next truthful local candidate. Publication, install/cache
replacement, merge, push, deployment, actual checkout retirement, and
**Push Live** remain separately gated.

## Review fix round 1/5

Status: PASS.

The review identified four trust-boundary gaps and this round closes them:

- The canonical skill now calls `list_threads` with its supported
  `{"limit":100}` argument only, then filters the returned inventory by the
  verified project ID and, whenever exposed, the canonical repository path.
  Contradictory, truncated, or otherwise incomplete identity evidence fails
  closed before mutation.
- Planning and reconciliation require both a nonempty verified project ID and
  canonical repository root through explicit CLI flags. The pure planner and
  direct verified-receipt API enforce the same two-part identity boundary.
- The normalized, deterministic, privacy-safe `attemptedActions` ledger is
  required for strict reconciliation, preserves failed and unknown attempts,
  and is written into the receipt with a SHA-256 integrity binding.
- The focused native contract now checks the supported native call shape,
  one-sided and whitespace-only identity rejection, partial-action ledger
  preservation, privacy-field rejection, receipt persistence, and hash
  determinism.

Additional RED evidence:

```text
AssertionError: setup must show the supported list_threads argument object
```

After the first repair, the existing focused onboarding suite exposed stale
one-sided identity fixtures (16 passed, 10 failed). Those fixtures were updated
to exercise the required two-part identity without weakening assertions.
Self-review then added a final RED proving a whitespace-only `--project-id`
still exited successfully; shared identity validation closed both that CLI path
and the direct receipt-write bypass.

Final focused verification:

- `node tools/fb-setup-native-onboarding.test.cjs` — passed (1 contract).
- `node tools/fb-onboarding.test.cjs` — passed (26/26).
- `quick_validate.py skills/project-coordination-setup` — `Skill is valid!`.
- `node --check` for all three changed CJS files — passed.
- Changed skill relative-link check — 11/11 valid.
- `git diff --check` — passed.

No mirror generation, package synchronization, broad suite, release action,
publication, install/cache replacement, merge, push, deployment, provider
mutation, or **Push Live** action was performed.
