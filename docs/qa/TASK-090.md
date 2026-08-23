# TASK-090 QA — Workstream result return

## Candidate

- Build: `0.9.4-beta+codex.20260821034517`
- Branch: `codex/TASK-090-workstream-result-return`
- Release state: local candidate; supported local install authorized, with no
  merge or public marketplace publication

## Source and runtime provenance

| Surface | Proven state before candidate install |
|---|---|
| Current task loaded skill | `0.9.3-beta+codex.20260820032957` |
| Configured `fb-lane` marketplace | Local marketplace source under `~/.codex/.tmp/marketplaces/fb-lane` |
| Marketplace manifest | Exact `0.9.3-beta+codex.20260820032957` |
| Installed cache manifest | Exact `0.9.3-beta+codex.20260820032957` |
| Marketplace/cache BFM skill hash | Identical (`0580ad5c…`) |
| Candidate | `0.9.4-beta+codex.20260821034517`; distinct BFM skill hash (`0342b052…` before this extension) |

The stale `/Users/jamesyeang/Projects/fb-lane-coordination` checkout was not
used. The candidate is built from the configured canonical source lineage in
the isolated TASK-090 worktree. Installation uses the supported plugin path;
the installed cache is never edited in place.

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

## Mock BFM cycle

A disposable deterministic mock exercised three acted-on handoffs without
touching any real project or sidebar task.

| Scenario | Observed result |
|---|---|
| Two Bugs results in one cycle | One passive message containing both results |
| Destination identity | Exact receipt-bound task ID `mock-project-bugs-task-7` |
| Design task messaging unavailable | Durable evidence preserved and `Return delivery: pending` with paste-ready text |
| Identical second cycle | Zero messages sent; duplicate return prevented |
| Delivery receipt changed | Substantive result fingerprint remained unchanged |

Mock result: **PASS**. This proves the grouping, exact-ID, pending-fallback, and
idempotency rules deterministically. It does not claim that Codex sidebar task
messaging was exercised against a real project; that installed-runtime smoke
belongs after publication and reinstall.

## Covered behavior

- Every Include now, Blocked, Deferred, Duplicate, Rejected, and Superseded
  handoff receives a compact Product/BFM result.
- Product/BFM refreshes the originating workstream card.
- One grouped passive summary is sent per affected workstream and BFM cycle to
  the exact receipt-bound task ID.
- One passive kickoff is sent after the Build Brief and slice ownership freeze
  to each materially involved exact workstream task, with task ID, assigned
  scope, expected evidence, Product/BFM ownership, and repository brief link.
- Kickoff and terminal/result notices are capped at one each per involved
  workstream per run; only a material status change requiring James's attention
  permits an additional notice.
- Private implementation agents do not remove the sidebar visibility trail or
  activate the receiving workstream task.
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

GitHub readiness initially failed only because the prospective Staging QA
handoff described the release boundary narratively instead of using the
mechanically required `External gates` and `Remaining owner/action` fields. The
single focused repair added those exact lifecycle fields without changing
runtime or plugin behavior; Doctor is rerun as the failed proof.

GitHub merge and public marketplace publication remain gated by **Push Live**.
James separately authorized a supported local install and installed-artifact
verification of this exact candidate. A new Codex task is still required to
load the replacement skill and MCP runtime.
