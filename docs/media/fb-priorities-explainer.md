# FB explainer — What should happen next?

Status: script and storyboard candidate, not a rendered video.
Audience: hands-on product managers and founders using Codex across several
conversations. Target: 100–115 seconds, landscape 16:9, captioned, legible on a
phone. Suggested production: Hyperframes, original diagram/card animation;
no private conversations, customer data, invented testimonials or savings.

## Script and storyboard

| Time | Narration | On-screen visual |
|---|---|---|
| 0–12s | Product thinking isn't one prompt and one answer. It's a deep conversation: asking why, challenging assumptions, exploring alternatives, and coming back with new evidence. | One persistent conversation develops through several exchanges. Caption: “A place to think—not just a task to finish.” |
| 12–29s | FB is an open-source Codex plugin with six workstreams. Keep discussing design while Tech investigates constraints and Business explores the market. Return to those same chats, even when nothing is being built. | Six labelled cards: User, Business, Design, Tech, Discovery, Bugs. Zoom into three ongoing conversations; some cards remain idle. No private chat footage. |
| 29–43s | These aren't one-shot agents. You can keep exploring, change your mind, or leave a question open. When a conclusion becomes actionable, capture its evidence and decisions in a handoff—not the entire conversation. | Design question → alternative → challenge → revised conclusion. One conclusion becomes a handoff; the conversation stays open. |
| 43–57s | Sending a handoff does not start a build. When you invoke BFM in Product, it connects the recorded conclusions and proposes what goes first, what's blocked, and what should wait—with reasons. | Inbox shows “Noted. No work started.” Then `$bfm` → proposed queue with prerequisites and blocker owner. |
| 57–77s | What if the CEO needs a demo first? That becomes the business priority. But the login fix still needs security approval. FB explains the prerequisite, which work would move, and what can safely continue. | Label “Illustrative example.” Demo linked to blocked login fix; reporting marked “Proposed deferral”; unrelated approved copy unchanged. |
| 77–96s | You can change the proposed priorities. Codex implements the approved scope; Push Live stays a separate release decision. Results return to the workstreams, giving your next conversation something concrete to build on. | Approved queue → implementation → verification → Ready to ship → Push Live. Results arrow returns to the same workstream chats. Never animate automatic release. |
| 96–110s | You can have these conversations without FB. FB gives you a consistent way to connect deep thinking across workstreams to decisions, priorities and delivery—without turning every discussion into a build. | “Think deeply. Connect conclusions. Decide what happens next.” Repository link and optional `$fb-setup` CTA. |

## Production notes

- Give ongoing conversations the opening third of the film, not a passing mention.
- Show repeated questions and revisions in the same chats, not six instant answers.
- Then connect selected conclusions to a changing queue with reasons.
- Do not imply unlimited chat memory, transcript capture or automatic chat access.
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
