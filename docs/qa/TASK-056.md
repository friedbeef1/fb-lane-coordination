# TASK-056 QA — Prospective repair-efficiency benchmark

Date: 2026-07-28
Review state: completed evidence study

## Verification

| Proof | Result |
|---|---|
| Registry | Pass: same six TASK-054 historical tasks |
| Schedule | Pass: 12 unique counterbalanced counted runs |
| Treatment parity | Pass: matching public-fact hash per pair |
| Repair boundary | Pass: one repair maximum; efficient Graph uses fresh delta context |
| Real shakedown | Pass: excluded; authoritative usage; fresh repair task |
| Counted execution | Pass: 12/12 result files; no replacement run |
| Usage | Pass: authoritative provider token data for every completed Codex task |
| Privacy | Pass: committed evidence excludes raw output, prompts, transcripts, and private reasoning |
| Safety | Pass: isolated fixtures; source repositories remained read-only |

## Recomputed headline

- Vanilla: 58.25 minutes, 14.12M tokens, 1/6 accepted.
- Efficient Graph: 44.52 minutes, 11.89M tokens, 3/6 accepted.
- Efficient Graph difference: −23.6% wall time, −15.8% tokens.
- Repair difference: −69.1% wall time, −69.3% tokens.
- Standard API-equivalent cost estimate: $7.60 versus $6.15; actual billed
  subscription cost remains unavailable.

## Decision

TASK-055's repair policy is supported for adoption on this evidence. Preserve
task-dependent routing: the evidence does not justify claiming Graph is always
faster, cheaper, or more reliable.
