# TASK-051 Task 3 implementation report

## Status

Complete with an unfavorable authoritative result. The context-efficient arm is
rejected because modeled token units exceeded the frozen gate. Task 4 is not
eligible, and no active guidance, plugin behavior, mirror, release surface, or
real-Codex work was changed or started.

## Scope

Added one cost-only context-efficient arm to the reviewed 288-case Graduated FB
benchmark. The candidate clones every reviewed Graduated FB outcome, call set,
public observation, required level, and common fallibility draw. It changes
only the frozen modeled costs derived from the implemented delta-context
excerpt bound and consolidated-repair behavior.

The reviewed Process-all, Full FB, and Graduated FB result/report files remain
byte-for-byte unchanged.

## Frozen model and declaration

The declaration was written and verified before the authoritative result
command. It fixes:

- authoritative modeled run count: `1`;
- candidate source arm: `graduated-fb`;
- behavior change: `cost-only`;
- delta-context fraction: `0.75`, from the pre-existing categorical
  `MAX_EXCERPT_FRACTION` implementation at
  `7053cba2531d3d6bfb7c766fa3790c3457f35f0a`;
- adjusted coordination/control calls: `focused`, `route`, `comparison`, `qa`,
  `safety`, `diagnosis`, and `repair`;
- unchanged costs: core `process` work and `humanDecision`;
- token rounding: conservative ceiling per call;
- repair reuse: one diagnosis packet, one eligible repair packet,
  failed-proof-only rerun, zero passed-proof rerun cost;
- no extra repair saving: the reviewed records already expose at most one
  diagnosis and repair and no per-proof rerun call, so no reviewed call was
  removed;
- all eight adoption predicates;
- unchanged privacy and **Push Live** release boundaries;
- preservation of every valid unfavorable result;
- no selective rerun, overwrite, post-result threshold tuning, or post-result
  model tuning.

## Frozen hashes

| Frozen item | SHA-256 |
|---|---|
| Candidate model | `99c05a97cc31674fa228efbdcfa88c36fc240c66bfbca040de06e9ca899049e4` |
| Thresholds | `e8f891188e00c97146b542db65f5c4db0c8573e48425f15556cf3a446c739479` |
| Runner/grader implementation | `227db66d61328638f35cc0f108816f8f1623ac259cea8e6df328129e3a312ee7` |
| Reviewed evidence identity | `2c1f53cda141aab0eba4f169452441a833e932932bcbd504e2434717758d6ada` |
| Complete declaration | `7aec353751d0e215c5425945b66660723dd16829d53e3f525613a6b375d6f6ac` |
| Reviewed result file | `a24c62093880bb6cc8ff93e0e873b402e75d7b3a63b0e83471ce4c9e07276f05` |
| Reviewed 864-record set | `af3cbca6e661587e595b11d6663c0ee4d821482c1af0a2c6b4d5f67b5433e2b7` |

The reviewed evidence identity is also bound to Git blob
`2bae8db62d7e2df7fff403690a6d98d6e7f42666` from commit
`d10e6eb17a62ecbce47c8f7701938a77f7d99850`.

## RED

Command:

```sh
node --test tools/fb-context-efficiency-benchmark.test.cjs
```

Observed expected RED before implementation: the focused test process failed
with `Cannot find module './fb-context-efficiency-benchmark.cjs'`.

The test names the production breaks it catches: incomplete reviewed-record
reproduction, changed common draws or outcomes, tuned or unbound model data,
incorrect recomputation, weakened all-predicate gating, mutable privacy/release
boundaries, and discarded unfavorable evidence.

## GREEN

Pre-freeze command:

```sh
node --test tools/fb-context-efficiency-benchmark.test.cjs
node --check tools/fb-context-efficiency-benchmark.cjs
git diff --check
```

Result: 8/8 focused tests passed; syntax and whitespace checks passed.

Post-result verification repeated the focused suite and obtained 8/8 passing
tests. It also parsed both JSON files, validated the authoritative machine
bundle against the frozen declaration, recomputed the candidate summary from
all 288 candidate records, and rechecked runner syntax and whitespace.

## Authoritative modeled run

The result/report targets were confirmed absent before the command. The runner
uses exclusive creation and refuses overwrite or in-place rerun.

