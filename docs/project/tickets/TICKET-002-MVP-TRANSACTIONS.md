# TICKET-002 - MVP: Expenses, Incomes and History

**Type:** Feature  
**Priority:** High  
**Status:** Done  
**Related:** MVP-003, MVP-005  
**Sprint:** MVP  

## Description
Create transactions (expense/income) associated to wallet, with history, filters and sorting.

## Acceptance Criteria
- [x] Define Transaction types (expense/income)
- [x] Create transaction from UI
- [x] Update wallet balance correctly on create/edit/delete
- [x] History with FlatList
- [x] Filters: wallet, type, category, date range
- [x] Sorting: date asc/desc
- [x] Validations (amount > 0, wallet required)
- [x] Persist in Firestore
- [x] Tests for balance update rules
- [ ] Currency inherited from wallet (not freely selectable)
- [x] Allow selecting which wallet will be affected when creating/editing a transaction

## Technical Notes
- Default date today
- Concept/description
- Basic categories initially
- Be careful with decimals - consider cents
- Wallet selector is required in transaction form
