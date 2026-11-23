# [DONE] TICKET-069 - Group Expense Wallet Link

**Type:** Feature  
**Priority:** Medium  
**Status:** ✅ Done (22/11/2026)  
**Related:** TICKET-009, TICKET-044, TICKET-048, TICKET-051, TICKET-055, TICKET-010  
**Sprint:** Post-MVP / Phase 6

## Description
Let the payer of a group expense optionally register it as a personal `expense`
movement in one of their own wallets, mirroring the 1:1 **optional wallet
registration** (TICKET-044 + TICKET-055) for a multi-participant expense. This is
the personal side of the expense only: it never changes the group ledger, the
participant shares or the balances of the other members.

## Requirements
- [x] Show the **¿Registrar el gasto en una cartera?** toggle only when the viewer is the payer
- [x] Default the toggle from the existing profile preference `registerSharedExpensesInWallet` (missing = `false`, editable in Settings); an edit derives the state from the stored link
- [x] With **Sí**, require exactly one active wallet owned by the payer with the expense currency and an explicit category, and create one ordinary `expense` movement in the same `runTransaction` as the group expense
- [x] With **No**, create no movement, change no personal balance and keep the group debt identical
- [x] Derive the toggle from `walletId`/`categoryId`/`linkedTransactionId`; never persist a separate boolean
- [x] Switching the payer away from the viewer, switching to **No**, changing to an incompatible currency or deleting the expense reverts the wallet exactly once and soft-deletes the linked movement
- [x] Editing amount, date, currency, wallet or category updates the linked movement atomically; a currency change requires a same-currency wallet or clears and reverts the link
- [x] Show the linked movement in **Movimientos** with a **Grupo** badge; it opens `/social/group-expenses/[expenseId]` and offers no personal edit/delete
- [x] Return stable codes for `INSUFFICIENT_BALANCE`, `WALLET_NOT_FOUND`, `WALLET_NOT_OWNED`, `CURRENCY_MISMATCH`, `CATEGORY_REQUIRED` and the existing group-expense errors
- [x] Add Firestore rules for the group-expense link keys and the linked `transactions` document
- [x] Add tests for the link create/update/delete, the toggle transitions, the currency guard, the balance reversion and the rules compilation

## Acceptance Criteria
- [x] A payer can create a group expense with **Sí** and the wallet balance decreases exactly once by the expense amount
- [x] A payer can create a group expense with **No** and no personal movement or balance change exists
- [x] The group ledger, the participant shares and the other members' balances are identical with **Sí** and **No**
- [x] A non-payer never sees the toggle and can never link a wallet through the service
- [x] Switching **Sí → No**, changing the payer or deleting the expense leaves the wallet exactly as before the link
- [x] A currency change cannot keep a movement in a different currency
- [x] The linked movement is visible in **Movimientos** only for the payer and opens the group expense detail
- [x] Non-members cannot read or create the expense or its linked movement

## Technical Notes
- **Reuse the 1:1 seam, not its repository:** `ILinkedMovementPort` and
  `FirebaseLinkedMovementPort` (`features/shared-expenses/repositories`) already
  own the atomic expense + movement + wallet write through
  `transaction-firestore.utils` and `applyTransactionToBalance`. The
  `sharedExpenses` mapper/repository is pair-specific, so add group-specific
  operations (`group-expense-create-link.operation.ts`,
  `group-expense-update-link.operation.ts`,
  `group-expense-delete-link.operation.ts`) in `features/group-expenses`.
- **Movement shape:** an ordinary `expense` of the payer with an immutable
  `groupExpenseId` (expense-only, like `sharedExpenseId`), the category, the
  group expense currency and the same date. Do not add `groupId` to the
  movement: the link resolves the group expense, which carries the `groupId`.
- **Link coherence:** mirror TICKET-055's invariant (`walletId`,
  `categoryId` and `linkedTransactionId` are all-or-nothing; a category or
  movement cannot exist without the wallet) and TICKET-051's explicit category.
  Reuse the existing error codes where they already exist.
- **Rules:** `groupExpenses` gains the optional link keys and a
  `hasGroupExpenseLinkCoherence` helper; `transactions` accepts a `getAfter`
  check on create because the movement and the expense are written in the same
  transaction, and `get(...) || getAfter(...)` on update to cover an atomic
  currency edit. `groupExpenseId` is immutable and expense-only. Keep the rules
  as single-expression functions and validate with
  `npx firebase deploy --only firestore:rules --dry-run`.
- **Toggle default:** reuse `users.registerSharedExpensesInWallet`, because the
  user intent is the same. If a separate preference is ever needed, rename the
  field in a deliberate migration instead of adding a second boolean now.
- **UI:** reuse the 1:1 patterns for the toggle (`SharedExpenseWalletRegistration`),
  the wallet/category block (`SharedExpenseLinkedMovement` and its pure
  helpers), the currency guard and the save-feedback notice. Extract a shared
  molecule only if both forms need the same component with different copy.
- **Never touch the group ledger:** `buildGroupExpenseLedgerEntries` and the
  participant shares depend only on `amountCents`, `payerId` and the stored
  shares. The linked movement is a personal mirror, not a group settlement.
- **Out of scope:** personal movements for non-payers, wallet movements for
  group settlements (TICKET-010), notifications for the link and moving group
  money into personal wallets without the payer's explicit **Sí**.
- Reference: TICKET-044 and TICKET-055 decision records
  (`session-notes/2026-11-16-shared-expense-wallet-link.md`,
  `session-notes/2026-11-18-shared-expense-form-refinement.md`).

## Implemented

