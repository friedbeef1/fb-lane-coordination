const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const {FIXTURE_DIR} = require('./fb-real-work-benchmark-lib.cjs');

const definitions = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'prompts.json'), 'utf8'));

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}

function readPublicRecord(task, record) {
  const result = spawnSync(
    'git',
    ['-C', task.sourceRepo, 'show', `${task.startCommit}:${record}`],
    {encoding:'utf8', maxBuffer:16 * 1024 * 1024},
  );
  if (result.status !== 0) {
    return `# Public task note\n\nSource record \`${record}\` was not present in the starting tree.\n`;
  }
  return result.stdout;
}

function compilePublicFacts(task) {
  const definition = definitions[task.id];
  if (!definition) throw new Error(`Missing public facts: ${task.id}`);
  return {
    taskId: task.id,
    ...JSON.parse(JSON.stringify(definition)),
    recordLinks: task.publicRecords.map((_, index) => `.benchmark-input/record-${index + 1}.md`),
    rawRecords: task.publicRecords.map(record => ({path:record, content:readPublicRecord(task, record)})),
  };
}

function flattenFacts(value, prefix = '', output = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenFacts(item, `${prefix}[${index}]`, output));
  } else if (value && typeof value === 'object') {
    Object.keys(value).sort().forEach(key => flattenFacts(value[key], prefix ? `${prefix}.${key}` : key, output));
  } else {
    output.push(`${prefix}=${String(value)}`);
  }
  return output;
}

function rawBrief(facts) {
  return [
    `Objective\n${facts.objective}`,
    `Decisions\n${facts.relevantDecisions.map(value => `- ${value}`).join('\n')}`,
    `Assumptions\n${facts.assumptions.map(value => `- ${value}`).join('\n')}`,
    `New evidence\n${facts.changedEvidence.map(value => `- ${value}`).join('\n')}`,
    `Acceptance\n${facts.acceptanceCriteria.map(value => `- ${value}`).join('\n')}`,
    `Risks\n${facts.riskTriggers.length ? facts.riskTriggers.map(value => `- ${value}`).join('\n') : '- None declared'}`,
    `Required output\n${facts.requiredOutput}`,
    `Records\n${facts.recordLinks.map(value => `- ${value}`).join('\n')}`,
  ].join('\n\n');
}

function compileTreatment(arm, publicFacts) {
  if (!['vanilla', 'graph'].includes(arm)) throw new Error(`Unknown arm: ${arm}`);
  const publicFactsSha256 = hash(publicFacts);
  if (arm === 'vanilla') {
    return {
      arm,
      publicFactsSha256,
      graphPacket: null,
      prompt: [
        'Use ordinary Codex execution to complete this task. Do not use FB workflow terminology.',
        'The relevant raw historical task record follows. Reconcile it with the current source and implement the requested outcome.',
        ...publicFacts.rawRecords.map(record => `SOURCE RECORD: ${record.path}\n\n${record.content}`),
        `CURRENT REQUEST\n\n${publicFacts.objective}\n\nACCEPTANCE\n${publicFacts.acceptanceCriteria.map(value=>`- ${value}`).join('\n')}`,
        `REQUIRED OUTPUT\n${publicFacts.requiredOutput}`,
      ].join('\n\n'),
    };
  }
  const graphPacket = {
    objective: publicFacts.objective,
    relevantDecisions: publicFacts.relevantDecisions,
    assumptions: publicFacts.assumptions,
    changedEvidence: publicFacts.changedEvidence,
    acceptanceCriteria: publicFacts.acceptanceCriteria,
    riskTriggers: publicFacts.riskTriggers,
    requiredOutput: publicFacts.requiredOutput,
    recordLinks: publicFacts.recordLinks,
  };
  return {
    arm,
    publicFactsSha256,
    graphPacket,
    prompt: `Execute this preventive context packet. Use the smallest safe route selected by the task; do not add coordination ceremony.\n\n${rawBrief({taskId: publicFacts.taskId, ...graphPacket})}`,
  };
}

module.exports = {compilePublicFacts, compileTreatment, flattenFacts, hash};
