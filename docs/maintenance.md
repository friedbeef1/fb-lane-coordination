# Maintenance Surface

Keep the following source-of-truth split:

- Canonical guidance and execution references live in `docs/`, `templates/`, `skills/`, and `tools/`.
- Packaged copies in `plugins/fb-lane-coordination/` stay in parity with canonical files via this repo’s existing package copy process; update both only through the established sync workflow.
- Do not split the FB-Lane CLI until there is real pressure.
- Rendered demo videos are not committed to git; they are published as GitHub release assets and linked from demo READMEs.
