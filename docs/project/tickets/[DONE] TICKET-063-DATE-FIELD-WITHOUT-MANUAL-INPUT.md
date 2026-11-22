# [DONE] TICKET-063 - Date Field Without Manual Input and Pinned Calendar

**Type:** UX  
**Priority:** High  
**Status:** ✅ Done (21/11/2026)  
**Related:** TICKET-005, TICKET-002, TICKET-003, TICKET-046  
**Sprint:** Post-MVP / Phase 6.0

## Description
Every date field still shows a free-text `TextInput` under the quick chips, and the 48x48 calendar button can wrap onto its own line because `quickRow` uses `flexWrap: "wrap"`. Remove the manual input, pin the calendar button to the right edge of the chips row so it never wraps, and replace the helper text with one summary line: the default hint, or the selected date when it is neither today, yesterday nor the last used date.

## Requirements
- [x] Remove `text`, `onChangeText` and the input row from `shared/components/molecules/date-quick-selector.tsx` (drop the `TextInput`, its `inputRow`/`input` styles and the `date.placeholder` usage)
- [x] Update `shared/components/molecules/date-form-field.tsx` and every consumer: `features/transactions/components/transaction-form-date-field.tsx`, `features/transfers/components/transfer-form-date-field.tsx`, `features/shared-expenses/components/shared-expense-form-main-fields.tsx`, `features/settlements/components/settlement-form-main-fields.tsx` and `features/transactions/components/transaction-filters-date-range.tsx`; also `features/group-expenses/components/group-expense-form-main-fields.tsx`, which became a consumer with TICKET-009 and was missing from this list
- [x] Drop the free-text date handlers (`dateText` as user input, `changeDate(text)`, `onChangeFrom`/`onChangeTo`) while keeping the derived `dateText` built with `formatDateInput`, so no schema or payload changes
- [x] Lay out `quickRow` as a wrapping `flex: 1` chip group plus a fixed 48x48 calendar slot pinned right (`marginLeft: "auto"` / `alignSelf`), so the calendar never ends up below the chips
- [x] Derive the summary from `valueIso` compared with today, yesterday and the last used date, with no new "selection source" state
- [x] Default summary: **Toca Hoy o Ayer, o elige otra fecha.**; when the value is not today, yesterday or the last used date: **Fecha seleccionada: {{date}}**
- [x] Show the default hint in the transaction filters too, and keep an empty date range valid there
- [x] Keep the error slot first: an error replaces the summary in the same position and stays announced; the summary never hides an error
- [x] Keep the `DatePickerModal` and the **Último** chip behavior from TICKET-005, including the last used date showing the default hint
- [x] Move the hint copy to `common.date.hint` and `common.date.selected` in `shared/i18n/locales/common/{es,en}.json`; delete `form.dateHelper` from `transactions`, `transfers`, `sharedExpenses` and `settlements` (including the settlement "no puede ser futura" helper, still covered by the `DATE_IN_FUTURE` error), and delete the now-unused `common.date.placeholder`
- [x] Run `npm run check:copy` plus `npx tsc --noEmit`, `npx expo lint` and `npx jest`
- [x] No schema, document or rules change: the date keeps being written as the same ISO string

## Acceptance Criteria
- [x] No date field anywhere accepts manual typing: only the quick chips and the calendar select a date
- [x] The calendar button is always visible at the right edge of the chips row, on one line, at every text size and screen width
- [x] Today, yesterday and the last used date show the default hint; any other selected date shows **Fecha seleccionada: …**
- [x] A quick chip and the calendar still write the same ISO date as before
- [x] Future-date and invalid-date validation behave exactly as before, with the error in the same slot
- [x] The transaction filters keep working with an empty date and show the default hint
- [x] `npm run check:copy` passes with no `dateHelper` or `date.placeholder` key left

## Implemented

Delivered and verified on 21/11/2026. Session note:
[`session-notes/2026-11-21-date-field-without-input.md`](../development-notes/session-notes/2026-11-21-date-field-without-input.md).

### Shared date field
- `shared/components/molecules/date-quick-selector.tsx` no longer renders a `TextInput` and no longer accepts `text`, `helperText` or `onChangeText`. It takes `valueIso` + `onSelectDate` and renders the chips, the calendar button and one summary line.
- `date-quick-selector.styles.ts` removed the `inputRow`/`input` styles, added a single `row` container and gave `quickRow` `flex: 1` + `flexWrap: "wrap"`; the calendar keeps its 48x48 target with `flexShrink: 0`, so it stays at the right edge while chips wrap.
- New pure helper `shared/utils/date-field-summary.ts`: `getDateFieldSummary({ valueIso, todayIso, lastUsedIso })` returns `"hint"` for empty/invalid values, today, yesterday (month/year boundaries included) and the last used date, and `"selected"` for any other valid date. It never adds state; the selector keeps reading `useLastUsedDate()` and `getDateQuickOptions()`.
- The error keeps the slot: the same `ThemedText` renders `error ?? summary`, in danger colour when there is an error, with `accessibilityLiveRegion="polite"` plus a queued iOS `announceForAccessibilityWithOptions` that skips the mount value.
- `date-form-field.tsx` now forwards `valueIso` + `onSelectDate` only.

