# [DONE] TICKET-014 - Future: Dark Mode Polish

**Type:** Improvement  
**Priority:** Medium  
**Status:** ✅ Done (09/11/2026)  
**Related:** PM-013  
**Sprint:** Post-MVP  

## Description
Finish the dark theme across the whole app so every screen, form and component follows the active appearance without hardcoded light colours. Add a manual **"Modo oscuro"** toggle in the Settings tab so the user can enable or disable dark mode without changing the system setting.

## Requirements
- [x] Audit every screen for hardcoded light colours
- [x] Fix the login screen, settings and any legacy components
- [x] Apply theme tokens to inputs, placeholders, borders, chips, modals and empty states
- [x] Ensure the status bar and navigation bar match the theme
- [x] Verify contrast for text, disabled states and destructive actions
- [x] Keep light mode unchanged
- [x] Add a **"Modo oscuro"** toggle in the Settings tab
- [x] Persist the manual preference locally and restore it on app start
- [x] Follow the system theme until the user changes the toggle; the toggle then overrides it
- [x] Add visual checks or screenshots for the main flows in both themes

## Acceptance Criteria
- [x] No screen shows white cards or dark text on a dark background
- [x] Forms, filters, calendars and modals are readable in both themes
- [x] The theme changes immediately when the system appearance changes and no manual override exists
- [x] The Settings toggle switches the whole app between light and dark immediately
- [x] The selected preference survives an app restart
- [x] All new colours come from shared tokens instead of component literals

## Technical Notes
- `ThemedView`, `ThemedText`, `hooks/use-theme-color.ts`, `shared/hooks/use-form-theme.ts`, `app/_layout.tsx` and `app/(tabs)/_layout.tsx` read `useColorScheme` directly. Introduce one theme provider/context that owns the effective scheme (system or manual override) and make every consumer read from it, so the toggle updates the whole app at once.
- `features/auth/styles/login.styles.ts` currently uses fixed light colours (`surface`, `text`, `border`, `placeholder`). This is the clearest gap.
- Avoid raw hex values inside components. Palette/token files are the only place where colours should be declared.
- Persist the preference with `@react-native-async-storage/async-storage` (already a dependency) through a small repository/store, following the existing feature-first + repository pattern. Keep the theme logic out of the Settings component.
- Keep system mode as the default. A three-state selector (`system` / `light` / `dark`) can replace the toggle later if the product needs it.
- The Settings screen already uses `useFormTheme` for the menu card and `ThemedText`/`ThemedView` for the rest; reuse those tokens for the toggle row instead of adding a new palette.

## Implemented
- Added `AppThemeProvider` with `system`/`light`/`dark` preference resolution, AsyncStorage persistence and a `setDarkMode` setter. Consumers use `useAppColorScheme` / `useFormTheme`.
- Wired the provider into `app/_layout.tsx` and made the status bar, navigation theme, tab bar, `ThemedText`, `ThemedView`, `useThemeColor` and all form/card consumers read the effective scheme.
- Added the Settings **Modo oscuro** switch with `Activado` / `Desactivado` helper text. The switch updates the whole app immediately and survives reloads.
- Replaced light-only surfaces and text in login, settings, wallet/category/transaction/transfer forms, filters, calendars, dialogs and dashboard sections with shared theme tokens.
- Added focused tests for preference resolution and storage.
- Added visual checks and screenshots in `docs/project/testing/dark-mode-visual-checks.md` and `docs/project/testing/visual-checks/`.

## Verification
- `npx tsc --noEmit`
- `npx expo lint`
- `npx jest` (65 suites, 314 tests)
- Expo web computed-style checks and screenshots for login/settings plus dark tab screens.

## Dependencies
- None
