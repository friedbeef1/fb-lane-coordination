# FB coordination navigator

Read this file, then the current project state: `PROJECT_BOARD.md`,
`docs/handoffs/index.md`, the linked handoff, and the relevant workstream card.
The board is current truth; the index routes; handoffs hold detail; cards are
summaries. The reusable FB operating rules live in [docs/fb/](docs/fb/README.md).

## Route by task

- First project, user-facing plan, lanes, clarifications, progress, or approval:
  [start.md](docs/fb/start.md)
- Ownership, plan-only lanes, BFM execution, locks, board/index/handoff roles,
  and return-loop closeout: [workflow.md](docs/fb/workflow.md)
- Test This Now, Verification Handoff, visual QA, evidence wording, and cleanup:
  [evidence.md](docs/fb/evidence.md)
- Hard approvals, Git/lock safety, sidechat-parent-only routing, recovery, retry
  limits, and Loop Learning escalation: [guardrails.md](docs/fb/guardrails.md)
- Durable session intake, promotion, checkpoints, recall, review, and closeout:
  [sessions.md](docs/fb/sessions.md)

Use normal work for simple single-thread tasks; use FB light for durable
multi-thread coordination; escalate to Product/BFM for approval, sequencing,
sensitive surfaces, release/staging decisions, core flows, or reconciled lane
outputs. Project-specific instructions and stricter safety rules always win.
