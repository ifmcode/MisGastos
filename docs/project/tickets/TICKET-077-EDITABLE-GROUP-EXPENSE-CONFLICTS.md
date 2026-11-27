# TICKET-077 - Editable group-expense conflicts from the sync center

**Type:** Feature / Offline & Social  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** TICKET-023, TICKET-073  
**Sprint:** Post-V1

## Description
When a queued group expense cannot be uploaded, typically because a participant or the payer is no longer a group member (or the viewer lost membership), the sync center only shows the generic `INVALID` conflict and only allows discarding the local change. The feature makes the conflict explain the precise cause, name the former member(s) when membership is the cause, and let the user edit the expense. Saving resolves the conflict, requeues the mutation, and once synced the corrected expense appears for every member.

## Requirements
### Conflict data
- [ ] Persist the precise `errorCode` in the conflict record (new `conflicts` column via an append-only migration, or read it from the outbox when building the view) so the UI can distinguish `EXPENSE_HAS_FORMER_MEMBERS`, `PAYER_NOT_MEMBER`, `NOT_GROUP_MEMBER` and other `INVALID` causes
- [ ] For membership causes, expose the offending user ids: derive them from the conflict `localSnapshot` (participants and payer) against the cached group `memberIds`; no server payload change is required
- [ ] Keep the server authoritative: the UI diagnosis is advisory and the Firestore rules still decide

### Conflict UI
- [ ] Show a translated, specific reason in the conflict dialog instead of the generic `INVALID` copy; resolve names from `publicProfiles` and fall back to the uid when the former member no longer has a readable profile
- [ ] Distinguish "another member left" (editable) from "you left the group" (`NOT_GROUP_MEMBER`, discard only)
- [ ] Add a primary **Editar gasto** action for editable group-expense conflicts; keep the existing keep-remote/discard path
- [ ] Entry point: the sync badge opens `/sync` and the conflict row opens the dialog (already exists; no redesign needed)

### Edit and requeue
- [ ] Open the group expense form prefilled from `localSnapshot`, excluding former members from the participant picker and forcing a new payer when the payer left
- [ ] Allow editing an expense that `canEditGroupExpense` rejects today because of former members, only through this conflict flow
- [ ] On save, in one local transaction: update the local row, replace the outbox `localSnapshot`, close the conflict, set the record `syncStatus` and the outbox back to `pending`, and trigger sync
- [ ] A conflicted `create` requeues as `create` with the same entity id; a conflicted `update` keeps its operation and `baseRevision` from the latest remote revision
- [ ] If the expense has a linked wallet movement, update or revert it as part of the edit and produce the correct server payload
- [ ] Once synced, the pull makes the corrected expense visible to every member; the activity event is written exactly once by the server transaction

## Acceptance Criteria
- [ ] A group expense blocked by a former member shows the reason and names the former member(s)
- [ ] Editing and saving resolves the conflict and the mutation uploads without manual retry
- [ ] The corrected expense appears for every member after their next pull and balances match
- [ ] `NOT_GROUP_MEMBER` (viewer removed) offers no edit, only discard
- [ ] No duplicate expense or activity event after retries (idempotency marker respected)
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` are clean

## Technical Notes
- **Anchors:**
  - `features/sync/utils/sync-conflict-view.ts` — builds the view; today it only maps `kind`, not the precise error code.
  - `features/sync/components/sync-conflict-dialog.tsx` and `features/sync/components/sync-conflict-actions.tsx` — the dialog and its actions.
  - `shared/services/sync/sync.conflict-policy.ts` — `getConflictResolutionOptions` (INVALID currently only allows keep-remote) and `planConflictResolution` (needs an edit/requeue path).
  - `features/sync/services/local-conflict-resolver.ts` — applies a resolution atomically; uses `outbox.rebase`.
  - `shared/lib/local-db/local-conflict.repository.ts` and `shared/lib/local-db/local-db.types.ts` — conflict shape and repository.
  - `shared/lib/local-db/migrations/` — append-only migrations; a new version would add the column.
  - `shared/services/sync/sync.errors.ts` — `DOMAIN_CONFLICTS` maps the group codes to `INVALID`.
  - `features/group-expenses/services/group-expense-guards.ts` — raises `EXPENSE_HAS_FORMER_MEMBERS`, `PAYER_NOT_MEMBER`, `NOT_GROUP_MEMBER`.
  - `features/group-expenses/utils/group-expense-permissions.ts` — `canEditGroupExpense` currently makes a former-member expense read-only.
  - `features/group-expenses/repositories/group-expense-update-link.operation.ts` and `features/sync/services/firestore-group-expense-mutations.ts` — server update/create and linked movement.
  - `shared/lib/local-db/outbox-state.ts` — `OUTBOX_CONFLICT_UNRESOLVED` blocks writes while the mutation is in conflict.
- **Scope:** the in-app sync center is in scope. The OS push notification payload belongs to TICKET-052 and is out of scope.
- **Constraint:** automatic membership re-add is out of scope.
- **Constraint:** if the viewer (`createdBy`) was removed, the only option is to discard; editing cannot fix it.
- **Constraint:** names may be unavailable for a user who is no longer a friend; show the uid.
- **Constraint:** the linked wallet movement must be handled atomically with the edit.

## Validation Plan
- Two accounts: A creates a group expense offline with B and C; C leaves the group; A reconnects; the conflict names C and the reason; A edits the expense removing C; the save uploads without manual retry; B sees it on the next pull with matching balances.
- Viewer-removed case: only discard is offered.
- Linked wallet movement: editing updates or reverts the movement correctly.
- Retry the sync twice: no duplicate expense or activity event.
- Light/dark mode and both locales.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-023 offline-first queue, conflicts and idempotency (the conflict record, the outbox and the resolution policy this ticket extends)
- TICKET-073 group activity in the detail (the activity-event expectations the corrected expense must satisfy)
