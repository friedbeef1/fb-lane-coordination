# TASK-020 Final Review Fix Report

## Final-review findings addressed

1. The root and packaged `tools/fb-lane.cjs` bootstrap contract did not present exactly four distinct ordered `How FB works` steps, and the concise bootstrap console did not fully state the plan → Product brief → approval → explicit `$bfm` build boundary.
2. The nine active Task-1 contract surfaces still used a generic Project Start Brief progress placeholder and did not include the exact actionable blocked line.

## TDD evidence

### RED — tests written before implementation

- Added identical persistent assertions to `tools/fb-lane.test.cjs` and `plugins/fb-lane-coordination/tools/fb-lane.test.cjs` before editing the CLI or contract documentation.
- The new bootstrap assertion extracts `## How FB works` from each freshly generated `AGENTS.md` and `.codex/rules.md` and requires exactly these ordered steps:
  1. `Lanes investigate and plan different parts.`
  2. `Product combines findings into one build brief.`
  3. `You approve the brief.`
  4. `Only after explicit `$bfm`, BFM builds and checks it.`
- The same bootstrap assertion requires the exact Progress and Blocked lines and preserves all six `Test This Now` fields plus the missing-review-access response already protected by the fresh-bootstrap test.
- Added a root/package-parity test over all nine active contract surfaces, requiring:
  - `Understanding your idea → Ready for your approval → Building → Checking → Complete`
  - `Blocked — <reason> / next action`
- Focused RED command: `node tools/fb-lane.test.cjs`
- RED result: exit 1. The new Task-1 surface assertion failed as intended at `plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md must use the exact approved progress wording`; the source still contained `**Progress:** <current stage and what is complete>`.

### GREEN — scoped implementation

- Updated both mirrored bootstrap CLIs with the exact four-step generated card.
- Kept the bootstrap console concise while explicitly covering normal project description, lane planning, Product brief, approval, and the explicit `$bfm` build-and-check boundary.
- Replaced the generic Project Start Brief progress line and added the exact blocked line in all nine specified active surfaces:
  - packaged skills: `fb-lane-coordination`, `fb-product`, `bfm`, `project-coordination-setup`
  - guides: `README.md`, `FAQ.md`, `platforms/codex/README.md`, plugin `README.md`, `docs/loop-engineering.md`

## Verification evidence

- `node tools/fb-lane.test.cjs` — pass, 28 checks.
- `node plugins/fb-lane-coordination/tools/fb-lane.test.cjs` — pass, 28 checks.
- `node --check tools/fb-lane.cjs` — pass.
- `node --check plugins/fb-lane-coordination/tools/fb-lane.cjs` — pass.
- `cmp -s tools/fb-lane.cjs plugins/fb-lane-coordination/tools/fb-lane.cjs` — pass.
- `cmp -s tools/fb-lane.test.cjs plugins/fb-lane-coordination/tools/fb-lane.test.cjs` — pass.
- `git diff --check` — pass; no whitespace errors.
- `node tools/fb-lane.validate.cjs` before commit reached the final doctor gate and exited 1 solely because the scoped worktree was intentionally uncommitted (`Git workspace: ... uncommitted changes`). The validator's syntax, package metadata, skill metadata, and regression-test stages passed first.
- Post-commit `node tools/fb-lane.validate.cjs` — pass: root/package syntax and parity, metadata validation, all 28 regression checks, doctor `Ready`, committed-diff whitespace, and clean worktree.

## Scope control

- No board, handoff index, detailed handoff, workstream, or plan files were modified.
- Only the two mirrored CLI/test pairs, nine requested Task-1 contract surfaces, and this TDD evidence report were changed.

## Final re-review: bootstrap console regression coverage

- Added identical root/package assertions in `tools/fb-lane.test.cjs` and `plugins/fb-lane-coordination/tools/fb-lane.test.cjs` for all four quick-start concepts in fresh bootstrap output:
  1. lanes investigate and plan different parts;
  2. Product combines findings into one build brief;
  3. the user approves the brief before execution; and
  4. only explicit `$bfm` makes BFM build and check it.
- Controlled RED proof: after adding the tests, temporarily changed only the root bootstrap console text from `Product combines findings into one build brief.` to `Product summarizes findings.` and ran `node tools/fb-lane.test.cjs`.
- RED result: exit 1 with the expected assertion `bootstrap quick start must say that Product prepares the build brief`. The captured output showed the altered phrase, proving this is a behavior assertion rather than a source-only check.
- Restored the production console phrase exactly without retaining any production-source change.
- GREEN results: `node tools/fb-lane.test.cjs` and `node plugins/fb-lane-coordination/tools/fb-lane.test.cjs` each passed all 28 checks.

## Final re-review: ordered approval-to-execution boundary

- Replaced the two independent approval and `$bfm` console assertions in both mirrored test files with one ordered expression:
  `You approve the brief. Only after explicit $bfm, BFM builds and checks it.`
- Kept the independent lanes-planning and Product-build-brief console assertions unchanged.
- Controlled RED proof: temporarily reordered only the root console sentence to `Only after explicit $bfm, BFM builds and checks it. You approve the brief.` and ran `node tools/fb-lane.test.cjs`.
- RED result: exit 1 with the expected assertion `bootstrap quick start must put user approval before the explicit $bfm build boundary`; captured output showed the reversed order.
- Restored the exact production console text without retaining a source change.
- GREEN results: root and package suites each passed all 28 checks.
