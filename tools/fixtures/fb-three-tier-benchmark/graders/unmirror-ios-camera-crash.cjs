'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'active-video-policy', path: '^ios-native/Unmirror/CameraController\\.swift$', subchecks: [
    {id: 'isolated-mirroring-policy', any: ['CameraConnectionPolicy', 'MirroringConnectionPolicy', 'canConfigureMirroring', 'shouldConfigureMirroring'], weight: 15},
    {id: 'requires-active-connection', any: ['isActive', 'connection\\.isActive'], weight: 15},
    {id: 'requires-video-input', any: ['hasVideoInput', 'inputPorts[^\\n]*mediaType\\s*==\\s*\\.video'], weight: 15},
  ]},
  {id: 'preview-uses-policy', path: '^ios-native/Unmirror/CameraController\\.swift$', subchecks: [
    {id: 'preview-connection-guard', every: ['previewLayer\\.connection'], any: ['canConfigureMirroring', 'shouldConfigureMirroring', 'isMirroringSafe'], weight: 15},
    {id: 'capability-after-policy', any: ['isVideoMirroringSupported'], weight: 10},
    {id: 'preserves-mirror-assignment', any: ['isVideoMirrored\\s*=\\s*mirrored', 'isVideoMirrored\\s*=\\s*self\\.previewIsMirrored'], weight: 10},
  ]},
  {id: 'policy-regression-test', path: '^ios-native/UnmirrorTests/.*\\.swift$', subchecks: [
    {id: 'inactive-case', every: ['isActive:\\s*false', 'XCTAssertFalse'], weight: 10},
    {id: 'non-video-case', every: ['hasVideoInput:\\s*false', 'XCTAssertFalse'], weight: 5},
    {id: 'active-video-case', every: ['isActive:\\s*true', 'hasVideoInput:\\s*true', 'XCTAssertTrue'], weight: 5},
  ]},
]});
