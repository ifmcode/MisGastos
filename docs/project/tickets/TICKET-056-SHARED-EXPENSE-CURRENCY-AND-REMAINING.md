# TICKET-056 - Compact Currency Field and Live Remaining Amount in the Shared-Expense Form

**Type:** UX  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** TICKET-006, TICKET-042, TICKET-043, TICKET-044, TICKET-051, TICKET-055  
**Sprint:** Post-MVP / Phase 5.3

## Description
Two presentation improvements in the create/edit shared-expense form, both inside the same sheet and with no change to the stored data.

(1) The currency stops being a full chip list and becomes a compact row: the label **Moneda**, the current value as `EUR €` and a small text action **Cambiar** in the primary color that opens a currency picker dialog. New expenses keep defaulting to the profile preferred currency and edits keep showing the stored one.

(2) In the **Importe** split mode, a live line under the participant inputs reports the total and how much is still missing (`Total 100,00 € · Falta: 25,00 €`), recomputed on every keystroke, with explicit **Completo** and **Sobra: X** states. The line is informative: the existing validation still decides whether the form can be saved.

## Requirements
### Currency field
- [ ] Replace the inline `CurrencyChipSelector` in `features/shared-expenses/components/shared-expense-form-main-fields.tsx` with a compact row: label **Moneda**, value rendered as `EUR €` (code + symbol) on the left and a small **Cambiar** text action in the primary color on the right
- [ ] Render **Cambiar** as a text button with a hit area of at least 44x44, not a filled button, with its own accessibility role, label and hint
- [ ] **Cambiar** opens a currency picker dialog listing the supported currencies from `CURRENCIES` (the existing chip selector may live inside the dialog) and closes as soon as a currency is selected or the dialog is dismissed
- [ ] Keep the current defaults: a new expense starts in the profile preferred currency with the EUR fallback, and an edit shows the stored currency
- [ ] On currency change, revalidate the linked wallet: a wallet of another currency is cleared together with the category, the wallet options are re-filtered, and an incompatible wallet can never be submitted
- [ ] Extract the compact field as a shared molecule (`CurrencyField` plus its picker dialog) and reuse it in the wallet form for the standalone currency instead of duplicating the presentation
- [ ] Add a pure `formatCurrencyLabel` helper (code + symbol, safe fallback for an unknown value) with colocated tests
- [ ] Keep the movement and transfer forms with the currency tied to the wallet, but preselect an active wallet in the profile preferred currency when one exists for a new record, falling back to the current first-wallet behaviour; a transfer keeps source and destination in the same currency

### Remaining amount in the **Importe** split mode
- [ ] In the `fixed` split mode, render a live line below the participant inputs: `Total 100,00 € · Falta: 25,00 €`, recalculated on every keystroke without submitting
- [ ] Show **Completo** (or omit the missing part) when nothing is missing, and **Sobra: X** with error styling when the inputs exceed the total, while the existing validation keeps blocking the save
- [ ] Compute with integer cents (an empty input counts as 0) and format with the app locale and the expense currency; never use floats and never round twice
- [ ] Announce the line with a polite live region without moving focus, and keep the existing error text under the split section
- [ ] Add a pure remaining-amount helper with tests for empty, partial, complete, over, decimals, thousands and the currency symbol

### Verification
- [ ] Keep the copy in the `sharedExpenses` namespace (es/en) for the label, **Cambiar**, the dialog title, the total/missing/complete/over texts and every accessibility label and hint
- [ ] Keep dark mode and the existing form styles contract; no hardcoded colors inside components
- [ ] Pass `npm run check:copy` and run `npx tsc --noEmit`, `npx expo lint` and `npx jest`

