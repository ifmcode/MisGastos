# Date field without manual input (TICKET-063)

**Date:** 21/11/2026
**Ticket:** TICKET-063 - date field without manual input and a pinned calendar
**Phase:** 6.0 - settlement and form polish

## Context

Every date field rendered a free-text `TextInput` below the Hoy/Ayer chips. The
calendar button shared the wrapping chip row, so it could fall onto its own line
at narrow widths, and each feature repeated a helper ("Formato DD/MM/AAAA" or
"Toca Hoy o Ayer…"). The ticket removes the manual entry and keeps one shared
presentation for every form and the transaction filters.

## Decision

- `DateQuickSelector` is the only date control: chips + a calendar button fixed
  at the right of a wrapping `flex: 1` chip group, plus one summary line.
- The summary is derived, never stored: `getDateFieldSummary`
  (`shared/utils/date-field-summary.ts`) compares `valueIso` with today,
  yesterday and the last used date. Empty/invalid values and those three dates
  keep `common.date.hint`; any other valid date renders
  `common.date.selected` with `formatDateInput(valueIso)` (`DD/MM/YYYY`).
- `DateFormField` and every consumer pass `valueIso` + `onSelectDate`; free-text
  props and handlers (`text`, `onChangeText`, `helperText`, `changeDate`,
  `changeDateText`, `onChangeFrom`/`onChangeTo`) are gone.
- `dateText` stays as derived display text (`formatDateInput`) in the
  shared-expense, group-expense and settlement form values, so no schema,
  payload or document changes. Transaction/transfer hooks keep only the ISO
  `date` and expose `selectDate(isoDate)`.
- Filters write the formatted date into `localFilters` and keep `""` as a valid
  range; `apply()` still normalizes it. There is no per-bound clear control;
  **Limpiar filtros** resets both bounds.
- The error keeps the slot (`error ?? summary`), announced politely on Android
  and with a queued iOS announcement that skips the mount value.
- `common.date.hint` / `common.date.selected` replace the per-feature
  `form.dateHelper` keys and `common.date.placeholder`.

## Consequences

- One label/summary implementation for movement, transfer, shared-expense,
  group-expense and settlement forms and both date filters.
- The calendar can no longer wrap below the chips; the chip group wraps inside
  its own `flex: 1` column.
- The transaction/transfer date fields now translate the `INVALID_DATE`
  validation code instead of rendering the raw code.
- The last used date shows the hint even where the **Último** chip is not shown
  (shared/group/settlement/filters), following the acceptance criterion
  literally. If product prefers "only where the chip is visible", pass
  `lastOption ? lastUsedDate : null` to the summary.
- Invalid dates can now only come from legacy stored values; the
  `validation:*` `INVALID_DATE` copy still mentions the old manual format and is
  kept for that fallback.

## Files

- `shared/utils/date-field-summary.ts` (+ colocated test)
- `shared/components/molecules/date-quick-selector.tsx` / `.styles.ts`,
  `date-form-field.tsx`
- `features/{transactions,transfers,shared-expenses,group-expenses,settlements}`
  form fields, hooks and state handlers
- `features/transactions` filters date range, modal and form hook
- `shared/i18n/locales/common/{es,en}.json` and the five feature locale pairs

## Verification

`npx tsc --noEmit` pass, `npx expo lint` pass, `npx jest` 331 suites / 2035
tests pass, `npm run test:coverage` 98.92 % statements / 94.7 % branches /
98.57 % functions / 99.5 % lines (new helper at 100 %), `npm run check:copy`
307 TSX files. Device, 320pt, largest text size, light/dark and screen-reader
checks remain manual.

## Open questions

- Per-bound clear in the transaction filters: intentional no-op in this ticket,
  because the ticket removed the text input and reset still clears the range.
- `validation:transactions.INVALID_DATE` / `validation:transfers.INVALID_DATE`
  still describe the `DD/MM/YYYY` manual format; only legacy values can trigger
  them now. Rework the copy in a future copy pass if desired.
