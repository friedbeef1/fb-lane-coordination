# TASK-075 final-fix report

## Status

The consolidated final-review repair is complete. TASK-075 remains **Staging
QA / Checking** for `0.5.9-beta+codex.20260805042523`; changelog approval is
still pending and the final release validator was not run.

## Findings addressed

1. Added an executable `needs-reconciliation` onboarding check based on the
   canonical seven receipt roles. A legacy granted six-role receipt still
   requires inventory and migration even when it already has `reconciledAt`.
   BFM guidance now invokes that check for every granted receipt.
2. Split status-card display titles from owner-matching identities. Product/BFM
   now matches board owners such as `FB-Product / BFM`, renders a control-centre
   heading, and projects TASK-075's Staging QA row with its Checking detail.
   Added the repository User card.
3. Inventory planning now returns `complete: false`, no actions, and explicit
   failures whenever a required rename or pin target lacks an executable task
   or thread ID.

## Test-first and verification evidence

- RED: the new root focused run failed on the legacy receipt cycle, ID-less
  rename/pin plans, Product/BFM status-card generation, and stale BFM guidance.
- GREEN: root onboarding/control-centre/status contracts passed 36/36.
- GREEN: packaged onboarding/control-centre/status contracts passed 36/36.
- Package mirrors: one write synchronized 60/60 declared mirrors; one check
  confirmed 60/60.
- Syntax: every changed root and packaged JavaScript file passed `node --check`.
- Doctor: exited 0; the only attention item was the expected uncommitted repair
  before commit.

## Self-review and boundaries

- Reviewed the canonical and generated diffs against all three final findings.
- Generated mirrors are mechanical copies; version and changelog wording are
  unchanged.
- `.codex/current_task.md` remains parent-owned and untouched by this repair.
  No existing `.superpowers` ledger or task report was edited; this requested
  final-fix report is the only new ledger artifact.
- No full validator, push, merge, publication, reinstall, deployment, or
  consumer-repository mutation occurred.

## Remaining concern

The candidate cannot advance beyond Checking until the existing changelog
approval gate is resolved and Product/BFM runs the separately authorized final
release validator.
