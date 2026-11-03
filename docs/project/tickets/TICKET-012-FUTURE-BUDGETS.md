# TICKET-012 - Future: Budgets

**Type:** Feature  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-011; TICKET-002, TICKET-004  
**Sprint:** Post-MVP  

## Description
Let users define budgets by category, wallet or globally, track spending against each budget and receive in-app warnings when a threshold is reached.

## Requirements
- [ ] Create a budget with amount, currency, period and scope
- [ ] Support monthly and weekly periods
- [ ] Support global, per-wallet and per-category scopes
- [ ] Show progress, remaining amount and percentage used
- [ ] Warn in-app at configurable thresholds (for example 80% and 100%)
- [ ] Allow editing and deleting budgets
- [ ] React to new, edited and deleted transactions
- [ ] Add tests for period boundaries, scope filtering and progress calculation

## Acceptance Criteria
- [ ] A budget shows the correct spending for the selected period
- [ ] Income is not counted as spending
- [ ] Changing a transaction updates the related budget
- [ ] Archived or deleted wallets are handled according to the chosen policy
- [ ] Budgets in different currencies are not mixed
- [ ] Invalid amounts and periods are rejected

## Technical Notes
- Suggested collection: `budgets/{budgetId}` with `ownerId`, `scopeType` (`global`, `wallet`, `category`), `scopeId`, `amountCents`, `currency`, `period` (`weekly`, `monthly`), `startDate`, `createdAt` and `updatedAt`.
- Store amounts in integer cents and reuse the existing date and money utilities.
- Start with in-app warnings only. Push notifications require additional platform setup and are out of scope.
- Keep the calculation in a pure service with tests for month-end, week-start and timezone boundaries.

## Dependencies
- TICKET-002 Transactions
- TICKET-004 Categories
