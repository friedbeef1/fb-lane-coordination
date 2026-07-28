# Active Task Context

* **Current Task**: TASK-057 Shift OKR validation left
* **Lane**: FB-Product / BFM + FB-Tech
* **Status**: Staging QA
* **Release Build**: `0.5.0-beta+codex.20260726130257`
* **BFM Class**: Quick bounded harness correction
* **Release Vehicle**: `codex/fb-shift-left-okr-validation`; integration remains separate
* **Worktree**: `/private/tmp/fb-shift-left-okr-validation`
* **Locked Files**: normalized record runtime/tests, handoff template,
  records guidance and generated plugin mirrors, TASK-057 records.

The canonical template now supplies the complete Goal Alignment contract.
Focused normalized-record validation rejects missing handoff alignment or a
missing explicitly approved matching board Goal Alignment Session before the
release validator. Established `Product Goal` records remain compatible.

Root/package focused checks and generated mirror parity pass. This candidate
does not authorize merge, marketplace publication, installation, deployment,
or live release. See [TASK-057](../docs/handoffs/TASK-057.md).
