# Active Task Context

* **Current Task**: TASK-076
* **Lane**: FB-Product / BFM
* **Status**: Ready to ship — complete release checkpoint passed
* **BFM Class**: Full BFM plugin interface release candidate
* **Feature Branch**: `codex/TASK-076-fb-setup-shortcut`
* **Release Candidate**: `0.5.10-beta+codex.20260806151502`
* **Locked Files**: Setup skill and active setup documentation; focused
  contract; package manifest and generated mirrors; version/changelog and
  TASK-076 release records.

## Task Scope

Add `$fb-setup` as the exact primary setup invocation while retaining the
existing canonical setup skill and natural-language fallback.

## Current

James approved the dedicated thin-skill approach. The RED proof failed on the
missing skill, the canonical implementation and generated package contract are
green. James approved the 0.5.10-beta changelog and one clean release checkpoint
on 2026-08-06. The complete validator passed without repair. GitHub push,
merge, marketplace publication, and reinstall remain gated by **Push Live**.
