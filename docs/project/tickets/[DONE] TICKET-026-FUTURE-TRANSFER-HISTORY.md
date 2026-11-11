# [DONE] TICKET-026 - Future: Transfer History

**Type:** Feature  
**Priority:** Medium  
**Status:** ✅ Done (11/11/2026)  
**Related:** PM-026; TICKET-003, TICKET-018, TICKET-027  
**Sprint:** Post-MVP  

## Description
Add a dedicated transfer history view, reachable from the accounts tab. It lists every transfer for the owner so the dashboard can keep showing only the most recent ones.

## Requirements
- [x] Add a **Historial de transferencias** action to the accounts (wallets) screen
- [x] Create a dedicated transfer history view or route
- [x] List all transfers in reverse chronological order
- [x] Show source and destination wallet names, amount, currency, date and notes
- [x] Use stored `fromWalletName` / `toWalletName` or the `[Eliminada]` labels when a wallet no longer exists
- [x] Show loading, error, empty and pull-to-refresh states
- [x] Keep deleted transfers hidden, matching the current repository query
- [x] Allow opening an existing transfer from the history without duplicating the form logic
- [x] Add tests for ordering, empty state and archived/deleted wallet names

## Acceptance Criteria
- [x] The accounts tab exposes the transfer history
- [x] Every non-deleted transfer appears exactly once
- [x] The newest transfer appears first
- [x] A transfer between an archived or deleted wallet still shows a readable wallet name
- [x] The empty state explains that no transfers have been made yet
- [x] The view reuses the existing transfer service and mapper
- [x] The dashboard can navigate to this view from its recent-transfers section

## Technical Notes
- `TransferService.getTransfers` and `FirebaseTransferRepository.getTransfers` already load the full owner history; reuse them instead of adding a new query.
- Use `features/transfers/utils/transfer-sort.ts` for ordering and the existing `TransferItem` where possible.
- Keep the history read-only for this ticket except for opening the existing edit flow; do not add batch actions.
- The route must stay inside the private area and follow the same auth guard as the other tabs.
- Coordinate the entry point and the "ver historial" button with TICKET-027.

## Dependencies
- TICKET-003 Transfers and dashboard
- TICKET-018 Archived and deleted wallet labels

## Implemented

- Added the protected `/transfers` stack route (`app/transfers.tsx`) and
  registered it in `AuthNavigator`. `transfers` is now part of
  `PRIVATE_SEGMENTS`, so anonymous and unverified users follow the same guard as
  the other private routes.
- Added `WalletsTransferHistoryLink` under the accounts header. It opens the
  history and stays hidden while wallets are loading or failed.
- Added `TransferHistoryScreen` with a back header, loading, error, empty and
  pull-to-refresh states. It uses `useTransfers` ->
  `TransferService.getTransfers` -> `FirebaseTransferRepository.getTransfers`,
  so no new query was introduced.
- `getTransferHistoryItems` keeps every non-deleted transfer exactly once and
  sorts newest first with the existing `sortTransfersByDate`.
- `TransferItem` now resolves names through `getTransferWalletNames`: live
  wallet (including archived), stored `fromWalletName` / `toWalletName`, then a
  readable generic label. Deleted wallets keep their `[Eliminada]` prefix.
- Reused the existing transfer form by moving the dashboard-only form modal and
  defaults into the transfers feature: `TransferFormModal`,
  `useTransferFormDialog`, `transfer-form-defaults.ts` and
  `transfer-delete-dialog.ts`. The dashboard and history now share the same
  form, delete confirmation and validation flow. No form logic was duplicated.
- Added the "Ver historial" action to the dashboard recent-transfers section
  header. It navigates to the same `/transfers` route.
- Kept the history read-only except for opening the existing edit flow; no batch
  actions were added.
- Extracted `DashboardWalletsList` so the dashboard screen stays within the
  file-size guideline after adding the history navigation.

### Tests

- `features/transfers/utils/__tests__/transfer-history.test.ts`: ordering,
  deduplication, soft-deleted exclusion and empty-state copy.
- `features/transfers/utils/__tests__/transfer-wallet-names.test.ts`: archived
  wallet, deleted wallet stored name and generic fallback.
- `features/auth/utils/__tests__/auth-redirect.test.ts`: `transfers` route
  protection for anonymous, unverified and verified users.
- Existing transfer form defaults and delete confirmation tests moved with their
  code to the transfers feature.

### Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
```

All pass (78 suites, 378 tests).

### Manual platform checks

1. Open Carteras and tap "Historial de transferencias" on iOS, Android and web:
   the history opens inside the private area.
2. Verify the list is newest first and each transfer appears once.
3. Pull to refresh: the list reloads and the spinner stops when both transfers
   and wallets finish.
4. Open a transfer between an archived wallet and an active wallet: the history
   row shows both readable names.
5. Open a transfer whose wallet was deleted: the stored `[Eliminada]` name is
   shown.
6. With no transfers, confirm the empty state explains that no transfers have
   been made yet.
7. Tap a transfer, edit it in the existing form and save: the history row updates
   and wallet balances reload.
8. From the dashboard recent-transfers section, tap "Ver historial": the same
   history opens.
9. While logged out or with an unverified email, open `/transfers` directly: the
   auth guard redirects to login or verify-email.
