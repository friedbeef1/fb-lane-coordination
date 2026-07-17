#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PACKAGE_PREFIX = 'plugins/fb-lane-coordination';

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

function loadManifest(repoRoot) {
  const root = path.resolve(repoRoot);
  const manifestPath = path.join(root, 'tools', 'fb-package-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(manifest)) throw new Error('Package manifest must be an array of canonical root paths.');
  const sources = new Set();
  const targets = new Set();
  for (const source of manifest) {
    if (typeof source !== 'string' || !source.trim()) throw new Error('Every package manifest entry must be a non-empty string.');
    if (path.isAbsolute(source) || path.win32.isAbsolute(source)) throw new Error(`Absolute manifest path is not allowed: ${source}`);
    const segments = source.split(/[\\/]/);
    if (segments.includes('..')) throw new Error(`Manifest path must not contain ..: ${source}`);
    if (source.includes('\\')) throw new Error(`Manifest paths must use forward slashes: ${source}`);
    if (source === PACKAGE_PREFIX || source.startsWith(`${PACKAGE_PREFIX}/`)) throw new Error(`Manifest source must be in the canonical root: ${source}`);
    const sourcePath = path.resolve(root, source);
    const target = `${PACKAGE_PREFIX}/${source}`;
    const targetPath = path.resolve(root, target);
    const packageRoot = path.resolve(root, PACKAGE_PREFIX);
    if (!isInside(root, sourcePath) || !isInside(packageRoot, targetPath)) throw new Error(`Generated target is outside ${PACKAGE_PREFIX}: ${target}`);
    if (sources.has(source)) throw new Error(`Duplicate manifest source: ${source}`);
    if (targets.has(target)) throw new Error(`Duplicate manifest target: ${target}`);
    sources.add(source);
    targets.add(target);
  }
  return [...sources];
}

function atomicWrite(target, contents, mode) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`);
  try {
    fs.writeFileSync(temporary, contents);
    fs.chmodSync(temporary, mode & 0o777);
    fs.renameSync(temporary, target);
  } finally {
    try { fs.unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

function filesBelow(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesBelow(candidate));
    else if (entry.isFile()) files.push(candidate);
  }
  return files;
}

function assertNoSymlink(root, candidate) {
  const relative = path.relative(root, candidate);
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) break;
    if (fs.lstatSync(current).isSymbolicLink()) {
      throw new Error(`Package synchronization refuses symbolic link path: ${path.relative(root, current)}`);
    }
  }
}

function syncPackage(repoRoot, options = {}) {
  const root = path.resolve(repoRoot);
  const write = options.write === true;
  const checked = [];
  const drift = [];
  const sources = loadManifest(root);
  const declaredTargets = new Set(sources.map(source => `${PACKAGE_PREFIX}/${source}`));
  for (const source of sources) {
    const sourcePath = path.join(root, source);
    const target = `${PACKAGE_PREFIX}/${source}`;
    const targetPath = path.join(root, target);
    assertNoSymlink(root, sourcePath);
    assertNoSymlink(root, targetPath);
    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) throw new Error(`Canonical package source is missing: ${source}`);
    const contents = fs.readFileSync(sourcePath);
    const sourceMode = fs.statSync(sourcePath).mode & 0o777;
    checked.push(target);
    const exists = fs.existsSync(targetPath);
    const differs = !exists
      || !fs.readFileSync(targetPath).equals(contents)
      || (fs.statSync(targetPath).mode & 0o777) !== sourceMode;
    if (differs && write) atomicWrite(targetPath, contents, sourceMode);
    if (differs && !write) drift.push(`${exists ? 'changed' : 'missing'}: ${target}`);
  }
  if (!write) {
    for (const managed of ['tools', 'docs/fb', 'docs/evidence']) {
      const targetRoot = path.join(root, PACKAGE_PREFIX, managed);
      for (const targetPath of filesBelow(targetRoot)) {
        const target = path.relative(root, targetPath).split(path.sep).join('/');
        const source = target.slice(`${PACKAGE_PREFIX}/`.length);
        if (!declaredTargets.has(target) && fs.existsSync(path.join(root, source))) {
          drift.push(`extra: ${target}`);
        }
      }
    }
  }
  return { checked, drift };
}

function main() {
  const mode = process.argv[2];
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    console.error('Usage: node tools/fb-package-sync.cjs --write|--check');
    process.exitCode = 2;
    return;
  }
  try {
    const result = syncPackage(process.cwd(), { write: mode === '--write' });
    if (mode === '--check' && result.drift.length) {
      process.stdout.write(`${result.drift.join('\n')}\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`${mode === '--write' ? 'Synchronized' : 'Checked'} ${result.checked.length} package mirrors.\n`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) main();
module.exports = { loadManifest, syncPackage };
