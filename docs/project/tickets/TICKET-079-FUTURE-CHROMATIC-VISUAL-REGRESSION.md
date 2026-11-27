# TICKET-079 - Chromatic Visual Regression on Every Commit

**Type:** Tooling / Quality
**Priority:** Medium
**Status:** ⏳ Pending
**Related:** PM-079; TICKET-040, TICKET-074, TICKET-078
**Sprint:** Post-V1

## Description
Gate visual changes on every commit: the React Native Storybook stories delivered by
TICKET-040 become native visual tests, the Chromatic CLI builds the Storybook
`.app`/`.apk`, and Chromatic snapshots every story in its hosted iOS Simulator and
Android Emulator, diffing it against approved baselines and reporting the result on
the pull request. It is the commit-time visual regression gate that TICKET-078
(FullStory) cannot provide: FullStory replays real sessions, Chromatic blocks merges.

Only stories are covered. Screens and navigation flows are not; route-level visual
checks would need Maestro/Detox screenshots and stay out of scope.

## Requirements
### Prerequisites
- [ ] TICKET-040 closed with React Native Storybook **v9 or higher** (Chromatic's
      prerequisite) and with the light/dark and Spanish/English stories it already
      requires, because Chromatic has no modes API for React Native
- [ ] Reconcile TICKET-040's acceptance criterion *"no Storybook import is reachable
      from any `app/` route"* with Chromatic's documented entry point, which needs
      `app/_layout.tsx` to return `<StorybookUI />` when
      `EXPO_PUBLIC_STORYBOOK_ENABLED === "true"`; amend that ticket and prove the
      production export still excludes stories (or adopt the custom
      `--storybook-build-dir` route and document why)
- [ ] Create the Chromatic project as **React Native**, store `CHROMATIC_PROJECT_TOKEN`
      as a GitHub secret, and record the plan, the snapshot budget and who approves
      baselines

### Story setup
- [ ] Configure `.rnstorybook/index.ts` with `enableWebsockets`, `host`, `port`,
      `secured` and `onDeviceUI` read from `EXPO_PUBLIC_STORYBOOK_*` variables, as the
      Chromatic React Native setup requires
- [ ] Keep `EXPO_PUBLIC_STORYBOOK_ENABLED` out of every normal build and add it only to
      the Storybook build path and to the CI job
- [ ] Add a preview decorator with safe-area padding so stories are not hidden behind
      the status bar, and use the Storybook `delay` parameter for stories whose first
      frames are mid-animation (Reanimated and Worklets do run during capture)
- [ ] Make stories deterministic: fixtures for amounts, dates, names and ids, no
      network, no Firebase repositories, one theme and one language per story
- [ ] Scope coverage to the shared molecules/organisms plus the reused feature
      components from TICKET-040, and list any uncovered component in this ticket

### CI
- [ ] Add the repository's first GitHub Actions workflow
      (`.github/workflows/visual-tests.yml`): `build-ios` on `macos-latest`,
      `build-android` on `ubuntu-latest` running
      `npx chromatic react-native-build --platform=... --output-dir=build`, artifact
      upload, and a `chromatic` job publishing with `-d storybook-static`
- [ ] Use `fetch-depth: 0`, pin Node/Xcode per the Chromatic sample, and cache npm,
      Gradle and CocoaPods
- [ ] Trigger on `pull_request` (opened, edited, synchronize) and on push to `main`
- [ ] Decide and document the failure policy: `--exit-zero-on-changes` during the
      onboarding stage, then whether the *UI Tests* check becomes required to merge
- [ ] Acknowledge that TurboSnap is **not** supported for React Native: every build
      snapshots every story, so set the budget and, if needed, narrow the run with
      `--only-story-names` (glob) or disable a platform in the project's
      *Configure* screen
- [ ] Never bundle secrets: provide only the `EXPO_PUBLIC_*` values the story graph
      needs, and keep Firebase config out of the story entry
- [ ] Keep stories out of the Jest coverage scope and out of `npm run check:copy`
      (or translated), as TICKET-040 already requires

## Acceptance Criteria
- [ ] The first build publishes iOS and Android baselines and every story appears in
      the Chromatic build
