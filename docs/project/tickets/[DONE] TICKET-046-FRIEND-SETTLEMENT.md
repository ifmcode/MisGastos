# [DONE] TICKET-046 - 1:1 Debt Settlement with Direct Application

**Type:** Feature  
**Priority:** High  
**Status:** ✅ Done (18/11/2026)  
**Related:** TICKET-007, TICKET-009, TICKET-010, TICKET-042, TICKET-044, TICKET-047, TICKET-051  
**Sprint:** Post-MVP / Phase 5.2

## Description
Let either friend clear the debt that TICKET-009 derives, in full or partially, **without the counterpart confirming it**: the settlement is applied immediately to the pair balance. The friend who settles records their own side; only the creditor (the one who receives the money) may optionally link one of their own wallets to record the income, either at creation or later from the notification. Each settlement leaves a clickable message above the shared expenses and opens a read-only detail with edit/delete in the top-right corner. When the settlement clears the whole debt, the shared-expense list hides behind **Ver gastos anteriores**. The other friend receives one in-app notification per event.

## Requirements
- [x] Add the **Liquidar deudas** action to the friend detail header (TICKET-042), enabled only when the pair has a non-zero balance in at least one currency
- [x] Add `/social/settlements/new?friendUid=[uid]` (`app/social/settlements/new.tsx`) for creation and `/social/settlements/[settlementId]` (`app/social/settlements/[settlementId].tsx`) for the detail, edit, delete and the creditor's optional wallet link; both live under the `social` segment already covered by `PRIVATE_SEGMENTS`
- [x] Handle one currency at a time: offer only the currencies with a non-zero net debt and default to the first one (EUR first); the direction is derived from the sign of that currency's net balance (**Yo pago** when the viewer owes, **Me paga** when the friend owes) and is never user-selectable
- [x] Offer an explicit **Total** / **Parcial** choice: **Total** prefills and locks the outstanding debt of that currency; **Parcial** requires an amount greater than zero and never above the outstanding debt
- [x] Support a date defaulting to today, never in the future, and an optional note
- [x] Only the creditor can optionally link their **own** active same-currency wallet for the income movement, with an explicit **Sin cartera** option and an income category required only when a wallet is chosen; the debtor never links a wallet or creates a movement
- [x] On create, write the settlement, the optional creditor income movement, the wallet balance and the counterpart notification inside one `runTransaction`
- [x] Fold only active (non-deleted) settlements into the friends ledger seam through `buildSettlementLedgerEntries`, emitting a reverse edge per settlement (receiver owes payer) so `calculateFriendBalances` and the per-currency grouping stay untouched; compose it with `SharedExpenseLedgerRepository` behind `IFriendLedgerRepository`
- [x] Expose the pair's settlements from a participant-scoped repository read; the friend detail shows only the **latest active settlement** as a message above the expense list and never folds it into the net balance twice
- [x] Hide the shared-expense list when the pair's net debt is zero in every currency and at least one active settlement exists; replace it with **Ver gastos anteriores**, which reveals the expenses and can be collapsed again
- [x] Add the settlement detail as a read-only `DetailView` with amount, direction, friend, date, note, currency and the creditor's wallet/movement; top-right edit and delete reuse the existing detail actions
- [x] Allow editing the amount only while the creditor has no linked movement; date, note and the creditor's own wallet/category stay editable. The currency, pair and direction are immutable. The amount is re-validated against the debt excluding this settlement
- [x] Allow the creditor to link or unlink their wallet from the detail (this is the notification follow-up); unlinking reverts the income exactly once
- [x] Delete is a soft delete (`deletedAt`): it reverts the creditor's linked income exactly once and is blocked with a translated code while the creditor has a linked movement and the viewer is the debtor, so the creditor must unlink first. Repeated deletes are idempotent
- [x] Add `Settlement` types, schema, mapper, operations, ledger and repository under `features/settlements/` for the root `settlements/{settlementId}` document
- [x] Emit exactly one notification per event through the TICKET-047 helper (`settlement-created`, `settlement-updated`, `settlement-deleted`) with a deterministic `dedupeKey`, and add a minimal in-app inbox now (bell + unread badge in the dashboard header, `/notifications`, list, mark as read, loading/error/empty/pull-to-refresh)
- [x] Add `settlements` rules: participant reads, validated creates (`createdBy` is a participant, sorted pair, payer/receiver membership, positive amount, currency, `deletedAt: null`), receiver-only wallet link/unlink, immutable pair/from/to/currency/createdBy/createdAt, only soft delete, no hard delete and no delete while another participant's movement is linked
- [x] Add `notifications` rules: owner-only list and read plus a single `get` for the settlement actor (needed for the idempotent writer), owner-only `readAt` update, no delete, idempotent create by a settlement participant for the other participant (cross-document `getAfter`); a missing id resolves to not-found
- [x] Add `settlementId` to the linked income movement: immutable, income-only, owned by the creditor, same currency and participant of the settlement; hard delete denied
- [x] Keep every string, including direction labels, total/partial labels, the settlement message, status-free detail copy, notifications and a11y copy, in `settlements` and `notifications` es/en namespaces and pass `npm run check:copy`
- [x] Add pure helpers with colocated tests for direction, debt bound and the editability rule, the ledger entries, the latest settlement, the full-settlement condition, the notification dedupe key and the unread count; cover both directions, partial and multiple settlements, over/under the bound, currency mismatch, wallet ownership, link/unlink, rollback on delete, double delete, permissions and idempotency
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] The friend detail offers **Liquidar deudas** only when the pair has a debt, and it opens the settlement screen for that friend
- [x] A full or partial settlement is applied immediately and the pair balance drops by the settled amount; no counterpart confirmation is involved
- [x] A settlement cannot exceed the outstanding debt of its currency, cannot use another currency and cannot target a currency without debt
- [x] Both directions work: the debtor can pay and the creditor can record that the friend paid
- [x] Only the creditor can optionally link a wallet and an income category; the settlement can be created and applied with **Sin cartera**, and the debtor never links a wallet
- [x] The counterpart receives exactly one notification per event, the inbox shows it and opening it marks it read and opens the settlement detail
- [x] The latest settlement renders as a clickable message above the shared expenses and its detail shows edit/delete in the top-right corner
- [x] A full settlement hides the expense list and shows **Ver gastos anteriores**; the button reveals the previous expenses
- [x] The creditor can link a wallet later from the detail, unlinking reverts the income once, and deleting reverts it once
- [x] Amount edits are blocked once the creditor has linked a movement; date, note and the creditor's wallet stay editable
- [x] Deletion is blocked while the creditor has a linked movement and the viewer is the debtor; the creditor can unlink and then delete
- [x] `pending` no longer exists: an active settlement always counts, a soft-deleted one never does, and no settlement is hard-deleted
- [x] Only the two participants can read a settlement and only the creditor can link their wallet; a third user cannot read or create notifications for the pair
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

