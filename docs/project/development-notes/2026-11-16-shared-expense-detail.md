# Session note - Shared expense detail (TICKET-043)

**Date:** 16/11/2026  
**Ticket:** TICKET-043 (done)  
**Status:** ✅ Done (ticket file renamed with the `[DONE] ` prefix)

## Context
TICKET-042 left the pair expenses with row edit/delete actions only. Reviewing an
expense started by opening an editable form, and there was no read-only surface to
see the split, the participant shares or the timestamps. Movements and transfers
already had a read-only detail; shared expenses did not.

## Decision
- **Route and composition.** `app/social/expenses/[expenseId].tsx` renders
  `SharedExpenseDetailScreen` from `features/social`, under the private `social`
  segment, with `headerShown: false`. The screen owns navigation and the modals;
  `use-shared-expense-detail-screen.ts` is the composition root that loads the
  expense and derives the status, the fields context and the mutation state.
- **Mapping stays pure.** `features/shared-expenses/utils/shared-expense-detail.ts`,
  `shared-expense-detail-fields.ts` and `shared-expense-detail.types.ts` turn an
  expense plus the viewer into the header/summary/field model; the copy builders
  live in `features/social/utils/shared-expense-detail-copy.ts`. No JSX in the
  mapping, no money rules in `features/social`.
- **The id only selects.** `findSharedExpenseForDetail` looks the expense up in
  `useSharedExpenseList`, the viewer-scoped loader that already refreshes on focus.
  The id never builds a Firestore path, so `sharedExpenses` rules remain the access
  boundary: an unknown, deleted or non-participant id renders `DetailMissingState`
  instead of an error or a leak.
- **Detail extraction.** The route needed the same layout as the read-only modals,
  so `shared/components/organisms/detail-view.tsx` gained a route-safe
  `DetailView`: header, body, summary card, fields and missing state plus an
  optional `children` slot. The confirmation and success-only close moved to
  `shared/hooks/use-detail-actions.ts`. `DetailModal` now composes both with
  unchanged behavior; `DetailHeader` gained `closeIcon`/`closeHint` so a route can
  pass a back action, and `DetailSummaryCard` announces the summary (label +
  amount) with the meta excluded from the label to avoid repeating the currency.
- **Edit and delete.** `SharedExpenseEditorModal` is reused by the friend detail and
  by the route. The detail stays mounted while the form is open, the friend stays
  locked through `isEditing`, and `onSaved` refreshes the list and the overview.
  Delete is single-flight in `useSharedExpenseDeletion.deleteExpense`, maps failures
  with `getSharedExpenseErrorCode` and keeps the detail with a translated banner on
  error; on success it goes back immediately, because the friend detail refreshes on
  focus.
- **Row.** The friend-detail row is now a single pressable that opens the route;
  `shared-expense-row-actions.tsx` and the `sharedExpenses:deleteDialog.confirm/cancel`
  keys were removed.
- **Linked block reserved.** `buildSharedExpenseLinkedMovementFields` and the
  `detail.wallet`/`detail.linkedMovement` copy exist for TICKET-044; the block
  renders nothing today.
- **Participant order and legacy modes.** The viewer is listed first, then the stored
  order. `formatBpsText` and the stored `weight` keep legacy percentage/shares
  expenses correct; the create form still offers **Igual** and **Importe** only.

## Alternatives rejected
- **Keeping edit/delete on the row:** the row now opens the detail, and two actions
  in one 48 px row are worse for accessibility and touch targets.
- **Rendering a `DetailModal` over the route:** a modal inside a pushed screen stacks
  two overlays, breaks the hardware back order and cannot host its own header/route
  semantics.
- **Duplicating the detail layout for the route:** a second scaffold would drift from
  the movement/transfer one.
- **A second per-expense query and index:** the viewer-scoped list is already loaded
  and refreshed; a query would add an index and a second loader for one lookup.
- **Awaiting a list refresh before `router.back()`:** it delays the back gesture and
  duplicates the focus refresh the friend detail already does.

## Consequences
- **Focus-based refresh for the friend detail.** A delete or edit travels back and the
  friend detail reloads on focus; there is no optimistic row state.
- **No missing-state flash.** Resolution reads the already-loaded list, so a known
  expense renders on the first frame and only a genuinely absent id shows
  `DetailMissingState`.
- **One layout for movements, transfers and shared expenses.** Any future fix to the
  detail scaffold lands once in `shared/components/organisms/detail-view.tsx`.
- **No data leak on the missing state.** It shows generic copy with a back action; it
  never renders a partial expense for a non-participant.

## Accessibility and copy
- Back action reuses `common:accessibility.back` plus the route hint; the pencil and
  trash keep their existing shared-expense labels and hints, and the participant rows
  announce name, share and legacy weight text.
- `DetailHeader` gained `closeIcon`/`closeHint`; `DetailSummaryCard` announces label
  and amount, with meta excluded so the currency is not read twice.
- New keys live in `sharedExpenses:row.open*` and `sharedExpenses:detail.*`; the
  header reuses `sharedExpenses:row.edit*`/`row.delete*` and `social:routeBackHint`,
  with es/en parity.

## Verification
`npx tsc --noEmit` pass, `npx expo lint` pass (Node 24), `npx jest` 198 suites /
1054 tests, `npm run check:copy` 213 TSX files and `npm run test:coverage` 99.03 %
statements / 94.79 % branches / 99.05 % functions / 99.50 % lines. Reviewer verdict:
`approve with nits`, no blocker or major finding.

## Open items
- **Manual device validation is pending:** light/dark, es/en, screen-reader labels and
  the edit/delete round trip were not exercised in this session (no device).
- The `sharedExpenses` rules are still **undeployed** (since TICKET-009).
- TICKET-044 fills the reserved linked-movement block with the wallet and the linked
  personal movement.
- TICKET-046 adds the settlement action that will consume the same balances.
