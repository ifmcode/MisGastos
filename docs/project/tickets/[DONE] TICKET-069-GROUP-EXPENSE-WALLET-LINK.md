# TICKET-069 - Group Expense Wallet Link

**Type:** Feature  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** TICKET-009, TICKET-044, TICKET-048, TICKET-051, TICKET-055, TICKET-010  
**Sprint:** Post-MVP / Phase 6

## Description
Let the payer of a group expense optionally register it as a personal `expense`
movement in one of their own wallets, mirroring the 1:1 **optional wallet
registration** (TICKET-044 + TICKET-055) for a multi-participant expense. This is
the personal side of the expense only: it never changes the group ledger, the
participant shares or the balances of the other members.

## Requirements
- [ ] Show the **¿Registrar el gasto en una cartera?** toggle only when the viewer is the payer
- [ ] Default the toggle from the existing profile preference `registerSharedExpensesInWallet` (missing = `false`, editable in Settings); an edit derives the state from the stored link
- [ ] With **Sí**, require exactly one active wallet owned by the payer with the expense currency and an explicit category, and create one ordinary `expense` movement in the same `runTransaction` as the group expense
- [ ] With **No**, create no movement, change no personal balance and keep the group debt identical
- [ ] Derive the toggle from `walletId`/`categoryId`/`linkedTransactionId`; never persist a separate boolean
- [ ] Switching the payer away from the viewer, switching to **No**, changing to an incompatible currency or deleting the expense reverts the wallet exactly once and soft-deletes the linked movement
- [ ] Editing amount, date, currency, wallet or category updates the linked movement atomically; a currency change requires a same-currency wallet or clears and reverts the link
- [ ] Show the linked movement in **Movimientos** with a **Grupo** badge; it opens `/social/group-expenses/[expenseId]` and offers no personal edit/delete
- [ ] Return stable codes for `INSUFFICIENT_BALANCE`, `WALLET_NOT_FOUND`, `WALLET_NOT_OWNED`, `CURRENCY_MISMATCH`, `CATEGORY_REQUIRED` and the existing group-expense errors
- [ ] Add Firestore rules for the group-expense link keys and the linked `transactions` document
- [ ] Add tests for the link create/update/delete, the toggle transitions, the currency guard, the balance reversion and the rules compilation

## Acceptance Criteria
- [ ] A payer can create a group expense with **Sí** and the wallet balance decreases exactly once by the expense amount
- [ ] A payer can create a group expense with **No** and no personal movement or balance change exists
- [ ] The group ledger, the participant shares and the other members' balances are identical with **Sí** and **No**
- [ ] A non-payer never sees the toggle and can never link a wallet through the service
- [ ] Switching **Sí → No**, changing the payer or deleting the expense leaves the wallet exactly as before the link
- [ ] A currency change cannot keep a movement in a different currency
- [ ] The linked movement is visible in **Movimientos** only for the payer and opens the group expense detail
- [ ] Non-members cannot read or create the expense or its linked movement

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

## Dependencies
- TICKET-009 Group shared expenses (group expense document and service)
- TICKET-044 and TICKET-055 (1:1 linked-movement port and optional registration)
- TICKET-010, only to keep the group ledger and settlement rules independent
