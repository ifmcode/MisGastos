# [DONE] TICKET-039 - Open Transfer Detail from the Transfer History

**Type:** Improvement / UX  
**Priority:** Medium  
**Status:** ✅ Done (14/11/2026)  
**Related:** PM-039; TICKET-026, TICKET-035, TICKET-036  
**Sprint:** Post-MVP / Phase 3.5

## Description
Tapping a transfer in the `/transfers` history must open the read-only transfer detail (TICKET-035) instead of the edit form. Editing and deleting stay available from the detail, so every transfer entry point behaves the same way as the dashboard.

## Requirements
- [x] Use `useTransferDetailDialog` and `TransferDetailModal` in the transfer history screen; tapping a row opens the detail
- [x] The detail edit action closes the detail and opens `TransferFormModal` through `useTransferFormDialog.openEdit`
- [x] The detail delete action reuses `deleteTransfer` with its confirmation and closes the detail on success
- [x] Refresh wallets after a delete started from the detail so the balances follow
- [x] Pass `labelKind="detail"` to the history `TransferItem` so screen readers announce the detail action
- [x] Keep loading, error, empty and pull-to-refresh states unchanged
- [x] Reuse the dashboard open-detail/edit wiring instead of duplicating it
- [x] Update the accessibility copy tests and add tests for the extracted wiring

## Acceptance Criteria
- [x] Tapping a transfer in `/transfers` opens the transfer detail, not the edit form
- [x] The pencil opens the existing transfer form with the selected transfer
- [x] The trash asks for confirmation, deletes the transfer and reverts the balances
- [x] The history keeps exactly one transfer detail modal and one shared form modal
- [x] The dashboard keeps opening the transfer detail from a recent transfer
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- `useTransferHistoryScreen` already composed the shared form; add `useTransferDetailDialog(transfers)` and the shared dialog actions next to it.
- TICKET-035 added the optional `labelKind`/hint to `TransferItem` and the detail copy, so no new translations are needed.
- `TransferDetailModal` already closes itself when `onConfirmDelete` resolves `true`, so no extra close logic is required.
- **Out of scope:** changing the dashboard, the transfer form or the detail presentation.

## Dependencies
- TICKET-026 Transfer history
- TICKET-035 Transfer detail view
- TICKET-036 Dashboard transfer detail entry

## Implemented

- **Shared wiring**: The dashboard-only `dashboard-transfer-actions.ts` moved to `features/transfers/utils/transfer-dialog-actions.ts` as `createTransferDialogActions`, reused by both the dashboard and the history. The old util and its test were replaced by the transfers test.
- **History controller**: `useTransferHistoryScreen` now composes `useTransferDetailDialog(transfers)` with `useTransferFormDialog`, returns `detail`, `openDetail`, `editFromDetail` and a wrapped `deleteTransfer`, and exposes no new UI state.
- **Screen**: `TransferHistoryScreen` passes `labelKind="detail"` to each `TransferItem`, opens the detail on press, and renders one `TransferDetailModal` next to the existing `TransferFormModal`. The pencil closes the detail and opens the form preloaded; the trash reuses `getDeleteTransferConfirmation` and the shared `ConfirmDialog`.
- **Balances**: A successful delete from the detail calls `reloadWallets`, so the next wallet render already reflects the reverted balances even though this screen does not show them.
- **Copy**: No new keys; the existing `item.detailLabel`, `item.detailHint` and `detail.*` copy covers the history. The edit label/hint stay as the shared card fallback.

Verification: `npx tsc --noEmit`, `npx expo lint`, `npx jest` (141 suites / 645 tests) and `npm run check:copy` (157 TSX files) pass.
