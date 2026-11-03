# TICKET-010 - Future: Group Balances and Settlements

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-007, PM-008; TICKET-009, TICKET-011  
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

## Dependencies
- TICKET-009 Shared Expenses
- TICKET-011 Group History (settlement entries)
