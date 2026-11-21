# [DONE] TICKET-009 - Future: Shared Expenses

**Type:** Feature  
**Priority:** High  
**Status:** ✅ Done (21/11/2026)  
**Related:** PM-006; TICKET-008, TICKET-010, TICKET-011  
**Sprint:** Post-MVP  

## Description
Add expenses inside a group, choose who paid and split the amount equally, by percentage, by fixed amounts or by shares.

> The 1:1 subset (two accepted friends) shipped on 15/11/2026. The group
> requirements below shipped on 21/11/2026 with their own `groupExpenses`
> collection, the four split modes in the group form and a read-only detail
> route. Group balances, settlement and history remain TICKET-010/011, and the
> membership lifecycle remains TICKET-068.

## Requirements
- [x] Create a shared expense with description, amount, date, payer and participants
- [x] Any active group member can create a group expense; the owner uses the same form
- [x] In the group form, choose the participating members: all active members are selected by default, a **Todos** shortcut selects or clears all, and only the selected participants appear in the split inputs and receive a share. Equal split divides the amount among the selected participants.
- [x] The payer must be an active group member and may be excluded from the participants (pays for others) with a 0 share; their net balance is credited the full amount.
- [x] The owner can edit or delete any group expense; the creator and the payer can edit or delete their own; the other members have read-only access.
- [x] Support equal, percentage, fixed-amount and share-based splits (domain and tests cover all four; the 1:1 form keeps only **Igual** and **Importe**, while the group form exposes all four)
- [x] Validate that all participants are group members and the payer is a member
- [x] Validate that split values add up to the total, with deterministic rounding
- [x] Store every group expense in its own currency, with the group default currency as the initial value for new expenses
- [x] Allow editing and soft-deleting an expense while keeping an audit trail
- [x] Show the expense in the group detail and feed the balance calculation (the ledger emits the direct-debt rows; the balance view itself is TICKET-010)
- [x] Add tests for every split mode, rounding and invalid inputs
- [x] Add tests for the participant selection, a payer outside the participant list and the owner/creator/payer edit permissions

## Acceptance Criteria
- [x] A member can add an expense and see it in the group
- [x] A member can choose which group members participated; the shares only cover those members and sum to the total
- [x] The payer can pay for others without consuming; their net balance is credited the full amount and the selected participants are debited their shares
- [x] The owner, the creator and the payer can edit/delete; the other members cannot
- [x] Each participant's share is calculated correctly for all split modes
- [x] The sum of shares always equals the expense total
- [x] Non-members cannot create or read the expense
- [x] Editing or deleting an expense updates balances without losing history

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

## Implemented (group part, 21/11/2026)

### Data model
- New feature `features/group-expenses/`. Root collection
  `groupExpenses/{expenseId}` with a `groupId` field and a client-generated id.
  The list is one `where('groupId', '==', groupId)` plus a client-side sort, so
  **no composite index** is required. A `groups/{groupId}/expenses` subcollection
  was rejected because a cross-group query would need a collection-group index.
- `GroupExpense`: `groupId`, `payerId`, `amountCents` (integer cents),
  `currency` per expense, `splitMode`, `participants[{ userId, shareCents,
  percentageBps?, weight? }]`, `description`, `date`, `createdBy`, `createdAt`,
  `updatedAt` and `deletedAt`. There is no wallet, category or linked movement:
  group expenses never touch personal balances.
- `groupExpenses.mapper.ts` drops malformed documents; the repository only
  writes mutable fields on update and a single soft-delete stamp pair.
- The group `defaultCurrency` is only the initial form value; balances stay
  grouped per currency and are never converted.

### Split, participants and permissions
- The shared split engine is reused (`splitExpenseAmount`,
  `distributeByRemainder`, the split schemas): equal, percentage, fixed and
  shares in integer cents. The engine gained an explicit `minParticipants`
  option (default 2, so the 1:1 contract is unchanged) and the group schema
  passes `minParticipants: 1`, because a payer can be excluded and a group can
  charge a single participant.
- Participants: at least one, all active group members, unique; all selected by
  default; **Todos** selects or clears the whole list; only selected members
  appear in the split inputs and receive a share; equal divides among selected.
- Payer: must be an active member and may be excluded from `participants`; the
  full amount is credited implicitly and a 0 share creates no debt.
- Any active member creates. The owner, the creator or the payer edits and
  soft-deletes; other members are read-only. `groupId`, `createdBy` and
  `createdAt` are immutable, soft-deleted records are never edited or
  resurrected, delete is idempotent and hard delete is denied.
- If a payer or participant is no longer a member (possible before TICKET-068's
  balance-safe lifecycle), the expense is read-only (`EXPENSE_HAS_FORMER_MEMBERS`)
  and can still be soft-deleted by an editor, so a smaller participant set can
  never silently move debt.

### Ledger seam for TICKET-010
- `buildGroupExpenseLedgerEntries` emits one row per active non-payer
  participant with a positive share (`fromUserId` owes `toUserId = payerId`),
  reusing the same integer-cent convention as the 1:1 ledger;
  `getGroupExpenseViewerShare` gives the list row its viewer share.
- Net balances, zero-sum validation, simplification and settlements stay in
  TICKET-010.

