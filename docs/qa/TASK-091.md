---
type: fb-qa-artifact
task: TASK-091
record_model: normalized-v1
status: passed
---

# TASK-091 QA — Versioned graph contract and legacy exact-task adapter

## Candidate

- Build: `0.10.0-beta+codex.20260827100222`
- Branch: `codex/TASK-091-graph-contract`
- Base: `25b607e8f9428f51af44dafc9f1308f1a9e34b0e`
- Runtime candidate: `b4f56e7`
- Coordination candidate: `a47bf41`

Worktree: `/private/tmp/fb-graph-loops`
Environment: isolated canonical-source clone plus exact FB project lifecycle proof
Started: 2026-08-27
Completed: 2026-08-27

## Identity and Lifecycle Evidence

| Proof | Result |
|---|---|
| Source lineage | Branch from canonical TASK-090 head `25b607e8f9428f51af44dafc9f1308f1a9e34b0e` |
| Exact project | `local-a28d2eb514af1cd94520f53b30abe79e` at `/Users/jamesyeang/Documents/fb-lane` |
| Legacy failure | Five pinned tasks exposed null native project IDs while saved-project, exact-root, local-candidate, title, pin, and read-thread evidence agreed |
| RED proof | Native onboarding contract failed at the intended null-ID rejection |
| GREEN proof | Native contract passed; conflicting non-null project IDs remain rejected |
| Real inventory | Seven pinned FB tasks plus two ordinary exact-root tasks; no duplicate or replacement task |
| Stable-ID migration | Seven exact task IDs renamed from historical `FB-LANE` titles to current `FB` titles |
| Strict receipt | All seven IDs, titles, pins, and attempted actions recorded; `needsReconciliation: false` |

## Focused verification

| Command | Result |
|---|---|
| `node tools/fb-setup-native-onboarding.test.cjs` | Passed after observed RED |
| `node --test tools/fb-onboarding.test.cjs` | 38/38 passed |
| Exact `local-candidates` + `inventory-local` | Complete; nine exact-root user tasks, seven pinned canonical roles |
| Strict `reconcile` + `status` + `needs-reconciliation` | Passed; lifecycle gate healthy |
| Focused graph contract, compiler, propagation, scheduler, and BFM | 50/50 passed after observed RED |
| Canonical and packaged graph plus package-context contracts | 72/72 passed |
| Canonical and packaged onboarding suites | 76/76 passed; both native onboarding contracts passed |
| Plugin metadata | Canonical and packaged 0.10.0 build contracts passed |
| Package synchronization | 91 declared mirrors aligned |
| Whole-candidate review | Passed; contract ownership is centralized, v1 compatibility and authority gates remain explicit, no unrelated surface was reopened |

## Repair Record

One consolidated candidate repair corrected two stale metadata assertions and
one whitespace defect. The graph and onboarding runtime proofs stayed green;
no success criterion or safety boundary was weakened.

The first GitHub readiness run then exposed one portability-only omission: the
documented archive fallback copied `fb-project-graph.cjs` without its new graph
contract runtime and JSON dependency. The single focused integration repair
adds both files to that fallback. `node tools/fb-eval.test.cjs` passed 19/19,
including an exact clean-room fallback execution; no runtime criterion or
release gate was relaxed.

## Remaining Proof

None for the approved candidate. Merge, marketplace publication, reinstall,
and installed-runtime proof remain behind **Push Live**.

## Release checkpoint

Release checkpoint: requested and run once for exact committed candidate
`884a3f76b92d3f3e606c7391eec3277ef245fca4` after the targeted preflight,
Doctor Ready result, whole-candidate review, and clean repository state.

- Result: passed.
- Command: `node tools/fb-lane.validate.cjs`.
- Package parity: 91/91 declared mirrors.
- Core regression: 72/72.
- Checkout migration: 35/35.
- Doctor: Ready.
- Targeted release preflight: passed for TASK-091 candidate `884a3f7`.
- No second full validator or repair loop was run.

## Limits

No consumer project was mutated or deployed. Private thread content was not
persisted in evidence.

## Live release verification

| Layer | Result |
|---|---|
| Authority | James explicitly said **Push Live** in Product/BFM |
| Dependency release | [PR #69](https://github.com/friedbeef1/fb-lane-coordination/pull/69) merged as `4527b6a` |
| TASK-091 release | [PR #70](https://github.com/friedbeef1/fb-lane-coordination/pull/70) merged as `e1fcac5` after green readiness |
| Candidate identity | Reviewed `5bdcecd`; ancestry-only `e1db933` had the identical tree hash before merge |
| Marketplace | Git source `friedbeef1/fb-lane-coordination`, ref `main`, exact head `e1fcac5` |
| Installed build | `0.10.0-beta+codex.20260827100222`, installed and enabled |
| Installed parity | 94/94 declared package and distribution files byte-identical |
| Installed runtime | Manifests/graph JSON parse, required skills present, runtime syntax passed, MCP returned 14 tools including `fb_project_context` |
| Reload boundary | Open a new Codex task before further plugin-dependent work |
