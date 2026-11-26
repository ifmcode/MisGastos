---
name: Money and Balances
description: Rounding, wallet balance, transfer, split and settlement invariants for MisGastos. Use whenever a change touches amounts, balances, totals, currency or shared-expense math.
---

# Money and balances

Money bugs are the most expensive class of bug in this app. Follow the existing
helpers instead of writing new arithmetic.

## Representation

- Amounts are decimal numbers rounded to 2 decimals, **not** integer cents, for
  the personal-finance V1 path (`project-memory.md` key decisions).
- Every arithmetic result goes through `roundMoney` (`shared/utils/money.ts`).
  It is idempotent and handles float drift and non-finite input (returns `0`).
- Shared expenses, splits and settlements must be exact. When TICKET-009/010 add
  sharing, compute in integer cents or a decimal type inside the split function
  and convert at the boundary; do not chain `roundMoney` per participant.
- Currency is stored per wallet (and per group later). There is **no conversion**
  in V1: totals are grouped by currency, never summed across currencies.

## Helpers you must reuse

| Helper | File | Purpose |
|---|---|---|
| `roundMoney` | `shared/utils/money.ts` | single rounding entry point |
| `calculateWalletBalance` | `features/wallets/utils/money.ts` | initial + movements |
| `calculateWalletTotals` | same | dashboard totals by currency |
| `readOutboxWalletDeltas` | `shared/lib/local-db/pending-balance.ts` | pending balance delta from the outbox |
| `getSignedTransactionAmount` | `shared/utils/transaction-balance.ts` | income `+`, expense `-` |
| `applyTransactionToBalance` / `revertTransactionFromBalance` | same | apply/revert one movement |
| `applyTransactionUpdateToBalance` | same | revert previous + apply next |
| `applyTransferToBalances` / `hasSufficientBalance` | `features/transfers/utils/transfer-balance.ts` | move between wallets |

## Invariants

1. An expense cannot leave a wallet negative; a transfer needs sufficient balance
   on the source wallet.
2. Balance and record change together inside `runTransaction`; never persist one
   without the other.
3. Edit = revert previous effect + apply new effect, in the same transaction.
   Avoid recomputing from a full history.
4. Delete reverts the stored effect exactly once. Transfers and transactions use
   soft delete (`deletedAt`) so the revert cannot be repeated; the record is never
   hard-deleted. A soft-deleted movement no longer counts as wallet usage, no
   longer blocks deleting its category, and must not be edited (its amount was
   already reverted).
5. Archived wallets (`archivedAt`) leave selectors, totals and transfers but keep
   their history and names. `includeInTotal: false` wallets keep their real
   balance but do not contribute to the dashboard total.
6. Deleted wallets orphan their movements under `walletId: "-1"` with the stored
   `[Eliminada]` name; balances of the deleted wallet no longer matter.
7. Transfers only link wallets with the same currency; global net total is
   unchanged, only per-wallet balances move.
8. A transfer or movement must never produce `-0`, `NaN` or `Infinity` in the UI;
   format with `formatMoney`/`useAppLocale`.

## Tests to write

Cover 0, negative input, exact-half rounding, float drift (e.g. `0.1 + 0.2`),
insufficient balance, self-transfer, currency mismatch, archived/deleted wallets
and repeated delete attempts. Put fixtures in `__tests__/*.fixtures.ts`.

## Review checklist

- [ ] No raw `+`/`-`/`*` on amounts without `roundMoney`.
- [ ] No duplicated sign logic for income/expense.
- [ ] Balance writes are inside the same transaction as the record.
- [ ] Totals still grouped by currency and filtered by `includeInTotal`/`archivedAt`.
- [ ] Tests assert the balance value, not only the returned status.
