# TICKET-028 - Future: Compact Category Selector

**Type:** Improvement  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-028; TICKET-002, TICKET-004  
**Sprint:** Post-MVP  

## Description
In the new/edit movement form, replace the full category grid with a compact selector: three category chips plus a final `+` chip. The `+` chip opens a **Seleccionar categoría** popup that lists every category and keeps the inline **Nueva** action.

## Requirements
- [ ] Show at most four chips in the form: up to three categories and a final `+` chip
- [ ] Always keep the selected category visible among the compact chips
- [ ] Open a popup titled **Seleccionar categoría** from the `+` chip
- [ ] List every category for the current movement type inside the popup
- [ ] Keep the **+ Nueva** action inside the popup and reuse the existing category creation flow
- [ ] Close the popup after selecting a category
- [ ] Show the selected category in the form after the popup closes
- [ ] Handle zero categories, fewer than three categories and many categories
- [ ] Add accessibility labels and keyboard/tap handling for web
- [ ] Add tests for the visible-chip limit, popup contents and inline creation

## Acceptance Criteria
- [ ] The form never renders more than four category chips inline
- [ ] The last inline chip is always the `+` action, never a category
- [ ] The selected category is visible before opening the popup
- [ ] The popup lists all categories of the current type, including those beyond the first three
- [ ] **+ Nueva** creates a category and selects it in the movement form
- [ ] Switching between expense and income shows the correct category set
- [ ] The existing validation and required-category message still work

## Technical Notes
- `TransactionFormCategorySelector` currently renders every category. Split it into a compact selector and a popup/list component.
- Keep the popup state in `TransactionFormCategoryField`, which already owns `useCategoryCreator` and the `CategoryFormModal`.
- The category field receives `typeCategories`; preserve that filtering so expense and income never mix.
- Make the popup a project-owned modal/dialog, consistent with the existing form modals, so it works on web.
- Keep the inline creation modal open/close flow unchanged; do not add a second creation path.
- Do not change the categories screen itself.

## Dependencies
- TICKET-002 Transactions
- TICKET-004 Categories and inline creation
