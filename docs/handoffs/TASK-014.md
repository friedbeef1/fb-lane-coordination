# TASK-014 - Ponytail Cleanup Pass

## Task

- **ID**: TASK-014
- **Owner**: FB-Product
- **Scope**: Move rendered demo MP4s out of git into release assets and document maintenance surface boundaries.
- **Out of Scope**: CLI/tooling changes, packaged plugin behavior changes, new build framework, or live staging/deploy work.

## Goal Alignment Session

Lane OKR Fit: aligned
Mini-loop Evidence: The cleanup keeps coordination behavior unchanged while removing tracked render assets from git and documenting where canonical and packaged/generated maintenance should live.
Evidence Against Product OKR: No blocking evidence identified.

## What Changed

- Removed tracked demo MP4s:
  - `codex-lane-demo/renders/codex-lane-demo.mp4`
  - `platforms/claude-code/how-to-interact-demo/renders/claude-code-how-to-interact.mp4`
  - `platforms/antigravity/how-to-interact-demo/renders/antigravity-how-to-interact.mp4`
- Updated demo READMEs to link directly to release assets:
  - `codex-lane-demo/README.md`
  - `platforms/claude-code/how-to-interact-demo/README.md`
  - `platforms/antigravity/how-to-interact-demo/README.md`
- Updated `.gitignore` to ignore MP4 and contact-sheet outputs in the demo render folders.
- Added `docs/maintenance.md` documenting:
  - Canonical sources (`docs/`, `templates/`, `skills/`, `tools/`)
  - Packaged plugin copy parity
  - No CLI split until needed
  - Rendered demos as release assets (not git-tracked)
- Added maintenance link from root `README.md`.
- Updated `CHANGELOG.md` and `PROJECT_BOARD.md` with cleanup evidence and completed QA checklist items.

## Verification Evidence

- `curl -I` checks for all three release asset URLs passed.
- `git ls-files '*renders/*.mp4'` returned no matches.
- `node tools/fb-lane.validate.cjs` ran; it fails only because doctor reports a dirty workspace with uncommitted changes.
- `node tools/fb-lane.cjs doctor` reports all checks passing with an expected dirty-workspace warning.
- `git diff --check` passed.
- No tracked changes outside the allowed file set were made.

## Product Status Recommendation

in progress

Closeout note - TASK-014: in progress. Delivered so far: asset unlinking, release-asset documentation, maintenance guidance, `.gitignore` updates, and evidence updates in changelog/board/handoff. Evidence so far: curl checks, render file removal check, and `git diff --check`. Remaining: clean-worktree validation, doctor, final closeout, and PR publication.
