---
type: fb-lane-handoff
task: TASK-068
lane: fb-product
status: staging-qa
okr_fit: aligned
---

# TASK-068 — Cross-thread notification intake gate

## Goal Alignment Session

Product Goal: Keep BFM execution deliberate and predictable across concurrent chats.
Workstream Goal: Separate cross-thread delivery from receiving-thread execution authority.
Lane OKR Fit: aligned
User Approval Needed: no — James explicitly asked to lock in the correction on 2026-08-03.
Mini-loop Evidence: A `Sent by Codex from another chat` amendment for a different task was delivered while BFM was active and execution began immediately.
Evidence Against Product OKR: None identified.

## Approved brief

Cross-thread notifications are intake-only delivery receipts. Product/BFM may
reconcile and classify them, but delivery alone must not interrupt or execute
ahead of the active task.

## Decisions and scope

- Receive, reconcile, classify, and queue incoming notifications.
- A different task ID waits for the next BFM sequencing pass unless the user
  explicitly reprioritizes it in the receiving Product/BFM thread.
- A same-task amendment may continue automatically only when approved goal,
  scope, locks, safety gates, and release boundary remain unchanged.
- A boundary-changing amendment requires explicit receiving-thread approval
  before mutation.
- The rule lives in canonical guardrails, BFM guidance, parent-thread routing,
  packaged mirrors, and a focused behavior contract.
- No runtime queue, message interceptor, provider write, consumer app change,
  release, or deployment is included.

## Acceptance

- Canonical and packaged guidance use the same intake-only rule.
- The focused contract rejects loss of the delivery-receipt, queue, and
  receiving-thread approval language.
- Existing sidechat mutation and safety gates remain unchanged.

## Product/BFM Closeout

Status: Staging QA.
Actioned By: FB-Product / BFM.
Result: The missing receiver-side gate is implemented in canonical and packaged guidance and refreshed in the active local plugin cache.
Evidence: See [TASK-068 QA](../qa/TASK-068.md).
Remaining: Product review and a separate explicit decision for merge, plugin release, publication, or marketplace installation.
Closeout Note: Cross-thread delivery no longer grants execution priority or authority.
Loop Learning: Execution authority must be checked at both ends: the sending side and the receiving BFM intake path.
