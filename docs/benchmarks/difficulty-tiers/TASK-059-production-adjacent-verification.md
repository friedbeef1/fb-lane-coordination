# TASK-059 Production-Adjacent Verification

Date: 2026-07-29

This verification tests the accepted TASK-059 candidates beyond their static
graders. Each candidate was extracted into a clean temporary copy. No source
repository or stored benchmark checkpoint was changed.

## Results

| Tier / surface | Vanilla Codex | Efficient-Graph FB | What it proves |
|---|---|---|---|
| Easy / Web | 32/32 tests passed | 32/32 tests passed | Intro preference, invalid-value normalization, persistence, and existing Web behavior execute under the focused Vitest suite. |
| Easy / Android | Focused `MainActivityTest` build passed | Focused `MainActivityTest` build passed | The native Android implementation compiles with Java 21 and its focused unit test executes. |
| Medium / standalone app | Standalone verifier passed | Standalone verifier passed | The accepted MÉJA candidate satisfies the repository's local standalone verification. |
| Difficult / iOS simulator | 15/15 tests passed | 14/14 tests passed | Both native iOS candidates compile and their app-state, camera-policy, gallery, and responsive-layout tests execute on an iPhone simulator. |
| Difficult / physical-iPhone target | Unsigned device build passed | Unsigned device build passed | Both candidates compile for the connected arm64 iPhone target without changing signing or provisioning state. |
| Difficult / live camera and permissions | Not run | Not run | A signed install plus human use of the real camera and permission flow remains required. |

The different iOS test counts reflect the candidates' different but accepted
camera-policy APIs; both suites completed with zero failures.

## Commands

- Web: `npm test -- src/App.test.tsx --reporter=verbose`
- Android:
  `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
  ANDROID_HOME=/Users/jamesyeang/Library/Android/sdk ./gradlew
  testDebugUnitTest --tests ai.toughtalks.unmirror.MainActivityTest`
- Medium: `node scripts/verify-standalone.mjs`
- iOS simulator:
  `xcodebuild -project Unmirror.xcodeproj -scheme Unmirror -destination
  'platform=iOS Simulator,id=07983736-73A8-4B92-A4B4-3BDCD73B34A4'
  CODE_SIGNING_ALLOWED=NO test`
- Physical-iPhone target:
  `xcodebuild -project Unmirror.xcodeproj -scheme Unmirror -destination
  'platform=iOS,id=00008101-000324E21EE9003A' CODE_SIGNING_ALLOWED=NO build`

Separate derived-data directories were used for the two iOS arms.

## Harness limitation encountered

The historical Medium accepted archive did not contain
`scripts/secret-scan.mjs` or `scripts/test-secret-scan.mjs`, although its
standalone verifier imports them. The verification copies received those two
support scripts from the current recovered MÉJA repository solely to make the
historical verifier runnable. This is evidence of a historical fixture
packaging gap, not evidence that either candidate failed its product contract.

## Confidence

This evidence substantially raises confidence above static simulation:

- Easy is covered by executable Web and Android checks.
- Medium is covered by the repository's standalone verification, with the
  support-script limitation disclosed above.
- Difficult is covered by native iOS simulator tests and a successful
  physical-iPhone target compilation.

It still does not establish App Store, Play Store, production-provider, visual,
or real-camera readiness. The remaining high-value check is a signed install on
an iPhone followed by camera permission, preview mirroring, capture, save,
gallery, and deletion smoke testing.
