# TICKET-035 - Transfer Detail View with Edit and Delete

**Type:** Feature / UX  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-035; TICKET-025, TICKET-026, TICKET-032, TICKET-037  
**Sprint:** Post-MVP / Phase 3.5  

## Description
Add a read-only transfer detail modal equivalent to the movement detail: amount and currency, origin and destination wallets, date, notes and top-right edit/delete actions. It must reuse the movement detail presentation by extracting a shared detail view that receives the title, summary and field list, instead of copying the transaction components.

## Requirements
- [ ] Extract a reusable detail view to `shared/components` that receives the header (title/subtitle), summary (label, amount, meta, tone) and a list of `{ key, label, value }` fields
  - Include the page-sheet modal shell, header with close/edit/delete, summary card, fields card, optional error and the missing-record state
  - Keep one component per file and every file under 150 lines
- [ ] Refactor `TransactionDetailModal` and its header/content/missing-state to consume the shared view with no copy or behavior changes
- [ ] Create `useTransferDetailDialog` mirroring `useTransactionDetailDialog`: store the selected id, resolve it from the live transfer collection and expose a missing state
- [ ] Create the transfer detail wrapper and a `transfer-detail` util that builds the summary and fields
- [ ] Show amount and currency without an income/expense sign, origin wallet, destination wallet, date and notes (`Sin notas` fallback)
- [ ] Resolve wallet names with `getTransferWalletNames` so archived wallets keep their live name and deleted wallets keep their stored `[Eliminada]` label
- [ ] Edit delegates to `useTransferFormDialog.openEdit` through the host screen; do not edit inline
- [ ] Delete reuses `getDeleteTransferConfirmation`, `ConfirmDialog` and `deleteTransfer`
- [ ] Add accessibility labels: `Cerrar detalle`, `Editar transferencia`, `Eliminar transferencia`
- [ ] Add an optional `accessibilityHint` to `TransferItem` (the default keeps the current edit hint) plus a detail hint/label, so TICKET-036 can reuse the card without changing `/transfers`
- [ ] Tests for the transfer summary/fields, archived and deleted wallet labels, and the detail state selection

## Acceptance Criteria
- [ ] A transfer detail shows amount, currency, origin, destination, date and notes
- [ ] Long or missing notes render `Sin notas` without breaking the layout
- [ ] The pencil opens the existing transfer form preloaded and saving updates the detail and list
- [ ] The trash asks for confirmation, deletes the transfer and lets the existing service revert both balances
- [ ] A deleted or missing transfer shows the missing state with a close action
- [ ] The movement detail looks and behaves exactly as before the shared extraction
- [ ] `npx tsc --noEmit`, `npx expo lint` and `npx jest` pass

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
