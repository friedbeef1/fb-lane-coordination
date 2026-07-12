# Paused Integrations

FB-Lane currently supports, packages, documents, and release-tests Codex only.
Claude Code and Antigravity integrations are paused: do not present them as
installable, supported, or release-ready.

## Contributor Revival Checklist

Before proposing a paused integration again:

1. Confirm a maintainer can actively own its compatibility and release testing.
2. Restore only the packaging, configuration, and documentation required for
   that platform; keep the Codex path unchanged.
3. Document an install, upgrade, and rollback path without claiming support
   before it is verified.
4. Add root/package parity and platform-specific tests, then run them locally.
5. Obtain Product approval for the renewed support boundary and a separate
   release/publish decision.
