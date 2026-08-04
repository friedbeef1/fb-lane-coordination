#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const TERMINAL_STATUS = /^(?:done|complete|completed|deferred|superseded|rejected|cancelled|canceled)$/i;
const STATUS_PRIORITY = new Map([
  ['in progress', 0],
  ['blocked', 1],
  ['ready', 2],
  ['inbox', 3],
  ['staging qa', 4],
]);
const DEFAULT_CONTEXT_CHARS = 16_000;
const DEFAULT_ARCHIVE_THRESHOLD_BYTES = 64 * 1024;
const DEFAULT_RETAIN_TERMINAL = 3;
const WORKSTREAM_MANAGED_START = '<!-- FB-LANE:WORKSTREAM-SUMMARY:START -->';
const WORKSTREAM_MANAGED_END = '<!-- FB-LANE:WORKSTREAM-SUMMARY:END -->';
const HISTORICAL_LOOKUP = 'Historical lookup: [handoff index](docs/handoffs/index.md) · [board archives](docs/board/archive/)';

function boardRows(markdown) {
  const rows = [];
  for (const line of String(markdown).split(/\r?\n/)) {
    if (!line.startsWith('|')) continue;
    const escaped = line.replace(/\\\|/g, '\u0000');
    const cells = escaped.slice(1, escaped.endsWith('|') ? -1 : undefined)
      .split('|')
      .map(cell => cell.replace(/\u0000/g, '\\|').trim());
    if (cells.length < 7 || !/^[A-Za-z0-9][A-Za-z0-9-]*\d+$/.test(cells[0])) continue;
    rows.push({
      id: cells[0],
      status: cells[1],
      owner: cells[2],
      area: cells[3],
      scope: cells[4],
      locks: cells[5],
      links: cells[6],
      line,
    });
  }
  return rows;
}

function compactCell(value, max = 140) {
  const normalized = String(value || '(None)').replace(/\s+/g, ' ').trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1)}…`;
}

function normalizedLane(lane) {
  return String(lane || '').trim().replace(/^fb-/i, '').toLowerCase();
}

function rowBelongsToLane(row, lane) {
  const normalized = normalizedLane(lane);
  if (!normalized) return false;
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|\\b)fb-${escaped}\\b`, 'i').test(String(row.owner || ''));
}

function rebaseMarkdownLinks(markdown, fromDir, toDir) {
  if (!fromDir || !toDir || path.resolve(fromDir) === path.resolve(toDir)) return String(markdown || '');
  return String(markdown || '').replace(/\]\(([^)\s]+)([^)]*)\)/g, (match, target, suffix) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(target)) return match;
    const targetMatch = target.match(/^([^?#]+)([?#].*)?$/);
    if (!targetMatch) return match;
    const rebased = path.relative(toDir, path.resolve(fromDir, targetMatch[1])).split(path.sep).join('/');
    return `](${rebased || '.'}${targetMatch[2] || ''}${suffix})`;
  });
}

function renderWorkstreamRow(row, options = {}) {
  const status = options.includeStatus ? ` (${row.status})` : '';
  const links = row.links && row.links !== '(None)'
    ? ` — ${rebaseMarkdownLinks(row.links, options.sourceDir, options.targetDir)}`
    : '';
  return `- **${row.id}**${status} — ${row.scope || '(No scope recorded)'}${links}`;
}