Declared authoritative run count: `1`.

Sole authoritative command:

```sh
node tools/fb-context-efficiency-benchmark.cjs run
```

Observed result:

```text
Wrote docs/benchmarks/control-loop/context-efficiency-results.json and docs/benchmarks/control-loop/context-efficiency.md; adoption reject.
```

## Authoritative result

| Predicate | Result | Frozen gate | Pass |
|---|---:|---:|:---:|
| Raw modeled token units | 310,358 | no more than 298,080 | no |
| Raw modeled minutes | 555.375 | no more than 557.3 | yes |
| Readiness | 231/288 (80.2%) | at least 79.2% | yes |
| Missed required controls | 0 | 0 | yes |
| Immediate safety response | 100% | 100% | yes |
| Unresolved failures | 57 | no more than 57 | yes |
| Privacy boundary | preserved | preserved | yes |
| Release boundary | preserved | preserved | yes |

Tokens per ready outcome were 1,343.5. The sole failed predicate is
`modeledTokenUnits`, so the all-predicate decision is `reject`.

## Reviewed-file preservation

Pre-run and post-run SHA-256 values were identical:

| Existing reviewed file | SHA-256 |
|---|---|
| `docs/benchmarks/control-loop/README.md` | `d401b3e97414b41155aa9f4e39c5bcb21573c3edf88205816ec53371cbbc5226` |
| `docs/benchmarks/control-loop/results.json` | `c712975dc8b6eee2cb3a444a57e08ab8ce1a1fd65f57b0906f6c3c6afa9da679` |
| `docs/benchmarks/control-loop/fast-decay.md` | `bdae1f7b26a26c15bca35128c3f9c36736076907b41e622428a77e31ab7bffa1` |
| `docs/benchmarks/control-loop/fast-decay-results.json` | `7b6262fa8e84ea780ce0903b3798c24a41db021e930f8165955a5497618d829d` |
| `docs/benchmarks/control-loop/graduated.md` | `99b23f6cda7fabc3774b055dcd1805939cf85b791c64b263fe7c4b5ac766de8a` |
| `docs/benchmarks/control-loop/graduated-results.json` | `a24c62093880bb6cc8ff93e0e873b402e75d7b3a63b0e83471ce4c9e07276f05` |

## Files

- `tools/fb-context-efficiency-benchmark.cjs`
- `tools/fb-context-efficiency-benchmark.test.cjs`
- `docs/benchmarks/control-loop/context-efficiency-frozen-declaration.json`
- `docs/benchmarks/control-loop/context-efficiency-results.json`
- `docs/benchmarks/control-loop/context-efficiency.md`
- `.superpowers/sdd/2026-07-27-fb-context-repair-efficiency/task-3-report.md`

No active canonical guidance, plugin/package mirror, board, handoff, or
workstream record was changed.

## Self-review

- Reproduction is exact across all 864 reviewed records before candidate
  derivation.
- Candidate behavioral records retain the same Graduated FB observations,
  calls, outcomes, required levels, and common draws; only cost fields and arm
  identity change.
- Candidate totals are independently recomputed from raw records.
- Validation rejects mutations to evidence, draws, costs, summary, hashes,
  boundaries, thresholds, runner identity, or rerun policy.
- All eight adoption predicates must pass; a single raw-token failure cannot
  be normalized away by readiness or tokens-per-ready improvements.
- Exclusive evidence creation preserves the rejected result and blocks an
  in-place second authoritative write.
- The report presents raw modeled tokens and raw modeled time before readiness
  and tokens per ready outcome.

## Commit

Implementation, frozen declaration, and authoritative evidence:
`7e646066f05c27850827b7d27c4d89ccfc72b6dc`
(`test: evaluate context efficiency candidate`).

This report is recorded separately so the implementation/evidence commit
identity remains stable.

## Concerns

The candidate is rejected; Task 4 and adoption work must be skipped. The 0.75
cost multiplier is a transparent modeled mapping from an implemented
source-excerpt bound, not observed provider token or elapsed-time evidence.
Because reviewed records expose no per-proof rerun call, the model claims no
additional repair-reuse saving. No production or population-wide efficiency
claim is established.
