# Flow Builder (FB) Privacy Policy

Last updated: 4 October 2026

Flow Builder is an open-source Codex plugin maintained by James Yeang and
contributors at https://github.com/friedbeef1/fb-lane-coordination.
This policy describes the distributed plugin, not OpenAI, GitHub, your employer,
or services you separately connect to your project.

## Information used and why

When you ask FB to work on a project, Codex and the local FB tools may read
project files, prompts and summaries, requirements, decisions, task identifiers,
repository paths, Git history, handoffs, and test or verification results. FB
uses this information to organize workstreams, explain priorities and blockers,
coordinate implementation, and preserve delivery evidence. Setup may inspect
project-scoped task titles, IDs and pin state to reuse the correct chats.

FB writes coordination records in your repository and local tooling state.
These may include board entries, handoffs, decisions, evidence references,
session summaries, task bindings, and locally recorded operational metrics.
Names or other personal information you include can become part of these records.
Do not include passwords, API keys, private reasoning or unnecessary personal
data in handoffs, diagnostics, or support reports. Redaction checks are not a
guarantee that all sensitive content will be detected.

## Where processing happens and who receives information

The plugin does not require an FB-hosted service and does not automatically
send project records to the maintainer. It does not provide an advertising or
data-sale service. Local records are not the same as local-only AI processing:
Codex can send prompts, selected files and tool results to OpenAI according to
your account, workspace settings and OpenAI's policies.

Git pushes, pull requests, chat notifications, deployments and optional connected
tools may send selected information to GitHub, collaborators, hosting providers
or other destinations you authorize. Project hooks can invoke additional tools.
Review those tools, permissions and destinations separately. Public repositories
and public issue reports are visible to others. Platform providers may process
data in other countries under their own terms and privacy policies.

## Retention and control

FB has no automatic retention deadline for repository records. They remain
until you or your organization remove them under your own retention policy.
Git commits, remotes, backups and service-side chat history may retain copies
after a working file is removed. Uninstalling FB does not delete your projects,
existing chats or their history. The maintainer cannot delete copies held by
OpenAI, GitHub, your organization or your backups.

You can inspect and edit local records, restrict project/tool access, decline
external actions, remove the plugin, and use each provider's controls to manage
its retained information. Coordinate record removal with project owners so
active work is not inadvertently lost. For account-specific OpenAI processing,
consult your applicable OpenAI privacy policy and data controls.

## Support and privacy questions

For general questions, open a minimal, non-sensitive issue at
https://github.com/friedbeef1/fb-lane-coordination/issues.
Support information you voluntarily post is processed through GitHub and may
be retained in the issue history. Do not post secrets, private project files,
personal data or raw conversation transcripts publicly. To discuss a sensitive
concern, first request a private contact method without disclosing the details.

## Changes

Policy changes will be recorded in this file with an updated date. Optional
integrations or your own modifications can have different data practices;
review them before enabling them.
