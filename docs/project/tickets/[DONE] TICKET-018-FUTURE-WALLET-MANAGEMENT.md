# [DONE] TICKET-018 - Future: Wallet Management

**Type:** Feature  
**Priority:** Medium  
**Status:** ✅ Done (10/11/2026)  
**Related:** PM-018; TICKET-001, TICKET-002, TICKET-003  
**Sprint:** Post-MVP  

## Description
Complete wallet management with editing and safe archiving or deletion, so users can correct wallet data without breaking existing transactions and transfers.

## Requirements
- [x] Edit wallet name, icon, colour, type and "include in total"
- [x] Allow editing the initial balance only when it is safe to do so
- [x] Archive a wallet so it disappears from selectors but keeps its history
- [x] Allow permanent deletion only for wallets without movements, or require reassignment
- [x] Show archived wallets in a separate section or with a clear badge
- [x] Update dashboard totals and selectors to ignore archived wallets
- [x] Add confirmation dialogs and validation
- [x] Add tests for archive rules, deletion guards and balance effects

## Acceptance Criteria
- [x] Renaming a wallet updates it everywhere without changing transaction history
- [x] Archived wallets no longer appear in new transaction/transfer selectors
- [x] Existing transactions still display the archived wallet's name
- [x] A wallet with transactions or transfers cannot be deleted without reassignment
- [x] Dashboard totals respect the archived state and "include in total" toggle
- [x] Only the owner can edit, archive or delete a wallet

## Technical Notes
- Prefer soft delete with `archivedAt` or `deletedAt` in the existing `wallets` collection.
- Wallet ids are referenced by transactions and transfers. A hard delete must be blocked or preceded by a reassignment flow.
- Changing the initial balance changes the current balance. Restrict it to wallets without movements or recalculate carefully.
- Update `features/wallets/` and the shared selectors used by transactions, transfers and the dashboard.
- Adjust `firestore.rules` only if the new fields require it; the existing owner checks already cover updates.

## Implemented
- Wallet cards open a management sheet with **Editar**, **Archivar/Restaurar** and **Eliminar** actions. Only the owner sees them and the service rejects foreign wallets.
- Edit mode reuses the wallet form with name, icon, colour, type, description and "include in total". Currency stays locked because movements store the original currency.
- The initial balance is editable only when `getWalletUsage` reports no transactions or transfers. The field is locked otherwise and the service re-checks the guard before persisting.
- Archive stores `archivedAt`; archived wallets leave the active list, totals, filters and transaction/transfer selectors but stay visible in an **Archivadas** section with a badge and a restore action.
- Permanent deletion supports two modes:
  - **Reasignar**: moves transactions and transfers to a compatible active wallet of the same currency, updates the target balance atomically and rejects the transfer counterpart or archived targets.
  - **Conservar movimientos**: keeps history under the virtual `walletId: "-1"` placeholder with the stored `[Eliminada] <name>` label. Orphaned movements no longer affect any real wallet balance.
- Transfers that cannot be fully reassigned orphan only the deleted side, keeping the real wallet's balance consistent and preserving the original names for history and delete dialogs.
- Added `ConfirmDialog` archive/restore confirmation with a `primary` tone, delete-mode selection, usage summary and disabled confirmation while usage is loading or failed.
- Dashboard and transaction screens consume active wallets for selectors and totals while resolving history labels from the full wallet list.
- Added tests for update/archive/delete guards, owner checks, deletion modes, orphan and reassignment balance effects, archived totals and stored movement names.

## Verification
- `npx tsc --noEmit`
- `npx expo lint`
- `npx jest` (74 suites, 353 tests)

## Dependencies
- TICKET-001 Wallets
- TICKET-002 Transactions
- TICKET-003 Transfers and Dashboard
