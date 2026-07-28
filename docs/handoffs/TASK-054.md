---
type: fb-lane-handoff
task: TASK-054
lane: fb-product
status: in-progress
fb_harness: v3
record_model: normalized-v1
---

# TASK-054 — Real-work Vanilla versus Preventive Graph FB benchmark

## Project Start Brief

- **Requested:** Replace rationale and modeled assumptions with quantitative
  evidence drawn from work James actually performs.
- **Decision:** Use six paired historical task replays from Unmirror and MÉJA,
  calibrated against an 18-task retrospective mix.
- **Arms:** Vanilla Codex and Preventive Graph FB.
- **Primary metrics:** observed wall time, authoritative provider input/output
  tokens when exposed, first-pass readiness, repair incidence, repair
  time/tokens, and final readiness.
- **Human attention:** both arms receive zero user decisions after launch.
  Report unattended completion rather than inventing screen-time savings.
- **Evidence boundary:** freeze source commits, public packets, arm prompts,
  graders, order, budgets, and repair policy before counted execution.
- **Model boundary:** the installed Codex CLI 0.139.0 cannot run
  `gpt-5.6-sol`; both counted arms therefore use the same supported
  `gpt-5.4` model.
- **Safety boundary:** historical repositories are read-only inputs. Replays
  run only in isolated exported fixtures without network, provider, production,
  deployment, or release authority.
- **Result boundary:** report task-level results, medians, ranges, and signed
  differences. Six pairs cannot establish a universal population claim.

## Approved replay set

| Project | Task | Starting commit | Historical acceptance reference | Class |
|---|---|---|---|---|
| Unmirror | Intro headline alignment | `2600f57` | `c6e5fde`, `de82cbc` | isolated |
| Unmirror | Saved Capture across Web/Android/iOS | `568a6b4` | `c26ab07` through `fc359d6` | multi-surface |
| Unmirror | Privacy-limited native analytics | `71bf297` | `e548495`, `42bc97c` | sensitive |
| MÉJA | Host-action scrolling/reachability | `cdfa26d` | `27f67cc`, `60c51f6` | isolated bug |
| MÉJA | Pairing and presence reliability | `da4868f` | `53d6d8d` through `1462645` | complex repair |
| MÉJA | Host/Audience redesign | `a815a90` | `3bd46b2`, `469cf31` | multi-workstream |

## Execution contract

1. Export each starting tree without later Git history.
2. Give both arms the same public facts and acceptance criteria.
3. Vanilla receives the raw relevant records and ordinary Codex instruction.
4. Preventive Graph FB receives a mechanically compiled selective context
   packet derived only from those same records.
5. Each subject produces one candidate and runs one recorded focused proof.
6. Grade and retain the first candidate before any repair.
7. A failed subject may receive one resume containing only failed public
   evidence; rerun only the failed proof.
8. Preserve all valid unfavorable outcomes. Do not selectively rerun.

## Decision rule

- Recommend Preventive Graph FB as the default when it preserves final
  readiness and reduces paired median wall time or tokens without adding more
  than 5% overhead on isolated work.
- Recommend task-dependent automatic routing when Vanilla wins isolated work
  and Preventive Graph FB wins complex work.
- Recommend Vanilla by default when graph treatment adds more than 5% paired
  median overhead without lowering repairs or improving readiness.
- Retain graph only for complex/sensitive work when it improves safety or
  readiness but costs more.
- Report inconclusive when task effects are unstable or authoritative token
  evidence is unavailable.

## External gates

No push, merge, plugin change, publication, provider write, production change,
deployment, or live action is authorized.

## Pre-run checkpoint

- Frozen declaration: [real-work benchmark declaration](../benchmarks/real-work/frozen-declaration.json)
- Excluded shakedown: [real-work shakedown](../benchmarks/real-work/shakedown.json)
- Methodology review: [pre-run review](../benchmarks/real-work/methodology-review.md)
- Result: passed. Authoritative usage and a real one-shot resume repair were
  demonstrated before counted execution.
