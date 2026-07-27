# Current technical rules

- Safe technical work may proceed.
- An item with `dependsOn` must be sequenced after its selected dependency.
- Privacy, authentication, payment, migration, provider-state, destructive, and
  release work requires `safetyApproved: true`.
- Missing environment access is represented by `accessAvailable: false` and is
  a blocker.
- Every blocked item preserves its `id`, states the concrete `reason`, names an
  `owner`, gives a `nextAction`, and must not remain selected.
- `automatedChecksPassed: true` prepares `Ready to ship`; it never authorizes
  deployment.
