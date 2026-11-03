# TICKET-018 - Future: Wallet Management

**Type:** Feature  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-018; TICKET-001, TICKET-002, TICKET-003  
**Sprint:** Post-MVP  

## Description
Complete wallet management with editing and safe archiving or deletion, so users can correct wallet data without breaking existing transactions and transfers.

## Requirements
- [ ] Edit wallet name, icon, colour, type and "include in total"
- [ ] Allow editing the initial balance only when it is safe to do so
- [ ] Archive a wallet so it disappears from selectors but keeps its history
- [ ] Allow permanent deletion only for wallets without movements, or require reassignment
- [ ] Show archived wallets in a separate section or with a clear badge
- [ ] Update dashboard totals and selectors to ignore archived wallets
- [ ] Add confirmation dialogs and validation
- [ ] Add tests for archive rules, deletion guards and balance effects

## Acceptance Criteria
- [ ] Renaming a wallet updates it everywhere without changing transaction history
- [ ] Archived wallets no longer appear in new transaction/transfer selectors
- [ ] Existing transactions still display the archived wallet's name
- [ ] A wallet with transactions or transfers cannot be deleted without reassignment
- [ ] Dashboard totals respect the archived state and "include in total" toggle
- [ ] Only the owner can edit, archive or delete a wallet

## Technical Notes
- Prefer soft delete with `archivedAt` or `deletedAt` in the existing `wallets` collection.
- Wallet ids are referenced by transactions and transfers. A hard delete must be blocked or preceded by a reassignment flow.
- Changing the initial balance changes the current balance. Restrict it to wallets without movements or recalculate carefully.
- Update `features/wallets/` and the shared selectors used by transactions, transfers and the dashboard.
- Adjust `firestore.rules` only if the new fields require it; the existing owner checks already cover updates.

## Dependencies
- TICKET-001 Wallets
- TICKET-002 Transactions
- TICKET-003 Transfers and Dashboard
