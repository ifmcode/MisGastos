# TICKET-036 - Open Transfer Detail from the Dashboard

**Type:** Improvement / UX  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-036; TICKET-026, TICKET-032, TICKET-035  
**Sprint:** Post-MVP / Phase 3.5  

## Description
Tapping a recent transfer on the dashboard must open the new transfer detail (TICKET-035) instead of the edit form. Editing stays available from the detail's pencil, and the recent-transfers header action keeps opening the history.

## Requirements
- [ ] Use `useTransferDetailDialog` and the transfer detail modal in `DashboardScreen`; `onPressTransfer` opens the detail
- [ ] The detail edit action closes the detail and opens `TransferFormModal` through `useTransferFormDialog.openEdit`
- [ ] The detail delete action reuses `deleteTransfer` and its confirmation and closes the detail on success
- [ ] Refresh wallets and transfers after an edit or delete started from the dashboard so balances, totals and the recent list stay in sync
- [ ] Pass `accessibilityHint` with the transfer detail hint to the dashboard `TransferItem`; `/transfers` keeps opening the edit form and its current hint
- [ ] Keep the recent-transfers **Ver todos** action opening `/transfers`
- [ ] Update or add tests for the detail hint/label and any wiring extracted from the screen

## Acceptance Criteria
- [ ] Tapping a recent transfer opens the transfer detail, not the edit form
- [ ] The pencil opens the existing transfer form with the selected transfer and saving updates the dashboard row and balances
- [ ] The trash asks for confirmation, deletes the transfer, reverts balances and refreshes the list
- [ ] The dashboard keeps exactly one transfer detail modal and one shared form modal
- [ ] `/transfers` still opens the edit form when a transfer is tapped and keeps its accessibility hint
- [ ] `npx tsc --noEmit`, `npx expo lint` and `npx jest` pass

## Technical Notes
- `DashboardScreen` already owns `transfersState` and `useTransferFormDialog`; add `useTransferDetailDialog(transfersState.transfers)` and render the new detail modal next to the existing form modal.
- TICKET-035 adds the optional `accessibilityHint` to `TransferItem` and a detail label/hint util. Dashboard uses the detail variant; `/transfers` keeps the default.
- Deleting from the detail already updates the transfers collection; call the existing `onWalletsChanged` refresh so the wallet cards and totals follow.
- Do not alter the `TransferFormModal` API or the transfer history screen in this ticket.
- **Out of scope:** opening the detail from `/transfers` (evaluate later), transfer filters and i18n extraction (TICKET-031).

## Dependencies
- TICKET-026 Transfer history
- TICKET-032 Wallet transfer entry point
- TICKET-035 Transfer detail view
