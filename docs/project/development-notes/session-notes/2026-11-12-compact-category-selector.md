# Session Note: Compact Category Selector (TICKET-028)

**Date:** 12/11/2026  
**Ticket:** TICKET-028 / PM-028  
**Status:** ✅ Done

## Summary

The movement form no longer renders the full category grid. It shows at most
three category chips plus a final dashed `+` chip. The `+` chip opens a
**Seleccionar categoría** popup that lists every category of the current movement
type, keeps the selected category marked and keeps the **Nueva** inline creation
action.

The selected category always leads the inline chips, so it stays visible even
when the collection is longer than three. Selecting a category closes the popup
and updates the form immediately. Creating a category closes the popup, opens
the existing category form modal, and selects the created category when it
finishes.

## Architecture

| Layer | Files |
|---|---|
| Chip model | `features/transactions/utils/transaction-category-chips.ts` |
| Compact chips | `features/transactions/components/transaction-form-category-selector.tsx` |
| Popup | `features/transactions/components/transaction-category-picker-dialog.tsx` |
| Popup row | `features/transactions/components/transaction-category-picker-option.tsx` |
| Popup state + creation | `features/transactions/components/transaction-form-category-field.tsx` |
| Styles | `features/transactions/styles/transaction-form.styles.ts` |
| Tests | `features/transactions/utils/__tests__/transaction-category-chips.test.ts` |

## Decisions

- **Pure chip model**: `getTransactionCategoryChips` moves the selected category
  to the front, returns up to `COMPACT_CATEGORY_LIMIT = 3` visible chips and
  reports the remaining categories as hidden. This keeps the chip rule testable
  without rendering React Native components.
- **Popup state stays in the field**: `TransactionFormCategoryField` already owns
  `useCategoryCreator` and `CategoryFormModal`, so it also owns `pickerVisible`.
  There is still a single category creation path.
- **Project-owned popup**: `TransactionCategoryPickerDialog` is a transparent
  `Modal` with an in-app card, close action and scrollable list, consistent with
  the existing form modals and usable on web. It is not a native alert.
- **Type filtering is preserved**: the field still receives `typeCategories` from
  `useTransactionForm`, so expense and income never mix. Switching type resets
  the category through the existing hook.
- **Selection closes the popup**: both selecting an option and pressing **Nueva**
  close the popup first; the creation modal opens over the movement form.
- **Accessibility**: the chips and popup rows use `radio` roles with selected
  state, the `+` chip is labelled **Seleccionar categoría**, the popup title is a
  header, and the close/create actions are labelled buttons. `Pressable` keeps
  tap and keyboard activation working on web.
- **File size**: the popup was split into a dialog and an option row so each
  component file stays under the 150-line soft limit.

## Manual platform checks

1. Open a new movement with many expense categories: exactly three category
   chips and the `+` chip render; the `+` chip is always last.
2. Select a category beyond the first three, close and reopen the form: the
   selected category appears among the inline chips.
3. Press `+`: the **Seleccionar categoría** popup lists every expense category,
   including those not shown inline.
4. Select a category from the popup: the popup closes and the form shows it.
5. Press **Nueva** in the popup: the existing category form opens with the type
   locked; create one and confirm it is selected in the movement form.
6. Switch to income: the chips and popup show only income categories.
7. Delete or use an account with zero categories: the `+` chip and the helper
   remain, and the popup offers **Nueva**.
8. Submit without a category: the existing required-category message still
   renders under the chips.
9. On web, tab to the chips, popup rows and actions and activate them with
   Enter/Space.

## Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
```

All pass (81 suites, 387 tests).
