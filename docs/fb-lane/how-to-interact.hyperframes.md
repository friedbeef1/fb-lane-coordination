---
title: "FB-Lane — How to Interact"
subtitle: "Run multiple AI agents on one codebase, concurrently, with zero merge conflicts"
aspect_ratio: "16:9"
resolution: "1280x720"
theme: dark
total_duration: "~39s"
palette:
  product: "#F59E0B"   # amber
  tech:    "#2563EB"   # blue
  design:  "#7C3AED"   # violet
  business:"#059669"   # green
  bg:      "#0a0e17"
  ink:     "#e8eefb"
  good:    "#34d399"
  bad:     "#f87171"
source_visual: "docs/fb-lane/how-to-interact.html"   # each <section class="scene"> == one frame below (1:1)
---

# Hyperframes spec — FB-Lane "How to Interact"

A 7-frame explainer: **multiple AI lanes work concurrently on one repo without conflict**, with a
**before/after** and **FB-Product sequencing + resolving conflicts at the end**.

## For Codex — how to render this
1. **Visuals already exist.** `docs/fb-lane/how-to-interact.html` is a self-contained animated
   version of this exact storyboard. Each `<section class="scene" data-dur="…" data-caption="…">`
   maps 1:1 to a **Frame** below, in order. Fastest path: load the HTML at **1280×720**, step
   through scenes (← / →, or click the dots), and capture each scene as the frame still — or
   screen-record it straight through for a no-effort MP4.
2. **Or generate fresh** from the `Visual` descriptions below if Hyperframes composes its own art.
3. **Voiceover / captions:** use each frame's `Voiceover` as the narration script and `On-screen`
   as the burned-in caption. The full VO script is concatenated at the bottom.
4. **Run it** with your Hyperframes pipeline, e.g. (adjust to your actual command/flags):
   ```bash
   hyperframes render docs/fb-lane/how-to-interact.hyperframes.md -o how-to-interact.mp4
   ```
   > Note: this file follows a generic frame-spec layout. If your Hyperframes expects a specific
   > schema (field names, frame delimiters, frontmatter), remap these fields — the content is the
   > source of truth.

## Global style
- Dark UI, ~16px sans-serif, monospace for code/branches. Lane accent colors per `palette`.
- Mock "screenshots" = chat-thread windows (title bar with 3 traffic-light dots + lane name +
  "live" pulse), chat bubbles, small code/diff blocks, a board table, and a branch/merge graph.
- Pacing: calm, one idea per frame. Fade/slide transitions (~0.5s). Soft ambient track, low.
- Lane icons: Product = flag (amber), Tech = `</>` brackets (blue), Design = pen nib (violet),
  Business = document (green).

---

## Frame 1 — Title  ·  4.2s
- **On-screen:** “Run multiple AI agents on one codebase.”  /  sub: “Concurrently. Each in its own thread. **Zero merge conflicts.**”  /  four lane chips: Product · Tech · Design · Business.
- **Visual:** Centered title card on dark bg. The four colored lane icon-chips animate in beneath the title. Small kicker label “FB-Lane Coordination Framework”.
- **Voiceover:** “What if you could point several AI agents at the same codebase — at the same time — and never untangle a merge conflict? That’s FB-Lane.”
- **Transition:** fade to Frame 2.

## Frame 2 — BEFORE (the problem)  ·  6.0s
- **On-screen:** red tag “❌ Without FB-Lane”  ·  title “Three agents, one file, no rules.”  ·  stamp “💥 MERGE CONFLICT”.
- **Visual:** Three red-topped chat windows side by side — “Agent A / B / C” — each editing the **same** file `app.ts` (one adds login, one restyles the header, one edits copy). Mini diffs show overlapping `- export const app…` edits; the third window shows git conflict markers (`<<<<<<< HEAD … =======`). A “💥 MERGE CONFLICT” stamp slams in over them.
- **Voiceover:** “Without coordination, it’s chaos. Three agents, told to do different things, all reach for the same file. They overwrite each other — merge conflicts, a broken main, bloated context.”
- **Transition:** hard cut (tension) to Frame 3.

## Frame 3 — The board (the fix)  ·  5.2s
- **On-screen:** green tag “✅ With FB-Lane”  ·  title “One shared board. Every file claimed.”
- **Visual:** A `PROJECT_BOARD.md` table fades in: rows TASK-002 (FB-Tech · 🔒 `src/auth.ts, src/db.ts` · `tech/TASK-002`), TASK-003 (FB-Design · 🔒 `src/navigation.css` · `design/TASK-003`), TASK-004 (FB-Business · 🔒 `docs/onboarding.md` · `business/TASK-004`). All “In Progress”. Highlight that the locked-file columns never overlap.
- **Voiceover:** “FB-Lane fixes this with one shared source of truth — the project board. Every task declares the exact files it locks, so no two agents touch the same thing.”
- **Transition:** fade to Frame 4.

