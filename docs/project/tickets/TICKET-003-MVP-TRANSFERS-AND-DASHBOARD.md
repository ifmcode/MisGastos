# TICKET-003 - MVP: Transfers between wallets and Dashboard

**Type:** Feature  
**Priority:** High  
**Status:** ✅ Done  
**Related:** MVP-004, MVP-006  
**Sprint:** MVP  

## Description
Transfers between own wallets and summary view with filterable totals.

## Acceptance Criteria
- [x] Transfer: from, to, amount, date, notes
- [x] Validate sufficient balance in source
- [x] Update both wallet balances
- [x] Don't allow same wallet
- [x] Dashboard: total global, per wallet
- [x] Filter by wallet or "All"
- [x] Clear summary UI
- [x] Tests for critical transfer logic
- [x] Edit transfers and soft-delete them, reverting balances atomically

## Technical Notes
- Consider transfer type or linked movements for traceability
- Must be atomic
- Respect "include in total" toggle
- Clear UX to avoid errors
- Edits and deletions must keep wallet balances consistent; deletion is logical
  so the transfer remains auditable.

## Implementation Notes
- Transfers are stored in a dedicated root `transfers` collection (not as linked
  transactions) for traceability. Each document stores `fromWalletId`,
  `toWalletId`, `amount`, `currency`, `date`, `notes`, `ownerId`, timestamps and
  optional `deletedAt`.
- Only wallets with the same currency can be linked because MVP has no currency
  conversion.
- The service validates ownership, currency, different wallets and sufficient
  source balance. The Firestore repository re-checks everything inside a single
  `runTransaction`, updating both wallet balances and creating the transfer
  atomically.
- The dashboard combines global totals (grouped by currency, respecting
  `includeInTotal`), a wallet filter, per-wallet balances and the three most
  recent transfers.
- Transfers can be edited from the dashboard by tapping a recent transfer. The
  repository reverts the previous effect and applies the new one inside a single
  `runTransaction`; only wallets whose net balance changes are written. The new
  source wallet must not end up negative. The original destination may end up
  negative if the money was already spent, matching how expenses can overdraw a
  wallet.
- Deletion is logical: `deleteTransfer` sets `deletedAt`, reverts both wallet
  balances atomically and keeps the document for audit. Queries hide deleted
  transfers, and hard deletes are not allowed.
- `firestore.rules` allow `read`, `create` and owner-only `update` for transfers,
  preserving `ownerId` and `createdAt`; `delete` is denied.
