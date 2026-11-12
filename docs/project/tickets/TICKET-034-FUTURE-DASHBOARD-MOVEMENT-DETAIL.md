# TICKET-034 - Open Movement Detail from the Dashboard

**Type:** Improvement / UX  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-034; TICKET-025, TICKET-027  
**Sprint:** Post-MVP / Phase 3.5  

## Description
Tapping a recent movement on the dashboard currently opens the **Movimientos** tab. It must open the same read-only movement detail used by the movements list, keeping **Ver todos** as the way to reach the full history. The detail keeps its top-right edit and delete actions so the dashboard behaves like the movements screen.

## Requirements
- [ ] Reuse `useTransactionDetailDialog` and `TransactionDetailModal` in `DashboardScreen`; do not create another detail view
- [ ] Tapping a recent movement opens the detail modal with live data (category, wallet, notes, date and amount)
- [ ] Keep the movements header action opening `/transactions`
- [ ] Wire the detail edit action to the existing transaction form (`useTransactionFormDialog` + `TransactionsFormModal`) so it opens preloaded and saves through the existing mutations
- [ ] Wire the detail delete action to the existing `deleteTransaction` and confirmation dialog, updating the list and wallet balances on success
- [ ] Remove the dashboard-specific `accessibilityHint` that says the row opens the Movimientos tab and use the default detail hint from `TransactionItem`
- [ ] Do not add a create-movement action: dashboard quick add stays in TICKET-019
- [ ] Update or add tests for the accessibility hint and any polling/wiring extracted from the screen

## Acceptance Criteria
- [ ] Tapping a recent movement opens the movement detail, not the Movimientos tab
- [ ] The pencil opens the existing edit form with the selected movement and saving updates the dashboard row
- [ ] The trash asks for confirmation, deletes the movement and refreshes the list and totals
- [ ] **Ver todos** still opens `/transactions`
- [ ] Card accessibility labels and hints describe opening the detail
- [ ] `npx tsc --noEmit`, `npx expo lint` and `npx jest` pass

## Technical Notes
- `TransactionsScreen` already builds `useTransactionDetailDialog(transactions)`, `useTransactionFormDialog(...)` and renders `TransactionDetailModal` + `TransactionsFormModal`; mirror that composition in `DashboardScreen` without duplicating component logic.
- The dashboard already loads `useTransactions`, `useCategories` and `useWallets`, so no new query is required. Add `addCategory` from `useCategories` for inline creation from the form.
- Deletion already reacts to the service result and updates the collection; keep the same flow as the movements screen.
- `TransactionItem` defaults to `OPEN_TRANSACTION_DETAIL_HINT`; the dashboard currently overrides it with the tab hint, which must go.
- **Out of scope:** new detail fields, changing movement deletion rules and dashboard quick add (TICKET-019).

## Dependencies
- TICKET-025 Movement detail view
- TICKET-027 Home recent movements
