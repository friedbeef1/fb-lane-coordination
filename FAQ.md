# FB FAQ

This FAQ describes the current **FB 0.8.0-beta** model: six evidence-producing
workstreams plus one Product/BFM control centre and seven pinned
repository-scoped Codex tasks.

## What does FB stand for?

FB officially stands for **Focus Bridge**: it bridges user goals, six
workstreams, Codex implementation, verification, and delivery. It could have
been Feature Builder, Flow Booster, Fast Build—or, naturally, **Fried Beef**.
But Focus Bridge is the official name.

## Is FB a Codex plugin?

Yes. FB adds product coordination, durable handoffs, automated verification,
and a release boundary around Codex software execution.

## Is there a beginner process and a normal process?

No. There is one process: discuss, capture actionable handoffs, say `$bfm`, let
FB implement and test, optionally review links, then say **Push Live**. Simple
isolated work can still use normal Codex without FB ceremony.

## Must all six workstreams contribute?

No. Each workstream either contributes an actionable handoff or records **None
relevant**. FB never manufactures work just to fill a lane.

## Can one workstream hand planning to another?

Yes, when you explicitly ask. Discovery can create a queued research handoff
for Design, for example. Design is told the handoff is **planning only; waiting
for you** and does not start automatically. After you continue it, Design may
produce its own recommendation. Only a separate Product-ready handoff can enter
`$bfm`.

## Will FB create the seven Codex sidebar tasks for me?

Yes. Open the project and invoke `$fb-setup`. After repository bootstrap, FB
asks once for permission. With Yes, it detects
repository-scoped current and legacy workstream tasks and creates only what is
missing. Product/User is treated as a legacy User title, while a lone legacy
Product title maps to Product/BFM. Every new task remains idle until you ask it
a question; pinning never starts work.

If Codex cannot list or create tasks in the current environment, FB tells you
and provides paste-ready prompts. It does not pretend the tasks were created.
Declining does not disable `$bfm`.

## What keeps FB in the right project?

Setup and `$bfm` mutate only the active canonical checkout. Exact-project task
reconciliation requires both the verified Codex project ID and canonical
repository root. Missing, mixed, truncated, or contradictory inventory changes
nothing.

## What happens when a project moves to another checkout?

FB uses a transactional migration. It inventories and dispositions every
discovered difference, atomically records one canonical root, quarantines former
roots, and rebinds the exact seven pinned tasks. Former roots remain recoverable
until fresh evidence and explicit retirement approval.

## What happens when I say `$bfm`?

Build For Me (BFM) begins when Product/BFM receives explicit `$bfm`; see
[start and approval](docs/fb/start.md). Product first freezes intake, reconciles
every candidate, records the included scope and consolidated Build Brief, and
only then begins source execution. That sequence does not require a routine
second approval; Product pauses for changed user decisions, disputed
priorities, sensitive boundaries, conflicts, or unclear scope.

`$bfm` executes only in Product/BFM. The control centre scans User, Business,
Design, Tech, Discovery, and Bugs. It
renders a complete intake ledger, dispositions every candidate, keeps blocked
work linked and visible, shows compatible Product/BFM inputs separately,
reconciles conflicts, prioritizes the included sequence, directs
Codex implementation, and runs automated checks. Missing, unreadable, drifting,
or contradictory evidence fails closed before source execution. Execution and
an empty-queue claim also require a configured canonical checkout plus a fresh
receipt proving the exact project and all seven pinned tasks.

`$bfm` is the supported invocation. FB may understand `/bfm` as your intent,
but `/bfm` is not a separate installed command.

## Does `$bfm` deploy?

No. `$bfm` stops at **Ready to ship**. Only **Push Live** authorizes merge or
deployment.

## Why does FB not ask me to approve every release step?

Product/BFM has standing delegation to approve candidate-faithful changelog
wording and authorize one release checkpoint without a user prompt. It asks you
only for a changed user or product decision, material scope or priority, a
sensitive gate, or **Push Live**. Push Live remains the only authorization for
merge, publication, installation, or deployment.

## What if automated checks fail?

FB keeps the candidate in **Checking**, diagnoses the evidence, and makes only
scoped repairs within the declared loop budget. It does not silently change the
approved outcome or weaken a valid test.

## Does FB learn from a project over time?

After FB verifies a feature, it records what caused meaningful failure or
rework, repairs within the existing budget, and gives the next related task
only the proven lesson it needs. Helpful lessons are confirmed; ineffective
lessons are revised once or rejected. FB never turns continuous learning into
an endless repair loop. Learning stays [inside that project](docs/fb/learning.md)
and never authorizes release.

## Can compact board context make FB miss important work?

The compact packet is navigation, not a replacement for project truth. It
keeps active scope, owners, locks, blockers, staging candidates, and evidence
links. Only explicit terminal statuses are archived; unfamiliar statuses stay
visible. `$bfm` still scans the handoff index and handoff statuses separately.
If the packet reports omitted rows or is insufficient or contradictory, FB
opens the authoritative full board. Archived history remains durable Markdown
and is never deleted. See
[the complete safeguard table](docs/fb/records.md#why-compact-context-does-not-hide-important-work).

## Can a sidechat hand work to any main task?

No. A sidechat routes only to the parent task it was opened from. If that
parent cannot be identified, FB gives you a paste-ready handoff instead of
guessing another destination. See [safety, routing, and recovery](docs/fb/guardrails.md).

## How is FB different from vanilla Codex or Kurrent Capacitor?

Codex emphasizes executing software work. Capacitor emphasizes comprehensive
session intelligence. FB emphasizes delivering an approved product outcome and
includes curated session intelligence. See [Why FB](docs/why-fb.md).
