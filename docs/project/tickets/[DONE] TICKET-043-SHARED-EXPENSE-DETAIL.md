# [DONE] TICKET-043 - Shared Expense Detail Screen

**Type:** Feature / UX  
**Priority:** High  
**Status:** ✅ Done (16/11/2026)  
**Related:** PM-006; TICKET-009, TICKET-042, TICKET-044  
**Sprint:** Post-MVP / Phase 5.1

## Description
Give a shared expense a read-only detail screen at `/social/expenses/[expenseId]`, opened from the friend detail. It follows the same visual language as the movement and transfer detail views and keeps edit and soft delete in the top-right corner, so reviewing an expense never starts by opening an editable form.

## Requirements
- [x] Add the `/social/expenses/[expenseId]` route (`app/social/expenses/[expenseId].tsx`) and open it when a shared-expense row is tapped in the friend detail
- [x] Build a read-only detail with the movement/transfer detail language: description, total, currency, date, payer, split mode, participants with their shares, creator and created/updated timestamps
- [x] Show the soft-deleted state safely: a missing or deleted expense renders a "no longer available" state with a way back instead of a broken screen
- [x] Resolve the selected id from the live expense collection so an edit made on another device, or the form closing after an edit, refreshes the detail without a stale copy
- [x] Add the pencil action in the top-right: it closes the detail context and opens the existing shared-expense form preloaded with the expense
- [x] Add the trash action in the top-right with the existing confirmation copy; a successful delete returns to the friend detail and refreshes its list
- [x] Keep edit and delete disabled while a mutation is in flight and surface the translated mutation error without leaving the detail
- [x] Reserve a linked-movement block (wallet + movement reference) that TICKET-044 fills in; until then it renders nothing
- [x] Reuse the shared detail pieces (`DetailSummary`, `DetailField`, the detail header/body/missing layout from `shared/components/organisms`) or extract route-friendly equivalents; do not duplicate the detail layout
- [x] Switch the friend-detail expense row tap from the edit form to this route; keep the row edit/delete affordances until the route is wired, then let the row only open the detail
- [x] Keep percentage and shares rendering correct for legacy stored expenses; the create form still offers only **Igual** and **Importe**
- [x] Add accessibility roles, labels and hints for the back, edit and delete actions and for the detail summary
- [x] Keep every visible string in the `sharedExpenses`/`social` es/en namespaces and pass `npm run check:copy`
- [x] Add pure helpers with colocated tests for the detail summary and field mapping (payer label, split-mode label, participant rows, optional wallet block) instead of deriving them inside the component
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] Tapping a shared expense in the friend detail opens `/social/expenses/[expenseId]`
- [x] The detail shows description, total, currency, date, payer, split mode and every participant share
- [x] The pencil opens the shared-expense form preloaded with that expense
- [x] The trash asks for confirmation, soft-deletes the expense and returns to a refreshed friend detail
- [x] A deleted or unknown expense shows the safe missing state
- [x] The friend detail reflects edits and deletions made from the detail without a manual reload
- [x] Only the two participants can reach the detail; a non-participant sees the safe state, not the data
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

### Delivered files by layer
- **Route:** `app/social/expenses/[expenseId].tsx` renders `SharedExpenseDetailScreen` and is registered in `features/auth/components/auth-navigator.tsx` as `social/expenses/[expenseId]` with `headerShown: false`. The id is read with `useLocalSearchParams`, normalized to a single trimmed string and never used to build a Firestore path.
- **Social components:** `features/social/components/shared-expense-detail-screen.tsx` (composition root), `features/social/styles/shared-expense-detail.styles.ts`, and `features/social/hooks/use-shared-expense-detail-screen.ts` (composes `useFriendsOverview`, `useSharedExpenseList`, `useSharedExpenseEditor` and `useSharedExpenseDeletion`, and derives the status).
- **Shared organisms:** new route-safe `shared/components/organisms/detail-view.tsx` (header/body/missing layout, optional error and children slot). `detail-modal.tsx` was refactored to `Modal` + `SafeAreaView` + `DetailView` + `ConfirmDialog` with unchanged behavior; `detail-header.tsx` gained an optional `closeIcon` (`"close"` | `"back"`) and `closeHint`; `detail-body.tsx` gained an optional `children` slot; `detail-summary-card.tsx` now announces the summary with `accessibilityRole="summary"`.
- **Shared hook:** `shared/hooks/use-detail-actions.ts` owns the confirmed delete flow (`requestDelete`, `closeDetail`, `confirm`), which the route and `DetailModal` both use; the detail only leaves after the mutation reports success.
- **Shared expenses:** new `components/shared-expense-participants.tsx`; `SharedExpenseEditorModal` and `use-shared-expense-editor` are reused for the pencil action, and `use-shared-expense-deletion` for the trash. `components/shared-expense-row.tsx` is now a single pressable that opens the route; the old `shared-expense-row-actions.tsx` was deleted.
- **Pure helpers (colocated tests):** `features/shared-expenses/utils/shared-expense-detail.ts` (summary, participant rows, `findSharedExpenseForDetail`), `shared-expense-detail-fields.ts` (field mapping) and `shared-expense-detail.types.ts` (context type), split in three modules to respect the 150-line rule, with `utils/__tests__/shared-expense-detail.test.ts`. Copy builders live in `features/social/utils/shared-expense-detail-copy.ts` with `utils/__tests__/shared-expense-detail-copy.test.ts`.

