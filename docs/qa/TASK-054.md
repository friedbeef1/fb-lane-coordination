# TASK-054 QA — Real-work paired benchmark

Date: 2026-07-28  
Review state: completed evidence study

## System verification

| Proof | Result |
|---|---|
| Frozen registry | Pass: six paired tasks and 18 retrospective tasks |
| Safe exports | Pass: no Git history, secrets, build output, coordination history, or project agent instructions |
| Treatment isolation | Pass: identical public-fact hash per pair; Vanilla has no FB structure; Graph has no hidden grader data |
| Grader calibration | Pass: 6/6 starting trees fail and 6/6 historical accepted trees pass |
| Excluded real-Codex shakedown | Pass: authoritative usage, candidate hash, resume, workspace write, and one-shot repair |
| Counted schedule | Pass: 12/12 unique first-pass IDs completed; no replacement run |
| Repairs | Pass: maximum one repair per failed arm |
| User decisions | Pass: zero after launch in both arms |
| Privacy closeout | Pass: temporary result JSON stripped of raw underscore fields; committed results contain curated metrics only |
| Syntax and focused contract | Pass |

## Result validation

- Recomputed wall time and usage from every stored run.
- Recomputed all first and final grades without rerunning subjects.
- Confirmed raw totals, medians, ranges, first-pass-only metrics, repair-only
  metrics, and the 18-task weighted estimate agree with the report.
- Preserved every failure and unfavorable Graph result.
- No source repository, plugin, provider, production, deployment, or release
  state changed.

## Decision

The adoption threshold failed. Preventive Graph FB was 13.1% slower and used
34.7% more total tokens, with the same 2/6 accepted-outcome count and one
additional repair. Vanilla remains the default. No plugin behavior change is
authorized by this evidence task.