## Acceptance Criteria
- [ ] The shared-expense form shows the compact currency row instead of the chip list, and **Cambiar** opens the picker and applies the selection
- [ ] A new expense starts in the profile preferred currency (EUR when the profile has none) and an edit shows the stored currency
- [ ] Changing the currency clears a wallet of another currency, drops its category and re-filters the wallet options
- [ ] The wallet form shows the same compact field and picker, with no duplicated presentation code
- [ ] The **Importe** split shows the live total and the missing amount, updates on every keystroke and shows **Completo** and **Sobra** states correctly
- [ ] The remaining line never blocks or enables the save on its own; saving an incomplete split still shows the existing validation error
- [ ] Screen readers announce the remaining line politely without losing the input focus
- [ ] Copy, dark mode and es/en are covered, and `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- **Presentation only:** the total, the shares and the invariant that the shares sum to the amount stay in the schema, `splitExpenseAmount` and the service. Neither change touches `sharedExpenses`, the linked movement, the rules or the money helpers, so no migration and no deploy.
- **The picker, not the chips, is the visible surface:** the chip list stays available as the dialog content, so `CurrencyChipSelector` keeps its current consumers (settlements, profile, wallet) and the shared-expense form gains one indirection instead of a second currency model. The compact row lives in `shared/components/molecules` because the wallet form needs the same presentation (`features/wallets/components/wallet-form-currency-selector.tsx` today just wraps the chips).
- **`formatCurrencyLabel`** belongs in `shared/utils/` next to the other pure helpers: it resolves `CURRENCIES` by code and returns `code + symbol`, falling back to the raw code (or the default currency) instead of throwing. The dialog and the row read the same helper so they cannot render differently.
- **Currency change already clears an incompatible wallet:** `selectSharedExpenseCurrency` in `features/shared-expenses/utils/shared-expense-link-values.ts` returns `walletId: ""` and `categoryId: ""` when the selected wallet currency differs. The ticket wires the compact field to that existing path and adds the missing coverage, instead of duplicating the rule in the component.
- **Remaining amount is derived:** the helper takes the typed participant texts plus the amount text (all still strings in `SharedExpenseFormValues`), converts each with the same integer-cents parser the split uses, and returns total, missing or excess in cents. Formatting happens at the render boundary with `useAppLocale` and the expense currency, mirroring `formatCentsText`.
- **Why keep the error:** the line is a helper, not a validator. `FIXED_SUM_MISMATCH` and `INVALID_FIXED_AMOUNT` remain the save-time contract, so a stale or partial line can never let an invalid split through.
- **Live region, no focus change:** the line uses `accessibilityLiveRegion="polite"` (plus the equivalent role) so a screen reader reads the update after the keystroke without stealing focus from the input being typed.
- **Ordering with TICKET-055:** the wallet/category toggle may hide the block on **No**, but it never hides the currency row; the currency stays a top-level expense field in both states.
- **Movement and transfer defaults:** `features/transactions/utils/transaction-form-defaults.ts` and `features/transfers/utils/transfer-form-defaults.ts` currently start from `wallets[0]` (transfers from the first wallet that shares its currency). Preselecting an active wallet in the preferred currency only changes that initial pick; the currency stays read from the wallet and the transfer still requires both sides in the same currency.
- **Decision record:** `docs/project/development-notes/session-notes/2026-11-18-shared-expense-form-refinement.md`.
- **Out of scope:** a currency search/filter inside the dialog, currency conversion, showing the currency on movement and transfer rows, and changing the supported currency list.

## Validation Plan
- Create a shared expense in each supported currency, change the currency with a wallet selected and confirm the wallet and category are cleared and the options re-filtered.
- Confirm a new expense opens in the profile preferred currency and an edit in the stored one.
- Open **Cambiar**, pick a currency, dismiss the dialog without selecting and confirm the form keeps the previous value.
- Compare the displayed remaining amount with the saved shares in a partial, a complete and an over case, including decimals and a thousands separator.
- Type into the participant inputs with a screen reader attached and confirm the line is announced without losing focus.
- Open the wallet form and confirm it renders the same compact field and picker.
- Check light/dark and Spanish/English, then run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-042 shared-expense form in the friend detail
- TICKET-044 linked wallet and movement (wallet currency rules reused by the change)
- TICKET-051 mandatory category for a linked movement (the cleared category path)
- TICKET-055 optional wallet registration (the toggle that may hide the wallet block)
- TICKET-006 profile preferred currency (the default for new records)
