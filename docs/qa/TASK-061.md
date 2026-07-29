# TASK-061 verification

- **Candidate:** `tech/TASK-061-compact-board-context`
- **Base:** `cb515ae`
- **Environment:** local linked worktree, Node 25.8.2
- **Review state:** not reviewable

## Focused proof

| Check | Result |
|---|---|
| `node --test tools/fb-board-context.test.cjs` | Passed: 8/8, including CLI and MCP active context, threshold/no-threshold behavior, exact archive, idempotency, and completed-task integration |
| `node --test tools/fb-lane.test.cjs` | Passed: 70/70 |
| `node tools/fb-package-sync.cjs --check` | Passed: 50 declared mirrors agree |
| Root/package board-context contract | Passed: 16/16 |
| Node syntax and `git diff --check` | Passed |

## Context measurement

| Surface | Lines | Words | Bytes |
|---|---:|---:|---:|
| Full `PROJECT_BOARD.md` | 1,677 | 19,523 | 172,783 |
| `status --context` packet | 28 | 1,329 | 12,005 |
| Reduction | 98.3% | 93.2% | 93.1% |

The packet retains active scope, ownership, locks, and direct links. It excludes
terminal history and detailed task blocks. The 16,000-character cap prevents a
large active queue from silently becoming another full-board read.

## Limits

- This measures board-orientation context, not total task tokens.
- Mechanical archival occurs on successful completed-task merge closeout once
  the board exceeds 64 KiB. It is not run during this unmerged candidate.
- No release, publication, installation, merge, or deployment was performed.
