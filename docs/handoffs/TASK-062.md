---
type: fb-lane-handoff
task: TASK-062
lane: fb-product
status: in-progress
approval: approved
fb_harness: v3
record_model: normalized-v1
---

# TASK-062 — First-run `$bfm` onboarding

## Goal Alignment Session

Product Goal: Reduce hands-on setup while preserving explicit authority,
repository boundaries, and honest capability reporting.
Workstream Goal: Give every FB project six idle, discoverable Codex workstream
tasks without duplication.
Lane OKR Fit: aligned
User Approval Needed: no — James explicitly approved implementation.
Mini-loop Evidence: Bootstrap already installs six repository workstream cards,
but it does not offer matching Codex sidebar tasks or remember whether the
one-time permission question was asked.
Evidence Against Product OKR: Codex task creation is an app capability, not a
portable Node CLI capability; the implementation must fail honestly when those
tools are absent.

## Project Start Brief

- **Requested:** After bootstrap, introduce FB and ask once for permission to
  create six repository-scoped sidebar tasks.
- **Existing projects:** Recognize legacy Product, Business, Design, and Tech
  tasks and add only Discovery and Bugs.
- **Safety:** New tasks remain idle, planning/evidence-only, and tied to the
  exact repository. No task begins investigation or source work merely because
  it was created.
- **Fallback:** When Codex cannot list or create tasks, explain the limitation
  and provide workstream-specific paste-ready prompts.
- **Invocation:** `$bfm` remains documented and supported. `/bfm` is interpreted
  as user intent when the agent can recognize it; it is not advertised as a
  separate runtime command.

## Build Brief

1. Add a clone-local, ignored onboarding receipt with one-time prompt state.
2. Add pure repository/task matching and missing-workstream planning.
3. Make fresh bootstrap print the permission card once and reruns remain quiet.
4. Teach BFM/setup skills to use Codex `list_projects`, `list_threads`,
   `create_thread`, and `set_thread_title` only after explicit permission.
5. Create local, idle tasks with distinct workstream instructions; do not
   create worktrees for these planning surfaces.
6. Add the manual fallback, active documentation, generated package mirrors,
   and focused behavior tests.

Changelog expectation: required

## Task Receipt

- Changelog: pending — user-facing wording must be drafted and approved.
- Review state: not reviewable
- External gates: no push, merge, plugin publication, installation, or
  deployment.
