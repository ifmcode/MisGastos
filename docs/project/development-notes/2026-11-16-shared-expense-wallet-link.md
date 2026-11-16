# Session note - Shared expense wallet and linked personal movement (TICKET-044)

**Date:** 16/11/2026  
**Ticket:** TICKET-044 (done)  
**Status:** ✅ Done (ticket file renamed with the `[DONE] ` prefix)

## Context
Shared expenses lived only in the social ledger: a payer could record that a friend
owed them money, but the money that actually left a wallet never appeared in
**Movimientos**. The two records could drift, a second "split" implementation in
the movements feature was the obvious trap, and the shared-expense detail
(TICKET-043) already reserved a wallet/linked-movement block that rendered nothing.
The business rule "personal wallet balances are not modified by shared expenses"
had been waiting for a ticket to define the payer side; this is it.

## Decision
- **The shared expense stays the social record; the movement is the money record.**
  The linked movement is an ordinary `expense` transaction tagged with
  `sharedExpenseId`, with the payer's `ownerId` and `walletId`. Nothing about the
  split math moves into the transactions feature.
- **One optional link, never a second flow.** `walletId`, `categoryId` and
  `linkedTransactionId` are optional and `null` means "social only", so a plain
  social expense keeps working and legacy documents stay valid. `sharedExpenseId`
  is immutable and only accepted on `type === "expense"` in the mapper and in the
  rules.
- **Atomic pair behind a port.** `createSharedExpenseLinkOperation`,
  `updateSharedExpenseLinkOperation` and `softDeleteSharedExpenseLinkOperation` each
  run a single `runTransaction` over the expense, the movement and the wallet(s).
  `ILinkedMovementPort` (`features/shared-expenses/repositories/linked-movement.port.ts`)
  keeps the feature independent of `firebase-transaction.repository.ts`;
  `FirebaseLinkedMovementPort` adapts it by reusing `transaction-firestore.utils.ts`
  and `transaction-balance.ts`, so the wallet effect is always
  `applyTransactionToBalance` / `revertTransactionFromBalance` and `amountCents` →
  `amount` is converted once at the boundary.
- **`getAfter` on create, `get(...) || getAfter(...)` on update.** Firestore rules
  evaluate `get()` against the pre-transaction state, so on create the new expense
  does not exist yet and `get()` would always reject the pair; `getAfter()` reads
  the post-commit state and validates `type == 'expense'`, the caller in
  `participantIds`, `payerId == request.auth.uid` and an equal `currency`. On update
  both are needed: `get` covers the stored state (payer flip, plain edit) and
  `getAfter` covers an atomic currency edit where the expense and the movement
  change currency in the same commit. A hard delete of a linked movement is denied.
- **Owner-only foreign movements.** The linked movement is readable by its owner
  only. If the other participant created it, the non-payer cannot edit or delete it
  (`LINKED_MOVEMENT_FOREIGN`), and a payer takeover is rejected with
  `LINKED_MOVEMENT_NOT_REVERTIBLE` instead of charging the wallet twice.
- **Deterministic default category.** `ensureSharedExpenseCategory` uses
  `getDefaultCategoryDocumentId(uid, "shared-expense")`, reads first and creates only
  when missing, so a user who renamed **Gastos compartidos** keeps the name and a
  concurrent create resolves on the id instead of a query. `DEFAULT_CATEGORIES` is
  untouched so the category is not seeded for every user.
- **UI never invents a second entry point.** The optional same-currency wallet chips
  (`getActiveWallets` + `WalletChipSelector`/`WalletPickerDialog`, plus a **Sin
  cartera** chip) appear only when the viewer is the payer; the category chips default
  to **Gastos compartidos**. An archived wallet that is already selected stays as an
  edit exception, and a deleted wallet is cleared only after a successful wallet load
  so a transient error never drops the stored choice. Movements and dashboard rows
  show the **Compartido** / **Shared** badge, navigate to
  `/social/expenses/[expenseId]` and offer no personal edit/delete.

## Alternatives rejected
- **Writing the movement from `transactions` and calling back into
  `shared-expenses`:** two owners of the same invariant and two balance paths.
