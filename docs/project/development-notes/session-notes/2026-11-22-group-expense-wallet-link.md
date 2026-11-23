# Group expense wallet link (TICKET-069)

> Session note for TICKET-069, implemented on 22/11/2026. Related: TICKET-009
> (group expenses), TICKET-044/055/051 (1:1 linked movement) and TICKET-010
> (group balances). Data, money and rules → `firebase-data`; form, badge and
> detail → `mobile-ui`; review → `reviewer`.

## Goal

Let the payer of a group expense optionally register it as a personal `expense`
movement in one of their own wallets, mirroring the 1:1 optional registration,
without changing the group ledger, the participant shares or the other members'
balances. The movement is a personal mirror of the payer, never a group record.

## Decisions

1. **Currency change without a compatible wallet** reverts the wallet once,
   soft-deletes the movement and saves the group expense social-only. The form
   also turns the toggle to **No**. This intentionally differs from the 1:1
   flow, which rejects the save with `CURRENCY_MISMATCH`; the ticket asked for
   the reversion.
2. **Non-payer edits/deletes** of a linked expense fail with
   `LINKED_MOVEMENT_FOREIGN`. The owner and creator can still edit a social
   expense paid by someone else, but they cannot write another member's wallet.
   The repository checks the stored payer before reading a movement the rules
   would deny, so the code stays stable even outside the service.
3. **Detail parity**: the group-expense detail shows **Cartera** and
   **Movimiento vinculado** to the payer only, like the 1:1 detail. The label is
   the static 1:1 string because no movement read is needed to render it.
4. **Delete divergence**: the linked group delete clears `walletId`,
   `categoryId` and `linkedTransactionId` as a unit, so `isGroupExpenseLinked`
   never stays true for a deleted record. The 1:1 delete still clears only the
   movement id under its own coherence rule. `firestore.rules` allows exactly
   those three keys and requires all three to be null.
5. **Accepted edge**: when the linked wallet was permanently deleted, the edit
   form keeps the toggle on **Yes** and the save reports `WALLET_REQUIRED` until
   a wallet is chosen (1:1 parity; the link is not dropped silently).

## Data contract

- `GroupExpense` and `ValidatedGroupExpense` gained `walletId`, `categoryId` and
  `linkedTransactionId` (`string | null`; legacy documents map to `null`).
- `GroupExpenseInput` accepts optional `walletId`/`categoryId` and a transient
  `registerInWallet` that is never persisted; the toggle is derived from the
  stored ids.
- The linked movement is an ordinary `expense` of the payer with an immutable
  `groupExpenseId` (expense-only, like `sharedExpenseId`), the expense currency,
  date, description and an explicit category.
- `buildGroupExpenseLedgerEntries` and the shares do not read the link: the
  group debt is identical with and without registration.

## Atomic operations

- `features/group-expenses/repositories/group-expense-create-link.operation.ts`
  writes expense + movement + wallet balance in one `runTransaction`; it requires
  a wallet and a category and aborts on an insufficient balance without writing.
- `group-expense-update-link.operation.ts` reverts the stored effect and applies
  the new one inside the same transaction (same wallet, other wallet, revive a
  soft-deleted movement, orphaned `-1` wallet). Clearing the link (toggle off,
  payer change, currency without a compatible wallet) reverts once and
  soft-deletes the movement instead of rejecting the save.
- `group-expense-delete-link.operation.ts` is idempotent, reverts once and closes
  the record with the three link keys null.
- All three reuse `ILinkedMovementPort`/`FirebaseLinkedMovementPort` and the
  shared movement/wallet references; group-specific helpers throw the group
  codes so `features/group-expenses` never surfaces shared-expense errors.

Service routing lives in `services/group-expense-write.ts`, with
`assertGroupExpenseLinkCoherence`/`resolveGroupExpenseLink` in
`services/group-expense-persist.ts`. New codes: `INSUFFICIENT_BALANCE`,
`WALLET_NOT_FOUND`, `WALLET_NOT_OWNED`, `CURRENCY_MISMATCH`, `CATEGORY_REQUIRED`,
`LINK_WITHOUT_REGISTRATION` and `LINKED_MOVEMENT_FOREIGN`.

## Rules

- `groupExpenses` accepts the link keys with `hasGroupExpenseLinks` and
  `hasGroupExpenseLinkCoherence`, a regular edit may move them and the linked
  soft delete requires all three to be null.
- `transactions` rejects any two of `sharedExpenseId`/`groupExpenseId`/
  `settlementId`; `groupExpenseId` is validated with `getAfter` on create and
  `get(...) || getAfter(...)` on update, is immutable and cannot be hard-deleted.
- Rules cannot prove the movement id/wallet pair; the operation and the expense's
  own keys prove it (documented in the rule comment). Deployment is **pending**
  (`npm run firebase-deploy:rules`).

## UI

- The **¿Registrar el gasto en una cartera?** toggle only renders when the viewer
  is the payer; new expenses read `users.registerSharedExpensesInWallet`
  (missing = `false`) and edits derive the state from the stored link.
- The six linked-movement molecules in `features/shared-expenses/components`
  (`SharedExpenseWalletRegistration`, `SharedExpenseLinkedMovement`,
  `SharedExpenseWalletField`, `SharedExpenseCategoryField`,
  `SharedExpenseCategoryPickerDialog`, `SharedExpenseCategoryPickerOption`)
  accept an optional copy `scope` (`sharedExpenses` default, `groupExpenses` for
  the group form). No component was duplicated.
- The form adds the toggle after the split section and the wallet/category block
  while the toggle is on, with the 1:1 currency guard and save-feedback notice.
- **Movimientos** shows a **Grupo** badge and opens
  `/social/group-expenses/[expenseId]`; the dashboard routes the same way, so no
  personal edit/delete is reachable. Copy lives in the `groupExpenses` namespace.

## Verification

- `npx tsc --noEmit` clean.
- `npx expo lint` clean.
- `npm run check:copy` passed (315 TSX files).
- `npx jest --coverage`: 343 suites / 2156 tests, coverage 98.96 % statements /
  94.74 % branches / 98.6 % functions / 99.52 % lines.
- `npx firebase deploy --only firestore:rules --dry-run --project misgastos-61e15`
  compiled successfully (nothing published).
- Reviewer verdict `approve with nits`; the foreign-payer delete read, the partial
  link left after delete, the post-write mapping and the repository
  `CATEGORY_REQUIRED` were fixed, plus a wallet + currency edit test.

## Pending

- Deploy the rules: `npm run firebase-deploy:rules`.
- Manual device validation of the toggle, wallet and category pickers, the
  **Grupo** badge, the detail rows and light/dark mode.
- Visual evidence for the new block and badge was not captured (no renderer in
  this session).
