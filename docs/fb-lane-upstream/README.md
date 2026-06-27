# fb-lane upstream patches

Patches against the `fb-lane.cjs` CLI that are intended to be sent upstream,
kept in `git format-patch` form so they apply cleanly with `git am` or
`git apply`.

| Patch | Summary |
|-------|---------|
| `0001-harden-fb-lane-cli.patch` | Stop running `git` through a shell; validate task IDs and lane names so attacker-controlled values (including MCP tool arguments) can no longer inject commands. Adds `tools/fb-lane.test.cjs`. |

## Applying

```bash
# From the repo root, against a clean tree:
git am docs/fb-lane-upstream/0001-harden-fb-lane-cli.patch
# or, to apply the changes without recording the commit:
git apply docs/fb-lane-upstream/0001-harden-fb-lane-cli.patch
```

The patch targets the source-of-truth `tools/fb-lane.cjs`. This repository also
vendors a bundled copy at `plugins/fb-lane-coordination/tools/fb-lane.cjs`; keep
the two in sync after applying.

## Verifying

```bash
node tools/fb-lane.test.cjs
```
