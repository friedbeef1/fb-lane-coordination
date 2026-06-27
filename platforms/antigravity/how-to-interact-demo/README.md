# Antigravity 2.0 How-To Demo

This HyperFrames composition explains how FB-Lane works with Antigravity 2.0:

- Product can be the starting orchestrator or the final integration endpoint
- Tech, Design, and Business can run as direct concurrent lane threads with bounded tools
- `PROJECT_BOARD.md` records status, branches, file locks, and blockers
- Lane outputs hand back to Product for final sequencing, staging, and merge resolution

## Output

- Final MP4: [GitHub release asset](https://github.com/friedbeef1/fb-lane-coordination/releases/download/demo-assets-2026-06-27/antigravity-how-to-interact.mp4)
- Source composition: [`index.html`](index.html)
- Expanded prompt: [`.hyperframes/expanded-prompt.md`](.hyperframes/expanded-prompt.md)

## Run Locally

```bash
npm run dev
```

## Verify And Render

```bash
npm run check
npm run render -- --output renders/antigravity-how-to-interact.mp4
```
