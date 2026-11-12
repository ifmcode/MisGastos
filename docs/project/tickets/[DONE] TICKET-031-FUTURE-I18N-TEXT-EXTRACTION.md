# [DONE] TICKET-031 - Future Epic: Internationalization and Text Extraction

**Type:** Epic / Architecture + UX  
**Priority:** High  
**Status:** ✅ Done (12/11/2026)  
**Related:** PM-031; all feature tickets; TICKET-014 (settings pattern)  
**Sprint:** Post-MVP / Phase 3.3  

## Description
Every user-facing string must come from translation files split by feature, so the app can render Spanish or English today and add more languages later. The selected language is managed from the Settings tab, persisted locally and applied immediately without restarting the app.

This is an epic because it touches every screen, form, modal, empty/error state, accessibility label and domain error message. The goal is one source of truth per string, no hardcoded copy left in components, and a documented workflow for adding keys and languages.

## Requirements
- [x] Choose the i18n approach and library in a short ADR, documenting the alternatives
- [x] Add `expo-localization` and declare the supported locales (`es`, `en`) in the Expo config
- [x] Set up the i18n runtime with Spanish as the default and fallback language
- [x] Split copy into one translation file per feature and language, loaded as namespaces
- [x] Create the initial `es`/`en` files for `common`, `navigation`, `auth`, `wallets`, `categories`, `transactions`, `transfers`, `dashboard`, `settings` and `validation`
- [x] Replace every hardcoded UI string: titles, labels, buttons, placeholders, helper text, empty/loading/error states, confirmations, accessibility labels and hints
- [x] Replace hardcoded domain messages with stable error codes mapped to translation keys in the UI layer
- [x] Format dates, times, numbers, currencies and percentages with `Intl` using the active locale
- [x] Persist the language preference with AsyncStorage, mirroring the existing theme preference pattern
- [x] Resolve the initial language as: saved preference → first supported device locale → Spanish
- [x] Add a language selector to Settings with Español and English, applying the change immediately
- [x] Keep a dev warning plus Spanish fallback when a key is missing instead of rendering the raw key
- [x] Add tests for language resolution, key parity between languages and the persistence helpers
- [x] Add a guard against new hardcoded copy (lint rule, script or PR checklist)
- [x] Document how to add a key, add a namespace and add a new language

## Acceptance Criteria
- [x] Switching language in Settings updates the whole app immediately and survives a restart
- [x] A device configured in English opens the app in English unless the user explicitly chose Spanish
- [x] Forcing an unsupported device locale falls back to Spanish
- [x] Every visible string comes from a translation file; no component contains literal Spanish copy
- [x] No component imports translation JSON directly: screens use the typed hook/keys
- [x] Dates and amounts follow the selected locale (`1.234,56 €` vs `€1,234.56`)
- [x] A missing key shows the Spanish value and a development warning, never a raw key or blank space
- [x] Domain services and repositories keep returning codes, not translated sentences
- [x] Existing flows, validation and tests keep working in Spanish
- [x] `npx tsc --noEmit`, `npx expo lint` and `npx jest` pass

## Research And Decision
- Expo's official localization guide uses `expo-localization` to read the device locale and `Intl` (available on Hermes) for dates, numbers and currencies. It explicitly recommends **not** building custom formatting and lists `i18next`, Lingui, fbtee and Intlayer as translation library options: <https://docs.expo.dev/guides/localization/>
- **Recommended stack:** `expo-localization` + `i18next` + `react-i18next`.
  - i18next namespaces are the standard way to split translations into per-feature files (`wallets.json`, `transactions.json`, …) and load them by feature: <https://www.i18next.com/principles/namespaces>
  - `react-i18next` provides `useTranslation`, a provider, interpolation, plurals and typed keys via `CustomTypeOptions`: <https://react.i18next.com/latest/typescript>
  - It is stable, widely used in React Native, has no build step and integrates with translation-management tooling later.
- **Alternatives and trade-offs:**
  - `i18n-js`: the Expo guide example. Very small and simple, but no React context/hooks/typed keys; components must import the singleton, which couples rendering to the library.
  - Lingui: excellent developer experience, compile-time message extraction and catalogs. Adds a build/codegen step and a different authoring format; worth revisiting if the catalog grows a lot or a translation platform requires it.
  - `react-intl` / FormatJS: mature ICU MessageFormat support, heavier API and setup; a good fit only if advanced ICU messages become necessary.
  - `typesafe-i18n`, `Intlayer`, `fbtee`: typed/compile-time alternatives; smaller ecosystems than i18next.
