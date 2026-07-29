'use strict';

const {grade} = require('./_shared.cjs');

exports.grade = root => grade(root, {criteria: [
  {id: 'active-video-policy', path: '^ios-native/Unmirror/CameraController\\.swift$', subchecks: [
    {id: 'isolated-mirroring-policy', any: ['CameraConnectionPolicy', 'MirroringConnectionPolicy', 'PreviewMirroringPolicy', 'canConfigureMirroring', 'shouldConfigureMirroring', 'shouldQueryMirroringSupport', 'mirroredState'], weight: 15},
    {id: 'requires-active-connection', any: ['isActive', 'isConnectionActive', 'connection\\.isActive'], weight: 15},
    {id: 'requires-video-input', any: ['hasVideoInput', 'mediaTypes\\.contains\\(\\.video\\)', 'inputPorts[^\\n]*mediaType\\s*==\\s*\\.video'], weight: 15},
  ]},
  {id: 'preview-uses-policy', path: '^ios-native/Unmirror/CameraController\\.swift$', subchecks: [
    {id: 'preview-connection-guard', every: ['previewLayer\\.connection'], any: ['canConfigureMirroring', 'shouldConfigureMirroring', 'isMirroringSafe', 'shouldQueryMirroringSupport', 'mirroredState', 'resolveMirroring'], weight: 15},
    {id: 'capability-after-policy', any: ['isVideoMirroringSupported'], weight: 10},
    {id: 'preserves-mirror-assignment', any: ['isVideoMirrored\\s*=\\s*mirrored', 'isVideoMirrored\\s*=\\s*self\\.previewIsMirrored'], weight: 10},
  ]},
  {id: 'policy-regression-test', path: '^ios-native/UnmirrorTests/.*\\.swift$', subchecks: [
    {id: 'inactive-case', every: ['XCTAssert(?:False|Nil)'], any: ['isActive:\\s*false', 'isConnectionActive:\\s*false'], weight: 10},
    {id: 'non-video-case', every: ['XCTAssert(?:False|Nil)'], any: ['hasVideoInput:\\s*false', 'mediaTypes:\\s*\\[\\.audio\\]'], weight: 5},
    {id: 'active-video-case', any: ['isActive:\\s*true[^}]*hasVideoInput:\\s*true', 'isConnectionActive:\\s*true[^}]*mediaTypes:\\s*\\[\\.video\\]'], weight: 5},
  ]},
]});
