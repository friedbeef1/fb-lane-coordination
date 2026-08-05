# TASK-074 QA — Graph Engineering positioning

Date: 2026-08-04
Candidate: `codex/TASK-074-graph-positioning`
Release candidate: `0.5.8-beta+codex.20260804153114`

## Focused candidate evidence

| Proof | Result |
|---|---|
| Active positioning and primary diagram | pass — graph is the map; loops move and learn; `$bfm` navigates/executes; Push Live authorizes release |
| Industry-context mapping | pass — six concepts mapped; ambiguity and no-database boundary explicit; primary references linked |
| Auto-pinned workstream onboarding | root/package 14/14 pass; verifies create → title → pin → inventory check → reconcile and unpinned-without-duplicate recovery |
| Root/package positioning contract | 2/2 pass |
| Plugin metadata contract | 2/2 pass for `0.5.8-beta+codex.20260804153114` |
| Current release contract | 2/2 pass |
| Declared package mirrors | 58/58 synchronized |
| JSON manifests and changed JavaScript syntax | pass |
| Doctor structure | pass; expected dirty-worktree warning remains until candidate commit |
| Links and whitespace | pass |
| Changelog approval | approved by James on 2026-08-05 |
| Final release checkpoint | pass after one bounded status-record repair |

## Initial release-checkpoint failure

All completed suites passed before Doctor stopped on one deterministic record
conflict: TASK-074 was `Staging QA` on the board but `ready` in handoff
frontmatter. Product applied one consolidated coordination-only repair by
changing the handoff to `implemented`. No product source, criteria, tests, or
release authority changed.

## Final release checkpoint

| Gate | Result |
|---|---|
| Root CLI | 72/72 pass |
| Focused sessions | 39/39 pass |
| Evals | 19/19 pass |
| Beginner experience | 11/11 pass |
| Efficiency | 25/25 pass |
| Product positioning and two-speed | pass |
| Package mirrors | 58/58 pass |
| Doctor | Ready |
| Syntax and whitespace | pass |

The candidate is **Ready to ship**. GitHub push, merge, marketplace publication,
reinstall, and active-install verification require **Push Live**.

No push, merge, marketplace publication, reinstall, or deployment is authorized
before **Push Live**.
