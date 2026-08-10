---
name: fb-release
description: Use only when the user explicitly says Push Live in the Product/BFM main task.
---

# Release FB

Treat release as one exact, auditable transaction.

## Prove authority and candidate

1. Continue only in the Product/BFM main task when the user said **Push Live**
   in the current conversation. In a workstream or sidechat, route a paste-ready
   handoff to its originating parent or Product/BFM, release nothing, and stop.
2. Read `AGENTS.md`, bounded current status, and the selected task's board,
   handoff, QA, changelog, and Git evidence. Confirm the active canonical
   checkout, exact task, approved scope, Ready-to-ship state, clean branch, base
   commit, candidate commit at `HEAD`, and exact build identifier. Freeze those
   identities; a changed candidate requires fresh authority.
3. Run the repository-defined targeted preflight before any broad validator or
   release instruction:

   ```bash
   node tools/fb-release-preflight.cjs --task <TASK-ID> --phase candidate --base <BASE-COMMIT> --candidate <CANDIDATE-COMMIT>
   ```

   Stop on every finding. This selected-candidate gate applies even when an
   omitted `record_model` would exempt the handoff from a repository-wide scan.

## Classify the marketplace

4. Read the repository's release instructions and use its named merge,
   packaging, publication, and installation commands. Then inspect configuration:

   ```bash
   codex plugin marketplace list --json
   codex plugin list --json
   ```

   Select one exact marketplace and plugin. Record
   `marketplaceSource.sourceType`, configured source, current installed build,
   and enabled state before mutation.
5. Follow the matching branch:

   - For `git`, merge and publish the exact candidate first. Prove the remote
     marketplace source contains that release commit and build, then run the
     repository's named `codex plugin marketplace upgrade` command.
   - For `local`, prove the configured marketplace root is the intended release
     source and resolves to the exact merged commit and build. Publish/update
     that root by the repository's instructions; a Git-only marketplace refresh
     is not evidence for a local source.
   - For a missing, ambiguous, or unknown type, stop before merge or publication.

## Release and prove the installed build

6. Execute the repository's merge, package, publish, and reinstall sequence for
   the frozen candidate. Capture the merged commit, published revision or tag,
   exact build, and installation result. Never substitute a newer checkout or
   merely matching version label.
7. Rerun `codex plugin list --json`. Resolve the active installed artifact or
   runtime cache from the reported marketplace, plugin, and build; never choose
   a cache merely because its directory name looks newest. Require the plugin
   to be installed, enabled, and on the exact build.
8. Compare bytes or cryptographic hashes from the generated release package to
   the active install for every repository-declared runtime artifact. At minimum
   prove the release skill, executable runtime tools, and plugin manifest, then
   load/parse the installed manifests and runnable modules with install-safe
   checks. Do not run a root-only source-layout test from the installed cache;
   source-tree tests are not installed-runtime proof.

## Reconcile real state

9. After the external actions have actually succeeded, reconcile the board,
   handoff, handoff index, QA evidence, changelog, and Git history in their
   authoritative homes. Record the published candidate commit/build separately
   from any later release-record closeout commit. Remove prospective or
   contradictory live claims; preserve failures and recovery evidence.
10. Commit and publish the required closeout records according to the
    repository's Git rules, reach a clean consistent state, then run the targeted
    preflight with `--phase live` against the record closeout range. Report a
    release as complete only when installed-artifact proof, live preflight, and
    durable records agree. If publication succeeded but closeout did not, report
    that split truth and continue only with record recovery.
11. Require a new Codex task after plugin replacement so the next run loads the
    replaced skills and runtime. End this task without using the old in-memory
    plugin for further FB work.
