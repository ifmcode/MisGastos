# TICKET-009 - Future: Shared Expenses

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-006; TICKET-008, TICKET-010, TICKET-011  
**Sprint:** Post-MVP  

## Description
Add expenses inside a group, choose who paid and split the amount equally, by percentage, by fixed amounts or by shares.

## Requirements
- [ ] Create a shared expense with description, amount, date, payer and participants
- [ ] Support equal, percentage, fixed-amount and share-based splits
- [ ] Validate that all participants are group members and the payer is a member
- [ ] Validate that split values add up to the total, with deterministic rounding
- [ ] Store the expense in the group currency
- [ ] Allow editing and soft-deleting an expense while keeping an audit trail
- [ ] Show the expense in the group detail and feed the balance calculation
- [ ] Add tests for every split mode, rounding and invalid inputs

## Acceptance Criteria
- [ ] A member can add an expense and see it in the group
- [ ] Each participant's share is calculated correctly for all split modes
- [ ] The sum of shares always equals the expense total
- [ ] Non-members cannot create or read the expense
- [ ] Editing or deleting an expense updates balances without losing history

## Technical Notes
- Suggested collection: `groups/{groupId}/expenses/{expenseId}` or a root `groupExpenses` collection with `groupId`.
- Store money in integer cents to avoid floating-point errors. Reuse the existing money utilities where possible.
- Suggested fields: `payerId`, `amountCents`, `currency`, `splitMode`, `participants[{ userId, shareCents }]`, `description`, `date`, `createdBy`, `createdAt`, `updatedAt`, `deletedAt`.
- The balance calculation belongs in a pure service used by both the group screen and the friends screen.
- Personal wallet balances are not modified by group expenses unless a future ticket explicitly defines a settlement-to-wallet flow.

## Dependencies
- TICKET-008 Groups
- TICKET-007 Friends and Requests
