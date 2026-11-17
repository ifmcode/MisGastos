# Session note - Movements FAB create menu (TICKET-045)

**Date:** 16/11/2026  
**Ticket:** TICKET-045 (done)  
**Status:** ✅ Done (ticket file renamed with the `[DONE] ` prefix)

## Context
**Movimientos** had two ways of starting an expense: the FAB opened the personal
movement form directly and the header offered its own create button, while shared
expenses could only be created from the friend detail (TICKET-042) with the friend
already locked. That left the movements tab without a natural entry point for a
shared expense, the header duplicated the create action, and the shared
`FabActionMenu` delivered by TICKET-041 was only used by the Social FAB.

## Decision
- **One create entry, three actions.** The movements FAB opens the shared
  `FabActionMenu` with exactly **Nuevo movimiento**, **Gasto con amigo** and
  **Gasto de grupo**, in that order. `TransactionsHeader` loses its create button and
  the `onCreate` prop, keeping only the filters action and badge, so the FAB is the only
  way to create from this tab. The empty-state CTA opens the same menu instead of
  jumping into the form.
- **Pure helper + hook, no React in the decision.** `getMovementsFabActions`
  (`features/transactions/utils/movements-fab-actions.ts`) returns the three actions
  with resolved copy and `getMovementsFabMenuActions` binds the handlers, no-oping a
  disabled action defensively. `useTransactionsCreateMenu`
  (`features/transactions/hooks/use-transactions-create-menu.ts`) owns the menu
  visibility, the friends overview, the profile's preferred currency and the
  shared-expense editor, and memoizes the action array so
  `transactions-screen.tsx` stays an orchestrator.
- **Friend gating as explicit states.** `friendsState` is
  `"ready" | "none" | "loading" | "error"`; the action is enabled only in `"ready"`.
  A confirmed empty list (`"none"`) shows the hint pointing to **Social**, while
  `"loading"` and `"error"` keep the neutral action hint: a failed overview must never
  claim the viewer has no friends, and the form must never open unusable. Cached
  friends win over a failed background refresh. The group action is always disabled
  with the **Próximamente** hint and its handler is a no-op.
- **The forms are reused, not reimplemented.** **Nuevo movimiento** calls the
  unchanged `dialog.openCreate`, so `TransactionsFormModal` and its validation and
  copy are untouched. **Gasto con amigo** mounts the existing
  `SharedExpenseEditorModal`/`useSharedExpenseEditor` with no `lockedFriendUid`, so
  the friend field is visible, empty and required; the friend detail keeps its
  preselected locked friend.
- **`preselectFirstFriend` with a `true` default.** `getSharedExpenseInitialValues`
  fell back to the first friend whenever a create flow passed no `lockedFriendUid`.
  Rather than remove that behaviour for every caller, `shared-expense-form-load.ts`
  gained `preselectFirstFriend?: boolean` (default `true`), threaded through
  `use-shared-expense-editor.ts`; the movements menu passes `false`. The friend detail
  still passes `lockedFriendUid`, so its locked friend wins over the option and the
  two callers differ by one prop.
- **Refresh after any create.** `useTransactionFormDialog` gained `onCreated`, fired
  only after a successful create; together with the editor's `onSaved`, both sources
  run the screen's `refreshAfterCreate`, which calls `transactionsState.refresh()` and
  `refreshWallets()`. A linked movement created from the movements tab appears without
  a pull-to-refresh. The menu closes immediately after a selection and the form stays
  open while it submits.
- **Separate mutation state.** Movement state (`mutating` / `mutationError`) and
  shared-expense state (`submitting` / `formError`) stay separate and each form paints
  its own `ErrorBanner`, so a failed shared expense never shows its error inside the
  movement form.
- **Accessibility in the rows.** The FAB carries role, label and hint from
  `transactions.fab.*`; every menu row carries role, label and hint, disabled rows
  expose `accessibilityState.disabled` and announce their hint, the shared
  `FabActionMenu` closes on backdrop/Android back, and the disabled group row explains
  why it does nothing.
- **Copy stays in one namespace.** `transactions.fab` holds 10 keys in both `es` and
  `en`; the shared-expense form reuses the existing `sharedExpenses` keys. The root
  `transactions.new` / `transactions.add` keys were deleted because nothing else used
  them.

## Alternatives rejected
- **A movements-specific create form and a movements-specific overlay:** both would
  drift from the personal form and from the social form the friend detail already
  mounts, and `FabActionMenu` already existed with the exact API needed.
- **Keeping the header create button next to the FAB:** two creation paths for the
  same records, and the acceptance criterion asks for a single entry point.
- **Opening the friend form with the first friend preselected (the friend-detail
  behaviour):** in the movements tab the user has not chosen a friend yet, so a
  preselected value would silently attribute the expense.
- **Two extra locale keys for the loading/error hints:** adding them pushed
  `transactions.fab` to 12 keys and triggered **TS2589** ("type instantiation is
  excessively deep") in the typed `t` adapter, so the existing neutral hint is reused
  for `"loading"` and `"error"` instead of splitting it.
- **Treating `loading`/`error` as "no friends":** it would tell the user something
  false and hide the only path to creating the expense.

## Consequences
- **One entry point per surface.** The movements tab has a single create action; the
  Social FAB keeps its own `FabActionMenu` instance with **Añadir amigo**, and the
  **Carteras** tab keeps its transfer quick actions.
- **Accepted trade-off: extra collections.** The movements tab now also mounts the
  friends overview and the shared-expense editor's own wallets/categories
  collections, so the tab reads social data it did not read before.
- **Accepted trade-off: double wallet refresh.** Creating a movement refreshes wallets
  twice (the existing mutations hook plus the screen callback). It is accepted for
  correctness: one path serves both the personal and the shared-expense create.
- **Test surface without a renderer.** The project has no React renderer, so menu
  open/close is covered by the FAB contract test plus the shared `FabActionMenu`
  behaviour; the action list, the four friend states, the disabled group action and
  the selection mapping are covered by pure tests, and `movements-fab-actions.ts`
  reaches 100 % in all four metrics.

## Verification (16/11/2026)
- `npx tsc --noEmit` — clean
- `npx expo lint` — clean
- `npx jest` — 208 suites / 1175 tests passed
- `npm run test:coverage` business-logic gate — 99.07 % statements, 94.84 % branches,
  99.01 % functions, 99.49 % lines
- `npm run check:copy` — 220 TSX files

No Firestore rule, schema, service, repository or money logic changed, so this ticket
needs no migration and no rules deploy.

## Known limitations
- **Manual emulator validation is still pending** and was not performed in this
  session: menu open/close, backdrop and Android back, es/en and light/dark, and the
  screen-reader rows on both forms.
- **Gasto de grupo** stays disabled with the **Próximamente** hint until TICKET-008.
- The friend action depends on the friends overview; a slow or failing overview keeps
  the action disabled with the neutral hint rather than opening a form that could not
  save.

## Open questions
- **TICKET-008** flips `disabled` in `getMovementsFabActions` and points the group
  action at the group form; the screen, the hook and the shared menu stay as they are.
- **TICKET-046** settlement actions are not part of this menu; if they are added here
  later, they should reuse the same helper so the order stays testable.
- **TICKET-040 Storybook** would let the menu be reviewed visually without a device,
  which is the current gap for the manual pass.
