#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const EVAL_TYPES = new Set(['harness', 'product']);
const AUTHORITIES = new Set(['shadow', 'advisory', 'blocking', 'mechanical']);
const RESULTS = new Set(['pass', 'fail', 'blocked', 'not run']);
const RERUN_RESULTS = new Set(['pass', 'fail', 'blocked', 'not run', 'deferred', 'superseded']);
const FAILURE_CLASSIFICATIONS = new Set(['None', 'Build failure', 'Brief failure', 'Eval failure', 'Environment failure']);
const RESPONSIBLE_LAYERS = new Set(['Product', 'Design', 'Tech', 'Business']);
const EVAL_ID_PATTERN = /^EVAL-[A-Z0-9]+(?:-[A-Z0-9]+)+$/;
const REQUIRED_RECORD_FIELDS = [
  'Eval ID', 'Eval type', 'Authority', 'Previous authority',
  'Authority change approval', 'Authority change recorded by', 'Authority decision',
  'Trigger', 'Scenario', 'Quality target', 'Must pass', 'Must not happen',
  'Evidence required', 'Owner', 'Latest result', 'Failure classification',
  'Revision', 'Rerun result', 'Promotion or demotion recommendation',
];
const QUALITY_GAP_FIELDS = [
  'Eval ID', 'What is insufficient', 'Failed quality dimension', 'Good example',
  'Bad example', 'Responsible layer', 'Next scoped revision',
  'Evidence required for the next candidate',
];

function sections(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...String(markdown || '').matchAll(new RegExp(`^##\\s+${escaped}\\s*$`, 'gim'))];
  return matches.map(match => {
    const start = match.index + match[0].length;
    const next = String(markdown).slice(start).search(/^##\s+/m);
    const end = next === -1 ? String(markdown).length : start + next;
    return String(markdown).slice(start, end).trim();
  });
}

function fieldValue(markdown, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...String(markdown || '').matchAll(new RegExp(`(?:^|\\n)\\s*(?:[-*]\\s*)?(?:\\*\\*)?${escaped}(?:\\*\\*)?\\s*:\\s*([^\\n]+)`, 'gi'))];
  return matches.length ? matches[matches.length - 1][1].trim() : '';
}

function actionable(value, options = {}) {
  const normalized = String(value || '').trim().replace(/^\*+|\*+$/g, '').trim();
  if (!normalized || /^<[^>]+>$/.test(normalized) || /\b(?:todo|tbd|placeholder|not recorded(?: yet)?)\b/i.test(normalized)) return false;
  if (!options.allowNone && /^(?:none|n\/a|not run)(?:\b.*)?$/i.test(normalized)) return false;
  return true;
}

function assertPrivacy(markdown) {
  if (/\b(?:private reasoning|chain of thought|raw transcript)\b/i.test(markdown)) {
    throw new Error('Eval evidence must respect the curated privacy boundary; private reasoning and transcripts are forbidden.');
  }
  if (/\b(?:[A-Z0-9_]*(?:API[_-]?KEY|TOKEN|PASSWORD|SECRET|CREDENTIAL)[A-Z0-9_]*)\s*[:=]\s*(?!none\b|redacted\b)\S+/i.test(markdown)) {
    throw new Error('Eval evidence must not contain secrets, credentials, or tokens.');
  }
}

function parseEvalRecords(markdown) {
  return sections(markdown, 'Eval Record').map(source => {
    const fields = Object.fromEntries(REQUIRED_RECORD_FIELDS.map(label => [label, fieldValue(source, label)]));
    for (const label of [
      'Advisory failure explanation', 'Root cause', 'Regression case', 'Fresh evidence',
      'Record consistency', 'Changed user decision approval',
      'Mechanical origin and regression evidence', 'Good example', 'Bad example',
    ]) fields[label] = fieldValue(source, label);
    return { source, fields, id: fields['Eval ID'] };
  });
}

function authorityRank(authority) {
  return { shadow: 0, advisory: 1, blocking: 2, mechanical: 2 }[authority];
}

