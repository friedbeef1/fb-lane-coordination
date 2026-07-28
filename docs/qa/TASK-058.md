# TASK-058 verification

Date: 2026-07-28
Candidate: `tech/TASK-058-make-bfm-create-or-reuse-linked-worktrees-for-every-independent-source-changing-slice-without-user-setup-while-keeping-planning-only-and-overlapping-work-lightweight-or-sequential`

## Automated evidence

| Proof | Result |
|---|---|
| Live Full BFM claim | Passed: FB created the linked TASK-058 worktree automatically and returned its branch/path |
| Focused automatic-worktree contract | 11/11 passed |
| Existing CLI/MCP linked-worktree claim contract | Passed |
| Planning-only exclusion | Passed structurally |
| Dependent/overlapping sequential boundary | Passed structurally |
| Existing exact-match reuse path | Passed structurally and by existing session fixture |
| Clean merged worktree cleanup | Passed with a real temporary Git repository and CLI merge |
| Dirty, unmerged, and missing-path retention | Passed; cleanup failed closed and preserved ownership metadata |
| Primary-checkout protection | Passed for helper and CLI integration paths |
| Exact branch selection | Passed; `TASK-058` does not match `TASK-0580`, multiple exact candidates block |
| Git linked-worktree `+` marker | Passed; the merge path strips Git's checked-out-elsewhere marker before exact selection |
| Package generation/parity | 49/49 mirrors matched |
| Affected Node syntax | Passed |
| README workflow anchor | Passed |
| Whitespace | Passed |

## Result

BFM now owns implementation worktree setup. It calls the existing automatic
create-or-reuse claim path for eligible independent source slices, exposes the
slice/branch/worktree mapping, and does not create unnecessary worktrees for
planning-only or unsafe parallel work. It also removes a worktree only after a
successful integration when the registered path is present, clean, and merged.
Unsafe or uncertain worktrees remain registered with the task and locks open
for an explicit owner action. The candidate remains
`Checking — changelog approval needed`; no merge, publication, installation, or
deployment occurred.
