# Durable records and efficient evidence

Use this page for record ownership, proportional checks, verification reuse,
compact closeout, and local efficiency measurement. The rule is simple:
**each important fact has one authoritative home; every other surface links to
it.** A short linked summary is allowed. A competing copy is not.

## Authoritative homes

| Surface | Owns | Must not duplicate |
|---|---|---|
| Project board | Active status, owner, scope, gate, blockers, and links | Full decisions, test logs, implementation narration |
| Handoff index | Routing to active or relevant detail | Scope, evidence, or repeated status prose |
| Task handoff | Approved decisions, assumptions, scope, dependencies, acceptance, and supersession | Repeated board state or raw test output |
| Workstream card | Current lane task IDs, blockers, next action, and links | Full plans, copied decisions, copied checks |
| QA artifact | Command, candidate, worktree, environment, timestamps, exit status, counts, and bounded redacted output | Product decisions or board status |
| Git | Source and commit history | Coordination interpretation |

Read only what the current task needs. Start with
`node tools/fb-lane.cjs status --context` or MCP
`fb_lane_status({context:true})`, then follow its links to the index, current
handoff, and relevant workstream card. The compact packet contains active work
and locks, not completed history or detailed task blocks. Open the full board
only when the packet is missing, contradictory, or insufficient. Open
historical records through links when the current task depends on them. A
replacement decision records
`Supersedes: [previous decision](<path-or-url>)`.

When the board exceeds 64 KiB, successful completed-task closeout
mechanically retains the three most recent terminal rows and moves older
terminal rows and matching detail blocks to monthly files under
`docs/board/archive/`. Active, blocked, ready, and Staging QA rows are never
archived. Archive files remain durable history; this changes the default read
path, not the source of truth. Each file write is atomic, and the two-file
archive transition is safe to retry after interruption.

When MCP `fb_project_context` is available and the current task and question
are known, use its capped graph-directed packet before the broad route. Open
only the packet's relevant cited sources. The graph is derived navigation;
these authoritative records remain source of truth. If the packet is missing,
stale, unhealthy, incomplete, or contradictory, fall back to the board → index
→ handoff → card route and report that fallback.

New records opt in with `record_model: normalized-v1`. Doctor checks their
identity, approval state, board/handoff status consistency, completion links,
supersession links, and compact-card boundaries. Historical records remain
valid without retrofit. These checks enforce structure and consistency; Product
still judges meaning, risk, and evidence sufficiency.

For every non-quick normalized handoff, use the canonical template. The focused
records check rejects the record immediately unless the handoff contains its
complete Goal Alignment Session and the matching board task contains a complete,
explicitly approved Goal Alignment Session. Never postpone this repair to the
release validator, and never invent approval to make the check pass.

## Risk-triggered workstream review

A bounded correction may stay on the light path only when it records:

```text
Other lanes: no impact detected — <concrete reason>
```

Product expands review when files overlap another lane's declared surface,
handoffs conflict, or dependencies or acceptance criteria cross workstreams.
Use a full multi-workstream audit for new features, multi-platform work,
privacy, authentication, payments, secrets, provider state, migrations,
destructive data, release work, contradictory handoffs, unclear scope, or an
unresolved Product decision. The user describes the outcome; FB selects the
necessary review level internally.

## Verification reuse

Reusable evidence stores one deterministic fingerprint containing:

- tested commit and relevant source paths;
- dependency lockfile contents or hashes;
- build configuration;
- runtime and toolchain versions;
- target platform and device requirement;
- base commit affecting the tested surface;
- verification command and relevant environment.

Any relevant mismatch marks the evidence stale. Documentation-only
coordination changes run focused Markdown, link, parity, and diff checks; they
do not rerun unrelated application builds or runtime suites.

## Event-driven health checks

Run doctor or the applicable health/status check at a meaningful transition:
session or claim start; branch/worktree change; integration; dependency or
configuration change; interruption recovery; before merge, staging, release,
or closeout; or when a command exposes a workspace anomaly. Do not rerun it
only because an unrelated document changed.

## Compact closeout

Full BFM closeout uses exactly this base shape:

```text
Status:
Delivered:
Commit/worktree:
Checks:
Evidence:
Remaining gates:
Next owner:
Release boundary:
```

Normal Codex work uses:

```text
Outcome:
Check:
Commit/worktree:
Next action:
```

Add narrative only for a failure, changed decision, scope exception, recovery,
or reusable lesson. Keep complete test output in the QA artifact. Chat receives
the compact result and direct evidence link. Failure updates include only the
relevant failing excerpt and recovery state.

QA output is bounded and redacted. Secrets, tokens, environment values,
unredacted private data, transcripts, and hidden reasoning are forbidden.

## Measure before claiming savings

For the next 10–20 substantial tasks, record coordination-token share and total
tokens when authoritative provider usage exists; otherwise record
`unavailable`. Also record tool calls, repeated checks, repair loops, user
interventions, stale-evidence invalidations, consistency findings, escaped-risk
or late-dependency incidents, and time to a verified candidate.

The working hypotheses are 30–60% lower coordination/documentation tokens and
10–25% lower total tokens on substantial multi-workstream work. They are
targets to test, not claims to publish. Ordinary Codex remains appropriate for
simple isolated work. Do not publish a universal savings percentage without a
pre-registered experiment that directly supports it.
