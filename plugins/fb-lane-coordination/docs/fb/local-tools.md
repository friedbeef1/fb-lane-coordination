# Local tools — no MCP required

Flow Builder (FB) is a Codex plugin containing skills and a local Node.js
coordination engine. The installed plugin does not register an MCP server.
Codex calls the engine through local commands; people still use `$fb-setup`
and `$bfm`. No hosted FB service or additional account is required.

## Structured operations

Write the arguments as a JSON object in a temporary request file, then run:

```bash
node tools/fb-lane.cjs local fb_project_context /absolute/path/request.json
```

Example request:

```json
{"workspacePath":"/absolute/project/root","taskId":"TASK-001","question":"What prerequisites are still blocked?"}
```

Use the project-managed runtime after setup, or the absolute path to the
verified plugin's `tools/fb-lane.cjs` before setup. Explicitly provide the
target `workspacePath` when invoking a bundled runtime from another directory.
Never guess a cache version or edit installed package files.

Success returns `{"ok":true,"result":{"content":[{"type":"text","text":"..."}]}}`.
Failure returns `{"ok":false,"error":"..."}` and a nonzero exit code.
The result text may contain structured JSON. Read the exit status and result;
never describe a failed call as an empty queue or completed action. JSON input
is a regular file limited to 1 MiB. Do not include secrets or transcripts.

| Operation | Arguments besides optional `workspacePath` |
|---|---|
| `fb_lane_status` | Optional `context` or `details` boolean |
| `fb_project_context` | `taskId`, concrete `question` |
| `fb_lane_claim` | `taskId`, `lane`, optional comma-separated `lockedFiles` |
| `fb_lane_submit` | `taskId`, optional `stagingUrl` |
| `fb_lane_merge` | `taskId`; requires the existing explicit Push Live authority |
| `fb_checkout_migration_inventory` | `canonicalPath`, `formerPaths`, `repository`, `taskInventory` |
| `fb_checkout_migration_commit` | Inventory arguments plus `dispositions` |
| `fb_checkout_migration_rebind` | `repository`, `taskInventory` |
| `fb_learning_record` | Validated `receipt` |
| `fb_learning_status` | Optional `workTypes` array |
| `fb_learning_apply` | `lessonId`, `observation` |
| `fb_control_event_validate` | Flat event fields from the control-loop contract |
| `fb_control_event_record` | Same event fields; persists validated evidence |
| `fb_control_route` | `artifactRef` and the control-loop routing criteria |

Existing `status`, `doctor`, `bootstrap`, `claim`, `submit`, `migration`,
`learning`, and `session` commands remain supported. All operations retain
their existing validation and authority requirements. Local commands do not
grant permission to execute, push, merge, publish, or deploy.

Sidebar task tools are Codex capabilities, not FB's former MCP server. Keep
exact-project identity and delivery receipts; report unavailable native task
capabilities honestly. Never replace existing tasks just because FB is upgraded.

## Compatibility and proof

The unregistered `mcp` command remains for older integrations and regression
tests. The plugin's normal path never starts it. Both interfaces call the same
operation implementation; no second coordination engine is maintained.

Verify an isolated package with `tools/fb-local-operations.test.cjs`, runtime
doctor and the affected coordination contracts. A local package test is not
proof of marketplace acceptance, global installation or consumer rollout.
