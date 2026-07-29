'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'active-video-policy', path: '^ios-native/Unmirror/CameraController\\.swift$', every: ['CameraConnectionPolicy', 'isActive', 'hasVideoInput']},
  {id: 'preview-uses-policy', path: '^ios-native/Unmirror/CameraController\\.swift$', every: ['CameraPreview', 'canConfigureMirroring', 'isVideoMirroringSupported']},
  {id: 'policy-regression-test', path: '^ios-native/UnmirrorTests/AppStateTests\\.swift$', every: ['testMirroringWaitsForAnActiveVideoConnection', 'CameraConnectionPolicy\\.canConfigureMirroring']},
]});