function validateRecord(record) {
  const fields = record.fields;
  const enumOrLifecycleFields = new Set(['Previous authority', 'Latest result', 'Failure classification', 'Revision', 'Rerun result']);
  for (const label of REQUIRED_RECORD_FIELDS) {
    if (!actionable(fields[label], { allowNone: enumOrLifecycleFields.has(label) })) {
      throw new Error(`Eval record ${record.id || '(missing ID)'} requires actionable ${label}.`);
    }
  }
  if (!EVAL_ID_PATTERN.test(fields['Eval ID'])) throw new Error(`Eval ID ${JSON.stringify(fields['Eval ID'])} is invalid; use a stable repo-local EVAL-... ID.`);
  if (!EVAL_TYPES.has(fields['Eval type'])) throw new Error(`Eval type must be harness or product for ${record.id}.`);
  if (!AUTHORITIES.has(fields.Authority)) throw new Error(`Authority must be shadow, advisory, blocking, or mechanical for ${record.id}.`);
  if (!RESULTS.has(fields['Latest result'])) throw new Error(`Latest result must be pass, fail, blocked, or not run for ${record.id}.`);
  if (!RERUN_RESULTS.has(String(fields['Rerun result']).split(/\s+-\s+/, 1)[0])) throw new Error(`Rerun result is invalid for ${record.id}.`);
  if (!FAILURE_CLASSIFICATIONS.has(fields['Failure classification'])) throw new Error(`Failure classification must be Build failure, Brief failure, Eval failure, Environment failure, or None for ${record.id}.`);
  if (['fail', 'blocked'].includes(fields['Latest result']) && fields['Failure classification'] === 'None') throw new Error(`Failure classification is required before revision for ${record.id}.`);
  if (fields['Latest result'] === 'pass' && /^pass\b/i.test(fields['Rerun result']) && fields['Failure classification'] === 'None') {
    throw new Error(`Failure classification is required for the closed rerun of ${record.id}.`);
  }

  const previous = fields['Previous authority'];
  if (previous === 'none') {
    if (fields.Authority !== 'shadow') throw new Error(`All new eval records start shadow; ${record.id} cannot start ${fields.Authority}.`);
  } else {
    if (!AUTHORITIES.has(previous)) throw new Error(`Previous authority is invalid for ${record.id}.`);
    if (!/Product|BFM/i.test(fields['Authority change recorded by']) || /eval itself|automatic|self/i.test(fields['Authority change recorded by'])) {
      throw new Error(`Every authority change for ${record.id} must be recorded by Product/BFM; evals never self-promote.`);
    }
    if (['blocking', 'mechanical'].includes(fields.Authority) && fields.Authority !== previous && !/(?:explicit\s+Product\s+approval|APPROVED[-_ ]PRODUCT|APPROVED-[A-Z0-9])/i.test(fields['Authority change approval'])) {
      throw new Error(`Promotion of ${record.id} to ${fields.Authority} requires explicit Product approval evidence.`);
    }
    if (authorityRank(fields.Authority) < authorityRank(previous) && !/demot/i.test(fields['Promotion or demotion recommendation'])) {
      throw new Error(`A noisy or ambiguous ${record.id} authority reduction requires an immediate demotion recommendation.`);
    }
  }
  if (fields.Authority === 'mechanical' && !actionable(fields['Mechanical origin and regression evidence'])) {
    throw new Error(`Mechanical origin and regression evidence are required for ${record.id}.`);
  }
  if (fields['Eval type'] === 'product') {
    for (const label of ['Good example', 'Bad example']) {
      if (!actionable(fields[label])) throw new Error(`Subjective product eval ${record.id} requires a concrete ${label}.`);
    }
  }
  assertPrivacy(record.source);
  return true;
}

function validateEvalDocument(markdown) {
  const records = parseEvalRecords(markdown);
  if (!records.length) throw new Error('No ## Eval Record section found.');
  const seen = new Set();
  for (const record of records) {
    validateRecord(record);
    if (seen.has(record.id)) throw new Error(`Eval IDs must be unique; duplicate ${record.id}.`);
    seen.add(record.id);
  }
  return records;
}

