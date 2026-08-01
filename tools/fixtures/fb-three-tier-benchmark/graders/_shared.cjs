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
  const subchecks = definition.criteria.flatMap(criterion => {
    const configured = criterion.subchecks || (criterion.every || [criterion.pattern]).map((pattern, index) => ({
      id: `${criterion.id}-${index + 1}`,
      pattern,
    }));
    return configured.map(subcheck => {
      const matching = all.filter(file => new RegExp(subcheck.path || criterion.path).test(file.path));
      const every = subcheck.every || (subcheck.pattern ? [subcheck.pattern] : []);
      const any = subcheck.any || [];
      const none = subcheck.none || [];
      const matches = pattern => matching.some(file => new RegExp(pattern, 'm').test(file.text));
      const pass = every.every(matches) &&
        (!any.length || any.some(matches)) &&
        none.every(pattern => !matches(pattern));
      return {
        id: subcheck.id,
        criterionId: criterion.id,
        pass,
        mustPass: subcheck.mustPass !== false,
        weight: subcheck.weight || 1,
        evidence: pass ? matching.map(file => file.path).slice(0, 4) : [],
      };
    });
  });
  const criteria = definition.criteria.map(criterion => {
    const scoped = subchecks.filter(subcheck => subcheck.criterionId === criterion.id);
    return {
      id: criterion.id,
      pass: scoped.filter(subcheck => subcheck.mustPass).every(subcheck => subcheck.pass),
      evidence: [...new Set(scoped.flatMap(subcheck => subcheck.evidence))].slice(0, 4),
      subchecks: scoped.map(subcheck => subcheck.id),
    };
  });
  const totalWeight = subchecks.reduce((sum, subcheck) => sum + subcheck.weight, 0);
  const earnedWeight = subchecks.filter(subcheck => subcheck.pass)
    .reduce((sum, subcheck) => sum + subcheck.weight, 0);
  const score = totalWeight ? Math.round((earnedWeight / totalWeight) * 10000) / 100 : 0;
  const passed = subchecks.filter(subcheck => subcheck.pass).length;
  return {
    criteria,
    subchecks,
    passed,
    total: subchecks.length,
    score,
    readiness: score / 100,
    pass: subchecks.filter(subcheck => subcheck.mustPass).every(subcheck => subcheck.pass),
  };
}

module.exports = {grade};
