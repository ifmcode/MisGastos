# [DONE] TICKET-036 - Open Transfer Detail from the Dashboard

**Type:** Improvement / UX  
**Priority:** Medium  
**Status:** ✅ Done (13/11/2026)  
**Related:** PM-036; TICKET-026, TICKET-032, TICKET-035  
**Sprint:** Post-MVP / Phase 3.5  

## Description
Tapping a recent transfer on the dashboard must open the new transfer detail (TICKET-035) instead of the edit form. Editing stays available from the detail's pencil, and the recent-transfers header action keeps opening the history.

## Requirements
- [x] Use `useTransferDetailDialog` and the transfer detail modal in `DashboardScreen`; `onPressTransfer` opens the detail
- [x] The detail edit action closes the detail and opens `TransferFormModal` through `useTransferFormDialog.openEdit`
- [x] The detail delete action reuses `deleteTransfer` and its confirmation and closes the detail on success
- [x] Refresh wallets and transfers after an edit or delete started from the dashboard so balances, totals and the recent list stay in sync
- [x] Pass `accessibilityHint` with the transfer detail hint to the dashboard `TransferItem`; `/transfers` keeps opening the edit form and its current hint
- [x] Keep the recent-transfers **Ver todos** action opening `/transfers`
- [x] Update or add tests for the detail hint/label and any wiring extracted from the screen

## Acceptance Criteria
- [x] Tapping a recent transfer opens the transfer detail, not the edit form
- [x] The pencil opens the existing transfer form with the selected transfer and saving updates the dashboard row and balances
- [x] The trash asks for confirmation, deletes the transfer, reverts balances and refreshes the list
- [x] The dashboard keeps exactly one transfer detail modal and one shared form modal
- [x] `/transfers` still opens the edit form when a transfer is tapped and keeps its accessibility hint
- [x] `npx tsc --noEmit`, `npx expo lint` and `npx jest` pass

## Technical Notes
- `DashboardScreen` already owns `transfersState` and `useTransferFormDialog`; add `useTransferDetailDialog(transfersState.transfers)` and render the new detail modal next to the existing form modal.
- TICKET-035 adds the optional `accessibilityHint` to `TransferItem` and a detail label/hint util. Dashboard uses the detail variant; `/transfers` keeps the default.
- Deleting from the detail already updates the transfers collection; call the existing `onWalletsChanged` refresh so the wallet cards and totals follow.
- Do not alter the `TransferFormModal` API or the transfer history screen in this ticket.
- **Out of scope:** opening the detail from `/transfers` (evaluate later), transfer filters and i18n extraction (TICKET-031).

## Dependencies
- TICKET-026 Transfer history
- TICKET-032 Wallet transfer entry point
- TICKET-035 Transfer detail view

## Implemented

Delivered together with TICKET-035, because the dashboard is the transfer detail's first entry point: the view needed a real host to verify the pencil, the trash and the live collection update. No second transfer detail or form exists.

- **Dialogs**: `useDashboardTransferDialogs` composes `useTransferDetailDialog` + `useTransferFormDialog` from the transfers feature and wraps the detail delete so a successful delete refreshes the dashboard `useWallets` instance. The form's own refresh callback is kept for edits.
- **Composition**: `DashboardTransferModals` renders exactly one `TransferDetailModal` and one `TransferFormModal`; `DashboardScreen` passes `transferDialogs.openDetail` as `onPressTransfer`, replacing the previous `transferForm.openEdit`.
- **Edit and delete**: `createDashboardTransferActions` closes the read-only detail before opening the form, and the form keeps `updateTransfer`/`deleteTransfer` from the existing mutations, so saving updates the dashboard row and balances through the same service.
- **Accessibility**: `DashboardTransfersSection` passes `labelKind="detail"` plus the `item.detailHint` copy to `TransferItem`. `/transfers` uses the default edit label and hint, unchanged.
- **Navigation untouched**: **Ver todos** still opens `/transfers` when there are more than three transfers.
- **Tests**: `dashboard-transfer-actions.test.ts` covers the open/close wiring and `dashboard-transfers-accessibility.test.ts` guards the detail hint/label copy.

Verification: `npx tsc --noEmit`, `npx expo lint`, `npx jest --runInBand` (140 suites / 641 tests), `npm run check:copy` and coverage (98.73% statements, 93.5% branches, 98.81% functions, 99.27% lines) pass. Manual device checks are listed in TICKET-035.
