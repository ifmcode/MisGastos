# TICKET-045 - Movements FAB Create Menu

**Type:** UX / Feature  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** TICKET-002, TICKET-009, TICKET-041, TICKET-044, TICKET-046, TICKET-008  
**Sprint:** Post-MVP / Phase 5.1

## Description
Turn the **Movimientos** create action into one entry point: the FAB opens the shared `FabActionMenu` from TICKET-041 with **Nuevo movimiento**, **Gasto con amigo** and **Gasto de grupo**. The header keeps filters and loses its create button, so there are never two creation paths, and every action reuses an existing form instead of adding a second one.

## Requirements
- [ ] Reuse `FabActionMenu` from `shared/components/molecules` (created by TICKET-041); do not build a second menu or a one-off overlay
- [ ] Add `getMovementsFabActions` as a pure helper in `features/transactions/utils/movements-fab-actions.ts` returning the three actions as `{ key, label, icon, hint?, disabled? }` with already translated copy
- [ ] The FAB opens the menu instead of the form directly; menu visibility lives in a small hook (`useTransactionsCreateMenu`) so `transactions-screen.tsx` stays an orchestrator
- [ ] **Nuevo movimiento** calls the existing `dialog.openCreate` unchanged, so `TransactionsFormModal`, its validation and its copy stay exactly as today
- [ ] **Gasto con amigo** opens the existing `SharedExpenseFormModal` with **no friend preselected**, the friend field visible and required, and no `lockedFriendUid` (same form TICKET-042 mounts, not a copy)
- [ ] **Gasto de grupo** renders disabled with a translated **Próximamente** hint and performs no navigation until TICKET-008 lands
- [ ] Remove the create button and the `onCreate` prop from `TransactionsHeader`; keep the filters action and its badge, and delete the `transactions.new` / `transactions.add` keys only when nothing else uses them
- [ ] Mount the shared-expense editor in the movements screen with the viewer's accepted friends and preferred currency, and refresh `refresh()` (movements) plus `refreshWallets()` after a successful create from any action
- [ ] Close the menu on backdrop press, on Android back and immediately after selecting an action; keep the form open while it submits
- [ ] Surface create failures in the form that triggered them through the existing `ErrorBanner`, and keep the movement and shared-expense mutation states separate so one never paints the other's error
- [ ] Disable **Gasto con amigo** with a translated hint pointing to **Social** when the viewer has no accepted friends, instead of opening an unusable form
- [ ] Add the menu title, the three labels, the hints and the accessibility copy to `transactions` (es/en) and reuse the `sharedExpenses` form keys; `npm run check:copy` passes
- [ ] Add accessibility roles, labels and hints for the FAB and every menu row, including the disabled state and its **Próximamente** hint
- [ ] Style the menu through the shared theme tokens so it works in light and dark mode, and keep every touched file under 150 lines
- [ ] Add colocated tests for `getMovementsFabActions` (order, disabled flags, hint wiring) and for the menu wiring (open, close, selection, disabled action does not call `onPress`)
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] The FAB opens a menu with exactly **Nuevo movimiento**, **Gasto con amigo** and **Gasto de grupo**, each with icon and es/en label
- [ ] **Gasto de grupo** is disabled, shows the **Próximamente** hint and never navigates
- [ ] **Gasto con amigo** opens the shared-expense form with no friend selected and the friend field required
- [ ] **Nuevo movimiento** opens the same form and saves exactly as before this ticket
- [ ] A successful create from any action closes the menu and the form, and the movement list and wallet balances are refreshed
- [ ] The movements header no longer offers a create button, so the FAB is the only create entry
- [ ] The menu closes on backdrop press, on back and after a selection
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- **`FabActionMenu` API (from 041):** `visible`, a translated `title`, `onClose` and `actions[{ key, label, icon, hint?, disabled?, onPress }]`. It renders a transparent `Modal` with a backdrop that closes on press/back and one pressable row per action, so this ticket only builds the array and the handlers.
- **Why one config helper:** `getMovementsFabActions` keeps the three actions, their order, their icons and the group-disabled decision testable without React. TICKET-008 flips `disabled` there and points the action at the group form; the screen does not change.
- **No duplicated form:** TICKET-042 already adds `useSharedExpenseEditor` + `SharedExpenseFormModal` to the friend detail, and TICKET-044 extends the same form with the wallet block. This screen composes that hook with `useFriendsOverview` and the profile currency; a movements-specific form would drift from both.
- **Separate mutation state:** `useTransactions` exposes `mutating`/`mutationError` for personal movements, while the shared-expense editor owns `submitting`/`formError`. Both modals must read their own source, otherwise a failed shared expense would show its error inside the movement form.
- **Refresh:** `refresh()` reloads movements and `refreshWallets()` reloads balances, mirroring the focus refresh already in `TransactionsScreen`. A linked movement created by TICKET-044 must appear without a manual pull-to-refresh.
- **Placement:** the menu is the create entry for the movements tab only; the Social FAB keeps its own `FabActionMenu` instance with the friend actions, and the wallet tab keeps its transfer quick actions.
- **Detail link:** the expense created here is listed in the friend detail (TICKET-042) and, when TICKET-044 adds a linked movement, its **Compartido** badge opens the read-only detail from TICKET-043. This ticket adds no route.
- **Out of scope:** groups (TICKET-008), settlement actions (TICKET-046), a redesigned FAB, offline, and any change to the transaction or shared-expense schema, service or rules.

## Validation Plan
- Open the menu from the FAB, close it with the backdrop and with Android back, and check that the header shows only filters.
- Create a movement, a friend expense with a chosen friend and a friend expense cancelled midway; confirm list, balances and error copy.
- Confirm the group action is announced as disabled with its hint and does nothing when pressed.
- Log in with an account without friends and confirm the friend action is disabled with its hint.
- Check light/dark mode and Spanish/English, including screen-reader labels on every menu row.

## Dependencies
- TICKET-041 Social tab shell (delivers `FabActionMenu`)
- TICKET-042 Friend detail screen with shared expenses (shared-expense form)
- TICKET-002 Movements MVP (delivered)
- TICKET-044 (optional wallet on the same form) — not a blocker, the form works without it
