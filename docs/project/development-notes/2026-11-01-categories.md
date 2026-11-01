# Session Note: Categories Management (TICKET-004)

**Date:** 31/10/2026 - 01/11/2026
**Ticket:** TICKET-004 / PM-010

**Status:** Done

## Summary

Replaced the fixed transaction category list with user-configurable categories
stored in Firestore. Users can list, create, edit and delete categories from a
new screen reached from Settings, and they can create a category inline from the
transaction form without leaving it. Existing transactions keep their old
category ids and are never rewritten.

Transfers intentionally remain uncategorized, matching the agreed ticket scope.

## Architecture

Feature-first layout under `features/categories/`:

| Layer | Files |
|---|---|
| Types | `types/category.types.ts` |
| Validation | `schemas/category-validation.types.ts`, `category-field-validation.ts`, `category.schema.ts` |
| Utilities | `utils/category-options.ts`, `default-categories.ts`, `category-form-defaults.ts`, `category-delete-dialog.ts` |
| Repository | `repositories/category.repository.ts`, `firebase-category.repository.ts`, `category.mapper.ts` |
| Service | `services/category.service.ts`, `category.errors.ts`, `category.factory.ts` |
| Hooks | `hooks/use-categories.ts`, `use-categories-screen.ts`, `use-category-mutations.ts`, `use-category-creator.ts`, `use-category-form.ts`, `use-category-service.ts` |
| UI | `components/categories-screen.tsx`, `category-form.tsx`, `category-form-modal.tsx`, shared form fields/selectors, list/header/states |
| Styles | `styles/categories.styles.ts`, `category-form.styles.ts` |

Transaction integration:

- `utils/transaction-options.ts` now derives picker categories from `Category[]`
  and resolves a transaction category by document id or `legacyId`.
- `transaction-form-category-field.tsx` owns the picker plus the shared category
  creation modal and selects the new category automatically.
- `utils/transaction-filters.ts` matches both ids, so old movements stay visible
  when filtering by the new category.
- `transaction-filters-modal.tsx` shows all categories when the type filter is
  "all".

## Data and backward compatibility

- Collection: root `categories`. Documents store `name`, `icon`, `color`, `type`
  (`expense`/`income`), `ownerId`, timestamps and optional `legacyId`.
- Defaults are seeded lazily only when the owner has zero categories. Their ids
  are deterministic (`${ownerId}__${legacyId}`), so seeding is idempotent.
- Consequence: deleting the last category re-seeds the defaults on the next load.
- Default categories keep the previous transaction ids (`food`, `salary`, ...) in
  `legacyId`. Existing transactions are resolved by `id` or `legacyId` and are
  never migrated or rewritten.
- Deletion is a hard delete and is blocked while any transaction uses the
  category; usage checks match both the document id and `legacyId`.
- Category `type` is locked after creation in the UI, the service
  (`CATEGORY_TYPE_LOCKED`) and Firestore rules.

## Service behavior

- `getCategories` normalizes the owner, loads categories and seeds defaults when
  the result is empty.
- `createCategory` validates and normalizes name/icon/color/type.
- `updateCategory` checks existence and rejects type changes, then updates only
  the editable fields.
- `deleteCategory` checks existence and transaction usage before deleting.
- `TransactionService` now receives an `ICategoryRepository` and verifies that
  the selected category exists and matches the movement type before writing.

## UI

- Settings has a "Categorías" entry that opens the root `/categories` route.
- Categories screen: header with add action, type filter chips (Todas / Gastos /
  Ingresos) in the list header, list cards, empty/loading/error states,
  pull-to-refresh and a create FAB. Creating from a filtered view preselects that
  type in the form; the empty state adapts when a filter has no results.
- Shared `CategoryFormModal` handles create and edit, locks the type when
  editing and exposes an optional delete action.
- Transaction form: category chips for the current type plus a "Nueva" chip that
  opens the same modal with `overFullScreen`; the created category is appended to
  the list and selected automatically.
- Transaction filters include user categories and match legacy ids.
- Transactions screen blocks create/filter chrome until categories are loaded and
  refreshes categories when the tab regains focus.

## Rules

Added an owner-only `categories/{categoryId}` block to `firestore.rules`:
read/delete for the owner, create when `ownerId == request.auth.uid`, and update
for the owner preserving the owner and the category `type`.

**Pending manual step:** publish `firestore.rules` to `misgastos-61e15` with
`npx firebase-tools deploy --only firestore:rules`.

## Tests

Added tests for:

- category schema normalization and field error mapping;
- category options, legacy ids and deterministic default ids;
- category form defaults;
- category type filtering and filter-aware empty copy;
- category document mapper, including invalid docs and timestamps;
- Firebase category repository reads, writes, seeding and usage counting;
- category service read/create/update/delete flow, including in-use deletion;
- transaction category validation (document ids, legacy ids, type mismatch);
- transaction filtering by both ids;
- transaction service category existence/type checks.

## Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
```

All pass (41 suites, 190 tests). Firestore rules deployment remains pending.
