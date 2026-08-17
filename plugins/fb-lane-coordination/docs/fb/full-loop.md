# Full FB Graph Diagram

[Overview](../../README.md) · [Agile Teams](https://github.com/friedbeef1/fb-lane-coordination/blob/main/docs/fb-for-agile-teams.md) · [Why FB](../why-fb.md) · [Full Loop](full-loop.md)

This is the complete operating view of FB's **Graph Engineering** system. The graph
is the map connecting decisions, evidence, dependencies, implementation,
verification, and release state. Workstream loops show how work learns and
moves inside that map; `$bfm` navigates and executes it, while **Push Live**
authorizes release. This is not a graph database, knowledge graph, or GraphQL
architecture.
**The graph is the map.**
The [workflow](workflow.md) defines the detailed execution and return-loop
contract.

The **evidence graph** answers what should be built from relevant workstream
findings. The **execution graph** answers how the approved Product plan is
built and checked. Users see one sequence: **Goal → Split → only the relevant
workstreams → Verify evidence → Merge findings → Implement → Verify candidate
→ One clear result**.

```mermaid
flowchart TB
    G["1. Goal"] --> SP["2. Split into only relevant questions"]
    subgraph W["Evidence graph: selected workstream loops"]
        direction LR
        US["User<br/>Question → Evidence → Recommend → Question"]
        BU["Business<br/>Question → Evidence → Recommend → Question"]
        DE["Design<br/>Question → Evidence → Recommend → Question"]
        TE["Tech<br/>Question → Evidence → Recommend → Question"]
        DI["Discovery<br/>Question → Evidence → Recommend → Question"]
        BG["Bugs<br/>Question → Evidence → Recommend → Question"]
    end

    SP -.->|when relevant| US
    SP -.->|when relevant| BU
    SP -.->|when relevant| DE
    SP -.->|when relevant| TE
    SP -.->|when relevant| DI
    SP -.->|when relevant| BG
    US --> RH
    BU --> RH
    DE --> RH
    TE --> RH
    DI --> RH
    BG --> RH

    subgraph I["3. Relevant workstreams send handoffs"]
        RH["ready handoffs<br/>Product intake candidates"]
        BH["blocked handoffs<br/>Visible, not executed"]
        NR["None relevant<br/>No work manufactured"]
    end

    RH --> BFM["Send this to Product<br/>User says $bfm in Product/BFM control centre"]
    BFM --> EV["4. Verify evidence<br/>support · conflicts · blockers · criteria"]
    EV --> PR
    BH --> PR
    NR --> PR
    PR["5. Merge findings into one Product plan<br/>(not a Git merge)"]
    PR --> A{"Approved and clear?"}
    A -->|"Yes"| ES["Execution graph<br/>bounded slices · dependencies · focused proof"]
    A -->|"Changed decision, conflict, sensitive boundary, or unclear scope"| X["Paused<br/>Owner and next action"]
    ES --> PA["Independent slices<br/>parallel agents"]
    ES --> SE["Dependent or overlapping slices<br/>sequential"]
    PA --> C["BFM implements and integrates<br/>completed slices"]
    SE --> C
    C --> V["6. Implement<br/>Automated checks: focused proof per slice"]
    V -->|"Focused failure evidence"| R["Scoped repair"]
    R --> C
    V -->|"Slice proofs pass"| IV["7. Verify candidate<br/>one fresh-context integrated proof"]
    IV -->|"Required checks pass"| O["Optional review links<br/>Your input needed: none, unless stated"]
    O --> S["8. One clear result<br/>Ready to ship"]
    S --> L{"Push Live?"}
    L -->|"Not yet"| S
    L -->|"Approved"| D["Merge and deploy"]
    D --> Z["Results and feedback"]
    Z --> G
    X --> G
```

- A `ready` handoff is ready for Product intake, not approval or execution
  authority. `blocked` work remains visible, while **None relevant** prevents a
  workstream from inventing work.
- Product/BFM freezes and reconciles the `$bfm` intake. Product must disposition every candidate as **Include
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
