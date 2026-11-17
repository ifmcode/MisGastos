# [DONE] TICKET-048 - Mandatory Wallet for Viewer-Paid Shared Expenses

**Type:** UX / Data  
**Priority:** Medium  
**Status:** ✅ Done (17/11/2026)  
**Related:** TICKET-044, TICKET-045, TICKET-042, TICKET-009  
**Sprint:** Post-MVP / Phase 5.1

## Description
When the viewer pays a shared expense, its linked personal movement is the record that makes the spend visible in **Movimientos**. Today the wallet is optional, so a viewer-paid expense can be saved as social-only and silently never appears in the movement list. This ticket makes the wallet mandatory whenever the viewer is the payer (create and edit), so the movement is always created and kept in sync. It also covers the payer transitions: changing a friend-paid expense to viewer-paid must reveal and require a wallet and create the movement, while changing a viewer-paid expense to friend-paid must revert and soft-delete the movement so it disappears from **Movimientos**. Legacy viewer-paid expenses saved without a wallet stay readable but show a highlighted notice in their detail and require a wallet on their next save.

## Requirements
- [x] Require a wallet whenever the payer is the viewer, in create and update, with a new `walletId` field error and `WALLET_REQUIRED` validation code
- [x] Enforce the same rule in the service (create/update) as defense in depth, mapping to the existing error code and translated copy
- [x] Enforce the rule in `firestore.rules` for `sharedExpenses` writes where `payerId` is the authenticated payer (deployment stays manual and pending)
- [x] Form: wallet label is no longer optional, the **Sin cartera** option disappears, the field shows its validation error, and the "no active wallets in this currency" case is blocked with guidance to **Carteras**
- [x] **Gasto con amigo / edit:** switching the payer from the friend to the viewer reveals the wallet block, requires a selection, and the save creates the linked movement atomically
- [x] **Gasto con amigo / edit:** switching the payer from the viewer to the friend clears the wallet and category, reverts the wallet balance and soft-deletes the movement so it leaves **Movimientos**
- [x] Legacy viewer-paid expenses without a wallet show a highlighted notice in the shared-expense detail without blocking reading; the pencil keeps working and the next save requires a wallet
- [x] Add the es/en copy for the wallet error, the no-wallets guidance and the detail notice, and reuse the existing shared-expense form keys
- [x] Add colocated tests for the schema, the service guard, the detail-warning helper and both payer transitions
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] Creating or editing a shared expense where the viewer pays without a wallet is blocked with a clear translated error
- [x] A friend-paid expense can still be saved as social-only and creates no movement in the viewer's list
- [x] Changing a friend-paid expense to viewer-paid requires a wallet and creates the movement, which appears in **Movimientos**
- [x] Changing a viewer-paid expense to friend-paid removes the movement from **Movimientos** and reverts the wallet balance exactly once
- [x] With no active wallets in the expense currency, the form cannot be saved and explains how to create one in **Carteras**
- [x] A legacy viewer-paid expense without a wallet shows the highlighted detail notice and asks for a wallet on its next save
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

### Schema
- New `features/shared-expenses/schemas/shared-expense-wallet-validation.ts` (new) owns `readSharedExpenseLink`, which trims the optional ids and pushes `{ field: "walletId", code: "WALLET_REQUIRED" }` whenever the resolved payer equals the viewer and no wallet was chosen. `SharedExpenseLinkInput`, the "a payer is resolved before the wallet is required" rule and the "no wallet means no category" rule live in that file.
- The helper moved out of `shared-expense-field-validation.ts` (now 145 lines) because that parser had passed the 150-line soft limit; `parseSharedExpenseFields` calls it in the same position of the display order, right after the payer.
- `validateSharedExpenseInput` (`schemas/shared-expense.schema.ts`) now rejects the payload when `issues.length > 0`, not only when a parsed field is `null`. The wallet issue does not null a parsed field, so the old check would have returned `ok: true` with a missing wallet.
- `SharedExpenseValidationCode` (`schemas/shared-expense-validation.types.ts`) gains `WALLET_REQUIRED`; `walletId` stays nullable at rest, because a friend-paid expense is legitimately social-only.

### Service
- `assertSharedExpensePayerWallet` in `services/shared-expense-persist.ts` (new) throws `SharedExpenseOperationError("WALLET_REQUIRED")` for a viewer-paid value without a wallet. It is the defense in depth for callers that bypass the form validation.
- `services/shared-expense-write.ts` calls it first in `createSharedExpenseRecord` and `updateSharedExpenseRecord`, before `resolveSharedExpenseLink`, so no repository, link repository or category read happens for an invalid payload.
- `services/shared-expense.errors.ts` adds `WALLET_REQUIRED` to the operation code union, so the service error carries the same code the schema reports and the UI translates.
- Wallet existence, ownership and currency remain inside the atomic `runTransaction` (`WALLET_NOT_FOUND`, `WALLET_NOT_OWNED`, `CURRENCY_MISMATCH`, `INSUFFICIENT_BALANCE` unchanged).

