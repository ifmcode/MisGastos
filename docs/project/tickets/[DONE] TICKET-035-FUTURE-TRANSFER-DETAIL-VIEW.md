# [DONE] TICKET-035 - Transfer Detail View with Edit and Delete

**Type:** Feature / UX  
**Priority:** Medium  
**Status:** ✅ Done (13/11/2026)  
**Related:** PM-035; TICKET-025, TICKET-026, TICKET-032, TICKET-037  
**Sprint:** Post-MVP / Phase 3.5  

## Description
Add a read-only transfer detail modal equivalent to the movement detail: amount and currency, origin and destination wallets, date, notes and top-right edit/delete actions. It must reuse the movement detail presentation by extracting a shared detail view that receives the title, summary and field list, instead of copying the transaction components.

## Requirements
- [x] Extract a reusable detail view to `shared/components` that receives the header (title/subtitle), summary (label, amount, meta, tone) and a list of `{ key, label, value }` fields
  - Include the page-sheet modal shell, header with close/edit/delete, summary card, fields card, optional error and the missing-record state
  - Keep one component per file and every file under 150 lines
- [x] Refactor `TransactionDetailModal` and its header/content/missing-state to consume the shared view with no copy or behavior changes
- [x] Create `useTransferDetailDialog` mirroring `useTransactionDetailDialog`: store the selected id, resolve it from the live transfer collection and expose a missing state
- [x] Create the transfer detail wrapper and a `transfer-detail` util that builds the summary and fields
- [x] Show amount and currency without an income/expense sign, origin wallet, destination wallet, date and notes (`Sin notas` fallback)
- [x] Resolve wallet names with `getTransferWalletNames` so archived wallets keep their live name and deleted wallets keep their stored `[Eliminada]` label
- [x] Edit delegates to `useTransferFormDialog.openEdit` through the host screen; do not edit inline
- [x] Delete reuses `getDeleteTransferConfirmation`, `ConfirmDialog` and `deleteTransfer`
- [x] Add accessibility labels: `Cerrar detalle`, `Editar transferencia`, `Eliminar transferencia`
- [x] Add an optional `accessibilityHint` to `TransferItem` (the default keeps the current edit hint) plus a detail hint/label, so TICKET-036 can reuse the card without changing `/transfers`
- [x] Tests for the transfer summary/fields, archived and deleted wallet labels, and the detail state selection

## Acceptance Criteria
- [x] A transfer detail shows amount, currency, origin, destination, date and notes
- [x] Long or missing notes render `Sin notas` without breaking the layout
- [x] The pencil opens the existing transfer form preloaded and saving updates the detail and list
- [x] The trash asks for confirmation, deletes the transfer and lets the existing service revert both balances
- [x] A deleted or missing transfer shows the missing state with a close action
- [x] The movement detail looks and behaves exactly as before the shared extraction
- [x] `npx tsc --noEmit`, `npx expo lint` and `npx jest` pass

## Technical Notes
- Follow the structure already used by movements: `use-transaction-detail-dialog.ts`, `transaction-detail.ts` (summary + fields), `transaction-detail-state.ts` (reducer), `transaction-detail-modal.tsx`, `transaction-detail-header.tsx`, `transaction-detail-content.tsx` and `transaction-detail-missing-state.tsx`.
- Proposed shared files: `shared/components/organisms/detail-modal.tsx`, `detail-header.tsx`, `detail-summary-card.tsx`, `detail-fields-card.tsx`, `detail-missing-state.tsx` and `detail.styles.ts`. Adjust the split if a file approaches 150 lines.
- The shared modal should own the delete confirmation dialog and receive `deleteConfirmation` + `onConfirmDelete`; each feature keeps its own confirmation copy (`getDeleteTransactionConfirmation` vs `getDeleteTransferConfirmation`).
- `transaction-detail.ts` already returns `{ key, label, value }`; move that field type to the shared detail types.
- `TransactionDetailModal` is rendered from `TransactionsScreen`; keep its public props stable so the screen does not change.
- **Out of scope:** editing transfers from `/transfers`, transfer filters, changing transfer rules and i18n extraction (TICKET-031).
- **Coordination:** this ticket delivers the detail-view extraction; TICKET-037 must treat it as done and focus on the remaining duplicated components.

## Dependencies
- TICKET-025 Movement detail view
- TICKET-026 Transfer history
- TICKET-032 Wallet transfer entry point

## Implemented

The movement detail presentation now lives in `shared/components/organisms` as a data-driven read-only view, and the transfer detail reuses it. The dashboard is the first transfer entry point: tapping a recent transfer opens the detail, the pencil hands the transfer to the existing form and the trash reuses the existing confirmation and soft delete.

