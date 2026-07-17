# FB

**AI Loop Engineering for Everyday People**

**FB is a Codex plugin that connects six product workstreams in one continuous
delivery loop. Each workstream investigates part of the problem; `$bfm` brings
their ready recommendations together, prioritizes the work, directs Codex
implementation, runs automated checks, and prepares the result for release.**

FB means **Focus Bridge**: it bridges discussion, evidence, implementation, and
delivery.

## Problems FB solves

| Common problem | What FB does |
|---|---|
| Product decisions are scattered across chats | Actionable findings become durable handoff MD files. |
| User evidence and assumptions get mixed together | Product/User labels evidence, decisions, and assumptions separately. |
| Teams build before resolving important unknowns | Discovery investigates uncertainty before implementation. |
| Bug reports lack reproduction or severity | Bugs turns reports into observable, prioritized evidence. |
| Business, design, and technical advice conflicts | Product reconciles it during `$bfm`. |
| Users must manually combine agent output | `$bfm` scans and sequences all six workstreams. |
| Tests fail and responsibility returns to the user | FB owns bounded diagnosis and repair. |
| Nobody knows whether work is ready | FB reports automated verification, optional links, and **Ready to ship**. |
| AI releases without final approval | Only **Push Live** authorizes merge or deployment. |

## One big loop, six mini-loops

| Workstream | Its question |
|---|---|
| Product/User | What user outcome should we deliver? |
| Business | Should and how can this succeed commercially? |
| Design | How should the experience work and feel? |
| Tech | How can this be built safely and reliably? |
| Discovery | What do we still need to learn? |
| Bugs | What is broken and how do we prove it? |

Each relevant workstream follows:

```text
Question → Investigate → Gather evidence → Recommend → Create handoff MD
```

```mermaid
flowchart TB
    subgraph M["Six workstream mini-loops"]
        direction LR
        PU["Product/User<br/>Question → Evidence<br/>→ Recommendation → Question"]
        BU["Business<br/>Question → Evidence<br/>→ Recommendation → Question"]
        DE["Design<br/>Question → Evidence<br/>→ Recommendation → Question"]
        TE["Tech<br/>Question → Evidence<br/>→ Recommendation → Question"]
        DI["Discovery<br/>Question → Evidence<br/>→ Recommendation → Question"]
        BG["Bugs<br/>Question → Evidence<br/>→ Recommendation → Question"]
    end

    PU --> H
    BU --> H
    DE --> H
    TE --> H
    DI --> H
    BG --> H
    H["Ready handoff MD files"]
    B["$bfm scans all six"]
    P["Prioritize and sequence"]
    C["Codex implements"]
    T["Automated testing and repair"]
    S["Ready to ship"]
    L["Push Live"]
    D["Merge and deploy"]
    F["Results and feedback"]
    N["New questions and results"]
    H --> B --> P --> C --> T --> S --> L --> D --> F
    F --> N
    N --> PU
    N --> BU
    N --> DE
    N --> TE
    N --> DI
    N --> BG
```

A workstream with nothing useful records **None relevant**. It does not invent
work merely to participate.

Build For Me (BFM) is the execution step. It begins only after Product approval
and explicit `$bfm`; see [start and approval](docs/fb/start.md).

## Install

```bash
codex plugin marketplace add friedbeef1/fb-lane-coordination
codex plugin add fb-lane-coordination@fb-lane
```

## Use FB

1. Open your project in Codex and say: `Set up FB in this project.`
2. Discuss your goal or question in the relevant workstream chats. This keeps different concerns clear without forcing every workstream to participate.
3. When a discussion becomes actionable, say: `Create a handoff MD for Product/BFM.` This preserves the recommendation and evidence outside the chat.
4. Say `$bfm`. Product scans all six workstreams, reconciles ready handoffs, prioritizes the sequence, and directs Codex implementation.
5. FB runs automated checks and owns bounded repair. Review optional links only when useful.
6. When FB reports **Ready to ship**, say **Push Live** to authorize merge and deployment.

## Honest comparison

| System | Good because | Gap FB addresses |
|---|---|---|
| Vanilla Codex | Directly executes clear software tasks. | Product decisions, evidence, priorities, verification, and release authority can remain scattered across chats. |
| Git worktrees | Isolate branches and allow parallel implementation without mixing files. | Worktrees do not decide what should be built, reconcile recommendations, prioritize work, preserve user decisions, or verify the product outcome. |
| Kurrent Capacitor | Automatically captures, recalls, observes, and evaluates agent sessions. | FB connects curated evidence to the approved brief, product decisions, execution authority, user-facing testing, and closeout. |
| BMAD | Provides a broad role-based AI development methodology. | FB provides a smaller repository-local Codex loop focused on ready handoffs, implementation, automated verification, and explicit release approval. |
| **FB** | Connects six product workstreams to Codex implementation, verification, and delivery. | — |

References: [OpenAI Codex](https://openai.com/codex/), [Git
worktree](https://git-scm.com/docs/git-worktree), [Kurrent
Capacitor](https://capacitor.kurrent.io/docs/getting-started/what-is-capacitor/),
and [BMAD](https://github.com/bmad-code-org/BMAD-METHOD).

FB also provides curated session recall and evaluation, but it deliberately does
not require comprehensive transcript capture or hosted telemetry. See
[Why FB](docs/why-fb.md) for the detailed comparison and real examples.

## Learn more

- [FAQ](FAQ.md)
- [How the harness works](docs/fb/README.md)
- [Start and approval](docs/fb/start.md)
- [Workflow and `$bfm`](docs/fb/workflow.md)
- [Evidence and review](docs/fb/evidence.md)
- [Safety, sidechat routing, and recovery](docs/fb/guardrails.md)

Technical identifiers such as `fb-lane`, `fb-lane-coordination`, plugin IDs,
commands, MCP names, and paths remain unchanged.
