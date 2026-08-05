# Full FB Graph Diagram

[Overview](../../README.md) · [Agile Teams](https://github.com/friedbeef1/fb-lane-coordination/blob/main/docs/fb-for-agile-teams.md) · [Why FB](../why-fb.md) · [Full Loop](full-loop.md)

This is the complete operating view of FB's **Graph Engineering** system. The graph
is the map connecting decisions, evidence, dependencies, implementation,
verification, and release state. Workstream loops show how work learns and
moves inside that map; `$bfm` navigates and executes it, while **Push Live**
authorizes release. This is not a graph database, knowledge graph, or GraphQL
architecture.
The [workflow](workflow.md) defines the detailed execution and return-loop
contract.

```mermaid
flowchart TB
    G["Living product-delivery graph<br/>decisions · evidence · dependencies · implementation · verification"]
    subgraph W["1. Six workstream learning loops"]
        direction LR
        PU["Product/User<br/>Question → Evidence → Recommend → Question"]
        BU["Business<br/>Question → Evidence → Recommend → Question"]
        DE["Design<br/>Question → Evidence → Recommend → Question"]
        TE["Tech<br/>Question → Evidence → Recommend → Question"]
        DI["Discovery<br/>Question → Evidence → Recommend → Question"]
        BG["Bugs<br/>Question → Evidence → Recommend → Question"]
    end

    G --> PU
    G --> BU
    G --> DE
    G --> TE
    G --> DI
    G --> BG
    PU --> RH
    BU --> RH
    DE --> RH
    TE --> RH
    DI --> RH
    BG --> RH

    subgraph I["2. Handoff intake"]
        RH["ready handoffs<br/>Product intake candidates"]
        BH["blocked handoffs<br/>Visible, not executed"]
        NR["None relevant<br/>No work manufactured"]
    end

    RH --> BFM["User says $bfm"]
    BFM --> PR
    BH --> PR
    NR --> PR
    PR["Product freezes, reconciles, and prioritizes<br/>the graph before source execution"]
    PR --> G
    PR --> A{"Approved and clear?"}
    A -->|"Yes"| SP["Plan bounded slices<br/>outcome, locks, dependencies, proof"]
    A -->|"Changed decision, conflict, sensitive boundary, or unclear scope"| X["Paused<br/>Owner and next action"]
    SP --> PA["Independent slices<br/>parallel agents"]
    SP --> SE["Dependent or overlapping slices<br/>sequential"]
    PA --> C["BFM implements and integrates<br/>completed slices"]
    SE --> C
    C --> V["Automated checks<br/>focused per slice, integration at boundaries"]
    V -->|"Focused failure evidence"| R["Scoped repair"]
    R --> C
    V --> G
    V -->|"Required checks pass"| O["Optional review links<br/>Your input needed: none, unless stated"]
    O --> S["Ready to ship"]
    S --> L{"Push Live?"}
    L -->|"Not yet"| S
    L -->|"Approved"| D["Merge and deploy"]
    D --> Z["Results and feedback"]
    Z --> N["New questions, opportunities, and defects"]
    N --> PU
    N --> BU
    N --> DE
    N --> TE
    N --> DI
    N --> BG
    X --> N
```

- A `ready` handoff is ready for Product intake, not approval or execution
  authority. `blocked` work remains visible, while **None relevant** prevents a
  workstream from inventing work.
- `$bfm` freezes intake. Product must disposition every candidate as **Include
  now**, **Blocked**, **Deferred**, **Duplicate**, **Rejected**, or
  **Superseded** before source execution. Product then reconciles duplicates,
  conflicts, and dependencies, prioritizes and sequences only **Include now**
  candidates, and records the Product plan plus Build Brief before BFM
  execution. It plans the smallest useful dependency graph up front:
  independent, non-overlapping slices may use parallel agents; dependent,
  shared-file, or unresolved work remains sequential. Internal routing remains
  private.
- A substantial outcome may run for hours across bounded slices. FB uses focused
  proof per slice, integration checks at meaningful combinations, and broad
  validation only at a release checkpoint. Unexpected complexity resplits the
  remaining work without discarding completed slices.
- FB owns scoped repair within each slice's loop budget.
  Optional review links provide visibility without returning routine QA to the
  user.
- **Ready to ship** means the required checks passed. Only **Push Live**
  authorizes merge and deployment.
