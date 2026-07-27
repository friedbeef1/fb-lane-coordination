# TASK-051 Task 1 implementation report

## Scope

Implemented the opt-in canonical delta-context and BFM-reconciliation compilers only. No CLI command, plugin mirror, skill guidance, benchmark result, TASK-050 record, or coordination document was changed.

## Files

- `tools/fb-project-graph.cjs` — exported `compileDeltaContext` and `compileBfmReconciliation` plus bounded extraction, delta-source state, safety fallback, and six-workstream reconciliation helpers.
- `tools/fb-project-graph-context.test.cjs` — focused compiler contracts.

## RED

Command:

```sh
node --test tools/fb-project-graph-context.test.cjs
```

Observed expected failure before implementation: 4 failing tests, all because `compileDeltaContext` or `compileBfmReconciliation` was not a function. The first failure was `TypeError: compileDeltaContext is not a function` at the requested extraction/cap/delta behavior.

## GREEN

Command:

```sh
node --test tools/fb-project-graph.test.cjs tools/fb-project-graph-plugin.test.cjs tools/fb-project-graph-context.test.cjs
```

Result: 19 passed, 0 failed. Also passed `node --check tools/fb-project-graph.cjs` and `git diff --check`.

## Self-review

- Compiler validates safe task IDs, the exact six workstreams, required question/output, and forbidden/transcript-like content before reading evidence.
- Packet schema is `fb-context-packet-v1`; citations cap at four; changed excerpts cap at 1,600 per source and 4,000 overall; returned hashes convert repeated evidence to hash-only references.
- Full handoffs and QA documents cannot be embedded: handoff extraction is section-only and every excerpt is bounded below the source size.
- Missing/unsafe/contradictory/sensitive sources and unhealthy graphs return a normalized-record fallback.
- Reconciliation produces all six explicit dispositions, excludes terminal/unchanged statuses, and blocks duplicate ready task IDs.
- Existing graph and plugin-context tests pass unchanged; no plugin or skill activation was added.

## Commit

`679abaf000934102f227b039ca816482f651e394` (`feat: add delta context compiler`); amended after this report update.

## Concerns

None. This is intentionally an exported canonical runtime API only; Product may decide whether and when to expose it after the adoption gates.

## Review repair — round 1

### Scope

Resolved all six findings from `task-1-review.md` without adding a CLI command, plugin mirror, or guidance activation:

- validate every emitted candidate source, including linked QA and board-derived objective content, before hashing or emitting it;
- reject sensitive/private and overlong caller fields; omit the raw question from the packet;
- select a bounded, question-relevant section or paragraph and keep excerpts below a conservative 600-character ceiling;
- return every changed qualifying handoff in a workstream;
- reject direct and realpath/symlink source escapes;
- add adversarial tests for the repaired boundaries.

### RED

Command:

```sh
node --test tools/fb-project-graph-context.test.cjs
```

Observed expected RED before the repair: 4 new failures out of 8 tests. The failures showed linked bearer data and `password=hunter2` inputs still producing `project-graph`, a short QA excerpt containing `QA_DO_NOT_EMBED`, and same-workstream reconciliation omitting `TASK-777`.

After adding an explicit concrete-question relevance test, the same command produced the expected second RED: 1 failure out of 9 tests because the QA excerpt was `UNRELATED_BACKGROUND` rather than `RUN_FOCUSED_PROOF`.

### GREEN

Commands:

```sh
node --test tools/fb-project-graph-context.test.cjs
node --test tools/fb-project-graph.test.cjs tools/fb-project-graph-plugin.test.cjs tools/fb-project-graph-context.test.cjs
node --check tools/fb-project-graph.cjs
git diff --check
```

Results: focused context suite 9 passed, 0 failed; combined graph/context/plugin suite 24 passed, 0 failed; syntax and whitespace checks passed.

### Repair self-review

- Sensitive/private content is now blocked consistently in all caller fields and every selected source before hashes, excerpts, or the board objective are returned.
- The packet contains no raw question; required output is only retained after the same content gate and a 1,000-character bound.
- QA/document selection favors concrete-question keywords, omits internal sections, and cannot emit a complete short source because the excerpt is independently capped beneath source size.
- Reconciliation preserves all qualifying handoffs and records them in the workstream disposition while retaining the four-citation cap.
- Direct symlinks are rejected and resolved paths must remain under the resolved project root.

### Repair commit

`fb332ee1c14e16d497a2f9b30d3bee1387ce439b` (`fix: harden delta context compiler`).

### Repair concerns

None.
