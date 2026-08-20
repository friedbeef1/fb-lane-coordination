---
type: fb-lane-handoff
task: TASK-087
lane: fb-product
status: superseded
approval: approved
okr_fit: aligned
record_model: normalized-v1
fb_harness: v3
worktree: /Users/jamesyeang/Projects/fb-lane-coordination/.worktrees/product-TASK-087-dataless-quarantine-freeze-repair
sensitive: false
work_types: runtime, testing, plugin-package, local-installation
surface: BFM intake and quarantined checkout audit
---

# TASK-087 — Dataless quarantined-root BFM intake repair

## Status

Superseded by TASK-089 for release sequencing. The dataless-root repair and its
evidence remain preserved unchanged in the combined 0.9.3 candidate; no
separate TASK-087 release remains.

## Project Start Brief

Unmirror's complete BFM intake must terminate even when a registered
quarantined MirrorCam checkout contains iCloud dataless handoffs. The root
remains audited through the migration manifest; it must never be silently
excluded.

## Goal Alignment Session

Product Goal: Complete Unmirror Product/BFM intake without losing preserved
former-root evidence or weakening exact drift gates.

Workstream Goal: Make the installed intake runtime deterministic when a
registered quarantined checkout contains dataless handoffs.

Lane OKR Fit: aligned.

User Approval Needed: no — James authorized the recommended local repair,
reinstall, and continued execution on 2026-08-18.

Mini-loop Evidence: The regression reproduced the freeze failure after the
former root became offline, then passed with manifest-backed records; the real
Unmirror probe now returns immediately and exposes exact remaining tuples.

Evidence Against Product OKR: None identified. Missing receipts, malformed
snapshots, canonical drift, and unrecorded source drift remain blocking.

## Build Brief

- Use exact manifest content snapshots for registered quarantined handoffs.
- Verify current canonical files still match the manifest or routing receipt.
- Use existing source-bound routing receipts for quarantined routing state.
- Fail closed on missing checkout inventories, hashes, receipts, roots, or
  changed canonical content.
- Add focused offline/dataless regression coverage and mechanically regenerate
  the packaged plugin.
- Reinstall and prove the exact local artifact before consumer BFM resumes.
- Apply TASK-BUG-FB-CONFIDENCE-20260818: expose only **Ready**, **Safely
  paused**, or **Need your decision**; label fixture-only proof `candidate
  checks passed; exact project proof pending`; require the same final command
  on the exact Unmirror snapshot with no later invalidating mutation.

## Gates

Stop after the local repaired runtime and Unmirror acceptance are proved. A
fresh Codex task is required after replacement. **Push Live** remains the only
release authority.
