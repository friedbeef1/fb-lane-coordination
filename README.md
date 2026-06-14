# FB-Lane Coordination Framework

A decentralized, role-isolated multi-agent coordination model designed to orchestrate agent and developer teams working concurrently. The framework prevents git merge conflicts, isolates domain concerns (engineering, design, product, business), and prevents context window overload.

## The Problem
When multiple autonomous AI agents or developers work on the same codebase, they often run into two major issues:
1. **Context Window Overload**: Loading the entire codebase, styling specifications, marketing copy, and database schemas into a single thread quickly exhausts token limits, degrading model intelligence.
2. **Git Collision & Code Bleed**: Different threads editing the same files concurrently leads to merge conflicts. For example, a design agent modifying CSS styles might conflict with a technical agent refactoring backend components in the same file.

## The Solution: The Four-Lane Model
The FB-Lane model splits work into four highly bounded, specialized lanes, supporting both structured plan handoff and direct-to-lane interaction:

```mermaid
graph TD
    User([User]) -->|Primary: Plan Handoff| MP[FB-Product: Captain]
    User -.->|Alternative: Direct Lane Interaction| MT[FB-Tech: Backend/Logic]
    User -.->|Alternative: Direct Lane Interaction| MD[FB-Design: UI/UX/QA]
    User -.->|Alternative: Direct Lane Interaction| MB[FB-Business: Copy/Positioning]
    MP -->|Prioritizes Backlog| PB[(PROJECT_BOARD.md)]
    MT -->|Pulls Tasks & Locks Files| PB
    MD -->|Pulls Tasks & Locks Files| PB
    MB -->|Pulls Tasks| PB
    PB -->|Integration Gate & Merge| MP
```

### Two Workflow Scenarios
1. **Primary Scenario (Hands-Off Plan Handoff)**: The user hands a structured plan or feature checklist directly to the **`FB-Product`** lane. Product triages the requirements, prioritizes tasks on the project board, reviews PRs, and merges changes. Lanes autonomously pull their respective tasks from the board.
2. **Alternative Scenario (Direct Lane Interaction)**: The user talks directly to a specific lane thread (e.g. pair-programming with **`FB-Tech`** or refining styling with **`FB-Design`**). The lane agent autonomously claims/creates the task, asserts the required file locks on `PROJECT_BOARD.md`, and implements the change. **`FB-Product`** still acts as the integration gatekeeper for final staging QA and merging.

### 1. The Four Specialized Lanes
*   **`FB-Product` (Integration Captain)**: The central orchestrator. Receives instructions from the user, scopes and prioritizes work items, reviews pull requests, runs release gates, and handles staging-to-production deployments.
*   **`FB-Tech` (Backend / Logic / Data)**: Owns core application logic, database schemas, APIs, migrations, serverless functions, security rules (e.g. RLS policies), and verification suites. *Never touches UI styling or layout geometry.*
*   **`FB-Design` (UI/UX / Styling / Visual QA)**: Owns CSS, theme tokens, responsive layouts, page geometry, visual assets, and UI layout QA. Enforces strict text-containment and branding integrity. *Never touches backend logic, serverless functions, or database schemas.*
*   **`FB-Business` (Copywriting / Positioning)**: Owns application copy, onboarding text, pricing tiers, documentation, and marketing content. Operates in a **read-only** code mode, drafting text updates for `FB-Product` or `FB-Design` to integrate.

---

## The Board Loop (Task Coordination)
Instead of relying on heavy cloud PM tools, teams use a local, version-controlled markdown board: `PROJECT_BOARD.md`.

1. **Claim**: A thread claims or creates an item on the board and changes its status to `In Progress`.
2. **Execute**: The thread works in an isolated branch (`tech/[feature]` or `design/[feature]`).
3. **Audit**: When complete, the thread pushes the branch, moves the board item to `Staging QA`, and lists all modified files and QA outcomes.
4. **Merge**: `FB-Product` runs verification/release gates, performs visual/functional tests on staging, merges the branch, and moves the status to `Done`.

---

## Getting Started

### 🤖 Option A: Automated Bootstrapping (Recommended)
You can instruct your AI assistant (Antigravity, Claude, Cursor, or Codex) to read this framework and set it up autonomously. Simply point your agent to this repository (or copy the framework files into a reference folder) and prompt:

> *"I want to bootstrap the FB-Lane Coordination Framework in our project workspace. Read this framework's templates and platform guide, and configure our workspace accordingly."*

The agent will copy the templates and configure the platform rules automatically.

### 🛠️ Option B: Manual Setup
If you prefer to configure the framework manually, follow these steps:
1.  **Copy the Templates**: Copy [templates/AGENTS.md](templates/AGENTS.md) and [templates/PROJECT_BOARD.md](templates/PROJECT_BOARD.md) to the root of your project repository and commit them.
2.  **Configure Your Platform**: Follow the detailed guide for your platform of choice:
    *   **Antigravity**: Read the [Antigravity Guide](platforms/antigravity/README.md) to register subagent roles, or run `tools/run_lane.py` to start direct interactive lane sessions directly in your terminal. Use the [project-coordination-setup-skill.md](platforms/antigravity/project-coordination-setup-skill.md) skill to auto-register subagent roles.
    *   **Claude & Cursor**: Read the [Claude Guide](platforms/claude/README.md) to set Project Custom Instructions and copy-paste [system prompts](platforms/claude/system-prompts.md).
    *   **Codex**: Read the [Codex Guide](platforms/codex/README.md) and copy the [workflow-rules.md](platforms/codex/workflow-rules.md) to your local rules directory.
3.  **Claim Your First Task**: Mark `TASK-001` (Setup & Bootstrap) as `In Progress` in your project board, check out your feature branch, and start building!

---

## Directory Structure
This repository provides everything you need to bootstrap this framework on your team:

*   `templates/` - Reusable configuration templates to drop into your code repos.
    *   `AGENTS.md` - Standard team boundaries and coordination rules.
    *   `PROJECT_BOARD.md` - Standard Linear-alternative task tracking file.
*   `platforms/` - Implementation guides and custom system prompts tailored to your platform of choice:
    *   `antigravity/` - Native multi-agent system prompt configurations and global skills for the **Antigravity SDK**.
    *   `claude/` - Rules and system prompts for **Claude Projects** and **Cursor**.
    *   `codex/` - CLI and git-centric rules for **Codex**.

## License
Licensed under the [MIT License](LICENSE).
