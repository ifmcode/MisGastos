# Single Category Picker Button with Mandatory Selection (TICKET-066, 22/11/2026)

## Context

The three category fields rendered chips. Movements and shared expenses showed up to
three options plus a `+` chip (`getTransactionCategoryChips` / `COMPACT_CATEGORY_LIMIT`
and `getSharedExpenseCategoryChips` / `SHARED_EXPENSE_CATEGORY_CHIP_LIMIT`), and
settlements rendered every option inline in `settlement-form-category-chips.tsx`, so the
form grew with the user's categories. New movements also preselected the first category
of their type through `getDefaultCategoryId`, which let the user save without ever
looking at the category.

## Decision

One trigger per field, no preselection, and a real validation error.

- **Shared trigger:** `shared/components/molecules/category-select-button.tsx`
  (`CategorySelectButton`) with `category-select-button.styles.ts`. It receives
  primitives only — `icon` or `null`, translated `label`, `accessibilityLabel`,
  `accessibilityHint`, `disabled`, `hasError`, optional `iconColor` and `onPress` — and
  renders a 52pt min-height button with a 36x36 icon bubble, a chevron, a dashed border
  while empty, the danger border on an error and pressed/disabled opacity. It imports no
  translation namespace and holds no colour constants, matching the shared-component
  rule; it only opens the popup.
- **Why each feature keeps its options:** the option shapes differ
  (`TransactionCategory`, `SharedExpenseCategoryOption`, `SettlementIncomeCategory`), so
  each feature resolves its own selected option, filters by type and passes the copy. Only
  the visual contract is shared, exactly as with the TICKET-065 wallet trigger.
- **Call sites:** `transaction-form-category-selector.tsx` became the movement trigger
  (label + button + `form.noCategories` + inline error) with no chips and no `onChange`,
  and its popup state stayed in `TransactionFormCategoryField`;
  `shared-expense-category-field.tsx` kept its dialog and swapped the chips for the
  trigger; `settlement-form-category-chips.tsx` was renamed to
  `settlement-form-category-field.tsx` (`SettlementFormCategoryField`) and gained
  `settlement-category-picker-dialog.tsx` + `settlement-category-picker-option.tsx`, the
  same popup pattern with a checkmark on the selected row and no create action.
  `SettlementIncomeCategory` gained `icon` (`getCategoryIconName`, `receipt-outline`
  fallback).
- **Split:** `transaction-form.tsx` was reduced to header + body and the scroll content
  moved to `transaction-form-body.tsx` to keep the 150-line rule.

## Defaults and validation

- `buildTransactionFormValues` starts a new movement with `categoryId: ""` and
  `getDefaultCategoryId` was deleted from `transaction-options.ts`.
- `resolveCategoryForTypeChange` (`features/transactions/utils/transaction-form-category.ts`)
  keeps only a category matching the new movement type and clears the rest;
  `use-transaction-form.ts` calls it, so switching expense ↔ income requires a new choice.
- `selectSettlementWallet(values, walletId)` never fills a category, keeps an existing one
  while a wallet remains and clears it when the wallet is cleared;
  `getSettlementDefaultCategoryId`, `defaultCategoryId` and the now-unused `categories`
  option left the settlement state, hook and controller. The category stays required only
  when a wallet is linked (TICKET-051/055).
- `CATEGORY_REQUIRED` was added to `TransactionValidationCode`: an empty or whitespace
  value returns it, an unknown id keeps `INVALID_CATEGORY` and a type mismatch keeps its
  own code.
- `features/transactions/utils/transaction-field-error.ts` translates codes for the field
  and for the notice (`CATEGORY_REQUIRED` → `form.selectCategoryRequired`, everything else
  through `validation:transactions.*`) and exposes `getFirstTransactionFieldError`.
- New `transaction-form-notice.tsx` renders `error ?? first field error` above the actions
  as an `accessibilityRole="alert"` notice, with the error tone for a service error and
  the notice tone for a field error; the top `ErrorBanner` stays. Saving without a
  category writes nothing and never relies on a disabled button.

## Legacy ids

- Movement edits keep resolving `legacyId`, and the trigger resolves it with
  `findTransactionCategoryOption`.
- The shared-expense and settlement option builders now carry `legacyId` and expose
  `findSharedExpenseCategoryOption` / `findSettlementIncomeCategoryOption`, so an old
  default category id stays selected in the trigger and the popup instead of rendering as
  an unavailable row; choosing a row stores the document id.
- The shared-expense `changeCategory` now clears its local error, matching the settlement
  form (reviewer finding).

## Deleted

`features/transactions/utils/transaction-category-chips.ts` and its test,
`getDefaultCategoryId`, `SHARED_EXPENSE_CATEGORY_CHIP_LIMIT`,
`getSharedExpenseCategoryChips` and its tests, `getSettlementDefaultCategoryId` and its
test, the chip styles of the three features, and `form.categoryPickerOpenAccessibility`.
The transaction name/category filter is untouched: it filters a list and allows "all".

## Review

`reviewer` verdict **approve with nits**, no blockers. The two minor findings and the
import/type nits were applied. `validation:transactions.CATEGORY_REQUIRED` is kept on
purpose: the typed dynamic `t(\`validation:transactions.${code}\`)` used by the
amount/concept/date/notes fields covers the whole code union and fails to compile without
that key.

## Consequences

- Every category field is a single **Seleccionar categoría** button and no record starts
  with a category chosen; the popup width is independent of the number of categories.
- A missing movement category is a field error plus a notice, translated in both
  languages, instead of a silently selected category.
- `features/shared-expenses/hooks/use-shared-expense-form-state.ts` was already 152 lines
  before this ticket (soft limit) and is now 153 after the one-line error clearing.

## Verification

- `npx tsc --noEmit` clean, `npx expo lint` clean (only Expo `env:` lines), `npx jest`
  332 suites / 2030 tests passed, coverage 98.95 % statements / 94.81 % branches /
  98.56 % functions / 99.51 % lines, `npm run check:copy` passed (315 TSX files).
- No schema, document, service, repository, money-helper, rules or route change; nothing to
  deploy.
- Pending: manual device validation (light/dark, screen reader and the real forms).
