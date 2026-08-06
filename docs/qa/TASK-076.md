# TASK-076 QA — Exact FB setup shortcut

Date: 2026-08-06
Status: Checking
Candidate: `codex/TASK-076-fb-setup-shortcut`
Release candidate: `0.5.10-beta+codex.20260806151502`
Changelog approval: pending James's approval

## Focused evidence

| Proof | Result |
|---|---|
| Shortcut RED proof | Pass — contract failed because `skills/fb-setup/SKILL.md` did not exist |
| Shortcut root/package contract | Pass — canonical and packaged contracts green |
| Skill validation | Pass — canonical and packaged `fb-setup` skills valid |
| Beginner flow | root/package 11/11 pass |
| Package parity | Pass — 62 declared mirrors synchronized and checked |
| Metadata and release contracts | root/package pass for `0.5.10-beta+codex.20260806151502` |
| Syntax and JSON | Pass — both shortcut contracts parse; metadata contracts parse both manifests |
| Links, records, and doctor | Pass — normalized records and links valid; only expected dirty-candidate attention before commit |
| Whitespace | Pass — `git diff --check` |
| Release checkpoint | Not run — requires changelog approval and explicit Product release-checkpoint approval |

## Bounded verification note

The first GREEN attempt found only test formatting assumptions about Markdown
line wrapping and the explicit statement that `/fb-setup` is not installed.
The contract was corrected to test behavior rather than typography. No product
behavior changed during that repair.
