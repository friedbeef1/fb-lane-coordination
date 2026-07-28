const {grade} = require('./_shared.cjs');
exports.grade = root => grade(root, {criteria: [
  {id:'android-client', path:'^android-native/.*\\.(kt|java)$', every:['Analytics(Client|Event)','(setEnabled|optOut|enabled)','(tokenPresent|POSTHOG_TOKEN)']},
  {id:'ios-client', path:'^ios-native/.*\\.swift$', every:['Analytics(Client|Event)','(setEnabled|optOut|enabled)','(tokenPresent|token)']},
  {id:'safe-failure', path:'^(android-native|ios-native)/', pattern:'(runCatching|try\\?|catch)'},
  {id:'privacy-tests', path:'(test|Test|spec)', every:['(analytics|Analytics)','(disabled|optOut|missing token|tokenPresent)']},
], blockers:[
  {id:'person-profiles', path:'^(android-native|ios-native)/', pattern:'PersonProfiles\\.(ALWAYS|IDENTIFIED_ONLY)'},
]});
