# Full FB Loop Diagram

This is the complete operating view of FB. The root README keeps a simpler
picture; this page shows how evidence becomes approved work, how BFM chooses an
execution path, and how delivery results restart the six workstream loops.

```mermaid
flowchart TB
    subgraph W["1. Six workstream mini-loops"]
        direction LR
        PU["Product/User<br/>Question → Evidence → Recommend → Question"]
        BU["Business<br/>Question → Evidence → Recommend → Question"]
        DE["Design<br/>Question → Evidence → Recommend → Question"]
        TE["Tech<br/>Question → Evidence → Recommend → Question"]
        DI["Discovery<br/>Question → Evidence → Recommend → Question"]
        BG["Bugs<br/>Question → Evidence → Recommend → Question"]
    end

    PU --> RH
    BU --> RH
    DE --> RH
    TE --> RH
    DI --> RH
    BG --> RH

    subgraph I["2. Handoff intake"]
        RH["ready handoffs<br/>Eligible for BFM"]
        BH["blocked handoffs<br/>Visible, not executed"]
        NR["None relevant<br/>No work manufactured"]
    end

    RH --> PR
    BH --> PR
    NR --> PR
    PR["Product reconciles<br/>duplicates, conflicts, dependencies, and priority"]
    PR --> A{"Approved and clear?"}
    A -->|"Bounded correction"| Q["Quick BFM"]
    A -->|"Material, risky, or multi-workstream"| F["Full BFM"]
    A -->|"Decision, evidence, or access missing"| X["Blocked<br/>Owner and next action"]

    Q --> C["Codex implements"]
    F --> C
    C --> V["Automated checks"]
    V -->|"Focused failure evidence"| R["Scoped repair"]
    R --> C
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

- Only valid `ready` handoffs enter execution. `blocked` work remains visible,
  while **None relevant** prevents a workstream from inventing work.
- Product reconciles the evidence and chooses the sequence. Quick BFM handles
  approved bounded corrections; Full BFM handles material or risky work.
- FB runs automated checks and owns scoped repair within its loop budget.
  Optional review links provide visibility without returning routine QA to the
  user.
- **Ready to ship** means the required checks passed. Only **Push Live**
  authorizes merge and deployment.
