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
- Eval selection, authority, Quality Gaps, and revision closure:
  [evals.md](docs/fb/evals.md)
- Authoritative records, verification reuse, and compact closeout:
  [records.md](docs/fb/records.md)

When planning or evidence is useful, start in whichever workstream matches the
question. Product/User is selected only for user-needs and product questions,
not as a universal intake coordinator. Relevant workstreams create ready
handoffs; after they are ready, `$bfm` activates Product reconciliation and
execution of approved scope. Project-specific instructions and stricter safety
rules always win.
