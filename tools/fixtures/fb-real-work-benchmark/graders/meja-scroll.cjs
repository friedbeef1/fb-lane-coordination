const {grade} = require('./_shared.cjs');
exports.grade = root => grade(root, {criteria: [
  {id:'host-scroll', path:'\\.css$', every:['app-main','overflow-y:\\s*auto']},
  {id:'pairing-contained', path:'\\.css$', every:['pairing-page','min-height:\\s*0|height:\\s*auto']},
  {id:'reachability-test', path:'(test|spec|scripts/)', every:['continueSetupOnLaptop','(host console does not allow vertical scrolling|Continue setup on laptop must be reachable)']},
]});
