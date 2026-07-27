# Feature evidence

- Search filters are approved only when `decisionApproved: true`.
- `status: ready` is actionable. Exclude `done`, `implemented`, `deferred`,
  `blocked`, and `stale`.
- When two items share a scope, keep the item with the larger `revision`.
- A late approved decision supersedes an earlier recommendation.
