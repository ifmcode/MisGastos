# [DONE] TICKET-049 - Shared Expense Link Feedback and Category Reset

**Type:** Bug / UX
**Priority:** Medium
**Status:** ✅ Done (17/11/2026)
**Related:** TICKET-048, TICKET-044, TICKET-045
**Sprint:** Post-MVP / Phase 5.1

## Description
A legacy viewer-paid shared expense without a wallet can keep a stored movement category (typically **Gastos compartidos**) in the edit form. The category looks selected even though the wallet is missing, the category block should not exist without a wallet, and pressing **Guardar** can look like a no-op because the submit button may be silently disabled or the only error is rendered far above the button. This ticket clears the stale category, hides the linked category until a wallet is chosen, always runs validation on submit and shows a visible, accessible notice next to the actions when the save is blocked.

## Requirements
- [x] Clear the linked category whenever `walletId` is empty when loading an expense, and trim whitespace before deciding whether a wallet exists
- [x] Never send a category without a wallet in the form payload
- [x] Do not render or list the linked category until a wallet is selected; **Gastos compartidos** must not appear as a stale selected option in the missing-wallet state
- [x] Remove the silent `canSubmit` disable from the shared-expense form so pressing **Guardar** always runs validation and explains what is missing
- [x] Show a visible validation notice above the form actions with the first field error, accessible as an alert, in addition to the inline field error
- [x] Make the existing `ErrorBanner` announce errors to assistive technology
- [x] Add tests for the category clearing/trimming and the payload without a wallet
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] Editing a legacy viewer-paid expense without a wallet shows no selected category and no **Gastos compartidos** option until a wallet is chosen
- [x] Choosing a wallet restores the normal category block and its default category
- [x] Pressing **Guardar** with the wallet missing always shows a visible notice near the button, so the form cannot look saved when it is not
- [x] No silent dead submit button remains in the shared-expense form
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- `fromSharedExpense` currently keeps `expense.categoryId` even when `walletId` is null/blank; the form state must normalize `walletId` with `trim()` and force `categoryId: ""` when there is no wallet.
- The linked movement block only renders its category after a wallet exists; options must not be built for the empty-wallet branch either.
- `FormActions.canSubmit` silently disables the submit; the shared-expense form should rely on validation and show the first error above the actions instead.
- `ErrorBanner` is reused; it needs an alert role/live region so the notice is announced.
- This is a UI/validation bug fix: no schema, service, repository, money, rules, route or Firestore change.

## Validation Plan
- Open a legacy viewer-paid expense without a wallet, check that the category is empty and absent from the list, press Guardar and confirm the notice appears next to the actions.
- Choose a wallet, confirm the category block returns with **Gastos compartidos**, and save.
- Check es/en and light/dark.
- Run the four verification commands.
- Pending: manual device validation was not performed for this ticket.

## Implemented

### Behaviour
- `fromSharedExpense` trims `expense.walletId` and forces `categoryId: ""` when the wallet is null, blank or whitespace, so a stored **Gastos compartidos** category can no longer survive without a wallet.
- `toSharedExpenseInput` sends `categoryId: ""` when the wallet is empty, even if the local state still holds one.
- `SharedExpenseLinkedMovement` only builds the category options and renders the category block when the trimmed wallet is non-empty, so the synthetic **Gastos compartidos** option cannot appear as a stale choice in the missing-wallet state. Selecting a wallet restores the normal block and its default category.
- `SharedExpenseFormBody` no longer passes `canSubmit`, so **Guardar** always runs validation instead of being silently disabled. It renders the first field error as an `accessibilityRole="alert"` notice directly above the actions (same translated `errors.*` copy), in addition to the inline field error.
- `ErrorBanner` now exposes `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"`.

### Files
- `features/shared-expenses/utils/shared-expense-form-load.ts` — `fromSharedExpense` (wallet trim, category reset).
- `features/shared-expenses/utils/shared-expense-form.ts` — `toSharedExpenseInput` (no category without a wallet).
- `features/shared-expenses/components/shared-expense-linked-movement.tsx` — category options and block gated by the trimmed wallet.
- `features/shared-expenses/components/shared-expense-form-body.tsx` — no `canSubmit`, first-error alert above the actions.
- `shared/components/molecules/error-banner.tsx` — alert role and polite live region.

### Tests
- `features/shared-expenses/utils/__tests__/shared-expense-form.test.ts`: `toSharedExpenseInput` drops the category without a wallet (empty and blank); `fromSharedExpense` drops a stored category when the wallet is null/blank and trims a whitespace wallet while keeping its category.

### Verification (17/11/2026)
- `npx tsc --noEmit` clean.
- `npx expo lint` clean.
- `npx jest`: **211 suites / 1193 tests passed**.
- `npm run test:coverage`: **99.07% statements, 94.88% branches, 99.02% functions, 99.50% lines**.
- `npm run check:copy`: **222 TSX files**.
- No schema, service, repository, money, rules or route change, so no migration or deploy.

## Dependencies
- TICKET-048 (mandatory wallet and legacy notice)
- TICKET-044 (linked movement and category)