### Delivered files by layer
- **Domain:** `features/settlements/types/settlement.types.ts`, `schemas/settlement{,-validation.types}.ts`, `utils/settlement-{debt,ledger,latest,detail,notification,form,form-options}.ts`.
- **Persistence:** `repositories/settlements.{operations,data,mapper,repository}.ts`, `settlement-{create,update,delete}.operation.ts`, `settlement-{movement.port,wallet.helpers,wallet-effects,movement-write,movement.helpers,update.resolve}.ts`, `firebase-settlements.repository.ts`, `settlement-ledger.repository.ts` and `settlements.factory.ts`.
- **Service:** `settlements.service.ts` plus `settlement-{create,update,delete,guards,persist,errors,write-deps}.ts`; the composed ledger lives in `features/friends/repositories/composed-friend-ledger.repository.ts` and `friend-ledger.factory.ts`.
- **Notifications:** `features/notifications/{types,repositories,services,utils}` for the document, idempotent writer, unread count, sort and target resolution, plus the minimal inbox UI and the dashboard bell.
- **UI:** `app/social/settlements/{new,[settlementId]}.tsx`, `app/notifications.tsx`, the settlement form/detail/message components, the friend-detail settle button and collapsed-expenses state, and the dashboard/transactions routing for settlement-linked incomes.
- **Rules:** `firestore.rules` gained `settlements`, `notifications` and the `settlementId` transaction link; `firestore.indexes.json` is untouched because both queries are single-field.

