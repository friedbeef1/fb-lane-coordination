# FB setup shortcut design

Date: 2026-08-06
Task: TASK-076
Owner: Product/BFM

## Decision

Add a first-class `fb-setup` plugin skill so setup has one exact invocation:

```text
$fb-setup
```

Make this the primary setup call to action in active public and packaged
documentation. Keep `$fb-lane-coordination:project-coordination-setup` and
`Set up FB in this project.` as compatibility fallbacks.

## Considered approaches

1. **Dedicated skill alias — selected.** A small skill delegates to the
   canonical setup workflow, giving users a memorable exact command without
   duplicating onboarding policy.
2. **Documentation-only wording — rejected.** Natural-language setup remains
   useful as a fallback but leaves more room for inconsistent interpretation.
3. **New slash command or CLI — rejected.** It would add runtime machinery and
   imply an installed `/` command that Codex does not provide. Plugin skills
   use `$` invocation.

## Contract

- `fb-setup` must invoke the existing `project-coordination-setup` skill as its
  required canonical workflow.
- It performs the same idempotent repository bootstrap and seven-task
  reconciliation: six evidence workstreams plus Product/BFM.
- It creates only missing tasks, reuses unambiguous legacy tasks, verifies
  pinning when supported, leaves new tasks idle, and reports unavailable app
  controls honestly.
- It does not invoke `$bfm`, start workstream investigations, approve source
  execution, or alter release and safety boundaries.
- Existing long-form skill and natural-language setup requests remain valid.

## Documentation

Show `$fb-setup` first in the README, packaged README, Codex guide, setup guide,
FAQ, and canonical start/setup guidance. Mention each compatibility fallback
once where it helps recovery without presenting multiple competing workflows.

## Verification

A focused root/package contract proves that:

- the canonical and packaged `fb-setup` skills exist and match;
- the shortcut delegates to the canonical setup skill;
- active setup documentation leads with `$fb-setup`;
- both compatibility fallbacks remain documented;
- no `/fb-setup` or new runtime command is claimed;
- package synchronization, skill validation, links, and whitespace pass.

## Release boundary

This is a user-visible plugin interface change. Prepare a versioned changelog
entry and stop for changelog approval and the normal release checkpoint.
**Push Live** remains the only merge, marketplace-publication, and reinstall
authorization.