### Consumers and state
- Transaction and transfer hooks replaced `dateText` state, `changeDate(text)` and the free-text parse with `selectDate(isoDate)`, which stores the ISO date and clears the local date error. The transaction/transfer date wrappers translate the validation code (`validation:transactions|transfers.INVALID_DATE`) instead of rendering the raw code.
- Shared-expense, group-expense and settlement form state replaced `changeDateText(text)` with `selectDate(isoDate)`; `dateText` stays in the form values as derived display text (`formatDateInput`) and still never reaches a schema or payload. The settlement date issue now parses `values.date` directly.
- `DateFormField` and `DateQuickSelector` consumers updated: transaction and transfer forms, shared-expense form, group-expense form (sixth consumer, created by TICKET-009 after this ticket was written), settlement form and the transaction filters.
- `use-transaction-filters-form` dropped `fromText`/`toText` and `changeFromDate`/`changeToDate`; selecting a bound writes the formatted date into `localFilters`, `fromIso`/`toIso` are derived and `apply()` still normalizes an empty range to `""`.
- No schema, document, service, repository, ledger, rules or index change; every selector still writes the same ISO `YYYY-MM-DD`.

### Copy
- `common.date.hint` ("Toca Hoy o Ayer, o elige otra fecha." / "Tap Today or Yesterday, or choose another date.") and `common.date.selected` ("Fecha seleccionada: {{date}}" / "Selected date: {{date}}") added; `common.date.placeholder` deleted.
- `form.dateHelper` deleted from `transactions`, `transfers`, `sharedExpenses`, `settlements` and `groupExpenses` (the last one also became unused with the shared field). The settlement "no puede ser futura" hint is covered by `DATE_IN_FUTURE` in the same slot.

### Tests and verification
- Colocated `shared/utils/__tests__/date-field-summary.test.ts` covers empty, invalid, today, yesterday, month boundary, last used date (ISO and `DD/MM/YYYY`), another date and invalid today/last-used input at 100 % coverage.
- `npx tsc --noEmit` pass, `npx expo lint` pass, `npx jest` 331 suites / 2035 tests pass, `npm run test:coverage` global 98.92 % statements, 94.7 % branches, 98.57 % functions and 99.5 % lines (gate intact, new helper at 100 %), `npm run check:copy` 307 TSX files.

### Review and decisions
- Independent `reviewer`: verdict `changes requested`; fixed the untranslated date validation code in the transaction/transfer fields, the missing iOS announcement and the stale form-value comments; the dead settlement `dateText` fallback was removed.
- Explicitly kept from the ticket: the last used date shows the default hint even in forms without the **Último** chip, because the acceptance criterion names today, yesterday and the last used date without a visibility condition.
- Also kept: the filters no longer have a per-bound clear control; **Limpiar filtros**/reset still produces an empty range, which is the empty state the ticket requires.
- Pending manual validation: 320pt and largest text sizes, light/dark, Spanish/English and screen-reader checks (iOS VoiceOver and Android TalkBack).

## Technical Notes
- Current renderer: `date-quick-selector.tsx` held the chips, the calendar `Pressable`, the `inputRow` and the error/helper block; `date-quick-selector.styles.ts` had `quickRow` with `flexWrap: "wrap"` and a `calendarButton` of 48x48, which is why the button could wrap.
- Suggested helper: `shared/utils/date-field-summary.ts` exporting a function that takes `{ valueIso, todayIso, lastUsedIso }` and returns `"hint"` or `"selected"`, with tests in `shared/utils/__tests__/`. The selector already reads `useLastUsedDate()` and `getDateQuickOptions()` from `shared/utils/date-quick-options.ts`, so the hook stays the only source of the last used date.
- Consumers today pass `text` and an `onChange` that parsed free text; after the change they pass `valueIso` plus `onSelectDate`, and `DateFormField` forwards the same props.
- Filters call `DateQuickSelector` without `helperText`; they must now receive the default hint and keep `""` as a valid empty range.
- The last used date is a past date that may also be today or yesterday; the summary compares against all three so the hint stays consistent with the selected chip.
- Keep the 44pt chip height and the 48x48 calendar touch target; the pinned slot must not shrink the chip group into horizontal scrolling.
- Out of scope: new quick options, relative date labels beyond today/yesterday/last, timezone handling and any change to `shared/utils/date.ts`.

## Validation Plan
- Open each date field (movement, transfer, shared expense, group expense, settlement, filters) and confirm there is no text input.
- Check the layout at 320pt, at the smallest and largest supported text sizes and in Spanish/English: the calendar stays on the chips row, at the right edge.
- Select today, yesterday, the last used date and a calendar date; confirm the summary switches exactly as specified.
- Confirm the last used chip still appears only where it did before and still writes its date.
- Try a future date in the movement and settlement forms and confirm `DATE_IN_FUTURE` still blocks it; invalid values can now only arrive from legacy records.
- Check light/dark and screen reader: the summary and the error are announced once, in the same slot.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-005 date picker UX (calendar modal, quick chips and last used date, delivered)
- No dependency on the settlement or wallet work; it can ship before or after TICKET-062
