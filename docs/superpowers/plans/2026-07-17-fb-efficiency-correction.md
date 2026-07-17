# FB Efficiency Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Normal Codex the default for simple isolated work, make Quick BFM a one-record bounded-correction path, and reserve existing Full BFM ceremony for material risk.

**Architecture:** Add one pure efficiency-policy module used by the existing CLI and session seams. Quick tasks persist one Markdown record plus clone-local counters, while Full BFM keeps the current board/handoff model. A root-only package synchronizer generates declared plugin mirrors; factual tests validate meaning while the synchronizer alone validates byte drift.

**Tech Stack:** Node.js CommonJS, Markdown records, existing Git/session helpers, JSON package-sync manifest, node:test/assert fixtures.

## Global Constraints

- Public commands and technical identifiers remain unchanged.
- Normal Codex produces no FB record.
- Quick BFM produces one `TASK-Q-*` Quick Record, one execution pass, proportional focused checks, one reviewer, and one closeout update.
- Full BFM remains mandatory for auth, privacy, payments, secrets, destructive changes, provider state, releases, material architecture, multi-lane work, lock conflicts, or unclear scope.
- The full validator runs at most once after the final runtime-affecting checkpoint and never after coordination-only closeout.
- Stop immediately when success predicates pass.
- Stop on two repair loops, one no-progress cycle, a repeated broad gate, five total agent iterations, or an exceeded time, authoritative-token, or cost budget.
- Before every repeated iteration, require a material progress delta in source, evidence, test state, blocker recovery, or approved direction.
- Quick BFM receives one reviewer; Full BFM receives at most two reviewers unless a new run is explicitly approved.
- Workers receive only the current task brief, candidate or diff, specific feedback, and required evidence—never accumulated transcripts or conversation history.
- Root files are canonical; package mirrors are generated mechanically.
- Local efficiency metrics are the default. Webhooks, Grafana, hosted monitoring, and external usage capture require separate approval.
- Metrics exclude transcripts, hidden reasoning, secrets, authentication tokens, environment values, and private data.
- No push, PR, merge, release, publication, deployment, install, or consumer migration.

## Run budget for this implementation

| Resource | Budget |
|---|---:|
| Agent iterations, including reviewers | 5 |
| Integrated implementation passes | 1 |
| Repair loops | 2 |
| Reviewers | 2 |
| Full validators | 1, after the final runtime checkpoint |
| No-progress cycles | 0 |
| Elapsed time | 120 minutes |
| Tokens and cost | `unavailable` unless authoritative provider usage is supplied |

The paused Task 1 attempt created only the untracked red-test draft
`tools/fb-package-sync.test.cjs`. Resume from that candidate instead of
discarding or recreating it.

---

### Task 1: Integrated efficiency harness implementation

**Files:**
- Create: `tools/fb-package-manifest.json`
- Create: `tools/fb-package-sync.cjs`
- Create or continue: `tools/fb-package-sync.test.cjs`
- Create: `tools/fb-efficiency.cjs`
- Create: `tools/fb-efficiency.test.cjs`
- Modify: `tools/fb-lane.cjs`
- Modify: `tools/fb-lane.test.cjs`
- Modify: `tools/fb-session.cjs`
- Modify: `tools/fb-session.test.cjs`
- Modify: `tools/fb-lane.validate.cjs`
- Modify: `docs/fb/README.md`
- Modify: `docs/fb/workflow.md`
- Modify: `docs/fb/sessions.md`
- Modify: `docs/fb/guardrails.md`
- Modify: `skills/fb-lane-coordination/SKILL.md`
- Modify: `skills/project-coordination-setup/SKILL.md`
- Modify: applicable plugin-only BFM and lane router skills
- Modify: `tools/fb-two-speed.test.cjs` and affected documentation contracts
- Generate: declared package mirrors under `plugins/fb-lane-coordination/`

**Interfaces:**

```js
classifyExecutionMode(task, options)
// -> { mode: 'Normal Codex'|'Quick BFM'|'Full BFM', reason: string }

renderQuickRecord(input)            // -> Markdown string
parseQuickRecord(markdown)          // -> structured record
findQuickRecord(repoRoot, taskId)   // -> path|null
closeQuickRecord(markdown, closeout)// -> updated Markdown string

classifyChangedSurface(paths)
// -> 'coordination'|'documentation'|'test'|'runtime'|'sensitive'

verificationBudget(paths, checkpoint)
// -> { focused, runFullValidator, reuseCheckpoint, blockedReason }

evaluateRunBudget(state, event)
// -> { blocked, reason, materialProgressRequired, state }

renderEfficiencyReceipt(metrics)    // -> Markdown section

loadManifest(repoRoot)              // -> manifest entries
syncPackage(repoRoot, { write })    // -> { checked, drift }
```

- [ ] **Step 1: Preserve and run the paused package-sync RED candidate.**

Run `node tools/fb-package-sync.test.cjs`. Expected: failure because the
manifest/synchronizer does not exist. Record that result; do not recreate the
test or run unrelated suites.

- [ ] **Step 2: Complete failing focused contracts before production changes.**

Add focused tests for:

- path-safe `--write` and read-only `--check` package synchronization;
- Normal, approved bounded Quick, ambiguous Full, multi-owner Full, and every
  preserved sensitive-risk trigger;
