# Agent & Thread Coordination Rules — todo-app-example

This project uses the standard **FB coordination model** to enable safe concurrent development.

Use the workstream-first contract in [docs/fb/start.md](../../docs/fb/start.md).
Start in whichever workstream matches the question. After actionable handoffs
are ready, `$bfm` activates Product reconciliation and execution of approved
scope. BFM stops at **Ready to ship**; only **Push Live** authorizes release.

### 1. Lane Scopes & Boundaries
*   **FB Product (PM / User Value Optimizer)**: Owns final product decisions, task prioritization, scoping, file merges, staging/live deployments, and release gates.
*   **FB Tech (Backend / Logic)**: Owns database schemas, APIs, serverless functions, database security, configuration scripts, and unit/integration test suites. *Does not make styling, layout geometry, or UI changes.*
*   **FB Design (UI/UX / Styling)**: Owns CSS, theme tokens, styling classes, asset management, and visual viewports. *Does not edit database schemas, API routes, or backend logic.*
*   **FB Business (Copy / Positioning)**: Owns application copy, documentation, and marketing content. *Operates in a read-only capacity.*

### 2. The Board Loop & Resource Locking
1. **Claim**: A thread claims or creates an item on the board and changes its status to `In Progress` using `node tools/fb-lane.cjs claim`.
2. **Execute**: The thread works in an isolated branch (`tech/[feature]` or `design/[feature]`).
3. **Audit**: When complete, the thread pushes the branch, moves the board item to `Staging QA` using `node tools/fb-lane.cjs submit`.
4. **Merge**: `FB-Product` runs verification/release gates, merges the branch to main using `node tools/fb-lane.cjs merge`, and releases locks.
