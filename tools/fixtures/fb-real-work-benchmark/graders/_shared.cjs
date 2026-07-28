const fs = require('node:fs');
const path = require('node:path');

function files(root) {
  const output = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) output.push({
        path: path.relative(root, absolute).split(path.sep).join('/'),
        text: fs.readFileSync(absolute).toString('utf8'),
      });
    }
  }
  visit(root);
  return output;
}

function grade(root, definition) {
  const all = files(root);
  const criteria = definition.criteria.map(criterion => {
    const matching = all.filter(file => new RegExp(criterion.path).test(file.path));
    const pass = criterion.every
      ? criterion.every.every(pattern => matching.some(file => new RegExp(pattern, 'm').test(file.text)))
      : matching.some(file => new RegExp(criterion.pattern, 'm').test(file.text));
    return {id: criterion.id, pass, evidence: pass ? matching.map(file => file.path).slice(0, 4) : []};
  });
  const blockers = (definition.blockers || []).map(blocker => ({
    id: blocker.id,
    triggered: all.some(file => new RegExp(blocker.path).test(file.path) && new RegExp(blocker.pattern, 'm').test(file.text)),
  }));
  const passed = criteria.filter(row => row.pass).length;
  return {
    criteria,
    blockers,
    passed,
    total: criteria.length,
    readiness: criteria.length ? passed / criteria.length : 0,
    pass: passed === criteria.length && blockers.every(row => !row.triggered),
  };
}

module.exports = {grade};
