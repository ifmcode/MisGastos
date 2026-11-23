# [DONE] TICKET-010 - Group Balances and Settlements

**Type:** Feature  
**Priority:** High  
**Status:** ✅ Done (23/11/2026)  
**Related:** PM-007, PM-008; TICKET-009, TICKET-011, TICKET-046, TICKET-047, TICKET-062, TICKET-064  
**Sprint:** Post-MVP  

## Description
Show who owes whom inside each group, simplify debts and record payments between members to settle balances.

## Requirements
- [x] Calculate each member's net balance per currency as `sum(amountPaid) - sum(share)` over the active group expenses; positive means the group owes the member, negative means the member owes the group
- [x] Assert that the sum of every member's net balance is zero for every currency
- [x] Show the raw per-member net balances and a "who owes whom" list; when **Simplificar deudas** is on, show the simplified suggested transfers; when off, show the direct debts
- [x] Add a per-group **Simplificar deudas** setting, owner-editable and **on by default**; store it on the group document (`simplifyDebts`, missing = true) and expose it in the group settings/edit form
- [x] Simplify each currency independently, deterministically, with at most `n-1` transfers for `n` non-zero balances and never more money than the net balances require
- [x] Record a settlement between two members with amount, date and optional note
- [x] Allow partial settlements and multiple settlements between the same members
- [x] Allow editing and soft-deleting a settlement with balance recalculation
- [x] Show the current user's net balance in the group list
- [x] Add empty and settled-group states
- [x] Add tests for net balances, the zero-sum invariant, simplification, rounding and partial payments

## Acceptance Criteria
- [x] The sum of all member net balances is zero for every currency
- [x] The 90 €/3 example yields A +60 €, B -30 € and C -30 € when A pays the whole bill
- [x] The A→B→C example simplifies to A owes C 10 € instead of A→B and B→C
- [x] The simplified list is deterministic, never asks for more money than the net balances require and uses at most `n-1` transfers
- [x] Turning **Simplificar deudas** off shows the direct debts; turning it on shows the simplified suggestions; the net balances never change
- [x] Balances update after creating, editing or deleting an expense
- [x] Recording a settlement reduces the correct pair's debt
- [x] Balances return to zero when all debts are settled
- [x] Non-members cannot read or modify balances or settlements

> The **group history** entries for the **Simplificar deudas** change and for
> settlements moved to TICKET-011 on 23/11/2026: the history collection ships
> there, so TICKET-010 stores the setting and the settlements and TICKET-011
> starts recording the events when it exists.

## Implemented

### Balance engine
- New `types/group-balance.types.ts` and pure utils: `calculateGroupNetBalances`, `buildDirectGroupDebts`, `simplifyGroupDebts`, `calculateGroupBalances`, `getViewerGroupBalance`, plus the deterministic ordering helpers.
- Nets: payer `+amountCents`, every participant `−shareCents`, settlements `from +=` / `to −=` (so a payment reduces the debt); zero nets and empty currencies dropped; every currency isolated (EUR first, then the code); the sum per currency is exactly zero.
- Direct debts: expense ledger rows plus the **reverse** edge of each active settlement, both directions folded per pair; simplified suggestions match the largest debtor/creditor first with `min(debt, credit)`, deterministic ties and at most `n−1` transfers. The raw nets never depend on the toggle.
- `GroupExpensesService.getGroupBalances(viewerUid, groupId)` and `getGroupBalanceSummaries(viewerUid)` read active expenses + active settlements and use `group.simplifyDebts`. Read budget: one `groups` query plus one `groupExpenses` and one `groupSettlements` query per group (target ≤ 20 groups), each single-field filtered and client-side sorted, **no composite index**.

### Simplificar deudas setting
- `Group.simplifyDebts: boolean`, default `true` (legacy missing/malformed), written on create and update, validated by the schema, mapped defensively, exposed as an owner switch in the group edit form and allowed by `firestore.rules` (create requires the bool; `isGroupMetadataEdit` allows it). New groups stamp `true`.

