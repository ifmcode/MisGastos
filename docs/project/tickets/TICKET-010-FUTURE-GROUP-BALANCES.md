# TICKET-010 - Future: Group Balances and Settlements

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-007, PM-008; TICKET-009, TICKET-011, TICKET-046, TICKET-047, TICKET-062, TICKET-064  
**Sprint:** Post-MVP  

## Description
Show who owes whom inside each group, simplify debts and record payments between members to settle balances.

## Requirements
- [ ] Calculate each member's net balance from active shared expenses
- [ ] Show "who owes whom" and a simplified list of suggested payments
- [ ] Record a settlement between two members with amount, date and optional note
- [ ] Allow partial settlements and multiple settlements between the same members
- [ ] Allow editing and soft-deleting a settlement with balance recalculation
- [ ] Show the current user's net balance in the group list
- [ ] Add empty and settled-group states
- [ ] Add tests for net balances, simplification, rounding and partial payments

## Acceptance Criteria
- [ ] Balances update after creating, editing or deleting an expense
- [ ] The simplified debt list never asks for more money than the net balances require
- [ ] Recording a settlement reduces the correct pair's debt
- [ ] Settlements are visible in the group history
- [ ] Balances return to zero when all debts are settled
- [ ] Non-members cannot read or modify balances or settlements

## Technical Notes
- Suggested collection: `groups/{groupId}/settlements/{settlementId}` with `fromUserId`, `toUserId`, `amountCents`, `currency`, `date`, `note`, `createdBy`, `createdAt`, `updatedAt` and `deletedAt`.
- Implement pure functions in `features/groups/utils/` or `services/`: `calculateNetBalances`, `simplifyDebts`, `applySettlement`.
- Use integer cents and deterministic rounding. Never compare monetary values with strict float equality.
- The simplified debt algorithm should be deterministic so the same group state produces the same suggestions.
- Settlements affect the group ledger only. Moving money in a personal wallet is a separate future decision.
- **Wallet movements:** TICKET-046 settles the 1:1 case with real wallet movements, bilateral confirmation and notifications. The group version should follow that model rather than moving group money straight into personal wallets.
- **1:1 precedent:** TICKET-046 defines the settlement state machine, the payer/receiver wallet movements, the partial-settlement rules, the accepted-only balance fold and the notification events for a pair. Reuse that model for the group version instead of inventing a second settlement flow; the group version only adds the multi-member balance simplification on top.
- **Reuse after Phase 6.0:** the group settlement reuses TICKET-046's direct-application model (no pending/accepted state) plus TICKET-062's editable amount with the live remaining message and TICKET-064's debt-selection step, adapted to the group's per-currency balances. The "bilateral confirmation" and "accepted-only" wording above is superseded by TICKET-046.

## Dependencies
- TICKET-009 Shared Expenses
- TICKET-011 Group History (settlement entries)