- **Per-app language:** the `expo-localization` config plugin accepts `supportedLocales` for iOS and Android, enabling the OS-level per-app language selector. Declare `["es", "en"]` even though the app also has its own Settings selector: <https://docs.expo.dev/versions/latest/sdk/localization/>
- **Runtime direction:** if RTL languages are added later, Expo Router exposes `LocaleProvider` to update navigation direction without a reload. Keep the provider boundary ready, but RTL itself is out of scope here.
- The Settings screen already has a working precedent: `AppThemeProvider` + `shared/lib/theme-storage.ts` persist the theme in AsyncStorage and expose it through context. The language feature should copy that shape instead of inventing a second pattern.

## Technical Notes
- **Library setup (proposed):**
  - `shared/i18n/index.ts`: creates the i18next instance, registers the resources, sets `fallbackLng: "es"`, `defaultNS: "common"`, `compatibilityJSON: "v4"` if needed and a missing-key handler.
  - `shared/i18n/resources.ts`: imports each feature's `locales/es.json` and `locales/en.json` and exports the resource map typed as `const`.
  - `shared/i18n/types.d.ts`: `CustomTypeOptions` with the `es` resources so `t()` keys are checked by TypeScript.
  - `shared/providers/language-provider.tsx`: loads the saved preference before rendering, exposes `{ language, languageTag, setLanguage, ready }` and calls `i18n.changeLanguage`.
  - Mount `LanguageProvider` in `app/_layout.tsx` around `AuthProvider`, outside the router, so every screen has the context.
- **File layout (preferred):** translations live next to their feature, matching the feature-folder rules:
  - `features/<feature>/locales/es.json` and `en.json` → namespace `<feature>`
  - shared copy in `shared/i18n/locales/common/es.json` / `en.json` (buttons, generic states, dates, plurals)
  - validation/error copy in `shared/i18n/locales/validation/…`
  - Alternative: one central `locales/<lang>/<feature>.json` tree. Choose one and keep it consistent; colocation is preferred so a feature moves with its copy.
- **Language resolution:** a pure helper, e.g. `resolveAppLanguage(stored, deviceLocales, supported)` in `shared/utils/language.ts`, returns the saved value when valid, otherwise the first supported device language, otherwise `es`. Normalize `es-ES` → `es`. Store `languageTag` (`es-ES`, `en-US`) for `Intl`, while the selected language stays `es`/`en`.
- **Persistence:** `shared/lib/language-storage.ts` with key `misgastos.language.preference` (same style as `THEME_PREFERENCE_KEY`) and a validator. Save only explicit user choices; "follow the device" can be a future option.
- **Settings UI:** `features/settings/components/settings-language-selector.tsx` rendered next to `SettingsThemeToggle`, using the existing menu row styles and accessibility roles. Options: **Español** and **English**; the active one shows a check. For the first version, derive the initial value from the device and let the user override it.
- **Error and validation strategy:** most services currently throw Spanish text (`CategoryOperationError`, validation issues, transaction errors). Introduce stable codes (many already exist) and translate in the UI, e.g. `t(\`validation:${code}\`)`. Do not translate inside services, repositories or schemas: they must stay deterministic and testable. Where an error has no code yet, add one while migrating its screen.
- **Formatting:** add a `useAppLocale()`/`useFormatters()` hook that wraps `Intl.NumberFormat`, `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat` with the active `languageTag`. Replace hardcoded `toLocaleDateString("es-ES")`, `"es-ES"` currency formatting and manual date labels. Wallet currency is data; only its formatting locale changes.
- **Interpolation/plurals:** use i18next interpolation (`{{count}}`, `{{name}}`) and plural keys (`_one`/`_other`) instead of concatenating strings. Shared copy keys keep Spanish wording identical to today's text.
- **Testing:** colocated tests for `resolveAppLanguage`, storage validation and the provider's initial state. Add a key-parity test that walks every namespace in `es` and `en` and fails on missing/extra keys. A pseudo-locale or debug mode can reveal strings that skip `t()`. Component tests that render translated copy should wrap them in `I18nextProvider` or initialize a test instance.
- **Guardrail:** once the migration is mostly done, add an ESLint `react/jsx-no-literals` variant or a small `scripts/check-copy.ts` audit, plus a PR checklist item. Adding it on day one is too noisy while strings are still being migrated.
- **Migration order (PR-sized slices):**
  1. Infrastructure, resources, provider, storage and tests.
  2. `common`, `navigation` and `settings` (including the language selector), so the switch is usable.
  3. `auth` (login, verify email).
  4. `wallets` + `categories`.
  5. `transactions` + `transfers`.
  6. `dashboard` + `modal` + remaining states.
  7. Validation/error codes, `Intl` formatters and the copy audit.
- **Out of scope:** translating user data (wallet/category names stay as typed), Firebase Auth emails, app-store metadata and notification templates, languages beyond Spanish and English, RTL layouts, and remote/OTA translation delivery.

