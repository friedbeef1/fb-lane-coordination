# TASK-078 QA — One-sentence GitHub setup

Candidate: `0.5.12-beta+codex.20260808093008`

## System verification

Status: passed — **Ready to ship**.

| Check | Result |
|---|---|
| Root setup contract | Passed |
| Packaged setup contract | Passed |
| Root/package onboarding | Passed — 26/26 in each context |
| Product/BFM setup guidance | Passed in root and package contexts |
| Metadata and release contracts | Passed in root and package contexts |
| Package parity | Passed — 65 mirrors aligned |
| Affected syntax and whitespace | Passed |
| Doctor | Ready on committed candidate |
| Complete release checkpoint | Passed — CLI 72/72; migration 34/34; sessions 39/39; evals 19/19; beginner 11/11; efficiency 25/25 |

## Review state

Not reviewable — this is a plugin/setup release with complete automated proof
and no application preview. Publication and reinstall remain blocked by **Push
Live**.

## Outcome

FB now exposes one GitHub sentence for fresh installation or upgrade, explains
repeat setup without specialist terminology, reuses matching tasks, and creates
only missing roles. The plugin and canonical documentation agree on the new
entry point and the required new-task transition after installation.