- **Shared detail view**: `DetailModal` owns the page-sheet shell, header with close/edit/delete, optional feature error slot, summary card, fields card, missing-record state and the delete confirmation dialog (`deleteConfirmation` + `onConfirmDelete`). It receives resolved copy and data (`title`, `subtitle`, `DetailSummary`, `DetailField[]`, action/missing labels), so no visible string or domain type lives in `shared`.
- **Layout split**: `detail-body.tsx` holds the scrollable error + summary + fields block so `detail-modal.tsx` stays at 148 lines. `detail.styles.ts` replaces the deleted transaction detail styles module and keeps the original metrics, so the movement detail looks the same.
- **Movement detail**: `TransactionDetailModal` keeps its public props and now maps the movement into the shared summary/fields. `getTransactionDetailSummary` returns a shared `DetailSummary` (signed amount, positive/negative tone) and `buildTransactionDetailFields` returns shared `DetailField`s with resolved labels. The single-use `transaction-detail-header.tsx`, `transaction-detail-content.tsx`, `transaction-detail-missing-state.tsx` and `transaction-detail.styles.ts` were removed; their markup and copy moved to the shared view, with no visual or behavioral change.
- **Transfer detail**: `TransferDetailModal` + `transfer-detail.ts` build a neutral summary (formatted amount and currency, no sign) and the `Origen`/`Destino`/`Fecha`/`Notas` fields. Wallet names come from `getTransferWalletNames`, so archived wallets keep their live name and deleted wallets keep the stored `[Eliminada]` label. Notes fall back to `common:states.noNotes` and long notes wrap in the fields card.
- **State**: `useTransferDetailDialog` mirrors the movement dialog with `transfer-detail-state.ts`, resolving the selected id against the live collection, so edits refresh the view and a removed transfer shows the missing state.
- **Edit and delete**: `TransferDetailModal` delegates edit through the host screen to `useTransferFormDialog.openEdit`. Delete reuses `getDeleteTransferConfirmation`, the shared `ConfirmDialog` and `deleteTransfer`, whose service reverts both balances and the soft-deletes the record.
- **Accessibility**: close uses the shared `Cerrar detalle` label, and edit/delete use `Editar transferencia` / `Eliminar transferencia` with hints. `TransferItem` accepts `labelKind` (`edit` default, `detail` for the dashboard) and an optional `accessibilityHint` override, so `/transfers` keeps its current edit label/hint while the dashboard announces and explains the detail.
- **Dashboard entry point**: `useDashboardTransferDialogs` composes the detail and form dialogs, `DashboardTransferModals` renders them and `createDashboardTransferActions` closes the detail before opening the form. Deleting from the detail reloads the dashboard wallets so balances and totals follow. This absorbs the TICKET-036 wiring; `/transfers` still opens the edit form and **Ver todos** still opens the history.
- **Theming**: every color comes from `useFormTheme`; the summary amount uses `success`, `danger` or the default text color based on the shared tone, so dark mode and web keep working.

### Files

| Layer | Files |
|---|---|
| Shared detail view | `shared/components/organisms/detail-modal.tsx`, `detail-header.tsx`, `detail-body.tsx`, `detail-summary-card.tsx`, `detail-fields-card.tsx`, `detail-missing-state.tsx`, `detail.styles.ts` |
| Shared types | `shared/types/detail.types.ts` |
| Movement detail | `features/transactions/components/transaction-detail-modal.tsx`, `utils/transaction-detail.ts` |
| Transfer detail | `features/transfers/components/transfer-detail-modal.tsx`, `hooks/use-transfer-detail-dialog.ts`, `utils/transfer-detail.ts`, `utils/transfer-detail-state.ts` |
| Transfer card | `features/transfers/components/transfer-item.tsx`, `utils/transfer-item-accessibility.ts` |
| Dashboard wiring | `features/dashboard/hooks/use-dashboard-transfer-dialogs.ts`, `components/dashboard-transfer-modals.tsx`, `utils/dashboard-transfer-actions.ts` |
| Copy | `features/transfers/locales/{es,en}.json` |
| Tests | `features/transfers/utils/__tests__/transfer-detail.test.ts`, `transfer-detail-state.test.ts`, `transfer-item-accessibility.test.ts`, `features/transactions/utils/__tests__/transaction-detail.test.ts`, `features/dashboard/utils/__tests__/dashboard-transfer-actions.test.ts`, `features/dashboard/components/__tests__/dashboard-transfers-accessibility.test.ts` |

### Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
npm run check:copy
npm run test:coverage
```

All pass: 140 suites / 641 tests, copy audit clean (161 TSX files), coverage 98.73% statements, 93.5% branches, 98.81% functions, 99.27% lines.

### Manual checks pending on device

1. Tap a recent transfer: the detail opens with amount, currency, origin, destination, date and notes.
2. Pencil → edit the amount, save: the dashboard row, balances and totals update.
3. Trash → cancel keeps the transfer; confirm deletes it, reverts both balances and the list refreshes.
4. A transfer deleted from another device shows the missing state with a working **Cerrar** action.
5. Screen reader over a recent transfer announces the detail label and hint; `/transfers` still announces the edit label and hint.
