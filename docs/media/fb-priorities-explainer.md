# FB explainer — What should happen next?

Status: script and storyboard candidate, not a rendered video.
Audience: hands-on product managers and founders using Codex across several
conversations. Target: 75–90 seconds, landscape 16:9, captioned, legible on a
phone. Suggested production: Hyperframes, original diagram/card animation;
no private conversations, customer data, invented testimonials or savings.

## Script and storyboard

| Time | Narration | On-screen visual |
|---|---|---|
| 0–10s | You can have several useful conversations with AI. But when they all contribute to one product, what should happen next? | Three clean cards: customer feedback, design proposal, technical constraint. Title: “What should happen next?” |
| 10–23s | FB is an open-source Codex plugin. Explore user needs, business, design, technology, discovery and bugs in separate workstreams—even before you're ready to build. | Six labelled workstream cards. Some remain idle. Caption: “Explore first. Commit deliberately.” |
| 23–36s | Save actionable findings as handoffs. A notification can be acknowledged without starting work. When you invoke BFM in Product, it brings the recorded findings into one proposed queue. | Handoff cards enter an inbox, not a code editor. Show “Noted. No work started.” Then show `$bfm` and a queue. |
| 36–49s | You see what should proceed, what must happen first, what is blocked, and what should wait—with reasons. You can change that proposed order before execution. | Queue columns: Next / Must happen first / Blocked / Deferred. A blocker shows owner and next action. |
| 49–68s | What if the CEO needs a demo first? That becomes the business priority. But the login fix still needs security approval. FB explains the prerequisite, which work would move, and what can safely continue. | Label “Illustrative example.” CEO demo rises in business priority but remains linked to blocked login fix. Reporting moves to “Proposed deferral.” Unrelated approved copy stays unchanged. |
| 68–80s | You set the priorities. Product/BFM works through the delivery implications. Codex plans the technical work and implements the approved scope. Push Live remains a separate release decision. | User priority → Product/BFM queue → Codex implementation → verification → Ready to ship → Push Live. Never animate an automatic release. |
| 80–90s | You don't need FB to use separate chats. Use it when you want a consistent way to connect their findings, decisions and delivery. | “Know what to do next—and what changes when priorities change.” Repository link; optional `$fb-setup` CTA. |

## Production notes

- Primary visual: a changing queue with reasons, not a wall of graph nodes.
- Graph relationships appear only when explaining a prerequisite or impact.
- Use 3–4 short labels at a time; distinguish priority from execution order.
- Use captions plus optional narration; do not depend on audio to explain gates.
- No speed, token, revenue, adoption or guaranteed-error-prevention claims.
- No simulated UI presented as a live Codex screen. Label diagram examples.
- Reuse the old demo only as historical reference, not current product footage.
- Before rendering, validate narration against the shipped candidate, choose
  voice/music assets with permission, and review actual frames for readability.
- The current plugin is Codex-only. Do not imply native Claude installation.

## Existing video

The [June 2026 demo](../../codex-lane-demo/README.md) has a published MP4 and
Hyperframes source. It predates this story. Preserve it as historical; this
script is its proposed replacement, not a claim that a new video exists.

## Sources for the story

- [Public explanation](../why-fb.md#when-a-priority-is-forced-in)
- [Priority and override contract](../fb/workflow.md#product-priorities-and-delivery-implications)
- [Queue approval](../fb/workflow.md#queue-preview-and-approval)
- [Notification-only delivery](../fb/workflow.md#product-handoff-delivery-states)
