# TASK-090 QA — Workstream result return

## Candidate

- Build: `0.9.4-beta+codex.20260821034517`
- Branch: `codex/TASK-090-workstream-result-return`
- Source commit: `704f958ccddf0be2efc4ae0d2ba37f751eac92bc`
- Release state: locally installed candidate; no merge or public marketplace
  publication

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
the isolated TASK-090 worktree. Installation used the supported plugin path;
the installed cache was never edited in place.

## Supported local installation proof

| Proof | Result |
|---|---|
| GitHub candidate | PR #69 head is exact source commit `704f958`; readiness passed in 42 seconds |
| Marketplace route | `fb-lane` is Git-backed at `friedbeef1/fb-lane-coordination`, ref `codex/TASK-090-workstream-result-return` |
| Installed version | `0.9.4-beta+codex.20260821034517`, installed and enabled |
| Package/cache parity | 93/93 installed files byte-identical to the candidate package |
| Skills | 13/13 skill entrypoints present, including BFM, Product, coordination, setup, and six workstreams |
| MCP contract | Installed `.mcp.json` resolves `cwd: "."` and `./tools/fb-lane.cjs mcp` |
| MCP runtime | Installed runtime answered `tools/list` with 14 tools |
| Representative hashes | BFM `a23d548e…`; runtime `31e9ccd1…`; plugin manifest `57943cd5…` |

The GitHub runner emitted an informational Node 20 deprecation annotation for
upstream `actions/checkout@v4` and `actions/setup-node@v4`; validation itself
passed. This is not a TASK-090 behavior failure.

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

James explicitly said **Push Live**. PR #69 merged as `4527b6a`, and its
workstream result-return behavior is published and installed as part of FB
`0.10.0-beta+codex.20260827100222`. The exact 0.10.0 installation passed 94/94
artifact parity and a 14-tool MCP proof. This task remains loaded from 0.9.4; a
new Codex task is required to load the replacement runtime.
