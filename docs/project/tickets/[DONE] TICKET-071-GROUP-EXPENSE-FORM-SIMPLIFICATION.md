# [DONE] TICKET-071 - Group Expense Form Simplification

**Type:** UX  
**Priority:** Medium  
**Status:** ✅ Done (23/11/2026)  
**Related:** TICKET-009, TICKET-069  
**Sprint:** Post-MVP / Phase 6

## Description
Align the group-expense form with the 1:1 form after user feedback: remove the
**Todos** shortcut from **Participantes** and offer only **Igual** and **Importe**
in **Cómo dividir**, while keeping any expense already stored with percentage or
shares fully editable.

## Requirements
- [x] Remove the **Todos** button from **Participantes**; all active members stay
      selected by default and the per-member toggles keep working
- [x] Remove the select-all state, handler, copy keys and styles, and leave no
      dead exports
- [x] **Cómo dividir** offers only **Igual** and **Importe** for new expenses and
      for mode changes
- [x] An expense already stored with **Porcentaje** or **Partes** keeps that mode
      visible and selected on edit, can be saved unchanged and can switch to
      **Igual** or **Importe**
- [x] Keep the four modes in the domain, schema, mapper and stored documents; no
      migration, service or rules change
- [x] Add tests for the visible-mode list and the participant selection utilities

## Acceptance Criteria
- [x] The form no longer renders a **Todos** control and a create still starts
      with every active member selected
- [x] Only **Igual** and **Importe** are offered in a normal create or edit
- [x] Editing a legacy percentage/shares expense shows its stored chip and saves
      without changing the mode
- [x] No document, schema, service, rule or index changes are introduced

## Implemented

### Changes
- New pure `getVisibleGroupSplitModes` and `VISIBLE_GROUP_SPLIT_MODES`
  (`features/group-expenses/utils/group-expense-split-modes.ts`). A normal
  create/edit offers `equal` and `fixed`; a stored `percentage`/`shares`
  expense adds its own mode in canonical order, so it can be saved unchanged or
  switched to an offered mode.
- `GroupExpenseSplitModeChips` renders that list; the four modes remain in the
  domain, schema, mapper, detail labels and stored documents.
- Removed the **Todos** control and its state: the `GroupExpenseParticipantsField`
  header row, `toggleAllParticipants`, the `toggleAllGroupExpenseParticipants`
  and `areAllGroupExpenseParticipantsSelected` utils, the `form.selectAll*` copy
  in both locales and the `participantsHeader`/`selectAllChip`/`selectAllText`
  styles. Every active member is still selected by default and each row toggles
  independently.
- No schema, service, repository, rules, index, ledger or wallet-link change.

### Verification
- `npx tsc --noEmit` and `npx expo lint` clean.
- `npm run check:copy` passed (315 TSX files).
- `npx jest --coverage`: **344 suites / 2157 tests**, coverage **98.96 %
  statements / 94.74 % branches / 98.6 % functions / 99.52 % lines**.
- New `group-expense-split-modes.test.ts` covers the visible list, the legacy
  percentage/shares fallback and the stable visible reference. Manual device
  validation is pending.

## Technical Notes
- Mirror the 1:1 `SharedExpenseSplitModeChips.present` list
  (`shared-expense-split-mode-chips.tsx`): `VISIBLE_SPLIT_MODES` stays
  `["equal", "fixed"]`, and the chip list adds the current mode when it is
  `percentage` or `shares`, preserving the canonical mode order, so a stored
  expense is never trapped. Put the list builder in a pure util and test it.
- `toggleAllGroupExpenseParticipants` and
  `areAllGroupExpenseParticipantsSelected` become unused and are removed with
  their tests; the form state, controller and body drop `toggleAllParticipants`.
- Copy `form.selectAll`, `form.selectAllAccessibility` and `form.selectAllHint`
  are removed from both locales; `form.splitPercentage` and `form.splitShares`
  stay because the legacy chips still render them.
- Styles `participantsHeader`, `selectAllChip` and `selectAllText` are removed
  when unused.
- No change to the group ledger, balances or the TICKET-069 wallet link.

## Dependencies
- TICKET-009 Group expenses (form, split engine and detail)