### Model and invariants
A settlement is applied by existing: there is no pending/accepted state and `deletedAt: null` is the only active marker. The pair, direction, currency, creator and creation stamp are immutable. The service folds the composed ledger, derives the direction from the signed net and bounds the amount against that currency; on edit it excludes `settlement:{id}`. The ledger entry is the reverse edge, so `calculateFriendBalances` needs no change. The creditor's income is the only personal movement, is optional and is written/reverted inside the same transaction as the settlement, the wallet and the notification.

### UX
The friend detail shows **Liquidar deudas** only with debt, the latest settlement as a clickable message above the expenses, and hides the expenses behind **Ver gastos anteriores** when the pair nets to zero with at least one settlement. The create route offers only debt currencies, total/partial and the creditor's optional wallet; the detail has edit/delete and the creditor's **Elegir cartera** / **Quitar cartera** follow-up. Settlement-linked incomes show the **Liquidación** badge and open the settlement detail from Movements and the dashboard.

### Verification (18/11/2026, Node 24)
- `npx tsc --noEmit`: pass.
- `npx expo lint`: pass, exit 0.
- `npx jest`: 241 suites / 1410 tests pass.
- `npm run check:copy`: pass, 245 TSX files.
- `npm run test:coverage`: 98.71 % statements, 93.96 % branches, 98.06 % functions, 99.13 % lines (gate 90 %).
- **Pending:** manual device validation (light/dark, Spanish/English, two accounts, screen reader) and `npm run firebase-deploy:rules`; the rules emulator could not run because the machine has JDK 17/11/8 and `firebase-tools` needs ≥ 21.
- Development note: [`2026-11-18-friend-settlement.md`](../development-notes/session-notes/2026-11-18-friend-settlement.md).

