# TICKET-002 - MVP: Expenses, Incomes and History

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** MVP-003, MVP-005  
**Sprint:** MVP  

## Description
Create transactions (expense/income) associated to wallet, with history, filters and sorting.

## Acceptance Criteria
- [ ] Define Transaction types (expense/income)
- [ ] Create transaction from UI
- [ ] Update wallet balance correctly on create/edit/delete
- [ ] History with FlatList
- [ ] Filters: wallet, type, category, date range
- [ ] Sorting: date asc/desc
- [ ] Validations (amount > 0, wallet required)
- [ ] Persist in Firestore
- [ ] Tests for balance update rules
- [ ] Currency inherited from wallet but selectable

## Technical Notes
- Default date today
- Concept/description
- Basic categories initially
- Be careful with decimals - consider cents
