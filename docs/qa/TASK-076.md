# TASK-076 QA — Exact FB setup shortcut

Date: 2026-08-07
Status: Ready to ship
Candidate: `codex/TASK-076-fb-setup-shortcut`
Release candidate: `0.5.10-beta+codex.20260807084627`
Changelog approval: approved — Product/BFM standing delegation; TASK-076,
2026-08-07

## Focused evidence

| Proof | Result |
|---|---|
| Shortcut RED proof | Pass — contract failed because `skills/fb-setup/SKILL.md` did not exist |
| Shortcut root/package contract | Pass — canonical and packaged contracts green |
| Changed skill validation | Pass — Product, BFM, coordination, Business, and setup skills valid in root and package |
| Beginner flow | final candidate root/package 11/11 pass |
| Package parity | Pass — 62 declared mirrors synchronized and checked |
| Metadata and release contracts | final build `0.5.10-beta+codex.20260807084627` root/package pass |
| Delegated approval contract | root/package 13/13 pass in each context |
| Two-speed compatibility | root/package pass |
| Codex plugin validator | Pass |
| Syntax and JSON | Pass — both shortcut contracts parse; metadata contracts parse both manifests |
| Links and normalized records | Pass |
| Clean-worktree doctor | Ready on final candidate commit `0b8039f` |
| Whitespace | Pass — `git diff --check` |
| Changelog approval | Approved by James on 2026-08-06 |
| Prior release checkpoint | Passed for the pre-delegation candidate; superseded by the approved candidate change and not reused |
| Final-candidate release checkpoint | Pass — single automatic run on `0b8039f`; no repair loop |

## Bounded verification note

The first GREEN attempt found only test formatting assumptions about Markdown
line wrapping and the explicit statement that `/fb-setup` is not installed.
The contract was corrected to test behavior rather than typography. No product
behavior changed during that repair.

## Release-checkpoint result

James approved one clean release checkpoint on 2026-08-06. That committed
candidate passed `node tools/fb-lane.validate.cjs` without a repair loop. James
then added the standing-delegation requirement before release. The earlier
result remains historical evidence but cannot prove the changed final
candidate. Product/BFM then authorized one new final-candidate checkpoint under
the standing delegation. Commit `0b8039f` passed the complete validator without
a repair loop: CLI 72/72, sessions 39/39, evals 19/19, beginner 11/11,
efficiency 25/25, positioning and two-speed contracts, 62 package mirrors,
Doctor Ready, syntax, metadata, JSON, and committed-diff whitespace all passed.
This coordination-only closeout records that result and does not rerun runtime
suites.