- [ ] A deliberate visual change (for example a token colour) produces a diff on the
      pull request; reverting it makes the build green again
- [ ] Accepting a change updates the baseline and keeps it across branches; denying it
      fails the build and forces a re-capture
- [ ] A build with no story changes still completes and its PR check reports the
      expected status
- [ ] Production is unaffected: `npx expo export` contains no story and no Storybook
      entry, and the app never renders Storybook without the flag
- [ ] Snapshot consumption stays inside the chosen plan and the per-build count is
      written down
- [ ] `README.md` and the testing docs describe the local run, the CI job, the
      baseline approve/deny loop and who owns approvals
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` are
      clean

## Technical Notes
- **Verified capabilities (Chromatic docs, 2026):** Chromatic for React Native renders
  stories on hosted macOS (iOS Simulator 26.x) and Linux (Android Emulator 36), keeps
  the infrastructure current, migrates baselines on infra updates, parallelises
  automatically and uses **SteadySnap** (most stable frame from a burst) to cut render
  flake. Expo, Expo Router, React Native CLI and Re.Pack are all supported.
- **CLI:** `npx chromatic --project-token <token>` builds the artifacts for Expo
  projects; `npx chromatic react-native-build --platform=ios|android --output-dir=build`
  splits the native builds for CI. Artifacts must be named `storybook.app` and
  `storybook.apk` inside the directory passed to `--storybook-build-dir`/`-d`.
- **No modes, no TurboSnap:** dark mode, locale and viewport are not supported through
  the modes API and TurboSnap is not supported for React Native, so variants need one
  story each and every build pays for every story on every enabled platform.
- **Cost:** billing is per captured snapshot; the free tier is small and the iOS leg
  also burns macOS runner minutes. Cheapest first stage is iOS only, then add Android
  once the story set is stable.
- **Baselines and Git:** Chromatic compares against the baseline of the target branch
  and carries accepted changes through merges, so the workflow needs full history
  (`fetch-depth: 0`) even without TurboSnap.
- **Anchors:** `.rnstorybook/index.ts`, `.rnstorybook/preview.ts` (decorators),
  `app/_layout.tsx` (guarded entry), `metro.config.js` (`withStorybook` wrapper),
  `.github/workflows/` (new), `package.json` (`chromatic`, `storybook` scripts),
  `jest.config.js`, `scripts/check-copy.js`,
  `docs/project/testing/test-guide.md`.
- **Environment risk:** the Storybook bundle is built by Metro from the app graph, so
  any Firebase import reachable from a story would need `EXPO_PUBLIC_FIREBASE_*` in CI.
  Stories must not reach network code; if one does, mock it with `msw`-style handlers
  or a decorator instead of adding secrets.
- **Not the same as TICKET-078:** FullStory (session replay, interaction maps) observes
  real usage; Chromatic gates the commit. Neither replaces the other.
- **Reports:** pin the Chromatic GitHub App/action version at implementation time
  instead of copying versions from this ticket; the sample workflow's action versions
  are illustrative.

## Validation Plan
- Run `npx chromatic` locally against the Storybook build once and confirm both
  platforms publish, then open the build and review a diff.
- Change one token colour, open the PR and confirm the diff and the PR check; revert and
  confirm green.
- Accept the intentional change, merge it, and confirm the next branch inherits the new
  baseline.
- Break one story on purpose (remove a padding decorator) to confirm the status-bar and
  SteadySnap behaviour does not create flaky false positives across two consecutive
  builds.
- Run `npx expo export` and grep the output for `storybook` and for any story file.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- V1.0 shipped (post-V1 track)
- TICKET-040 Storybook component catalog (provides the stories, v9+ and the Metro
  wrapper this ticket builds on)
- TICKET-074 integral visual redesign (baselines should start on the final visual
  system)

## Out of Scope
- Screen and navigation-flow visual tests (Maestro/Detox screenshots)
- EAS Build artifacts and the EAS workflow variant of the setup
- Playwright/Cypress E2E visual tests against the web build
- Interaction and accessibility test coverage as a gate (stories may enable them later)
- FullStory session replay (TICKET-078)
