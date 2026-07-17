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
