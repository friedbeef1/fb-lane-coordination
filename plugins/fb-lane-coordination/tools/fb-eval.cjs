#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const EVAL_TYPES = new Set(['harness', 'product']);
const AUTHORITIES = new Set(['shadow', 'advisory', 'blocking', 'mechanical']);
const RESULTS = new Set(['pass', 'fail', 'blocked', 'not run']);
const RERUN_RESULTS = new Set(['pass', 'fail', 'blocked', 'not run', 'deferred', 'superseded']);
const DISPOSITIONS = new Set(['open', 'passed', 'deferred', 'superseded']);
const JUDGMENTS = new Set(['subjective', 'objective']);
const FAILURE_CLASSIFICATIONS = new Set(['None', 'Build failure', 'Brief failure', 'Eval failure', 'Environment failure']);
const RESPONSIBLE_LAYERS = new Set(['Product', 'Design', 'Tech', 'Business']);
const EVAL_ID_PATTERN = /^EVAL-[A-Z0-9]+(?:-[A-Z0-9]+)+$/;
const REQUIRED_RECORD_FIELDS = [
  'Eval ID', 'Eval type', 'Authority', 'Previous authority',
  'Authority change approval', 'Authority change recorded by', 'Authority decision',
  'Judgment',
  'Trigger', 'Scenario', 'Quality target', 'Must pass', 'Must not happen',
  'Evidence required', 'Owner', 'Latest result', 'Failure classification',
  'Revision', 'Rerun result', 'Disposition', 'Promotion or demotion recommendation',
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
      'Record consistency', 'Changed user decision approval', 'Approved brief revision',
      'Mechanical origin and regression evidence', 'Good example', 'Bad example',
    ]) fields[label] = fieldValue(source, label);
    return { source, fields, id: fields['Eval ID'] };
  });
}

function authorityRank(authority) {
  return { shadow: 0, advisory: 1, blocking: 2, mechanical: 2 }[authority];
}

function hasPositiveProductApproval(value) {
  return /^Product approval:\s*approved;\s*Reference:\s*APPROVED-[A-Z0-9][A-Z0-9._-]*\.?$/i.test(String(value || '').trim());
}

function validateRecord(record) {
  const fields = record.fields;
  const enumOrLifecycleFields = new Set(['Previous authority', 'Latest result', 'Failure classification', 'Revision', 'Rerun result', 'Disposition']);
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
  if (!DISPOSITIONS.has(fields.Disposition)) throw new Error(`Disposition must be open, passed, deferred, or superseded for ${record.id}.`);
  if (!JUDGMENTS.has(fields.Judgment)) throw new Error(`Judgment must be subjective or objective for ${record.id}.`);
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
    const authorityEvidence = [fields['Authority change approval'], fields['Authority change recorded by'], fields['Authority decision']].join('\n');
    if (/\b(?:automatic(?:ally)?|self[- ]?promot(?:e|ed|ion|ing))\b/i.test(authorityEvidence)) {
      throw new Error(`Authority evidence for ${record.id} cannot claim automatic or self-promotion.`);
    }
    if (['blocking', 'mechanical'].includes(fields.Authority) && fields.Authority !== previous && !hasPositiveProductApproval(fields['Authority change approval'])) {
      throw new Error(`Promotion of ${record.id} to ${fields.Authority} requires explicit Product approval evidence.`);
    }
    if (authorityRank(fields.Authority) < authorityRank(previous) && !/demot/i.test(fields['Promotion or demotion recommendation'])) {
      throw new Error(`A noisy or ambiguous ${record.id} authority reduction requires an immediate demotion recommendation.`);
    }
  }
  if (fields.Authority === 'mechanical' && !actionable(fields['Mechanical origin and regression evidence'])) {
    throw new Error(`Mechanical origin and regression evidence are required for ${record.id}.`);
  }
  if (fields.Authority === 'mechanical' && fields.Judgment !== 'objective') throw new Error(`Mechanical eval ${record.id} must use objective Judgment.`);
  if (fields['Eval type'] === 'product' && fields.Judgment === 'subjective') {
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
    const disposition = fields.Disposition;
    const closedDisposition = disposition !== 'open';
    const coherent = (disposition === 'open' && ['fail', 'blocked', 'not run'].includes(fields['Latest result']) && ['fail', 'blocked', 'not run'].includes(rerun))
      || (disposition === 'passed' && fields['Latest result'] === 'pass' && rerun === 'pass')
      || (disposition === 'deferred' && fields['Latest result'] === 'blocked' && rerun === 'deferred')
      || (disposition === 'superseded' && fields['Latest result'] === 'blocked' && rerun === 'superseded');
    if (!coherent) throw new Error(`Eval ${record.id} has incoherent Latest result, Rerun result, and Disposition.`);
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
      if (rerun === 'superseded' && !actionable(fields['Approved brief revision'])) {
        throw new Error(`Superseded eval failure ${record.id} requires an actionable approved brief revision.`);
      }
    }
  }
  return true;
}

