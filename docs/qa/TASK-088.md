---
type: fb-verification-handoff
task: TASK-088
status: checking
---

# TASK-088 QA

## Candidate

- Branch: `codex/TASK-088-exact-receipt-rebind`
- Base: local TASK-087 candidate `947852b`
- Build: `0.9.2-beta+codex.20260818123922`
- Release boundary: no merge, push, publication, or release

## Verification ledger

- RED: replacement Product ID with an exact pinned final inventory was rejected
  because 0.9.1 required the archived receipt-bound ID to remain present.
- Candidate checks: root/package focused onboarding contract passes, including
  valid one-role replacement and rejection of wrong prior ID, wrong-role target,
  and missing approval.
- Root/package lifecycle version contract, package parity, syntax, and whitespace
  pass.

Pending: complete validator on a clean commit, exact local install/artifact/MCP
proof, fresh-task strict Unmirror reconcile, and consumer intake acceptance.