## Technical Notes
- **Direct application:** there is no `pending`/`accepted` state machine. A settlement is applied by existing; `deletedAt: null` means active and every active settlement feeds the ledger. This replaces the earlier bilateral-confirmation model.
- **Data model:** root `settlements/{settlementId}` with sorted `participantIds` + `pairId`, `fromUserId` (debtor/payer), `toUserId` (creditor/receiver), `amountCents`, `currency`, `date`, `note`, `createdBy`, `createdAt`, `updatedAt`, `deletedAt` and the receiver-only `receiverWalletId`, `receiverCategoryId`, `receiverTransactionId`. The document is never hard-deleted.
- **One wallet, optional:** only the creditor links a movement, because the personal income is the only side this app records for a settlement. It is optional: a settlement without a wallet still applies to the debt, and the creditor can link it later from the settlement detail opened by the notification.
- **Atomic write:** the settlement + optional income movement + wallet balance + notification are written in one `runTransaction`, behind an `ISettlementMovementPort` that reuses `toTransactionData` and `applyTransactionToBalance` / `revertTransactionFromBalance`. Integer cents to decimal happens once at the transactions boundary (TICKET-044 pattern).
- **Ledger semantics:** `FriendLedgerEntry` means "`fromUserId` owes `toUserId`". A settlement cancels debt, so the helper emits the reverse edge (`fromUserId = settlement.toUserId`, `toUserId = settlement.fromUserId`) with `deletedAt: null`. Do not change `calculateFriendBalances`; the per-currency fold stays identical and no currency is converted.
- **Debt bound:** the service loads the composed pair ledger (`sharedExpenses` + `settlements`), folds it with `calculateFriendBalances` and validates the amount against that currency's net. On edit it excludes the settlement being edited (its ledger id is `settlement:{id}`). Rules cannot sum list values, so the bound is a schema/service invariant, as in TICKET-009. A concurrent write can still change the debt between the read and the write; that is the accepted online limitation until TICKET-023.
- **Amount edits:** the creditor can always edit because they own the linked movement and the operation can revert and re-apply it. The debtor can edit the amount only while `receiverTransactionId` is null; once the creditor has an income, the service rejects it with a code and the form locks the amount.
- **Transfer date:** the date is labeled **Fecha de la transferencia** and defaults to today. Past dates are valid and only affect the linked income's date and the history; a future date is rejected before the write with `DATE_IN_FUTURE` (schema + form pre-check), so a settlement always records money that already moved.
- **Delete:** soft delete reverts the creditor's income when the viewer is the creditor. When the viewer is the debtor and the creditor already linked a movement, the delete is rejected (`SETTLEMENT_HAS_RECEIVER_MOVEMENT`) because rules forbid writing another user's wallet; the creditor unlinks it first from the detail. This keeps every wallet and the ledger consistent.
- **Full-settlement UX:** the friend detail derives “settled” from `Friend.balances.length === 0` (already grouped per currency) plus at least one active settlement. It hides the expense list behind **Ver gastos anteriores** instead of deleting or reordering expenses, so history stays reachable.
- **Notification content:** the payload carries ids and numbers only (`settlementId`, `pairId`, `friendUid`, `amountCents`, `currency`, `isFull`, `canLinkWallet`), never sentences. Copy is resolved from `type` + payload. `dedupeKey` is `${settlementId}:${event}:${userId}` for create/delete and includes `updatedAt` for updates so a retry cannot duplicate while a real edit still notifies.
- **Minimal inbox:** TICKET-046 ships the event writer, the bell with an unread badge, `/notifications`, unread-first order, mark-as-read and the settlement target. TICKET-047 keeps the remaining inbox scope (friend-request/group types, mark-all-read, preferences, pagination and polish).
- **Idempotent notification read:** the settlement transaction reads `notifications/{dedupeKey}` before writing it, and that document belongs to the other participant. The rules allow the settlement actor a single `get` by the deterministic id (never `list`) and let a missing id resolve to not-found, so the first write and a retry both work. The actor already knows the settlement; the exposed field is the recipient's `readAt`, not new financial data. This read was the cause of the `PERMISSION_DENIED` seen while settling.
- **Group reuse:** TICKET-010 must reuse this direct-application state, the receiver-only movement pattern and the notification events instead of a second settlement implementation.
- **Out of scope:** settlement confirmation or rejection, debtor-side personal movements, wallet-to-wallet transfers, currency conversion, editing a settlement's direction or currency, offline outbox, push notifications and group settlements.

## Validation Plan
- Settle a EUR debt fully and partially and then a USD debt, confirming each currency keeps its own line and no conversion appears.
- Test both directions: the debtor pays, and the creditor records that the friend paid; confirm the applied balance and the optional income.
- Create with **Sin cartera**, then link the wallet from the settlement detail as the creditor and confirm the income and the wallet balance; unlink and confirm the exact reversion.
- Reject an amount above the debt, another currency, a currency without debt and a wallet of the other participant; every attempt is blocked with a translated code.
- Edit the amount before and after the creditor links the wallet; confirm the lock and the message.
- Delete as the creditor, delete as the debtor with and without a linked movement, and repeat the delete; confirm the ledger and wallet return to their previous state exactly once.
- Confirm the counterpart gets exactly one notification per event, the badge count is correct, opening it marks it read and opens the settlement detail, and a retried write creates no duplicate.
- Check the settlement screen, the message, the **Ver gastos anteriores** state and the inbox in light/dark mode and Spanish/English, including screen-reader labels.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-042 friend detail screen (entry point and expense list)
- TICKET-044/TICKET-051 wallet, linked movement and category pattern
- TICKET-047 in-app notification inbox (minimal inbox delivered here, remainder stays in TICKET-047)
- TICKET-009 1:1 shared expenses (delivered) for the debt source and ledger seam
- TICKET-010 for group settlement reuse (Phase 6)
