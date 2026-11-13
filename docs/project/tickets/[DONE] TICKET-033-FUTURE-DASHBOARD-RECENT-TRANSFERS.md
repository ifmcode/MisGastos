# [DONE] TICKET-033 - Fix the Dashboard Recent Transfers Limit and Freshness

**Type:** Bug / UX  
**Priority:** High  
**Status:** ✅ Done (13/11/2026)  
**Related:** PM-033; TICKET-027, TICKET-032  
**Sprint:** Post-MVP / Phase 3.5  

## Description
The dashboard must show at most three recent transfers and a **Ver todos** action that opens the transfer history when there are more than three, exactly like recent movements. Today it can show only the transfers loaded the first time the dashboard mounted (commonly two), because `DashboardScreen` refreshes wallets on focus but keeps its own `useTransfers`/`useTransactions` state untouched. Transfers created from the **Carteras** tab after TICKET-032 live in a different hook instance, so the dashboard never sees them and `hasMore` stays false.

## Requirements
- [x] Refresh the dashboard's transfers when the tab regains focus (skip the first focus, like the wallets refresh) so creations, edits and deletions made in **Carteras** or `/transfers` appear without pull-to-refresh
- [x] Refresh the dashboard's transactions on focus too, because the dashboard keeps its own `useTransactions` state and movements created in the **Movimientos** tab suffer the same staleness; use one shared refresh pattern with no duplicate fetches
- [x] Keep `DASHBOARD_RECENT_LIMIT = 3` as the only cap and render exactly the three newest transfers when there are three or more
- [x] Show a **Ver todos** action in the recent-transfers header when `hasMore` is true and open `/transfers`; hide it when there are three or fewer
- [x] Align the transfers action with the movements section (**Ver todos** plus specific accessibility labels), replacing the current conditional **Ver historial** label
- [x] Keep pull-to-refresh refreshing wallets, transfers, transactions and categories
- [x] Add or keep regression tests for the 4→3 with `hasMore` and 3→no `hasMore` boundaries

## Acceptance Criteria
- [x] Creating a transfer in **Carteras** and returning to **Inicio** shows it among the three recent transfers without a manual refresh
- [x] With four or more transfers the dashboard renders exactly three cards and **Ver todos** opens the transfer history
- [x] With three or fewer transfers no action is shown
- [x] Recent movements show the same freshness and action behavior
- [x] No duplicate transfer query is added: the dashboard keeps a single `useTransfers` instance and refreshes it on focus
- [x] `npx tsc --noEmit`, `npx expo lint` and `npx jest` pass

## Technical Notes
- **Root cause:** `DashboardScreen` has a `useFocusEffect` that calls only `walletsState.refresh()` (around lines 40-49). `transfersState` and `transactionsState` come from their own `useAsyncCollection` hooks created on mount.
- `getRecentTransfers`/`getRecentMovements` in `features/dashboard/utils/dashboard-recent.ts` already cap correctly; the bug is stale input, not the slicing.
- Reuse the `hasFocusedOnce` guard already used by the dashboard and the movements tab so the first focus does not duplicate the initial load.
- `useDashboardOverview` already derives `hasMoreTransfers` from the input; no new derived state is needed.
- Expected change: add `void transfersState.refresh()` and `void transactionsState.refresh()` to the existing focus callback; the dashboard keeps the same single instances of both hooks.
- **Copy:** use **Ver todos** in both sections; accessibility labels `Ver todos los movimientos` and `Ver historial de transferencias`.
- **Out of scope:** changing the three-item limit, transfer filters and dashboard quick add (TICKET-019).

## Implemented (13/11/2026)
- **Focus freshness:** `DashboardScreen` now refreshes wallets, transfers and transactions in the same focus callback, guarded by the existing `hasFocusedOnce` ref so the first focus does not duplicate the initial load. The screen keeps its single `useWallets`, `useTransfers` and `useTransactions` instances; no extra query was added.
- **Transfers action:** `DashboardTransfersSection` renders **Ver todos** when `hasMore` is true and keeps opening `/transfers`; with three or fewer transfers the header renders no action. The old **Ver historial** label was removed.
- **Accessibility:** `DashboardSectionHeader` accepts an optional `actionAccessibilityLabel` (defaults to the visible label). Movements now announce **Ver todos los movimientos** and transfers **Ver historial de transferencias**.
- **Copy:** added `movements.viewAllAccessibility` and `transfers.viewAllAccessibility`, added `transfers.viewAll` and removed the unused `transfers.viewHistory` key in both `es` and `en`.
- **Pull-to-refresh:** unchanged and still reloads wallets, transfers, transactions and categories.
- **Tests:** kept the 4→3 with `hasMore` and 3→no `hasMore` regressions for both sections and added an explicit `DASHBOARD_RECENT_LIMIT === 3` assertion.
- **Verification:** `npx tsc --noEmit`, `npx expo lint`, `npx jest --runInBand` (133 suites / 614 tests) and `npm run check:copy` (155 TSX files) pass.

## Dependencies
- TICKET-027 Home recent movements and transfers
- TICKET-032 Wallet transfer entry point
