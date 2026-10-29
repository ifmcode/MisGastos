# Session Note: Transactions MVP (TICKET-002)

**Date:** 29/10/2026
**Ticket:** TICKET-002 / MVP-003

**Status:** Done

## Summary

Implemented expenses and incomes with wallet balance updates, history, filters and sorting. Added the "Movimientos" tab.

## Architecture

Feature-first layout under `features/transactions/`:

| Layer | Files |
|---|---|
| Types | `types/transaction.types.ts` |
| Validation | `schemas/transaction.schema.ts` |
| Utilities | `utils/transaction-date.ts`, `utils/transaction-options.ts`, `utils/transaction-balance.ts`, `utils/transaction-filters.ts` |
| Repository | `repositories/transaction.repository.ts`, `firebase-transaction.repository.ts`, `transaction.mapper.ts` |
| Service | `services/transaction.service.ts`, `transaction.errors.ts`, `transaction.factory.ts` |
| Hooks | `hooks/use-transactions.ts`, `use-transaction-service.ts` |
| UI | `components/transactions-screen.tsx`, `transaction-form.tsx`, `transaction-item.tsx`, `transaction-filters-modal.tsx` |
| Route | `app/(tabs)/transactions.tsx` |

## Data and persistence

- Firestore collections: `transactions` (root) and `wallets` (root).
- `transactions` documents store `ownerId`, `walletId`, `type`, `amount`, `currency`, `categoryId`, `concept`, `notes`, `date` (YYYY-MM-DD), timestamps.
- `wallet.balance` is updated atomically with `runTransaction` when creating, editing (same or different wallet) or deleting a transaction. Income adds, expense subtracts.
- Currency is inherited from the wallet and cannot be changed per transaction.
- Queries: `transactions` filtered by `ownerId`; sorting by `date` and `createdAt` done client-side.
- Wallets remain queried by `ownerId` and sorted client-side.

## Validation

- Amount > 0, up to 2 decimals (uses wallet amount parser).
- Wallet required and must belong to the user; currency must match the wallet.
- Category required and must match the transaction type (fixed MVP categories).
- Concept required, max 80 characters. Notes optional, max 300.
- Date required in `DD/MM/AAAA` format; defaults to today.

## UI

- New "Movimientos" tab with list grouped by date/order, pull-to-refresh, empty/loading/error states.
- FAB to create expense/income.
- Form: type toggle, amount, wallet selector (shows balance/currency), category grid, concept, date, notes.
- Item tap opens edit; destructive delete with confirmation and balance revert.
- Filters modal: wallet, type, category, date range, sort asc/desc.

## Rules

Updated `firestore.rules`:
- `wallets/{walletId}` owner-only by `ownerId`.
- `transactions/{transactionId}` owner-only by `ownerId` (read/update/delete require owner, create requires `ownerId == auth.uid`).

Deploy rules manually if not yet published.

## Tests

All existing tests pass (56 tests). TypeScript, lint and web export verified.
