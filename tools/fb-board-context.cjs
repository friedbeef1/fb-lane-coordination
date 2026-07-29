#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const TERMINAL_STATUS = /^(?:done|complete|completed|deferred|superseded|cancelled|canceled)$/i;
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
  const reserve = 100;
  for (const row of active) {
    const rendered = `| ${row.id} | ${compactCell(row.status, 24)} | ${compactCell(row.owner, 50)} | ${compactCell(row.scope, 180)} | ${compactCell(row.locks, 180)} | ${compactCell(row.links, 180)} |\n`;
    if (output.length + rendered.length + reserve > maxChars) break;
    output += rendered;
    included += 1;
  }
  const omitted = active.length - included;
  if (omitted > 0) {
    const notice = `\n${omitted} additional lower-priority row(s) were omitted from this packet; use targeted status or handoff links only when needed.\n`;
    output += notice.slice(0, Math.max(0, maxChars - output.length));
  }
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
    archive = `${archive.trimEnd()}\n${newRows.map(row => row.line).join('\n')}\n\n## Archived detail records\n\n`;
    const blockById = new Map(blocks.map(block => [block.id, block.markdown]));
    archive += `${newRows.map(row => blockById.get(row.id)).filter(Boolean).join('\n\n')}\n`;
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
  TERMINAL_STATUS,
  renderBoardContext,
  compactBoardFiles,
};
