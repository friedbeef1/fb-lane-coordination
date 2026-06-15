# Project Board

## Statuses
- `Inbox`: Newly requested tasks requiring triage.
- `Ready`: Triaged tasks, fully scoped, ready to be claimed.
- `In Progress`: Tasks currently being worked on by an owner.
- `Staging QA`: Features deployed to staging, awaiting visual/functional verification.
- `Done`: Checked, verified, and merged to production by FB-Product.

---

## Active Workstreams

| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |
|---|---|---|---|---|---|---|
| TASK-001 | Done | FB-Tech | Setup | Bootstrap repository files | (None) | [Branch](https://github.com/example/repo/tree/main) \ |
| TASK-002 | Staging QA | FB-Tech | Integration | Migrate Speech Coach from AssemblyAI LeMUR to OpenAI GPT-4o-mini API | `package.json`, `services/googleGeminiService.ts`, `hooks/useAudioAnalysis.ts`, `components/AnalysisResults.tsx`, `hooks/useRecording.ts`, `index.html`, `services/assemblyAiService.ts`, `types.ts` | [Branch](https://github.com/friedbeef1/friedbeef123/tree/tech/TASK-002-gemini-speech-coach-integration) |

---

### TASK-001 - Project Setup & Bootstrap
*   **Status**: Done
*   **Owner / Thread**: FB-Tech
*   **Area**: Setup
*   **Scope**: Create initial files, initialize repository layout.
*   **Out of Scope**: Writing application business logic.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: (None)
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [Branch Link](https://github.com/example/repo/tree/main)
    *   **Staging URL**: [Staging Link](https://staging.example.com)
    *   **Design Specs**: (None)
    *   **Decision Memo**: [docs/decisions/001-setup.md](file:///./docs/decisions/001-setup.md)
*   **QA Checklist**:
    *   [x] Repository structure is clean and follows design guidelines.
    *   [x] File names and paths are correct.
    *   [x] Documentation has zero typos or placeholders.
*   **Modified Files**:
    *   `docs/decisions/001-setup.md`
*   **Latest Update**:
    *   *2026-06-15*: Completed repository bootstrapping and documented layout decisions.


### TASK-002 - OpenAI GPT-4o-mini Speech Coach Integration
*   **Status**: Staging QA
*   **Owner / Thread**: FB-Tech
*   **Area**: Integration
*   **Scope**: Migrate the speech coach recording analysis and tips generator from AssemblyAI LeMUR to the OpenAI GPT-4o-mini API.
*   **Out of Scope**: Major UI redesigns or unrelated styling tweaks.
*   **Affected Screens / Locks**:
    *   **Screens**: (None)
    *   **Locked Files**: `package.json`, `services/googleGeminiService.ts`, `hooks/useAudioAnalysis.ts`, `components/AnalysisResults.tsx`, `hooks/useRecording.ts`, `index.html`, `services/assemblyAiService.ts`, `types.ts`
*   **Links & Deliverables**:
    *   **Git Branch / PR**: [Branch Link](https://github.com/friedbeef1/friedbeef123/tree/tech/TASK-002-gemini-speech-coach-integration)
    *   **Staging URL**: (None)
    *   **Design Specs**: (None)
    *   **Decision Memo**: (None)
*   **QA Checklist**:
    *   [ ] Gemini feedback, summary, and tips generate correctly.
    *   [ ] Local audio features extraction functions correctly.
    *   [ ] Build compiles with no TypeScript compilation errors.
*   **Modified Files**:
    *   (None)
*   **Latest Update**:
    *   *2026-06-15*: Initialized task and claimed for execution.


