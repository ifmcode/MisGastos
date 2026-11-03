# TICKET-022 - Future: Discoverable Edit/Delete Actions for Movements

**Type:** Improvement  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-022; TICKET-002, TICKET-003  
**Sprint:** Post-MVP  

## Description
The app already supports editing and deleting expenses, incomes and transfers, but the action is hidden behind tapping a card. Make the action discoverable, accessible and consistent across both lists.

## Requirements
- [ ] Replace `onTouchEnd` with a real `Pressable` in `TransactionItem` and `TransferItem`
- [ ] Add pressed feedback and an accessibility role, label and hint
- [ ] Add a visible edit affordance (chevron, pencil icon or action menu)
- [ ] Keep delete inside the edit form with confirmation, or add an explicit delete action in the menu
- [ ] Ensure both lists open the edit modal with the correct item
- [ ] Preserve balance updates and soft-delete behaviour
- [ ] Add tests or manual checks for item press and the delete confirmation flow

## Acceptance Criteria
- [ ] Users can tell that a movement or transfer can be edited
- [ ] Tapping a card reliably opens the edit form on iOS, Android and web
- [ ] Screen readers announce the card as an editable action
- [ ] Delete is still protected by a confirmation dialog
- [ ] Deleting an expense/income or transfer still reverts the wallet balance
- [ ] Scrolling and pull-to-refresh are not affected
- [ ] Accidental deletes are not possible from the list

## Technical Notes
- `TransactionItem` and `TransferItem` currently use `ThemedView` with `onTouchEnd`; replace the pressable wrapper with `Pressable` and keep the card styling.
- `TransactionsList` already passes `onEdit`, and the dashboard already passes `onPressTransfer`; the missing part is the visible affordance and reliable press handling.
- `showDeleteTransactionDialog` and the transfer delete confirmation already exist. Reuse them instead of creating new dialogs.
- An overflow menu with "Editar" and "Eliminar" is an option, but avoid adding a new dependency for it.
- This is a UX/discoverability ticket. The underlying create/edit/delete balance logic is already implemented and tested.

## Dependencies
- TICKET-002 Transactions
- TICKET-003 Transfers and Dashboard
