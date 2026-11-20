# TICKET-010 - Future: Group Balances and Settlements

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-007, PM-008; TICKET-009, TICKET-011, TICKET-046, TICKET-047, TICKET-062, TICKET-064  
**Sprint:** Post-MVP  

## Description
Show who owes whom inside each group, simplify debts and record payments between members to settle balances.

## Requirements
- [ ] Calculate each member's net balance per currency as `sum(amountPaid) - sum(share)` over the active group expenses; positive means the group owes the member, negative means the member owes the group
- [ ] Assert that the sum of every member's net balance is zero for every currency
- [ ] Show the raw per-member net balances and a "who owes whom" list; when **Simplificar deudas** is on, show the simplified suggested transfers; when off, show the direct debts
- [ ] Add a per-group **Simplificar deudas** setting, owner-editable and **on by default**; store it on the group document (`simplifyDebts`, missing = true), expose it in the group settings/edit form and record changes in the group history
- [ ] Simplify each currency independently, deterministically, with at most `n-1` transfers for `n` non-zero balances and never more money than the net balances require
- [ ] Record a settlement between two members with amount, date and optional note
- [ ] Allow partial settlements and multiple settlements between the same members
- [ ] Allow editing and soft-deleting a settlement with balance recalculation
- [ ] Show the current user's net balance in the group list
- [ ] Add empty and settled-group states
- [ ] Add tests for net balances, the zero-sum invariant, simplification, rounding and partial payments

## Acceptance Criteria
- [ ] The sum of all member net balances is zero for every currency
- [ ] The 90 €/3 example yields A +60 €, B -30 € and C -30 € when A pays the whole bill
- [ ] The A→B→C example simplifies to A owes C 10 € instead of A→B and B→C
- [ ] The simplified list is deterministic, never asks for more money than the net balances require and uses at most `n-1` transfers
- [ ] Turning **Simplificar deudas** off shows the direct debts; turning it on shows the simplified suggestions; the net balances never change
- [ ] Balances update after creating, editing or deleting an expense
- [ ] Recording a settlement reduces the correct pair's debt
- [ ] Settlements are visible in the group history
- [ ] Balances return to zero when all debts are settled
- [ ] Non-members cannot read or modify balances or settlements

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
- Decision record: `session-notes/2026-11-20-group-expenses-and-membership-decisions.md`.

## Dependencies
- TICKET-008 Groups (group document and owner settings)
- TICKET-009 Shared Expenses
- TICKET-011 Group History (settlement entries)
