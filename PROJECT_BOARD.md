# Project Board

## Statuses
- `Inbox`: Newly requested tasks requiring triage.
- `Ready`: Triaged tasks, fully scoped, ready to be claimed.
- `In Progress`: Tasks currently being worked on by an owner.
- `Staging QA`: Candidate awaiting verification. Record the actual local, sandbox, staging, or completed-build environment separately.
- `Done`: Checked, verified, and merged to production by FB-Product.

---

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-075 | Staging QA | FB-Product / BFM | User workstream and Product/BFM control centre; FB 0.5.9-beta | Replace Product/User with User, add the Product/BFM control centre, and converge onboarding on seven pinned repository tasks | Canonical candidate, generated package mirrors, version/metadata contracts, and release records | Checking — focused candidate green for `0.5.9-beta+codex.20260805042523`; changelog approved by James on 2026-08-05; final release validator pending; [Handoff](docs/handoffs/TASK-075.md); [QA](docs/qa/TASK-075.md) |
| TASK-074 | Done | FB-Product / BFM | Graph Engineering positioning and FB 0.5.8-beta | Make Graph Engineering the headline product category, align the public story and packaged plugin, and preserve existing runtime contracts | None; published and installed | [Handoff](docs/handoffs/TASK-074.md); [QA](docs/qa/TASK-074.md); [PR #58](https://github.com/friedbeef1/fb-lane-coordination/pull/58) merged as `72bfab0`; exact build installed and enabled |
| TASK-073 | Done | FB-Product / BFM | Evaluation results, meaningful repair, and FB 0.5.7-beta | Show eval results clearly, reject superficial repair loops, and publish `0.5.7-beta+codex.20260804131420` | None; published and installed | [Handoff](docs/handoffs/TASK-073.md); [QA](docs/qa/TASK-073.md); [PR #57](https://github.com/friedbeef1/fb-lane-coordination/pull/57) merged as `c1e63f1`; exact build installed and enabled |
| TASK-072 | Done | FB-Product / BFM | Lifecycle truth, historical retrieval, and FB 0.5.6-beta | Keep routine orientation current-state only while preserving complete on-demand history; publish `0.5.6-beta+codex.20260804045203` | None; published and installed | [Handoff](docs/handoffs/TASK-072.md); [QA](docs/qa/TASK-072.md); [PR #56](https://github.com/friedbeef1/fb-lane-coordination/pull/56) merged as `894d4a1`; exact build installed and enabled |
| TASK-071 | Done | FB-Product / BFM | Cross-workstream planning handoffs | Queue cross-workstream planning and keep routine circuit-breaker recovery with Product/BFM | Published and installed as `0.5.5-beta+codex.20260803212323` | [Handoff](docs/handoffs/TASK-071.md); [QA](docs/qa/TASK-071.md); PR #54 merged as `2c3dc4c` |
| TASK-067 | Done | FB-Product / BFM | Conversation execution authority + Plugin Release | Define conversation authority and publish FB `0.5.4-beta+codex.20260801143809` | None; published and installed globally | [Handoff](docs/handoffs/TASK-067.md); [QA](docs/qa/TASK-067.md); PR #53 merged as `cfa1632` |
| TASK-066 | Done | FB-Product / BFM | Verification autonomy + Plugin Release | Require BFM to run every safe locally executable check itself and publish FB 0.5.3-beta after explicit Push Live approval | None; published and installed | [Handoff](docs/handoffs/TASK-066.md); [QA](docs/qa/TASK-066.md); published build `0.5.3-beta+codex.20260801141345` |
| TASK-Q-20260713-SIDECHAT-PARENT | Done | FB-Product | Coordination | Define and distribute a parent-thread-only sidechat handoff rule for this project and the Codex FB-Lane plugin | `docs/sidechat-parent-thread-routing.md`, `AGENTS.md`, bundled FB-Lane coordination skills and docs | [Handoff](docs/handoffs/TASK-Q-20260713-SIDECHAT-PARENT.md); released in [PR #39](https://github.com/friedbeef1/fb-lane-coordination/pull/39) as `0.2.0-beta+codex.20260716052513` |

---

### TASK-075 - User workstream and Product/BFM control centre

*   **Status**: Ready to ship — `0.5.9-beta+codex.20260805042523`; changelog
    approved and clean release checkpoint passed; **Push Live** required.
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Onboarding runtime, sidebar migration, skills, public and harness
    documentation, plugin metadata, templates, contracts, and package mirrors.
*   **Scope**: Establish User, Business, Design, Tech, Discovery, and Bugs as
    evidence workstreams; establish Product/BFM as the control centre; converge
    fresh and legacy projects on seven pinned repository-scoped tasks.
*   **Out of Scope**: Consumer-repository mutation in this slice, app-level task
    discovery, implicit execution, merge, publication, reinstall, or deployment.
*   **Goal Alignment Session**:
    *   **Objective**: Make ownership and navigation obvious without weakening
        compatibility or release authority.
    *   **Key Results**: Seven-task setup is repository-scoped and idempotent;
        Product/User migrates to User; Product/BFM is unique; all observed tasks
        are pinned or exact failures are reported; root/package guidance agrees.
    *   **Definition of Done**: Focused runtime and structural contracts,
        package parity, metadata, syntax, links, whitespace, doctor, changelog
        approval, and one final release checkpoint pass.
    *   **Approval**: approved.
    *   **Justification**: James invoked `$bfm` after directing implementation
        of the frozen TASK-075 scope in Product/BFM.
*   **Gate / Review Point**: James invoked `$bfm`, approved the exact
    0.5.9-beta changelog, and approved the clean-worktree release checkpoint on
    2026-08-05. The complete validator and Doctor Ready passed. **Push Live**
    remains the only release authorization.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-075.md) ·
    [QA](docs/qa/TASK-075.md) ·
    [plan](docs/superpowers/plans/2026-08-05-user-product-bfm-control-centre.md).

---

### TASK-074 - Graph Engineering positioning

*   **Status**: Done — PR #58 merged as `72bfab0`; marketplace upgraded;
    `0.5.8-beta+codex.20260804153114` installed and enabled.
*   **Owner / Thread**: FB-Product / BFM.
*   **Area**: Public product category, explanation, diagram, plugin guidance,
    marketplace copy, metadata, versioning, and structural contracts.
*   **Scope**: Make **Graph Engineering for Everyday People** the headline;
    explain graph as the delivery map and loops as movement inside it; preserve
    `$bfm` navigation/execution and **Push Live** release authority; package as
    `0.5.8-beta+codex.20260804153114`.
*   **Out of Scope**: Runtime behavior changes, graph database or GraphQL
    concepts, technical identifier migration, consumer-repository changes,
    merge, marketplace publication, reinstall, or deployment before approval.
*   **Goal Alignment Session**:
    *   **Objective**: Give FB a clear, understandable category that accurately
        describes how it connects scattered conversations to product delivery.
    *   **Key Results**: Graph Engineering is the primary active tagline; one
        accessible explanation and primary diagram tell the same story; plugin
        and public metadata agree; historical facts and runtime contracts remain
        unchanged.
    *   **Definition of Done**: Focused positioning, metadata, release, package
        parity, link, syntax, and whitespace checks pass; James approves the
        changelog; one final release checkpoint then passes.
*   **Gate / Review Point**: Complete. James approved the changelog and **Push
    Live**; GitHub readiness, merge, marketplace reinstall, and active checks
    passed.
    *   **Approval**: approved through `$bfm` intake of James's ready Product
        positioning handoff.
    *   **Justification**: Product reconciled the sole incoming handoff and
        selected one bounded release slice with no competing work.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-074.md) ·
    [QA](docs/qa/TASK-074.md).

---

### TASK-073 - Evaluation results and meaningful repair

*   **Status**: Done — PR #57 merged as `c1e63f1`; marketplace upgraded;
    `0.5.7-beta+codex.20260804131420` installed and enabled.
*   **Owner / Thread**: FB-Product / BFM, named one-off sidechat exception.
*   **Area**: Eval result visibility and repair quality.
*   **Scope**: Distinguish eval definitions from evaluation results; add a
    compact result table; require sufficient, causally relevant repairs,
    original-scenario rerun, focused regression proof, and no-progress stop.
*   **Out of Scope**: New semantic judge, numeric score, automatic eval
    promotion, plugin version change, publication, merge, or reinstall.
*   **Goal Alignment Session**:
    *   **Objective**: Make eval outcomes understandable while preventing
        cosmetic repairs that merely circle a failed criterion.
    *   **Key Results**: Root/package guidance agrees; selected results link to
        evidence and delivery effect; superficial repairs fail the contract.
    *   **Definition of Done**: Focused root/package eval tests, 58-mirror
        parity, syntax, and whitespace pass.
    *   **Gate / Review Point**: James approved the exact 0.5.7-beta changelog
        wording on 2026-08-04. The release checkpoint and publication passed.
    *   **Approval**: approved.
    *   **Justification**: James explicitly confirmed the named one-off
        sidechat documentation and plugin update.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-073.md) ·
    [QA](docs/qa/TASK-073.md).

---

### TASK-072 - Lifecycle truth and historical retrieval

*   **Status**: Done — PR #56 merged as `894d4a1`; marketplace upgraded;
    `0.5.6-beta+codex.20260804045203` installed and enabled.
*   **Owner / Thread**: FB-Product / BFM.
*   **Area**: Active-state orientation, lifecycle reconciliation, archived
    retrieval, and plugin release guidance.
*   **Scope**: Reconcile historical Staging QA truth; keep active board packets
    and workstream cards compact; preserve exact archives, handoffs, QA, and Git
    retrieval; align Product/BFM/setup/coordination guidance and release
    metadata.
*   **Out of Scope**: Technical identifier changes, automatic deletion,
    publication, merge, marketplace upgrade, reinstall, or deployment.
*   **Goal Alignment Session**:
    *   **Objective**: Reduce routine orientation overhead without hiding or
        weakening durable historical evidence.
    *   **Key Results**: Zero unsupported lifecycle closure; current packets
        contain genuine active state; all 21 reconciled tasks remain exactly
        retrievable; ready remains Product intake rather than execution; root
        and package guidance agree.
    *   **Definition of Done**: Focused lifecycle, board, graph, onboarding,
        metadata, parity, syntax, link, and whitespace checks pass; changelog
        wording is approved; the one final release validator then passes.
    *   **Gate / Review Point**: James approved the drafted 0.5.6-beta
        changelog and the historical compatibility repair on 2026-08-04.
        The single release checkpoint passed; invented retrospective OKRs remain
        forbidden. James approved **Push Live** and publication completed.
    *   **Approval**: approved.
    *   **Justification**: James explicitly approved execution of the lifecycle
        truth and historical retrieval plan in this Product/BFM parent task.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-072.md) ·
    [QA](docs/qa/TASK-072.md) ·
    [changelog draft](CHANGELOG.md#056-beta--2026-08-04).

---

### TASK-071 - Workstream-to-workstream queued handoffs

*   **Status**: Ready to ship — `0.5.5-beta+codex.20260803212323`; release checkpoint and revised changelog passed; **Push Live** required.
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Cross-workstream planning and evidence routing
*   **Scope**: Let any main workstream queue a durable planning handoff for
    another named workstream, with no automatic destination work and no
    execution authority.
*   **Out of Scope**: Source execution outside Product/BFM, automatic chat
    discovery, hosted routing, transcript capture, release, or deployment.
*   **Goal Alignment Session**:
    *   **Objective**: Move useful evidence directly between FB workstreams
        without turning Product into a relay or allowing handoff arrival to
        trigger unplanned work.
    *   **Key Results**: A distinct queued artifact type; explicit source and
        destination; user-controlled continuation; Product-ready output remains
        separate; `$bfm` ignores unfinished workstream handoffs.
    *   **Definition of Done**: The approved design is reviewed, implementation
        follows a focused RED/GREEN contract, canonical/package guidance agrees,
        and release remains behind its normal Product checkpoint.
    *   **Gate / Review Point**: James reviews the written design before Product
        writes the implementation plan.
    *   **Approval**: approved
    *   **Justification**: James explicitly approved queue-and-wait behavior for
        workstream-to-workstream handoffs on 2026-08-03.
*   **Links & Deliverables**: [design](docs/superpowers/specs/2026-08-03-workstream-to-workstream-handoffs-design.md) · [plan](docs/superpowers/plans/2026-08-04-cross-workstream-handoffs.md) · [handoff](docs/handoffs/TASK-071.md) · [QA](docs/qa/TASK-071.md).

### TASK-067 - Sidechat execution authority

*   **Status**: Done — published to GitHub `main`, marketplace upgraded, and
    `0.5.4-beta+codex.20260801143809` installed and enabled.
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Conversation execution authority
*   **Scope**: Define Product/BFM parent execution, workstream-parent planning,
    sidechat read-only behavior, and named one-use sidechat exceptions.
*   **Out of Scope**: Runtime permission machinery, CLI changes, unrelated
    consumer source changes, deployment, or provider mutation.
*   **Goal Alignment Session**:
    *   **Objective**: Prevent accidental sidechat mutation without slowing
        approved Product/BFM parent execution.
    *   **Key Results**: One canonical four-context table, explicit confirmation
        prompt, consumed exception, unchanged safety gates, and concise links from
        BFM plus all six workstream skills.
    *   **Definition of Done**: Focused skill contract, 53-mirror parity,
        metadata, complete validator, doctor, syntax, links, whitespace,
        GitHub merge, marketplace upgrade, reinstall, and active guidance pass.
    *   **Gate / Review Point**: Complete. James approved the changelog, push,
        merge, marketplace upgrade, and active-repository adoption on 2026-08-01.
    *   **Approval**: approved
    *   **Justification**: James supplied a ready Product/BFM handoff in this
        parent task and directed Product/BFM to implement the smallest solution.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-067.md) ·
    [QA](docs/qa/TASK-067.md) · [PR #53](https://github.com/friedbeef1/fb-lane-coordination/pull/53).

### TASK-066 - Automatic local verification

*   **Status**: Done — published to GitHub `main`, marketplace upgraded, and
    `0.5.3-beta+codex.20260801141345` installed and enabled.
*   **Owner / Thread**: FB-Product / BFM
*   **Area**: Verification autonomy
*   **Scope**: Make automatic execution the generic default for every safe,
    locally executable test, build, lint, typecheck, simulator/browser smoke,
    package consistency, Git, and deployment-source check available to BFM.
*   **Out of Scope**: Physical-device actions, unavailable credentials or
    accounts, payments, destructive/provider-state changes, subjective Product
    judgment, live release approval, CI automation, or a new test runner.
*   **Goal Alignment Session**:
    *   **Objective**: Remove routine test work from the user while preserving
        real human, external-access, and release boundaries.
    *   **Key Results**: Generic BFM and evidence guidance require automatic
        local verification, record results before asking for input, and name
        the narrow categories that still require the user.
    *   **Definition of Done**: The focused root/package skill contract fails
        before the guidance, passes after it, package mirrors match, and the
        isolated candidate is clean and committed.
*   **Gate / Review Point**: Complete. Focused skill contract, complete release
        validator, package parity, syntax/whitespace, doctor, GitHub `main`,
        marketplace upgrade, reinstall, and active-cache verification passed.
    *   **Approval**: approved
    *   **Justification**: James explicitly requested that all tests Codex can
        perform be run automatically and that this become generic FB behavior.
*   **Links & Deliverables**: [handoff](docs/handoffs/TASK-066.md) ·
    [QA](docs/qa/TASK-066.md) · release build
    `0.5.3-beta+codex.20260801141345`.
