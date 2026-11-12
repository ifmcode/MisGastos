# [DONE] TICKET-029 - Compact Wallet Selector and Missing Wallet Fix

**Type:** Bug / Improvement  
**Priority:** High  
**Status:** ✅ Done (12/11/2026)  
**Related:** PM-029; TICKET-001, TICKET-002, TICKET-003, TICKET-018  
**Sprint:** Post-MVP  

## Description
Replace the full wallet list in the movement form with a compact selector that opens a **Seleccionar cartera** popup. The popup must list every active wallet and must not offer wallet creation. This also fixes the current bug where only the first two wallets are visible and a third wallet is missing.

## Known bug
With three active wallets, the movement form only shows the first two. The missing wallet is named **Juanilla**, has type `other`, currency `EUR` and a balance of €30. The form must render all active wallets regardless of type, currency or balance.

## Requirements
- [x] Show at most four compact chips in the form: up to three wallet options and a final `+` chip
- [x] Always keep the selected wallet visible among the compact chips
- [x] Open a popup titled **Seleccionar cartera** from the `+` chip
- [x] List every active wallet in the popup, including wallets of type `other` and currencies other than the default
- [x] Exclude archived wallets from the selectable list
- [x] Do not offer a "create wallet" action inside the wallet popup
- [x] Show the wallet name, type and balance in the popup so the user can tell them apart
- [x] Close the popup after selecting a wallet and keep the selection in the form
- [x] Apply the same compact pattern to the transfer source and destination selectors
- [x] Investigate and fix the cause of the missing third wallet instead of only hiding the list behind a popup
- [x] Add a regression test with three active wallets, including one `other`/`EUR` wallet with a non-zero balance

## Acceptance Criteria
- [x] Creating or editing a movement shows a compact wallet selector instead of the full list
- [x] The **Seleccionar cartera** popup lists all active wallets exactly once
- [x] The **Juanilla** wallet appears and can be selected
- [x] Wallets of every supported type and currency appear
- [x] Archived wallets do not appear
- [x] The popup has no creation action
- [x] The selected wallet is always visible without opening the popup
- [x] Transfer creation can select source and destination through the same popup pattern
- [x] Existing wallet validation and balance logic are unchanged

## Technical Notes
- `TransactionFormWalletSelector` currently maps the whole `wallets` prop. Confirm where the third wallet is lost before changing the UI: owner query, mapper, archived filtering, form props or a layout/scroll clipping issue.
- Keep a single source of truth for active wallets (`getActiveWallets`) and pass it down from the screen. Do not filter again inside the selector.
- Split the component into a compact chip row and a popup list. Keep the popup state in the form field or a small dedicated hook.
- The wallet popup must stay read-only; creation remains in the accounts tab. Use the project-owned modal/dialog pattern so web works.
- Mobile and web must both allow selecting a wallet that is not among the first three.
- Do not change the transfer balance or same-currency rules.

## Implemented
- **Root cause of the missing wallet:** each tab keeps its own `useWallets` state. The movements tab loaded wallets on the first mount and only refreshed categories when focused again, so a wallet created later in the accounts tab (Juanilla) never reached the movement form. The dashboard had the same gap for its quick transfer form. Both screens now refresh wallets on focus and keep `getActiveWallets` as the single filtering point.
- `getWalletChips` (with `COMPACT_WALLET_LIMIT = 3`) orders the selected wallet first and splits the collection into visible chips and popup-only wallets, mirroring the category chip model.
- `WalletChipSelector` is shared by the movement, transfer-source and transfer-destination selectors. It renders up to three wallet chips plus a dashed `+` chip labelled **Seleccionar cartera**.
- `WalletPickerDialog` is a project-owned transparent `Modal` titled **Seleccionar cartera**. It lists every wallet it receives exactly once, shows name, type, currency and balance, closes on selection and offers no creation action.
- `WalletPickerOption` owns each popup row with radio role, selected state and a screen-reader label that includes the wallet type and balance.
- `TransactionFormWalletField` owns the popup state and keeps the movement form focused on the selected value.
- `TransferFormSourceSelector` and `TransferFormDestinationSelector` reuse the same compact chips and popup, preserving the same-currency destination filtering. The obsolete `TransferFormWalletList` was removed.
- Regression tests cover three active wallets including Juanilla (`other`, `EUR`, balance 30), selected-first ordering, popup coverage without duplicates, archived exclusion, fewer-than-three and zero wallets. The wallet mapper also has an explicit `other`/`EUR`/non-zero-balance test.
- Verification: `npx tsc --noEmit`, `npx expo lint`, `npx jest --runInBand` (82 suites / 394 tests).

## Dependencies
- TICKET-001 Wallets
- TICKET-002 Transactions
- TICKET-003 Transfers
- TICKET-018 Archived wallet filtering
