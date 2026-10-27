# TICKET-003 - MVP: Transfers between wallets and Dashboard

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** MVP-004, MVP-006  
**Sprint:** MVP  

## Description
Transfers between own wallets and summary view with filterable totals.

## Acceptance Criteria
- [ ] Transfer: from, to, amount, date, notes
- [ ] Validate sufficient balance in source
- [ ] Update both wallet balances
- [ ] Don't allow same wallet
- [ ] Dashboard: total global, per wallet
- [ ] Filter by wallet or "All"
- [ ] Clear summary UI
- [ ] Tests for critical transfer logic

## Technical Notes
- Consider transfer type or linked movements for traceability
- Must be atomic
- Respect "include in total" toggle
- Clear UX to avoid errors
