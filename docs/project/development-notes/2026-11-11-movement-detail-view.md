# Session Note: Movement Detail View (TICKET-025)

**Date:** 11/11/2026  
**Ticket:** TICKET-025 / PM-025  
**Status:** ✅ Done

## Summary

Tapping an expense or income in the history now opens a read-only detail view
instead of the edit form. The detail shows the movement type, amount, currency,
wallet, category, concept, date and notes, with pencil and trash actions in the
top-right corner.

The pencil opens the existing `TransactionForm` prefilled with the selected
movement. The trash reuses the existing `getDeleteTransactionConfirmation`
builder, `ConfirmDialog` and `deleteTransaction` operation, so the confirmation,
balance reversion and error handling remain in one place. A successful edit or
delete returns the user to the history.

## Architecture

| Layer | Files |
|---|---|
| Screen orchestration | `features/transactions/components/transactions-screen.tsx` |
| List callback | `features/transactions/components/transactions-list.tsx` |
| Movement card | `features/transactions/components/transaction-item.tsx` |
| Detail modal | `features/transactions/components/transaction-detail-modal.tsx` |
| Detail header/actions | `features/transactions/components/transaction-detail-header.tsx` |
| Detail content | `features/transactions/components/transaction-detail-content.tsx` |
| Missing state | `features/transactions/components/transaction-detail-missing-state.tsx` |
| Detail state | `features/transactions/hooks/use-transaction-detail-dialog.ts` + `utils/transaction-detail-state.ts` |
| Detail model | `features/transactions/utils/transaction-detail.ts` |
| Detail styles | `features/transactions/styles/transaction-detail.styles.ts` |
| Accessibility | `features/transactions/utils/transaction-item-accessibility.ts` |
| Tests | `utils/__tests__/transaction-detail.test.ts`, `transaction-detail-state.test.ts`, `transaction-item-accessibility.test.ts`, `transaction-form-defaults.test.ts` |

## Decisions

- **Modal instead of a route**: the transactions tab already owns the movement
  list and the edit modal, so a modal keeps the selected record in memory and
  avoids adding navigation state for a transient view.
- **Selected id, not a snapshot**: `useTransactionDetailDialog` stores the id and
  resolves the movement from the full live collection. This keeps the detail
  fresh and lets a removed movement render a safe missing state.
- **Return to history after edit/delete**: closing the detail before opening the
  existing form avoids stacking two native modals. A successful save or delete
  leaves the user on the updated history.
- **Wallet fallback**: archived wallets are resolved from the full wallet list
  and labelled `(archivada)`. Deleted wallets fall back to
  `transaction.walletName`, preserving the stored `[Eliminada]` prefix.
- **Card affordance**: the card changed from a pencil to a chevron because it now
  opens the detail. Pressed feedback, role, label and hint are preserved.
- **Screen size**: `transactions-screen.tsx` is 196 lines (it was already 169
  before this ticket). It remains pure orchestration over existing hooks and
  components; splitting the hook wiring would add indirection without a clear
  responsibility boundary. The new detail UI is split into modal, header,
  content, missing state and styles files.

## Manual platform checks

1. Tap an expense and an income on iOS, Android and web: the detail opens with
   the same values as the history row.
2. Tap the pencil: the form opens with the movement and wallet preselected; save
   and confirm the history row updates.
3. Tap the trash: the confirmation appears. Cancel keeps the movement and
   balance; confirm removes it and restores the wallet balance.
4. Open movements with archived and deleted wallets: the detail shows the
   archived label or the stored `[Eliminada]` name.
5. Delete a movement from another client and refresh: the detail shows
   "Movimiento no disponible" instead of crashing.
6. Run a screen reader over the card and the pencil/trash buttons: labels and
   hints describe the detail, edit and delete actions.

## Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
```

All pass (76 suites, 371 tests).
