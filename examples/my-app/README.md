# FB-Lane Example: `my-app`

This is a minimal, fictional project that shows what a repo looks like **after running `node tools/fb-lane.js bootstrap`**.

> **You don't need to copy these files.** The bootstrap command generates all of this automatically.  
> This example exists purely so you can see the expected output before running it.

---

## What gets generated

Running `node tools/fb-lane.js bootstrap` inside any project root produces:

```
your-project/
├── PROJECT_BOARD.md          ← Version-controlled task board
├── AGENTS.md                 ← Lane rules & boundaries
├── FB-Product/
│   └── agent.json            ← Antigravity sidebar agent config
├── FB-Tech/
│   └── agent.json
├── FB-Design/
│   └── agent.json
├── FB-Business/
│   └── agent.json
└── .codex/
    └── rules.md              ← Codex auto-configuration
```

The `PROJECT_BOARD.md` and `AGENTS.md` headers are personalised with your project's `name` and `description` from `package.json`.

---

## Example workflow (step by step)

Imagine `my-app` is a simple todo web app. Here's how the team uses FB-Lane:

### Step 1 — Product scopes a task
A user tells **FB-Product**: *"We need a dark mode toggle."*

Product adds it to `PROJECT_BOARD.md`:

| ID | Status | Owner | Area | Scope |
|---|---|---|---|---|
| TASK-001 | Ready | FB-Product | UI | Add dark mode toggle to the header |

### Step 2 — Design claims it
The **FB-Design** thread runs:
```bash
node tools/fb-lane.js claim TASK-001 Design src/styles/theme.css
```
This:
- Creates branch `design/TASK-001-add-dark-mode-toggle-to-the-header`
- Locks `src/styles/theme.css` on the board
- Copies a startup prompt to the clipboard

### Step 3 — Design implements & submits
After editing styles:
```bash
node tools/fb-lane.js submit TASK-001
```
Branch is pushed, board status → `Staging QA`.

### Step 4 — Product reviews & merges
After verifying staging:
```bash
node tools/fb-lane.js merge TASK-001
```
Branch merged to `main`, locks released, status → `Done`.

---

## Key rules (enforced by AGENTS.md)

| Lane | Owns | Never touches |
|------|------|--------------|
| FB-Product | Merges, deployments, backlog | Day-to-day code |
| FB-Tech | APIs, DB schemas, logic | CSS, layout |
| FB-Design | CSS, tokens, layout | Backend logic |
| FB-Business | Copy, docs | Source code |

---

See the full [README](../../README.md) for the complete framework documentation.
