# Product & Technical Decision Memo: Repository Layout Bootstrapping

## Executive Summary
We recommend establishing a standardized, modular directory layout for the FB-Lane Coordination Plugin in this repository, featuring root-level placement for `AGENTS.md` and `PROJECT_BOARD.md`, alongside dedicated `templates/`, `platforms/`, `tools/`, and `docs/` directories. This structure maximizes AI agent visibility, minimizes path resolution complexity, and cleanly isolates tool dependencies.

---

## Detailed Analysis & Trade-Offs

### 1. Root-Level Core Coordination Files (`AGENTS.md`, `PROJECT_BOARD.md`)
*   **What is happening**: Placed `AGENTS.md` (defining lane boundaries and rules) and `PROJECT_BOARD.md` (the task-tracking board) at the root level of the workspace.
*   **Pros**:
    *   **High Visibility**: AI agents scanning a repository can immediately locate the project board and agent rules without searching deep into directories.
    *   **Simple Discovery**: CLI utilities and local rules engines can resolve paths using standard relative lookups (e.g. `./PROJECT_BOARD.md`).
*   **Cons**:
    *   **Root Clutter**: Adds two markdown files to the root level of the repository.

### 2. Isolated Folders for Support Assets (`templates/`, `platforms/`, `tools/`)
*   **What is happening**: Grouping files into single-purpose folders:
    *   `templates/`: House product-agnostic blueprints.
    *   `platforms/`: Contains integrations and guides for specific orchestration engines (Antigravity, Claude, Codex).
    *   `tools/`: Native utility scripts for task claims, merges, and interactive sessions.
*   **Pros**:
    *   **Separation of Concerns**: Prevents platform-specific configuration files (like Custom System Instructions or Agent JSON configs) from polluting the core codebase.
    *   **Extensibility**: Adding a new target platform (e.g., Cursor, GitHub Actions) only requires a new subfolder in `platforms/`.
*   **Cons**:
    *   **Path Nesting**: Developers and agents need to reference deeper paths when configuring platform integrations.

---

## Alternative Approaches Considered

### Alternative A: Placing all plugin files under a subfolder (e.g., `fb-lane/`)
*   **Pros**: Keeps the repository root perfectly clean.
*   **Cons**:
    *   Increases path resolution complexity for CLI tools.
    *   Agents might fail to auto-detect the coordination rules and board, leading to workspace drift or duplicate task claims.
*   **Verdict**: Rejected. The minor aesthetic cost of two root-level files is vastly outweighed by the reliability of zero-configuration auto-detection by agents and CLI tools.

---

## Recommended Next Action
1.  Verify that `PROJECT_BOARD.md` and `AGENTS.md` exist at the root level.
2.  Create `docs/decisions/` directory and commit this decision memo.
3.  Update the status of TASK-001 in `PROJECT_BOARD.md` to `Staging QA` (or run submit hook if applicable) and check off all completed setup items.
