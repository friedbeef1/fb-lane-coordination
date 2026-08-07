# Active Task Context

* **Current Task**: TASK-FB-PRODUCT-BFM-RELIABILITY-20260807
* **Lane**: FB-Product / BFM
* **Status**: In Progress — verified migration guard integration first
* **BFM Class**: Full BFM multi-slice reliability candidate
* **Feature Branch**: `codex/product-bfm-reliability-20260807`
* **Release Candidate**: local only; version decision pending candidate review
* **Locked Files**: `tools/`, Product/BFM/setup skills, active `docs/fb/`,
  focused contracts, package mirrors, and task/release records.

## Task Scope

Integrate the verified checkout-migration guard with the newer FB 0.5.10
candidate, then complete exact-project seven-role onboarding, fail-closed
intake, visible BFM ledger, migration, documentation, and local verification.

## Current

The FB 0.5.10 setup/delegation candidate is preserved at `0b8039f`. The
checkout guard is independently verified at `e4715d1` and `5b4a226` and will
be imported rather than recreated. The Unmirror handoff is approved for local
implementation. Publication, installation/cache replacement, destructive
checkout retirement, sensitive operations, and **Push Live** remain gated.
