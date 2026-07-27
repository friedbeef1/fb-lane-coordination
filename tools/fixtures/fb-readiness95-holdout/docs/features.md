# Current feature rules

- Only `status: ready` is actionable. Exclude done, implemented, deferred,
  blocked, and stale work.
- For duplicate scopes, retain only the highest numeric revision.
- Features require `decisionApproved: true`.
- A late approved feature remains actionable and is sequenced after critical
  reproducible bugs but before ordinary technical improvements.
