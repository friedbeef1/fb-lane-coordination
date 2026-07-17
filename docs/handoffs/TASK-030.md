# TASK-030 - FB 0.3.0-beta Release Candidate

Owner: FB-Product / BFM
Status: Staging QA
Environment: local release-candidate worktree

## Scope

Rebuild the existing `fb-lane-coordination` Codex plugin as
`0.3.0-beta+codex.<current UTC cachebuster>`. Align both manifests, active
marketplace/plugin wording, default prompts, version/setup/changelog records,
and every declared package mirror with the six-workstream FB loop.

Add a focused RED/GREEN contract for manifest parity, six-workstream prompts,
all six workstreams, and the Ready-to-ship/Push-Live boundary. Run only the
focused package, plugin, six-workstream, six-skill, positioning, metadata,
syntax, link, and whitespace checks requested for this candidate.

## Worker Boundaries

- Preserve `fb-lane-coordination`, marketplace `fb-lane`, `$bfm`, CLI paths,
  MCP names, and historical version evidence.
- The implementation worker did not run the complete repository validator,
  install the plugin, push, open a PR, merge, publish, deploy, or release.
- Product/BFM owns the single release checkpoint and external release boundary.

## Evidence

- Candidate build: `0.3.0-beta+codex.20260717150502`.
- RED: the new metadata contract failed on the prior
  `0.2.0-beta+codex.20260716052513` manifest version.
- GREEN: root and packaged metadata contracts passed for the candidate build.
- Plugin validation passed.
- Package synchronizer regenerated and then checked 27 declared mirrors;
  synchronizer tests passed 10/10.
- Root and packaged six-workstream, six-skill, and positioning contracts passed.
- Focused syntax, JSON parsing, Markdown-link resolution across nine touched
  active surfaces, and `git diff --check` passed.
- The single complete release validator passed, including 70/70 CLI checks and
  the session, eval, beginner, positioning, two-speed, efficiency, doctor,
  package-parity, and whitespace gates.
- A fresh temporary `CODEX_HOME` installed and enabled
  `fb-lane-coordination@fb-lane` at
  `0.3.0-beta+codex.20260717150502`. The installed cache contained all six
  workstream skills, current README/Why FB/full-loop diagrams, a valid relative
  bundled MCP route, and syntax-valid MCP server code. The temporary home was
  removed after the smoke.
- Independent review found two Important weaknesses in the new metadata test.
  Repair `db1f527` made packaged execution inspect package-local content, added
  a deterministic drift failure, and enforced the exact build ID across active
  release records. Focused rechecks passed and re-review approved the repair
  with no remaining findings.

## Product/BFM Closeout

Disposition: **Ready to ship**. Candidate source, package, release validator,
isolated install, MCP route, and independent review are green. Pushing this
review branch does not authorize release. Merge to `main`, public marketplace
upgrade/reinstall, publication, and release remain blocked until James says
**Push Live**.
