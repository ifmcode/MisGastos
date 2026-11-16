# [DONE] TICKET-044 - Shared Expense Wallet and Linked Personal Movement

**Type:** Feature  
**Priority:** High  
**Status:** ✅ Done (16/11/2026)  
**Related:** PM-006; TICKET-009, TICKET-002, TICKET-018, TICKET-042, TICKET-043, TICKET-046  
**Sprint:** Post-MVP / Phase 5.1

## Description
Let the payer record a shared expense against one of their own wallets, so the money that left that wallet is visible in **Movimientos** without a second split implementation. The shared expense stays the social record; the linked movement is an ordinary `expense` transaction tagged with `sharedExpenseId`, created, edited and soft-deleted in the same `runTransaction` as the expense, and reachable only through the shared-expense detail (TICKET-043).

## Requirements
- [x] Add optional `walletId`, `categoryId` and `linkedTransactionId` to `SharedExpense`, `ValidatedSharedExpense`, `CreateSharedExpenseDto` and `UpdateSharedExpenseDto`; `null` means "social only, no personal movement"
- [x] Add `sharedExpenseId?: string` and `deletedAt: string | null` to `Transaction` and the transaction DTOs; the mapper only accepts `sharedExpenseId` on `type === "expense"`
- [x] Extend `hasExpenseFields` and the `sharedExpenses` create/update rules with the three optional keys, bounded as `string`/`null`, and keep them outside the immutable set
- [x] Extend `transactions` rules: a document with `sharedExpenseId` must be an `expense`, must keep the field immutable on update and must satisfy a `get()` cross-check on the referenced expense (caller in `participantIds`, `payerId == request.auth.uid`, equal `currency`)
- [x] Implement `createSharedExpenseLinkOperation`, `updateSharedExpenseLinkOperation` and `softDeleteSharedExpenseLinkOperation` behind a new `ILinkedMovementPort` seam, each one `runTransaction` over the expense, the movement and the wallet document
- [x] Apply/revert the wallet effect only through `applyTransactionToBalance` / `revertTransactionFromBalance` (`features/transactions/utils/transaction-balance.ts`) and convert `amountCents` → `amount` in one helper at the boundary; no raw arithmetic on amounts
- [x] Form: when `values.payerId === viewerUid`, render an **optional** wallet selector with the active wallets whose `currency` equals the expense currency (`getActiveWallets` + `WalletChipSelector`); no selection keeps today's behaviour
- [x] When a wallet is selected, reveal an expense category selector defaulting to **Gastos compartidos**, kept in `categoryId`
- [x] Add `ensureSharedExpenseCategory(ownerId)` using `getDefaultCategoryDocumentId(ownerId, "shared-expense")`; create it only when missing, never rewrite an existing or renamed category, and do not add it to `DEFAULT_CATEGORIES` (that would seed it for every user)
- [x] Sync on edit inside one `runTransaction`: amount, date, description, category, wallet and payer update the linked movement; a viewer→friend payer change reverts it and friend→viewer creates one; a currency change without a selected wallet in the new currency fails with a translated code
- [x] Block a wallet that would go negative with the translated `INSUFFICIENT_BALANCE` code and keep the expense unsaved in that case
- [x] Movements list: linked movements show a **Compartido** badge, tapping opens `/social/expenses/[expenseId]` instead of the movement detail, and no edit/delete action is offered for them in the personal UI
- [x] Add the new error codes and their es/en copy in `features/shared-expenses/locales/{es,en}.json`; keep accessibility labels and hints (wallet chips, category chips, badge) in the same namespaces and pass `npm run check:copy`
- [x] Keep the new wallet/category block themed through `useFormTheme`, working in light and dark mode, and split it into components to respect the 150-line rule
- [x] Add tests for the category ensure, the cents/amount boundary, every sync path (create, amount, date, description, category, wallet, payer both ways, currency), insufficient balance, repeated edit and delete idempotency
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] The payer can save a shared expense with no wallet (unchanged behaviour) or with a same-currency wallet plus a category
- [x] Selecting a wallet creates exactly one linked expense movement, and the wallet balance drops by the expense total
- [x] Editing amount, date, description, category or wallet updates the same movement and the balance follows once, with no double counting
- [x] Flipping the payer from the viewer to the friend reverts the movement, and flipping it back recreates one
- [x] Deleting the shared expense soft-deletes the movement and reverts the wallet exactly once; deleting twice changes nothing
- [x] A currency change without a same-currency wallet is rejected with a translated code and saves nothing
- [x] A wallet without enough balance is rejected and neither record is written
- [x] The movements list shows the **Compartido** badge and opens the shared-expense detail; the movement cannot be edited or deleted from there
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

### Data contract
- `SharedExpense`, `ValidatedSharedExpense` and the create/update DTOs gained `walletId`, `categoryId` and `linkedTransactionId` (`features/shared-expenses/types/shared-expense.types.ts`, `features/shared-expenses/schemas/`). `null` on all three means "social only, no personal movement", so legacy documents stay valid.
- `Transaction` and its DTOs gained `sharedExpenseId?: string` and `deletedAt: string | null` (`features/transactions/types/transaction.types.ts`). `features/transactions/repositories/transaction.mapper.ts` only keeps `sharedExpenseId` when `type === "expense"`, so an income can never carry a link.
- `FirebaseTransactionRepository` now filters soft-deleted movements out of the history read, so a reverted link cannot outlive its expense.

