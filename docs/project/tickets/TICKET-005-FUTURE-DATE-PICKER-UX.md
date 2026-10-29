# TICKET-005 - Future: Date Picker UX

**Type:** Enhancement  
**Priority:** Medium  
**Status:** ⏳ Future  
**Related:** TICKET-002, TICKET-003  
**Sprint:** Post-MVP  

## Description
Standardize date selection across the app with quick actions optimized for mobile.

## Requirements
- [ ] In all places where a date can be selected (transactions, transfers, filters, etc.), show quick actions in a row: "Hoy" (DD/MM) and "Ayer" (DD/MM)
- [ ] Add a calendar button to open a native/date picker for selecting any date more easily (avoid free text entry as the primary flow)
- [ ] Keep manual input as fallback if needed, but prioritize quick selection
- [ ] Ensure consistent formatting (DD/MM/AAAA or display as DD/MM) and timezone-safe handling (use local date logic already present)
- [ ] Update transaction form and any future transfer/filter date inputs
- [ ] Consider dark/light theme and mobile-friendly hit areas

## Technical Notes
- Reference: expense manager style quick date buttons + calendar icon (see attached reference)
- Reuse existing date utilities (`features/transactions/utils/transaction-date.ts`)
- Prefer a shared `DateQuickSelector` component for reuse
- Use platform date picker (`@react-native-community/datetimepicker`) or Expo equivalent if needed
- Keep validation consistent with current schema
