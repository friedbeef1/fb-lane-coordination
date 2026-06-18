# Claude Code FB-Lane How-To Demo - Production Breakdown

## Style Block

Build a 1280x720 dark technical editorial explainer for the Claude Code section of FB-Lane. Use the provided Claude wishlist palette: background `#0a0e17`, panel `#0f1525`, panel alt `#131b2e`, line `#22304a`, ink `#e8eefb`, muted `#93a4c4`, Product amber `#F59E0B`, Tech blue `#2563EB`, Design violet `#7C3AED`, Business green `#059669`, good `#34d399`, and bad `#f87171`.

Typography uses high-contrast video scale with serif display headlines, sans body, and monospace code/branch labels. No external assets; use built HTML/CSS shapes, SVG lines, code snippets, chat mockups, board tables, and branch graphs.

## Rhythm

Pattern: hook -> disruption -> fix -> concurrency proof -> direct interaction -> Product resolution -> closing hold.

Duration target: 42 seconds. Seven scenes:

1. Title, 4.5s
2. Before/problem, 6.0s
3. Board/fix, 5.5s
4. Concurrent lanes, 7.0s
5. Direct lane ask in Claude Code, 5.8s
6. Product sequencing and conflict resolution, 7.0s
7. Closing, 6.2s

## Global Rules

- Every scene has background depth: grid, ghost text, radial glow, structural rules, and tiny metadata marks.
- Use 2-4 focal zones per scene so the frame does not feel like a web page.
- Every content block enters with a different motion verb: stamp, slide, cascade, draw, pulse, count, sweep.
- Scene boundaries should be deterministic clip changes; do not leave stale scene elements visible.
- The video should explain Claude Code specifically: native `@fb-design`, `@fb-tech`, `@fb-business` style lane interaction, with shared board/file locks and Product as final integration lane.

## Scene Beats

### 1. Title

Concept: A command-center title card introduces the promise: multiple Claude Code lane agents on one codebase without collisions. The viewer should immediately understand this is a workflow demo, not a marketing hero.

Layers: background grid and slow amber/blue glows; center title; four lane chips orbit in a precise row; tiny label "Claude Code + FB-Lane".

Transition: soft blur-through into the problem.

### 2. Before

Concept: Three unmanaged agents all edit `app.ts`. The frame should feel tense and crowded: red tops, conflict markers, same file repeated, and a sharp conflict stamp.

Layers: three chat windows, red same-file ribbons, code diffs, `MERGE CONFLICT` stamp, ghost "WITHOUT RULES".

Transition: hard/fast register shift into the board.

### 3. Board

Concept: The chaos resolves into a structured `PROJECT_BOARD.md`. Rows show Tech, Design, and Business each claiming different files and branches.

Layers: board table, no-overlap scan line, lock pills, side note explaining "shared source of truth".

Transition: board rows expand into live thread windows.

### 4. Concurrent Lanes

Concept: Claude Code lanes run at the same time in their own threads. The frame has three live windows with colored top bars and file-lock pills.

Layers: `@fb-tech`, `@fb-design`, `@fb-business` windows, live pulses, branch/file pills, central "same repo" hub.

Transition: Design window pulls forward.

### 5. Direct Lane Ask

Concept: Show the wishlist interaction: type `@fb-design I need new icons`, and the lane handles claim, lock, branch, output, and handoff.

Layers: large violet Claude Code lane window, user prompt, claim status, file lock, four icon tiles, footnote that Product can also delegate hands-off.

Transition: handoff line sweeps into merge graph.

### 6. Product Sequencing

Concept: Product/Captain becomes the integration gate. Tech, Design, and Business branches merge into main only after Product sequences and resolves the board conflict.

Layers: branch graph, amber Product control panel, checklist ticks, board conflict kept-both line, final clean main node.

Transition: resolve into final statement.

### 7. Closing

Concept: Calm final hold with the usage choices: describe a goal to Product, or tag lanes directly. The message is "Multiple agents. One codebase. Zero collisions."

Layers: large headline, chips for Product delegation and direct lane tags, footer link target for Claude Code section.

## Negative Prompt

Avoid generic neon cyberpunk, purple-blue gradients as the whole design, stock screenshots, tiny UI text, unreadable code, real product screenshots, and any claim that Claude Code lanes magically share chat memory. The awareness mechanism is shared repo state: board, claims, branches, handoffs, and Product sequencing.
