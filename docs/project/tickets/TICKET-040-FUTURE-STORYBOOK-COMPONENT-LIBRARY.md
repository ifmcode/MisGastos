# TICKET-040 - Future Epic: Storybook Component Library

**Type:** Tooling / Developer Experience  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-040; TICKET-024, TICKET-037  
**Sprint:** V1 / Phase 8 (last ticket before V1 ships)  

## Description
Set up Storybook as a living catalog of the shared component layer plus the reused feature components, with light/dark and Spanish/English variants, without changing app behavior or shipping Storybook to production. It is developer tooling, not a user-facing feature. It runs after TICKET-074, so the catalog documents the final visual system instead of the pre-redesign one.

## Requirements
- [ ] Decide the Storybook flavor (on-device React Native Storybook vs web catalog via `react-native-web`) and record the decision and alternatives in a development note
- [ ] Configure the chosen Storybook for Expo SDK 58, React 19 and NativeWind 4, isolated from the app runtime and from production bundles
- [ ] Add scripts to open (and optionally build) the catalog, and document them in `README.md`
- [ ] Add global decorators/providers for `AppThemeProvider` (light/dark), `AppLanguageProvider` (es/en) and the gesture/reanimated setup the components need
- [ ] Cover every component in `shared/components/molecules` and `shared/components/organisms` with at least one story, including variants and edge cases (long text, disabled, loading, empty, error)
- [ ] Cover the reused feature components (movement card, transfer card, movement/transfer detail and form modals) that the shared layer exposes
- [ ] Cover the tokens and components produced by TICKET-074, including light/dark and the redesigned variants
- [ ] Define the story location/naming convention and the rule that a new shared component needs a story before it is considered done
- [ ] Keep stories out of the production bundle, the Jest coverage scope and the copy audit (or use translated copy)
- [ ] Document how to add a story and how to run the catalog on device and web
- [ ] Leave visual regression (Chromatic or screenshot diffing) as an explicit follow-up, not part of this ticket

## Acceptance Criteria
- [ ] The documented command opens the catalog and renders the shared components in both themes and both languages
- [ ] Every shared molecule and organism has at least one story; any remaining gap is listed in the `Implemented` section
- [ ] Production is unaffected: no Storybook import is reachable from any `app/` route, and `npx expo export` does not include story files
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` stay green, and the 90% business-logic coverage gate is unchanged
- [ ] Adding a story is documented and enforceable, so the catalog cannot silently rot
- [ ] The catalog opens on device/emulator (and in the browser if the web flavor is chosen)
- [ ] `README.md` and the relevant docs page describe the setup and the scripts

## Technical Notes
- Confirm the current stable version and Expo integration of `@storybook/react-native` at implementation time; do not pin versions in this ticket.
- NativeWind 4 requires the Tailwind entry (`global.css`) in the Storybook config; Reanimated 4/worklets need their setup or a mock.
- `@react-native-community/datetimepicker` has no web support; date-field components must be storied through their `.web.tsx` fallback when the web flavor is chosen.
- Components read colours from `useFormTheme`/`useAppColorScheme` and copy from i18n namespaces, so stories need provider decorators instead of hardcoded props.
- `scripts/check-copy.js` parses TSX: stories must either use translated copy or be excluded in the script, and the exclusion must be documented.
- Keep the Storybook entry outside `app/` and never import it from `app/_layout.tsx`; use a dedicated script/entry point.
- Proposed story location: `__stories__/<name>.stories.tsx` next to the component; document the final choice.
- Rejected alternative: an in-app gallery screen; it duplicates Storybook, ships to users and has no isolated controls.
- Reference: `docs/project/development-notes/component-inventory.md` lists the shared component layer; TICKET-074 updates it with the final visual system before this ticket starts.

## Validation Plan
- Pilot with three components (`RecordCard`, `EmptyState`, `DetailModal`) to prove the setup before covering the rest.
- Run the catalog on Android and, if the web flavor is chosen, in the browser.
- Confirm the production export excludes stories and that the four verification commands still pass.

## Dependencies
- TICKET-074 integral visual redesign (final tokens and component variants; it runs before this ticket)
- TICKET-037 shared component layer (the components the catalog must cover)
- TICKET-024 project agents and skills (tooling and conventions model)

## Out of Scope
Visual regression hosting, publishing the catalog, replacing `component-inventory.md`, and any change to component behavior or styles.
