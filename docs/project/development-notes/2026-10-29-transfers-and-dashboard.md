# Session Note: Transfers and Dashboard MVP (TICKET-003)

**Date:** 29-30/10/2026
**Ticket:** TICKET-003 / MVP-004, MVP-006

**Status:** Done

## Summary

Implemented transfers between the user's own wallets and rebuilt the dashboard
with global/per-wallet totals, a wallet filter, recent transfers and a transfer
creation modal. Transfers are atomic: both wallet balances change and the
transfer document is created in a single Firestore transaction.

Transfers can also be edited and soft-deleted. Editing reverts the original
effect and applies the new one in the same transaction; deleting marks
`deletedAt`, reverts both balances and keeps the document for audit.

## Architecture

Feature-first layout under `features/transfers/`:

| Layer | Files |
|---|---|
| Types | `types/transfer.types.ts` |
| Validation | `schemas/transfer.schema.ts` |
| Utilities | `utils/transfer-balance.ts`, `utils/transfer-sort.ts`, `utils/transfer-wallets.ts` |
| Repository | `repositories/transfer.repository.ts`, `firebase-transfer.repository.ts`, `transfer.mapper.ts` |
| Service | `services/transfer.service.ts`, `transfer.errors.ts`, `transfer.factory.ts` |
| Hooks | `hooks/use-transfers.ts`, `use-transfer-service.ts` |
| UI | `components/transfer-form.tsx`, `transfer-item.tsx` |

Dashboard:

| Layer | Files |
|---|---|
| Screen | `features/dashboard/components/dashboard-screen.tsx` |
| Summary | `features/dashboard/components/dashboard-summary.tsx` |
| Utilities | `features/dashboard/utils/dashboard-summary.ts` |

## Data and atomicity

- Collection: root `transfers`. Documents store `ownerId`, `fromWalletId`,
  `toWalletId`, `amount`, `currency`, `date` (YYYY-MM-DD), optional `notes`,
  timestamps and optional `deletedAt`.
- Creating a transfer runs `runTransaction`:
  1. validates different wallets, positive amount and currency;
  2. reads both wallet documents;
  3. checks ownership and same currency;
  4. re-checks sufficient source balance;
  5. creates the transfer and updates both wallet balances.
- `updateTransfer` reads the existing transfer and all affected wallets inside
  `runTransaction`, reverts the previous amount and applies the new amount before
  writing. Only wallets whose net balance changes are updated. The new source
  wallet must remain non-negative; the original destination may go negative if
  the money was already spent, consistent with expenses.
- `deleteTransfer` is a soft delete: it sets `deletedAt`, reverts the source and
  destination balances atomically and never hard-deletes the document. Reads
  hide transfers with `deletedAt`, so the dashboard only shows active movements.
- The service also validates against `IWalletRepository` before reaching the
  repository, giving friendly errors. For edits it adds back the original amount
  to the available balance when the selected source was the original source (and
  subtracts it when it was the original destination). The transaction re-checks
  balances to protect against stale reads and concurrent changes.
- Same currency is required because MVP has no currency conversion.
- Queries filter `transfers` by `ownerId`; sorting is client-side, so no new
  composite indexes are needed.

## Validation

- Source and destination are required and must be different.
- Amount > 0 with up to 2 decimals (comma or dot accepted).
- Currency must be supported and match both wallets.
- Date required in `DD/MM/AAAA` format; defaults to today.
- Notes optional, max 300 characters.
- Source balance must cover the amount, including edits: the original transfer is
  reverted before checking the new source balance.
- Only active (non-deleted) transfers can be edited or deleted.

## UI

- Dashboard header keeps the greeting and adds a "Transferir" action when at
  least two wallets share a currency.
- Wallet filter chips: "Todas" plus one chip per wallet.
- Summary card shows global totals grouped by currency. When a wallet is
  selected it shows that wallet's real balance and whether it participates in
  the global total (`includeInTotal`).
- Per-wallet list reuses `WalletCard`.
- Recent transfers section shows the latest three movements. Tapping one opens
  the transfer form in edit mode.
- Transfer modal: source, destination (filtered to same-currency wallets),
  amount with available/projected balance, date and notes. In edit mode it shows
  "Guardar" and a "Eliminar" action with a confirmation alert.
- Loading, error, empty and pull-to-refresh states are handled.

## Rules

Updated `firestore.rules` with an owner-only `transfers/{transferId}` match:
`read` for the owner, `create` when `ownerId == request.auth.uid`, and `update`
for the owner preserving `ownerId` and `createdAt`. Hard `delete` is denied, so
soft-deleted transfers remain auditable.

**Pending manual step:** publish `firestore.rules` to `misgastos-61e15` with
`npx firebase-tools deploy --only firestore:rules`.

## Tests

Added tests for:

- transfer schema validation and field error mapping;
- balance helpers (`hasSufficientBalance`, `applyTransferToBalances`);
- transfer sorting and same-currency pair detection;
- transfer document mapper, including `deletedAt`;
- `TransferService` create/update/delete validation flow, including available
  balance after reverting the original transfer;
- `FirebaseTransferRepository` query, atomic create/update/soft-delete writes,
  insufficient funds, currency mismatch, ownership and missing wallets;
- dashboard totals, wallet filtering and visible wallets.

`npx tsc --noEmit`, `npm run lint` and `npx jest --runInBand` pass (15 suites,
132 tests).