### Firestore rules (`firestore.rules`, **not deployed**)
- `hasExpenseFields` accepts the three new keys and `hasExpenseLinks` bounds each of them (`absent | null | non-empty string ≤ 1500`), so legacy documents and explicit `null` both pass. The keys stay outside the immutable set.
- Linked movement create validates the referenced expense with `getAfter()`: `get()` returns the pre-transaction snapshot, where an expense written in the same commit does not exist yet. The cross-check requires `type == 'expense'`, the caller in `participantIds`, `payerId == request.auth.uid` and an equal `currency`.
- Linked movement update re-checks `type == 'expense'` plus payer/participant/currency against `get(...) || getAfter(...)`, which covers an atomic currency edit where both documents change currency together.
- `sharedExpenseId` is immutable (`keepsSharedExpenseLink`), and a hard delete of a linked movement is denied so the expense never points nowhere.

### Atomic pair
- `ILinkedMovementPort` (`features/shared-expenses/repositories/linked-movement.port.ts`) keeps `features/shared-expenses` independent of `firebase-transaction.repository.ts`; `FirebaseLinkedMovementPort` (`.../firebase-linked-movement.port.ts`) reuses `features/transactions/repositories/transaction-firestore.utils.ts` and `features/transactions/utils/transaction-balance.ts`.
- `createSharedExpenseLinkOperation` / `updateSharedExpenseLinkOperation` / `softDeleteSharedExpenseLinkOperation` (`shared-expense-create-link.operation.ts`, `shared-expense-update-link.operation.ts`, `shared-expense-delete-link.operation.ts`, re-exported by `shared-expense-link.operations.ts`) run one `runTransaction` over the expense, the movement and the wallet document(s); `shared-expense-link-movement.ts` and `shared-expense-movement-write.ts` hold the shared sync/helpers. `amountCents` → `amount` is converted once in a helper (`features/shared-expenses/utils/expense-amount.ts`), never inline.
- New stable error codes in `features/shared-expenses/services/shared-expense.errors.ts`: `INSUFFICIENT_BALANCE`, `WALLET_NOT_FOUND`, `WALLET_NOT_OWNED`, `CURRENCY_MISMATCH`, `LINKED_MOVEMENT_NOT_REVERTIBLE` and `LINKED_MOVEMENT_FOREIGN`, translated in `features/shared-expenses/locales/{es,en}.json`.
- `ensureSharedExpenseCategory` (`features/shared-expenses/services/shared-expense-category.ts`) derives the id with `getDefaultCategoryDocumentId(uid, "shared-expense")`, reads first and creates only when missing, so a user who renamed **Gastos compartidos** keeps their name. `DEFAULT_CATEGORIES` is untouched, so the category is not seeded for everyone.

### UI
- The editor loads wallets and categories and refreshes them after a save. When the viewer is the payer it renders optional chips for the active wallets in the expense currency (`getActiveWallets` + `WalletChipSelector`/`WalletPickerDialog`) plus a **Sin cartera** chip, and the category chips default to **Gastos compartidos** (`shared-expense-wallet-field.tsx`, `shared-expense-category-field.tsx`).
- An archived wallet that is already selected stays selectable as an edit exception; a permanently deleted wallet is cleared only after the wallet list loads successfully, so a transient failure never drops the stored choice.
- The shared-expense detail shows wallet and linked movement only to the payer (`use-shared-expense-detail-screen` + `buildSharedExpenseLinkedMovementFields`); the form block itself lives in `shared-expense-linked-movement.tsx`.
- Movements and dashboard rows render the **Compartido** / **Shared** badge and route to `/social/expenses/[expenseId]` (`features/transactions/hooks/use-transactions-screen.ts`, `features/dashboard/utils/dashboard-navigation.ts`), never to the personal detail. No personal edit/delete is offered for a linked movement.

### Files (high level)
`features/shared-expenses/{repositories,services,utils,components,hooks,locales}`, `features/transactions/{types,repositories,components,utils}`, `features/dashboard/{utils,hooks,components}`, `features/social/{hooks,components}`, `shared/components/molecules/record-card*` (optional `badge` on the row) and `firestore.rules`.

### Tests
Category ensure (idempotent, renamed category preserved), cents/amount boundary, the create/update/delete sync paths, amount/date/description/category/wallet/payer both ways, currency mismatch, insufficient balance, repeated edit, delete idempotency, an orphaned wallet and the foreign-link guards.

### Verification (16/11/2026)
- `npx tsc --noEmit` — clean
- `npx expo lint` — clean
- `npx jest --coverage --watchAll=false` — 205 suites / 1157 tests passed; coverage 99.07% statements, 94.74% branches, 99.01% functions, 99.49% lines
- `npm run check:copy` — 220 TSX files

### Known limitations and manual steps
- **Rules pending deployment**: run `npm run firebase-deploy:rules`. `sharedExpenses` (the three link keys) and the linked `transactions` guards are written but not published.
- A linked movement created by the other participant is owner-only, so the non-payer cannot edit or delete it (`LINKED_MOVEMENT_FOREIGN`), and a payer takeover is rejected with `LINKED_MOVEMENT_NOT_REVERTIBLE` instead of charging the wallet twice.
- A permanently deleted wallet keeps the movement under `walletId: "-1"` and skips the balance effect, matching the existing wallet-deletion placeholder.
- A manual light/dark and screen-reader pass on a real device is still recommended; it was not performed in this session.

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
- Check light/dark mode and Spanish/English, including screen-reader labels for the wallet and category selectors. *(Manual device pass still pending; the automated suite and the copy audit pass.)*

## Dependencies
- TICKET-042 Friend detail screen with shared expenses
- TICKET-043 Shared expense detail screen (linked-movement block)
- TICKET-009 1:1 shared expenses (delivered)
- TICKET-002 movements and TICKET-018 wallet management (delivered)