function assertEvalCloseout(markdown) {
  const records = validateEvalDocument(markdown);
  for (const record of records) {
    const fields = record.fields;
    const rerun = String(fields['Rerun result']).split(/\s+-\s+/, 1)[0];
    const closedDisposition = ['pass', 'deferred', 'superseded'].includes(rerun);
    if (['fail', 'blocked', 'not run'].includes(fields['Latest result'])) {
      if (fields.Authority === 'advisory' && !closedDisposition && !actionable(fields['Advisory failure explanation'])) {
        throw new Error(`Advisory failure ${record.id} needs a fix or explanation in the task handoff.`);
      }
      if (['blocking', 'mechanical'].includes(fields.Authority) && !closedDisposition) {
        throw new Error(`${fields.Authority} eval ${record.id} blocks closeout and remains Checking until the documented Product boundary resolves it.`);
      }
    }
    if (fields['Latest result'] === 'pass' && fields['Failure classification'] !== 'None' && !closedDisposition) {
      throw new Error(`Closed eval failure ${record.id} requires a pass, deferred, or superseded rerun result.`);
    }
    if (fields['Failure classification'] !== 'None' && closedDisposition) {
      for (const label of ['Revision', 'Root cause', 'Regression case', 'Fresh evidence', 'Record consistency']) {
        if (!actionable(fields[label])) throw new Error(`Closed eval failure ${record.id} requires actionable ${label}.`);
      }
      const decision = fields['Changed user decision approval'];
      const explicitApproval = /(?:explicit\s+Product\s+approval|APPROVED[-_ ])/i.test(decision);
      if ((['deferred', 'superseded'].includes(rerun) && !explicitApproval)
        || (!/no user decision changed|no .*decision.*change/i.test(decision) && !explicitApproval)) {
        throw new Error(`Closed eval failure ${record.id} requires explicit approval for any changed user decision.`);
      }
    }
  }
  return true;
}

function validateQualityGaps(markdown) {
  const gaps = sections(markdown, 'Quality Gap');
  const missed = String(markdown).includes('Checking — product quality target missed');
  if (missed && gaps.length === 0) throw new Error('Checking — product quality target missed requires a complete ## Quality Gap.');
  if (gaps.length && !missed) throw new Error('An unresolved Quality Gap must keep progress exactly Checking — product quality target missed.');
  for (const gap of gaps) {
    for (const label of QUALITY_GAP_FIELDS) {
      if (!actionable(fieldValue(gap, label))) throw new Error(`Quality Gap requires actionable ${label}.`);
    }
    if (!EVAL_ID_PATTERN.test(fieldValue(gap, 'Eval ID'))) throw new Error('Quality Gap requires a valid Eval ID.');
    if (!RESPONSIBLE_LAYERS.has(fieldValue(gap, 'Responsible layer'))) throw new Error('Quality Gap Responsible layer must be Product, Design, Tech, or Business.');
  }
  return gaps;
}

function requiredField(section, label, context, allowNone = false) {
  if (!section || !actionable(fieldValue(section, label), { allowNone })) throw new Error(`${context} requires ${label} for selected evals.`);
}

function validateSelectedEvalIntegration(markdown, selectedIds = []) {
  const projectStart = sections(markdown, 'Project Start Brief').at(-1) || '';
  const build = sections(markdown, 'Build Brief').at(-1) || '';
  for (const [name, section] of [['Project Start Brief', projectStart], ['Build Brief', build]]) {
    for (const label of ['Quality bar', 'Selected eval IDs and authority', 'Mechanical versus judgment evidence', 'Remaining user judgment']) requiredField(section, label, name);
  }
  requiredField(sections(markdown, 'Verification Handoff').at(-1), 'Selected eval results and evidence', 'Verification Handoff');
  requiredField(sections(markdown, 'Task Receipt').at(-1), 'Selected eval results and evidence', 'Task Receipt');
  const testNow = sections(markdown, 'Test This Now').at(-1) || '';
  for (const label of ['What was evaluated', 'Exact scenarios and expected results', 'Known quality gaps', 'Required user judgment']) requiredField(testNow, label, 'Test This Now', ['Known quality gaps', 'Required user judgment'].includes(label));
  requiredField(sections(markdown, 'Verification Checkpoint').at(-1), 'Selected eval results and evidence', 'verification checkpoint');
  for (const id of selectedIds) if (!String(markdown).includes(id)) throw new Error(`Selected eval ${id} is missing from the integrated records.`);
  return true;
}

