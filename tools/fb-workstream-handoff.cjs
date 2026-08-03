#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const WORKSTREAMS = Object.freeze([
  'product', 'business', 'design', 'tech', 'discovery', 'bugs',
]);
const WORKSTREAM_HANDOFF_STATES = Object.freeze([
  'queued', 'in_review', 'consumed', 'deferred', 'superseded',
]);
const SAFE_TASK_ID = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9][A-Z0-9-]*)$/;

function parseFrontmatter(markdown) {
  const match = String(markdown || '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return {};
  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z0-9_-]+):\s*(.*?)\s*$/i);
    if (field) metadata[field[1].toLowerCase()] = field[2];
  }
  return metadata;
}

function section(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^##\\s+${escaped}\\s*$\\r?\\n([\\s\\S]*?)(?=^##\\s+|\\s*$)`, 'im').exec(String(markdown || ''));
  return match ? match[1].trim() : '';
}

function actionable(value) {
  const normalized = String(value || '').replace(/^[-*+]\s*/gm, '').trim();
  return normalized.length > 2 && !/^(tbd|todo|placeholder|unknown|none)$/i.test(normalized);
}

function validateWorkstreamHandoff(markdown) {
  const findings = [];
  const metadata = parseFrontmatter(markdown);
  if (metadata.type !== 'fb-workstream-handoff') {
    findings.push('type must be fb-workstream-handoff.');
  }
  const from = String(metadata.from_workstream || '').toLowerCase();
  const to = String(metadata.to_workstream || '').toLowerCase();
  if (!WORKSTREAMS.includes(from)) findings.push(`Unknown source workstream: ${metadata.from_workstream || '(missing)'}.`);
  if (!WORKSTREAMS.includes(to)) findings.push(`Unknown destination workstream: ${metadata.to_workstream || '(missing)'}.`);
  if (from && to && from === to) findings.push('Source and destination must be different workstreams.');
  if (!WORKSTREAM_HANDOFF_STATES.includes(String(metadata.status || '').toLowerCase())) {
    findings.push(`Workstream handoff status ${metadata.status || '(missing)'} is not valid; ready is reserved for Product delivery handoffs.`);
  }
  if (!SAFE_TASK_ID.test(String(metadata.source_task || '').toUpperCase())) {
    findings.push('A safe source_task is required.');
  }

  const required = [
    'Question investigated',
    'Recommendation',
    'Requested next investigation',
    'Decisions',
    'Assumptions',
    'Dependencies and limits',
  ];
  for (const heading of required) {
    if (!actionable(section(markdown, heading))) findings.push(`${heading} must contain actionable content.`);
  }
  const evidence = section(markdown, 'Evidence');
  if (!actionable(evidence) || !/\[[^\]]+\]\([^)]+\)/.test(evidence)) {
    findings.push('Evidence must contain at least one direct Markdown link.');
  }
  return findings;
}

function renderQueuedNotice(record = {}) {
  const from = String(record.from || '').trim();
  const to = String(record.to || '').trim();
  const link = String(record.link || '').trim();
  if (!from || /[\r\n]/.test(from)) throw new Error('A source workstream label is required.');
  if (!to || /[\r\n]/.test(to)) throw new Error('A destination workstream label is required.');
  if (!link || /[\r\n]/.test(link)) throw new Error('A direct handoff link is required.');
  return `${from} handoff queued for ${to} — planning only; waiting for you. Open: ${link}`;
}

function validateWorkstreamHandoffDirectory(directory) {
  if (!fs.existsSync(directory)) return [];
  const findings = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name === 'index.md') continue;
    const file = path.join(directory, entry.name);
    const markdown = fs.readFileSync(file, 'utf8');
    if (parseFrontmatter(markdown).type !== 'fb-workstream-handoff') continue;
    for (const message of validateWorkstreamHandoff(markdown)) findings.push({ file, message });
  }
  return findings;
}

module.exports = {
  WORKSTREAMS,
  WORKSTREAM_HANDOFF_STATES,
  parseFrontmatter,
  validateWorkstreamHandoff,
  renderQueuedNotice,
  validateWorkstreamHandoffDirectory,
};