- **Two sequential documents (expense, then movement):** a crash between them leaves
  a wallet debited with no social record, or the reverse. One `runTransaction` is the
  only acceptable shape.
- **`get()` on create:** it always reads the pre-transaction snapshot, so the linked
  pair would never validate.
- **Reusing `ISharedExpensesRepository` as-is:** it writes one document per call, so
  the atomic pair needed its own operations seam.
- **Seeding "Gastos compartidos" in `DEFAULT_CATEGORIES`:** it would create the
  category for every user, including those who never share an expense.
- **Making the movement independently editable:** the two records would drift; edits
  go through the shared-expense form only.

## Consequences
- **Balance follows exactly once.** Create applies, edit applies the delta through the
  same port, delete reverts; a repeated delete is a no-op and a reverted link leaves a
  soft-deleted movement filtered out of the history.
- **Payer flips are explicit.** Viewer → friend reverts the movement, friend → viewer
  recreates one; a currency change without a same-currency wallet fails with
  `CURRENCY_MISMATCH` and saves nothing, and an over-drawn wallet fails with
  `INSUFFICIENT_BALANCE`.
- **New error surface.** `INSUFFICIENT_BALANCE`, `WALLET_NOT_FOUND`,
  `WALLET_NOT_OWNED`, `CURRENCY_MISMATCH`, `LINKED_MOVEMENT_NOT_REVERTIBLE` and
  `LINKED_MOVEMENT_FOREIGN` are stable codes translated in
  `features/shared-expenses/locales/{es,en}.json`.
- **History filter.** `FirebaseTransactionRepository` drops `deletedAt` records, so a
  reverted link cannot appear in **Movimientos** or the dashboard.
- **Rules are written but not deployed**, so the model is only enforced by the service
  until `npm run firebase-deploy:rules` runs from a machine with credentials.

## Accessibility and copy
- Wallet and category chips, the **Sin cartera** chip and the **Compartido** badge carry
  their own labels and hints inside the `shared-expenses` namespaces; the new block is
  themed through `useFormTheme` and split into `shared-expense-wallet-field.tsx`,
  `shared-expense-category-field.tsx`, `shared-expense-category-picker-dialog.tsx` and
  `shared-expense-linked-movement.tsx` to respect the 150-line rule.
- `npm run check:copy` audits 220 TSX files and passes.

## Verification
`npx tsc --noEmit` clean, `npx expo lint` clean, `npx jest --coverage --watchAll=false`
205 suites / 1157 tests passed with 99.07 % statements, 94.74 % branches, 99.01 %
functions and 99.49 % lines, and `npm run check:copy` audits 220 TSX files. Covered:
category ensure, the cents/amount boundary, create/update/delete sync, amount, date,
description, category, wallet and payer both ways, currency mismatch, insufficient
balance, repeated edit, delete idempotency, an orphaned wallet and the foreign-link
guards.

## Known limitations
- **Rules pending deployment** (`npm run firebase-deploy:rules`): the `sharedExpenses`
  link keys and the linked `transactions` guards are not published yet.
- A linked movement created by the other participant is owner-only, so the non-payer
  cannot edit/delete it (`LINKED_MOVEMENT_FOREIGN`) and a payer takeover is rejected
  (`LINKED_MOVEMENT_NOT_REVERTIBLE`).
- A permanently deleted wallet keeps the movement under `walletId: "-1"` and skips the
  balance effect, matching the existing wallet-deletion placeholder.
- **Manual light/dark and screen-reader validation on a device is still pending**; it
  was not performed in this session.

## Open questions
- **TICKET-046 settlements** must reuse this port: the initiator records their own
  movement immediately and the counterpart confirms with their own wallet and
  category, with a rollback on reject/cancel. The rejection codes above are the seam.
- **Groups (TICKET-008 / full TICKET-009)** need the same link per participant, with
  group currency and membership validation instead of the 1:1 pair.
- **TICKET-045** mounts this form from the movements FAB; the movements create menu is
  the only remaining entry point to design.
- **Manual visual/a11y pass** on device (light/dark, es/en, VoiceOver/TalkBack on the
  wallet and category chips) is still recommended and is not claimed as done.
