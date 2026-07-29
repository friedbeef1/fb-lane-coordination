# FB FAQ

This FAQ describes the current **FB 0.5.0-beta** six-workstream model.

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

## Will FB create the six Codex sidebar tasks for me?

After repository bootstrap, FB asks once for permission. With Yes, it detects
repository-scoped current and legacy workstream tasks and creates only what is
missing. Existing Product, Business, Design, and Tech projects gain only
Discovery and Bugs. New tasks remain idle until you ask them a question.

If Codex cannot list or create tasks in the current environment, FB tells you
and provides paste-ready prompts. It does not pretend the tasks were created.
Declining does not disable `$bfm`.

## What happens when I say `$bfm`?

Build For Me (BFM) begins only after Product approval and explicit `$bfm`; see
[start and approval](docs/fb/start.md).

Product scans Product/User, Business, Design, Tech, Discovery, and Bugs. It
includes valid `ready` handoffs, keeps blocked work visible, excludes completed
or deferred work, reconciles conflicts, prioritizes the sequence, directs Codex
implementation, and runs automated checks.

`$bfm` is the supported invocation. FB may understand `/bfm` as your intent,
but `/bfm` is not a separate installed command.

## Does `$bfm` deploy?

No. `$bfm` stops at **Ready to ship**. Only **Push Live** authorizes merge or
deployment.

## What if automated checks fail?

FB keeps the candidate in **Checking**, diagnoses the evidence, and makes only
scoped repairs within the declared loop budget. It does not silently change the
approved outcome or weaken a valid test.

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
