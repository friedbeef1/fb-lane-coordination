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

## Boundaries

- Preserve `fb-lane-coordination`, marketplace `fb-lane`, `$bfm`, CLI paths,
  MCP names, and historical version evidence.
- Do not run the complete repository validator or install the plugin.
- Do not push, open a PR, merge, publish, deploy, or release.
- Commit the complete local candidate and hand it back for the later release
  checkpoint.

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

## Product/BFM Closeout

Disposition: implemented locally and ready for the later release checkpoint.
The complete repository validator and isolated temporary-Codex-home install
smoke were intentionally not run under this worker brief. Push, PR, merge,
marketplace upgrade, publication, deployment, and release were not performed.
