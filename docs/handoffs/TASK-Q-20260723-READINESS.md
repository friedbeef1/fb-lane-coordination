---
type: fb-lane-handoff
task: TASK-Q-20260723-READINESS
lane: fb-product
status: implemented
approval: approved
record_model: normalized-v1
okr_fit: aligned
---

# TASK-Q-20260723-READINESS — Handoff readiness false-negative guardrail

## Decision

An empty normalized typed-handoff scan is not sufficient evidence that no Ready
handoffs exist. When the canonical scan selects none, FB must check for
legacy Ready-like handoffs in the authoritative checkout and for Ready-like
handoffs in linked worktrees. Any such evidence stops intake for Product
reconciliation.

## Assumptions

- Normalized typed metadata remains the only automatic selection authority.
- Linked-worktree records are drift evidence, not automatically executable scope.
- Historical handoffs remain untouched and may retain prose-only status fields.

## Scope

- Recognize the repository’s existing prose status forms when performing the
  fallback audit.
- Inspect every linked worktree only when the canonical typed scan is empty.
- Return a deterministic reconciliation failure containing bounded record
  locations.
- Align canonical and packaged runtime, tests, BFM guidance, and guardrail docs.

## Out of Scope

Historical metadata rewrites, silent worktree merging, off-home execution,
consumer-project source changes, release, publication, installation, or
deployment.

## Dependencies

Build from FB `main` commit `4b743ad3`, after TASK-047’s normalized record model
landed. Preserve its one-authoritative-home contract.

## Acceptance Criteria

- A normal typed Ready handoff remains selected exactly as before.
- A truly empty repository still reports no relevant handoffs.
- An empty typed scan plus a canonical legacy Ready handoff raises a
  reconciliation error.
- An empty typed scan plus a linked-worktree Ready handoff raises the same error.
- The fallback recognizes `Status: Ready`, `**Status:** Ready`,
  `- **Status**: Ready`, and `- **Status:** Ready`, with the last status winning.
- Ready-qualified values such as `Ready for sequencing` and
  `Ready — Full BFM required` are treated as Ready-like evidence.
- Off-home records are never silently selected or executed.
- Typed terminal/blocked status overrides stale prose Ready text.
- Failure to enumerate Git worktrees stops with
  `HANDOFF_AUTHORITY_UNAVAILABLE`; it never promotes the caller worktree.
- Canonical/package runtime and tests remain byte-aligned.

## Verification

Focused test-first regression, root/package scanner tests, runtime/test parity,
syntax, and whitespace checks. See the [QA artifact](../qa/TASK-Q-20260723-READINESS.md).
No release checkpoint is requested.

## Compact Closeout

Status: Staging QA; Ready to ship.
Delivered: Fail-closed empty-scan reconciliation, legacy Ready compatibility,
typed-status authority, linked-worktree drift detection, package parity, and
generic BFM/guardrail guidance.
Checks: Root/package scanner suites 78/78; 41 package mirrors; canonical/package
syntax; whitespace; real MirrorCam reconciliation smoke; one runtime review.
Evidence: [QA artifact](../qa/TASK-Q-20260723-READINESS.md).
Remaining gates: Commit and push this isolated branch; future merge/release is
separate and requires the normal release authorization.
Next owner: Product / BFM.
Release boundary: No merge, publication, marketplace update, installation, or
deployment is authorized.
