# TICKET-001 - MVP: Wallets

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** MVP-002  
**Sprint:** MVP  

## Description
Create and manage wallets where expenses/incomes will be associated. Each wallet must have: name, currency, icon, color, initial balance, type (cash/bank/other), includeInTotal toggle.

## Acceptance Criteria
- [ ] Define Wallet types/model
- [ ] Create wallet from UI
- [ ] List wallets
- [ ] Show balance per wallet
- [ ] Validations (name required, currency, initial balance >= 0)
- [ ] Persist in Firestore (users/{uid}/wallets or wallets with ownerId)
- [ ] Follow features/wallets architecture
- [ ] Tests for critical logic

## Technical Notes
- No photos initially
- Predefined icon set
- Common currencies first (EUR, USD, GBP...)
- Initial balance affects balance
- "Include in total" toggle for dashboard