### Detail content
- Summary card plus fields: description, total, currency, date, payer, split mode and the creator; created/updated timestamps. Participants render with their shares through `SharedExpenseParticipants`, viewer first and then the stored order.
- The linked-movement block (`wallet` + `linkedMovement`) is reserved and empty by default: the field builders return nothing for it until TICKET-044 stores the data.
- Legacy `percentage`/`shares` expenses render through `formatBpsText` and the stored `weight`; the create form still offers **Igual** and **Importe** only.

### Live resolution and missing state
- The id is resolved on every render against the viewer-scoped `useSharedExpenseList` via `findSharedExpenseForDetail`, so an edit from another device or the form closing after a save refreshes the detail, and a deletion falls through to the missing state.
- Status order is ready → loading → error → missing. An unknown, soft-deleted or non-participant id resolves to `null` and shows the safe `DetailMissingState` with a way back; loading and full errors keep `SocialRouteHeader` with a back action.

### Edit and delete
- Pencil: `editor.openEdit(expense)` opens the existing `SharedExpenseEditorModal` preloaded; the detail stays mounted underneath and the friend stays locked because the form locks on `isEditing`. `onSaved` runs `list.refresh()` + `overview.refresh()` so the detail and the friend balances show fresh data.
- Trash: `useDetailActions` opens `ConfirmDialog` with the existing `deleteDialog.title/message` copy (confirm/cancel fall back to the shared common labels). `useSharedExpenseDeletion.deleteExpense` is single-flight, returns a boolean and maps failures with `getSharedExpenseErrorCode`; a failure keeps the detail open and shows the translated banner. On success the route goes back immediately and the friend detail refreshes its list and balances on focus, with no awaited refresh and no missing-state flash.
- Both header actions disable through `disabled={screen.pending}` while the delete is in flight.

### Row behavior and dead code
- The friend-detail expense row is a single pressable that opens the detail; edit/delete moved entirely to the detail header, so reviewing an expense never starts by opening an editable form.
- Removed `shared-expense-row-actions.tsx` and the now-dead `sharedExpenses:deleteDialog.confirm/cancel` keys.

### Copy
- New keys in `sharedExpenses:row.open*` and `sharedExpenses:detail.*` (es/en), reusing `row.edit*`/`row.delete*` for the header and `social:routeBackHint` for the back hint. es/en parity kept and `npm run check:copy` passes.

### Review
- Reviewer verdict: `approve with nits`; no blocker or major. Fixed: the summary announcement no longer repeats the currency, and the post-delete overview refresh was removed. Accepted as documented nits: the detail section-title style duplicates the friend-detail one and the shared back button still has no pressed/disabled styling (pre-existing).

### Verification (16/11/2026, Node 24)
- `npx tsc --noEmit`: pass.
- `npx expo lint`: pass, exit 0 (Node 24; Node 20 fails inside Expo with `parseEnv is not a function`).
- `npx jest`: 198 suites / 1054 tests passed.
- `npm run check:copy`: pass, 213 TSX files.
- `npm run test:coverage`: 99.03 % statements, 94.79 % branches, 99.05 % functions, 99.50 % lines; `shared-expense-detail.ts`, `shared-expense-detail-fields.ts` and `shared-expense-detail-copy.ts` at 100 %.
- **Pending:** manual device validation (light/dark, Spanish/English, screen reader, deleted id, edit flow) was not run because no device was available in this session.
- Development note: [`2026-11-16-shared-expense-detail.md`](../development-notes/session-notes/2026-11-16-shared-expense-detail.md).

## Technical Notes
- **Route naming:** `/social/expenses/[expenseId]` sits under the `social` segment that TICKET-041 adds to `PRIVATE_SEGMENTS`. The id comes from `useLocalSearchParams` and is never used to build a Firestore path; the expense is resolved from the viewer's participant-scoped collection, so the rules remain the only access boundary.
- **Live resolution:** mirrors `useTransactionDetailDialog`/`useTransferDetailDialog`: `useSharedExpenseDetailScreen` keeps the id and re-resolves the record from `useSharedExpenseList` on every render (`findSharedExpenseForDetail`), so an edit or a deletion started anywhere updates the detail and the missing state appears when the record disappears.
- **Reuse:** `DetailModal` is a modal, not a route. Its header/body/missing layout was extracted into the route-safe `DetailView`, which both `DetailModal` and this route consume, so movements, transfers and shared expenses keep one visual contract with no copied styles. The confirmed-delete flow was extracted into `shared/hooks/use-detail-actions.ts`.
- **Navigation flow:** the friend detail row opens this route. The pencil opens the existing `SharedExpenseEditorModal` from the route (the same modal the friend detail uses), and a successful edit refreshes the list and the overview so the detail shows fresh data. The trash reuses `getSharedExpenseErrorCode`, `ConfirmDialog` and `deleteExpense`, then returns to the friend detail. No awaited refresh after the delete: the friend detail refreshes on focus.
- **Copy:** the existing `sharedExpenses.row.edit*`/`row.delete*` keys label the header actions; the delivered labels live in `sharedExpenses.row.open*` and `sharedExpenses.detail.*` (title, split-mode value, participant heading, missing state, creator/timestamps, linked-movement placeholder), with `social:routeBackHint` for the back hint. `sharedExpenses.deleteDialog.confirm/cancel` were removed because the shared common labels are the fallback.
- **Sequencing:** TICKET-042 kept the edit/delete row actions until this route existed; this ticket moved them to the detail header and left the row as a single pressable, so the row tap never pointed at a missing route.
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