- one Quick Record with no board/index/card/recap duplicates;
- Quick status without a board row;
- coordination, documentation, test, runtime, and sensitive verification
  classes;
- zero runtime suites after coordination-only closeout;
- zero full validators for docs-only work and one final runtime allowance;
- two allowed repair loops, a blocked third loop, one allowed broad gate, a
  blocked repeated broad gate, a blocked no-progress cycle, and a blocked sixth
  agent iteration;
- elapsed-time and authoritative token/cost budget exhaustion;
- a material progress comparison before repeated iterations;
- one-reviewer Quick enforcement and minimal worker-context fields;
- Efficiency Receipt fields and privacy rejection;
- structural/factual docs contracts without whole-file assertions.

Run only the new focused tests. Expected: failures for missing behavior.

- [ ] **Step 3: Implement mechanical package synchronization.**

Create a path-safe manifest for existing true mirrors. Reject absolute paths,
`..`, duplicate sources or targets, and targets outside
`plugins/fb-lane-coordination/`. Implement atomic `--write` and read-only
`--check`. Replace validator mirror-by-mirror equality with one sync `--check`;
retain semantic and syntax checks.

- [ ] **Step 4: Implement the mode router and Quick Record flow.**

Add the pure policy module. Keep `classifyBfmClass` as a compatibility wrapper.
Change the existing `quick` command to create and commit one
`docs/handoffs/TASK-Q-*.md` instead of a board row while preserving hooks,
branch, and worktree behavior. Make status read that record without requiring a
board row. Preserve Full-BFM claim behavior.

- [ ] **Step 5: Implement Quick closeout and run budgets.**

Make `submit TASK-Q-*` validate one reviewer, focused evidence, run budgets,
and circuit state; update and commit the same Quick Record once. Preserve
existing Full-BFM submit behavior. A coordination-only Quick closeout must not
invoke runtime tests or the full validator. Provider tokens and cost are
enforced only when authoritative values are supplied; otherwise record
`unavailable`.

- [ ] **Step 6: Implement progress and context boundaries.**

Before a repeated worker, repair, review, or gate, compare against the previous
candidate and require a material delta in source, evidence, test state, blocker
recovery, or approved direction. Represent worker input as only the current
brief, candidate/diff, specific feedback, and required evidence. Reject
accumulated transcript/history fields.

- [ ] **Step 7: Update canonical guidance and generate mirrors.**

Document the three modes, one Quick Record, resource budgets, progress delta,
stop predicates, minimal worker context, local metrics, and optional external
integrations concisely. Generate declared mirrors mechanically. Remove exact
copy assertions from individual docs tests; the synchronizer remains the only
byte-drift authority.

- [ ] **Step 8: Run focused GREEN checks once.**

Run the new efficiency and sync tests plus directly affected CLI, session,
two-speed, and documentation contracts in root and package form. Run sync
`--check`, syntax, and whitespace. Do not run the full validator.

- [ ] **Step 9: Stop when Task 1 predicates pass and commit once.**

Commit the integrated runtime/test/docs candidate. Record its hash as the final
runtime-affecting checkpoint. Do not amend runtime or test files after this
point unless Task 2's reviewer finds a concrete defect and the progress-delta
gate allows a repair.

### Task 2: One validator, bounded review, and coordination-only closeout

**Files:**
- Modify only concrete repair targets if an independent reviewer finds a defect
  and the resource/progress budgets permit it.
- Modify after acceptance: `PROJECT_BOARD.md`, `docs/handoffs/TASK-028.md`,
  `docs/handoffs/index.md`, `docs/workstreams/fb-product.md`, and ignored
  `.codex/current_task.md`.

- [ ] **Step 1: Run the full validator exactly once.**

Run `node tools/fb-lane.validate.cjs` from the clean final runtime checkpoint.
Expected: `FB-Lane readiness validation passed.` Record the commit and count
`Broad validators: 1`.

- [ ] **Step 2: Dispatch one independent reviewer with minimal context.**

Give the reviewer only this plan, the final candidate diff, specific acceptance
criteria, and required evidence. Do not include the conversation transcript or
accumulated implementation reports.

- [ ] **Step 3: Apply the progress-delta and circuit-breaker gates.**

If review is clean, stop review immediately. If findings exist, compare the
next proposed iteration with the current candidate. Continue only for a
concrete source, evidence, test, blocker, or approved-decision delta. Permit at
most two repair loops, five total agent iterations, no repeated broad validator,
and no no-progress cycle. A runtime repair consumes focused checks but does not
automatically rerun the full validator; if safe completion would require a
second broad gate, stop and record the circuit-breaker decision.

- [ ] **Step 4: Close coordination without runtime reruns.**

After acceptance, update TASK-028 coordination records once with the candidate,
checks, reviewer, budget use, Efficiency Receipt, remaining external gates, and
clean branch/worktree state. Run only package-sync `--check`, focused structural
contracts, standalone doctor, whitespace, and clean status. Do not rerun CLI,
session, eval, beginner, or the full validator.

- [ ] **Step 5: Keep the branch local.**

Do not fetch, reconcile, push, open a PR, merge, publish, release, deploy,
install, or modify a consumer repository.