## Open Questions
- Should Settings offer a third **Sistema** option (follow device language), or only explicit Español/English?
- Do we localize the app display name and permission strings in this ticket, or leave store metadata for later?
- Is Portuguese/French planned soon? It affects plural rules and locale tags but not the architecture.
- Are Firebase Auth emails (verification, reset) in scope? They need custom templates/SMTP outside the app bundle.
- Do category defaults (seeded names) get translated at seed time, or stay in the language used when the account was created? Translating seeded data would rewrite user data, so the default should stay data-language and only UI copy be translated.

## Suggested Slices
| Slice | Scope | Outcome |
|---|---|---|
| 1 | Library, resources, provider, storage, tests | App renders from translations with Spanish fallback |
| 2 | Common copy, navigation, Settings selector | Language can be switched end-to-end |
| 3 | Auth + wallets + categories | Core personal-finance copy migrated |
| 4 | Transactions + transfers + dashboard | Every main tab migrated |
| 5 | Error codes + `Intl` formatters + audit | No hardcoded copy or locale assumptions left |

## Implemented

### Infrastructure
- Added `expo-localization`, `i18next` and `react-i18next`; declared `["es", "en"]` through the `expo-localization` config plugin.
- `shared/i18n/index.ts` initializes i18next with Spanish as `fallbackLng`, `defaultNS: "common"`, synchronous initialization and a development missing-key warning. `shared/i18n/missing-key.ts` never renders a raw key: it returns the Spanish fallback from i18next, then a humanized last segment.
- `shared/i18n/resources.ts` registers the ten namespaces. Copy is colocated with each feature (`features/<feature>/locales/{es,en}.json`) and shared copy lives in `shared/i18n/locales/{common,navigation,validation}`.
- `AppLanguageProvider` is mounted in `app/_layout.tsx` around the theme and auth providers. It resolves `saved preference → first supported device locale → Spanish`, exposes `{ language, languageTag, ready, setLanguage }`, persists explicit choices in `misgastos.language.preference` and calls `i18n.changeLanguage` immediately.
- `SettingsLanguageSelector` adds **Español** and **English** next to the dark-mode toggle. The active option shows a check and the whole tree re-renders on change.

### Copy migration
- Every visible string in auth, wallets, categories, transactions, transfers, dashboard, settings, shared date/dialog components and the modal route now comes from a namespace. The `check:copy` audit passes on 155 TSX files.
- Dynamic labels (wallet/category type options, quick actions, filter options, dashboard empty states, transfer history) now return translation keys instead of Spanish text.
- Accessibility labels and hints, confirmation dialogs, empty/loading/error states, placeholders and helper text are translated.
- Seeded category names and wallet/category names remain user data and are not translated.

### Error codes
- Validation issues and operation errors now carry stable codes only. `WalletValidationError`, `CategoryValidationError`, `TransactionValidationError`, `TransferValidationError` and their operation errors no longer contain Spanish sentences.
- `getWalletErrorCode`, `getCategoryErrorCode`, `getTransactionErrorCode`, `getTransferErrorCode` and `getAuthErrorCode` map provider/infrastructure failures to codes. Hooks translate them with `t(\`errors.${code}\`)`.
- Field errors are translated in the form components with `validation:<feature>.<CODE>`.

### Formatting
- `shared/utils/format.ts` provides `formatCurrency`, `formatNumber`, `formatPercent`, `formatDate` and `formatDateTime` through `Intl`.
- `useAppLocale()` wraps those helpers with the active `languageTag`. Cards, lists, detail views, delete dialogs and forms use it, so amounts follow `1.234,56 €` vs `€1,234.56` and display dates follow the selected locale.
- Manual date entry remains `DD/MM/YYYY` in both languages because the parser is deterministic; displayed dates are localized.

### Stability follow-up
- The first integration exposed a render loop: `asTranslate(t)` was created inline and used in data-loading `useCallback` dependencies, so `useWallets`/`useCategories`/`useTransactions`/`useTransfers` re-ran their effects on every render and the dashboard flickered between **Cargando tu resumen** and content. Added `useScopedTranslation(ns)` (`shared/hooks/use-scoped-translation.ts`), which memoizes the adapter against the stable i18next `t`, and migrated every hook that uses it in a dependency array.

### Tests and guardrails
- Added tests for language resolution (`shared/utils/language.test.ts`), AsyncStorage persistence (`shared/lib/language-storage.test.ts`), `es`/`en` key parity and missing-key fallback (`shared/i18n/resources.test.ts`) and `Intl` formatting (`shared/utils/format.test.ts`).
- Added `scripts/check-copy.js` and `npm run check:copy`; it parses TSX with the TypeScript compiler and fails on literal JSX text or copy-bearing literal props.
- Updated all affected tests to assert codes/keys instead of Spanish messages.

### Verification
- `npx tsc --noEmit` ✅
- `npx expo lint` ✅
- `npx jest` ✅ 133 suites / 613 tests
- `npx jest --coverage` ✅ 98.75% statements, 93.63% branches, 98.76% functions, 99.31% lines
- `npm run check:copy` ✅
- `npx expo export --platform web` ✅
