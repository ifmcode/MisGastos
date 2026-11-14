---
name: React Native UI in MisGastos
description: Themed styles, shared component reuse, accessibility, dark mode and translated copy for MisGastos screens and components. Use when building or changing any screen, form, modal, list, card or navigation surface.
---

# React Native UI in MisGastos

## Theme and styles

- Effective scheme: `useAppColorScheme()`; form/card/modal tokens:
  `useFormTheme()` (primary token source for forms and surfaces); semantic colours:
  `useThemeColor()`. Raw values live in `shared/constants/theme-tokens.ts`.
- A screen with more than a handful of styles gets
  `features/<feature>/styles/<name>.styles.ts` exporting `<name>Styles` plus a
  `palette`/token object. Never hardcode hex values in components.
- Compose base style + variants: `[styles.chip, selected && styles.chipSelected]`.
  Prefer `flex` and `gap` over magic margins; do not duplicate near-identical styles.
- NativeWind is available, but shared components use `StyleSheet` with tokens;
  match the file you are editing.

## Shared components first

`shared/components/molecules` and `shared/components/organisms` already provide:
`LoadingState`, `ErrorState`, `EmptyState`, `ErrorBanner`, `FormHeader`,
`FormActions`, `AmountField`, `NotesField`, `DateFormField`,
`PageSheetFormModal`, `RecordCard`, `Fab`, `ConfirmDialog`,
`CurrencyChipSelector`, `DateQuickSelector`, `WalletChipSelector`,
`WalletPickerDialog` and the `DetailModal` family.

Before creating a component, check `docs/project/development-notes/component-inventory.md`
for the keep/extract decision. A shared component takes copy and callbacks as
props; it never imports a feature namespace or feature palette.

## Composition

- One component per file plus its `Props` interface; one responsibility per function.
- Screens orchestrate: header, sections, list header, empty/loading/error states,
  modals and footers are separate components. Derived data goes to a hook or util.
- Split before 150 lines. `transaction-form.tsx`, `dashboard-screen.tsx` and the
  transfer modals are the reference splits.
- Navigation callbacks are created by the screen (`createDashboardNavigationActions`,
  `createTransferDialogActions`); children receive plain callbacks.

## Copy

Every visible string, `accessibilityLabel`, `accessibilityHint` and placeholder
comes from `features/<feature>/locales/{es,en}.json` (or
`shared/i18n/locales/{common,navigation,validation}`). Services return error codes;
the component maps the code to a key. Run `npm run check:copy` — it fails on
literal JSX text and copy-bearing literal props.

## Accessibility and interaction

- Interactive rows are `Pressable` with `accessibilityRole`, a specific label and
  a hint that states what happens. Remove generic hints when a specific one exists.
- Provide pressed feedback; keep touch targets ≥44dp.
- Never use `Alert` or `window.confirm`: use the project `ConfirmDialog` so web works.
- Icons need `accessible={false}` when the parent row already exposes a label.

## Dark mode and web

- Verify both schemes; record evidence in
  `docs/project/testing/dark-mode-visual-checks.md` when appearance changes.
- Native-only modules need a `.web.tsx` variant (see `date-picker-modal.web.tsx`).
- Check the web bundle surfaces (`npm run web`) when touching layout or pickers.