### Firestore rules
- `firestore.rules` gains `hasPayerWallet(data)`: when `payerId == request.auth.uid` the document must carry a `walletId` key that is an optional expense id and **not** `null`; any other payer passes. It is applied to `sharedExpenses` create and update.
- To keep legacy viewer-paid records manageable, the update also accepts `isExpenseSoftDelete(previous, next)` (`deletedAt` was `null`, the next value is a string, and `diff` affects only `deletedAt`/`updatedAt`). The unlinked repository soft delete writes exactly those two keys.
- The linked delete may also clear `linkedTransactionId`, so it goes through `hasPayerWallet` instead; linked records always carry a wallet, so the exception cannot be abused to skip the requirement. Any real edit (amount, payer, wallet, category, shares) still needs a wallet.
- The rules are **written but not deployed**; `npm run firebase-deploy:rules` stays a manual step.

### Form
- The wallet block (`components/shared-expense-linked-movement.tsx`) still renders only while the viewer is the payer, but the **Sin cartera** chip and its copy are gone: `SharedExpenseWalletField` renders the wallet chips only, with a non-optional label, the translated wallet error under the field and the `form.walletEmpty` guidance when the currency has no active wallets.
- With no active wallets in the currency the field shows the guidance pointing to **Carteras** and the submit fails with `WALLET_REQUIRED`, so the expense cannot be saved without the movement.
- The category field appears only when a wallet is selected (`selectSharedExpenseWallet` clears the category when the wallet is cleared), mirroring "no wallet, no movement, no category".
- `use-shared-expense-form-state.ts` clears the `walletId` error on wallet, payer and currency changes, so the message disappears as soon as the user fixes the cause.

### Payer transitions
- **Friend → viewer:** `selectSharedExpensePayer` clears the previous wallet/category, the block appears, the wallet becomes required, and the save runs the existing atomic `updateSharedExpenseLinkOperation`, which creates the linked movement and applies the wallet balance once. Covered by the takeover case in `shared-expenses.service.wallet.test.ts`.
- **Viewer → friend:** the payer change clears the wallet and category, the block disappears, and the save keeps the link path (`updateSharedExpenseRecord` keeps the link path for an already-linked expense) so the movement is reverted and soft-deleted. `FirebaseTransactionRepository` filters `deletedAt`, so it leaves **Movimientos** exactly once. Covered by `shared-expense-link.update.operations.test.ts`.
- No transaction was rewritten: the ticket only adds the wallet requirement and the UI around the transition that TICKET-044 already delivered.

### Legacy records
- A viewer-paid expense stored with `walletId: null` stays readable. `features/shared-expenses/utils/shared-expense-wallet-warning.ts` (new) exposes the pure `hasViewerPaidWithoutWallet(expense, viewerUid)`; an orphaned wallet (`walletId: "-1"`) is excluded because that movement exists but lost its wallet.
- `components/shared-expense-wallet-warning.tsx` (new) renders the highlighted `role="alert"` notice (`detail.walletMissingTitle` / `detail.walletMissingMessage`) in `features/social/components/shared-expense-detail-screen.tsx`, above the fields. It is informational only: no route, no blocking state, and the pencil keeps working.
- The next save of such a record fails with `WALLET_REQUIRED` until a wallet is chosen, which is the documented migration path.

### Shared translation enabler
- `shared/hooks/use-scoped-translation.ts` now calls `useTranslation<Ns>(ns)`, so `t` is bound to the requested namespace(s) instead of the global default. The unbound adapter made TypeScript expand every namespace on each call and tripped **TS2589** ("type instantiation is excessively deep") on TypeScript 6 once the shared-expense copy grew.
- Typed keys are preserved: `t("detail.walletMissingTitle")` still type-checks and an invalid key still fails `tsc`. The runtime `t` was already namespace-scoped, so only the type changed; `tr` keeps being the memoized dynamic-key adapter.
- No consumer changed.

### Copy
- `features/shared-expenses/locales/{es,en}.json`: `errors.WALLET_REQUIRED` ("Selecciona la cartera con la que pagaste." / "Select the wallet you paid with."), `form.walletEmpty` with the `{{currency}}` interpolation and the guidance to **Carteras**, and `detail.walletMissingTitle` / `detail.walletMissingMessage` for the notice. The removed **Sin cartera** key left no dangling reference.
- Locale parity is preserved in both files; `npm run check:copy` passes.

