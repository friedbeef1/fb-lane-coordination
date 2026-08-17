'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relative) {
  let target = path.join(root, relative);
  const packagePrefix = 'plugins/fb-lane-coordination/';
  if (!fs.existsSync(target) && relative.startsWith(packagePrefix)) {
    target = path.join(root, relative.slice(packagePrefix.length));
  }
  return fs.readFileSync(target, 'utf8');
}

function assertDiscoverySkill() {
  const skill = read('plugins/fb-lane-coordination/skills/fb-discovery/SKILL.md');
  assert.match(skill, /reduces uncertainty[\s\S]{0,220}planning\/evidence[\s\S]{0,220}smallest decision-changing unknown/i);
  assert.match(skill, /must not implement source, present speculation as evidence, or set[\s\S]{0,40}final Product priority/i);
  assert.match(skill, /Research the smallest decision-changing unknown[\s\S]*Gather the smallest useful research, experiment, competitor, opportunity, or[\s\S]*Compare evidence[\s\S]*Create or update `docs\/handoffs\/<TASK-ID>\.md`/i);
  assert.match(skill, /Do not mark a[\s\S]{0,80}hypothesis or an unrun experiment ready as if it were a finding/i);
  assert.match(skill, /lane:\s*fb-discovery[\s\S]{0,80}status:\s*ready/i);
}

function assertBugsSkill() {
  const skill = read('plugins/fb-lane-coordination/skills/fb-bugs/SKILL.md');
  assert.match(skill, /ready[\s\S]{0,80}requires observable reproduction evidence/i);
  assert.match(skill, /Record environment[\s\S]*minimal steps[\s\S]*expected behavior[\s\S]*actual[\s\S]*affected users[\s\S]*severity/i);
  assert.match(skill, /Set `status: ready` only when[\s\S]{0,180}observable reproduction[\s\S]{0,120}severity[\s\S]{0,120}affected users[\s\S]{0,120}regression or verification evidence/i);
  assert.match(skill, /Otherwise[\s\S]{0,60}status: blocked[\s\S]{0,80}missing evidence/i);
  assert.match(skill, /lane:\s*fb-bugs[\s\S]{0,80}status:\s*ready/i);
}

function assertProductEvidenceBoundary() {
  const skill = read('plugins/fb-lane-coordination/skills/fb-product/SKILL.md');
  assert.match(skill, /Product inference and assumptions are not user evidence[\s\S]{0,80}label them as[\s\S]{0,20}assumptions/i);
  assert.match(skill, /Actual user evidence requires observed or recorded user input/i);
  assert.match(skill, /never fabricate or impersonate user feedback/i);
  assert.match(skill, /same update that creates a non-quick board task after reconciliation[\s\S]{0,180}copy the reconciled Project\/Build Brief goal[\s\S]{0,180}complete board[\s\S]{0,40}Goal Alignment Session/i);
  assert.match(skill, /Ready handoffs are Product intake[\s\S]{0,80}not approvals/i);
  assert.match(skill, /After invocation[\s\S]{0,240}without a routine second approval/i);
  assert.match(skill, /no approved goal[\s\S]{0,80}block the task instead of inventing one/i);
}

function assertAutomaticLocalVerification() {
  const bfm = read('plugins/fb-lane-coordination/skills/bfm/SKILL.md');
  const evidence = read('plugins/fb-lane-coordination/docs/fb/evidence.md');
  assert.match(
    bfm,
    /run every safe[\s\S]{0,100}locally executable[\s\S]{0,120}(?:test|check)[\s\S]{0,160}automatically/i,
    'BFM must automatically run every safe locally executable check'
  );
  assert.match(
    evidence,
    /do not ask the user to run[\s\S]{0,100}routine[\s\S]{0,100}(?:test|check)/i,
    'evidence guidance must forbid delegating routine checks to the user'
  );
  assert.match(
    evidence,
    /physical device[\s\S]{0,180}(?:credential|account)[\s\S]{0,180}(?:payment|provider)[\s\S]{0,180}subjective[\s\S]{0,180}(?:live|release) approval/i,
    'the rule must retain genuine physical, access, sensitive, subjective, and release boundaries'
  );
}

