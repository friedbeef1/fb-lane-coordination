---
type: fb-lane-handoff
task: TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807
lane: fb-bugs
status: done
---

# Checkout migration guard

## Goal Alignment Session

- **Objective:** make checkout migration content-safe, visible, reversible, and impossible to close before task rebind.
- **Key Results:** same-path drift fails closed; noncanonical writes fail before mutation; lifecycle and task-rebind state are visible; existing orphan detection remains intact.
- **Definition of Done:** focused tests, full runtime tests, syntax, package parity, doctor, consumer smoke, and clean diff pass.
- **Gate / Review Point:** local verified candidate only; publication, installation, active-cache replacement, and retirement require explicit James approval.
- **Approval:** approved.
- **Justification:** James approved the Unmirror recovery and generic FB-Lane correction on 2026-08-07.
- **Lane OKR Fit:** aligned.
- **Mini-loop Evidence:** The review repair red run reproduced canonical-only
  receipt authorization after an off-home source changed. The repaired focused
  suite passes 20/20 across drift, audit completeness, lifecycle discovery,
  MCP visibility/mutations, and session guards.
- **Evidence Against Product OKR:** None identified.

Lane OKR Fit: aligned
Mini-loop Evidence: The fail-closed checkout and receipt tests prove that the
lane's migration-safety objective is met without hiding former-root evidence.
Evidence Against Product OKR: None identified; the evidence strengthens the
approved Product goal of complete, canonical Product/BFM intake.

## Build Brief

- Compare canonical and audit-root handoffs by raw SHA-256 plus task/status.
- Emit `HANDOFF_CONTENT_DRIFT` with roots, hashes, task, and reconciliation action.
- Keep `active`, `quarantined`, `retirement-pending`, and `retired` distinct in a machine-local manifest.
- Make status, claim, handoff routing, and source-write preparation fail `FB_CHECKOUT_NOT_CANONICAL` outside the active checkout.
- Expose current/canonical paths, lifecycle state, unresolved drift, and `awaiting-task-rebind` status.
- Never delete, clean, or retire a checkout implicitly.

## Product/BFM Closeout

- **Status:** Done — absorbed into FB 0.5.11, published through PR #60, and installed.
- **Actioned By:** Product/BFM.
- **Result:** Routing receipts now bind the canonical digest and exact source
  root/digest set. Configured missing or inaccessible audit roots fail closed.
  Independent former clones discover registered manifests from machine-local
  storage. MCP status exposes lifecycle and rejects noncanonical use, while all
  MCP writes plus session promote/checkpoint/close are guarded before mutation.
  Root and generated package runtimes are byte-aligned.
- **Evidence:** [QA](../qa/TASK-FB-CHECKOUT-MIGRATION-GUARD-20260807.md);
  focused migration checks 20/20; CLI regression 72/72; sessions 39/39;
  package tests 10/10; historical guard-only package sync 61/61 (superseded for
  release evidence by the combined 65-mirror manifest); syntax passed.
- **Remaining:** Checkout retirement remains separately gated.
- **Closeout Note:** PR #60 merged as `57d1053`; the exact 0.5.11 plugin build
  is installed and enabled.
- **Loop Learning:** Checkout migration authority must be discoverable across
  independent clones, and a routing receipt is valid only for the exact
  canonical and off-home content set that Product reviewed.
