---
type: fb-verification-handoff
task: TASK-080
review_state: staging candidate
status: checking
---

# TASK-080 QA — Automatic Direct-vs-Graph BFM routing

## Candidate

- Version: `0.7.0-beta+codex.20260809013127`
- Branch: `codex/graph-driven-orchestration`
- Consolidated router repair: `025a8cb`
- Release authorization: James explicitly authorized making the candidate live,
  publishing it, and installing it in the current Product/BFM task.

## Focused verification

| Contract | Result |
|---|---:|
| Automatic router and compiler-to-BFM integration | 6/6 passed |
| Project graph compiler and bounded context | 25/25 passed |
| Candidate-scoped BFM graph adapter | 5/5 passed |
| Dependency, conflict, lock, and worktree scheduler | 9/9 passed |
| Complete authoritative intake ledger | 12/12 passed |
| Graph documentation and package contract | 7/7 passed |
| Package mirrors | 80/80 aligned |
| Whitespace | passed |

## Whole-candidate review and repair

The one whole-candidate review found the graph path was optional,
repository-wide, weakly validated, and not yet authoritative-evidence driven.
One consolidated behavioral repair added automatic routing, candidate-scoped
execution data, greedy lock serialization, live applicable lessons, semantic
invalidation, projection revalidation, sensitive-value redaction, safe legacy
IDs, and evidence-based integration/readiness. No second review or repair loop
was run.

## Release checkpoint

The initial complete validator stopped at one stale session-test expectation:
Quick-v3 runtime records correctly said `Review required: no`, while the old
fixture still expected `yes`. The runtime and lean-review policy were unchanged.
The fixture was corrected, its root and packaged session suites both passed
39/39, and package parity remained 80/80. One final post-repair checkpoint is
authorized; GitHub readiness and installed-build verification follow it.

## Test This Now

What this is:
- Staging candidate for the FB plugin release.

Open:
- [TASK-080 handoff](../handoffs/TASK-080.md)
- [Changelog](../../CHANGELOG.md#070-beta--2026-08-09)

Test plan:
1. Run the focused router contract and expect Direct only for one isolated item.
2. Exercise every declared graph signal and expect graph-driven orchestration.
3. Corrupt or remove derived graph state and expect visible authoritative-record
   fallback without a user mode choice.
4. Run the complete release validator and expect all repository contracts to
   pass once.

Pass criteria:
- Automatic route and reasons are visible.
- No graph signal is silently sent through Direct BFM.
- Missing or corrupt graph state fails safely to authoritative records.
- Package, metadata, documentation, and runtime remain aligned.

Known limits:
- This does not add a graph database, hosted graph service, or cross-project
  learning.

If it fails:
- Record the failed contract, exact output, candidate commit, and one bounded
  recovery action in this QA artifact.
