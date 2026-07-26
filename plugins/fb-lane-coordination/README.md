# FB Coordination for Codex

This package is the supported Codex distribution for FB. It supplies the
`fb-lane` coordination capability, BFM/Product/lane skills, and the reusable
FB harness. This candidate is **FB 0.5.0-beta** build
`0.5.0-beta+codex.20260726130257`.

## Install and start

```bash
codex plugin marketplace add friedbeef1/fb-lane-coordination
codex plugin add fb-lane-coordination@fb-lane
```

Open the project and say `Set up FB in this project.` Discuss questions in the
relevant Product/User, Business, Design, Tech, Discovery, or Bugs workstreams.
For actionable findings say `Create a handoff MD for Product/BFM.` Then say
`$bfm`. After Product approval and explicit `$bfm`, Build For Me (BFM) scans
all six, prioritizes, implements, tests, and stops at **Ready to ship**. Only
**Push Live** authorizes merge or deployment.

## Read by task

- [Why FB: Codex, Capacitor, and FB](docs/why-fb.md)
- [Harness overview](docs/fb/README.md)
- [Project Start Brief and approval](docs/fb/start.md)
- [Lanes, BFM, and durable records](docs/fb/workflow.md)
- [Test This Now and Verification Handoff](docs/fb/evidence.md)
- [Safety, sidechats, recovery, and Loop Learning](docs/fb/guardrails.md)
- [Repository-local sessions and evidence-aware closeout](docs/fb/sessions.md)
- [Generic agent control loop](docs/fb/control-loop.md)
- [Markdown eval selection, authority, and Quality Gaps](docs/fb/evals.md)

Keep `fb-lane`, plugin IDs, MCP names, commands, and configured technical paths
unchanged. The pack owns operating policy; project instructions own current
facts and stricter local rules.
