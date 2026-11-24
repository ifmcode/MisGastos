# [DONE] TICKET-011 - Group History

**Type:** Feature  
**Priority:** Medium  
**Status:** ✅ Done (23/11/2026)  
**Related:** PM-009; TICKET-009, TICKET-010, TICKET-068  
**Sprint:** Post-MVP / Phase 6  

**Scope decisions (23/11/2026):**
- The feed lives in the member-only subcollection `groups/{groupId}/activity/{activityId}`.
- It is shown on its own route `/social/groups/[groupId]/history`, opened from **Detalles del grupo**.
- It records only activity from this ticket onwards; existing expenses and settlements are not backfilled.
- It paginates with **Cargar más** (cursor by `createdAt` + id).
- It is implemented together with TICKET-068 in the same session.

## Description
Provide an activity feed per group so members can review shared expenses, settlements and relevant changes in chronological order.

## Requirements
- [x] Show a chronological activity feed for each group
- [x] Include expense creation, expense edits, expense deletions and settlements
- [x] Include member joined, member left, member removed, ownership transfer, group metadata edits and the **Simplificar deudas** setting change
- [x] Include the settlements recorded by TICKET-010 (the records already exist; this ticket adds their feed entries)
- [x] Include actor, date, amount and a short description for each entry; membership changes identify the affected member
- [x] Show the current user's involvement where relevant
- [x] Support loading, empty and error states
- [x] Keep the feed consistent after an edit or soft delete
- [x] Only group members can read the feed; a member who leaves loses access
- [x] Add tests for activity mapping and ordering

## Acceptance Criteria
- [x] New group activity appears without a manual refresh on the group screen
- [x] Edited and deleted expenses are represented accurately
- [x] Settlements appear in the feed with the correct members
- [x] Member join, leave, removal and ownership transfer appear with the actor and the affected member
- [x] Group metadata and **Simplificar deudas** changes appear accurately
- [x] Only group members can read the history
- [x] The feed remains ordered when entries share the same timestamp

## Implemented

### Activity model
- Member-only subcollection `groups/{groupId}/activity/{activityId}`. It is
  append-only: there is no root collection, no collection-group query, and
  updates and deletes are denied by the rules.
- Twelve event types: `expense-created`, `expense-updated`, `expense-deleted`,
  `settlement-created`, `settlement-updated`, `settlement-deleted`,
  `member-joined`, `member-left`, `member-removed`, `owner-transferred`,
  `group-updated` and `simplify-debts-changed`
  (`features/groups/types/group-activity.types.ts`).
- Structured payload only, never a sentence: `type`, `groupId`, `actorId`,
  `targetUserId`, `targetName` (display-name snapshot written **only** for
  removals and leaves, because the member leaves `memberIds`), `expenseId`,
  `settlementId`, `fromUserId`/`toUserId` for settlements (debtor pays
  creditor), `amountCents`, `currency`, `description`, `changedFields`,
  `simplifyDebts`, `previousOwnerId`, `newOwnerId` and `createdAt`. The copy is
  resolved in the UI from the type and the payload
  (`features/groups/utils/group-activity-copy.ts`,
  `group-activity-display.ts`).

### Atomic writes
- Every event is written in the same `runTransaction` or `writeBatch` as the
  record it describes, so the feed cannot drift from the ledger: expense
  create/update/delete, settlement create/update/delete, group settings edit,
  membership join/leave/removal and ownership transfer.
- Deletes are idempotent: a repeated soft delete does not emit a second event.
- No event is emitted for rejected or cancelled invitations, for the join-code
  lazy backfill, or for group creation.

### Pagination
- Cursor pagination with `createdAt desc` plus the document id as the
  tiebreaker, ordered by `createdAt` and id, `startAfter(createdAt, id)`, page
  size 20 clamped to 50 in the service (`GROUP_ACTIVITY_PAGE_SIZE` /
  `GROUP_ACTIVITY_MAX_PAGE_SIZE`, `clampGroupActivityLimit`).
- `nextCursor` is taken from the last **raw** row of the page, not from the last
  mapped event, so a malformed row dropped by the mapper can never stall the
  **Cargar más** button. There is no composite index.

