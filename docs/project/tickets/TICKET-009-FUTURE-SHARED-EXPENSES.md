# TICKET-009 - Future: Shared Expenses

**Type:** Feature  
**Priority:** High  
**Status:** 🚧 In progress  
**Related:** PM-006; TICKET-008, TICKET-010, TICKET-011  
**Sprint:** Post-MVP  

## Description
Add expenses inside a group, choose who paid and split the amount equally, by percentage, by fixed amounts or by shares.

> **Current focus (roadmap Phase 5):** only the 1:1 shared-expense subset ships now,
> between two accepted friends and without groups. Decisions for this slice:
> the four split modes, currency stored per expense (balances grouped by
> currency) and the UI living in a section of the **Amigos** tab. Group expenses
> stay in roadmap Phase 6 with TICKET-008 and the remaining group requirements.

## Requirements
- [x] Create a shared expense with description, amount, date, payer and participants
- [ ] Support equal, percentage, fixed-amount and share-based splits (domain and tests cover all four; since 16/11/2026 the 1:1 form exposes only **Igual** and **Importe**, so percentage and shares return with the group form in Phase 6)
- [ ] Validate that all participants are group members and the payer is a member
- [x] Validate that split values add up to the total, with deterministic rounding
- [ ] Store the expense in the group currency
- [x] Allow editing and soft-deleting an expense while keeping an audit trail
- [ ] Show the expense in the group detail and feed the balance calculation
- [x] Add tests for every split mode, rounding and invalid inputs

> The unchecked requirements are group-only and stay in roadmap Phase 6. The 1:1
> subset stores the currency per expense and the list lives in the **Amigos** tab,
> not in a group detail.

## Acceptance Criteria
- [ ] A member can add an expense and see it in the group
- [x] Each participant's share is calculated correctly for all split modes
- [x] The sum of shares always equals the expense total
- [ ] Non-members cannot create or read the expense
- [x] Editing or deleting an expense updates balances without losing history

> The two unchecked criteria are written for groups. Their 1:1 equivalent is
> enforced today: only the two participants can read, edit or soft-delete an
> expense, and a create requires an existing friendship between both accounts.

## Implemented (1:1 subset, 15/11/2026)

### Data model
- Root collection `sharedExpenses/{expenseId}` in `firestore.rules`; the id is
  client-generated and the sorted participant pair lives in `pairId`
  (`sortedUidA__sortedUidB`), never in the document id.
- `SharedExpense` (`features/shared-expenses/types/shared-expense.types.ts`):
  `participantIds`, `pairId`, `payerId`, `amountCents` (integer cents),
  `currency` per expense, `splitMode`, `participants[{ userId, shareCents,
  percentageBps?, weight? }]`, `description`, `date`, `createdBy`, `createdAt`,
  `updatedAt` and `deletedAt`.
- `participantIds`, `pairId`, `createdBy` and `createdAt` are immutable after
  creation; `UpdateSharedExpenseDto` only carries the mutable fields.
- Persistence: `firebase-shared-expenses.repository.ts` behind
  `shared-expenses.repository.ts`, with `shared-expenses.mapper.ts` and
  `shared-expenses.operations.ts`. One `array-contains` query on
  `participantIds` plus a client-side sort, so no composite index was needed.

### Split modes and rounding
- `splitExpenseAmount` (`utils/expense-split.ts`) is the single entry point and
  works only in integer cents: `equal`, `percentage` (basis points 0–10000),
  `fixed` and `shares` (integer weights).
- `distributeByRemainder` (`utils/expense-remainder.ts`) floors every exact share
  and hands the leftover cents to the biggest fractional remainders, with ties
  broken by `userId` ascending. The result is sorted by `userId`, so it does not
  depend on form order and always sums to `amountCents`.
- Mode validation lives in `utils/expense-split-modes.ts`: percentages must add
  up to exactly 100 % (0 % is allowed, so one participant can take the whole
  expense), fixed amounts must add up to the total, and shares need a positive
  weight sum.
- The 1:1 form offers only **Igual** and **Importe** (product decision,
  16/11/2026). Percentage and shares stay implemented, tested and accepted by the
  schema for the Phase 6 group form; a legacy stored expense with either mode
  still renders and edits.
- Examples: 10.00 EUR 70/30 → 700 + 300 cents; 10.01 EUR 70/30 → 701 + 300
  (the leftover cent follows the larger remainder); 10.00 EUR with weights 2:1 →
  667 + 333; 10.01 EUR equal → 501 + 500, the extra cent going to the smaller
  `userId`.

### Balance derivation
- `buildExpenseLedgerEntries` (`utils/expense-ledger.ts`) turns every active
  expense into one ledger row per non-payer participant with a positive share:
  `fromUserId` (debtor) owes `toUserId` (payer) `amountCents` in the expense
  currency. Soft-deleted expenses are filtered out, so they keep the audit trail
  but never feed balances.
