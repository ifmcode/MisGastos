# [DONE] TICKET-066 - Single Category Picker Button with Mandatory Selection

**Type:** UX  
**Priority:** High  
**Status:** ✅ Done (22/11/2026)  
**Related:** TICKET-028, TICKET-050, TICKET-051, TICKET-030  
**Sprint:** Post-MVP / Phase 6.0

## Description
Category fields still render up to three chips plus a `+` chip, and a new movement starts with the first category of its type already selected, so the user can save without ever looking at it. Replace the chip row with one **Seleccionar categoría** button (the chosen category's icon and name once there is a selection), stop preselecting a category in movements, and make the missing category a real validation error.

## Requirements
- [x] Add one category control that reads **Seleccionar categoría** when empty and the selected category icon + name once chosen, with a chevron and a 44pt+ touch target
- [x] Use it in the three category pickers: `features/transactions/components/transaction-form-category-selector.tsx`, `features/shared-expenses/components/shared-expense-category-field.tsx` and `features/settlements/components/settlement-form-category-chips.tsx` (rename the last one to a `…-field` component)
- [x] Keep the existing popups and their behavior: type-filtered category list, selected row, inline creation with `CategoryFormModal`, and the shared-expense/settlement pickers that never create categories
- [x] Give the settlement category the same popup pattern instead of rendering every option inline, since it currently has no dialog and the list grows with the user's categories
- [x] Remove the category default in `features/transactions/utils/transaction-form-defaults.ts` (`getDefaultCategoryId`) so a new movement starts with an empty `categoryId`
- [x] Remove the type-change default in `features/transactions/hooks/use-transaction-form.ts`: switching between expense and income clears an incompatible category and leaves the field empty
- [x] Keep the stored category, including legacy `legacyId` resolution, when editing a movement, shared expense or settlement
- [x] Add an explicit `CATEGORY_REQUIRED` code in `features/transactions/schemas/transaction-category-validation.ts` for an empty value, keep `INVALID_CATEGORY` for unknown or type-mismatched ids, and translate the new code in `features/transactions/locales/{es,en}.json`
- [x] Surface the error under the field and in the notice above the actions, so saving without a category never writes and never relies on a disabled button
- [x] Delete `features/transactions/utils/transaction-category-chips.ts` (`getTransactionCategoryChips`, `COMPACT_CATEGORY_LIMIT`), `SHARED_EXPENSE_CATEGORY_CHIP_LIMIT`/`getSharedExpenseCategoryChips` where the chips disappear, and their tests
- [x] Update `form.noCategories` (it mentions "Usa + para crear una"): with no categories the button still opens the picker, which keeps the create action
- [x] Leave the transaction category filter untouched: it filters a list and allows "all"
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] No form preselects a category: new movements, shared expenses and settlement incomes start with **Seleccionar categoría**
- [x] The button shows the chosen category's icon and name, and reopening the popup changes it
- [x] Saving a movement without a category shows the translated field error and writes nothing
- [x] The error clears as soon as a category is chosen
- [x] Switching the movement type clears an incompatible category and requires a new one
- [x] Editing keeps the stored category, including legacy categories
- [x] With zero categories the button opens the picker and the picker still creates one
- [x] The settlement income category uses the same popup and stays required only when a wallet is linked
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

Delivered and verified on 22/11/2026. Session note:
[`session-notes/2026-11-22-single-category-picker.md`](../development-notes/session-notes/2026-11-22-single-category-picker.md).

### Single trigger

