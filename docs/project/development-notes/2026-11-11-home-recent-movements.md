# Session Note: Home Recent Movements and Transfers (TICKET-027)

**Date:** 11/11/2026  
**Ticket:** TICKET-027 / PM-027  
**Status:** ✅ Done

## Summary

The home tab is now a scrollable summary instead of a wallet list. It keeps the
wallet filter, the total balance card and the quick **Transferir** action, then
shows **Movimientos recientes** followed by **Transferencias recientes**. Each
section renders at most three rows and only exposes its history action when the
full collection has more than three items.

**Ver todos** opens the transactions tab, **Ver historial** opens the protected
`/transfers` route from TICKET-026, and tapping a recent movement opens the
transactions tab. Tapping a recent transfer keeps the shared edit modal. Pull to
refresh reloads wallets, transfers, transactions and categories.

## Architecture

| Layer | Files |
|---|---|
| Screen orchestration | `features/dashboard/components/dashboard-screen.tsx` |
| Scroll layout | `features/dashboard/components/dashboard-overview-scroll.tsx` |
| Movements section | `features/dashboard/components/dashboard-movements-section.tsx` + `styles/dashboard-movements.styles.ts` |
| Transfers section | `features/dashboard/components/dashboard-transfers-section.tsx` |
| Derived data | `features/dashboard/hooks/use-dashboard-overview.ts` + `utils/dashboard-recent.ts` |
| Navigation | `features/dashboard/utils/dashboard-navigation.ts` |
| Existing rows | `features/transactions/components/transaction-item.tsx`, `features/transfers/components/transfer-item.tsx` |
| Tests | `utils/__tests__/dashboard-recent.test.ts`, `utils/__tests__/dashboard-navigation.test.ts` |

## Decisions

- **Keep the wallet filter**: TICKET-027 removes the wallet cards/list, not the
  existing per-wallet total filter. The summary still shows the global total or
  the selected wallet balance, and totals still ignore archived wallets.
- **One cap utility**: `getRecentMovements` and `getRecentTransfers` sort newest
  first, cap at `DASHBOARD_RECENT_LIMIT = 3` and return `hasMore`. The sections
  use `hasMore` to decide whether to render their action, so the rule is tested
  without rendering React Native components.
- **Screen-owned navigation**: `createDashboardNavigationActions` centralizes the
  two destinations, but `DashboardScreen` builds and passes the callbacks. The
  section components remain presentation-only and never import the router.
- **Independent feedback**: the movements section combines transaction and
  category loading/errors because it needs category labels; the transfers section
  has its own loading, error and empty states. Retrying movements reloads both
  transactions and categories.
- **No new query or mapper**: the home reuses `useTransactions`, `useTransfers`,
  `useCategories`, `useWallets`, `TransactionItem` and `TransferItem`.
- **Row accessibility**: `TransactionItem` accepts an optional accessibility hint
  because the home row opens the history tab instead of the detail modal.
- **File size**: the dashboard screen stayed at 149 lines. The removed wallet
  list, list header and empty-wallet state were deleted instead of kept unused.

## Manual platform checks

1. Open the home tab on iOS, Android and web: no wallet cards are rendered; the
   total card and **Transferir** action are still visible.
2. With four or more movements, confirm exactly three appear and **Ver todos**
   opens the transactions tab.
3. With three or fewer movements, confirm the movements action is hidden.
4. With four or more transfers, confirm exactly three appear and **Ver historial**
   opens the transfer history.
5. With three or fewer transfers, confirm the transfers action is hidden.
6. Pull to refresh and verify the spinner stays until wallets, transfers,
   movements and categories finish; both sections update.
7. Force a transaction/category load error and a transfer load error separately:
   each section shows its own retry without hiding the other.
8. Select a wallet in the filter: the total changes to that wallet while archived
   wallets stay out of the global total.
9. Tap a recent movement: the transactions tab opens. Tap a recent transfer: the
   shared edit modal opens.

## Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
```

All pass (80 suites, 381 tests).
