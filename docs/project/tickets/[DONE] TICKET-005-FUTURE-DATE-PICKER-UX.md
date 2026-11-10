# [DONE] TICKET-005 - Future: Date Picker UX

**Type:** Enhancement  
**Priority:** Medium  
**Status:** ✅ Done  
**Related:** TICKET-002, TICKET-003  
**Sprint:** Post-MVP  

## Description
Standardize date selection across the app with quick actions optimized for mobile.

## Requirements
- [x] In all places where a date can be selected (transactions, transfers, filters, etc.), show quick actions in a row: "Hoy" (DD/MM) and "Ayer" (DD/MM)
- [x] Add a calendar button to open a native/date picker for selecting any date more easily (avoid free text entry as the primary flow)
- [x] Keep manual input as fallback if needed, but prioritize quick selection
- [x] Ensure consistent formatting (DD/MM/AAAA or display as DD/MM) and timezone-safe handling (use local date logic already present)
- [x] Update transaction form and any future transfer/filter date inputs
- [x] Consider dark/light theme and mobile-friendly hit areas
- [x] Keep the calendar button contiguous to the quick chips instead of pinned to the right edge
- [x] Add an "Último (DD/MM)" chip before "Hoy" in movement/transfer forms after a successful save in the current session, preselected for new records (hidden when it matches Hoy/Ayer; not shown in filters)

## Technical Notes
- Reference: expense manager style quick date buttons + calendar icon (see attached reference)
- Reuse existing date utilities (`features/transactions/utils/transaction-date.ts`)
- Prefer a shared `DateQuickSelector` component for reuse
- Use platform date picker (`@react-native-community/datetimepicker`) or Expo equivalent if needed
- Keep validation consistent with current schema

## Implementation Notes
- `DateQuickSelector` lives in `shared/components/molecules/` and is reused by
  the transaction form, transfer form and both filter fields (Desde/Hasta).
- Date utilities moved from `features/transactions/utils/transaction-date.ts` to
  `shared/utils/date.ts` so shared components never depend on a feature. Local
  calendar helpers (`parseIsoDateToLocalDate`, `toLocalIsoDate`) keep timezone
  handling safe; quick options live in `shared/utils/date-quick-options.ts`.
- Native picker installed as `@react-native-community/datetimepicker@8.4.4`
  (Expo SDK 54 compatible). Android uses the platform dialog; iOS uses a
  bottom-sheet modal with Cancelar/Listo actions.
- The calendar button sits at the right of the Hoy/Ayer chips and is available on
  every platform. Since the native library has no web support,
  `date-picker-modal.web.tsx` renders a lightweight in-app calendar grid
  (Monday-first weeks, month navigation, Hoy shortcut) built from
  `shared/utils/date-calendar.ts`.
- Manual `DD/MM/AAAA` input is still supported and remains the fallback; schema
  validation is unchanged.
- The calendar button now follows the chips in the same row (no `marginLeft:
  "auto"`), so it stays visually attached to Hoy/Ayer on every platform.
- `shared/utils/last-used-date-store.ts` keeps the last saved movement date in
  memory for the current app session. Successful transaction/transfer saves call
  `rememberLastUsedDate`, and `shared/hooks/use-last-used-date.ts` exposes the
  value through `useSyncExternalStore`.
- `DateQuickSelector` accepts an opt-in `showLastUsedDate` prop, used only by the
  transaction/transfer forms. `getLastUsedDateOption` hides invalid values and
  dates that duplicate Hoy/Ayer, and filters keep their existing two-chip row.
- New movement/transfer forms start with `getDefaultMovementIsoDate`, which
  returns the last used date while its chip is visible and today otherwise. The
  `Último` chip therefore starts selected on create; editing keeps the record's
  own date and only marks the chip if it matches.
