# Session Note: SDK 58 Migration

**Date:** 06/11/2026
**Status:** ✅ Done (code) / ⏳ manual QA pending

## Summary

The project moved from Expo SDK 54 to SDK 58. The previous state was a partial
upgrade (`expo@58` with SDK 54 packages), which broke Metro with
`Cannot find module 'expo-router/internal/testing'`. All Expo-managed packages
are now aligned to SDK 58 and the project bundles for Android and web.

## Version changes

| Package | Before | After |
|---|---|---|
| expo | 54.0.33 | 58.0.23 |
| expo-router | 6.0.23 | 58.0.30 |
| react-native | 0.81.5 | 0.88.1 |
| react / react-dom | 19.1.0 | 19.3.0 |
| react-native-reanimated | 4.1.6 | 4.7.1 |
| react-native-worklets | 0.5.1 | 0.13.0 |
| react-native-gesture-handler | 2.28.0 | 3.3.0 |
| react-native-screens | 4.16.0 | 4.30.1 |
| @react-native-community/datetimepicker | 8.4.4 | 9.2.1 |
| typescript | 5.9.3 | 6.0.3 |
| jest | 30.3.0 | 30.5.2 |

## Code changes

| Area | Change |
|---|---|
| `app.json` | Removed `newArchEnabled` and `edgeToEdgeEnabled`; both are the only behaviour in SDK 58 and are no longer valid config keys |
| `app/_layout.tsx` | `ThemeProvider`, `DarkTheme` and `DefaultTheme` now come from `expo-router` (expo-router vendors React Navigation) |
| `components/haptic-tab.tsx` | Uses the vendored `PlatformPressable` and `BottomTabBarButtonProps` from `expo-router` so the tab button types match |
| `components/ui/icon-symbol*.tsx` | Mapping is a literal `as const satisfies` record (icons for transactions/settings were missing); `color` accepts `ColorValue` and numeric/null values are normalized before reaching `MaterialIcons` |
| `*.styles.ts` | `StyleSheet.absoluteFillObject` was removed; the preset now lives in `shared/styles/absolute-fill.ts` |
| Screens with `FlatList` | `ListHeaderComponent` / `ListFooterComponent` now require `undefined` instead of `null` when absent |
| `shared/utils/__tests__/date-calendar.test.ts` | Imports Jest globals from `@jest/globals`, matching the rest of the suite |
| `types/css.d.ts` | Declares the `global.css` side-effect import for TypeScript 6 |
| `tailwind.config.js` | Sets `darkMode: "class"`; NativeWind's web runtime throws `Cannot manually set color scheme...` when the CSS flag is `media` |

## Decisions

- **Use expo-router's vendored navigation**: importing `@react-navigation/*`
  directly creates a second React context instance, so theming and tab types
  would silently diverge. The standalone `@react-navigation/*` packages stay
  installed but are no longer imported.
- **Keep `global.css`**: NativeWind 4 still works with React Native 0.88; the
  only need was the TypeScript side-effect module declaration.
- **No `expo prebuild` yet**: there is no `android/` or `ios/` folder in the
  repo, so the upgrade only required JS/TS changes.
- **Tailwind `darkMode: "class"`**: the app themes itself through
  `useColorScheme` and `Colors`, not through `dark:` utilities, so the flag only
  avoids NativeWind's web runtime crash while keeping system dark mode intact.

## Verification

```powershell
npx tsc --noEmit      # 0 errors
npx expo lint         # 0 warnings/errors
npx jest --runInBand  # 56 suites, 291 tests passed
npx expo-doctor       # 20/20 checks passed
```

Runtime checks:

- Android: bundled with Expo Go `58.0.5` and rendered the login screen.
- Web: `http://localhost:8082` returned HTTP 200 and bundled the router SSR entry.

## Pending

- **Expo Go 54 no longer works** with this project; use Expo Go 58 (Play Store)
  or a development build.
- **Firebase Auth persistence on native**: fixed with
  `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`
  in `lib/firebase.ts`; web keeps `getAuth()` in `lib/firebase.web.ts`.
- **Google sign-in on native**: fixed with the native
  `@react-native-google-signin/google-signin` flow. See
  `2026-11-07-google-native-signin.md`.
- Manual QA on device/web of the verification flow (TICKET-021).
