#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  WORKSTREAMS,
  WORKSTREAM_HANDOFF_STATES,
  validateWorkstreamHandoff,
  validateWorkstreamHandoffDirectory,
  renderQueuedNotice,
} = require('./fb-workstream-handoff.cjs');

function validHandoff(from = 'discovery', to = 'design', overrides = {}) {
  const values = {
    type: 'fb-workstream-handoff',
    from,
    to,
    status: 'queued',
    task: 'TASK-071',
    evidence: '- [Approved design](../superpowers/specs/2026-08-03-workstream-to-workstream-handoffs-design.md)',
    next: `Identify one decision-changing ${to} recommendation.`,
    ...overrides,
  };
  return `---
type: ${values.type}
from_workstream: ${values.from}
to_workstream: ${values.to}
status: ${values.status}
source_task: ${values.task}
---
# ${values.from} to ${values.to}

## Question investigated
Which evidence should ${values.to} evaluate next?

## Evidence
${values.evidence}

## Recommendation
Review the evidence from the ${values.to} perspective.

## Requested next investigation
${values.next}

## Decisions
- Queue and wait for the user.

## Assumptions
- The destination task exists.

## Dependencies and limits
- Planning only; no source execution.
`;
}

test('accepts all thirty directed non-self workstream pairs', () => {
  assert.deepStrictEqual(WORKSTREAMS, [
    'product', 'business', 'design', 'tech', 'discovery', 'bugs',
  ]);
  let accepted = 0;
  for (const from of WORKSTREAMS) {
    for (const to of WORKSTREAMS.filter(value => value !== from)) {
      assert.deepStrictEqual(validateWorkstreamHandoff(validHandoff(from, to)), []);
      accepted += 1;
    }
  }
  assert.strictEqual(accepted, 30);
});

test('defines only the queue-and-wait lifecycle', () => {
  assert.deepStrictEqual(WORKSTREAM_HANDOFF_STATES, [
    'queued', 'in_review', 'consumed', 'deferred', 'superseded',
  ]);
  for (const status of WORKSTREAM_HANDOFF_STATES) {
    assert.deepStrictEqual(validateWorkstreamHandoff(validHandoff('discovery', 'design', { status })), []);
  }
  assert.match(validateWorkstreamHandoff(validHandoff('discovery', 'design', { status: 'ready' })).join('\n'), /status.*ready.*not valid/i);
});

test('rejects unsafe, ambiguous, and incomplete routes', () => {
  assert.match(validateWorkstreamHandoff(validHandoff('design', 'design')).join('\n'), /different workstreams/i);
  assert.match(validateWorkstreamHandoff(validHandoff('research', 'design')).join('\n'), /unknown source workstream/i);
  assert.match(validateWorkstreamHandoff(validHandoff('design', 'marketing')).join('\n'), /unknown destination workstream/i);
  assert.match(validateWorkstreamHandoff(validHandoff('discovery', 'design', { task: '' })).join('\n'), /safe source_task/i);
  assert.match(validateWorkstreamHandoff(validHandoff('discovery', 'design', { evidence: 'Research discussed in chat.' })).join('\n'), /Evidence.*Markdown link/i);
  assert.match(validateWorkstreamHandoff(validHandoff('discovery', 'design', { next: '' })).join('\n'), /Requested next investigation.*actionable/i);
  assert.match(validateWorkstreamHandoff(validHandoff('discovery', 'design', { type: 'fb-lane-handoff' })).join('\n'), /type.*fb-workstream-handoff/i);
});

test('renders the exact passive destination notice', () => {
  assert.strictEqual(
    renderQueuedNotice({
      from: 'Discovery',
      to: 'Design',
      link: 'docs/handoffs/TASK-071-discovery-to-design.md',
    }),
    'Discovery handoff queued for Design — planning only; waiting for you. Open: docs/handoffs/TASK-071-discovery-to-design.md',
  );
  assert.throws(() => renderQueuedNotice({ from: 'Discovery', to: 'Design', link: '' }), /link/i);
});

test('directory validation reports only directed workstream artifacts', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-workstream-handoffs-'));
  try {
    fs.writeFileSync(path.join(directory, 'valid.md'), validHandoff(), 'utf8');
    fs.writeFileSync(path.join(directory, 'invalid.md'), validHandoff('design', 'design'), 'utf8');
    fs.writeFileSync(path.join(directory, 'delivery.md'), validHandoff('design', 'tech', {
      type: 'fb-lane-handoff',
      status: 'ready',
    }), 'utf8');
    const findings = validateWorkstreamHandoffDirectory(directory);
    assert.strictEqual(findings.length, 1);
    assert.match(findings[0].file, /invalid\.md$/);
    assert.match(findings[0].message, /different workstreams/i);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
