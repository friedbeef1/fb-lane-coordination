const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function safeRunId(value) {
  if (!/^[a-z0-9-]+$/.test(value)) throw new Error(`Unsafe run id: ${value}`);
}

function number(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function usageFrom(value) {
  if (!value || typeof value !== 'object') return null;
  const candidates = [value.usage, value.token_usage, value.tokenUsage];
  for (const usage of candidates) {
    if (!usage || typeof usage !== 'object') continue;
    const inputTokens = number(usage.input_tokens ?? usage.inputTokens);
    const cachedInputTokens = number(
      usage.cached_input_tokens ?? usage.cachedInputTokens ??
      usage.input_tokens_details?.cached_tokens,
    );
    const outputTokens = number(usage.output_tokens ?? usage.outputTokens);
    const totalTokens = number(usage.total_tokens ?? usage.totalTokens) ||
      inputTokens + outputTokens;
    if (inputTokens || cachedInputTokens || outputTokens || totalTokens) {
      return {inputTokens, cachedInputTokens, outputTokens, totalTokens, authoritative: true};
    }
  }
  return null;
}

function parseCodexJsonl(text) {
  const events = [];
  let sessionId = null;
  let usage = null;
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      throw new Error(`Malformed Codex JSONL at line ${index + 1}`);
    }
    events.push(event);
    const eventSessionId = event.thread_id || event.threadId || event.session_id ||
      event.sessionId || (event.id && /thread|session/.test(event.type || '') ? event.id : null);
    sessionId ||= eventSessionId;
    const direct = usageFrom(event);
    const nested = usageFrom(event.response) || usageFrom(event.result) || usageFrom(event.item);
    if (direct || nested) usage = direct || nested;
  }
  return {
    sessionId,
    usage: usage || {
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      authoritative: false,
    },
    events,
  };
}

function redactEvents(events) {
  const forbidden = /(prompt|message|content|text|reasoning|environment|transcript)/i;
  return events.map((event, index) => {
    const type = String(event.type || event.event || 'unknown');
    const usage = usageFrom(event) || usageFrom(event.response) || usageFrom(event.result);
    const curated = {sequence: index + 1, type};
    if (event.timestamp && !forbidden.test(String(event.timestamp))) curated.timestamp = event.timestamp;
    if (event.status) curated.status = String(event.status);
    if (usage) curated.usage = usage;
    return curated;
  });
}

function hashTree(root) {
  const hash = crypto.createHash('sha256');
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === '.benchmark-input') continue;
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        hash.update(relative);
        hash.update('\0');
        hash.update(fs.readFileSync(absolute));
        hash.update('\0');
      }
    }
  }
  visit(root);
  return hash.digest('hex');
}

function isolatedHome(sourceHome) {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-real-work-codex-home-'));
  const authSource = path.join(sourceHome || process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'auth.json');
  if (fs.existsSync(authSource)) fs.copyFileSync(authSource, path.join(target, 'auth.json'), fs.constants.COPYFILE_EXCL);
  return target;
}

function execute(command, args, prompt, options) {
  return new Promise(resolve => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 1000).unref();
    }, options.timeoutMs);
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', code => {
      clearTimeout(timer);
      resolve({code, stdout, stderr, timedOut});
    });
    child.stdin.end(prompt);
  });
}

