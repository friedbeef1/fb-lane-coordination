# First-pass release candidate

Implement `buildCandidate(input)` in `src/release-candidate.cjs`.

Read every current document under `docs/`. They contain the Feature, Bugs,
Tech, Design, and exact input/output interface rules. `docs/history.md` is
explicitly historical and cannot override current documents.

Run `npm run test:recorded` once after your first candidate. It preserves the
complete public-test output and prevents a second execution. Do not repair a
failed candidate, access files outside this exercise, merge, publish, or
deploy.
