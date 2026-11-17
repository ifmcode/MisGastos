# [DONE] TICKET-050 - Shared Expense Save Feedback and Category Picker

**Type:** Bug / UX
**Priority:** High
**Status:** ✅ Done (17/11/2026)
**Related:** TICKET-049, TICKET-048, TICKET-044
**Sprint:** Post-MVP / Phase 5.1

## Description
With a wallet already selected, the shared-expense edit form still shows the system **Gastos compartidos** category, and a service-side save failure (for example a wallet whose currency no longer matches the expense, or an insufficient balance) is only painted at the top of the form. The user presses **Guardar**, the modal stays open with no visible change near the button, and it looks as if nothing happened. This ticket removes the system category from this picker and its default selection, validates the selected wallet currency before submitting, and surfaces the server error next to the actions so every blocked save explains itself.

## Requirements
- [x] Hide the deterministic **Gastos compartidos** category from the shared-expense category options and stop preselecting/defaulting it when a wallet is chosen
- [x] Clear a stored **Gastos compartidos** category when loading an expense or changing the wallet, leaving the category field deselected
- [x] Show the server form error and the first field error in a visible, accessible notice immediately above the form actions, not only at the top
- [x] Validate the selected wallet currency in the form before submitting and report `CURRENCY_MISMATCH` near the wallet and the actions
- [x] Keep the top `ErrorBanner` and the inline field errors unchanged
- [x] Add colocated tests for the category options/selection, the payload and the wallet-currency helper
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] With a wallet selected, **Gastos compartidos** no longer appears in the shared-expense category list and is not preselected
- [x] A wallet whose currency differs from the expense is rejected with a clear translated message before any write
- [x] A service-side save failure is visible next to **Guardar**, so the form cannot look saved when it is not
- [x] Normal saves (valid wallet, matching currency) keep working and the movement still gets a category
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

### Category picker
- `features/shared-expenses/utils/shared-expense-link-options.ts`: `getSharedExpenseCategoryOptions` filters out the deterministic shared category (`getSharedExpenseCategoryId(viewerUid)`) whether it exists as a document or would be synthetic, and passes an empty selection to `withSelectedFallback` when the stored id is that system category, so it is never restored as a fallback row.
- `features/shared-expenses/utils/shared-expense-link-values.ts`: `selectSharedExpenseWallet` no longer defaults `categoryId` to the shared category; it keeps a real category the user already picked and clears a legacy shared default.
- `features/shared-expenses/utils/shared-expense-form-load.ts`: `fromSharedExpense` clears a stored shared default category in addition to the existing no-wallet clearing, so the field loads deselected.

### Save feedback
- `features/shared-expenses/components/shared-expense-form-body.tsx`: the body renders `error ?? tr(errors.<firstField>)` as an `accessibilityRole="alert"` notice immediately above `FormActions`, so a service-side rejection (insufficient balance, wallet not found, permission, etc.) is visible next to **Guardar** and not only in the top `ErrorBanner`. The top banner and the inline field errors are unchanged.
- `features/shared-expenses/utils/shared-expense-link-values.ts` + `features/shared-expenses/hooks/use-shared-expense-form.ts`: the pure `getSharedExpenseWalletCurrencyError` checks the selected wallet currency before submitting; a mismatch sets the `walletId` field error (`CURRENCY_MISMATCH`) and returns without calling `onSubmit`, so no write happens. A missing or orphaned wallet returns `null` and stays a service concern. The existing `errors.CURRENCY_MISMATCH` copy is reused (no new locale key).
- `shared/components/molecules/error-banner.tsx`: unchanged contract, still an accessible alert (`accessibilityRole="alert"` + polite live region).
- `features/shared-expenses/schemas/shared-expense-validation.types.ts`: the client validation-code union accepts `CURRENCY_MISMATCH`. This is the only contract change; no schema, service, repository, money, rules, route or Firestore change.

### Tests
- `features/shared-expenses/utils/__tests__/shared-expense-link-options.test.ts`: the category options exclude the system category and never restore it as a fallback row.
- `features/shared-expenses/utils/__tests__/shared-expense-link-values.test.ts`: selecting a wallet does not default the category and clears a legacy shared default, while real categories stay selected.
- `features/shared-expenses/utils/__tests__/shared-expense-form.test.ts`: `fromSharedExpense` clears a stored shared default.
- `features/shared-expenses/utils/__tests__/shared-expense-wallet-currency.test.ts`: the wallet-currency helper covers matching, mismatching, empty and unknown wallets.

### Verification (17/11/2026)
- `npx tsc --noEmit`: clean.
- `npx expo lint`: clean.
- `npx jest`: 212 suites / 1200 tests passed.
- `npm run test:coverage`: 99.08% statements, 94.86% branches, 99.02% functions, 99.50% lines.
- `npm run check:copy`: 222 TSX files.
- No new Firestore rules or deploy; no migration.

### Notes and limits
- The service may still ensure the internal **Gastos compartidos** category when the form sends none, so the movement keeps a valid category without offering it in the picker.
- The original screenshot showed a wallet selected and the form appearing not to react; the visible error now reveals the real service reason. The underlying business rejection (currency, balance) is **not** bypassed or removed.
- Manual device validation was not performed.

## Technical Notes
- `getSharedExpenseCategoryOptions` currently adds the synthetic default and maps an existing shared category; the shared-expense picker must filter it out instead. The service may still ensure that category when the form sends no category, so the movement keeps a valid category without showing it in the picker.
- `selectSharedExpenseWallet` currently defaults `categoryId` to the shared category; it must leave the field empty and clear a legacy shared default.
- `fromSharedExpense` must clear a stored shared default category, in addition to the existing no-wallet clearing.
- The wallet-currency check belongs in the form layer (pure helper + `useSharedExpenseForm.submit`); the service/repository keep their own guards.
- The existing `errors.CURRENCY_MISMATCH` copy is reused; no new locale key is needed.
- No schema, service, repository, rules, route or money change; only the client validation-code union gains `CURRENCY_MISMATCH`.

## Validation Plan
- Edit a shared expense with a wallet selected and confirm **Gastos compartidos** is absent and unselected.
- Select a wallet in another currency and confirm the message appears near the wallet and the actions, with no write.
- Force a service failure (e.g. insufficient balance) and confirm it is visible next to **Guardar**.
- Save a valid expense and confirm the movement appears.
- Check es/en and light/dark.
- **Pending:** manual device validation of the five checks above was not performed; only automated verification ran.

## Dependencies
- TICKET-044 (linked movement and category)
- TICKET-048/049 (mandatory wallet and link feedback)
