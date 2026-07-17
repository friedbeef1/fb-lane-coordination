# FB FAQ

## How is FB different from vanilla Codex or Kurrent Capacitor?

Codex executes software work. Capacitor is a session-intelligence platform. FB
is a product-delivery harness that includes curated session intelligence.
Capacitor and FB overlap in recall, evidence, and evaluation; FB connects those
records to the approved product brief, execution authority, quality, closeout,
and exactly what the user should test. See [Why FB](docs/why-fb.md) for the
honest comparison, diagrams, evidence-backed pain points, and examples.

## Do I need FB for every task?

No. Use normal work for simple one-thread questions or isolated edits. Use FB
when durable coordination, lanes, handoffs, locks, or Product/BFM decisions are
part of the objective. See [the mode guide](docs/fb/README.md).

## What happens before a build starts?

Product gives the Project Start Brief, selects only useful lanes, records a
build brief, and asks for approval. Build For Me (BFM) executes only after
approval and explicit `$bfm`.
The complete user-facing contract is in [start.md](docs/fb/start.md).

## Where do I find the current task?

`PROJECT_BOARD.md` is truth, `docs/handoffs/index.md` routes to detail, and
workstream cards are summaries. [workflow.md](docs/fb/workflow.md) explains the
read order and ownership.

## How do I test an outcome?

Ask for the Test This Now packet: direct links, exact steps, pass criteria,
known limits, and a failure-report format. [evidence.md](docs/fb/evidence.md)
defines that packet and the Verification Handoff.

## Can a sidechat execute work or choose another main thread?

No. Sidechats are planning spaces and route only to their originating parent.
[guardrails.md](docs/fb/guardrails.md) contains the safety and recovery rules.
[sessions.md](docs/fb/sessions.md) contains the optional durable-session lifecycle,
clone-local privacy boundary, checkpoint push behavior, recall, and closeout gate.
