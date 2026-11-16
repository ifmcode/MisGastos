# TICKET-046 - 1:1 Debt Settlement with Bilateral Confirmation

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** TICKET-007, TICKET-009, TICKET-010, TICKET-042, TICKET-044, TICKET-047  
**Sprint:** Post-MVP / Phase 5.2

## Description
Let two friends clear the debt that TICKET-009 derives while recording the money that actually moves in their wallets. The friend detail opens a settlement screen; the friend who starts it records their own side immediately (an expense when they pay, an income when they receive) and the counterpart confirms with their own wallet and category. Only an `accepted` settlement moves the friend balance; a `pending` one is shown as **Liquidación pendiente** and never counts.

## Requirements
- [ ] Add the **Liquidar deudas** action to the friend detail (TICKET-042), enabled only when the pair has a non-zero balance in at least one currency
- [ ] Add `/social/settlements/new?friendUid=[uid]` (`app/social/settlements/new.tsx`) for creation and `/social/settlements/[settlementId]` (`app/social/settlements/[settlementId].tsx`) for the counterpart confirmation and the status view; both sit under the `social` segment already covered by `PRIVATE_SEGMENTS`
- [ ] Handle one currency at a time: offer only the currencies with a non-zero net debt, show the outstanding debt, default the direction to the one that reduces it (**Yo pago** when the viewer owes, **Me paga** when the friend owes) and bound the amount to that debt
- [ ] Support a partial amount, a date defaulting to today and an optional note
- [ ] The initiator always selects their **own** wallet and category for their side: expense category when they pay, income category when they receive, defaulting to the lazily ensured **Gastos compartidos** category and changeable. Same-currency active wallet only
- [ ] On create, write the initiator's movement (expense if they pay, income if they receive) and the `pending` settlement inside one `runTransaction`
- [ ] The counterpart confirms from `/social/settlements/[settlementId]` by choosing their own wallet and category for the opposite movement (income for the receiver when the initiator paid, expense for the payer when the initiator received); that write creates their movement, marks the settlement `accepted` and notifies the initiator
- [ ] The counterpart can reject while pending: revert the initiator's movement exactly once, mark `rejected`, return the shared-expense debt to its previous state and notify the initiator
- [ ] The initiator can cancel while pending: same rollback and a notification to the counterpart
- [ ] Add `Settlement` types, schema, mapper, operations and repository under `features/settlements/` for the root `settlements/{settlementId}` document
- [ ] Fold only `accepted` settlements into the friends ledger seam as entries from payer to receiver, leaving `calculateFriendBalances` and the per-currency grouping untouched
- [ ] Expose the pair's `pending` settlements from a repository read so the friend detail renders **Liquidación pendiente** separately from the net balance
- [ ] Add `settlements` rules: participant reads, validated creates (`pending` only, initiator as `createdBy`, payer/receiver membership), only the defined transitions on update (`pending → accepted`/`rejected` by the counterpart, `pending → cancelled` by the initiator), immutable pair/from/to/amount/currency/createdAt, no hard delete
- [ ] Emit exactly one notification per event through the TICKET-047 helper (`settlement-pending`, `settlement-accepted`, `settlement-rejected`, `settlement-cancelled`)
- [ ] Keep every string, including direction labels, status badges and a11y copy, in a `settlements` es/en namespace and pass `npm run check:copy`
- [ ] Add pure helpers with colocated tests for the status machine, the amount bound and the accepted-only ledger entries; cover both initiation directions, partial and multiple settlements, rollback on reject/cancel, double accept/reject, currency mismatch, insufficient balance, permissions and idempotency
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] The friend detail offers **Liquidar deudas** only when the pair has a debt, and it opens the settlement screen for that friend
- [ ] A full or partial settlement writes the initiator's movement immediately and leaves the settlement `pending`
- [ ] The counterpart confirms with a wallet and category, the opposite movement is created, the settlement becomes `accepted` and the pair balance drops by the settled amount
- [ ] Rejecting or cancelling restores the initiator's wallet exactly once and the debt returns to its pre-settlement value
- [ ] `pending` settlements render as **Liquidación pendiente** and never change the net balance; `rejected` and `cancelled` never count
- [ ] A settlement cannot exceed the outstanding debt of its currency, cannot use another currency, and cannot be accepted or rejected twice
- [ ] Only the two participants can read a settlement, only the counterpart accepts or rejects and only the initiator cancels
- [ ] Both initiation directions work: the debtor can pay and the creditor can record that the friend paid
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- **Pending money movement:** the initiator's movement is written on create, so their wallet shows the outflow (or inflow) while the settlement is `pending`. The pending card must be prominent and its copy must state that the friend balance only changes on confirmation; reject and cancel revert the effect through `revertTransactionFromBalance` exactly once.
- **Data model:** root `settlements/{settlementId}` with sorted `participantIds` + `pairId`, `fromUserId` (payer), `toUserId` (receiver), `amountCents`, `currency`, `date`, `note?`, `status`, initiator `walletId`/`categoryId`/`transactionId`, counterpart `walletId?`/`categoryId?`/`transactionId?`, `createdBy` (initiator), `createdAt`, `updatedAt` and `resolvedAt?`. A settlement document is never hard-deleted.
- **Transitions:** `pending → accepted|rejected` only by the counterpart (`request.auth.uid != resource.data.createdBy` and a participant), `pending → cancelled` only by the initiator. The rules repeat the pair/money/currency immutability on update.
- **Ledger integration:** `buildSettlementLedgerEntries` emits one entry per `accepted` settlement from `fromUserId` to `toUserId` with its currency and `deletedAt: null`; the repository composes it with `SharedExpenseLedgerRepository` behind `IFriendLedgerRepository`, so `Friend.balances[]` and `getFriendBalanceDirection` keep their semantics. Pending settlements never reach the fold.
- **Money:** integer cents end to end, the `amountCents` → `amount` conversion happening once at the transactions boundary (TICKET-044 pattern); no currency conversion and no double counting. An amount above the outstanding debt of that currency is rejected by the schema and the service before any write.
- **Rules:** participant-only reads; creates require the sorted pair, both members inside it, a positive bounded amount, a currency, `status == 'pending'`, the initiator as `createdBy` and their wallet/category; updates accept only the three transitions above; `delete: if false`. Rules are not deployed: run `npm run firebase-deploy:rules`.
- **Immutability:** editing an `accepted` settlement is out of scope; only the pending transitions exist here, so a correction flow stays open for a later ticket.
- **Group reuse:** TICKET-010 must reuse this state machine, the wallet/movement pattern and the notification types instead of a second settlement implementation; its `groups/{groupId}/settlements` suggestion stays valid.
- **Out of scope:** push notifications (TICKET-047 inbox only), group settlement simplification, wallet-to-wallet transfers, currency conversion, offline outbox and editing accepted settlements.

## Validation Plan
- Settle a EUR debt fully and partially and then a USD debt, confirming each currency keeps its own line and no conversion appears.
- Test both directions: the debtor pays, and the creditor records that the friend paid; confirm the initiator movement, the counterpart movement and the final balance.
- Reject from the counterpart and cancel from the initiator; confirm both wallet balances, the friend balance and the pending card return to their previous state.
- Try to accept twice, reject an accepted settlement, settle more than the debt, settle in another currency and use a wallet without enough balance; every attempt is blocked with a translated code.
- Check the settlement screen and the pending card in light/dark mode and Spanish/English, including screen-reader labels for direction, wallet and category.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-042 friend detail screen (entry point)
- TICKET-044 wallet/category ensure and linked-movement pattern
- TICKET-047 in-app notification inbox (event sink)
- TICKET-009 1:1 shared expenses (delivered) for the debt source and ledger seam
- TICKET-010 for group settlement reuse (Phase 6)
