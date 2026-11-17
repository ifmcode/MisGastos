# Session note - Category ordering (TICKET-030)

**Date:** 12/11/2026

## Problem
The categories screen could only sort by creation date, and the movement form
inherited that same immutable order. Users had no way to put the categories
they use most at the front, and any future sorting change in one place would
have drifted from the other.

## Decision
- The order is persisted once per category as `sortOrder` (ascending). It is
  the only ordering input for the categories screen, the movement form chips,
  the **Seleccionar categoría** popup and the transaction filters.
- `features/categories/utils/category-order.ts` owns the pure ordering rules:
  `compareCategories`, `getNextSortOrder`, `renumberCategories`,
  `applyCategoryOrder` and `moveCategory`.
- Documents created before this ticket have no `sortOrder` and keep their old
  `createdAt`/`name` order until the owner reorders. The first reorder writes
  explicit positions for every category, so no migration script is needed.
- Reordering is a mode in the categories screen (**Reordenar** / **Listo**)
  with explicit ↑/↓ controls instead of drag-and-drop: no new dependency, and
  it works on web with accessible labels.
- The screen no longer offers the **Todas** filter: it shows **Gastos** and
  **Ingresos** only and opens on **Gastos**, which also keeps reordering
  unambiguous per type.
- A move swaps the category with the previous/next visible category. With
  **Todas** the neighbour is adjacent; with a type filter it is the next
  category of that type, so the other type keeps its relative position.
- Persistence goes through `CategoryService.reorderCategories`, which ignores
  unknown/duplicate ids, appends missing categories and skips the write when
  nothing changed. The hook applies the move optimistically and restores the
  previous array when the batched write fails.
- New categories (including inline creation from the movement form) receive
  `sortOrder = max + 1`; seeded defaults use their definition index.

## Files
- `features/categories/utils/category-order.ts` + tests
- `features/categories/services/category.service.ts` (`reorderCategories`)
- `features/categories/repositories/firebase-category.repository.ts`
  (`updateCategoryOrders`, ordered reads, append-on-create, seeded order)
- `features/categories/hooks/use-category-reorder.ts`
- `features/categories/components/categories-list.tsx`,
  `categories-list-header.tsx`, `categories-reorder-toggle.tsx`,
  `category-reorder-actions.tsx`, updated `category-card.tsx` and
  `categories-screen.tsx`
- Styles in `features/categories/styles/categories.styles.ts`

## Verification
`npx tsc --noEmit`, `npx expo lint` and `npx jest --runInBand`
(85 suites / 418 tests).

## Follow-ups
- Drag-and-drop reordering is intentionally out of scope.
- Ordering currently affects pickers and the categories screen; dashboard
  statistics and budgets should consume the same order when they exist.
