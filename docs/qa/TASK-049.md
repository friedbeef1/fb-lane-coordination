---
type: fb-qa
task: TASK-049
status: passed
record_model: normalized-v1
---

# TASK-049 Focused QA

## Candidate

FB `0.4.0-beta+codex.20260726101229` release candidate implementing
graph-directed targeted reading. No marketplace publication, installation,
merge, or deployment has occurred yet.

## Checks

- Root graph and plugin contracts: 15/15 passed.
- Packaged plugin graph contract: 6/6 passed.
- Bundled MCP list/call smoke: passed.
- Real MÉJA consumer smoke: `MEJA-111` routed to its exact handoff and QA
  evidence using a repository-specific task prefix.
- Normalized-record compatibility: root and package 12/12 passed.
- Bootstrap/CLI compatibility: root and package 70/70 passed; generated projects
  ignore `.fb/graph/` derived artifacts.
- Bootstrap nine-page harness and manual fallback acquisition: passed.
- Eval/bootstrap contract: 18/18 passed.
- Plugin metadata: root and packaged passed for
  `0.4.0-beta+codex.20260726101229`.
- Package synchronization: 44 mirrors aligned.
- Package synchronizer: 10/10 passed.
- Codex plugin validator: passed.
- Affected Node syntax and whitespace: passed.
- Complete repository validator: passed after one consolidated coordination
  repair; final doctor reported **Ready**.
- GitHub readiness: passed on PR #51 after one focused two-line whitespace
  repair.
- Public install smoke: marketplace upgraded; plugin
  `0.4.0-beta+codex.20260726101229` installed and enabled; all six workstream
  skills plus BFM present; bundled MCP listed `fb_project_context`; installed
  MCP routed real MÉJA `MEJA-111` to `docs/qa/MEJA-111.md`.

## Safety result

The graph writes only ignored derived `.fb/graph/` artifacts. Safe existing
repository task prefixes such as `MEJA-*` are accepted by graph and normalized
record validation. Packets expose at
most three readable authoritative sources. Unknown tasks and unhealthy or
insufficient context use the board/index fallback. The graph cannot authorize
scope, implementation, closeout, merge, or release.

## Remaining gate

Release completed through PR #51 and the existing GitHub marketplace. A new
Codex task is required to load the refreshed skills and MCP server.
