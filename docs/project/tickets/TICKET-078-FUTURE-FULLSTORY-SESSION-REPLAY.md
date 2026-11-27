# TICKET-078 - FullStory Session Replay and Product Analytics

**Type:** Tooling / Observability
**Priority:** Medium
**Status:** ⏳ Pending
**Related:** PM-078; TICKET-040, TICKET-074, TICKET-022
**Sprint:** Post-V1

## Description
Instrument the mobile app with FullStory for Mobile Apps through the official
`@fullstory/react-native` plugin so real sessions can be replayed to debug
reproductions, review interaction/heat maps and catch rage/dead taps and
abandoned forms on the money flows. It is observability tooling: it changes no
business rule, no navigation and no copy.

**FullStory is not a visual regression gate.** It replays real sessions and shows
interaction maps; it cannot compare screenshots and block a commit in CI. The
commit-time visual regression (Chromatic over the TICKET-040 Storybook catalog)
is TICKET-079; this one only covers session replay and analytics.

## Requirements
### Decision and scope
- [ ] Record the decision note: environments to capture (dev builds and
      production, or production only), the FullStory plan and session volume,
      who can watch sessions, data-retention window and what is explicitly
      excluded from capture
- [ ] Confirm the org id, the New Architecture compatibility and the plugin
      version required by React Native 0.88 and Expo SDK 58 at implementation
      time (`@fullstory/react-native` >= 1.10.0 for RN >= 0.83)
- [ ] Keep the SDK behind an `EXPO_PUBLIC_FULLSTORY_ORG` flag, so a build without
      it behaves exactly as today and no session is recorded

### Integration
- [ ] Add the plugin to `app.json` (`version`, `org`, `recordOnStart`,
      `enabledVariants` including `debug` on Android so dev builds capture) and
      regenerate the native projects with `npx expo prebuild`
- [ ] Wrap the SDK in a single module (for example
      `shared/lib/telemetry/fullstory.ts`) exposing init, identify, anonymize and
      track functions; no screen, hook or component imports
      `@fullstory/react-native` directly
- [ ] Initialise once from the root layout, after language and theme providers,
      and no-op when the org id is missing, on web or under Jest
- [ ] Hook screen tracking to Expo Router with `FSPage` using the route template
      (`/social/friends/[uid]`), never the resolved id
- [ ] Call `FS.identify` with the Firebase `uid` only (no email, no display
      name, no currency) and `FS.anonymize` plus `FS.shutdown` on sign-out, so a
      shared device never links two accounts
- [ ] Emit a small custom-event set for the money flows (`movement_created`,
      `transfer_created`, `shared_expense_created`, `settlement_created`,
      `offline_conflict_resolved`) with amounts, names and notes excluded
- [ ] Mock the SDK in the Jest setup so `npx jest` and the 90% business-logic
      coverage gate stay untouched, and keep the SDK out of the web build

### Privacy and compliance
- [ ] Keep texts masked by default (Private by Default), never unmask amounts,
      balances, emails, names or free-text notes, and use `fsClass` /
      `fs-mask` / `fs-exclude` for the few safe labels worth reading in a replay
- [ ] Confirm whether the org requires `FS.consent()`, and if it does, wire it to
      a stored choice before capture starts
- [ ] Declare the capture in the store listings (App Store privacy details and
      Play Data Safety), and check the iOS privacy manifest requirements
- [ ] Document what a session contains, how to disable it in a local build and
      how to delete a requested user's sessions

## Acceptance Criteria
- [ ] A session recorded from a dev build appears in FullStory on both iOS and
      Android with screens, taps and the custom events
- [ ] Texts, amounts, emails and notes show masked in playback, and the replay is
      still usable to reproduce a layout bug
- [ ] Sessions are linked to the Firebase `uid` and stop being linkable after
      sign-out; a second account on the same device opens a separate identity
- [ ] With `EXPO_PUBLIC_FULLSTORY_ORG` unset the app builds and runs without the
      SDK capturing anything, and the web build is unaffected
- [ ] No PII, money value or `any` is passed to the telemetry module
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`
      are clean
- [ ] `README.md` and the tooling docs describe setup, the env flag, the privacy
      rules and how to watch a session

## Technical Notes
- **SDK:** `@fullstory/react-native` wraps the FullStory for Mobile Apps native
  SDK; RN 0.88 needs plugin >= 1.10.0. It cannot run in Expo Go, so it needs a dev
  build (`npx expo run:ios` / `run:android`, as this repo already does).
- **Expo config plugin:** pass `version`, `org`, `recordOnStart`,
  `enabledVariants` (Android; defaults to `release`) and `additionalConfigs`.
  `android/` is committed, so the plugin only takes effect after a prebuild of
  that project; document the regenerate step.
- **iOS Podfile:** CocoaPods trunk goes read-only on 02/12/2026, so `FullStory`
  must come from the release tarball URL. The config plugin adds that line; a
  manual Podfile needs `pod 'FullStory', :http => 'https://ios-releases.fullstory.com/...'`
  or `FS_ALLOW_TRUNK=1`.
- **Babel:** the package already depends on `@fullstory/babel-plugin-react-native`
  and `@fullstory/babel-plugin-annotate-react` (they add the `fsClass` prop);
  confirm the React Compiler flag in `app.json` does not interfere.
- **Anchors:** `app/_layout.tsx` (root providers, where init belongs),
  `shared/lib/` (home of the telemetry module and its tests),
  `features/auth` (identify/anonymize on sign-in and sign-out),
  `app.json` (plugin and flag), `.env` (new `EXPO_PUBLIC_FULLSTORY_ORG`).
- **Copy audit:** `scripts/check-copy.js` parses TSX; telemetry event names and
  route templates are internal strings, not visible copy, so they stay out of
  the i18n namespaces. Do not add user-facing text through this module.
- **Offline first:** the app must keep working with the SDK disabled or failing;
  never await FullStory on a money write or on the sync engine, and never let it
  block startup.
- **Cost:** FullStory bills by captured session. Decide sampling and which
  environments capture before production, and record the limit in the decision
  note.
- **Heat maps:** available interactions differ between web and mobile; validate
  in the trial which maps (taps, rage/dead clicks, funnels) apply to the mobile
  SDK before promising them in the docs.

## Validation Plan
- Build a dev client on Android and another on iOS with the plugin configured and
  the flag on; log in, create a movement, a transfer and a shared expense, open
  the sync center and sign out.
- Open the sessions in FullStory and confirm the screen names, the taps and the
  five custom events, with all text and amounts masked.
- Sign in with a second account on the same device and confirm two identities,
  then anonymize and check the next session is anonymous.
- Build with the env var unset and repeat a smoke test: no session appears and
  the app behaves identically.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- V1.0 shipped (post-V1 track)
- TICKET-074 integral visual redesign (the sessions that matter are the final
  visual system; capturing before it wastes sessions)
- TICKET-040 Storybook catalog (pairs with the separate Chromatic ticket, not
  with this one)

## Out of Scope
- Automated visual regression on commits (TICKET-079, Chromatic)
- Web capture, A/B testing, Guides and Surveys, Ads and any experiment framework
- Replacing Firebase Analytics or Crashlytics events that already exist
- Sending any money, PII or free-text field to FullStory
