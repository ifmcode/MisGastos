# TICKET-044 - Shared Expense Wallet and Linked Personal Movement

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-006; TICKET-009, TICKET-002, TICKET-018, TICKET-042, TICKET-043, TICKET-046  
**Sprint:** Post-MVP / Phase 5.1

## Description
Let the payer record a shared expense against one of their own wallets, so the money that left that wallet is visible in **Movimientos** without a second split implementation. The shared expense stays the social record; the linked movement is an ordinary `expense` transaction tagged with `sharedExpenseId`, created, edited and soft-deleted in the same `runTransaction` as the expense, and reachable only through the shared-expense detail (TICKET-043).

## Requirements
- [ ] Add optional `walletId`, `categoryId` and `linkedTransactionId` to `SharedExpense`, `ValidatedSharedExpense`, `CreateSharedExpenseDto` and `UpdateSharedExpenseDto`; `null` means "social only, no personal movement"
- [ ] Add `sharedExpenseId?: string` and `deletedAt: string | null` to `Transaction` and the transaction DTOs; the mapper only accepts `sharedExpenseId` on `type === "expense"`
- [ ] Extend `hasExpenseFields` and the `sharedExpenses` create/update rules with the three optional keys, bounded as `string`/`null`, and keep them outside the immutable set
- [ ] Extend `transactions` rules: a document with `sharedExpenseId` must be an `expense`, must keep the field immutable on update and must satisfy a `get()` cross-check on the referenced expense (caller in `participantIds`, `payerId == request.auth.uid`, equal `currency`)
- [ ] Implement `createSharedExpenseLinkOperation`, `updateSharedExpenseLinkOperation` and `softDeleteSharedExpenseLinkOperation` behind a new `ILinkedMovementPort` seam, each one `runTransaction` over the expense, the movement and the wallet document
- [ ] Apply/revert the wallet effect only through `applyTransactionToBalance` / `revertTransactionFromBalance` (`features/transactions/utils/transaction-balance.ts`) and convert `amountCents` → `amount` in one helper at the boundary; no raw arithmetic on amounts
- [ ] Form: when `values.payerId === viewerUid`, render an **optional** wallet selector with the active wallets whose `currency` equals the expense currency (`getActiveWallets` + `WalletChipSelector`); no selection keeps today's behaviour
- [ ] When a wallet is selected, reveal an expense category selector defaulting to **Gastos compartidos**, kept in `categoryId`
- [ ] Add `ensureSharedExpenseCategory(ownerId)` using `getDefaultCategoryDocumentId(ownerId, "shared-expense")`; create it only when missing, never rewrite an existing or renamed category, and do not add it to `DEFAULT_CATEGORIES` (that would seed it for every user)
- [ ] Sync on edit inside one `runTransaction`: amount, date, description, category, wallet and payer update the linked movement; a viewer→friend payer change reverts it and friend→viewer creates one; a currency change without a selected wallet in the new currency fails with a translated code
- [ ] Block a wallet that would go negative with the translated `INSUFFICIENT_BALANCE` code and keep the expense unsaved in that case
- [ ] Movements list: linked movements show a **Compartido** badge, tapping opens `/social/expenses/[expenseId]` instead of the movement detail, and no edit/delete action is offered for them in the personal UI
- [ ] Add the new error codes and their es/en copy in `features/shared-expenses/locales/{es,en}.json`; keep accessibility labels and hints (wallet chips, category chips, badge) in the same namespaces and pass `npm run check:copy`
- [ ] Keep the new wallet/category block themed through `useFormTheme`, working in light and dark mode, and split it into components to respect the 150-line rule
- [ ] Add tests for the category ensure, the cents/amount boundary, every sync path (create, amount, date, description, category, wallet, payer both ways, currency), insufficient balance, repeated edit and delete idempotency
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] The payer can save a shared expense with no wallet (unchanged behaviour) or with a same-currency wallet plus a category
- [ ] Selecting a wallet creates exactly one linked expense movement, and the wallet balance drops by the expense total
- [ ] Editing amount, date, description, category or wallet updates the same movement and the balance follows once, with no double counting
- [ ] Flipping the payer from the viewer to the friend reverts the movement, and flipping it back recreates one
- [ ] Deleting the shared expense soft-deletes the movement and reverts the wallet exactly once; deleting twice changes nothing
- [ ] A currency change without a same-currency wallet is rejected with a translated code and saves nothing
- [ ] A wallet without enough balance is rejected and neither record is written
- [ ] The movements list shows the **Compartido** badge and opens the shared-expense detail; the movement cannot be edited or deleted from there
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- **Repository seam:** the current `ISharedExpensesRepository` writes one document per call, so the atomic pair needs its own interface (`shared-expense-link.operations.ts` + `shared-expenses.repository.ts` extension). `ILinkedMovementPort` keeps `features/shared-expenses` independent of `firebase-transaction.repository.ts`; the adapter reuses `transaction-firestore.utils` and `transaction-balance`.
- **Rules cross-check direction:** Firestore evaluates reads against the pre-transaction state, so only one direction can be validated on create (the movement checks the existing expense). The expense's `linkedTransactionId` cannot be verified in the same commit; bound its shape and keep the ownership guard in the service and in the rules **not deployed**: run `npm run firebase-deploy:rules`.
- **Ownership:** the linked movement carries the payer's `ownerId` and the payer's `walletId`, so both documents stay readable by their own owner only; the friend never receives a movement and the rules never expose one.
- **Category ensure:** the deterministic id makes the operation idempotent across devices. A `get` before an eventual `set` avoids overwriting `name`, `icon`, `color` or `type` on an existing category; a concurrent create is resolved by the deterministic id, not by a query.
- **Soft delete:** `deletedAt` on `transactions` is only written for linked movements; personal deletes stay hard deletes until TICKET-023 generalises soft delete. The movements list must filter `deletedAt` records or the badge would outlive the expense.
- **Business rule update:** `project-memory.md` says personal wallet balances are not modified by shared expenses unless a future ticket defines it. This is that ticket for the payer side; the friend's payment still never touches the viewer's wallets, and settlements stay in TICKET-046.
- **TICKET-045** mounts this same form from the movements FAB; TICKET-043 reserves the linked-movement block that displays wallet and movement here.
- **Out of scope:** TICKET-046 settlements, groups (TICKET-008), independent editing of a linked movement, currency conversion, offline outbox and any change to the split math.

## Validation Plan
- Create three expenses: no wallet, wallet without category change, and wallet with another category; check list, balances and the **Compartido** badge.
- Edit every synced field one at a time and confirm the balance moves once; flip the payer in both directions and confirm the movement appears/disappears.
- Delete an expense with a linked movement, then repeat the delete request and confirm the balance is unchanged.
- Try a currency change with no same-currency wallet and a wallet without enough balance; confirm both are blocked with translated codes.
- Check light/dark mode and Spanish/English, including screen-reader labels for the wallet and category selectors.

## Dependencies
- TICKET-042 Friend detail screen with shared expenses
- TICKET-043 Shared expense detail screen (linked-movement block)
- TICKET-009 1:1 shared expenses (delivered)
- TICKET-002 movements and TICKET-018 wallet management (delivered)
