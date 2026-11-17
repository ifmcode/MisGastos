# Session Note: Transfer History (TICKET-026)

**Date:** 11/11/2026  
**Ticket:** TICKET-026 / PM-026  
**Status:** ✅ Done

## Summary

The accounts screen now exposes **Historial de transferencias**, and the
dashboard recent-transfers header exposes **Ver historial**. Both open the
protected `/transfers` stack route, which lists every non-deleted transfer once,
newest first, with loading, error, empty and pull-to-refresh states.

Each row uses the existing `TransferItem` and shows the source/destination wallet
names, amount, currency, date and notes. Tapping a row opens the existing transfer
form for editing or deletion. The list stays read-only otherwise: no batch
actions and no new create action.

## Architecture

| Layer | Files |
|---|---|
| Route | `app/transfers.tsx` |
| Auth guard | `features/auth/utils/auth-redirect.ts` + `features/auth/components/auth-navigator.tsx` |
| Screen orchestration | `features/transfers/components/transfer-history-screen.tsx` + `hooks/use-transfer-history-screen.ts` |
| Header | `features/transfers/components/transfer-history-header.tsx` |
| Feedback states | `transfer-history-loading-state.tsx`, `transfer-history-error-state.tsx`, `transfer-history-empty-state.tsx` |
| List row | `features/transfers/components/transfer-item.tsx` |
| History data | `features/transfers/utils/transfer-history.ts` |
| Wallet names | `features/transfers/utils/transfer-wallet-names.ts` |
| Shared form | `features/transfers/components/transfer-form-modal.tsx` + `hooks/use-transfer-form-dialog.ts` |
| Form helpers | `features/transfers/utils/transfer-form-defaults.ts`, `transfer-delete-dialog.ts` |
| Accounts entry | `features/wallets/components/wallets-transfer-history-link.tsx` |
| Dashboard entry | `features/dashboard/components/dashboard-section-header.tsx`, `dashboard-transfers-section.tsx`, `dashboard-wallets-list.tsx` |
| Styles | `features/transfers/styles/transfer-history.styles.ts` |
| Tests | `utils/__tests__/transfer-history.test.ts`, `transfer-wallet-names.test.ts`, `transfer-form-defaults.test.ts`, `transfer-delete-dialog.test.ts`, `features/auth/utils/__tests__/auth-redirect.test.ts` |

## Decisions

- **Protected stack route, not a tab**: `/transfers` lives outside the tabs like
  `/categories`. It was added to `PRIVATE_SEGMENTS`, so anonymous users go to
  login and unverified email/password users go to verify-email.
- **No new query**: the screen reuses `useTransfers` →
  `TransferService.getTransfers` → `FirebaseTransferRepository.getTransfers` and
  the existing mapper. `getTransferHistoryItems` only guarantees the view rules:
  drop `deletedAt`, dedupe by id and sort with `sortTransfersByDate`.
- **Shared transfer form**: the dashboard-only modal, dialog hook, defaults and
  delete confirmation moved into `features/transfers`. The dashboard and history
  now use the same form and delete flow, so no form logic is duplicated and the
  transfers feature no longer depends on dashboard internals.
- **Wallet-name resolution**: `TransferItem` now delegates to
  `getTransferWalletNames`. It prefers the live wallet (including archived),
  then the stored `fromWalletName` / `toWalletName`, then `Cartera eliminada`.
  Deleted wallets therefore keep their stored `[Eliminada]` prefix.
- **Entry points**: the accounts link sits below the header and hides while
  wallets are loading or failed. The dashboard action is a text action in the
  recent-transfers section header, so it is visible even when the section is
  empty.
- **File size**: the dashboard screen grew past 150 lines with the new
  navigation, so the wallet list, separator, footer and empty state moved into
  `DashboardWalletsList`. The screen is now 132 lines; the new list is 101.

## Manual platform checks

1. Open Carteras and tap **Historial de transferencias** on iOS, Android and web:
   the history opens inside the private area.
2. Verify the list is newest first and each transfer appears once.
3. Pull to refresh: the list reloads and the spinner stops when both transfers
   and wallets finish.
4. Open a transfer between an archived wallet and an active wallet: the row shows
   both readable names.
5. Open a transfer whose wallet was deleted: the stored `[Eliminada]` name is
   shown.
6. With no transfers, confirm the empty state explains that no transfers have
   been made yet.
7. Tap a transfer, edit it in the existing form and save: the row updates and
   wallet balances reload.
8. From the dashboard recent-transfers section, tap **Ver historial**: the same
   history opens.
9. While logged out or with an unverified email, open `/transfers` directly: the
   auth guard redirects to login or verify-email.

## Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
```

All pass (78 suites, 378 tests).
