# TICKET-027 - Future: Home Recent Movements and Transfers

**Type:** Improvement  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-027; TICKET-002, TICKET-003, TICKET-019, TICKET-025, TICKET-026  
**Sprint:** Post-MVP  

## Description
Reshape the home tab into a summary: remove the wallet list, show up to three recent movements, and show up to three recent transfers with links to the full history.

## Requirements
- [ ] Remove the wallet cards/list from the home tab
- [ ] Keep the total balance summary and the quick transfer action
- [ ] Add a **Movimientos recientes** section below the total and above recent transfers
- [ ] Show at most three recent expense/income movements
- [ ] Show a button that opens the transactions tab only when more than three movements exist
- [ ] Limit recent transfers to three
- [ ] Show a button that opens the transfer history from TICKET-026 when more than three transfers exist
- [ ] Reuse the existing movement and transfer item components and labels
- [ ] Handle loading, error and empty states for both sections independently
- [ ] Add tests for the three-item limits, conditional buttons and navigation callbacks

## Acceptance Criteria
- [ ] Home no longer renders the wallet list
- [ ] **Movimientos recientes** appears between the total balance and the transfers section
- [ ] Exactly three movements are shown when four or more exist
- [ ] The movements button navigates to the transactions tab and is hidden with three or fewer movements
- [ ] Exactly three transfers are shown when four or more exist
- [ ] The transfers button opens the transfer history and is hidden with three or fewer transfers
- [ ] Pull-to-refresh reloads both movements and transfers
- [ ] Dashboard totals are unchanged and keep ignoring archived wallets

## Technical Notes
- The home screen currently uses a `FlatList` of wallets. Replace that structure with a scrollable summary containing the header, totals, recent movements and recent transfers.
- Load movements with the existing transaction service/hook. Do not duplicate the history filtering or create a second transaction mapper.
- Reuse `recentTransfers` and `walletMap` from `useDashboardOverview`, but cap the rendered list at three.
- Keep button navigation in the screen, not inside the section components, and use the existing tab navigation for movements.
- Do not implement dashboard quick add here; that remains TICKET-019.
- The transfer history button depends on TICKET-026.
- Keep each new section and its styles in separate files to respect the 150-line rule.

## Dependencies
- TICKET-002 Transactions and history
- TICKET-003 Transfers and dashboard
- TICKET-026 Transfer history