function validateQualityGaps(markdown) {
  const gaps = sections(markdown, 'Quality Gap');
  const progress = fieldValue(markdown, 'Progress');
  const records = new Map(parseEvalRecords(markdown).map(record => [record.id, record]));
  if (progress === 'Checking — product quality target missed' && gaps.length === 0) throw new Error('Checking — product quality target missed requires a complete ## Quality Gap.');
  for (const gap of gaps) {
    for (const label of [...QUALITY_GAP_FIELDS, 'Gap status']) {
      if (!actionable(fieldValue(gap, label))) throw new Error(`Quality Gap requires actionable ${label}.`);
    }
    const id = fieldValue(gap, 'Eval ID');
    const status = fieldValue(gap, 'Gap status');
    if (!EVAL_ID_PATTERN.test(id)) throw new Error('Quality Gap requires a valid Eval ID.');
    if (!RESPONSIBLE_LAYERS.has(fieldValue(gap, 'Responsible layer'))) throw new Error('Quality Gap Responsible layer must be Product, Design, Tech, or Business.');
    if (!['open', 'closed'].includes(status)) throw new Error('Quality Gap status must be open or closed.');
    const record = records.get(id);
    if (!record) throw new Error(`Quality Gap ${id} requires its repo-local Eval Record in the same document set.`);
    if (status === 'open') {
      if (progress !== 'Checking — product quality target missed') throw new Error('An open Quality Gap must keep Progress exactly Checking — product quality target missed.');
      if (record.fields.Disposition !== 'open' || record.fields['Latest result'] === 'pass') throw new Error(`Open Quality Gap ${id} requires an open, non-passing eval record.`);
    } else {
      if (progress === 'Checking — product quality target missed') throw new Error(`Closed Quality Gap ${id} cannot retain Checking progress.`);
      if (record.fields.Disposition !== 'passed' || record.fields['Latest result'] !== 'pass') throw new Error(`Closed Quality Gap ${id} requires a passed eval record.`);
      if (!actionable(fieldValue(gap, 'Closed evidence'))) throw new Error(`Closed Quality Gap ${id} requires actionable Closed evidence.`);
    }
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
    for (const label of ['Quality bar', 'Selected eval IDs and authority', 'Selected eval records', 'Mechanical versus judgment evidence', 'Remaining user judgment']) requiredField(section, label, name);
  }
  const verification = sections(markdown, 'Verification Handoff').at(-1);
  const receipt = sections(markdown, 'Task Receipt').at(-1);
  requiredField(verification, 'Selected eval results and evidence', 'Verification Handoff');
  requiredField(verification, 'Selected eval records', 'Verification Handoff');
  requiredField(receipt, 'Selected eval results and evidence', 'Task Receipt');
  requiredField(receipt, 'Selected eval records', 'Task Receipt');
  const testNow = sections(markdown, 'Test This Now').at(-1) || '';
  for (const label of ['What was evaluated', 'Exact scenarios and expected results', 'Known quality gaps', 'Required user judgment']) requiredField(testNow, label, 'Test This Now', ['Known quality gaps', 'Required user judgment'].includes(label));
  requiredField(testNow, 'Selected eval records', 'Test This Now');
  const checkpoint = sections(markdown, 'Verification Checkpoint').at(-1);
  requiredField(checkpoint, 'Selected eval results and evidence', 'verification checkpoint');
  requiredField(checkpoint, 'Selected eval records', 'verification checkpoint');
  const relevant = [projectStart, build, verification, receipt, testNow, checkpoint];
  const canonical = relevant.map(section => parseSelectedEvalRecords(fieldValue(section, 'Selected eval records')));
  const signature = selectedSignature(canonical[0]);
  if (canonical.some(records => selectedSignature(records) !== signature)) throw new Error('Selected eval records must use consistent IDs, authority, results, and evidence references across all six records.');
  const found = new Set(canonical[0].map(record => record.id));
  if (selectedIds.length && (found.size !== selectedIds.length || selectedIds.some(id => !found.has(id)))) throw new Error(`Selected eval records do not match selected IDs: ${selectedIds.join(', ')}.`);
  for (const id of selectedIds) if (!String(markdown).includes(id)) throw new Error(`Selected eval ${id} is missing from the integrated records.`);
  return true;
}

