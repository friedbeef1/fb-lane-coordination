# TASK-054 pre-run methodology review

Date: 2026-07-28  
Scope: frozen paired real-work benchmark before counted execution

## Findings resolved before counted spend

| Finding | Risk | Resolution |
|---|---|---|
| Both treatments initially received compact briefs | Would under-test selective graph context | Vanilla now receives the relevant raw historical task record; Graph receives a selective packet plus links to the same record. |
| Project `AGENTS.md`, `.codex`, and `.agents` survived the first export policy | Could impose FB-like workflow on Vanilla and override the treatment | All project agent instructions are removed from both arms. |
| Installed CLI 0.139.0 cannot run `gpt-5.6-sol` | Counted runs would fail before producing candidates | Both arms are frozen to the same supported `gpt-5.4`; this limitation must accompany results. |
| `codex exec resume` reverted to read-only | Repairs would be measured as blocked rather than attempted | Resume explicitly sets `sandbox_mode="workspace-write"` inside the already isolated fixture. |

## Fairness checks

| Check | Result |
|---|---|
| Six frozen tasks and 12 unique counted first-pass IDs | Pass |
| Counterbalanced arm order | Pass |
| Identical public-fact hash within every pair | Pass |
| Vanilla has no FB terminology or graph packet | Pass |
| Graph has no hidden grader or acceptance-commit data | Pass |
| Raw task records are substantive for all six tasks | Pass; 3,975–13,688 characters |
| Untouched starting trees fail | Pass; 6/6 |
| Historical accepted trees pass | Pass; 6/6 |
| Source repos are read-only inputs | Pass |
| Export excludes Git history, secrets, build output, coordination history, and agent instructions | Pass |
| Authoritative provider usage is exposed | Pass |
| Real resume can apply one repair | Pass |

## Pre-run decision

No unresolved Critical or Important fairness issue remains. The benchmark may
start its 12 counted first-pass runs. The raw six-pair result remains primary;
the study must not claim that six tasks establish a universal population
effect.
