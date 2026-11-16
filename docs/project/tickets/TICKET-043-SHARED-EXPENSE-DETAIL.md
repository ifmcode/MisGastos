# TICKET-043 - Shared Expense Detail Screen

**Type:** Feature / UX  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-006; TICKET-009, TICKET-042, TICKET-044  
**Sprint:** Post-MVP / Phase 5.1

## Description
Give a shared expense a read-only detail screen at `/social/expenses/[expenseId]`, opened from the friend detail. It follows the same visual language as the movement and transfer detail views and keeps edit and soft delete in the top-right corner, so reviewing an expense never starts by opening an editable form.

## Requirements
- [ ] Add the `/social/expenses/[expenseId]` route (`app/social/expenses/[expenseId].tsx`) and open it when a shared-expense row is tapped in the friend detail
- [ ] Build a read-only detail with the movement/transfer detail language: description, total, currency, date, payer, split mode, participants with their shares, creator and created/updated timestamps
- [ ] Show the soft-deleted state safely: a missing or deleted expense renders a "no longer available" state with a way back instead of a broken screen
- [ ] Resolve the selected id from the live expense collection so an edit made on another device, or the form closing after an edit, refreshes the detail without a stale copy
- [ ] Add the pencil action in the top-right: it closes the detail context and opens the existing shared-expense form preloaded with the expense
- [ ] Add the trash action in the top-right with the existing confirmation copy; a successful delete returns to the friend detail and refreshes its list
- [ ] Keep edit and delete disabled while a mutation is in flight and surface the translated mutation error without leaving the detail
- [ ] Reserve a linked-movement block (wallet + movement reference) that TICKET-044 fills in; until then it renders nothing
- [ ] Reuse the shared detail pieces (`DetailSummary`, `DetailField`, the detail header/body/missing layout from `shared/components/organisms`) or extract route-friendly equivalents; do not duplicate the detail layout
- [ ] Switch the friend-detail expense row tap from the edit form to this route; keep the row edit/delete affordances until the route is wired, then let the row only open the detail
- [ ] Keep percentage and shares rendering correct for legacy stored expenses; the create form still offers only **Igual** and **Importe**
- [ ] Add accessibility roles, labels and hints for the back, edit and delete actions and for the detail summary
- [ ] Keep every visible string in the `sharedExpenses`/`social` es/en namespaces and pass `npm run check:copy`
- [ ] Add pure helpers with colocated tests for the detail summary and field mapping (payer label, split-mode label, participant rows, optional wallet block) instead of deriving them inside the component
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] Tapping a shared expense in the friend detail opens `/social/expenses/[expenseId]`
- [ ] The detail shows description, total, currency, date, payer, split mode and every participant share
- [ ] The pencil opens the shared-expense form preloaded with that expense
- [ ] The trash asks for confirmation, soft-deletes the expense and returns to a refreshed friend detail
- [ ] A deleted or unknown expense shows the safe missing state
- [ ] The friend detail reflects edits and deletions made from the detail without a manual reload
- [ ] Only the two participants can reach the detail; a non-participant sees the safe state, not the data
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- **Route naming:** `/social/expenses/[expenseId]` sits under the `social` segment that TICKET-041 adds to `PRIVATE_SEGMENTS`. The id comes from `useLocalSearchParams` and is never used to build a Firestore path; the expense is resolved from the viewer's participant-scoped collection, so the rules remain the only access boundary.
- **Live resolution:** follow `useTransactionDetailDialog`/`useTransferDetailDialog`: the hook stores the id and resolves the record from the current list on every render, so an edit or a deletion started anywhere updates the detail and the missing state appears when the record disappears.
- **Reuse:** `DetailModal` is a modal, not a route. Reuse its `DetailSummary`/`DetailField` types and presentation pieces (or extract the body/header into route-safe components) so movements, transfers and shared expenses keep one visual contract; do not copy the styles.
- **Navigation flow:** the friend detail row opens this route. The pencil opens the existing `SharedExpenseFormModal` from the route (the form is already used from the friend detail), and a successful edit closes the form and leaves the detail visible with fresh data. The trash reuses `getSharedExpenseErrorCode`, `ConfirmDialog` and `deleteExpense`, then `router.back()`.
- **Copy:** the existing `sharedExpenses.row.*` and `sharedExpenses.deleteDialog.*` keys cover most labels; new detail labels (title, split-mode value, participant heading, missing state, linked-movement placeholder) go to the `sharedExpenses` namespace.
- **Sequencing:** TICKET-042 keeps the edit/delete row actions until this route exists. Implement 043 immediately after 042 so the row tap never points at a missing route.
- **Out of scope:** TICKET-044 (wallet selection and linked personal movement), TICKET-046 (settlement), group expenses, changes to the split math, schema, service or Firestore rules.

## Validation Plan
- Open the detail for an equal split, a fixed split and a legacy percentage/shares expense; check every field and the participant shares.
- Edit the amount and the date from the detail, confirm the detail shows the new values and the friend detail refreshes.
- Delete the expense from the detail, confirm the dialog, and verify it disappears from the friend detail and the balances follow.
- Open a deleted id directly and confirm the safe missing state, in light/dark mode and Spanish/English.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-042 Friend detail screen with shared expenses
- TICKET-009 1:1 shared expenses (delivered)