function parseSelectedEvalRecords(value) {
  const source = String(value || '').trim().replace(/\.$/, '');
  const entries = source.split(/\s*;\s*/).filter(Boolean);
  const records = entries.map(entry => {
    const match = entry.match(/^(EVAL-[A-Z0-9]+(?:-[A-Z0-9]+)+)\s+\((shadow|advisory|blocking|mechanical),\s*(pass|fail|blocked|not run),\s*(docs\/evals\/[A-Za-z0-9._/-]+\.md#[a-z0-9-]+)\)$/);
    if (!match) throw new Error('Selected eval records must use: EVAL-ID (authority, result, docs/evals/file.md#eval-id); ...');
    return { id: match[1], authority: match[2], result: match[3], evidence: match[4] };
  });
  if (!records.length || new Set(records.map(record => record.id)).size !== records.length) throw new Error('Selected eval records require unique EVAL IDs.');
  return records;
}

function selectedSignature(records) {
  return records.map(record => `${record.id}|${record.authority}|${record.result}|${record.evidence}`).sort().join(';');
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
    ? fs.readdirSync(evalDir).filter(name => name.endsWith('.md') && !/(?:template|scorecard)/i.test(name)).map(name => ({ name, source: fs.readFileSync(path.join(evalDir, name), 'utf8') }))
    : [];
  const records = sources.flatMap(file => parseEvalRecords(file.source).map(record => ({ ...record, file: file.name })));
  const byId = new Map();
  for (const record of records) {
    validateRecord(record);
    if (byId.has(record.id)) throw new Error(`Eval IDs must be unique; duplicate ${record.id}.`);
    byId.set(record.id, record);
  }
  const canonical = parseSelectedEvalRecords(fieldValue(sections(markdown, 'Verification Checkpoint').at(-1), 'Selected eval records'));
  for (const selectedRecord of canonical) {
    const { id, authority, result, evidence } = selectedRecord;
    const record = byId.get(id);
    if (!record) throw new Error(`Selected eval ${id} has no repo-local record under docs/evals/.`);
    if (record.fields.Authority !== authority) throw new Error(`Selected eval ${id} authority ${authority} does not match its record authority ${record.fields.Authority}.`);
    if (record.fields['Latest result'] !== result) throw new Error(`Selected eval ${id} result ${result} does not match its record result ${record.fields['Latest result']}.`);
    const expectedEvidence = `docs/evals/${record.file}#${id.toLowerCase()}`;
    if (evidence !== expectedEvidence) throw new Error(`Selected eval ${id} evidence ${evidence} does not match its record evidence ${expectedEvidence}.`);
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
