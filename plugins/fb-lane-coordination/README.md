# FB Coordination for Codex

This package is the supported Codex distribution for FB. It supplies the
`fb-lane` coordination capability, BFM/Product/lane skills, and the reusable
FB harness.

## Install and start

```bash
codex plugin marketplace add friedbeef1/fb-lane-coordination
codex plugin add fb-lane-coordination@fb-lane
```

Start a new Codex task with `$fb-lane status` or describe the objective in
plain language. Product presents the plan first. Build For Me (BFM) executes
source-changing work only after approval and explicit `$bfm`.

## Read by task

- [Why FB: Codex, Capacitor, and FB](docs/why-fb.md)
- [Harness overview](docs/fb/README.md)
- [Project Start Brief and approval](docs/fb/start.md)
- [Lanes, BFM, and durable records](docs/fb/workflow.md)
- [Test This Now and Verification Handoff](docs/fb/evidence.md)
- [Safety, sidechats, recovery, and Loop Learning](docs/fb/guardrails.md)
- [Repository-local sessions and evidence-aware closeout](docs/fb/sessions.md)
- [Markdown eval selection, authority, and Quality Gaps](docs/fb/evals.md)

Keep `fb-lane`, plugin IDs, MCP names, commands, and configured technical paths
unchanged. The pack owns operating policy; project instructions own current
facts and stricter local rules.
