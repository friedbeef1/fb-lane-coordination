const {grade} = require('./_shared.cjs');
exports.grade = root => grade(root, {criteria: [
  {id:'host-navigation', path:'\\.html$|\\.js$', every:['Host controls','People','Topics','Round','More']},
  {id:'audience-composition', path:'\\.html$|\\.js$', every:['(audience-live|audience.*composition)','(Speaker|Evaluator)','(timer|Timer)']},
  {id:'setup-navigation', path:'\\.html$|\\.js$', every:['Overview','Create Set','Library']},
  {id:'redesign-style', path:'(redesign\\.css|build-standalone)', pattern:'redesign\\.css|host-control-nav|audience-live'},
  {id:'contract-tests', path:'(test|spec|scripts/)', every:['(host|Host)','(audience|Audience)','(responsive|overflow|viewport)']},
]});