### Data contract
- `GroupExpense` gained `walletId`, `categoryId` and `linkedTransactionId`
  (`string | null`, legacy documents map to `null`). The three keys are
  all-or-nothing: a category or movement never exists without the wallet, and
  `registerInWallet` stays transient and is never persisted.
- The linked movement is an ordinary `expense` of the payer with an immutable
  `groupExpenseId` (expense-only, mapped and written like `sharedExpenseId`),
  the expense currency, date, description and an explicit category. The group
  ledger (`buildGroupExpenseLedgerEntries`), the participant shares and the other
  members' balances never read it.

### Operations and services
- `features/group-expenses/repositories/group-expense-{create,update,delete}-link.operation.ts`
  reuse `ILinkedMovementPort`/`FirebaseLinkedMovementPort` and one
  `runTransaction` over expense + movement + wallet(s). Create charges once;
  update reverts and re-applies once (same wallet, other wallet, revive a
  soft-deleted movement, orphaned `-1` wallet, insufficient balance aborts with
  no write); delete reverts once and stays idempotent.
- `GroupExpensesService` routes to the atomic pair only when the resolved link
  exists; `assertGroupExpenseLinkCoherence`/`resolveGroupExpenseLink` mirror
  TICKET-055, so a non-payer can never persist a wallet and a link without its
  category is rejected with `CATEGORY_REQUIRED`. New stable codes:
  `INSUFFICIENT_BALANCE`, `WALLET_NOT_FOUND`, `WALLET_NOT_OWNED`,
  `CURRENCY_MISMATCH`, `CATEGORY_REQUIRED`, `LINK_WITHOUT_REGISTRATION` and
  `LINKED_MOVEMENT_FOREIGN`.

### Decisions
- **Currency change:** switching to a currency without a compatible wallet
  reverts the wallet once, soft-deletes the movement and saves the expense
  social-only; the form also turns the toggle to **No**. This deliberately
  differs from the 1:1 `CURRENCY_MISMATCH` rejection.
- **Foreign payer:** the owner or creator editing/deleting a linked expense paid
  by another member gets `LINKED_MOVEMENT_FOREIGN`; only the payer can write that
  wallet. The repository also checks it before reading a movement the rules would
  deny.
- **Detail parity:** the group-expense detail shows **Cartera** and
  **Movimiento vinculado** to the payer only, like the 1:1 detail.
- **Delete divergence:** the linked group delete clears `walletId`, `categoryId`
  and `linkedTransactionId` as a unit, while the 1:1 delete still clears only the
  movement id. `isGroupExpenseLinked` never stays true for a deleted record and
  the rules require all three keys to be null in that shape.

### Rules
- `groupExpenses` accepts the three link keys with
  `hasGroupExpenseLinks`/`hasGroupExpenseLinkCoherence`, a regular edit may move
  them and the linked soft delete clears exactly `deletedAt`, `updatedAt` and the
  three keys (all null).
- `transactions` rejects any two of `sharedExpenseId`/`groupExpenseId`/
  `settlementId`, validates `groupExpenseId` with `getAfter` on create and
  `get(...) || getAfter(...)` on update, keeps it immutable and denies a hard
  delete of a linked group movement.
- Rules cannot compare the movement id or the wallet with the expense fields, so
  the pair stays proven by the operation and by the expense's own link keys
  (documented in the rule comment). **Deployment is pending**
  (`npm run firebase-deploy:rules`).

### UI
- The **¿Registrar el gasto en una cartera?** toggle only renders for the viewer
  as payer; new expenses read `users.registerSharedExpensesInWallet` (missing =
  `false`) and edits derive the state from the stored link.
- The six linked-movement molecules in `features/shared-expenses/components`
  accept an optional copy `scope` (`sharedExpenses` by default, `groupExpenses`
  for the group form), so no UI was duplicated. The group form adds the toggle
  after the split section and the wallet/category block while the toggle is on,
  with the same currency guard and save-feedback notice as the 1:1 form.
- **Movimientos** shows a **Grupo** badge for `groupExpenseId` movements and
  opens `/social/group-expenses/[expenseId]`; the dashboard routes them the same
  way, so no personal edit/delete is reachable.
- Accepted edges: a deleted linked wallet keeps the edit toggle on **Yes** and
  the save reports `WALLET_REQUIRED` until a wallet is chosen (1:1 parity), and
  the detail's movement label is the static 1:1 string.

### Tests and verification
- New tests cover the linked create/update/delete, toggle transitions, payer and
  currency changes, the currency guard, exact-once reversion, insufficient
  balance, orphaned wallets, foreign payers and the `groupExpenseId` transaction
  mapping. The rules compile with
  `npx firebase deploy --only firestore:rules --dry-run --project misgastos-61e15`.
- Verified `npx tsc --noEmit`, `npx expo lint`, `npm run check:copy` (315 TSX
  files) and `npx jest --coverage`: **343 suites / 2156 tests**, coverage
  **98.96 % statements / 94.74 % branches / 98.6 % functions / 99.52 % lines**.
  Reviewer verdict `approve with nits`; all findings fixed. Manual device
  validation of the toggle, wallet/category pickers, **Grupo** badge, detail rows
  and light/dark mode is **pending**, and the rules deployment remains a manual
  user action.
- Note: `docs/project/development-notes/session-notes/2026-11-22-group-expense-wallet-link.md`.

## Dependencies
- TICKET-009 Group shared expenses (group expense document and service)
- TICKET-044 and TICKET-055 (1:1 linked-movement port and optional registration)
- TICKET-010, only to keep the group ledger and settlement rules independent
