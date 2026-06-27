# Vendored skills

## ponytail

The `ponytail*` skills in this directory are vendored verbatim from the
upstream project, not authored here.

- **Source:** https://github.com/DietrichGebert/ponytail
- **Pinned commit:** `c4d1925ae9b76a1b641877328209ad25cfeb5ef2`
- **License:** MIT (© the ponytail authors)
- **Vendored:** 2026-06-27

Skills included: `ponytail`, `ponytail-review`, `ponytail-audit`,
`ponytail-debt`, `ponytail-gain`, `ponytail-help`.

These are guidance-only `SKILL.md` files (a minimal-code / YAGNI coding
philosophy plus review/audit/debt helpers). They contain no hooks, scripts, or
auto-run commands — they are inert until a skill is explicitly invoked. The
upstream plugin manifest and lifecycle hooks were intentionally **not** vendored.

To update: re-copy the `skills/<name>/SKILL.md` files from a newer upstream
commit and bump the pinned commit above.
