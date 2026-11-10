# TICKET-025 - Future: Movement Detail View

**Type:** Feature  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-025; TICKET-002, TICKET-022  
**Sprint:** Post-MVP  

## Description
Tapping an expense or income in the history currently opens the edit form directly. Add a read-only movement detail view instead, with edit and delete actions in the top-right corner. The existing edit form and confirmation flow stay in use.

## Requirements
- [ ] Open a detail view when the user taps an expense or income in the history
- [ ] Show amount, currency, type, wallet, category, concept, date, notes and the stored wallet name when the wallet was archived or deleted
- [ ] Add pencil and trash icon buttons in the top-right corner of the view
- [ ] The pencil opens the existing transaction form prefilled with the movement
- [ ] The trash opens the existing delete confirmation and reverts the wallet balance through the current delete operation
- [ ] Refresh the detail view or return to history after a successful edit or delete
- [ ] Handle a movement that no longer exists without crashing
- [ ] Add accessibility labels and hints for both actions
- [ ] Add tests for opening the detail, editing and deleting

## Acceptance Criteria
- [ ] Tapping a movement no longer jumps straight into the edit form
- [ ] The detail view shows the same values the history row shows, without stale wallet names
- [ ] The pencil opens the form with the correct movement and wallet preselected
- [ ] The trash asks for confirmation and does nothing if the user cancels
- [ ] A successful delete removes the movement from history and restores the wallet balance
- [ ] The view works on iOS, Android and web

## Technical Notes
- `TransactionItem` currently calls `onEdit` directly from `TransactionsList`. Change the list callback to open the detail view and pass the selected `Transaction`.
- Reuse the existing edit modal and confirmation builders instead of creating another edit form or delete path.
- Prefer a dedicated component under `features/transactions/components/` and, if navigation is needed, a route or modal mounted from the transactions screen. Keep the screen as an orchestrator.
- Resolve wallet names from the full wallet list first, then fall back to `transaction.walletName` so archived and deleted wallets still display correctly.
- This changes the interaction introduced by TICKET-022; keep its accessibility and pressed-feedback improvements.

## Dependencies
- TICKET-002 Transactions and history
- TICKET-022 Discoverable movement actions
