# [DONE] TICKET-045 - Movements FAB Create Menu

**Type:** UX / Feature  
**Priority:** Medium  
**Status:** ✅ Done (16/11/2026)  
**Related:** TICKET-002, TICKET-009, TICKET-041, TICKET-044, TICKET-046, TICKET-008  
**Sprint:** Post-MVP / Phase 5.1

## Description
Turn the **Movimientos** create action into one entry point: the FAB opens the shared `FabActionMenu` from TICKET-041 with **Nuevo movimiento**, **Gasto con amigo** and **Gasto de grupo**. The header keeps filters and loses its create button, so there are never two creation paths, and every action reuses an existing form instead of adding a second one.

## Requirements
- [x] Reuse `FabActionMenu` from `shared/components/molecules` (created by TICKET-041); do not build a second menu or a one-off overlay
- [x] Add `getMovementsFabActions` as a pure helper in `features/transactions/utils/movements-fab-actions.ts` returning the three actions as `{ key, label, icon, hint?, disabled? }` with already translated copy
- [x] The FAB opens the menu instead of the form directly; menu visibility lives in a small hook (`useTransactionsCreateMenu`) so `transactions-screen.tsx` stays an orchestrator
- [x] **Nuevo movimiento** calls the existing `dialog.openCreate` unchanged, so `TransactionsFormModal`, its validation and its copy stay exactly as today
- [x] **Gasto con amigo** opens the existing `SharedExpenseFormModal` with **no friend preselected**, the friend field visible and required, and no `lockedFriendUid` (same form TICKET-042 mounts, not a copy)
- [x] **Gasto de grupo** renders disabled with a translated **Próximamente** hint and performs no navigation until TICKET-008 lands
- [x] Remove the create button and the `onCreate` prop from `TransactionsHeader`; keep the filters action and its badge, and delete the `transactions.new` / `transactions.add` keys only when nothing else uses them
- [x] Mount the shared-expense editor in the movements screen with the viewer's accepted friends and preferred currency, and refresh `refresh()` (movements) plus `refreshWallets()` after a successful create from any action
- [x] Close the menu on backdrop press, on Android back and immediately after selecting an action; keep the form open while it submits
- [x] Surface create failures in the form that triggered them through the existing `ErrorBanner`, and keep the movement and shared-expense mutation states separate so one never paints the other's error
- [x] Disable **Gasto con amigo** with a translated hint pointing to **Social** when the viewer has no accepted friends, instead of opening an unusable form
- [x] Add the menu title, the three labels, the hints and the accessibility copy to `transactions` (es/en) and reuse the `sharedExpenses` form keys; `npm run check:copy` passes
- [x] Add accessibility roles, labels and hints for the FAB and every menu row, including the disabled state and its **Próximamente** hint
- [x] Style the menu through the shared theme tokens so it works in light and dark mode, and keep every touched file under 150 lines
- [x] Add colocated tests for `getMovementsFabActions` (order, disabled flags, hint wiring) and for the menu wiring (open, close, selection, disabled action does not call `onPress`)
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] The FAB opens a menu with exactly **Nuevo movimiento**, **Gasto con amigo** and **Gasto de grupo**, each with icon and es/en label
- [x] **Gasto de grupo** is disabled, shows the **Próximamente** hint and never navigates
- [x] **Gasto con amigo** opens the shared-expense form with no friend selected and the friend field required
- [x] **Nuevo movimiento** opens the same form and saves exactly as before this ticket
- [x] A successful create from any action closes the menu and the form, and the movement list and wallet balances are refreshed
- [x] The movements header no longer offers a create button, so the FAB is the only create entry
- [x] The menu closes on backdrop press, on back and after a selection
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

### Create menu
- `features/transactions/utils/movements-fab-actions.ts` (new, pure) exposes `getMovementsFabActions`, which returns the three actions in order (**Nuevo movimiento**, **Gasto con amigo**, **Gasto de grupo**) as `{ key, label, icon, hint?, disabled? }` with copy already resolved from the `transactions` namespace. `getMovementsFabMenuActions` binds the handlers and defensively no-ops a disabled action.
- The friend entry is enabled only when `friendsState === "ready"`. The state model is `"ready" | "none" | "loading" | "error"`: `none` (a confirmed empty list) shows the hint pointing to **Social**, while `loading` and `error` keep the neutral action hint so the menu never claims there are no friends from an unconfirmed load. Cached friends win over a failed background refresh.
- The group entry is always disabled with the **Próximamente** hint, and its handler is a no-op.
- `features/transactions/hooks/use-transactions-create-menu.ts` (new) owns the menu visibility (`openMenu`/`closeMenu`), the friends overview, the profile's preferred currency and the shared-expense editor, and memoizes the action array. `transactions-screen.tsx` only renders the menu and the modals.
- `TransactionsFab` now opens the menu (role/label/hint from `transactions.fab.*`) through `FabActionMenu`, the same shared component the Social FAB uses.

