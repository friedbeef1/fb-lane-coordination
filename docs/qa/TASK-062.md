# TASK-062 verification

Date: 2026-07-29
Candidate: `tech/TASK-062-first-run-bfm-onboarding`
Release build: `0.5.1-beta+codex.20260729135705`

## Outcome

System verification: passed.

The candidate implements one-time, permission-gated, repository-scoped
six-workstream sidebar onboarding without creating any live Codex tasks during
verification.

Live release verification: passed. GitHub `main` contains merge `f3ed9a0`, and
Codex reports `fb-lane-coordination@fb-lane` installed and enabled at
`0.5.1-beta+codex.20260729135705`.

## Focused checks

| Proof | Result |
|---|---|
| Root and packaged onboarding behavior | 26/26 passed |
| Legacy four-task migration | Product, Business, Design, and Tech produce only Discovery and Bugs as missing |
| Current six-task idempotency | No missing tasks and no duplicate creation plan |
| Repository isolation | Other-project tasks do not satisfy the current repository |
| Codex project identity | Exact project IDs work when task summaries omit paths |
| One-time permission | Receipt prompts once and persists the response |
| Linked worktrees | One Git clone shares one receipt through the Git common directory |
| Idle task instructions | Six distinct prompts prohibit investigation, edits, handoffs, and implementation until asked |
| Incomplete task inventory | Automatic creation stops; FB never guesses that a task is missing |
| Manual fallback | Paste-ready prompts are produced without claiming automatic creation |
| Invocation | `$bfm` remains canonical; `/bfm` is recognized only as user intent |
| Bootstrap rerun | The permission question appears on the first run and not the second |
| Package generation | 53/53 declared mirrors aligned |
| Plugin metadata | Root/package 0.5.1-beta contracts passed |
| Node syntax | Root/package onboarding and bootstrap tools passed `node --check` |
| Whitespace | `git diff --check` passed |
| Complete release validator | Passed once after **Push Live** authorization |

## Commands

```bash
node --test tools/fb-onboarding.test.cjs \
  plugins/fb-lane-coordination/tools/fb-onboarding.test.cjs
node tools/fb-package-sync.cjs --check
node --check tools/fb-onboarding.cjs
node --check tools/fb-lane.cjs
node --check plugins/fb-lane-coordination/tools/fb-onboarding.cjs
node --check plugins/fb-lane-coordination/tools/fb-lane.cjs
git diff --check
```

Earlier compatibility checks on the same candidate also passed the root CLI
(70/70), beginner experience (10/10), six-skill contract, automatic-worktree
(11/11), and compact-board (8/8) suites. Later changes were limited to
onboarding inventory safety wording and its focused structural assertion, so
those unrelated suites were not rerun.

At the explicit release checkpoint, `node tools/fb-lane.validate.cjs` passed
once on clean commit `0847f39`. It covered declared mirrors, plugin manifests,
skill metadata, 70 CLI/bootstrap checks, session/eval and active documentation
contracts, doctor, syntax, and whitespace. No second broad validator was run.

## Limits

- No live sidebar tasks were created. Creation requires the user’s explicit
  Yes after a project’s bootstrap prompt.
- The Codex app’s task-list arguments can vary by build. The skill retries only
  supported calls and falls back manually when it cannot prove a complete
  repository-scoped inventory.
- No sidebar tasks were created during release verification; each project still
  requires its own one-time explicit permission.
- James approved the changelog and **Push Live** on 2026-07-29. The release,
  marketplace refresh, reinstall, and active plugin/MCP verification are
  complete.
