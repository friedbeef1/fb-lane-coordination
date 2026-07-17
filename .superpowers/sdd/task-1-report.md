# Task 1 report: workstream-first public contract

## Scope confirmation

Implemented only the focused public onboarding/first-project contract from
`task-1-brief.md`. The user-facing flow is singular and workstream-first;
internal risk and execution routing remains available to agents. Technical IDs,
six workstreams, session/eval schemas, handoff headings, board ownership,
release boundary, version, MCP interfaces, and historical records were not
changed. No full validator, push, merge, release, or deployment was run.

## Files

- Canonical entry and workflow guidance: `AGENTS.md`, `README.md`,
  `docs/fb/{README,start,workflow,full-loop}.md`, `docs/why-fb.md`,
  `platforms/codex/README.md`, and `examples/my-app/AGENTS.md`.
- Active skills: root coordination, quickstart, and setup skills plus packaged
  Product, BFM, lane, coordination, and setup guidance.
- Bootstrap/runtime guidance: `tools/fb-lane.cjs`.
- Focused contracts: beginner experience, root/package CLI, and product
  positioning tests.
- Declared package mirrors were regenerated mechanically with
  `node tools/fb-package-sync.cjs --write`.

## RED evidence

After changing the focused beginner contract test first, running
`node tools/fb-beginner-experience.test.cjs` failed on the old
`## Choose the mode` / `Simple task` / `Coordinated planning` /
`Approved Build For Me` public contract. Result: 1 failed of 10, for the expected
missing workstream-first behavior.

## GREEN evidence

- Root/package CLI: 70/70 each.
- Root/package beginner experience: 10/10 each.
- Root/package six-workstream runtime contracts: passed.
- Root/package six-skill behavior contracts: passed.
- Product positioning contract: passed.
- Package sync tests: 10/10; mirror check: 27/27.
- Syntax checks for affected runtime/tests: passed.
- `git diff --check`: passed.

## Concerns

None. Internal Quick/Full/Normal routing terminology remains in explicitly
internal workflow, session, guardrail, and historical/evidence surfaces; it is
no longer presented as a public starting menu.

## Independent-review repair

Repaired all five review findings in one bounded pass:

- The README/Why FB problem map now attaches pre-`$bfm` approval to relevant
  workstream handoffs and ready scope, with both consolidated briefs created
  during Product reconciliation after invocation.
- Bootstrap-generated AGENTS and Project Board guidance now expose only the
  workstream-first route; focused bootstrap tests reject the retired public mode
  trigger language and assert the approval/reconciliation timing.
- Product and BFM skills no longer require consolidated briefs to preexist
  `$bfm` or request a routine second approval. Deterministic ready-scope,
  lock, board alignment, and pre-source-change gates remain.
- The creator-commerce example is workstream-led through handoffs, `$bfm`,
  reconciliation, and execution; the Codex platform page uses the same route.

Repair verification output:

- Root CLI: `70 checks passed`; packaged CLI: `70 checks passed`.
- Root beginner: `10/10`; packaged beginner: `10/10`.
- Root/package six-workstream runtime: `passed` / `passed`.
- Root/package six-skill behavior: `passed` / `passed`.
- Product positioning: `FB product-positioning contract passed.`
- Package sync tests: `10` passed, `0` failed; mirror check:
  `Checked 27 package mirrors.`
- Affected JavaScript syntax checks and `git diff --check`: passed with no
  output.

Repair concerns: none. No full validator, push, merge, release, deployment, or
broader cleanup was performed.

## Final bounded repair loop 2 of 2

- `workflow.md` now states that, after `$bfm`, Product records the consolidated
  Build Brief and carries forward or records pre-`$bfm` ready-scope approval.
  There is no routine second approval; only the five decision/safety/scope
  exceptions pause execution.
- `EVAL-HARNESS-MODE-001` retains shadow authority and the complete scenario
  schema while testing one visible workstream-first route, conditional
  Product/User selection, ready handoffs before `$bfm`, post-invocation Product
  reconciliation and both briefs, and no visible mode rationale.

Focused RED: the beginner catalog test failed on the stale `Beginner mode
selection` scenario name/content before the docs changed.

Focused GREEN and exact output:

- Root/package beginner experience: `FB beginner-experience smoke passed
  (10/10).` each.
- Root/package eval: `TASK-023 eval tests passed (18/18).` each.
- Root/package CLI: `70 checks passed.` each.
- Package mirror check: `Checked 27 package mirrors.`
- Affected test syntax checks and `git diff --check`: passed with no output.

No full validator, broader cleanup, push, merge, release, or deployment was
performed. Concerns: none.
