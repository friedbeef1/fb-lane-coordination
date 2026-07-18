#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REQUIRED_ENTRY_FIELDS = ['What changed', 'Why it matters', 'Compatibility', 'Installation or upgrade'];
const PLACEHOLDER = /^(?:tbd|todo|unknown|n\/?a|none|not recorded|placeholder)(?:\b|\s|[.!-])*$/i;

function lastSection(markdown, heading) {
  const matches = [...String(markdown).matchAll(new RegExp(`^##\\s+${heading}\\s*$`, 'gmi'))];
  if (!matches.length) return '';
  const start = matches.at(-1).index + matches.at(-1)[0].length;
  const next = /^##\s+/gm; next.lastIndex = start;
  const end = next.exec(markdown)?.index ?? markdown.length;
  return markdown.slice(start, end);
}

function field(section, label) {
  return new RegExp(`^\\s*(?:[-*]\\s*)?(?:\\*\\*)?${label}(?:\\*\\*)?\\s*:\\s*(.+)$`, 'mi').exec(section)?.[1]?.trim() || '';
}

function concrete(reason) {
  const value = String(reason || '').trim();
  return value.length >= 20 && /[\p{L}\p{N}]/u.test(value) && !PLACEHOLDER.test(value) && !/\b(?:tbd|todo|placeholder|not recorded)\b/i.test(value);
}

function githubAnchor(heading) {
  return heading.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function entryForAnchor(markdown, anchor) {
  const headings = [...String(markdown).matchAll(/^##\s+(.+)$/gm)];
  const index = headings.findIndex(match => githubAnchor(match[1]) === anchor.toLowerCase());
  if (index < 0) return '';
  const start = headings[index].index + headings[index][0].length;
  const end = headings[index + 1]?.index ?? markdown.length;
  return markdown.slice(start, end);
}

function assertReleaseCheckpoint(input) {
  const evidence = input.changelogEvidence;
  if (!evidence || evidence.result !== 'passed') throw new Error('Release checkpoint requires passing changelog verification evidence.');
  if (!/^[0-9a-f]{40}$/i.test(String(input.candidateCommit || '')) || evidence.candidateCommit !== input.candidateCommit) {
    throw new Error('Release checkpoint changelog evidence must match the current candidate commit.');
  }
  return { decision: 'verified', candidateCommit: input.candidateCommit };
}

function assertFullBfmChangelog(input = {}) {
  const mode = String(input.executionMode || 'full').toLowerCase();
  if (mode === 'quick' || mode === 'normal') return { decision: 'exempt', mode };
  if (input.releaseCheckpoint) return assertReleaseCheckpoint(input);
  const root = path.resolve(input.repoRoot || '.');
  const handoffPath = String(input.handoffPath || '');
  const absoluteHandoff = path.resolve(root, handoffPath);
  if (!handoffPath || !fs.existsSync(absoluteHandoff)) throw new Error('Full BFM changelog validation requires the linked task handoff.');
  const markdown = fs.readFileSync(absoluteHandoff, 'utf8');
  const expectation = field(lastSection(markdown, 'Build Brief'), 'Changelog expectation');
  const receipt = field(lastSection(markdown, 'Task Receipt'), 'Changelog');
  if (!expectation || !receipt) throw new Error('Full BFM requires matching Build Brief Changelog expectation and Task Receipt Changelog decisions.');

  if (/^required$/i.test(expectation)) {
    if (!/^updated\s+[—-]\s+/i.test(receipt)) throw new Error('Build Brief and Task Receipt changelog decisions do not agree.');
    const link = /\[[^\]]+\]\(([^)#]+)#([^)]+)\)/.exec(receipt);
    if (!link) throw new Error('Updated changelog decision requires a resolvable Markdown link and heading anchor.');
    const target = path.resolve(path.dirname(absoluteHandoff), link[1]);
    if (target !== path.join(root, 'CHANGELOG.md') || !fs.existsSync(target)) throw new Error('Updated changelog link must resolve to repository CHANGELOG.md.');
    const changed = execFileSync('git', ['diff', '--name-only', `${input.baseCommit}..${input.candidateCommit}`], { cwd: root, encoding: 'utf8' }).split(/\r?\n/);
    if (!changed.includes('CHANGELOG.md')) throw new Error('CHANGELOG.md must have changed within the Full BFM candidate range.');
    const entry = entryForAnchor(fs.readFileSync(target, 'utf8'), link[2]);
    if (!entry) throw new Error(`Changelog heading anchor #${link[2]} does not resolve.`);
    const missing = REQUIRED_ENTRY_FIELDS.filter(label => !concrete(field(entry, label)));
    if (missing.length) throw new Error(`Changelog entry is missing concrete user-facing fields: ${missing.join(', ')}.`);
    return { decision: 'updated', path: 'CHANGELOG.md', anchor: link[2], candidateCommit: input.candidateCommit };
  }

  const expectedReason = /^not expected\s+[—-]\s+(.+)$/i.exec(expectation)?.[1];
  const receiptReason = /^not required\s+[—-]\s+(.+)$/i.exec(receipt)?.[1];
  if (!expectedReason || !receiptReason) throw new Error('Build Brief and Task Receipt changelog decisions do not agree.');
  if (!concrete(expectedReason) || !concrete(receiptReason)) throw new Error('A not-required changelog decision requires a concrete non-placeholder reason.');
  const normalizeReason = value => value.normalize('NFKC').toLocaleLowerCase('und').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const normalizedExpected = normalizeReason(expectedReason);
  const normalizedReceipt = normalizeReason(receiptReason);
  if (!normalizedExpected || !normalizedReceipt || normalizedExpected !== normalizedReceipt) throw new Error('Build Brief and Task Receipt not-required reasons must agree exactly.');
  return { decision: 'not required', reason: receiptReason };
}

module.exports = { assertFullBfmChangelog, REQUIRED_ENTRY_FIELDS };