### Settlements
- Root `groupSettlements/{settlementId}` with a `groupId` field and a client-generated id (not the suggested subcollection): the creditor income is validated in rules with one `getAfter` on a known root path plus one group `get`, and the list is one `where('groupId','==')` with a client-side sort. The settlement shape carries the sorted pair/`pairId`, `fromUserId` (debtor/payer), `toUserId` (creditor/receiver), amount, currency, date, note, creator/stamps and the creditor link.
- `GroupSettlementsService` (schema, mapper, repository, atomic operations, factory): create/edit/soft delete; only the two pair members; the direction is fixed by the **displayed** debt view (direct or simplified, same as the UI) and the amount is bounded by the outstanding pair debt; partial and multiple settlements; date not in the future; note ≤ 500. On edit the amount is re-validated excluding the stored settlement, the amount locks once the creditor linked an income and a re-routed/opposite pair keeps the record editable up to its stored amount.
- The creditor may optionally link one active same-currency wallet + income category as an ordinary `income` with an immutable `groupSettlementId` in the same transaction; the debtor never links. Wallet apply/revert is exact once, the debtor delete is blocked while the income exists, the creditor delete reverts and clears the link, and repeated deletes are idempotent.
- `transactions` gained the income-only `groupSettlementId` (mapped, immutable, no double link, hard delete denied). The counterpart receives a `group-settlement` notification (created/updated/deleted, ids and numbers only) written best-effort after the commit, opening the settlement detail.

### UI
- Group detail: a **Saldos** section (viewer nets per currency, raw per-member nets, **Quién debe a quién** with the direct/simplified caption and **Todo saldado**), a **Liquidaciones** section with the active rows, and a **Liquidar** action on the debts where the viewer is the debtor or creditor. The header shows the real viewer balance per currency.
- `/social/groups/[groupId]/settle` (create from a debt row, edit with `settlementId`) with the debt card, editable amount + live remaining, date, note and the creditor-only wallet/category block; `/social/group-settlements/[settlementId]` is the read-only detail with edit/delete.
- Social group list rows show the viewer's net per currency (or **En paz**), never converted; `Movimientos` and the dashboard show the linked income with the **Liquidación** badge and open the group settlement detail instead of the personal one.

### Decisions and accepted edges
- History entries for the setting change and settlements belong to TICKET-011 (the collection ships there); TICKET-010 stores the records.
- The debt bound is read outside the write transaction (rules cannot sum a ledger); a concurrent write can only leave a stored amount above the current debt, never move money silently.
- The debt view that can be settled is exactly the one the UI renders (simplified when `simplifyDebts` is on), so a suggested A→C transfer is valid even without a direct A→C expense debt.
- A debtor cannot delete a settlement whose income the creditor already linked; the creditor unlinks it first. The detail copy explains it.

### Verification
- `npx tsc --noEmit`, `npx expo lint` and `npm run check:copy` clean (335 TSX files).
- `npx jest --coverage`: **366 suites / 2362 tests**, coverage **99.04 % statements / 94.87 % branches / 98.61 % functions / 99.56 % lines**.
- `npx firebase deploy --only firestore:rules --dry-run --project misgastos-61e15` compiled successfully; **deployment is pending** (`npm run firebase-deploy:rules`).
- Reviewer verdict `approve with nits` after fixing the reversed-pair edit dead end, the `group-settlement` notification target and the minors. Manual device validation (multi-currency, partial/full, direct/simplified, wallet link/unlink, light/dark, screen reader) is pending.
- Note: `docs/project/development-notes/session-notes/2026-11-23-group-balances-and-settlements.md`.