function assertConversationExecutionAuthority() {
  const guardrails = read('plugins/fb-lane-coordination/docs/fb/guardrails.md');
  const prose = guardrails.replace(/^>\s?/gm, '');
  const flat = prose.replace(/\s+/g, ' ');
  const heading = /## Execution authority by conversation context/i;
  assert.match(guardrails, heading, 'guardrails must own the canonical conversation authority contract');

  for (const row of [
    /Product\/BFM parent thread\s*\|\s*Sequence and execute approved work/i,
    /Workstream parent thread\s*\|\s*Planning and Product\/BFM handoff only/i,
    /Side conversation\s*\|\s*Discussion and paste-ready parent handoff only/i,
    /Confirmed one-off sidechat exception\s*\|\s*Execute only the explicitly confirmed task/i
  ]) assert.match(guardrails, row);

  for (const phrase of ['`Proceed`', '`do it`', '`merge it`', '`install it`']) assert.match(guardrails, new RegExp(phrase, 'i'));
  assert.match(guardrails, /do not authorize sidechat[\s\S]{0,20}mutation/i);
  assert.ok(flat.includes('This is a side conversation. Do you want me to execute [named scope] here as a one-off exception rather than hand it to the parent Product/BFM thread?'));
  assert.ok(flat.includes('The exception is consumed after that task; a later sidechat task requires a new confirmation.'));
  assert.ok(flat.includes('Read-only inspection, explanation, and paste-ready handoffs remain allowed.'));
  for (const gate of ['live-release', 'provider-state', 'privacy', 'payment', 'destructive-operation', 'lock-conflict', 'physical-device']) {
    assert.match(guardrails, new RegExp(gate, 'i'), `sidechat exceptions must preserve the ${gate} gate`);
  }

  for (const name of ['bfm', 'fb-product', 'fb-business', 'fb-design', 'fb-tech', 'fb-discovery', 'fb-bugs', 'fb-lane-coordination']) {
    const skill = read(`plugins/fb-lane-coordination/skills/${name}/SKILL.md`);
    assert.match(
      skill,
      /docs\/fb\/guardrails\.md#execution-authority-by-conversation-context/i,
      `${name} must route execution authority to the canonical guardrails section`
    );
  }
}

const SIX = /User[\s\S]*Business[\s\S]*Design[\s\S]*Tech[\s\S]*Discovery[\s\S]*Bugs/i;
const MINI_LOOP = /mini-loop/i;
const HANDOFF = /docs\/handoffs\/<TASK-ID>\.md|ready handoffs?/i;

function assertAlignedSkills() {
  const files = [
    'plugins/fb-lane-coordination/skills/fb-product/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-business/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-design/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-tech/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane-coordination/SKILL.md',
    'plugins/fb-lane-coordination/skills/fb-lane/SKILL.md',
    'plugins/fb-lane-coordination/skills/bfm/SKILL.md',
    'plugins/fb-lane-coordination/skills/project-coordination-setup/SKILL.md'
  ];
  for (const file of files) {
    const skill = read(file);
    assert.match(skill, SIX, `${file} must name the six workstreams in canonical order`);
    assert.match(skill, /Product\/BFM[\s\S]{0,40}control\s+centre/i, `${file} must route delivery to Product/BFM`);
    assert.match(skill, MINI_LOOP, `${file} must use the mini-loop contract`);
    assert.match(skill, HANDOFF, `${file} must route durable work through handoffs`);
    assert.match(skill, /Ready to\s+ship/i, `${file} must stop delivery at Ready to ship`);
    assert.match(skill, /Push Live/i, `${file} must reserve merge and deployment for Push Live`);
  }

  const bfm = read('plugins/fb-lane-coordination/skills/bfm/SKILL.md');
  assert.match(bfm, /freezeBfmIntake/);
  assert.match(bfm, /renderBfmIntakeLedger/);
  assert.match(bfm, /require\(['"]\.\/tools\/fb-lane\.cjs['"]\)/);
  assert.match(bfm, /canonical checkout/i);
  assert.match(bfm, /complete intake ledger/i);
  assert.match(bfm, /routing[\s\S]{0,80}(fail|persist)/i);
  assert.match(bfm, /None\s+relevant/);
  assert.match(bfm, /duplicate|contradict/i);
  assert.match(bfm, /ready for Product intake[\s\S]{0,120}not approval or execution authority/i);
  assert.match(bfm, /After\s+`\$bfm`[\s\S]{0,120}Product records the dispositioned Project Start Brief and Build Brief/i);
  assert.match(bfm, /do not require those briefs to preexist invocation or request routine\s+second\s+approval/i);
  assert.match(bfm, /Before source changes[\s\S]{0,120}Goal Alignment[\s\S]{0,40}Session to match the reconciled briefs/i);
  assert.match(bfm, /Never invent an OKR merely to clear\s+the\s+gate/i);
  assert.doesNotMatch(bfm, /re-?implement (?:the )?(?:intake|scanner|checkout-discovery) (?:runtime|logic)/i);
}

assertDiscoverySkill();
assertBugsSkill();
assertProductEvidenceBoundary();
assertAutomaticLocalVerification();
assertConversationExecutionAuthority();
assertAlignedSkills();
console.log('six-workstream skill behavior contract passed');
