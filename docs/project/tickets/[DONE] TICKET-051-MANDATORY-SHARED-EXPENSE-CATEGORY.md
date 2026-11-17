# [DONE] TICKET-051 - Mandatory Shared Expense Category and No Hidden Default

**Type:** Bug / Data
**Priority:** High
**Status:** ✅ Done (17/11/2026)
**Related:** TICKET-050, TICKET-048, TICKET-044
**Sprint:** Post-MVP / Phase 5.1

## Description
A linked shared expense (viewer pays with a wallet) could be saved without the user choosing a category because the service silently ensured/created the **Gastos compartidos** category (`resolveCategoryId`). The form showed no category selected, so the write either succeeded with a category the user never saw or failed with a `permission-denied` while creating that hidden category. The category must be explicit: the form blocks the save with `CATEGORY_REQUIRED` before any Firestore write, the service rejects the same payload, and no default category is created or applied behind the scenes. A social-only expense (friend pays, no movement) still needs no category.

## Requirements
- [x] Add `categoryId` to the shared-expense form fields and `CATEGORY_REQUIRED` to the validation codes; require it when the viewer pays and a wallet is linked
- [x] Remove the hidden `ensureSharedExpenseCategory` fallback from `resolveCategoryId`; the service must reject a linked value without a category and must not create/ensure a default
- [x] Remove the now-unused category-creation helper/public service method and keep only `getSharedExpenseCategoryId` for filtering/clearing the legacy system category
- [x] Show the translated category error under the category field and keep the visible notice above the form actions
- [x] Keep social-only expenses (friend pays, no wallet) valid with no category and no movement
- [x] Add colocated tests for the schema rule, the service rejection, the updated fixtures and the category-field error wiring
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] Saving a viewer-paid linked expense without a category is blocked before any Firestore write with a clear translated message
- [x] No default **Gastos compartidos** category is created or applied when the user does not select one
- [x] A friend-paid social-only expense remains valid without a category
- [x] The category error appears under the category field and in the notice above the actions
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- `resolveCategoryId` (`services/shared-expense-write.ts`) currently falls back to `ensureSharedExpenseCategory`; make it require a non-null `categoryId` for a linked movement and throw `CATEGORY_REQUIRED` otherwise.
- `ensureSharedExpenseCategory`/`SHARED_EXPENSE_CATEGORY` in `services/shared-expense-category.ts` and the public service method have no UI caller after this change; remove them and keep `getSharedExpenseCategoryId` for the picker filter and legacy clearing.
- The schema helper must default to a real category in tests; explicit no-category cases assert `CATEGORY_REQUIRED`.
- `errors.CATEGORY_REQUIRED` es/en is reused by the field and the service code.
- No Firestore rules change is required: the category is part of the expense/movement payload; the rules do not create categories.

## Validation Plan
- Create a viewer-paid linked expense without a category and confirm the field/notice error and no network write.
- Choose a category and confirm the save and the linked movement.
- Create a friend-paid expense with no category and confirm it still saves as social-only.
- Check es/en and light/dark.
- ⏳ Pending: manual device validation was not performed.

## Dependencies
- TICKET-044 (linked movement and category)
- TICKET-048/050 (mandatory wallet and picker feedback)

## Implemented
- Schema: `schemas/shared-expense-wallet-validation.ts` now derives `categoryId` and pushes `{ field: "categoryId", code: "CATEGORY_REQUIRED" }` when the viewer pays, a wallet is linked and no category was read; `schemas/shared-expense-validation.types.ts` and `services/shared-expense.errors.ts` accept the `CATEGORY_REQUIRED` code. The form field and the service share `errors.CATEGORY_REQUIRED` (es/en), so no new copy key was added.
- Service: `resolveCategoryId` in `services/shared-expense-write.ts` returns `null` only for a social-only expense and throws `SharedExpenseOperationError("CATEGORY_REQUIRED")` for a linked movement without a category; it no longer creates or ensures a default. `ensureSharedExpenseCategory`, `SHARED_EXPENSE_CATEGORY` and the public service method were removed; `services/shared-expense-category.ts` keeps only `SHARED_EXPENSE_CATEGORY_ID` and `getSharedExpenseCategoryId` for the picker filter and legacy clearing.
- UI: `components/shared-expense-linked-movement.tsx` resolves `errors.categoryId` and passes it to `SharedExpenseCategoryField` (`errorText`), which renders the translated message under the field; the existing alert notice above `FormActions` in `components/shared-expense-form-body.tsx` keeps showing `error ?? errors.<firstField>`, so the same save is also reported next to **Guardar**.
- Behaviour: the system **Gastos compartidos** category is still hidden from the linked-movement picker and never preselected (TICKET-050). A viewer-paid linked expense saved without a category is now blocked by the form before any Firestore write; the original `permission-denied` was a symptom of the hidden creation path. A friend-paid social-only expense stays valid with `categoryId: null` and no movement.
- Legacy: existing categories and movements are not migrated. A linked expense stored before this change keeps its stored category until edited; on the next edit the user must pick a real category.
- Tests: the schema rule (`schemas/__tests__/shared-expense.schema.wallet.test.ts` asserts `{ field: "categoryId", code: "CATEGORY_REQUIRED" }`), the service rejection on create and update (`services/__tests__/shared-expenses.service.create.test.ts`, `...update.test.ts`, `shared-expense-write.test.ts`), the updated default fixture with a real category (`schemas/__tests__/shared-expense-input.test-helpers.ts`), the social-only friend-paid path without a category and the trimmed category payload. `services/__tests__/shared-expense-category.test.ts` now only covers `getSharedExpenseCategoryId`, since the creation helper is gone. The category field wiring (`shared-expense-linked-movement.tsx` → `SharedExpenseCategoryField.errorText`) has no renderer test; the project has no React renderer, so it is exercised by type-checking and manual use only.
- No Firestore rules change; no deploy and no migration.

Verification (17/11/2026):
- `npx tsc --noEmit` clean; `npx expo lint` clean.
- `npx jest`: 213 suites / 1203 tests passed.
- `npm run test:coverage`: 99.07% statements, 94.83% branches, 99.02% functions, 99.50% lines.
- `npm run check:copy`: 222 TSX files.

Related note: [`2026-11-17-shared-expense-save-feedback.md`](../development-notes/2026-11-17-shared-expense-save-feedback.md) (TICKET-049/050/051).
