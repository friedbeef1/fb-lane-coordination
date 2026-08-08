# TASK-079 QA — Project-local continuous learning

Candidate: `0.6.0-beta+codex.20260808104938`

## System verification

Status: checking — focused implementation passed; final release checkpoint is
pending.

| Check | Result |
|---|---|
| Learning runtime and lifecycle | Passed — 10/10 |
| Root CLI/bootstrap/MCP integration | Passed — 72/72 |
| Session closeout integration | Passed — 39/39 |
| Learning documentation contract | Passed |
| Eval/manual-bootstrap compatibility | Passed — 19/19 |
| Records compatibility | Passed — 17/17 |
| Package parity | Passed — 70 mirrors aligned |
| Final release validator | Pending |
| Doctor | Pending on final committed candidate |

## Focused repair evidence

The first documentation integration run correctly exposed that the manual
archive fallback did not copy `fb-learning.cjs`, `docs/fb/learning.md`, or the
empty learning-registry template. The same run exposed a line-sensitive
negative assertion. Product/BFM added the missing dependency closure and made
the assertion semantic. Both failed focused proofs passed on the next
consolidated run; no unrelated runtime suite or second repair loop was added.

This produced provisional lesson
[`LESSON-RELEASE-FALLBACK-001`](../learning/index.md#lesson-release-fallback-001):
when a new runtime dependency is added, the manual archive fallback must copy
the runtime, canonical page, and bootstrap template as one dependency set.

## Review state

Completed plugin build — no application preview is required. GitHub review
links will be added after the candidate is pushed. **Push Live** remains the
only merge, marketplace publication, and reinstall authority.

## Known limits

- This release proves the mechanism and its safety boundaries locally.
- It does not claim that any provisional lesson has improved two later real
  consumer-project tasks.
- Provider token and wall-time benefit must be measured from later comparable
  project runs rather than inferred from unit tests.
