# TICKET-066 - Single Category Picker Button with Mandatory Selection

**Type:** UX  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** TICKET-028, TICKET-050, TICKET-051, TICKET-030  
**Sprint:** Post-MVP / Phase 6.0

## Description
Category fields still render up to three chips plus a `+` chip, and a new movement starts with the first category of its type already selected, so the user can save without ever looking at it. Replace the chip row with one **Seleccionar categoría** button (the chosen category's icon and name once there is a selection), stop preselecting a category in movements, and make the missing category a real validation error.

## Requirements
- [ ] Add one category control that reads **Seleccionar categoría** when empty and the selected category icon + name once chosen, with a chevron and a 44pt+ touch target
- [ ] Use it in the three category pickers: `features/transactions/components/transaction-form-category-selector.tsx`, `features/shared-expenses/components/shared-expense-category-field.tsx` and `features/settlements/components/settlement-form-category-chips.tsx` (rename the last one to a `…-field` component)
- [ ] Keep the existing popups and their behavior: type-filtered category list, selected row, inline creation with `CategoryFormModal`, and the shared-expense/settlement pickers that never create categories
- [ ] Give the settlement category the same popup pattern instead of rendering every option inline, since it currently has no dialog and the list grows with the user's categories
- [ ] Remove the category default in `features/transactions/utils/transaction-form-defaults.ts` (`getDefaultCategoryId`) so a new movement starts with an empty `categoryId`
- [ ] Remove the type-change default in `features/transactions/hooks/use-transaction-form.ts`: switching between expense and income clears an incompatible category and leaves the field empty
- [ ] Keep the stored category, including legacy `legacyId` resolution, when editing a movement, shared expense or settlement
- [ ] Add an explicit `CATEGORY_REQUIRED` code in `features/transactions/schemas/transaction-category-validation.ts` for an empty value, keep `INVALID_CATEGORY` for unknown or type-mismatched ids, and translate the new code in `features/transactions/locales/{es,en}.json`
- [ ] Surface the error under the field and in the notice above the actions, so saving without a category never writes and never relies on a disabled button
- [ ] Delete `features/transactions/utils/transaction-category-chips.ts` (`getTransactionCategoryChips`, `COMPACT_CATEGORY_LIMIT`), `SHARED_EXPENSE_CATEGORY_CHIP_LIMIT`/`getSharedExpenseCategoryChips` where the chips disappear, and their tests
- [ ] Update `form.noCategories` (it mentions "Usa + para crear una"): with no categories the button still opens the picker, which keeps the create action
- [ ] Leave the transaction category filter untouched: it filters a list and allows "all"
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] No form preselects a category: new movements, shared expenses and settlement incomes start with **Seleccionar categoría**
- [ ] The button shows the chosen category's icon and name, and reopening the popup changes it
- [ ] Saving a movement without a category shows the translated field error and writes nothing
- [ ] The error clears as soon as a category is chosen
- [ ] Switching the movement type clears an incompatible category and requires a new one
- [ ] Editing keeps the stored category, including legacy categories
- [ ] With zero categories the button opens the picker and the picker still creates one
- [ ] The settlement income category uses the same popup and stays required only when a wallet is linked
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- Three different implementations exist today: transactions use `TransactionCategoryPickerDialog` plus a chip limit, shared expenses use `SharedExpenseCategoryPickerDialog` plus `SHARED_EXPENSE_CATEGORY_CHIP_LIMIT`, and settlements render every option inline in `settlement-form-category-chips.tsx`. Converge on the transactions pattern (single trigger + dialog) so a growing category list never widens the form.
- The trigger belongs with each feature because the option shapes differ (`TransactionCategory`, `SharedExpenseCategoryOption`, `SettlementIncomeCategory`); only the visual contract is shared (icon + label + chevron, label passed by the caller), consistent with the wallet ticket.
- Empty-category validation: `getTransactionCategoryIssue` already returns `INVALID_CATEGORY` for `""`; split it into `CATEGORY_REQUIRED` (empty) and `INVALID_CATEGORY` (unknown or type mismatch) so the copy can say "Selecciona una categoría". The shared-expense (`CATEGORY_REQUIRED` in `shared-expense-wallet-validation.ts`) and settlement (`CATEGORY_REQUIRED` in `settlement.schema.ts`) schemas already require the category only when a wallet is linked, so no rule changes.
- The error notice above the actions follows the TICKET-049/TICKET-050 pattern (`error ?? first field error` as an `accessibilityRole="alert"` message); the inline field error stays.
- Defaults: `getDefaultCategoryId` has only the two call sites in `transaction-form-defaults.ts` and `use-transaction-form.ts`; verify with grep before deleting it. `getTransactionCategoryOptions` still filters by type, so the type change must clear the value instead of picking another.
- Copy proposal: keep `form.selectCategory` = **Seleccionar categoría**, add `form.selectedCategoryAccessibility` "Categoría: {{name}}. Cambiar" and `form.selectCategoryRequired` "Selecciona una categoría para continuar"; add `form.categoryPickerTitle`/`categoryPickerEmpty`/`categoryPickerClose` to the settlements namespace for the new dialog.
- Out of scope: category reordering (TICKET-030), category management screens, the filter dialogs, and any schema, document or rules change.

## Validation Plan
- Open a new movement: no category is selected and the button reads **Seleccionar categoría**.
- Save without a category and confirm the field error plus the notice, with no document written.
- Choose a category from the popup, confirm the button shows its icon and name, and save.
- Switch expense → income and confirm the category clears and the list only shows income categories.
- Create a category from the popup and confirm it is selected and used by the movement.
- Add enough categories to exceed three and confirm the field does not grow and the popup lists all of them.
- Repeat on a shared expense with a linked wallet and on a settlement income; confirm the category is required only there.
- Edit a movement made with a legacy category and confirm it still resolves and saves.
- Check light/dark, Spanish/English and screen reader labels on the trigger and the dialog.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-028 compact category selector (delivered; the chip model this ticket replaces)
- TICKET-050/TICKET-051 mandatory shared-expense category (delivered; keeps the "required only with a wallet" rule)
- TICKET-030 category ordering (delivered; the popup keeps that order)
- TICKET-065 single wallet picker (shared visual contract for the trigger)
