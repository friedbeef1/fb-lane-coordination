# Codex Lane Demo Video

**Historical demo (June 2026).** This video predates the current User plus
Product/BFM structure and PM-first priority guidance. For the replacement
storyboard and narration, see [the new explainer script](../docs/media/fb-priorities-explainer.md).
Do not use this older video as current setup or authority instructions.

This HyperFrames composition explains the Codex value of FB: start from a Product/Captain prompt or talk directly to multiple lane threads, let Codex run safe work concurrently, and use shared claims/handoffs so lanes pass back to Product without overwriting each other.

## Output

- Final MP4: [GitHub release asset](https://github.com/friedbeef1/fb-lane-coordination/releases/download/demo-assets-2026-06-27/codex-lane-demo.mp4)
- Source composition: [`index.html`](index.html)
- Expanded prompt: [`.hyperframes/expanded-prompt.md`](.hyperframes/expanded-prompt.md)

## Run Locally

```bash
npm run dev
```

## Verify And Render

```bash
npm run check
npm run render -- --output renders/codex-lane-demo.mp4
```
