---
type: fb-lane-handoff
task: TASK-062
lane: fb-product
status: implemented
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

1. Add a clone-local onboarding receipt in the Git common directory, shared by
   linked worktrees, with ignored `.fb/onboarding.json` as the non-Git fallback.
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

- **Approved brief:** Implement one-time, permission-gated, repository-scoped
  onboarding for six idle Codex sidebar tasks.
- **Decisions preserved:** `$bfm` is canonical; `/bfm` is user intent only;
  existing four-task projects gain only Discovery and Bugs; no task starts
  work merely because it was created.
- **Changed surfaces:** Bootstrap runtime, onboarding state/planning module,
  focused tests, BFM/setup skills, active setup/start/FAQ guidance, changelog,
  and mechanically generated plugin mirrors.
- **Checks:** Root/package onboarding 26/26; package parity 53/53; affected
  syntax and whitespace passed. Earlier current-candidate compatibility checks
  passed CLI 70/70, beginner 10/10, automatic-worktree 11/11, compact-board
  8/8, and the six-skill contract.
- **Failure and recovery:** The first safe-inventory assertion matched literal
  spaces and failed on a Markdown line wrap. The assertion was made
  whitespace-tolerant and only the failed root/package proof was rerun.
- **Changelog:** pending approval — the proposed entry is
  [Unreleased — first-run `$bfm` onboarding](../../CHANGELOG.md#unreleased--first-run-bfm-onboarding).
- Review state: not reviewable
- Verification: [TASK-062 QA](../qa/TASK-062.md)
- External gates: no push, merge, plugin publication, installation, or
  deployment.

## Brief Validation

Status: pass

- Bootstrap introduces FB and asks once: satisfied by the persisted onboarding
  receipt and rerun fixture.
- Six repository-scoped tasks with legacy/current detection: satisfied by
  exact path/project-ID fixtures.
- Only missing tasks: satisfied by four-task and six-task fixtures.
- New tasks idle with distinct instructions: satisfied for all six prompts.
- Honest unavailable/incomplete-inventory fallback: satisfied structurally and
  through rendered manual prompts.
- `$bfm` remains supported and `/bfm` remains intent only: satisfied.
- Root/package alignment: 53 declared mirrors pass.

Remaining closeout action: James approves or revises the changelog wording;
then Product may record the decision and move the candidate to Ready to ship.
