# FB Documentation Rebrand Implementation

## Global constraints

- Visible active product name: `FB`.
- Primary tagline/current model line: approved primary tagline/current model line.
- Keep all technical identifiers exactly unchanged: `fb-lane`, `fb-lane-coordination`, commands, paths, plugin and MCP identifiers, configuration keys, and code symbols.
- Preserve historical handoffs, historical plans/specs, archived upstream material, old changelog entries, and historical branch/package/commit references.
- Do not publish, deploy, or modify a consumer repository.

## Tasks

1. Rebrand active public documentation: root and package READMEs, FAQ, setup/versioning/loop/maintenance/paused docs, Codex platform guidance, demo README, and the current changelog entry. Keep code-form technical IDs unchanged.
2. Rebrand active internal documentation: root agent rules, templates, examples, scorecards, and root/package skills. Use readable phrases such as `FB light`, `FB coordination model`, and `FB framework OKR`.
3. Update root and packaged bootstrap CLI documentation strings in parity so new projects receive `FB` branding and the primary tagline without changing commands or identifiers. Update regression tests only when wording assertions require it.
4. Audit the complete result: active-doc wording scan with a historic/technical allowlist, root/package parity, syntax, regression suites, validator, doctor, and whitespace checks. Record results in TASK-019 and the Product workstream card.