### Files (high level)
- New: `features/shared-expenses/schemas/shared-expense-wallet-validation.ts`, `features/shared-expenses/utils/shared-expense-wallet-warning.ts`, `features/shared-expenses/components/shared-expense-wallet-warning.tsx`, `features/shared-expenses/components/shared-expense-form-body.tsx`.
- Changed: `features/shared-expenses/schemas/{shared-expense.schema,shared-expense-field-validation,shared-expense-validation.types}.ts`, `features/shared-expenses/services/{shared-expense-persist,shared-expense-write,shared-expense.errors}.ts`, `features/shared-expenses/components/{shared-expense-form,shared-expense-linked-movement,shared-expense-wallet-field}.tsx`, `features/shared-expenses/hooks/use-shared-expense-form-state.ts`, `features/social/components/shared-expense-detail-screen.tsx`, `shared/hooks/use-scoped-translation.ts`, `firestore.rules`, `features/shared-expenses/locales/{es,en}.json`.
- `shared-expense-form.tsx` was split into the page-sheet shell plus `shared-expense-form-body.tsx` (fields, movement block and actions) so both files stay under 150 lines.

### Tests
- New `schemas/__tests__/shared-expense.schema.wallet.test.ts`: viewer-paid without a wallet (empty and blank), friend-paid social-only, viewer-paid keeping wallet + category, and no wallet requirement before the payer is resolved.
- New `services/__tests__/shared-expenses.service.wallet.test.ts`: create and update rejected by the guard with no repository write, friend-paid create with `null` link and no category ensure, and the friend→viewer takeover routed through the link repository.
- `services/__tests__/shared-expense-helpers.test.ts` covers `assertSharedExpensePayerWallet` directly.
- New `utils/__tests__/shared-expense-wallet-warning.test.ts`: legacy viewer-paid record flagged, friend-paid and linked records not flagged, and the orphaned `-1` wallet excluded.
- `schemas/__tests__/shared-expense.schema.errors.test.ts`, `services/__tests__/shared-expense.errors.test.ts` and `shared-expenses.service.update.test.ts` were updated for the new code and the display order, and the existing social-only fixtures were changed deliberately to use the friend as payer.

### Verification (17/11/2026)
- `npx tsc --noEmit` — clean
- `npx expo lint` — clean
- `npx jest` — 211 suites / 1190 tests passed
- `npm run test:coverage` (business-logic gate) — 99.07% statements, 94.87% branches, 99.02% functions, 99.50% lines
- `npm run check:copy` — 222 TSX files
- `firestore.rules` changed; **no index change** was needed.

### Known limitations and manual steps
- **Manual device validation was not performed** in this session: the payer transitions on a real device, the empty-wallet guidance, the legacy notice, es/en and light/dark, and the screen-reader labels remain pending.
- **The `sharedExpenses` payer-wallet rule is pending deployment** (`npm run firebase-deploy:rules` stays manual). Until it runs, the invariant is enforced by the schema, the service and the form only.
- A legacy viewer-paid expense without a wallet can still be soft-deleted (the exception in the update rule) but any other change requires a wallet, which is the intended migration path.
- Decision record: [`2026-11-17-mandatory-wallet-viewer-paid.md`](../development-notes/2026-11-17-mandatory-wallet-viewer-paid.md).

## Technical Notes
- The atomic payer transitions already exist in `updateSharedExpenseLinkOperation` and its tests; this ticket only adds the missing wallet requirement and UI, without rewriting the transaction.
- `shared-expense-field-validation.ts` was over the limit (159 lines) before this ticket, so the wallet-link validation moved to its own file and the parser now sits at 145 lines.
- `walletId` stays nullable at rest for friend-paid expenses; only a viewer-paid record must carry one. The category remains optional and defaults to **Gastos compartidos**.
- The detail notice is informational only; it does not introduce a route or a blocking state.
- The Firestore rules change needs a manual deploy, like the previous `sharedExpenses` changes.

## Validation Plan
- Create a friend-paid expense and confirm no movement appears; create a viewer-paid expense without a wallet and confirm the error.
- Edit the friend-paid expense to viewer-paid and confirm the wallet is required and the movement appears.
- Edit it back to friend-paid and confirm the movement disappears and the balance is restored.
- Open a legacy viewer-paid expense without a wallet and check the detail notice.
- Use a currency with no active wallets and confirm the form blocks with guidance.
- Check es/en and light/dark mode.
- **Status:** not executed on a device in this session; manual device validation pending. The `sharedExpenses` payer-wallet rule is also pending deployment (`npm run firebase-deploy:rules`).

## Dependencies
- TICKET-044 (linked movement and atomic payer transitions)
- TICKET-042 (shared-expense form in the friend detail)
- TICKET-045 (movements create menu entry point)
