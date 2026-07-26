# TASK-050 Task 2A Report — Durable Full Repair-Budget Authority

## Scope

Implemented only the Task 2A durable Full repair-budget authority. Task 2B
candidate publication, generated plugin mirrors, documentation, release,
canonical configuration mutation, promotion, publication, and deployment were
not changed.

## Implementation

- Replaced the process-local, consumer-mintable Full-budget token with a
  `fb-full-repair-budget-v1` record under the Git common directory at
  `fb-lane/full-repair-budgets/`.
- An active execution session can issue one atomic record for a stable run,
  candidate, and decision version. Reissuing that run or candidate fails;
  callers receive only the durable `{ sessionId, runId, candidateId }`
  reference.
- The deadline is derived at issuance from the fixed trusted Full policy
  duration. Advancement has no caller-provided deadline or clock field.
- Repair count, two-repair maximum, decision version, deadline, and active /
  stopped / closed state are persisted. A shared common-directory mutation lock
  serializes issue, read-update, and close operations across linked worktrees.
- Full candidate evaluation now advances that durable reference and derives
  material progress from the evaluated candidates. Quick behavior remains on
  `evaluateRunBudget`.
- Removed the obsolete in-memory Full token issuer/consumer from
  `fb-efficiency`; it could not provide durable cross-worktree authority.

## TDD evidence

### RED

Added focused authority tests before the durable implementation, then ran:

```sh
node tools/fb-control-loop.test.cjs
```

The suite failed at the new issuance test with:

```text
TypeError: issueFullRepairBudget is not a function
```

After tightening the deadline trust boundary so advancement no longer accepts a
consumer `now` value, the focused test was made red again with:

```text
Error: Full repair-budget advancement requires authoritative now.
```

### GREEN

```sh
node tools/fb-control-loop.test.cjs
node tools/fb-session.test.cjs
node tools/fb-efficiency.test.cjs
node --check tools/fb-control-loop.cjs
node --check tools/fb-efficiency.cjs
git diff --check
```

All commands exited successfully. The focused control-loop suite passed
`43/43`, including real concurrent child-process advancement.

## Focused authority proof

| Requirement | Evidence |
| --- | --- |
| No reset/reissue | Same run and same candidate each reject a second issue. |
| Fixed deadline | Issuance derives the deadline; an attempted deadline field is rejected and expiry uses the runtime clock. |
| Decision authority | Mismatched Product/user decision version durably stops the record with a Product boundary. |
| Repair cap | Two material repairs progress; the third durably stops. |
| Other stops | No-progress, closed, and expired records stop with actionable Product boundaries. |
| Concurrency and worktrees | Two child processes serialize to two repairs, and a linked worktree reads the same common-dir record. |

## Files

- `tools/fb-control-loop.cjs`
- `tools/fb-control-loop.test.cjs`
- `tools/fb-efficiency.cjs`

## Concerns / handoff

The authority remains runtime-only with no public command. Session lifecycle
closure now closes linked Full budgets under the existing session lock. Task 2B
remains entirely separate and untouched.

---

## Consolidated review repair

Repair commit: `7df4ee8 fix: bind Full budget to session authority`

### RED

The revised focused control-loop test removed caller-supplied decision versions
and required an active BFM execution session, an authoritative Full route, and
a Product decision version from the linked handoff. The first RED run failed at
issuance with `Invalid or unsafe Full repair budget decision version undefined`.

### GREEN

- Issuance and advancement now take the existing session mutation lock before
  the durable budget lock. They re-read the active `bfm` execution session,
  current approved board task, Full BFM route, and `Product decision version`
  from the linked handoff.
- A changed handoff decision, closed/non-BFM session, or Quick route stops or
  rejects the budget regardless of stale caller values.
- `closeSession` closes every active linked Full budget while it owns the same
  lifecycle lock; the focused session test proves stale advancement is then
  rejected.
- Budget temporary files use no-follow exclusive opens; create and replace
  fsync the file and common-store directory after atomic link/rename publish.

Final focused proof passed: control-loop `45/45`, session suite (including the
atomic close case), efficiency `20/20`, relevant syntax checks, and whitespace.
