# TICKET-019 - Future: Dashboard Quick Add

**Type:** Improvement  
**Priority:** Low  
**Status:** ⏳ Pending  
**Related:** PM-019; TICKET-002, TICKET-003  
**Sprint:** Post-MVP  

## Description
Let users create an expense or income directly from the dashboard without navigating to the transactions tab, reusing the existing transaction form and validations.

## Requirements
- [ ] Add quick expense and income actions to the dashboard
- [ ] Preselect the wallet from the dashboard filter, or the first available wallet
- [ ] Reuse the existing transaction form, schema and balance update logic
- [ ] Default to today and the last-used date chip where available
- [ ] Refresh the dashboard and wallet totals after creating the transaction
- [ ] Disable the actions when the user has no wallets
- [ ] Keep the existing transfer action
- [ ] Add tests for preselection and successful creation

## Acceptance Criteria
- [ ] The dashboard can create an expense and an income
- [ ] The new transaction appears in history and updates the correct wallet
- [ ] The dashboard totals update immediately
- [ ] The form behaves exactly like the one in the transactions tab
- [ ] Users without wallets see a clear empty state
- [ ] No duplicate form logic is introduced

## Technical Notes
- Extract the transaction form dialog/hook so it can be mounted from both the transactions screen and the dashboard. Avoid copying the current form state.
- Reuse `useTransactionFormDialog`, the transaction schema and the category/wallet selectors.
- The dashboard wallet filter can seed the initial `walletId`. If "all wallets" is selected, choose a deterministic default and let the user change it.
- Keep the existing transfer button; quick add should not replace it.
- Follow the screen orchestration rule: the dashboard screen passes callbacks, the form component owns its fields.

## Dependencies
- TICKET-002 Transactions
- TICKET-003 Dashboard
