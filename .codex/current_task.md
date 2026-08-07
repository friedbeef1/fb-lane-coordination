# Active Task Context

* **Current Task**: TASK-076
* **Lane**: FB-Product / BFM
* **Status**: Checking — focused delegated-approval proof passed; automatic release checkpoint next
* **BFM Class**: Full BFM plugin interface release candidate
* **Feature Branch**: `codex/TASK-076-fb-setup-shortcut`
* **Release Candidate**: `0.5.10-beta+codex.20260807084627`
* **Locked Files**: Setup skill and active setup documentation; focused
  contract; package manifest and generated mirrors; version/changelog and
  TASK-076 release records.

## Task Scope

Add `$fb-setup` as the exact primary setup invocation while retaining the
existing canonical setup skill and natural-language fallback.

## Current

James approved the dedicated thin-skill approach. The RED proof failed on the
missing skill, the canonical implementation and generated package contract are
green. Before release, James directed FB to use standing delegation for routine
changelog approval and one release checkpoint. The focused final-candidate
contracts pass; Product/BFM now commits the candidate and automatically runs one
release checkpoint. Material decisions, sensitive gates, and **Push Live**
remain user-owned.
