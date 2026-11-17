# Internationalization (TICKET-031)

> Date: 12/11/2026  
> Status: Implemented  
> Related: `roadmap.md` phase 3.3, `AGENTS.md`, `testing/test-guide.md`

## Decision

Use **`expo-localization` + `i18next` + `react-i18next`** with Spanish as the default and fallback language, per-feature namespaces and a Settings selector for **Español** / **English**.

### Why

- Expo officially recommends `expo-localization` for the device locale and `Intl` for dates, numbers and currencies.
- i18next namespaces are the standard way to split copy by feature and keep each feature self-contained.
- `react-i18next` provides `useTranslation`, a provider, interpolation, plurals and a familiar React integration without a build step.
- The project already had a persisted preference pattern (`AppThemeProvider` + `theme-storage`), so the language provider copies that shape.

### Alternatives considered

| Option | Trade-off |
|---|---|
| `i18n-js` | Very small, but no React context/hooks; components couple to the singleton. |
| Lingui | Excellent extraction and catalogs, but adds a build/codegen step. Revisit if the catalog or translation tooling grows. |
| `react-intl` / FormatJS | Mature ICU support, heavier API; only needed for advanced ICU messages. |
| `typesafe-i18n`, `Intl`-only, custom solution | Smaller ecosystems or too much custom code for plurals/namespaces. |

## Structure

```text
shared/i18n/
  index.ts             # i18next init, fallback, missing-key handling
  resources.ts         # namespace map (es/en)
  missing-key.ts       # dev warning + humanized fallback
  translate.ts         # Translate type for dynamic keys (error codes)
  locales/
    common/{es,en}.json
    navigation/{es,en}.json
    validation/{es,en}.json
features/<feature>/locales/{es,en}.json
```

Namespaces: `common`, `navigation`, `validation`, `auth`, `wallets`, `categories`, `transactions`, `transfers`, `dashboard`, `settings`.

Components never import JSON. They use `useTranslation("<namespace>")`; shared components use `common`. Dynamic keys (error codes) go through `t(\`errors.${code}\`)` or `asTranslate(t)` when a pure helper receives the translator.

> **Stability:** hooks that use the dynamic-key adapter inside `useCallback`/`useEffect` dependencies must use `useScopedTranslation(ns)` from `shared/hooks/use-scoped-translation.ts`. Calling `asTranslate(t)` inline creates a new function on every render and can restart data-loading effects indefinitely (the dashboard "loading/content" flicker fixed on 12/11/2026).

## Language resolution and persistence

1. Valid saved preference in `misgastos.language.preference`.
2. First supported device locale (`es-*` or `en-*`).
3. Spanish.

`resolveLanguageTag` keeps the device region for `Intl` (`en-GB`, `es-MX`) and falls back to `en-US` / `es-ES`. The provider loads the saved value before rendering the app and calls `i18n.changeLanguage` immediately when the user switches.

## Formatting

`shared/utils/format.ts` wraps `Intl.NumberFormat` and `Intl.DateTimeFormat`. `useAppLocale()` exposes `formatCurrency`, `formatNumber`, `formatPercent`, `formatDate` and `formatDateTime` with the active tag. Wallet currency stays data; only the formatting locale changes. Manual date input remains `DD/MM/YYYY` in both languages because the parser is deterministic; displayed dates are localized.

## Error codes

Services, repositories and schemas return codes, not sentences:

- Validation issues: `{ field, code }`.
- Operation errors: `error.code`.
- Infrastructure failures: `get<Feature>ErrorCode(error, fallback)`.
- Auth: `getAuthErrorCode(error, fallback)`.

Hooks translate the code in the UI layer. Form fields translate `validation:<feature>.<CODE>`. This keeps services deterministic and testable.

## Missing keys

- i18next falls back to Spanish first.
- `parseMissingKeyHandler` logs a development warning and returns an explicit default value or a humanized last segment. It never returns a raw dotted key or a blank string.

## Adding copy

1. Add the key to the feature's `es.json` and `en.json` with the same shape.
2. Use `const { t } = useTranslation("<feature>")` and `t("path.to.key")`.
3. Run `npm run check:copy` and `npx jest` (the parity test fails if a key is missing in either language).

## Adding a namespace

1. Create `features/<feature>/locales/{es,en}.json`.
2. Import both files in `shared/i18n/resources.ts` and add them to `es`, `en` and `NAMESPACES`.
3. Use `useTranslation("<feature>")`.

## Adding a language

1. Add the language code to `SUPPORTED_LANGUAGES` in `shared/types/language.types.ts` and its canonical `Intl` tag to `INTL_LOCALES`.
2. Create the new locale files for every namespace and register them in `resources.ts`.
3. Add the label to `features/settings/locales` and the Settings selector (the selector maps over `SUPPORTED_LANGUAGES`).
4. Add plural forms required by that language and extend the parity test if the plural suffixes differ.
5. Declare the locale in the `expo-localization` plugin in `app.json`.

## Guardrail

`npm run check:copy` parses TSX with the TypeScript compiler and fails on:

- literal JSX text with letters;
- literal `accessibilityLabel`, `accessibilityHint`, `placeholder`, `title`, `message`, `label`, `helperText`, `confirmLabel` or `cancelLabel`.

Keep it in the PR checklist for any UI change. It intentionally ignores user data and technical values.

## Out of scope

- Translating user data (wallet/category names, seeded category defaults).
- Firebase Auth email templates, app-store metadata and notifications.
- Languages beyond Spanish and English, RTL layouts and remote/OTA translation delivery.
- A third **Sistema** option in Settings; the app follows the device until the user chooses explicitly.
