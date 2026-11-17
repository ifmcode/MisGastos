# Session note - 1:1 shared expenses (TICKET-009 subset)

**Date:** 15/11/2026  
**Ticket:** TICKET-009 (1:1 subset; the group requirements stay open)  
**Status:** 🚧 In progress (slice delivered)

## Problem
Friends existed but nothing could be shared between them: every balance was 0 and
the friends list had no way to record who paid for what. The roadmap Phase 5
needed a vertical slice that proves the Splitwise side before groups and
settlements: one user records an expense with a friend, chooses who paid, splits
the amount in any of the four modes, and both see the derived debt.

The slice had to stay compatible with the Phase 4 constraints: append-only social
ledgers folded by pure functions, exact integer-cent arithmetic and no readable
directory beyond `publicProfiles`.

## Data model

| Collection | Id | Fields | Access |
|---|---|---|---|
| `sharedExpenses` | Client-generated (`doc(collection(...))`) | `pairId`, `participantIds` (sorted pair), `payerId`, `amountCents`, `currency`, `splitMode`, `participants[{ userId, shareCents, percentageBps?, weight? }]`, `description`, `date`, `createdBy`, `createdAt`, `updatedAt`, `deletedAt` | The two participants |

- `pairId` is `sortedUidA__sortedUidB`, the same convention as friendships. The
  document id is generated so a client can create the record offline later; the
  pair lives in a field.
- `participantIds`, `pairId`, `createdBy` and `createdAt` are immutable. Either
  participant can edit the mutable fields or soft-delete the record.
- Currency is stored **per expense**. Balances are grouped per currency; nothing
  is converted in V1.
- `amountCents` and `shareCents` are integers. Percentages are stored as basis
  points (`0..10000`), shares as integer weights, and fixed splits only keep the
  cents. The raw input is preserved so edit round-trips are exact.
- Reads use `where("participantIds", "array-contains", uid)` and sort on the
  client, so no composite index is needed.

## Split modes and rounding
`splitExpenseAmount(totalCents, mode, participants)` is the only entry point and
works exclusively in integer cents:

| Mode | Input | Validation | Result |
|---|---|---|---|
| `equal` | none | at least two distinct participants | even split, leftover cents to the first ids |
| `percentage` | basis points | sum exactly 10000, each `0..10000` | proportional split |
| `fixed` | cents | sum exactly the total, each `>= 0` | the typed values |
| `shares` | integer weights | at least one positive weight | proportional split |

Rounding is largest remainder: floor every exact share, then hand the remaining
cents to the biggest fractional remainders, with ties broken by `userId`
ascending. Participants are returned sorted by `userId`, so form order never
reaches the document. The sum always equals `amountCents`.

Examples: 10.00 EUR 70/30 → 700 + 300; 10.01 EUR 70/30 → 701 + 300; 10.00 EUR
weights 2:1 → 667 + 333; 10.01 EUR equal → 501 + 500.

Percentages accept 0 % on purpose (one participant can take the whole expense) as
long as the total is 100 %. The schema rejects zero, negative, oversized and
non-integer totals, mismatched sums, duplicate participants and malformed values
with stable codes that the UI translates.

## Balance derivation

```text
active expense ──▶ payer + participants[].shareCents
                    │
                    └─▶ one ledger row per non-payer positive share
                        fromUserId (debtor) owes toUserId (payer)
```

- `buildExpenseLedgerEntries` skips soft-deleted expenses and zero shares, so an
  expense whose payer also covers everything produces no debt.
- `SharedExpenseLedgerRepository` implements the friends
  `IFriendLedgerRepository` seam. `friends.factory.ts` now wires it instead of
  `EmptyFriendLedgerRepository` (kept for tests).
- No balance is stored: `calculateFriendBalances` folds entries per currency,
  drops zero nets and orders EUR first then the currency code. Positive means
  the friend owes the viewer, matching `Friend.balances[]`, `FriendRow` and the
  **Te debe** / **Le debes** copy.
- Personal wallet balances are untouched. Moving group money to a wallet remains
  a separate future decision.

## UI flow
- A **Gastos compartidos** section at the end of the **Amigos** tab lists the
  active expenses with description, date, total, payer and the viewer share, and
  offers edit (pencil) and delete (trash) with roles, labels and hints.
- The page-sheet form has a friend picker (locked while editing), description,
  total and currency, quick date, payer chips, four split-mode chips and one input
  per participant. Switching mode keeps typed values when they still split the
  amount and generates valid defaults otherwise; changing the amount regenerates
  the fixed defaults only while they are untouched.
- Delete asks for confirmation through the shared `ConfirmDialog`, then reloads
  the list and the friends overview so the balances follow. The friends screen
  pull-to-refresh also reloads the section.
- Every string lives in the `sharedExpenses` namespace (`es`/`en`), including
  accessibility copy and all validation/operation error codes.

## Rules summary
- `sharedExpenses` reads are participant-only.
- Creates require the caller as `createdBy`, a sorted pair whose join is
  `pairId`, the caller inside the pair, the payer inside the pair, a positive
  bounded amount, one of the four modes, a bounded description, bounded share
  rows and `exists(friendships/{pairId})`.
- Updates keep the pair and creation stamp immutable, only accept `null` or a
  string in `deletedAt` and never resurrect a soft-deleted expense.
- Hard deletes are denied. Rules cannot sum list values, so the shares-sum
  invariant deliberately stays in the schema.
- No index change. The rules are **not deployed**: run
  `npm run firebase-deploy:rules` before testing with real accounts.

## Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest
npm run test:coverage
npm run check:copy
```

All pass: 192 suites / 997 tests, coverage 99.00 % statements, 94.70 % branches,
99.00 % functions and 99.48 % lines, `check:copy` audits 193 TSX files. The
reviewer verdict was `changes requested`; both majors (0 % percentages, missing
docs) and every minor were fixed in the same session.

## Limitations and next steps
- **Groups (Phase 6):** group membership and payer validation, group currency and
  the expense in the group detail are still open in TICKET-009.
- **Balances and settlements (TICKET-010):** the friends list already shows real
  per-currency debts; recording payments and simplifying debts is the next slice.
- **Rules are not deployed** and should be exercised with real accounts after
  `npm run firebase-deploy:rules`.
- **Offline** waits for roadmap Phase 7. The ledger is already append-only and
  folded by pure functions, so the shape is compatible.
- **Seam trade-off:** `features/friends` and `features/shared-expenses` reference
  each other (a type-only import plus the factory wiring). Moving the ledger seam
  to `shared/` is deferred to TICKET-010, when settlements add a second source.
- **Group reuse:** `buildExpenseLedgerEntries` must switch its ledger row id from
  the expense id to `${expense.id}:${participant.userId}` when an expense can have
  several debtors.
