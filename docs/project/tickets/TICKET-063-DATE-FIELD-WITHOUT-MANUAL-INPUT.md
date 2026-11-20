# TICKET-063 - Date Field Without Manual Input and Pinned Calendar

**Type:** UX  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** TICKET-005, TICKET-002, TICKET-003, TICKET-046  
**Sprint:** Post-MVP / Phase 6.0

## Description
Every date field still shows a free-text `TextInput` under the quick chips, and the 48x48 calendar button can wrap onto its own line because `quickRow` uses `flexWrap: "wrap"`. Remove the manual input, pin the calendar button to the right edge of the chips row so it never wraps, and replace the helper text with one summary line: the default hint, or the selected date when it is neither today, yesterday nor the last used date.

## Requirements
- [ ] Remove `text`, `onChangeText` and the input row from `shared/components/molecules/date-quick-selector.tsx` (drop the `TextInput`, its `inputRow`/`input` styles and the `date.placeholder` usage)
- [ ] Update `shared/components/molecules/date-form-field.tsx` and every consumer: `features/transactions/components/transaction-form-date-field.tsx`, `features/transfers/components/transfer-form-date-field.tsx`, `features/shared-expenses/components/shared-expense-form-main-fields.tsx`, `features/settlements/components/settlement-form-main-fields.tsx` and `features/transactions/components/transaction-filters-date-range.tsx`
- [ ] Drop the free-text date handlers (`dateText` as user input, `changeDate(text)`, `onChangeFrom`/`onChangeTo`) while keeping the derived `dateText` built with `formatDateInput`, so no schema or payload changes
- [ ] Lay out `quickRow` as a wrapping `flex: 1` chip group plus a fixed 48x48 calendar slot pinned right (`marginLeft: "auto"` / `alignSelf`), so the calendar never ends up below the chips
- [ ] Derive the summary from `valueIso` compared with today, yesterday and the last used date, with no new "selection source" state
- [ ] Default summary: **Toca Hoy o Ayer, o elige otra fecha.**; when the value is not today, yesterday or the last used date: **Fecha seleccionada: {{date}}**
- [ ] Show the default hint in the transaction filters too, and keep an empty date range valid there
- [ ] Keep the error slot first: an error replaces the summary in the same position and stays announced; the summary never hides an error
- [ ] Keep the `DatePickerModal` and the **Último** chip behavior from TICKET-005, including the last used date showing the default hint
- [ ] Move the hint copy to `common.date.hint` and `common.date.selected` in `shared/i18n/locales/common/{es,en}.json`; delete `form.dateHelper` from `transactions`, `transfers`, `sharedExpenses` and `settlements` (including the settlement "no puede ser futura" helper, still covered by the `DATE_IN_FUTURE` error), and delete the now-unused `common.date.placeholder`
- [ ] Run `npm run check:copy` plus `npx tsc --noEmit`, `npx expo lint` and `npx jest`
- [ ] No schema, document or rules change: the date keeps being written as the same ISO string

## Acceptance Criteria
- [ ] No date field anywhere accepts manual typing: only the quick chips and the calendar select a date
- [ ] The calendar button is always visible at the right edge of the chips row, on one line, at every text size and screen width
- [ ] Today, yesterday and the last used date show the default hint; any other selected date shows **Fecha seleccionada: …**
- [ ] A quick chip and the calendar still write the same ISO date as before
- [ ] Future-date and invalid-date validation behave exactly as before, with the error in the same slot
- [ ] The transaction filters keep working with an empty date and show the default hint
- [ ] `npm run check:copy` passes with no `dateHelper` or `date.placeholder` key left

## Technical Notes
- Current renderer: `date-quick-selector.tsx` holds the chips, the calendar `Pressable`, the `inputRow` and the error/helper block; `date-quick-selector.styles.ts` has `quickRow` with `flexWrap: "wrap"` and a `calendarButton` of 48x48, which is why the button can wrap.
- Suggested helper: `shared/utils/date-field-summary.ts` exporting a function that takes `{ valueIso, todayIso, lastUsedIso }` and returns `"hint"` or `"selected"`, with tests in `shared/utils/__tests__/`. The selector already reads `useLastUsedDate()` and `getDateQuickOptions()` from `shared/utils/date-quick-options.ts`, so the hook stays the only source of the last used date.
- Consumers today pass `text` and an `onChange` that parsed free text; after the change they pass `valueIso` plus `onSelectDate`, and `DateFormField` forwards the same props.
- Filters call `DateQuickSelector` without `helperText`; they must now receive the default hint and keep `""` as a valid empty range.
- The last used date is a past date that may also be today or yesterday; the summary compares against all three so the hint stays consistent with the selected chip.
- Keep the 44pt chip height and the 48x48 calendar touch target; the pinned slot must not shrink the chip group into horizontal scrolling.
- Out of scope: new quick options, relative date labels beyond today/yesterday/last, timezone handling and any change to `shared/utils/date.ts`.

## Validation Plan
- Open each date field (movement, transfer, shared expense, settlement, filters) and confirm there is no text input.
- Check the layout at 320pt, at the smallest and largest supported text sizes and in Spanish/English: the calendar stays on the chips row, at the right edge.
- Select today, yesterday, the last used date and a calendar date; confirm the summary switches exactly as specified.
- Confirm the last used chip still appears only where it did before and still writes its date.
- Try a future date in the movement and settlement forms and confirm `DATE_IN_FUTURE` still blocks it; try an invalid date before the input removal path is gone.
- Check light/dark and screen reader: the summary and the error are announced once, in the same slot.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-005 date picker UX (calendar modal, quick chips and last used date, delivered)
- No dependency on the settlement or wallet work; it can ship before or after TICKET-062
