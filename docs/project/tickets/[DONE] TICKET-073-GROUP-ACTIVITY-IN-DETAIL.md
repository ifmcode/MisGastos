# [DONE] TICKET-073 - Group Activity in the Group Detail

**Type:** Feature  
**Priority:** High  
**Status:** ✅ Done (24/11/2026)  
**Related:** TICKET-011, TICKET-072; supersedes the separate history route of TICKET-011  
**Sprint:** Post-MVP / Phase 6 follow-up

## Description
The separate group history route duplicated most of what **Gastos del grupo** already shows. Merge both into one chronological **Actividad del grupo** section inside the group detail, rename the section and remove the dedicated route.

## Requirements
- [x] Remove `/social/groups/[groupId]/history`, its screen, hooks, navigation and the **Ver historial** entry point
- [x] Rename the group-detail section from **Gastos del grupo** to **Actividad del grupo**
- [x] Show one merged list: every active expense and settlement once (rich row), plus edit, deletion, membership, ownership and settings entries from the activity feed
- [x] Never duplicate a creation: active records are the row, and `expense-created`/`settlement-created` events are not rendered
- [x] Order by activity time (`createdAt`, newest first, key as tiebreaker) and show the business date in the row when it differs from the activity date
- [x] Keep **Cargar más** for older activity and the loading, empty, error and pull-to-refresh states
- [x] Keep the expense/settlement detail navigation; deleted entries are not pressable
- [x] Reuse the existing event copy, rows and the member-only activity data; no document, rules, index or service change
- [x] Add tests for the merge (dedupe, deleted records, legacy records without events, ordering)

## Acceptance Criteria
- [x] The group detail shows one **Actividad del grupo** list and no history route or button
- [x] Each active expense/settlement appears exactly once with its payer/total/share information
- [x] Edits, deletions, joins, leaves, removals, transfers and setting changes appear with actor and date
- [x] Existing records without a stored creation event still appear (current state is the source)
- [x] Entries with the same timestamp keep a deterministic order
- [x] `tsc`, `lint`, `jest` and `check:copy` pass

## Implemented

### One merged section
- The separate `/social/groups/[groupId]/history` route, its screen, its hooks and
  the **Ver historial** action in **Detalles del grupo** are gone.
- The group detail renders a single **Actividad del grupo** section
  (`features/groups/components/group-activity-section.tsx`), replacing the old
  **Gastos del grupo** timeline container.
- The merge is a pure util, `buildGroupActivityEntries`
  (`features/groups/utils/group-activity-timeline.ts`), over the active
  `GroupExpense[]`, `GroupSettlement[]` and the loaded `GroupActivity[]`; the
  section only renders.

### Merge rules
- Every active expense and settlement appears **once** as its rich row
  (payer, total and the viewer's share), so a record is never duplicated by its
  creation event.
- `expense-created` and `settlement-created` events are never rendered; every
  other event is kept: edits, deletions, `member-joined`, `member-left`,
  `member-removed`, `owner-transferred`, `group-updated` and
  `simplify-debts-changed`.
- Because active records come from their current documents, legacy records
  written before the activity feed existed are still visible.
- Ordering is `createdAt` desc (the record's creation stamp or the event's
  stamp) with the entry key ascending as the deterministic tiebreaker.
- The gutter shows the activity day; the business date is added to the row meta
  only when it differs from the activity day, so a backdated expense keeps both
  dates without repeating an equal one.

### Pagination and states
- **Cargar más** paginates older activity through the existing cursor, and the
  loading, empty, error and pull-to-refresh states stay.
- Deleted entries are not pressable: the destination resolver returns `null`
  for `expense-deleted`/`settlement-deleted`, while active rows keep opening the
  expense and settlement details.

### No data change
- No document, schema, service, repository, rule or index change: the activity
  collection, its writes, the event copy and the member-only rules stay as
  TICKET-011 shipped them.

### Supersession
- This ticket supersedes the dedicated history route of TICKET-011 while keeping
  the activity collection, the events and the rules; the feed is now part of the
  group detail.

### Verification
- `npx tsc --noEmit` and `npx expo lint` clean.
- `npx jest`: **379 suites / 2511 tests** passed.
- `npm run test:coverage`: **98,96 % statements, 94,81 % branches, 98,67 %
  functions, 99,57 % lines**.
- `npm run check:copy`: copy audit passed (**343 TSX files**).
- Note: `docs/project/development-notes/session-notes/2026-11-24-group-activity-in-detail.md`.
- **Pending:** rules deployment and manual device/dark-mode validation (unchanged
  from TICKET-011).

## Technical Notes
- The merge lives in a pure util over `GroupExpense[]`, `GroupSettlement[]` and `GroupActivity[]`; the section only renders.
- `useGroupActivityFeed` is reused inside the group-detail controller; it refreshes on focus and after a mutation.
- The rich rows (`GroupTimelineExpenseRow`, `GroupTimelineSettlementRow`) move to the activity date for their gutter and keep the business date in the meta when it differs.
- The old `buildGroupTimeline` and the `GroupTimeline` container are replaced by the merged section.
- Decision: the activity section records from this release onwards, but active records are always rendered from their current documents, so legacy data is never hidden.
