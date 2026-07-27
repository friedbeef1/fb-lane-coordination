# Current bug rules

- Bugs require non-empty `reproduction` and `observable` evidence.
- Critical reproducible bugs are selected first.
- Other reproducible bugs remain actionable.
- Missing evidence blocks the bug. Every blocked item preserves its `id`,
  states the concrete `reason`, names an `owner`, gives a `nextAction`, and
  must not remain selected.
