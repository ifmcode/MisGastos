# TICKET-001 - MVP: Wallets

**Type:** Feature  
**Priority:** High  
**Status:** ✅ Done  
**Related:** MVP-002  
**Sprint:** MVP  

## Description
Create and manage wallets where expenses/incomes will be associated. Each wallet must have: name, currency, icon, color, initial balance, type (cash/bank/other), includeInTotal toggle.

## Acceptance Criteria
- [x] Define Wallet types/model
- [x] Create wallet from UI
- [x] List wallets
- [x] Show balance per wallet
- [x] Validations (name required, currency, initial balance >= 0)
- [x] Persist in Firestore (root `wallets` collection with `ownerId`)
- [x] Follow features/wallets architecture
- [x] Tests for critical logic

## Technical Notes
- No photos initially
- Predefined icon set
- Common currencies first (EUR, USD, GBP...)
- Initial balance affects balance
- "Include in total" toggle for dashboard

## Implementation Notes (28/10/2026)
- Firestore path: root `wallets` collection (`wallets/{walletId}`); documents store `ownerId`.
- Firestore rules: owner-only access for `users/{userId}` and `wallets/{walletId}` in `firestore.rules`.
- Layers: `repositories` (Firestore + mapper), `services` (business validation), `hooks` (orchestration), `components` (UI).
- Amounts are decimal numbers rounded to 2 decimals; input accepts comma or dot and rejects negatives/more than 2 decimals.
- Dashboard total is grouped by currency (no conversion in MVP) and only sums wallets with `includeInTotal`.
- Tests: schema validation, money/totals, service, mapper, repository and error messages.
