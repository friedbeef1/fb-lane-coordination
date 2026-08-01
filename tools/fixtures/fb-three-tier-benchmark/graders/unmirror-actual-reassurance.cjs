'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'web-reassurance-copy', path: '^src/components/ActualReassurance\\.tsx$', every: ['A quick heads-up', 'Continue to camera']},
  {id: 'web-local-reminder', path: '^src/App\\.tsx$', every: ['unmirror\\.actualViewReminder\\.v1', 'isActualReassuranceVisible']},
  {id: 'android-route', path: '^android-native/app/src/main/java/.*/(AppState|MainActivity)\\.kt$', every: ['ActualReassurance', 'onPermissionResult']},
  {id: 'android-route-tests', path: '^android-native/app/src/test/java/.*/MainActivityTest\\.kt$', every: ['ActualReassurance', 'launch_routesPermissionGrantThroughActualReassuranceBeforeCamera']},
]});