### Forms reused, no second flow
- **Nuevo movimiento** calls the unchanged `dialog.openCreate`, so `TransactionsFormModal` and its validation and copy are untouched.
- **Gasto con amigo** mounts the existing `SharedExpenseEditorModal`/`useSharedExpenseEditor` with no `lockedFriendUid` and `preselectFirstFriend: false`, so the friend field is visible, empty and required. The friend detail still passes `lockedFriendUid`, so its locked friend wins over the option.
- `preselectFirstFriend?: boolean` (default `true`) was added to `features/shared-expenses/utils/shared-expense-form-load.ts` and threaded through `use-shared-expense-editor.ts`; the existing locked-friend behaviour is unchanged.

### Header, empty state and refresh
- `TransactionsHeader` lost the create button and the `onCreate` prop; the filters action and its badge stay. The root keys `transactions.new` / `transactions.add` were deleted because nothing else used them.
- The empty-state CTA opens the same menu instead of jumping straight into the form.
- `useTransactionFormDialog` gained `onCreated`, fired only after a successful create; combined with the editor's `onSaved`, both sources call the screen's `refreshAfterCreate`, which runs `transactionsState.refresh()` and `refreshWallets()`.

### State separation and accessibility
- Movement mutation state (`mutating` / `mutationError`) and shared-expense state (`submitting` / `formError`) stay separate, and each form paints its own `ErrorBanner`.
- The FAB and every menu row carry role, label and hint; disabled rows expose `accessibilityState.disabled` and announce their hint. The menu closes on backdrop, on Android back and immediately after a selection (shared `FabActionMenu`), while the form stays open during submit.

### Copy
- `transactions.fab` holds 10 keys in both `es` and `en` (open label/hint, menu title, three labels, four hints); the shared-expense form reuses the existing `sharedExpenses` keys. `npm run check:copy` passes.

### Files (high level)
`features/transactions/utils/movements-fab-actions.ts`, `features/transactions/hooks/use-transactions-create-menu.ts`, `features/transactions/hooks/use-transactions-screen.ts`, `features/transactions/hooks/use-transaction-form-dialog.ts`, `features/transactions/components/{transactions-screen,transactions-header,transactions-fab,transactions-modals}.tsx`, `features/transactions/locales/{es,en}.json`, `features/shared-expenses/utils/shared-expense-form-load.ts`, `features/shared-expenses/hooks/use-shared-expense-editor.ts`.

### Tests
- New `features/transactions/utils/__tests__/movements-fab-actions.test.ts` and `movements-fab-menu-actions.test.ts`: action order, labels/icons, the four friend states, the disabled group action, selection mapping, a disabled action never running its handler and the copy keys existing in both languages.
- New `features/transactions/components/__tests__/transactions-fab.test.ts` as the FAB contract test, plus 3 new shared-expense form tests for `preselectFirstFriend`.
- `movements-fab-actions.ts` is at 100 % in statements, branches, functions and lines.

### Verification (16/11/2026)
- `npx tsc --noEmit` — clean
- `npx expo lint` — clean
- `npx jest` — 208 suites / 1175 tests passed
- `npm run test:coverage` (business-logic gate) — 99.07% statements, 94.84% branches, 99.01% functions, 99.49% lines
- `npm run check:copy` — 220 TSX files

### Known limitations and manual steps
- **Manual emulator validation is still pending** and was not performed in this session (no device available): menu open/close, backdrop and Android back, es/en and light/dark, and screen-reader rows on both forms.
- Menu open/close behaviour is covered by the FAB contract test plus the shared `FabActionMenu` behaviour, because the project has no React renderer.
- **Gasto de grupo** stays disabled until TICKET-008.
- Accepted trade-offs: the Movements tab now also mounts the friends overview and the shared-expense editor's own wallets/categories collections, and the movement create refreshes wallets twice (the mutations hook plus the screen callback), accepted for correctness.
- No Firestore rule, schema, service, repository or money logic changed, so no migration or rules deploy follows from this ticket.
- Decision record: [`2026-11-16-movements-create-menu.md`](../development-notes/session-notes/2026-11-16-movements-create-menu.md).

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
- **Status:** not executed on a device in this session; pending manual validation.

## Dependencies
- TICKET-041 Social tab shell (delivers `FabActionMenu`)
- TICKET-042 Friend detail screen with shared expenses (shared-expense form)
- TICKET-002 Movements MVP (delivered)
- TICKET-044 (optional wallet on the same form) — not a blocker, the form works without it
