---
type: fb-lane-handoff
task: TASK-084
lane: fb-product
status: ready
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
- Consumer deployment or changes beyond the approved plugin release.

## Build Brief

- Add focused tests before production changes.
- Preserve generic fallback messages and redact credential-shaped values.
- Diagnostics may contain fixed strings, booleans, and counts only; no node labels, scalar values, paths, or persisted content.
- Generate package mirrors only after root behavior is green.
- Run focused and relevant full verification, whole-candidate review, Doctor, and whitespace checks.

Changelog expectation: Required — publish a candidate-faithful 0.8.2-beta
entry with exact installation and release evidence.

## Gate

Stop at **Ready to ship**. Merge, publication, installation, and release require a separate explicit **Push Live**.

External gates: Complete — James explicitly said **Push Live** on 2026-08-15,
authorizing merge, publication, installation, and release of this exact
candidate after the release gates pass.

Remaining owner/action: Product/BFM completes the exact candidate release,
installed-runtime proof, and durable live closeout.

## Task Receipt

Approved brief and decisions: Implement the three approved graph repairs,
preserve authoritative fallback and credential safety, then release only after
James says Push Live.

Confirmed assumptions and approved scope changes: Consumer records remain
unchanged; the 0.8.2-beta version and release-record updates are the only scope
addition authorized by Push Live.

Branch, source commits, and changed surfaces: Branch
`tech/TASK-084-harden-graph-fallback-precision-and-sensitive-matching`; base
`0594ee0`; implementation `fc634c9`; graph runtime, focused contracts,
guidance, package mirrors, and release records; exact build
`0.8.2-beta+codex.20260815070021`.

Checks, failures, recovery, and results: Focused root/package checks, graph
suites, package parity, consumer smoke, records, syntax, whitespace, and Doctor
passed. One unchanged canonical-explanation baseline failure is preserved in
QA and reproduced on untouched main.

Review state, direct links, limits, and external gates: Whole-candidate review
passed; [QA evidence](../qa/TASK-084.md); [Changelog](../../CHANGELOG.md#082-beta--2026-08-15);
no consumer deployment; Push Live approved on 2026-08-15.

Repository state: Clean isolated candidate before release-record preparation;
canonical main contains coordination commits only.

Remaining owner and action: Product/BFM runs candidate preflight, release
checkpoint, exact merge/publication/install proof, live reconciliation, and
live preflight.

Changelog: Updated — TASK-084 is the 0.8.2-beta release entry.

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