### UI and routes
- The group detail lists the active expenses newest first with loading, error,
  empty and pull-to-refresh states, a **+** FAB and its page sheet. The
  hardcoded **En paz** line is hidden while the group has expenses; TICKET-010
  replaces it with the real per-currency balances.
- The Movements FAB **Gasto de grupo** action is enabled and opens a group
  picker before the form; the action is disabled with a **Social** hint when the
  viewer has no groups and stays neutral while loading or after an error.
- The form is a page sheet with group (locked when it comes from the group
  detail or an edit), description, amount, per-expense currency, date,
  participant multi-select, payer chips and the four split modes. A group picked
  from Movements loads its members once; the group detail and the expense detail
  reuse their already-loaded members.
- `/social/group-expenses/[expenseId]` is the read-only detail with summary,
  group/payer/split/date/participant-count fields, the per-participant shares
  (viewer first, payer labelled), edit/delete only for the owner/creator/payer,
  a safe missing state, back navigation to the group and a former-members
  warning. `DetailView` gained per-action `showEdit`/`showDelete` flags whose
  defaults preserve movements and transfers.
- Copy lives in the `groupExpenses` es/en namespace; `npm run check:copy` audits
  every string.

### Firestore rules
- New `groupExpenses` block: `get`/`list` require an active member, proven with
  **one** group `get()` (Firestore caches it per request, same precedent as
  `groupJoinRequests`); create validates `createdBy`, caller and payer in
  `memberIds`, money/mode/description/date bounds, 1..20 participants, the exact
  field list and `deletedAt: null`; update requires owner/creator/payer, freezes
  `groupId`/`createdBy`/`createdAt`, accepts only the soft-delete diff or the
  mutable-field diff and never resurrects; `delete` is denied.
- Rules cannot iterate a list, so per-row participant membership, uniqueness and
  the shares-sum invariant stay in the schema and the service; the block
  documents this accepted trade-off.
- The rules are **not deployed**: run `npm run firebase-deploy:rules`.

### Tests and verification
- New colocated tests cover the schema (membership, payer exclusion, the four
  modes, invalid inputs), the ledger, permissions, mapper, repository,
  operations, service guards and the factory, including the one-participant
  split and the former-members read-only rule.
- `npx tsc --noEmit`, `npx expo lint` and `npx jest` (329 suites / 2015 tests)
  pass; `npm run test:coverage` passes its gate at 98.92 % statements,
  94.66 % branches, 98.64 % functions and 99.5 % lines, and
  `npm run check:copy` audits 308 TSX files.
- `npx firebase deploy --only firestore:rules --dry-run` compiles the rules.
- Device and dark-mode visual validation of the new sheet, picker and detail
  route is still pending (the repo has no renderer).

### Remaining after TICKET-009
- Group balances, settlement and balance simplification (TICKET-010).
- Group history (TICKET-011) and the membership lifecycle (TICKET-068).
- Full 1:1 design and limitations:
  `docs/project/development-notes/session-notes/2026-11-15-shared-expenses-1to1.md`;
  group implementation:
  `docs/project/development-notes/session-notes/2026-11-21-group-expenses.md`.

## Technical Notes
- Suggested collection: `groups/{groupId}/expenses/{expenseId}` or a root `groupExpenses` collection with `groupId`.
- Store money in integer cents to avoid floating-point errors. Reuse the existing money utilities where possible. Each group expense stores its own `currency`; the group `defaultCurrency` is only the initial value for a new expense, and balances are grouped per currency and never converted (same model as 1:1 shared expenses).
- Suggested fields: `payerId`, `amountCents`, `currency`, `splitMode`, `participants[{ userId, shareCents }]`, `description`, `date`, `createdBy`, `createdAt`, `updatedAt`, `deletedAt`.
- The balance calculation belongs in a pure service used by both the group screen and the friends screen.
- The group form reuses the split engine (`splitExpenseAmount`, `distributeByRemainder`, the split schemas) and the shared page-sheet patterns, but replaces the single friend field with a group member multi-select and a participant selector. Do not duplicate the money math or the four split modes.
- Participant selector: all active members are selected by default; **Todos** selects or clears the whole list; only selected participants are rendered in the per-mode inputs and receive a share. The equal split divides the amount among the selected participants. A group expense must keep at least one selected participant.
- The payer must be an active group member but may be absent from `participants` (pays for others) with a 0 share. The ledger credits the payer the full amount and debits each selected participant's share; a 0 share creates no debt.
- Edit/delete permissions: the owner can moderate any group expense; the creator and the payer can edit/delete their own; the other members are read-only. The service returns `NOT_EXPENSE_EDITOR` (or the existing equivalent) before any write.
- Collection decision: prefer a root `groupExpenses` collection with `groupId` (or `groups/{groupId}/expenses`) and document the access-control/read-budget trade-off. The 1:1 `sharedExpenses` mapper is pair-specific and must not be stretched to N participants without a deliberate schema change.
- Personal wallet balances are not modified by group expenses unless a future ticket explicitly defines a settlement-to-wallet flow. TICKET-044 defines that flow for the payer of a 1:1 expense and TICKET-046 for 1:1 settlements; group expenses still leave personal wallets untouched.
- Decision record for the participant selector and permissions: `session-notes/2026-11-20-group-expenses-and-membership-decisions.md`.

## Dependencies
- TICKET-008 Groups
- TICKET-007 Friends and Requests
