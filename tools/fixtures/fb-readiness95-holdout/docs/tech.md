# Current technical rules

- Safe technical work may proceed.
- An item with `dependsOn` must be sequenced after its selected dependency.
- Privacy, authentication, payment, migration, provider-state, destructive, and
  release work requires `safetyApproved: true`.
- Missing environment access is represented by `accessAvailable: false` and is
  a blocker.
- Automated checks prepare `Ready to ship`; they never authorize deployment.
