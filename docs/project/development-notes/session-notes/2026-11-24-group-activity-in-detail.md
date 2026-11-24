# Group activity in the group detail (TICKET-073, 24/11/2026)

## Context

TICKET-011 shipped the group activity feed on its own route
(`/social/groups/[groupId]/history`), reached from **Ver historial** in
**Detalles del grupo**. In practice that screen duplicated most of **Gastos del
grupo**: the same expenses and settlements, with the same rich rows, only split
across two surfaces. The user reported the duplication and asked for one list in
the group detail.

## Decision

Merge both lists into a single **Actividad del grupo** section inside the group
detail, rename the section and delete the separate route, its screen, its hooks
and the **Ver historial** action. The activity collection, the events, the copy
and the rules stay exactly as TICKET-011 shipped them: only the presentation
changes.

## Merge rules

- Every **active** expense and settlement appears **once**, as its rich row
  (payer, total, and the viewer's share when the viewer owes something).
- `expense-created` and `settlement-created` events are **dropped**: the current
  document is the row, so a creation can never be duplicated.
- Every other event is kept: edits, deletions, `member-joined`, `member-left`,
  `member-removed`, `owner-transferred`, `group-updated` and
  `simplify-debts-changed`.
- Active records come from their current documents, so records written before
  the feed existed (no creation event) are still visible.
- Ordering: `createdAt` desc — the record's creation stamp or the event's stamp —
  with the entry key ascending as the deterministic tiebreaker.
- Gutter: the activity day. The business date (`expense.date`,
  `settlement.date`) is added to the row meta only when it differs from the
  activity day, so a backdated record shows both without repeating an equal one.
- `getGroupActivityDestination` returns `null` for `expense-deleted` and
  `settlement-deleted`, so deleted entries are not pressable; active rows keep
  opening the expense and settlement details.

## Pagination

**Cargar más** keeps paginating older activity through the existing
`createdAt` + id cursor (page 20, clamped to 50), and the section keeps the
loading, empty, error and pull-to-refresh states. The first load owns the
section; a later failure keeps the loaded register and shows the banner.

## What was deleted

- `app/social/groups/[groupId]/history.tsx` and the whole history screen
  composition (`group-history-screen`, `group-history-content`,
  `group-history-list`, `group-history-footer`, `group-history-empty` and
  `group-history.styles`).
- The history-specific hooks and navigation (`useGroupHistory`,
  `useGroupHistoryNavigation`) and the **Ver historial** button
  (`group-details-history-button`).
- The old timeline container `GroupTimeline` and its `buildGroupTimeline` util,
  replaced by the merged section.

## UI surfaces

- `group-activity-section.tsx` renders the section, its states and the footer;
  `group-activity-list.tsx` maps the merged entries and `group-activity-footer.tsx`
  is **Cargar más**.
- The rich rows (`group-timeline-expense-row.tsx`,
  `group-timeline-settlement-row.tsx`) move their gutter to the activity day and
  keep the business date in the meta only when it differs.
- `group-activity-row.tsx` keeps rendering the event rows with the existing
  event copy.

## Verification

- `npx tsc --noEmit` and `npx expo lint` clean.
- `npx jest`: 379 suites / 2511 tests passed.
- `npm run test:coverage`: 98,96 % statements, 94,81 % branches, 98,67 %
  functions, 99,57 % lines.
- `npm run check:copy`: copy audit passed (343 TSX files).
- No document, schema, service, repository, rules or index change.

## Accepted trade-offs

- **`ScrollView` with mapped rows** instead of a `FlatList`, following the
  existing timeline pattern.
- **Focus refresh plus pull-to-refresh** is still the automatic-refresh
  mechanism; the project uses no live listeners.
- **Deleted rows are not pressable**: the detail of a soft-deleted expense or
  settlement is not reachable from the feed, matching the previous behaviour.
- **No backfill** for the activity events themselves; active records are always
  rendered from their current documents, so the ledger is never hidden.

## Pending

- Firestore rules deployment (unchanged from TICKET-011).
- Manual device and dark-mode validation of the merged section, its empty/error
  states and **Cargar más**.
