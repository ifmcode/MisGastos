# [DONE] TICKET-030 - Category Ordering

**Type:** Improvement  
**Priority:** Medium  
**Status:** ✅ Done (12/11/2026)  
**Related:** PM-030; TICKET-002, TICKET-004, TICKET-028  
**Sprint:** Post-MVP  

## Description
Add manual ordering to the categories screen. The order chosen there must be the order used everywhere a category is picked, especially when creating or editing a movement (expense/income).

The order lives in one place: a persisted `sortOrder` field on each category. The categories screen, the movement form chips, the **Seleccionar categoría** popup and the transaction filters all read the same sorted collection, so they cannot drift apart.

The categories screen only offers **Gastos** and **Ingresos** and opens on **Gastos** by default; the **Todas** filter was removed.

## Requirements
- [x] Add an optional `sortOrder` number to the category model, mapper and Firestore document
- [x] Sort categories by `sortOrder` ascending through a single shared comparator used by the repository
- [x] Keep legacy categories without `sortOrder` working with the current fallback (`createdAt`, then `name`), with no mandatory data migration
- [x] Add a **Reordenar** mode to the categories screen, next to the type filter
- [x] Remove the **Todas** filter and open the categories screen on **Gastos** by default
- [x] Move each category up/down with explicit controls and disable the control at the edges
- [x] Persist the new order atomically and keep the list updated optimistically
- [x] Apply the same order to the movement form chips and the **Seleccionar categoría** popup
- [x] Append new categories, including inline creation from the movement form, at the end of the order
- [x] Assign deterministic `sortOrder` values when seeding the default categories
- [x] Add accessibility labels and web support for the reorder controls

## Acceptance Criteria
- [x] With the filter on **Gastos** or **Ingresos**, the list can be reordered and the result survives leaving and reopening the screen
- [x] The categories screen only offers **Gastos** e **Ingresos**, starting on **Gastos**
- [x] Reordering only swaps the neighbours of the selected type, so the other type keeps its relative order
- [x] The order shown in the categories screen is the same order shown when creating or editing a movement of that type
- [x] The **Seleccionar categoría** popup lists categories in that order
- [x] The selected category still appears first among the compact chips
- [x] Reordering cannot lose, duplicate or change the type of a category
- [x] A failed save restores the previous order and shows an error
- [x] Legacy categories ordered only by `createdAt`/`name` keep their current order until the user reorders
- [x] Existing category CRUD, validation, defaults and usage-guarded deletion still work

## Technical Notes
- **Where the order is lost today:** `FirebaseCategoryRepository.sortCategories` always sorts by `createdAt` then `name`, so no user order can survive a reload. The form already respects the repository order (`getCategoriesForType` filters without sorting); the only intentional exception is the selected-first chip row from TICKET-028.
- Add `sortOrder?: number` to `Category` and map it in `mapCategoryDocument`, ignoring non-finite or negative values. Keep it optional so existing documents map cleanly.
- Create `features/categories/utils/category-order.ts` with pure helpers:
  - `compareCategories(first, second)`: explicit `sortOrder` first, then the legacy `createdAt`/`name` fallback.
  - `moveCategory(categories, categoryId, direction, visibleIds)`: returns the reordered full array plus the changed `{ id, sortOrder }` entries.
  - `renumberCategories(categories)`: assigns `0..n-1` in the given order.
- A move swaps the category with the previous/next **visible** category, so hidden categories keep their relative position.
- Persist with a Firestore `writeBatch` that updates only `sortOrder` and `updatedAt` on changed documents. Add `updateCategoryOrders` to `ICategoryRepository` and `reorderCategories(ownerId, orderedIds)` to `CategoryService`, validating unique, non-empty ids that belong to the owner. Reordering never changes `type`, so `firestore.rules` needs no change.
- Keep reorder state in `useCategoriesScreen` or a dedicated `useCategoryReorder` that reuses the existing `mutating`/`mutationError` pattern: apply the new array with `setCategories`, snapshot the previous array and restore it when the write fails. Block concurrent reorders and disable the controls while saving.
- Assign `sortOrder` at creation time (`max + 1`) so new categories append; `useCategoryCreator` will therefore place a category created from the movement form at the end.
- `seedDefaultCategories` must write `sortOrder` by definition index so the seeded order matches `DEFAULT_CATEGORIES`.
- UI: a **Reordenar** pill next to the type filter toggles the mode. In reorder mode each card shows labelled ↑/↓ buttons instead of opening the edit form, the FAB is hidden and a **Listo** action leaves the mode. Keep the new styles in `features/categories/styles/` and do not add a drag-and-drop dependency for this ticket.
- Out of scope: drag-and-drop, per-wallet category order and reordering from other screens.

## Implemented
- `Category` now carries an optional `sortOrder`; the mapper accepts finite non-negative numbers and ignores anything else.
- `compareCategories` (`sortOrder`, then `createdAt`, then `name`) is the single comparator used by the repository, so every consumer receives the same order. Legacy documents without `sortOrder` keep their previous order.
- `getNextSortOrder`, `renumberCategories`, `applyCategoryOrder` and `moveCategory` are pure helpers in `features/categories/utils/category-order.ts`, covered for explicit/legacy/mixed ordering, edges, filtered moves, duplicate ids and missing categories.
- The categories screen adds a **Reordenar** toggle next to the type filter. In reorder mode cards swap the edit action for labelled ↑/↓ buttons, the FAB and header add button hide, and **Listo** returns to normal mode.
- The **Todas** filter was removed: the screen only offers **Gastos** and **Ingresos** and opens on **Gastos**. `CategoryTypeFilter` disappeared in favour of `CategoryType`, and `filterCategoriesByType` no longer has an unfiltered branch.
- Moves are optimistic and persisted with `CategoryService.reorderCategories` → `updateCategoryOrders` (a `writeBatch` updating only `sortOrder` + `updatedAt`); a failure restores the previous list and shows the error above the list. The service skips the write when the order is unchanged.
- New categories append with `sortOrder = max + 1` at the repository level, also covering inline creation from the movement form. Seeded defaults receive their definition index.
- The movement form chips and the **Seleccionar categoría** popup read the same ordered collection; the selected chip still moves first as defined in TICKET-028.
- Verification: `npx tsc --noEmit`, `npx expo lint`, `npx jest --runInBand` (85 suites / 418 tests).

## Dependencies
- TICKET-002 Transactions
- TICKET-004 Categories
- TICKET-028 Compact category selector
