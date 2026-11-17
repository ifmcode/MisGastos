# Session Note: Compact Wallet Selector (TICKET-029)

**Date:** 12/11/2026  
**Ticket:** TICKET-029 / PM-029  
**Status:** ✅ Done

## Summary

The movement form no longer renders the full wallet list. It shows at most three
wallet chips plus a final dashed `+` chip. The `+` chip opens a read-only
**Seleccionar cartera** popup that lists every active wallet once, with its name,
type, currency and balance. The popup has no creation action. The transfer
source and destination selectors use the same chips and popup.

The selected wallet always leads the inline chips, so it stays visible even when
the collection is longer than three. Selecting a wallet closes the popup and
updates the form immediately.

## Root cause of the missing third wallet

The wallet collection was **not lost in the query, mapper or archived filter**.
Each tab keeps its own `useWallets` state. The movements tab loaded wallets once
on mount and, unlike categories, never refreshed them when the tab was focused
again. A wallet created later in the accounts tab — Juanilla, type `other`,
currency `EUR`, balance €30 — updated only the accounts state, so the movement
form kept showing the two wallets loaded earlier. The dashboard had the same
gap for its quick transfer form.

Fix: both screens refresh wallets on focus. The compact selector still receives
the screen-owned `getActiveWallets` result, so there is one filtering point and
the popup never filters or truncates the list again.

## Architecture

| Layer | Files |
|---|---|
| Chip model | `features/wallets/utils/wallet-chips.ts` |
| Compact chips | `features/wallets/components/wallet-chip-selector.tsx` |
| Popup | `features/wallets/components/wallet-picker-dialog.tsx` |
| Popup row | `features/wallets/components/wallet-picker-option.tsx` |
| Styles | `features/wallets/styles/wallet-picker.styles.ts` |
| Movement field | `features/transactions/components/transaction-form-wallet-field.tsx` |
| Movement selector | `features/transactions/components/transaction-form-wallet-selector.tsx` |
| Transfer selectors | `features/transfers/components/transfer-form-source-selector.tsx`, `transfer-form-destination-selector.tsx` |
| Tests | `features/wallets/utils/__tests__/wallet-chips.test.ts`, `features/wallets/repositories/__tests__/wallet.mapper.test.ts` |

## Decisions

- **Pure chip model**: `getWalletChips` moves the selected wallet to the front,
  returns up to `COMPACT_WALLET_LIMIT = 3` visible chips and reports the rest as
  popup-only. The popup coverage rule is testable without rendering React Native
  components.
- **Shared wallet UI**: the chip row, popup and option row live in
  `features/wallets` because both movement and transfer forms use them. This
  avoids two copies of the same modal and keeps wallet presentation together.
- **Popup state in the field/selector**: `TransactionFormWalletField` owns the
  movement popup state. Each transfer selector owns its own popup state because
  source and destination open independently.
- **Read-only popup**: creation remains in the accounts tab. There is no second
  creation path and no change to wallet validation.
- **Single source of truth**: screens pass `getActiveWallets` down. Archived
  wallets never reach the selector and the popup simply renders the received
  list, so every active wallet appears exactly once.
- **Transfer rules untouched**: the destination popup still receives
  `availableDestinations`, which keeps the same-currency and source-exclusion
  rules. Balance calculations and validation are unchanged.
- **Project-owned popup**: the dialog is a transparent `Modal` with an in-app
  card, close action and scrollable list, consistent with the category picker and
  usable on web.

## Manual platform checks

1. Create a third wallet in the accounts tab after visiting the movements tab,
   then return to movements and open a new movement: all three wallets are
   available in the chips and in **Seleccionar cartera**.
2. Select the third wallet (for example Juanilla, type `other`, `EUR`, €30): the
   popup closes, the chip shows the wallet and the form keeps the selection.
3. Open the popup with more than three wallets: every active wallet appears once
   and the selected one is marked.
4. Archive a wallet: it disappears from the chips and from the popup.
5. Confirm the popup has only the list and the close action, with no creation
   button.
6. Open a transfer: source and destination use the same compact chips and popup;
   the destination list still only offers same-currency wallets.
7. On web, tab to the chips, popup rows and close action and activate them with
   Enter/Space.
8. Submit without a wallet: the existing required-wallet message still renders
   under the chips.

## Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
```

All pass (82 suites, 394 tests).