function selectedEvalAuthorities(markdown) {
  const values = [...String(markdown || '').matchAll(/Selected eval IDs and authority\s*:\s*([^\n]+)/gi)].map(match => match[1]);
  const selected = new Map();
  for (const value of values) {
    for (const match of value.matchAll(/(EVAL-[A-Z0-9]+(?:-[A-Z0-9]+)+)\s*\((shadow|advisory|blocking|mechanical)\)/g)) {
      if (selected.has(match[1]) && selected.get(match[1]) !== match[2]) throw new Error(`Selected eval ${match[1]} has inconsistent authority across records.`);
      selected.set(match[1], match[2]);
    }
  }
  return selected;
}

function assertSelectedEvalCloseout(repoRoot, markdown) {
  const selected = selectedEvalAuthorities(markdown);
  if (selected.size === 0) return true;
  validateSelectedEvalIntegration(markdown, [...selected.keys()]);
  const evalDir = path.join(repoRoot, 'docs', 'evals');
  const sources = fs.existsSync(evalDir)
    ? fs.readdirSync(evalDir).filter(name => name.endsWith('.md') && !/(?:template|scorecard)/i.test(name)).map(name => fs.readFileSync(path.join(evalDir, name), 'utf8'))
    : [];
  const records = sources.flatMap(parseEvalRecords);
  const byId = new Map();
  for (const record of records) {
    validateRecord(record);
    if (byId.has(record.id)) throw new Error(`Eval IDs must be unique; duplicate ${record.id}.`);
    byId.set(record.id, record);
  }
  for (const [id, authority] of selected) {
    const record = byId.get(id);
    if (!record) throw new Error(`Selected eval ${id} has no repo-local record under docs/evals/.`);
    if (record.fields.Authority !== authority) throw new Error(`Selected eval ${id} authority ${authority} does not match its record authority ${record.fields.Authority}.`);
    assertEvalCloseout(`## Eval Record\n\n${record.source}`);
  }
  return true;
}

function collectEvalDoctorChecks(repoRoot) {
  const checks = [];
  const dir = path.join(repoRoot, 'docs', 'evals');
  if (!fs.existsSync(dir)) return [{ level: 'warn', label: 'Eval records', detail: 'docs/evals is missing.', fix: 'Bootstrap or add the canonical eval template.' }];
  const files = fs.readdirSync(dir)
    .filter(name => name.endsWith('.md') && !/(?:template|scorecard)/i.test(name))
    .map(name => path.join(dir, name));
  try {
    const all = files.map(file => fs.readFileSync(file, 'utf8')).join('\n');
    if (all.trim()) {
      validateEvalDocument(all);
      validateQualityGaps(all);
      assertEvalCloseout(all);
    }
    checks.push({ level: 'ok', label: 'Eval record structure', detail: `${files.length} eval record file(s) have valid deterministic structure.`, fix: '' });
  } catch (err) {
    checks.push({ level: 'fail', label: 'Eval record structure', detail: err.message, fix: 'Repair the Markdown record without weakening its quality target or changing authority automatically.' });
  }
  return checks;
}

module.exports = {
  EVAL_TYPES,
  AUTHORITIES,
  RESULTS,
  FAILURE_CLASSIFICATIONS,
  EVAL_ID_PATTERN,
  parseEvalRecords,
  validateEvalDocument,
  validateQualityGaps,
  validateSelectedEvalIntegration,
  assertEvalCloseout,
  assertSelectedEvalCloseout,
  collectEvalDoctorChecks,
};
