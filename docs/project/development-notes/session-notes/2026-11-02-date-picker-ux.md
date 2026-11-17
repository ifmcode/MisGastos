# Session Note: Date Picker UX (TICKET-005)

**Date:** 02/11/2026
**Ticket:** TICKET-005
**Status:** ✅ Done

## Summary

Standardized date selection with mobile-first quick actions. Every date input now
shows `Hoy` and `Ayer` chips (with the `DD/MM` value), a calendar button at the
right of the chips and the existing manual `DD/MM/AAAA` input as fallback. The
calendar opens the native picker on iOS/Android and an in-app calendar grid on
web.

## Architecture

| Layer | Files |
|---|---|
| Shared UI | `shared/components/molecules/date-quick-selector.tsx`, `date-picker-modal.tsx`, `date-picker-modal.web.tsx`, `date-picker-modal.types.ts`, `date-picker-calendar.web.styles.ts`, `*.styles.ts` |
| Shared utils | `shared/utils/date.ts` (moved from `features/transactions/utils/transaction-date.ts`), `shared/utils/date-quick-options.ts`, `shared/utils/date-calendar.ts` |
| Transactions | `transaction-form-date-field.tsx`, `transaction-form.tsx`, `transaction-filters-date-range.tsx`, `transaction-filters-modal.tsx`, `use-transaction-filters-form.ts` |
| Transfers | `transfer-form-date-field.tsx`, `transfer-form.tsx` |
| Tests | `shared/utils/__tests__/date.test.ts`, `shared/utils/__tests__/date-quick-options.test.ts`, `shared/utils/__tests__/date-calendar.test.ts` |

## Decisions

- **Per-field selector in filters**: both `Desde` and `Hasta` reuse
  `DateQuickSelector` independently. Selecting a chip sets that field only.
- **Shared date utils**: `transaction-date.ts` moved to `shared/utils/date.ts` so
  shared components do not import from a feature. All existing imports were
  updated; behavior is unchanged.
- **Local calendar days**: quick options are built from local getters and the
  picker converts ISO ↔ local `Date` at midnight. Stored values remain
  `YYYY-MM-DD`, so Firestore and validation stay untouched.
- **Calendar on every platform**: the calendar button is rendered at the right of
  the quick chips. `@react-native-community/datetimepicker` does not support web,
  so `date-picker-modal.web.tsx` renders an in-app month grid
  (Monday-first weeks, month navigation, Hoy shortcut, immediate selection).
  The grid logic lives in `shared/utils/date-calendar.ts` and is unit tested.
- **Manual input priority**: chips are rendered first (primary flow); the text
  input is still visible and feeds the existing `changeDate`/`changeFromDate`
  handlers.

## UX details

- Chips are 44pt high; the calendar button is 48×44 with `hitSlop`, aligned to the
  right edge of the chips row. Selected chip uses the theme primary soft
  background and border.
- Light/dark colors come from `useFormTheme`; no raw colors in components.
- Android opens the native dialog; iOS uses a modal bottom sheet with a spinner,
  Spanish locale and Cancelar/Listo actions.
- Web opens an in-app bottom sheet with the month label, weekday row
  (`L M X J V S D`), 7-column day grid, `Cancelar`/`Hoy` actions and closes as soon
  as a day is selected.

## Verification

- `npx tsc --noEmit` ✅
- `npx expo lint` ✅
- `npx jest` ✅ (44 suites, 217 tests)
- `npx expo export --platform web` ✅
- Web calendar checked in Chrome: button opens the current month, month navigation
  works (October shows 31 days) and selecting a day updates the manual input.

## Pending

- Manual QA on a physical iOS/Android device (native dialog/sheet behavior).
- No Firestore or rules changes required.
