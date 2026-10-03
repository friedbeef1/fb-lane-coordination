# FB explainer — What should happen next?

Status: script and storyboard candidate, not a rendered video.
Audience: hands-on product managers and founders using Codex across several
conversations. Target: 100–115 seconds, landscape 16:9, captioned, legible on a
phone. Suggested production: Hyperframes, original diagram/card animation;
no private conversations, customer data, invented testimonials or savings.

## Script and storyboard

Before means **without FB Lanes**; after means **with FB Lanes**. Use the same
illustrative project, person, model and inputs on both sides. This is not a
comparison of old and new FB, nor a measured performance demonstration.

| Time | Narration | On-screen visual |
|---|---|---|
| 0–16s | Without FB Lanes, you can already have deep, ongoing conversations with Codex: debate design, investigate technical constraints, explore the market. Ask follow-ups. Challenge answers. Keep thinking even when nothing is being built. | Persistent label “Without FB Lanes.” Three chats each show several exchanges; investigation overlaps. Show competent, useful outputs, not artificial chaos. |
| 16–32s | When you're ready to act, you can ask Codex to combine the findings and plan. You arrange the context and coordination: which conclusions matter, which commitments still apply, and how results return to each discussion. | Same chats → “Gather relevant conclusions” → “Ask for a combined plan.” Codex produces a useful plan. Caption: “Your own coordination process.” |
| 32–48s | With FB Lanes, keep those deep conversations. The plugin organizes them into ongoing workstreams. Capture actionable decisions and evidence in handoffs; leave other questions open. A handoff notification does not start a build. | Switch label to “With FB Lanes.” Same inputs become named workstream chats. One conclusion becomes a handoff; chats stay open. Inbox: “Noted. No work started.” |
| 48–64s | Invoke BFM in Product. Its established process brings recorded findings into a proposed queue: what goes first, prerequisites, blockers and deferrals—with reasons. You can change the proposal before execution. | `$bfm` → reasoned queue. Caption: “A reusable coordination process.” Blocker includes owner and next action. |
| 64–86s | Say the CEO needs a demo first. Without FB, ask Codex to assess the impact. With FB, that check is part of the priority-change contract: the security prerequisite remains, displaced work is shown, and uncertain impacts stay visible. | Paired “Without FB Lanes” / “With FB Lanes” view of the same demo. Left: explicit impact-analysis request. Right: standard priority-impact explanation. Both retain security gate; no fabricated failure on the left. |
| 86–102s | Codex does the implementation in both cases. FB adds the handoff, verification and result-return conventions. The results inform your next deep discussion. Push Live remains its separate release boundary. | Same execution engine on both sides. FB side returns linked results to original chats and shows Ready to ship → Push Live. |
| 102–115s | You can create these conventions yourself. FB packages them: think deeply across workstreams, connect conclusions, and decide what happens next. | Side-by-side labels remain. Closing: “Your own process / A reusable FB process.” Repository link and optional `$fb-setup` CTA. |

## Production notes

- Give ongoing conversations the opening third of the film, not a passing mention.
- Keep “Without FB Lanes” and “With FB Lanes” labels explicit throughout the comparison.
- Never portray vanilla as incapable of planning, coordination or safety; show the difference in supplied conventions.
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
