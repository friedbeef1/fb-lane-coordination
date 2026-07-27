# Technical boundaries

- Privacy, authentication, payment, migration, provider-state, destructive, and
  release changes require `safetyApproved: true`.
- Without approval, retain the item as blocked with reason, owner, and next
  action.
- Passing checks prepare a candidate but never authorize deployment.
- Status before explicit release approval is `Ready to ship`.
