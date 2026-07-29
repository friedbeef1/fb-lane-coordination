'use strict';

const fs = require('node:fs');
const path = require('node:path');

function files(root) {
  const found = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      if (entry.isFile()) found.push({
        path: path.relative(root, absolute).split(path.sep).join('/'),
        text: fs.readFileSync(absolute, 'utf8'),
      });
    }
  }
  visit(root);
  return found;
}

function grade(root, definition) {
  const all = files(root);
  const criteria = definition.criteria.map(criterion => {
    const matching = all.filter(file => new RegExp(criterion.path).test(file.path));
    const patterns = criterion.every || [criterion.pattern];
    const pass = patterns.every(pattern => matching.some(file => new RegExp(pattern, 'm').test(file.text)));
    return {id: criterion.id, pass, evidence: pass ? matching.map(file => file.path).slice(0, 4) : []};
  });
  const passed = criteria.filter(criterion => criterion.pass).length;
  return {criteria, passed, total: criteria.length, readiness: passed / criteria.length, pass: passed === criteria.length};
}

module.exports = {grade};