function renderWorkstreamSummary(boardMarkdown, lane, options = {}) {
  const recentTerminal = Number.isInteger(options.recentTerminal)
    ? Math.min(DEFAULT_RETAIN_TERMINAL, Math.max(0, options.recentTerminal))
    : DEFAULT_RETAIN_TERMINAL;
  const rows = boardRows(boardMarkdown).filter(row => rowBelongsToLane(row, lane));
  const active = rows.filter(row => !TERMINAL_STATUS.test(row.status));
  const current = active.filter(row => !/^ready$/i.test(row.status) && !/^blocked$/i.test(row.status));
  const next = active.filter(row => /^ready$/i.test(row.status));
  const blocked = active.filter(row => /^blocked$/i.test(row.status));
  const delivered = rows.filter(row => TERMINAL_STATUS.test(row.status)).slice(0, recentTerminal);
  const sourceDir = options.sourceDir || process.cwd();
  const targetDir = options.targetDir || path.join(sourceDir, 'docs', 'workstreams');
  const renderRow = (row, includeStatus = true) => renderWorkstreamRow(row, { includeStatus, sourceDir, targetDir });
  const list = (items, empty, render = row => renderRow(row)) =>
    items.length ? items.map(render).join('\n') : `- ${empty}`;

  return [
    '## Current',
    list(current, 'None.'),
    '',
    '## Next',
    list(next, 'None ready for Product intake.', row => `- **${row.id}** — Product intake: ${row.scope || '(No scope recorded)'}${row.links && row.links !== '(None)' ? ` — ${rebaseMarkdownLinks(row.links, sourceDir, targetDir)}` : ''}`),
    '',
    '## Blocked',
    list(blocked, 'None.'),
    '',
    '## Recently delivered',
    list(delivered, 'None.', row => renderRow(row)),
    '',
    '## Historical lookup',
    '- [Handoff index](../handoffs/index.md)',
    '- [Board archives](../board/archive/)',
  ].join('\n');
}

function refreshManagedWorkstreamCard(cardPath, summary) {
  const source = fs.existsSync(cardPath) ? fs.readFileSync(cardPath, 'utf8') : '';
  const rendered = String(summary || '').trim();
  const start = source.indexOf(WORKSTREAM_MANAGED_START);
  const end = start === -1 ? -1 : source.indexOf(WORKSTREAM_MANAGED_END, start + WORKSTREAM_MANAGED_START.length);
  let next;
  if (start === -1 && end === -1) {
    const separator = source && !source.endsWith('\n') ? '\n' : '';
    next = `${source}${separator}${WORKSTREAM_MANAGED_START}\n${rendered}\n${WORKSTREAM_MANAGED_END}\n`;
  } else if (start !== -1 && end !== -1) {
    const before = source.slice(0, start + WORKSTREAM_MANAGED_START.length);
    const after = source.slice(end);
    next = `${before}\n${rendered}\n${after}`;
  } else {
    throw new Error(`Workstream card ${cardPath} has an unmatched managed-summary marker.`);
  }
  if (next !== source) atomicWrite(cardPath, next);
  return next;
}

