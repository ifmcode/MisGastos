# [DONE] TICKET-025 - Future: Movement Detail View

**Type:** Feature  
**Priority:** Medium  
**Status:** ✅ Done (11/11/2026)  
**Related:** PM-025; TICKET-002, TICKET-022  
**Sprint:** Post-MVP  

## Description
Tapping an expense or income in the history currently opens the edit form directly. Add a read-only movement detail view instead, with edit and delete actions in the top-right corner. The existing edit form and confirmation flow stay in use.

## Requirements
- [x] Open a detail view when the user taps an expense or income in the history
- [x] Show amount, currency, type, wallet, category, concept, date, notes and the stored wallet name when the wallet was archived or deleted
- [x] Add pencil and trash icon buttons in the top-right corner of the view
- [x] The pencil opens the existing transaction form prefilled with the movement
- [x] The trash opens the existing delete confirmation and reverts the wallet balance through the current delete operation
- [x] Refresh the detail view or return to history after a successful edit or delete
- [x] Handle a movement that no longer exists without crashing
- [x] Add accessibility labels and hints for both actions
- [x] Add tests for opening the detail, editing and deleting

## Acceptance Criteria
- [x] Tapping a movement no longer jumps straight into the edit form
- [x] The detail view shows the same values the history row shows, without stale wallet names
- [x] The pencil opens the form with the correct movement and wallet preselected
- [x] The trash asks for confirmation and does nothing if the user cancels
- [x] A successful delete removes the movement from history and restores the wallet balance
- [x] The view works on iOS, Android and web

## Technical Notes
- `TransactionItem` currently calls `onEdit` directly from `TransactionsList`. Change the list callback to open the detail view and pass the selected `Transaction`.
- Reuse the existing edit modal and confirmation builders instead of creating another edit form or delete path.
- Prefer a dedicated component under `features/transactions/components/` and, if navigation is needed, a route or modal mounted from the transactions screen. Keep the screen as an orchestrator.
- Resolve wallet names from the full wallet list first, then fall back to `transaction.walletName` so archived and deleted wallets still display correctly.
- This changes the interaction introduced by TICKET-022; keep its accessibility and pressed-feedback improvements.

## Dependencies
- TICKET-002 Transactions and history
- TICKET-022 Discoverable movement actions

## Implemented

- `TransactionItem` now opens a read-only detail view through `TransactionsList`
  (`onOpenDetail`) instead of jumping into the edit form. The card keeps its
  `Pressable`, pressed feedback and screen-reader role/label/hint; the pencil
  badge became a chevron because the card now navigates to the detail.
- `TransactionDetailModal` is mounted from `TransactionsScreen` and is owned by
  `useTransactionDetailDialog`. The hook stores the selected movement id and
  resolves it from the live collection, so a movement removed by another client
  shows the `TransactionDetailMissingState` instead of crashing.
- The detail view shows the type, formatted amount, currency, wallet, category,
  concept, date and notes. Wallet names resolve from the full wallet list first
  and fall back to `transaction.walletName`; archived wallets are labelled
  `(archivada)` and deleted wallets keep their stored `[Eliminada]` name.
- The top-right pencil reuses `useTransactionFormDialog.openEdit`, which opens
  the existing form with the movement and wallet preselected. The detail closes
  and the user returns to history after a successful save.
- The top-right trash reuses `getDeleteTransactionConfirmation`,
  `useConfirmDialog` and `ConfirmDialog`, then calls the existing
  `deleteTransaction` operation. Cancelling keeps the movement; a successful
  delete closes the detail, removes the row and reloads wallet balances.
- Pure helpers were added in `transaction-detail.ts` and
  `transaction-detail-state.ts`; styles live in
  `styles/transaction-detail.styles.ts`. New tests cover detail state
  (open/close/missing), field and wallet resolution, accessibility copy and the
  form prefill used by editing. Delete copy remains covered by the existing
  `transaction-delete-dialog` tests.

### Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
```

All pass (76 suites, 371 tests).

### Manual platform checks

1. Tap an expense and an income on iOS, Android and web: the detail view opens
   with the same values as the history row.
2. Tap the pencil: the edit form opens with the movement and wallet preselected;
   save and confirm the history row updates.
3. Tap the trash: the confirmation dialog appears. Cancel keeps the movement and
   balance; confirm removes it and restores the wallet balance.
4. Open a movement whose wallet was archived and one whose wallet was deleted:
   the detail shows the archived label or the stored `[Eliminada]` name.
5. Delete a movement from another client and refresh: the detail shows the
   "Movimiento no disponible" state instead of crashing.
6. Run a screen reader over the card and the pencil/trash buttons: labels and
   hints describe the detail, edit and delete actions.
