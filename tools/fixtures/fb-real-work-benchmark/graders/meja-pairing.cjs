const {grade} = require('./_shared.cjs');
exports.grade = root => grade(root, {criteria: [
  {id:'continuation', path:'\\.html$|\\.js$', every:['continueSetupOnLaptop','(sessionId|exactId)','(pairingMode|mode)']},
  {id:'subscription-gate', path:'\\.html$|\\.js$', every:['SUBSCRIBED','(track|presence)','(role|exactSession)']},
  {id:'bounded-retry', path:'\\.html$|\\.js$', every:['(Retry|retry)','setTimeout','clearTimeout']},
  {id:'connected-disconnected-tests', path:'(test|spec|scripts/)', every:['(connected|isConnected)','continueSetupOnLaptop','(presence|track)']},
]});
