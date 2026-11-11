# [DONE] TICKET-027 - Future: Home Recent Movements and Transfers

**Type:** Improvement  
**Priority:** Medium  
**Status:** ✅ Done (11/11/2026)  
**Related:** PM-027; TICKET-002, TICKET-003, TICKET-019, TICKET-025, TICKET-026  
**Sprint:** Post-MVP  

## Description
Reshape the home tab into a summary: remove the wallet list, show up to three recent movements, and show up to three recent transfers with links to the full history.

## Requirements
- [x] Remove the wallet cards/list from the home tab
- [x] Keep the total balance summary and the quick transfer action
- [x] Add a **Movimientos recientes** section below the total and above recent transfers
- [x] Show at most three recent expense/income movements
- [x] Show a button that opens the transactions tab only when more than three movements exist
- [x] Limit recent transfers to three
- [x] Show a button that opens the transfer history from TICKET-026 when more than three transfers exist
- [x] Reuse the existing movement and transfer item components and labels
- [x] Handle loading, error and empty states for both sections independently
- [x] Add tests for the three-item limits, conditional buttons and navigation callbacks

## Acceptance Criteria
- [x] Home no longer renders the wallet list
- [x] **Movimientos recientes** appears between the total balance and the transfers section
- [x] Exactly three movements are shown when four or more exist
- [x] The movements button navigates to the transactions tab and is hidden with three or fewer movements
- [x] Exactly three transfers are shown when four or more exist
- [x] The transfers button opens the transfer history and is hidden with three or fewer transfers
- [x] Pull-to-refresh reloads both movements and transfers
- [x] Dashboard totals are unchanged and keep ignoring archived wallets

## Technical Notes
- The home screen currently uses a `FlatList` of wallets. Replace that structure with a scrollable summary containing the header, totals, recent movements and recent transfers.
- Load movements with the existing transaction service/hook. Do not duplicate the history filtering or create a second transaction mapper.
- Reuse `recentTransfers` and `walletMap` from `useDashboardOverview`, but cap the rendered list at three.
- Keep button navigation in the screen, not inside the section components, and use the existing tab navigation for movements.
- Do not implement dashboard quick add here; that remains TICKET-019.
- The transfer history button depends on TICKET-026.
- Keep each new section and its styles in separate files to respect the 150-line rule.

## Implemented
- Replaced the home wallet `FlatList` with `DashboardOverviewScroll`: wallet filters, total summary, **Movimientos recientes**, **Transferencias recientes** and pull-to-refresh.
- Removed the wallet cards, the **Carteras** section header and the unused wallet-list/empty-state components. The quick transfer action remains in the header.
- Added `getRecentMovements` / `getRecentTransfers` in `features/dashboard/utils/dashboard-recent.ts`. Both sort newest first, cap at three and expose `hasMore` for the conditional actions.
- Added `DashboardMovementsSection`, which reuses `TransactionItem` and `getTransactionCategory`, and has independent loading, error and empty states. `DashboardTransfersSection` now receives `hasMore` and only renders **Ver historial** when more than three transfers exist.
- Kept navigation in `DashboardScreen` through `createDashboardNavigationActions`: **Ver todos** opens `/transactions`, **Ver historial** opens `/transfers`, and tapping a movement opens the transactions tab. Tapping a transfer keeps the shared edit modal.
- Pull-to-refresh reloads wallets, transfers, transactions and categories. Totals still use active wallets, keep the wallet filter and ignore archived wallets.
- Added `dashboard-recent.test.ts` for the three-item limits and conditional `hasMore` flags, and `dashboard-navigation.test.ts` for both navigation callbacks.
- Verification: `npx tsc --noEmit`, `npx expo lint`, `npx jest --runInBand` → 80 suites / 381 tests.

## Dependencies
- TICKET-002 Transactions and history
- TICKET-003 Transfers and dashboard
- TICKET-026 Transfer history
