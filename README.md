# FB

**FB 0.2.0-beta: AI Loop Engineering for Everyday People.**

FB is an optional coordination harness for Codex projects. It keeps a
multi-agent objective tied to the approved goal, board, evidence, and repository
truth while leaving simple work simple.

## Start here

- [The FB harness](docs/fb/README.md) explains when to use it and the source hierarchy.
- [Start an objective](docs/fb/start.md) has the Project Start Brief and approval-before-BFM boundary.
- [Coordinate and execute](docs/fb/workflow.md) covers lanes, BFM, records, and closeout.
- [Evidence and review](docs/fb/evidence.md) provides Test This Now and Verification Handoff.
- [Safety and learning](docs/fb/guardrails.md) covers sidechats, recovery, approval, and small guardrails.
- [Repository-local sessions](docs/fb/sessions.md) cover durable intake, promotion, checkpoints, recall, review, and evidence-aware closeout.

Install the Codex plugin from this marketplace:

```bash
codex plugin marketplace add friedbeef1/fb-lane-coordination
codex plugin add fb-lane-coordination@fb-lane
```

Then start with `$fb-lane status` or describe the outcome in plain language.
Technical identifiers, commands, setup, and version history remain in
[the Codex guide](platforms/codex/README.md), [setup](docs/setup.md), and
[versioning](docs/versioning.md).
