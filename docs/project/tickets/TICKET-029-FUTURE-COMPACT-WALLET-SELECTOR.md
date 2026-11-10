# TICKET-029 - Future: Compact Wallet Selector and Missing Wallet Fix

**Type:** Bug / Improvement  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-029; TICKET-001, TICKET-002, TICKET-003, TICKET-018  
**Sprint:** Post-MVP  

## Description
Replace the full wallet list in the movement form with a compact selector that opens a **Seleccionar cartera** popup. The popup must list every active wallet and must not offer wallet creation. This also fixes the current bug where only the first two wallets are visible and a third wallet is missing.

## Known bug
With three active wallets, the movement form only shows the first two. The missing wallet is named **Juanilla**, has type `other`, currency `EUR` and a balance of €30. The form must render all active wallets regardless of type, currency or balance.

## Requirements
- [ ] Show at most four compact chips in the form: up to three wallet options and a final `+` chip
- [ ] Always keep the selected wallet visible among the compact chips
- [ ] Open a popup titled **Seleccionar cartera** from the `+` chip
- [ ] List every active wallet in the popup, including wallets of type `other` and currencies other than the default
- [ ] Exclude archived wallets from the selectable list
- [ ] Do not offer a "create wallet" action inside the wallet popup
- [ ] Show the wallet name, type and balance in the popup so the user can tell them apart
- [ ] Close the popup after selecting a wallet and keep the selection in the form
- [ ] Apply the same compact pattern to the transfer source and destination selectors
- [ ] Investigate and fix the cause of the missing third wallet instead of only hiding the list behind a popup
- [ ] Add a regression test with three active wallets, including one `other`/`EUR` wallet with a non-zero balance

## Acceptance Criteria
- [ ] Creating or editing a movement shows a compact wallet selector instead of the full list
- [ ] The **Seleccionar cartera** popup lists all active wallets exactly once
- [ ] The **Juanilla** wallet appears and can be selected
- [ ] Wallets of every supported type and currency appear
- [ ] Archived wallets do not appear
- [ ] The popup has no creation action
- [ ] The selected wallet is always visible without opening the popup
- [ ] Transfer creation can select source and destination through the same popup pattern
- [ ] Existing wallet validation and balance logic are unchanged

## Technical Notes
- `TransactionFormWalletSelector` currently maps the whole `wallets` prop. Confirm where the third wallet is lost before changing the UI: owner query, mapper, archived filtering, form props or a layout/scroll clipping issue.
- Keep a single source of truth for active wallets (`getActiveWallets`) and pass it down from the screen. Do not filter again inside the selector.
- Split the component into a compact chip row and a popup list. Keep the popup state in the form field or a small dedicated hook.
- The wallet popup must stay read-only; creation remains in the accounts tab. Use the project-owned modal/dialog pattern so web works.
- Mobile and web must both allow selecting a wallet that is not among the first three.
- Do not change the transfer balance or same-currency rules.

## Dependencies
- TICKET-001 Wallets
- TICKET-002 Transactions
- TICKET-003 Transfers
- TICKET-018 Archived wallet filtering
