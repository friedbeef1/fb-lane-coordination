# TASK-090 QA — Workstream result return

## Candidate

- Build: `0.9.4-beta+codex.20260821034517`
- Branch: `codex/TASK-090-workstream-result-return`
- Release state: local candidate only; no push, merge, publication, or install

## Focused evidence

| Proof | Result |
|---|---|
| Contract first failed on missing `Product/BFM Result` behavior | Passed as RED evidence |
| Canonical result-return contract | Passed |
| Packaged result-return contract | Passed |
| Root Product/BFM control-centre contract | Passed |
| Packaged Product/BFM control-centre contract | Passed |
| Root plugin metadata contract | Passed for exact `0.9.4-beta` build |
| Packaged plugin metadata contract | Passed for exact `0.9.4-beta` build |
| Package synchronization | 88 mirrors aligned |
| Affected Node syntax | Passed |
| Whitespace | Passed |

## Covered behavior

- Every Include now, Blocked, Deferred, Duplicate, Rejected, and Superseded
  handoff receives a compact Product/BFM result.
- Product/BFM refreshes the originating workstream card.
- One grouped passive summary is sent per affected workstream and BFM cycle to
  the exact receipt-bound task ID.
- Unchanged result fingerprints are not resent.
- Unavailable task messaging records `Return delivery: pending`, preserves the
  durable result/card, and returns paste-ready text without claiming delivery.
- Result notices do not start work, invoke `$bfm`, or change release authority.

## Remaining gate

The whole-candidate review found and corrected one idempotency edge: the stable
result fingerprint now excludes the mutable delivery receipt, and a changed
result explicitly resets delivery to pending. Historical closeouts remain
compatible. No other candidate defect was found.

The current Codex CLI has no `plugin validate` subcommand; that unsupported
probe made no repository change. The focused metadata, skill, and mirror
contracts are the applicable local package proof.

The final release checkpoint, GitHub push/merge, marketplace publication,
reinstall, and installed-runtime verification remain gated by **Push Live**.
