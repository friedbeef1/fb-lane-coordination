# Codex Lane Demo Video

This HyperFrames composition explains the Codex value of FB-Lane: give multiple lane instructions at once, let Codex run safe work concurrently, and use shared claims/handoffs so lanes do not overwrite each other.

## Output

- Final MP4: [`renders/codex-lane-demo.mp4`](renders/codex-lane-demo.mp4)
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
