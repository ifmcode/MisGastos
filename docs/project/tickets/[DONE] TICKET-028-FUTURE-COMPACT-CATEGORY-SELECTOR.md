# [DONE] TICKET-028 - Compact Category Selector

**Type:** Improvement  
**Priority:** Medium  
**Status:** ✅ Done (12/11/2026)  
**Related:** PM-028; TICKET-002, TICKET-004  
**Sprint:** Post-MVP  

## Description
In the new/edit movement form, replace the full category grid with a compact selector: three category chips plus a final `+` chip. The `+` chip opens a **Seleccionar categoría** popup that lists every category and keeps the inline **Nueva** action.

## Requirements
- [x] Show at most four chips in the form: up to three categories and a final `+` chip
- [x] Always keep the selected category visible among the compact chips
- [x] Open a popup titled **Seleccionar categoría** from the `+` chip
- [x] List every category for the current movement type inside the popup
- [x] Keep the **+ Nueva** action inside the popup and reuse the existing category creation flow
- [x] Close the popup after selecting a category
- [x] Show the selected category in the form after the popup closes
- [x] Handle zero categories, fewer than three categories and many categories
- [x] Add accessibility labels and keyboard/tap handling for web
- [x] Add tests for the visible-chip limit, popup contents and inline creation

## Acceptance Criteria
- [x] The form never renders more than four category chips inline
- [x] The last inline chip is always the `+` action, never a category
- [x] The selected category is visible before opening the popup
- [x] The popup lists all categories of the current type, including those beyond the first three
- [x] **+ Nueva** creates a category and selects it in the movement form
- [x] Switching between expense and income shows the correct category set
- [x] The existing validation and required-category message still work

## Technical Notes
- `TransactionFormCategorySelector` currently renders every category. Split it into a compact selector and a popup/list component.
- Keep the popup state in `TransactionFormCategoryField`, which already owns `useCategoryCreator` and the `CategoryFormModal`.
- The category field receives `typeCategories`; preserve that filtering so expense and income never mix.
- Make the popup a project-owned modal/dialog, consistent with the existing form modals, so it works on web.
- Keep the inline creation modal open/close flow unchanged; do not add a second creation path.
- Do not change the categories screen itself.

## Implemented
- `getTransactionCategoryChips` (with `COMPACT_CATEGORY_LIMIT = 3`) orders the selected category first and splits the collection into visible chips and popup-only categories.
- `TransactionFormCategorySelector` renders up to three category chips plus a dashed `+` chip; the `+` chip is always last and carries the **Seleccionar categoría** label/hint.
- `TransactionCategoryPickerDialog` is a project-owned transparent `Modal` titled **Seleccionar categoría** with a scrollable full list, selected state, close action and the **Nueva** button.
- `TransactionCategoryPickerOption` owns each popup row with radio role, selected state and screen-reader label.
- `TransactionFormCategoryField` owns the popup state, closes it on selection or before opening creation, and keeps using `useCategoryCreator` + `CategoryFormModal` so there is a single creation path.
- Zero categories show a helper plus the `+` chip; fewer than three show every category; many categories show the selected one first.
- Tests cover the three-chip limit, selected-category visibility, popup coverage, zero/fewer-than-three cases and the inline-created category becoming visible and selected.
- Verification: `npx tsc --noEmit`, `npx expo lint`, `npx jest --runInBand` (81 suites / 387 tests).

## Dependencies
- TICKET-002 Transactions
- TICKET-004 Categories and inline creation