- New shared molecule `shared/components/molecules/category-select-button.tsx` (`CategorySelectButton`) plus `category-select-button.styles.ts`: primitives only (`icon` or `null`, translated `label`, `accessibilityLabel`, `accessibilityHint`, `disabled`, `hasError`, optional `iconColor`, `onPress`), 52pt min height, 36x36 icon bubble, chevron, dashed border when empty, danger border on error, pressed/disabled opacity, no translation namespace and no colour constants. Each feature resolves its own option shape and passes the copy.
- `features/transactions/components/transaction-form-category-selector.tsx` is now the movement trigger (label + button + `form.noCategories` + inline error); no chips, no `onChange`, popup state stays in `TransactionFormCategoryField`.
- `features/shared-expenses/components/shared-expense-category-field.tsx` keeps its dialog and now renders the trigger instead of chips.
- `features/settlements/components/settlement-form-category-chips.tsx` was renamed to `settlement-form-category-field.tsx` (`SettlementFormCategoryField`), with new `settlement-category-picker-dialog.tsx` and `settlement-category-picker-option.tsx`: same popup pattern as the other two, selected row with checkmark, no create action; `SettlementIncomeCategory` gained `icon` (`getCategoryIconName`, `receipt-outline` fallback).

### No preselection and validation

- `buildTransactionFormValues` starts a new movement with `categoryId: ""`; `getDefaultCategoryId` was deleted from `transaction-options.ts`.
- `resolveCategoryForTypeChange` (`utils/transaction-form-category.ts`) keeps only a category matching the new movement type and clears the rest; `use-transaction-form.ts` calls it.
- `selectSettlementWallet(values, walletId)` never fills a category, keeps an existing one while a wallet remains and clears it when the wallet is cleared; `getSettlementDefaultCategoryId`, `defaultCategoryId` and the now-unused `categories` option left the settlement state/hook/controller.
- `CATEGORY_REQUIRED` added to `TransactionValidationCode`; empty/whitespace → `CATEGORY_REQUIRED`, unknown id → `INVALID_CATEGORY`, type mismatch unchanged.
- `utils/transaction-field-error.ts` translates codes for the field and the notice (`CATEGORY_REQUIRED` → `form.selectCategoryRequired`, rest → `validation:transactions.*`) and exposes `getFirstTransactionFieldError`.
- New `transaction-form-notice.tsx` renders `error ?? first field error` as an `accessibilityRole="alert"` notice above the actions (error tone for a service error, notice tone for a field error); the top `ErrorBanner` stays.
- `transaction-form.tsx` was reduced to header + body and the scroll content moved to `transaction-form-body.tsx` to respect the 150-line rule.

### Legacy ids

- Movement edit keeps resolving `legacyId` (unchanged) and the trigger resolves it with `findTransactionCategoryOption`.
- Shared expense and settlement option builders now carry `legacyId` and expose `findSharedExpenseCategoryOption` / `findSettlementIncomeCategoryOption`, so an old default category id stays selected (trigger and popup) instead of becoming an "unavailable" row; choosing a row stores the document id.
- Shared-expense `changeCategory` now clears its local error, matching the settlement form (reviewer finding).

### Deleted

- `features/transactions/utils/transaction-category-chips.ts` + its test, `getDefaultCategoryId`, `SHARED_EXPENSE_CATEGORY_CHIP_LIMIT`, `getSharedExpenseCategoryChips` + its tests, `getSettlementDefaultCategoryId` + its test, the chip styles in the three features, and `form.categoryPickerOpenAccessibility`.

### Review

- `reviewer` verdict **approve with nits** (no blockers); the two minor findings and the import/type nits were applied. The `validation:transactions.CATEGORY_REQUIRED` key is kept on purpose: the typed dynamic `t(\`validation:transactions.${code}\`)` of the amount/concept/date/notes fields covers the whole code union and fails to compile without it.

### Verification (22/11/2026)

- `npx tsc --noEmit` clean, `npx expo lint` clean (only Expo `env:` lines), `npx jest` **332 suites / 2030 tests passed**, coverage **98.95 % statements / 94.81 % branches / 98.56 % functions / 99.51 % lines**, `npm run check:copy` passed (315 TSX files).
- No schema, document, service, repository, money-helper, rules or route change; nothing to deploy.
- **Pending:** manual device validation (light/dark, screen reader and the real forms).
- Note: `features/shared-expenses/hooks/use-shared-expense-form-state.ts` was already 152 lines before this ticket (soft limit) and is now 153 after the one-line error clearing.

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
