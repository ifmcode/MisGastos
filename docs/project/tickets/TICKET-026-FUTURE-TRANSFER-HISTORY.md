# TICKET-026 - Future: Transfer History

**Type:** Feature  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-026; TICKET-003, TICKET-018, TICKET-027  
**Sprint:** Post-MVP  

## Description
Add a dedicated transfer history view, reachable from the accounts tab. It lists every transfer for the owner so the dashboard can keep showing only the most recent ones.

## Requirements
- [ ] Add a **Historial de transferencias** action to the accounts (wallets) screen
- [ ] Create a dedicated transfer history view or route
- [ ] List all transfers in reverse chronological order
- [ ] Show source and destination wallet names, amount, currency, date and notes
- [ ] Use stored `fromWalletName` / `toWalletName` or the `[Eliminada]` labels when a wallet no longer exists
- [ ] Show loading, error, empty and pull-to-refresh states
- [ ] Keep deleted transfers hidden, matching the current repository query
- [ ] Allow opening an existing transfer from the history without duplicating the form logic
- [ ] Add tests for ordering, empty state and archived/deleted wallet names

## Acceptance Criteria
- [ ] The accounts tab exposes the transfer history
- [ ] Every non-deleted transfer appears exactly once
- [ ] The newest transfer appears first
- [ ] A transfer between an archived or deleted wallet still shows a readable wallet name
- [ ] The empty state explains that no transfers have been made yet
- [ ] The view reuses the existing transfer service and mapper
- [ ] The dashboard can navigate to this view from its recent-transfers section

## Technical Notes
- `TransferService.getTransfers` and `FirebaseTransferRepository.getTransfers` already load the full owner history; reuse them instead of adding a new query.
- Use `features/transfers/utils/transfer-sort.ts` for ordering and the existing `TransferItem` where possible.
- Keep the history read-only for this ticket except for opening the existing edit flow; do not add batch actions.
- The route must stay inside the private area and follow the same auth guard as the other tabs.
- Coordinate the entry point and the "ver historial" button with TICKET-027.

## Dependencies
- TICKET-003 Transfers and dashboard
- TICKET-018 Archived and deleted wallet labels
