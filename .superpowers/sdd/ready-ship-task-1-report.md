# Ready-to-ship Task 1 report

## Result

DONE

Commit: `2d1d373e84ec7accae235fe8f500fbc5c5937eae` (`feat: record automated verification evidence`)

## RED evidence

- `node tools/fb-efficiency.test.cjs` exited 1 with 9 passing and 2 failing tests. The expected failures were `TypeError: selectAutomatedChecks is not a function` and `TypeError: automatedVerificationDecision is not a function`.
- `node tools/fb-session.test.cjs` exited 1 at the new regression because a generic `reason: verification` milestone incorrectly returned reuse `true` instead of `false`.

## GREEN evidence

- `node tools/fb-efficiency.test.cjs`: PASS, 11/11.
- `node tools/fb-session.test.cjs`: PASS, 35/35.
- `node plugins/fb-lane-coordination/tools/fb-efficiency.test.cjs`: PASS, 11/11.
- `node plugins/fb-lane-coordination/tools/fb-session.test.cjs`: PASS, 35/35.
- `node tools/fb-package-sync.cjs --write`: synchronized 22 declared mirrors.
- `node tools/fb-package-sync.cjs --check`: PASS, 22 declared mirrors checked.
- `node --check` for the four canonical Task 1 source/test files and their four package mirrors: PASS.
- `git diff --check`: PASS.

## Self-review

- Scope is limited to the four canonical Task 1 policy/session files and tests plus their four generated package mirrors.
- Automated commands use executable and argument arrays; no shell-built command strings were introduced.
- Ready-to-ship decisions require a full matching candidate SHA, the selected passed checks, and a resolved safety gate; bypasses block and failed checks remain Checking.
- Session evidence is validated and written under the existing per-session mutation lock; generic verification milestones no longer authorize reuse.
- Reuse is based on the recorded candidate commit and fails closed when later paths are not coordination-only.
- No CLI/MCP submission adapter, documentation distribution, broad validator, deploy, release, merge, or push was performed.

## Concerns

None for Task 1. The report itself is intentionally written after the implementation commit so it can record the exact SHA; it is not part of that commit.

## Important-finding repairs

Repair commit message: `fix: bind automated evidence to candidate checks`

### RED

- `node tools/fb-session.test.cjs` exited 1 at the new made-up-check regression with `AssertionError: Missing expected exception.` This proved persistence accepted checks that were not selected by policy for the candidate's actual changed paths.
- The same focused test addition also covers the second finding: sensitive changes reject `safetyGate.result: not-applicable`, unrelated candidate history returns reuse false, and a failed Git changed-path inspection returns reuse false.

### GREEN

- `node tools/fb-efficiency.test.cjs`: PASS, 11/11.
- `node tools/fb-session.test.cjs`: PASS, 36/36.
- `node plugins/fb-lane-coordination/tools/fb-efficiency.test.cjs`: PASS, 11/11.
- `node plugins/fb-lane-coordination/tools/fb-session.test.cjs`: PASS, 36/36.
- `node tools/fb-package-sync.cjs --write`: synchronized 22 declared mirrors.
- `node tools/fb-package-sync.cjs --check`: PASS, 22 declared mirrors checked.
- `node --check` for all four canonical Task 1 source/test files and all four package mirrors: PASS.
- `git diff --check`: PASS.

### Repair self-review

- Persistence derives the candidate path set from the candidate commit, selects the canonical manifest through `selectAutomatedChecks`, requires an exact evidence-check match, and stores only a `Ready to ship`/reusable policy decision.
- Sensitive candidates require a passed safety gate with an approval reference.
- Reuse requires the evidence candidate to exist and be an ancestor of `HEAD`; candidate-to-HEAD, working-tree, and untracked-path inspections all fail closed on Git errors.
- Scope remains the Task 1 canonical session source/test, their generated mirrors, and this evidence report. No adapters, docs distribution, broad validator, deploy, release, merge, or push were performed.