function lifecycleHandoffPath(row, rootDir) {
  const root = path.resolve(rootDir || process.cwd());
  const linked = String(row.links || '').match(/\]\((docs\/handoffs\/[^)#]+\.md)(?:#[^)]+)?\)/i)?.[1];
  const candidates = [linked, `docs/handoffs/${row.id}.md`].filter(Boolean);
  for (const candidate of candidates) {
    const resolved = path.resolve(root, candidate);
    if (resolved.startsWith(`${root}${path.sep}`) && fs.existsSync(resolved)) return resolved;
  }
  return null;
}

function lifecycleField(markdown, label) {
  for (const line of String(markdown).split(/\r?\n/)) {
    const normalized = line
      .trim()
      .replace(/^(?:[-*+]\s+)?/, '')
      .replace(/\*\*/g, '');
    const match = normalized.match(new RegExp(`^${label}\\s*:\\s*(.+?)\\s*$`, 'i'));
    if (match) return match[1].trim();
  }
  return '';
}

function lifecycleValueIsNone(value) {
  return /^none[.!]?$/i.test(String(value || '').trim());
}

function lifecycleValueIsConcrete(value) {
  const normalized = String(value || '').trim();
  return Boolean(normalized)
    && !lifecycleValueIsNone(normalized)
    && !/(?:\b(?:todo|tbd|n\/a|not recorded|not yet|placeholder)\b|<[^>]*>)/i.test(normalized);
}

function collectLifecycleFindings(boardMarkdown, options = {}) {
  const findings = [];
  for (const row of boardRows(boardMarkdown)) {
    const handoffPath = lifecycleHandoffPath(row, options.rootDir);
    const handoff = handoffPath ? fs.readFileSync(handoffPath, 'utf8') : '';
    const isProspectiveHandoff = /^fb_harness:\s*v3\s*$/im.test(handoff);
    const activeLocks = lifecycleField(handoff, 'Active locks');
    if (TERMINAL_STATUS.test(row.status) && isProspectiveHandoff && lifecycleValueIsConcrete(activeLocks)) {
      findings.push({
        taskId: row.id,
        code: 'terminal-with-locks',
        message: `${row.status} handoff still declares active locks: ${activeLocks}.`,
        nextAction: `Product: confirm no active owner needs the locks, then release them explicitly for ${row.id}.`,
      });
      continue;
    }
    if (!/^staging qa$/i.test(row.status)) continue;
    if (!isProspectiveHandoff) continue;

    const externalGates = lifecycleField(handoff, 'External gates');
    const remainingOwnerAction = lifecycleField(handoff, 'Remaining owner/action');
    const bothNone = lifecycleValueIsNone(externalGates) && lifecycleValueIsNone(remainingOwnerAction);
    if (!lifecycleValueIsConcrete(externalGates)) {
      findings.push({
        taskId: row.id,
        code: 'staging-without-gate',
        message: 'Staging QA handoff has no concrete external gate.',
        nextAction: bothNone
          ? `Product: move ${row.id} to a terminal status; both prospective lifecycle values are none.`
          : `Product: record a concrete external gate or move ${row.id} to a terminal status.`,
      });
    }
    if (!lifecycleValueIsConcrete(remainingOwnerAction)) {
      findings.push({
        taskId: row.id,
        code: 'staging-without-owner-action',
        message: 'Staging QA handoff has no concrete remaining owner/action.',
        nextAction: bothNone
          ? `Product: move ${row.id} to a terminal status; both prospective lifecycle values are none.`
          : `Product: record a concrete remaining owner/action or move ${row.id} to a terminal status.`,
      });
    }
  }
  return findings;
}

function renderBoardContext(markdown, options = {}) {
  const maxChars = Number.isFinite(options.maxChars) ? Math.max(500, options.maxChars) : DEFAULT_CONTEXT_CHARS;
  const active = boardRows(markdown)
    .filter(row => !TERMINAL_STATUS.test(row.status))
    .sort((left, right) =>
      (STATUS_PRIORITY.get(left.status.toLowerCase()) ?? 5) - (STATUS_PRIORITY.get(right.status.toLowerCase()) ?? 5)
    );
  const lines = [
    'FB active board context',
    '',
    '| ID | Status | Owner | Scope | Active locks | Detail |',
    '|---|---|---|---|---|---|',
  ];
  let output = `${lines.join('\n')}\n`;
  let included = 0;
  const overflowNotice = omitted => `\n${omitted} additional lower-priority row(s) were omitted from this packet; use targeted status or handoff links only when needed.\n`;
  const reserve = HISTORICAL_LOOKUP.length + overflowNotice(active.length).length + 2;
  for (const row of active) {
    const rendered = `| ${row.id} | ${compactCell(row.status, 24)} | ${compactCell(row.owner, 50)} | ${compactCell(row.scope, 180)} | ${compactCell(row.locks, 180)} | ${compactCell(row.links, 180)} |\n`;
    if (output.length + rendered.length + reserve > maxChars) break;
    output += rendered;
    included += 1;
  }
  const omitted = active.length - included;
  if (omitted > 0) {
    output += overflowNotice(omitted);
  }
  output += `\n${HISTORICAL_LOOKUP}\n`;
  return output;
}

function detailBlocks(markdown) {
  const lines = String(markdown).split(/\r?\n/);
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^###\s+([A-Za-z0-9][A-Za-z0-9-]*\d+)\b/);
    if (match) starts.push({ id: match[1], start: index });
  }
  return starts.map((entry, index) => {
    const end = index + 1 < starts.length ? starts[index + 1].start : lines.length;
    return {
      id: entry.id,
      start: entry.start,
      end,
      markdown: lines.slice(entry.start, end).join('\n').trim(),
    };
  });
}

function atomicWrite(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`;
  try {
    fs.writeFileSync(temporary, contents, 'utf8');
    fs.renameSync(temporary, filePath);
  } finally {
    try {
      fs.unlinkSync(temporary);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

function compactBoardFiles(boardPath, options = {}) {
  const resolvedBoard = path.resolve(boardPath);
  const source = fs.readFileSync(resolvedBoard, 'utf8');
  const thresholdBytes = Number.isFinite(options.thresholdBytes)
    ? Math.max(0, options.thresholdBytes)
    : DEFAULT_ARCHIVE_THRESHOLD_BYTES;
  const retainTerminal = Number.isInteger(options.retainTerminal)
    ? Math.max(0, options.retainTerminal)
    : DEFAULT_RETAIN_TERMINAL;
  if (Buffer.byteLength(source) <= thresholdBytes) {
    return { changed: false, archivePath: null, archivedTaskIds: [] };
  }

  const terminal = boardRows(source).filter(row => TERMINAL_STATUS.test(row.status));
  const archived = terminal.slice(retainTerminal);
  if (!archived.length) {
    return { changed: false, archivePath: null, archivedTaskIds: [] };
  }

  const archivedIds = new Set(archived.map(row => row.id));
  const blocks = detailBlocks(source);
  const removedLineIndexes = new Set();
  const sourceLines = source.split(/\r?\n/);
  for (let index = 0; index < sourceLines.length; index += 1) {
    if (archived.some(row => sourceLines[index] === row.line)) removedLineIndexes.add(index);
  }
  for (const block of blocks) {
    if (!archivedIds.has(block.id)) continue;
    for (let index = block.start; index < block.end; index += 1) removedLineIndexes.add(index);
  }
  const nextBoard = sourceLines.filter((_, index) => !removedLineIndexes.has(index)).join('\n');

  const now = options.now instanceof Date ? options.now : new Date();
  const month = now.toISOString().slice(0, 7);
  const archivePath = path.join(path.dirname(resolvedBoard), 'docs', 'board', 'archive', `${month}.md`);
  const existing = fs.existsSync(archivePath) ? fs.readFileSync(archivePath, 'utf8') : '';
  const newRows = archived.filter(row => !new RegExp(`\\b${row.id}\\b`).test(existing));
  let archive = existing || `# Board archive — ${month}\n\nTerminal task history moved mechanically from \`PROJECT_BOARD.md\`.\n\n## Archived rows\n\n| ID | Status | Owner | Area | Scope | Affected Screens / Locks | Links & Deliverables |\n|---|---|---|---|---|---|---|\n`;
  if (newRows.length) {
    const archiveDir = path.dirname(archivePath);
    const boardDir = path.dirname(resolvedBoard);
    archive = `${archive.trimEnd()}\n${newRows.map(row => rebaseMarkdownLinks(row.line, boardDir, archiveDir)).join('\n')}\n\n## Archived detail records\n\n`;
    const blockById = new Map(blocks.map(block => [block.id, block.markdown]));
    archive += `${newRows.map(row => blockById.get(row.id)).filter(Boolean).map(block => rebaseMarkdownLinks(block, boardDir, archiveDir)).join('\n\n')}\n`;
  }

  atomicWrite(archivePath, archive);
  atomicWrite(resolvedBoard, nextBoard);
  return {
    changed: true,
    archivePath,
    archivedTaskIds: archived.map(row => row.id),
  };
}

module.exports = {
  boardRows,
  rebaseMarkdownLinks,
  TERMINAL_STATUS,
  collectLifecycleFindings,
  renderBoardContext,
  renderWorkstreamSummary,
  refreshManagedWorkstreamCard,
  compactBoardFiles,
};