- `SharedExpenseLedgerRepository` implements the friends `IFriendLedgerRepository`
  seam, and `friends.factory.ts` now wires it instead of
  `EmptyFriendLedgerRepository` (still exported for tests).
- Balances are never stored: `calculateFriendBalances` folds the ledger per
  currency, drops zero nets and orders EUR first, then the currency code
  ascending. `Friend.balances[]` and `FriendLedgerEntry.currency` carry that
  grouping, and `FriendRow` renders one balance line per currency.

### UI
- The **Gastos compartidos** list of one friend pair lives in the friend detail
  (`/social/friends/[uid]`, TICKET-042) through `FriendSharedExpensesList`: add
  from that screen's FAB with the friend preselected and locked, plus edit and
  delete, loading/error/empty states and pull-to-refresh. The old tab section was
  removed by TICKET-041 and deleted by TICKET-042.
- `SharedExpenseFormModal` (page-sheet) with friend picker, description, amount,
  currency chips, date field, payer chips, the split-mode chips (**Igual** and
  **Importe**) and the per-mode inputs. Changing the amount resets the fixed
  split to the new defaults instead of leaving stale values.
- Every string lives in the `sharedExpenses` es/en namespace and passes
  `npm run check:copy`.

### Service and guards
- `SharedExpensesService` validates the payload through
  `schemas/shared-expense.schema.ts`, requires the caller to be signed in and a
  participant, requires an existing friendship with the other participant, and
  keeps the pair fixed on edit. Errors are codes (`NOT_PARTICIPANT`,
  `NOT_FRIEND`, `EXPENSE_NOT_FOUND`, `ALREADY_DELETED`, `SIGN_IN_REQUIRED`) mapped
  by `getSharedExpenseErrorCode`.
- Soft delete is idempotent: deleting an already deleted expense is a no-op, and
  an edit on a deleted expense fails with `ALREADY_DELETED`.

### Firestore rules
- `sharedExpenses`: participant-only `get`/`list`; creates require the caller as
  `createdBy`, a sorted pair whose join is `pairId`, the caller inside the pair, a
  positive bounded amount, the four allowed split modes, a bounded description
  and `exists(friendships/{pairId})`.
- Updates keep `participantIds`, `pairId`, `createdBy` and `createdAt` immutable,
  accept only `null` or an ISO string in `deletedAt` and never resurrect a
  soft-deleted expense; `delete` is denied. Rules cannot sum list values, so the
  shares-sum invariant deliberately stays in the schema.
- The rules are **not deployed**: run `npm run firebase-deploy:rules`.

### Tests and verification
- Tests cover every split mode, the remainder distribution and its ties, invalid
  totals/participants/percentages/fixed amounts/weights, the schema, the mapper
  and operations, the repository, the ledger fold, the service guards, soft-delete
  idempotency and the factory wiring.
- `npx tsc --noEmit`, `npx expo lint` and `npx jest` (192 suites / 997 tests)
  pass; `npm run test:coverage` passes its gate at 99.00 % statements,
  94.70 % branches, 99.00 % functions and 99.48 % lines, and
  `npm run check:copy` audits 193 TSX files.
- Reviewer verdict: `changes requested` on two majors (0 % percentages rejected
  and missing docs) plus minors; all were fixed in the same session (0 % support,
  rules share bounds, fixed-mode defaults on amount change, section
  pull-to-refresh, `getFriendBalanceDirection` reuse, dead copy removed).

### Known trade-off and limitations
- `features/friends` and `features/shared-expenses` now reference each other
  (a type-only import plus the factory wiring). Moving the ledger seam to
  `shared/` is deferred to TICKET-010.
- Currency is per expense, not per group; balances are grouped per currency and
  never converted.

### Remaining for Phase 6
- Groups (TICKET-008) and the group-only requirements above: group membership
  and payer validation, group currency and group detail/balance.
- Group balances, settlement and balance simplification (TICKET-010).
- Full design and limitations: `docs/project/development-notes/session-notes/2026-11-15-shared-expenses-1to1.md`.

## Technical Notes
- Suggested collection: `groups/{groupId}/expenses/{expenseId}` or a root `groupExpenses` collection with `groupId`.
- Store money in integer cents to avoid floating-point errors. Reuse the existing money utilities where possible.
- Suggested fields: `payerId`, `amountCents`, `currency`, `splitMode`, `participants[{ userId, shareCents }]`, `description`, `date`, `createdBy`, `createdAt`, `updatedAt`, `deletedAt`.
- The balance calculation belongs in a pure service used by both the group screen and the friends screen.
- Personal wallet balances are not modified by group expenses unless a future ticket explicitly defines a settlement-to-wallet flow. TICKET-044 defines that flow for the payer of a 1:1 expense and TICKET-046 for 1:1 settlements; group expenses still leave personal wallets untouched.

## Dependencies
- TICKET-008 Groups
- TICKET-007 Friends and Requests
