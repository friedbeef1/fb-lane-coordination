#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { validateAffectedRecords } = require('./fb-records.cjs');

function markdownProse(markdown) {
  const withoutComments = markdown.replace(/<!--[\s\S]*?-->/g, '');
  let fence = null;
  return withoutComments.split(/\r?\n/).map(line => {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      return '';
    }
    if (marker) {
      fence = marker[1];
      return '';
    }
    return line.replace(/(`+)([^`]|(?!\1)`)*?\1/g, '');
  }).join('\n');
}

function headingAnchors(markdown) {
  const anchors = new Set();
  const seen = new Map();
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!heading) continue;
    const slug = heading[1].replace(/<[^>]*>/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s/g, '-');
    const count = seen.get(slug) || 0;
    seen.set(slug, count + 1);
    anchors.add(count ? `${slug}-${count}` : slug);
  }
  for (const match of markdown.matchAll(/<(?:a|span)\s+(?:[^>]*?\s)?(?:id|name)=["']([^"']+)["'][^>]*>/gi)) anchors.add(match[1]);
  return anchors;
}

function markdownLinks(markdown) {
  const links = [];
  for (const match of markdown.matchAll(/!?\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\s*\)/g)) {
    links.push(match[1].replace(/^<|>$/g, ''));
  }
  for (const match of markdown.matchAll(/^\s{0,3}\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm)) {
    links.push(match[1].replace(/^<|>$/g, ''));
  }
  return links;
}

function validateDocuments(root, selectedPaths) {
  const findings = [];
  const workspace = path.resolve(root);
  const workspaceReal = fs.realpathSync(workspace);
  const within = file => file === workspaceReal || file.startsWith(`${workspaceReal}${path.sep}`);
  const safePaths = [];
  for (const relative of selectedPaths) {
    const file = path.resolve(workspace, relative);
    if ((file !== workspace && !file.startsWith(`${workspace}${path.sep}`))
      || (fs.existsSync(file) && !within(fs.realpathSync(file)))) {
      findings.push(`${relative}: path leaves repository`);
    } else {
      safePaths.push(relative);
    }
  }
  if (safePaths.some(file => file === 'PROJECT_BOARD.md' || /^docs\/(?:handoffs|workstreams)\/[^/]+\.md$/.test(file))) {
    findings.push(...validateAffectedRecords(workspace, safePaths).map(finding => `${finding.file}: ${finding.message}`));
  }
  for (const relative of safePaths) {
    if (!/\.md$/i.test(relative)) continue;
    const file = path.resolve(workspace, relative);
    if (!fs.existsSync(file)) continue; // A selected deletion has no document body to inspect.
    const source = fs.readFileSync(file, 'utf8');
    const prose = markdownProse(source);
    if (/(?:[ \t]+\r?$)/m.test(source)) findings.push(`${relative}: trailing whitespace`);
    if (/^(?:<<<<<<< |=======\s*$|>>>>>>> )/m.test(source)) findings.push(`${relative}: conflict marker`);
    if (/^docs\/handoffs\/[^/]+\.md$/.test(relative)) {
      const declaredTask = source.match(/^task:\s*(\S+)\s*$/m)?.[1];
      const filenameTask = path.basename(relative, '.md');
      if (declaredTask && declaredTask !== filenameTask) findings.push(`${relative}: task ID does not match filename`);
      if (/^record_model:\s*normalized-v1\s*$/m.test(source) && !declaredTask) findings.push(`${relative}: normalized handoff requires a task ID`);
    }
    for (const href of markdownLinks(prose)) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) continue;
      let decoded;
      try { decoded = decodeURIComponent(href); } catch { findings.push(`${relative}: invalid link encoding ${href}`); continue; }
      const [targetPath, fragment] = decoded.split('#', 2);
      const target = !targetPath ? file : targetPath.startsWith('/')
        ? path.resolve(workspace, `.${targetPath}`)
        : path.resolve(path.dirname(file), targetPath);
      if (target !== workspace && !target.startsWith(`${workspace}${path.sep}`)) {
        findings.push(`${relative}: link leaves repository ${href}`);
        continue;
      }
      if (!fs.existsSync(target)) {
        findings.push(`${relative}: broken link ${href}`);
        continue;
      }
      if (!within(fs.realpathSync(target))) {
        findings.push(`${relative}: link leaves repository ${href}`);
        continue;
      }
      if (fragment && target.endsWith('.md') && !headingAnchors(markdownProse(fs.readFileSync(target, 'utf8'))).has(fragment)) {
        findings.push(`${relative}: broken anchor ${href}`);
      }
    }
  }
  return findings;
}

if (require.main === module) {
  const findings = validateDocuments(process.cwd(), process.argv.slice(2));
  if (findings.length) {
    process.stderr.write(`${findings.join('\n')}\n`);
    process.exitCode = 1;
  }
}

module.exports = { validateDocuments };
