---
type: fb-lane-handoff
task: TASK-084
lane: fb-product
status: ready-to-ship
approval: approved
record_model: normalized-v1
fb_harness: v3
learning_contract: v1
worktree: .worktrees/tech-TASK-084-harden-graph-fallback-precision-and-sensitive-matching
sensitive: false
work_types: tooling, safety, documentation
surface: FB project graph runtime and packaged Codex plugin
---

# TASK-084 — Graph fallback precision and sensitive-output hardening

## Status

Ready to ship — verified Full BFM candidate in an isolated worktree. No Push Live authority.

## Intake

- **Source**: Unmirror Product/BFM diagnosis on 2026-08-15.
- **Owner**: FB-Product / BFM, with isolated FB-Tech implementation.
- **Approval**: James said, “OK do those changes to FB-Lane.”
- **Visual Preview Decision**: Skip — this is nonvisual runtime and diagnostic behavior.

## Product Start Brief

Make normalized graph fallback precise and actionable without exposing graph content or weakening fail-closed credential protection.

## Goal Alignment Session

Product Goal: Keep graph-directed context safe and trustworthy when the
derived graph cannot answer a targeted question.

Lane OKR Fit: aligned — this removes an observed false positive and makes
fallback state accurately diagnosable.

Mini-loop Evidence: Focused context and orchestration contracts, package
parity, and a read-only Unmirror consumer smoke prove the bounded behavior.

Evidence Against Product OKR: The existing canonical graph-explanation docs
suite has one baseline failure in `skills/fb-setup/SKILL.md`; the same failure
is present on untouched `main` and is not caused by this candidate.

### Include now

1. Add stable reason codes for every normalized-record fallback path.
2. Distinguish an unhealthy graph, an unrepresented task, and insufficient active context.
3. Add bounded, content-free connectivity diagnostics only for insufficient active context.
4. Narrow sensitive matching so credential-shaped assignments still fail closed while harmless policy prose remains readable.
5. Document the reporting contract and synchronize generated plugin mirrors.

### Exclude

- Consumer-project or canonical-record mutation.
- Automatic repair of board, index, handoff, or card connectivity.
- Quarantined-root scanner performance changes.
- Installed-cache edits or credential inspection.
- Version bump, merge, push, publication, installation, or release.

## Build Brief

- Add focused tests before production changes.
- Preserve generic fallback messages and redact credential-shaped values.
- Diagnostics may contain fixed strings, booleans, and counts only; no node labels, scalar values, paths, or persisted content.
- Generate package mirrors only after root behavior is green.
- Run focused and relevant full verification, whole-candidate review, Doctor, and whitespace checks.

## Gate

Stop at **Ready to ship**. Merge, publication, installation, and release require a separate explicit **Push Live**.

## Task Receipt

- **Approval evidence**: James approved the three diagnosed FB-Lane graph
  changes on 2026-08-15.
- **Scope confirmation**: Runtime reason codes, content-free connectivity
  diagnostics, sensitive matching, tests, guidance, generated mirrors, and
  durable candidate records only.
- **Excluded authority**: No merge, push, publication, installation, or release.
- **Candidate identity**: Local branch
  `tech/TASK-084-harden-graph-fallback-precision-and-sensitive-matching` in the
  recorded isolated worktree.

## Product/BFM Closeout

- **Status**: Ready to ship — local isolated candidate; no Push Live.
- **Actioned By**: FB-Product / BFM.
- **Result**: Stable fallback reason codes, bounded insufficiency diagnostics,
  narrower credential-shaped sensitive matching, caller guidance, tests, and
  generated mirrors are complete.
- **Evidence**: [QA](../qa/TASK-084.md).
- **Remaining**: The pre-existing setup-skill canonical-explanation drift is
  separately recorded; merge, publication, installation, and release still
  require explicit Push Live.
- **Closeout Note**: Candidate is retained on its isolated local branch with
  locks intact and no consumer or installed-cache mutation.
- **Loop Learning**: Callers should report the runtime's stable fallback cause,
  while credential detection should identify credential-shaped values rather
  than poisoning the graph for harmless policy vocabulary.
