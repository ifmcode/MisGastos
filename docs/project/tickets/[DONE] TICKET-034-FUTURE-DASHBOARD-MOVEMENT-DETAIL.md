# [DONE] TICKET-034 - Open Movement Detail from the Dashboard

**Type:** Improvement / UX  
**Priority:** Medium  
**Status:** ✅ Done (13/11/2026)  
**Related:** PM-034; TICKET-025, TICKET-027  
**Sprint:** Post-MVP / Phase 3.5  

## Description
Tapping a recent movement on the dashboard currently opens the **Movimientos** tab. It must open the same read-only movement detail used by the movements list, keeping **Ver todos** as the way to reach the full history. The detail keeps its top-right edit and delete actions so the dashboard behaves like the movements screen.

## Requirements
- [x] Reuse `useTransactionDetailDialog` and `TransactionDetailModal` in `DashboardScreen`; do not create another detail view
- [x] Tapping a recent movement opens the detail modal with live data (category, wallet, notes, date and amount)
- [x] Keep the movements header action opening `/transactions`
- [x] Wire the detail edit action to the existing transaction form (`useTransactionFormDialog` + `TransactionsFormModal`) so it opens preloaded and saves through the existing mutations
- [x] Wire the detail delete action to the existing `deleteTransaction` and confirmation dialog, updating the list and wallet balances on success
- [x] Remove the dashboard-specific `accessibilityHint` that says the row opens the Movimientos tab and use the default detail hint from `TransactionItem`
- [x] Do not add a create-movement action: dashboard quick add stays in TICKET-019
- [x] Update or add tests for the accessibility hint and any polling/wiring extracted from the screen

## Acceptance Criteria
- [x] Tapping a recent movement opens the movement detail, not the Movimientos tab
- [x] The pencil opens the existing edit form with the selected movement and saving updates the dashboard row
- [x] The trash asks for confirmation, deletes the movement and refreshes the list and totals
- [x] **Ver todos** still opens `/transactions`
- [x] Card accessibility labels and hints describe opening the detail
- [x] `npx tsc --noEmit`, `npx expo lint` and `npx jest` pass

## Technical Notes
- `TransactionsScreen` already builds `useTransactionDetailDialog(transactions)`, `useTransactionFormDialog(...)` and renders `TransactionDetailModal` + `TransactionsFormModal`; mirror that composition in `DashboardScreen` without duplicating component logic.
- The dashboard already loads `useTransactions`, `useCategories` and `useWallets`, so no new query is required. Add `addCategory` from `useCategories` for inline creation from the form.
- Deletion already reacts to the service result and updates the collection; keep the same flow as the movements screen.
- `TransactionItem` defaults to `OPEN_TRANSACTION_DETAIL_HINT_KEY`; the dashboard currently overrides it with the tab hint, which must go.
- **Out of scope:** new detail fields, changing movement deletion rules and dashboard quick add (TICKET-019).

## Dependencies
- TICKET-025 Movement detail view
- TICKET-027 Home recent movements

## Implemented

A recent movement on the dashboard now opens the same read-only detail as the movements list. The detail resolves the selected id against the live dashboard collection, so edits and deletions show updated data immediately and a removed movement falls back to the existing missing state.

- **Shared dialogs, no second view**: `useDashboardMovementDialogs` composes `useTransactionDetailDialog` + `useTransactionFormDialog`, and `DashboardMovementModals` renders `TransactionDetailModal` + `TransactionsFormModal`. Neither modal logic nor copy was duplicated.
- **Wiring**: `createDashboardMovementActions` clears the mutation state before opening the detail and closes the detail before the edit form replaces it, mirroring `TransactionsScreen`. The pencil opens the form preloaded through `buildTransactionFormValues`; saving runs the existing `updateTransaction`.
- **Delete**: the trash keeps the shared `getDeleteTransactionConfirmation` + `ConfirmDialog` flow and calls the existing `deleteTransaction`. A successful edit or delete refreshes the dashboard `useWallets` instance so per-wallet balances and totals update without a manual refresh.
- **Inline category creation**: the form receives `addCategory` from `useCategories`, as in the movements screen.
- **Accessibility**: `DashboardMovementsSection` no longer passes `accessibilityHint`, so rows use `OPEN_TRANSACTION_DETAIL_HINT_KEY`; the obsolete `movements.openHistoryHint` copy was removed from both dashboard locales.
- **Navigation untouched**: **Ver todos** still calls `openMovements` → `/transactions`, and no create action was added (TICKET-019 keeps dashboard quick add).
- **Screen size**: `dashboard-screen.tsx` is 149 lines (it was 168). The refresh behaviour moved to `useDashboardRefresh`/`refreshDashboardSources`, the transfer form modal to `DashboardTransferModal`, and the movement dialogs to their own hook and component.

### Files

| Layer | Files |
|---|---|
| Screen | `features/dashboard/components/dashboard-screen.tsx` |
| Detail + form composition | `components/dashboard-movement-modals.tsx` |
| Dialog state and mutations | `hooks/use-dashboard-movement-dialogs.ts` |
| Open/edit wiring | `utils/dashboard-movement-actions.ts` |
| Refresh wiring | `hooks/use-dashboard-refresh.ts` + `utils/dashboard-refresh.ts` |
| Transfer modal shell | `components/dashboard-transfer-modal.tsx` |
| Row (hint override removed) | `components/dashboard-movements-section.tsx` |
| Copy | `features/dashboard/locales/{es,en}.json` |
| Tests | `utils/__tests__/dashboard-refresh.test.ts`, `utils/__tests__/dashboard-movement-actions.test.ts`, `components/__tests__/dashboard-movements-accessibility.test.ts` |

### Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
npm run check:copy
npm run test:coverage
```

All pass: 136 suites / 621 tests, copy audit clean, coverage 98.76% statements, 93.64% branches, 98.77% functions, 99.31% lines.

### Manual checks pending on device

1. Tap a recent movement: the detail opens with category, wallet, notes, date and amount.
2. Pencil → edit the amount, save: the dashboard row and totals update.
3. Trash → cancel keeps the movement; confirm deletes it and the row, section and totals refresh.
4. **Ver todos** still opens the Movimientos tab.
5. Screen reader over a recent movement announces "Ver detalle del …" with the detail hint.