async function runFirstPass(config) {
  safeRunId(config.runId);
  const fixture = path.resolve(config.fixtureDir);
  const allowedRoot = path.resolve(config.allowedRoot || path.dirname(fixture));
  if (fixture !== allowedRoot && !fixture.startsWith(`${allowedRoot}${path.sep}`)) {
    throw new Error('Run directory escapes allowed root');
  }
  const home = isolatedHome(config.codexHomeSource);
  const command = config.command || 'codex';
  const prefix = config.commandPrefix || [];
  const args = config.commandArgs || [
    'exec', '--json', '--ignore-user-config', '--sandbox', 'workspace-write',
    '-C', fixture, '-',
  ];
  const startedAt = new Date().toISOString();
  const start = process.hrtime.bigint();
  try {
    const result = await execute(command, [...prefix, ...args], config.prompt, {
      cwd: fixture,
      env: {...process.env, CODEX_HOME: home, ...(config.env || {})},
      timeoutMs: config.timeoutMs || 20 * 60 * 1000,
    });
    const finishedAt = new Date().toISOString();
    const wallTimeMs = Number((process.hrtime.bigint() - start) / 1000000n);
    if (result.timedOut) {
      return {runId:config.runId, taskId:config.taskId, arm:config.arm, startedAt, finishedAt,
        wallTimeMs, exitCode:null, timedOut:true, sessionId:null,
        usage:{inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0,authoritative:false},
        curatedEvents:[], candidateSha256:hashTree(fixture), stderrSha256:sha256(result.stderr)};
    }
    const parsed = parseCodexJsonl(result.stdout);
    return {
      runId: config.runId,
      taskId: config.taskId,
      arm: config.arm,
      startedAt,
      finishedAt,
      wallTimeMs,
      exitCode: result.code,
      timedOut: false,
      sessionId: parsed.sessionId,
      usage: parsed.usage,
      curatedEvents: redactEvents(parsed.events),
      candidateSha256: hashTree(fixture),
      stdoutSha256: sha256(result.stdout),
      stderrSha256: sha256(result.stderr),
      repairCount: 0,
      _rawOutput: result.stdout,
      _stderr: result.stderr,
      _config: {...config, codexHome: home},
    };
  } catch (error) {
    fs.rmSync(home, {recursive:true, force:true});
    throw error;
  }
}

async function runRepair(firstPass, failurePacket) {
  if (!firstPass.sessionId) throw new Error('Cannot repair without a session id');
  if (firstPass.repairCount) throw new Error('Second repair is not allowed');
  if (failurePacket.passed) throw new Error('Cannot repair a passing candidate');
  const config = firstPass._config;
  const prompt = [
    'ONE CONSOLIDATED REPAIR IS REQUIRED.',
    '',
    'Failed public checks:',
    ...(failurePacket.failedPublicChecks || []).map(value => `- ${value}`),
    '',
    `Observed result: ${failurePacket.observedOutput || 'The focused proof failed.'}`,
    '',
    'Required acceptance:',
    ...(failurePacket.requiredAcceptance || []).map(value => `- ${value}`),
    '',
    'Make the smallest source correction now, rerun only the failed proof, and stop.',
  ].join('\n');
  const command = config.command || 'codex';
  const prefix = config.commandPrefix || [];
  const args = config.repairCommandArgs || [
    'exec', 'resume', '--json', '--ignore-user-config',
    '--skip-git-repo-check', '-m', 'gpt-5.4',
    '-c', 'sandbox_mode="workspace-write"', firstPass.sessionId, '-',
  ];
  const startedAt = new Date().toISOString();
  const start = process.hrtime.bigint();
  const result = await execute(command, [...prefix, ...args], prompt, {
    cwd: config.fixtureDir,
    env: {...process.env, CODEX_HOME:firstPass._config.codexHome, ...(config.env || {})},
    timeoutMs: config.repairTimeoutMs || 10 * 60 * 1000,
  });
  const parsed = result.timedOut ? {sessionId:firstPass.sessionId, usage:{
    inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0,authoritative:false},events:[]} :
    parseCodexJsonl(result.stdout);
  return {
    ...firstPass,
    repairCount: 1,
    repair: {
      startedAt,
      finishedAt: new Date().toISOString(),
      wallTimeMs: Number((process.hrtime.bigint() - start) / 1000000n),
      exitCode: result.timedOut ? null : result.code,
      timedOut: result.timedOut,
      usage: parsed.usage,
      curatedEvents: redactEvents(parsed.events),
      candidateSha256: hashTree(config.fixtureDir),
      stdoutSha256: sha256(result.stdout),
      stderrSha256: sha256(result.stderr),
      _stderr: result.stderr,
      _rawOutput: result.stdout,
    },
  };
}

function publicEvidence(evidence) {
  const copy = JSON.parse(JSON.stringify(evidence));
  delete copy._rawOutput;
  delete copy._stderr;
  delete copy._config;
  if (copy.repair) {
    delete copy.repair._stderr;
    delete copy.repair._rawOutput;
  }
  return copy;
}

module.exports = {
  parseCodexJsonl,
  publicEvidence,
  redactEvents,
  runFirstPass,
  runRepair,
};