## Technical Notes
- Suggested collection: `groups/{groupId}/settlements/{settlementId}` with `fromUserId`, `toUserId`, `amountCents`, `currency`, `date`, `note`, `createdBy`, `createdAt`, `updatedAt` and `deletedAt`.
- Implement pure functions in `features/groups/utils/` or `services/`: `calculateNetBalances`, `simplifyDebts`, `applySettlement`.
- **Net balance:** for each member and currency, `net = sum(amountPaid) - sum(shareCents)`. Positive = the group owes the member; negative = the member owes the group. The sum over all members is always zero because every expense adds `amountCents` to the payer and distributes the same `amountCents` across the participants. Example: a 90 € dinner split three ways with A paying gives A `90 - 30 = +60`, B `0 - 30 = -30`, C `0 - 30 = -30`.
- **Direct debts:** one edge per non-payer participant with a positive share (`participant.userId owes payer` for `shareCents`). This is the raw "who owes whom" view and the input for the simplified view.
- **Simplification:** take the per-currency net balances, split them into debtors (negative) and creditors (positive), and match them deterministically (for example largest absolute amount first, ties by `userId` ascending). Transfer `min(debt, credit)` on each match and repeat until every balance is zero. The result is deterministic, uses at most `n-1` transfers for `n` non-zero balances and never exceeds the net amounts. Example: A owes B 10 and B owes C 10 → net A −10, B 0, C +10 → simplify to A owes C 10. A→B→C disappears.
- **Group setting:** add `simplifyDebts` to the group document, default `true` (missing = `true`, so groups created before this field keep simplifying). The owner toggles it from the group settings/edit form; the group metadata update and its rules allow only the owner to change it. The change is recorded in the group history (TICKET-011). When off, the UI shows the direct debts; when on, it shows the simplified suggestions. The raw net balances are always displayed and never depend on the toggle.
- Use integer cents and deterministic rounding. Never compare monetary values with strict float equality. Balances are grouped per currency and never converted, so one member can owe different currencies at the same time; a group expense uses its own currency, not a fixed group ledger currency. Simplification is per currency, never across currencies.
- The simplified debt algorithm should be deterministic so the same group state produces the same suggestions.
- Settlements affect the group ledger only. Moving money in a personal wallet is a separate future decision.
- **Wallet movements:** TICKET-046 settles the 1:1 case with real wallet movements, bilateral confirmation and notifications. The group version should follow that model rather than moving group money straight into personal wallets.
- **1:1 precedent:** TICKET-046 defines the settlement state machine, the payer/receiver wallet movements, the partial-settlement rules, the accepted-only balance fold and the notification events for a pair. Reuse that model for the group version instead of inventing a second settlement flow; the group version only adds the multi-member balance simplification on top.
- **Reuse after Phase 6.0:** the group settlement reuses TICKET-046's direct-application model (no pending/accepted state) plus TICKET-062's editable amount with the live remaining message and TICKET-064's debt-selection step, adapted to the group's per-currency balances. The "bilateral confirmation" and "accepted-only" wording above is superseded by TICKET-046.
- **Phase B storage decision (23/11/2026):** the settlements live in a **root** `groupSettlements/{settlementId}` collection with a `groupId` field and a client-generated id, not in the suggested `groups/{groupId}/settlements` subcollection. Reason: the creditor income is validated in `firestore.rules` with one `getAfter` on a known root path plus one `get` on the group, and the repository keeps one single-field `where('groupId', '==', groupId)` with a client-side sort (no composite index). The settlement id never builds a Firestore path from user input outside the service. Same trade-off as `groupExpenses`.
- **Phase B rules note (23/11/2026):** `groupSettlements` is member-readable, pair-writable (only `fromUserId`/`toUserId`), the receiver link is creditor-only and all-or-nothing, the pair/direction/currency/creation stamp are immutable and `delete` is always denied. `transactions` gained the income-only, immutable `groupSettlementId` link (no double link with `sharedExpenseId`/`groupExpenseId`/`settlementId`). Read budget on create: one settlement `getAfter` plus one group `get`.
- Decision record: `session-notes/2026-11-20-group-expenses-and-membership-decisions.md`.

## Dependencies
- TICKET-008 Groups (group document and owner settings)
- TICKET-009 Shared Expenses
- TICKET-011 Group History (settlement and **Simplificar deudas** events; TICKET-010 ships the records first)
