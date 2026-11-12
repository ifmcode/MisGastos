# [DONE] TICKET-032 - Move the Transfer Action to the Wallets Tab

**Type:** Improvement / UX  
**Priority:** Medium  
**Status:** ✅ Done (12/11/2026)  
**Related:** PM-032; TICKET-003, TICKET-026, TICKET-029, TICKET-031  
**Sprint:** Post-MVP / Phase 3.4  

## Description
The only entry point to create a transfer is the **Transferir** button in the dashboard header. Transfers move money between wallets and belong with the wallet balances, so the create action should live in the **Carteras** tab, next to the existing transfer history link.

The dashboard keeps its recent-transfers section and must still open the edit form when a recent transfer is tapped. This ticket only moves the **create** entry point.

## Requirements
- [x] Remove the **Transferir** button from the dashboard header, including its props and unused styles
- [x] Add a **Transferir** action in the **Carteras** tab that opens the create-transfer form
- [x] Reuse `TransferFormModal` and `useTransferFormDialog`; do not duplicate form, validation or service logic
- [x] Show the action only when `canTransferBetweenWallets` is true for the active wallets
- [x] Keep the existing **Nueva** wallet header action and add-wallet FAB unchanged
- [x] Keep the **Historial de transferencias** link; the new action can share a quick-actions row with it
- [x] Refresh wallets and totals after a transfer is created from the wallets tab
- [x] Keep editing transfers from the dashboard recent list and `/transfers` working exactly as today
- [x] Update the dashboard empty-transfers copy that currently points to the dashboard button
- [x] Cover the new entry point with accessibility labels and verify dark mode and web
- [x] Update or add tests for the moved entry point and the dashboard header

## Acceptance Criteria
- [x] The dashboard header no longer shows a **Transferir** button
- [x] The **Carteras** tab shows **Transferir** and opens the same transfer form used by the rest of the app
- [x] With fewer than two active wallets sharing a currency, the entry point is hidden or explains the requirement, matching the current dashboard rule
- [x] Creating a transfer from **Carteras** updates balances and the wallet list immediately, without a manual refresh
- [x] Editing a recent transfer from the dashboard still opens the edit form
- [x] The `/transfers` history keeps working and keeps its own edit flow
- [x] No duplicate transfer creation paths, dead props or unused header styles remain
- [x] `npx tsc --noEmit`, `npx expo lint` and `npx jest` pass

## Technical Notes
- **Current wiring:** `DashboardHeader` receives `showTransferButton` and `onTransferPress`. `DashboardScreen` builds one `useTransferFormDialog` for both create (`openCreate`) and edit (`openEdit` on recent transfers), and `overview.canTransfer` is `canTransferBetweenWallets(activeWallets)` from `features/transfers/utils/transfer-wallets.ts`.
- **Proposed wiring:** `WalletsScreen` already owns `useWalletScreen` and renders `WalletsTransferHistoryLink`. Add `useTransfers()` plus `useTransferFormDialog` there, or a focused `useWalletsTransferAction` hook that bundles both, with `onWalletsChanged: () => void wallets.reload()` and a `<TransferFormModal editingTransfer={null} … />` for creation.
- **Dashboard stays edit-capable:** keep `useTransferFormDialog` for `onPressTransfer={transferForm.openEdit}`. Remove only the create button and its header props; do not delete the modal from the dashboard.
- **Shared eligibility rule:** reuse `canTransferBetweenWallets` in the wallets tab so the visibility rule cannot drift. If the dashboard no longer needs it for the header, it is still used by the empty-transfers copy.
- **Placement:** recommend a compact quick-actions row above the wallet list with **Transferir** (primary) and **Historial de transferencias** (secondary), replacing or merging the current standalone history link. Avoid a second FAB: the existing FAB belongs to **Nueva cartera**, and two FABs on one screen would compete. A header button next to **Nueva** is the fallback option but crowds narrow screens.
- **File size:** `WalletsScreen` is already around 120 lines. Extract a `WalletsQuickActions` component and keep the transfer wiring in a hook so every file stays under the 150-line soft limit and one component per file.
- **Refresh:** the transfer service already updates both wallet balances atomically; the wallets screen only needs to reload its wallet list so the cards and totals reflect the transfer. No transaction/category refresh is required.
- **Copy:** the dashboard empty state currently says "Usa el botón Transferir…" and must point to **Carteras → Transferir**. If TICKET-031 has landed, use its translation keys; otherwise update the Spanish copy and let the i18n epic extract it.
- **Out of scope:** editing transfers from the wallets tab, redesigning the wallet list, moving the `/transfers` route, and changing transfer rules (same currency only).

## Open Questions (resolved)
- **Placement:** quick-actions row above the wallet list (the recommended option). No second FAB.
- **Fewer than two compatible wallets:** the action is hidden, matching the previous dashboard rule and the "show only when `canTransferBetweenWallets` is true" requirement.
- **Hierarchy:** **Transferir** is the filled primary action and **Historial de transferencias** the outlined secondary one.
- **Dashboard replacement:** no extra shortcut; the recent-transfers section and the empty-state copy point to **Carteras**.

## Implemented (12/11/2026)
- **Dashboard header:** `DashboardHeader` now only receives `greeting`; the **Transferir** button, its props and the `headerButton`/`headerButtonText` styles are gone. `DashboardScreen` still builds `useTransferFormDialog` for `openEdit` on recent transfers.
- **Carteras entry point:** `WalletsTransferActions` renders `WalletsQuickActions` above the wallet list and mounts the shared `TransferFormModal`. `useWalletsTransferAction` bundles `useTransfers()` + `useTransferFormDialog` with `onWalletsChanged: () => void wallets.refresh()`, so balances, totals and the list update without a manual refresh and without replacing the screen with the loading state.
- **Eligibility rule:** `WalletsTransferActions` calls `canTransferBetweenWallets(activeWallets)`; when false only **Historial de transferencias** is rendered. `getWalletsQuickActions` owns the visible actions, labels and accessibility labels.
- **History:** `WalletsTransferHistoryLink` was replaced by the secondary button of the shared quick-actions row; it still routes to `/transfers`.
- **Copy:** `getTransfersEmptyMessage` now points to **Carteras → Transferir** and keeps the "two wallets with the same currency" explanation.
- **Tests:** added `wallets-quick-actions.test.ts` (visibility, order and labels), `dashboard-transfers-copy.test.ts` and a compile-time `dashboard-header.test.ts` contract that fails if the removed transfer props return.
- **Verification:** `npx tsc --noEmit`, `npx expo lint` and `npx jest` (424 tests) pass; the web bundle builds with `npx expo export --platform web`. The secondary button uses `useFormTheme` border/surface/text tokens and the primary one the brand token already validated in dark mode, so no hardcoded surface or text colors were added.

## Dependencies
- TICKET-003 Transfers and dashboard
- TICKET-026 Transfer history
- TICKET-029 Compact wallet selector
- TICKET-031 Internationalization (copy ownership for the updated strings)