### UI
- New route `/social/groups/[groupId]/history`
  (`app/social/groups/[groupId]/history.tsx` → `GroupHistoryScreen`), opened
  from the **Ver historial** action in **Detalles del grupo**.
- The shared `TimelineRow` gained an optional press: expense and settlement rows
  open their detail, membership and settings rows are not pressable.
- Rows show the date gutter, the actor, the affected member, the amount and the
  description, the settlement pair, viewer variants and a **Cargar más** footer;
  the screen covers the loading, empty, error, missing and pull-to-refresh
  states.

### Rules
- `groups/{groupId}/activity/{activityId}`: member-only read; create only by the
  signed-in actor (`actorId == request.auth.uid`) who is a member before or
  after the same commit (`get`/`getAfter`, so a join or leave event can be
  written in the same batch as the membership change); `groupId` must equal the
  path; type and field allow-lists; update and delete denied.
- Accepted V1 trade-off: the rules cannot read the expense or settlement an
  event points to, nor sum the ledger, so a member could forge an event
  attributed to themselves. The service is the only writer and the feed is
  advisory.

### Decisions and accepted edges
- No backfill: the feed starts recording from this release onwards; the changes
  made before it (including the pre-ticket settings edits) are not captured.
- The automatic-refresh mechanism is the focus refresh plus pull-to-refresh, not
  a live listener: the project uses no `onSnapshot` subscriptions.
- The history renders a `ScrollView` with mapped rows instead of a `FlatList`,
  following the existing timeline pattern (accepted nit).

### Verification
- `npx tsc --noEmit` and `npx expo lint` clean.
- `npx jest`: **379 suites / 2506 tests** passed.
- `npm run test:coverage`: **98.97 % statements, 94.83 % branches, 98.67 %
  functions, 99.57 % lines**.
- `npm run check:copy`: copy audit passed (**348 TSX files**).
- `npx firebase deploy --only firestore:rules --dry-run` compiled successfully;
  nothing was deployed.
- Reviewer verdict `approve with nits` after the fix round; the remaining nits
  are accepted and documented above.
- Note: `docs/project/development-notes/session-notes/2026-11-23-group-history-and-membership-lifecycle.md`.
- **Pending:** rules deployment and manual device/dark-mode validation.
- **Superseded in part by TICKET-073 (24/11/2026):** the dedicated
  `/social/groups/[groupId]/history` route was removed; the activity collection,
  the events and the rules remain, and the feed is now rendered inside the group
  detail as **Actividad del grupo**.

## Technical Notes
- Prefer an explicit `groups/{groupId}/activity/{activityId}` event collection for auditability. Deriving the feed only from current documents loses edit and delete history.
- Event shape: `type`, `groupId`, `actorId`, optional `targetUserId`, optional `expenseId`/`settlementId`, a small structured payload (amount, currency, changed fields) and `createdAt`. The copy is resolved by the UI from the type and the payload; never store a sentence.
- Membership events: `member-joined`, `member-left`, `member-removed`, `owner-transferred` (with the previous and new owner), `group-updated` and `simplify-debts-changed`. The affected member and the actor are separate fields.
- If the feed is derived, keep `updatedAt` and `deletedAt` on expenses and settlements and clearly label edited/deleted entries. An append-only event collection is preferred for membership and settings changes because the current documents only show the final state.
- Use pure mappers to convert events into display items; keep Firestore access in a repository.
- The group detail should refresh the feed after a mutation and on focus; a member who leaves loses read access because the rules stay member-only.
- Consider pagination if a group can accumulate hundreds of events.
- Decision record: `session-notes/2026-11-20-group-expenses-and-membership-decisions.md`.
- **Sources shipped by TICKET-010 (23/11/2026):** settlements live in the root
  `groupSettlements` collection with a `groupId` and the **Simplificar deudas**
  flag is `groups/{groupId}.simplifyDebts`. The feed can read those records
  directly and starts recording setting changes from this ticket onwards; the
  pre-TICKET-011 changes were not captured.

## Dependencies
- TICKET-009 Shared Expenses
- TICKET-010 Group Balances and Settlements
- TICKET-068 Group membership lifecycle
