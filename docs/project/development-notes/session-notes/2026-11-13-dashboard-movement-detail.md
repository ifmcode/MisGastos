# Session Note: Dashboard Movement Detail (TICKET-034)

**Date:** 13/11/2026  
**Ticket:** TICKET-034 / PM-034  
**Status:** ✅ Done

## Summary

Tapping a recent movement on the dashboard now opens the same read-only detail
used by the movements list instead of jumping to the **Movimientos** tab. The
detail resolves the selected id against the live dashboard collection, so it
always shows the current category, wallet, notes, date and amount. The pencil
opens the existing edit form and the trash reuses the existing confirmation and
delete operation.

**Ver todos** remains the only way to reach the full history, and no create
action was added (dashboard quick add stays in TICKET-019).

## Architecture

| Layer | Files |
|---|---|
| Screen orchestration | `features/dashboard/components/dashboard-screen.tsx` |
| Detail + form composition | `features/dashboard/components/dashboard-movement-modals.tsx` |
| Dialog state and mutations | `features/dashboard/hooks/use-dashboard-movement-dialogs.ts` |
| Open/edit wiring | `features/dashboard/utils/dashboard-movement-actions.ts` |
| Refresh wiring | `hooks/use-dashboard-refresh.ts` + `utils/dashboard-refresh.ts` |
| Transfer modal shell | `components/dashboard-transfer-modal.tsx` |
| Row (hint override removed) | `components/dashboard-movements-section.tsx` |
| Reused components | `transaction-detail-modal.tsx`, `transactions-form-modal.tsx` |
| Tests | `dashboard-refresh.test.ts`, `dashboard-movement-actions.test.ts`, `dashboard-movements-accessibility.test.ts` |

## Decisions

- **One detail implementation**: the dashboard composes the shared
  `useTransactionDetailDialog` + `TransactionDetailModal` and
  `useTransactionFormDialog` + `TransactionsFormModal`. No dashboard-specific
  detail view, copy or delete rule was created.
- **Wallet refresh after mutations**: the dashboard owns its own `useWallets`
  instance, while `useTransactionMutations` reloads a different one. Editing or
  deleting a movement therefore refreshes the dashboard wallets explicitly so
  per-wallet balances and totals follow without a manual pull-to-refresh.
- **Close before edit**: `editFromDetail` closes the detail before opening the
  form to avoid stacking two native modals, exactly like the movements screen.
  Opening the detail also clears stale mutation errors.
- **Accessibility**: `TransactionItem` defaults to
  `OPEN_TRANSACTION_DETAIL_HINT_KEY`; the dashboard no longer overrides it, and
  the obsolete `movements.openHistoryHint` copy was deleted from both locales.
- **Screen size**: `dashboard-screen.tsx` went from 168 to 149 lines. The refresh
  behaviour, the transfer modal shell and the movement dialogs moved to their
  own hook/component files instead of staying inline.

## Manual platform checks

1. Tap a recent movement on iOS, Android and web: the detail opens with the
   same values as the row.
2. Pencil → change the amount, save: the dashboard row and totals update.
3. Trash → cancel keeps the movement; confirm deletes it and the section,
   totals and **Ver todos** state refresh.
4. **Ver todos** still opens the **Movimientos** tab.
5. Run a screen reader over a recent movement: the label describes the movement
   and the hint invites opening its detail.

## Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
npm run check:copy
npm run test:coverage
```

All pass (136 suites, 621 tests; coverage 98.76% statements, 93.64% branches,
98.77% functions, 99.31% lines).