## Frame 4 — AFTER: concurrent lanes  ·  6.5s
- **On-screen:** green tag “✅ Concurrent · isolated”  ·  title “Three lanes. Three threads. At once.”
- **Visual:** Three lane-colored chat windows running simultaneously (each with a green “live” pulse):
  - **@fb-tech** (blue): “build the auth endpoints” → “Claimed **TASK-002**” · pills `src/auth.ts` `src/db.ts` `tech/TASK-002`.
  - **@fb-design** (violet): “responsive nav” → “Claimed **TASK-003**” · pills `src/navigation.css` `design/TASK-003`.
  - **@fb-business** (green): “onboarding copy” → “Drafting **TASK-004** (read-only on code)” · pills `docs/onboarding.md` `business/TASK-004`.
- **Voiceover:** “Now each lane runs in its own thread — Tech on the API, Design on the styles, Business on the copy — each on its own locked files and its own branch, all at the same time. Different files, different branches: they can’t collide.”
- **Transition:** fade to Frame 5.

## Frame 5 — Driving a lane directly  ·  5.6s
- **On-screen:** kicker “Talking to a lane (Claude Code)”  ·  title “Type `@fb-design` and ask.”
- **Visual:** Single centered violet window. User: “**@fb-design** I need new icons.” Agent: “On it — claiming + locking,” pills `design/TASK-Q-1014` `src/assets/icons/`. Then “Done ✅ — 4 icons + preview” with the four lane icons appearing. Footnote line: “Prefer hands-off? Tell the **main thread** your goal — FB-Product delegates.”
- **Voiceover:** “Driving a lane is simple. Type @fb-design and ask. It claims the task, locks the files, branches, builds — and hands back. Prefer hands-off? Just tell the main thread your goal, and Product delegates for you.”
- **Transition:** fade to Frame 6.

## Frame 6 — PRODUCT sequences & resolves  ·  6.5s
- **On-screen:** amber tag “FB-Product · integration gate”  ·  title “Product sequences & resolves at the end.”
- **Visual:** A branch/merge graph: blue `tech`, violet `design`, green `business` branches curve into a single amber `main ✓` node. Beside it, three status lines tick green: “Reviewed 3 branches · code is disjoint ✓”, “Board conflict on `PROJECT_BOARD.md` → resolved (kept both) ✓”, “Merged to `main`. Clean. ✅”.
- **Voiceover:** “At the end, the Product lane steps in. It reviews every branch, sequences the merges, and resolves the only thing that ever overlaps — the board itself. Your actual code merges clean.”
- **Transition:** fade to Frame 7.

## Frame 7 — Closing  ·  5.2s
- **On-screen:** “Multiple agents. One codebase. **Zero collisions.**”  ·  two start hints: “Describe a goal → Product delegates” and chips “@fb-tech · @fb-design · @fb-business”  ·  footer “FB-Lane Coordination Framework · `docs/fb-lane/`”.
- **Visual:** Centered closing card; lane chips settle in; subtle glow on “Zero collisions.”
- **Voiceover:** “Multiple agents. One codebase. Zero collisions. That’s FB-Lane.”
- **Transition:** fade out.

---

## Full voiceover script (continuous)
> What if you could point several AI agents at the same codebase — at the same time — and never untangle a merge conflict? That’s FB-Lane.
>
> Without coordination, it’s chaos. Three agents, told to do different things, all reach for the same file. They overwrite each other — merge conflicts, a broken main, bloated context.
>
> FB-Lane fixes this with one shared source of truth — the project board. Every task declares the exact files it locks, so no two agents touch the same thing.
>
> Now each lane runs in its own thread — Tech on the API, Design on the styles, Business on the copy — each on its own locked files and its own branch, all at the same time. Different files, different branches: they can’t collide.
>
> Driving a lane is simple. Type @fb-design and ask. It claims the task, locks the files, branches, builds — and hands back. Prefer hands-off? Just tell the main thread your goal, and Product delegates for you.
>
> At the end, the Product lane steps in. It reviews every branch, sequences the merges, and resolves the only thing that ever overlaps — the board itself. Your actual code merges clean.
>
> Multiple agents. One codebase. Zero collisions. That’s FB-Lane.
