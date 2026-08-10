---
type: fb-verification-handoff
task: TASK-082
status: checking
---

# TASK-082 QA

Status: Checking — focused canonical evidence is green; integrated review and release checkpoint remain.

## Candidate

- Branch: `codex/task-082-retro-release-hardening`
- Build: `0.8.0-beta+codex.20260810034353`
- Base: `74a017b`

## Verification plan

- Focused release-record preflight contracts.
- `fb-release` behavioral forward-tests and skill validation.
- Manifest-derived archive dependency contract.
- Root/package generation and parity.
- Affected syntax, links, Doctor, and whitespace.
- One whole-candidate review.
- One final release validator.

## Focused verification

| Proof | Result | What it establishes |
|---|---:|---|
| Release preflight contracts | Passed 14/14 | Missing handoff/board evidence, omitted marker, dirty or mismatched Git, unresolved links, candidate/live contradictions, bold receipt fields, complete normalized-record checks, and complete candidate/live records behave as specified. |
| Release-skill contract | Passed | The skill is model-invoked only by **Push Live** in Product/BFM and preserves exact candidate, marketplace-source, installed-runtime, durable-closeout, and new-task boundaries. |
| Normalized record contracts | Passed 16/16 | New normalized records retain the early Goal Alignment contract while historical records remain compatible. |
| Eval and fallback archive contract | Passed 19/19 | The fallback fixture is derived from the canonical package manifest and the documented bootstrap acquires every declared runtime and canonical asset. |
| Package synchronizer unit contracts | Passed 10/10 | Manifest paths, writes, executable modes, undeclared extras, and traversal protection remain deterministic. |
| Skill validator | Passed | `skills/fb-release/SKILL.md` has valid model-invoked skill structure. |
| Lifecycle/version and plugin metadata contracts | Passed | All active release surfaces agree on `0.8.0-beta+codex.20260810034353`, the new skill, source-type routing, installed proof, and the **Push Live** boundary. |
| Affected Node syntax and whitespace | Passed | The new runtime/tests parse and the current candidate has no whitespace errors. |

The first focused pass found two bounded candidate defects: the changelog test expected the exact phrase across a hard line break, and the manual bootstrap dependency list omitted `fb-release-preflight.cjs`. One focused correction made the contract line-insensitive in content and added the runtime; only the two failed proofs were rerun, and both passed.

## Fresh-agent forward tests

Three fresh read-only agents applied `fb-release` to adversarial scenarios. They did not mutate Git, marketplaces, plugin caches, or external state.

| Scenario | Result |
|---|---|
| Incomplete selected handoff, missing board Gate/Justification, unresolved QA, clean branch, and apparent Ready-to-ship status | Stopped before merge or marketplace inspection and requested the exact one-pass preflight evidence. |
| Configured local marketplace with a clean exact candidate | Selected the local-source route, refused a Git-only refresh as proof, and required exact installed-artifact hashes plus a new Codex task. |
| Published version with an active-cache build/hash mismatch, plus a consumer name in public copy | Reported split truth, refused release completion, required exact reinstall proof, and kept project-specific evidence in QA rather than public copy. |

## Whole-candidate review

Completed once against `74a017b..01510ef`. The reviewer reported no Critical
or security/privacy finding and three Important integration issues:

1. the receipt parser did not parse the repository's own `**Label:**` form;
2. the selected release preflight did not yet reuse the complete normalized
   record contract, allowing a later Doctor failure;
3. TASK-080/TASK-081 current-state sections retained obsolete new-task actions.

One consolidated repair now accepts both bold-label forms, applies normalized
validation to the selected task even when its marker is omitted, removes the
invalid no-supersession line and fixes the normalized template, and reconciles
the stale current actions without rewriting historical candidate evidence.
Only the affected preflight/records proofs were rerun; both are green.

## Release checkpoint

Release checkpoint: requested and planned once after the whole-candidate review, clean-candidate preflight, package parity, links, Doctor, syntax, and whitespace pass. It will run the complete repository validator exactly once for the final committed candidate.

## Known limits

- Forward tests are bounded fresh-agent simulations, not live marketplace mutations.
- Git history does not provide authoritative elapsed-time or provider-token savings.
- Consumer-project evidence proves only the named setup behavior and is not a universal product or device claim.
- This task prepares a review candidate only. Merge, publication, reinstall, and live verification still require **Push Live**.

## Evidence boundary

No release, merge, marketplace update, or reinstall is authorized before **Push Live**. Public release copy remains product-generic; named consumer evidence remains in linked historical QA.
