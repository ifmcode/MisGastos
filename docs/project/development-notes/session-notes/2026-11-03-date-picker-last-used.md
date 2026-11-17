# Session Note: Date Picker Follow-up (TICKET-005)

**Date:** 03/11/2026
**Ticket:** TICKET-005
**Status:** ✅ Done

## Summary

Two adjustments to the shared date selector:

- The calendar button is no longer pinned to the right edge. It follows the
  Hoy/Ayer chips in the same row, so it stays contiguous to them.
- Movement and transfer forms now show an `Último DD/MM` chip before `Hoy` after
  a transaction or transfer is saved successfully in the current app session.
  The chip is hidden when its date equals Hoy or Ayer and is not shown in the
  date filters. When visible, new movement/transfer forms start with that date,
  so the chip is preselected.

## Architecture

| Layer | Files |
|---|---|
| Shared UI | `shared/components/molecules/date-quick-selector.tsx`, `date-quick-selector.styles.ts` |
| Shared state | `shared/utils/last-used-date-store.ts`, `shared/hooks/use-last-used-date.ts` |
| Shared utils | `shared/utils/date-quick-options.ts`, `shared/utils/date-defaults.ts` |
| Transactions | `features/transactions/components/transaction-form-date-field.tsx`, `features/transactions/hooks/use-transaction-form-dialog.ts` |
| Transfers | `features/transfers/components/transfer-form-date-field.tsx`, `features/dashboard/hooks/use-dashboard-transfer-form.ts` |
| Tests | `shared/utils/__tests__/date-quick-options.test.ts`, `shared/utils/__tests__/last-used-date-store.test.ts` |

## Decisions

- **Session-only memory**: the last used date lives in a module-level store and
  is intentionally not persisted. Closing/restarting the app clears it.
- **Save, not selection**: the store is updated only after
  `createTransaction`/`updateTransaction` or `createTransfer`/`updateTransfer`
  succeeds, using the date that was actually saved.
- **No duplicate chips**: `getLastUsedDateOption` returns `null` for invalid
  values and for dates equal to Hoy/Ayer, so the row never repeats information.
- **Opt-in per field**: `DateQuickSelector` keeps Hoy/Ayer as the default.
  `showLastUsedDate` is passed only by the transaction and transfer date fields,
  leaving the Desde/Hasta filters unchanged.
- **Preselected on create**: `getDefaultMovementIsoDate` makes new forms start
  with the last used date when the `Último` chip is visible (and today
  otherwise). Editing keeps the record's date, so the chip is only selected when
  it matches that date.
- **Contiguous calendar**: the calendar button keeps its 48×48 hit area but is
  part of the chip row flow; the row uses `alignItems: "center"` and `gap`.

## Verification

- `npx tsc --noEmit` ✅
- `npx expo lint` ✅
- `npx jest` ✅ (47 suites, 232 tests)
- `npx expo export --platform web` ✅

## Pending

- Manual visual QA on a device to confirm the chip row wraps gracefully on very
  narrow screens with the extra `Último` chip.
