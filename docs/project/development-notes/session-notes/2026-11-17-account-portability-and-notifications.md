# Account portability and notifications (decision record)

**Date:** 17/11/2026
**Scope:** docs only — TICKET-047 and TICKET-013 extended, TICKET-052, TICKET-053 and TICKET-054 created
**Status:** decided, not implemented

## Context

Five future capabilities were on the table and needed a home before any of them
reached a sprint:

1. an in-app notification inbox with pending and viewed sections plus a floating
   top banner;
2. push notifications when the app is closed;
3. exporting the account (wallets, movements, transfers, categories, settings),
   for one wallet or all, excluding shared/group data;
4. importing that account back, creating or renaming missing wallets and
   categories;
5. backup and restore through Google Drive.

The risk was duplication: a second inbox, a second export format, a second import
path, or a Drive backup that invents its own file. The decision keeps **one** state
model for notifications and **one** portable format for data, and pushes anything
that needs a backend or OS-level delivery out of V1.0.

## Decisions

### 1. In-app inbox: two segments driven by a presented stamp (TICKET-047, V1 Phase 5.2)

- Keep `readAt` (opened) and add `seenAt` (first presented).
- **Pendientes** = `seenAt == null`; **Vistas** = `seenAt != null`.
- A row in **Vistas** with `readAt == null` keeps an unread marker, so "presented"
  and "opened" stay two questions instead of one.
- Opening a row writes both stamps. Dismissing or letting the banner time out
  writes only `seenAt`.
- `/notifications` uses a segmented control with counts, defaults to
  **Pendientes**, has an empty state per segment, and sorts newest first with the
  id as tie-breaker inside each segment. Mark-all-read applies to **Pendientes**.

### 2. Floating banner (same ticket)

- Foreground only, driven by the owner-scoped notifications listener: 4 seconds,
  one at a time with a small queue, tappable, dismissible, announced to screen
  readers.
- Suppressed while `/notifications` is focused, so nothing silently leaves
  **Pendientes** behind the user's back.
- Ephemeral: no persistence, no OS scheduling, and the inbox stays the source of
  truth.

### 3. Navigation contract (same ticket)

- Settlement → `/social/settlements/[settlementId]`; group/shared expense → the
  shared-expense detail; friend request → `/social/requests`; accepted request →
  the friend detail.
- A nested detail carries `from=notification` so its back action lands on
  `/social/friends/[friendUid]`, never on the inbox. The inbox is never the parent
  of a detail.
- The existing fallback (missing target → friend detail) is unchanged.

### 4. Push notifications deferred (TICKET-052, post-V1)

- `expo-notifications` + Expo Push Service (or FCM/APNs) behind a Cloud Function
  triggered by the `notifications` create, with an owner-scoped
  `deviceTokens/{token}` collection.
- Payload stays `type` + ids + amount + currency; copy is resolved on the client.
- Denied permission degrades to the current in-app behaviour.
- Out of V1 because it needs a paid Firebase plan, native credentials, physical
  device validation and a deployment process the project does not have yet.

### 5. Export: one portable format (TICKET-013, V1 Phase 8)

- Scope: wallets, movements, transfers, categories and account settings, with a
  one-wallet or all-wallets selector; a transfer is included when either side
  matches and shows both names.
- Excluded by design: shared expenses, settlements, groups, friends and any other
  user's data.
- The canonical output is a versioned JSON snapshot (`formatVersion`,
  `exportedAt`, `appVersion`, one array per collection) documented in
  `docs/project/`; CSV and PDF are deferred until a real readability need
  appears, and if added later they derive from the same snapshot.
- Exported balances are informational; import must recompute them.

### 6. Import reuses the snapshot (TICKET-053, post-V1)

- Validate version, schema and integrity before any write; reject a newer
  `formatVersion` with a translated code.
- Preflight summary with counts, then an explicit confirmation.
- Missing wallets/categories are created only after asking, each with an editable
  name; collisions (same name or id) resolve as reuse, rename or skip.
- Additive only: no destructive "replace account", idempotent through origin ids
  or an import id, chunked batch writes with partial-failure reporting.
- The first source is the TICKET-013 snapshot, but the user may want to import
  from another expense-manager app; the reading layer stays behind a source
  seam and that second source is specified later with the app in hand.

### 7. Drive backup is the same snapshot (TICKET-054, post-V1)

- Reuse the existing Google sign-in with incremental consent
  (`drive.appdata`, `drive.file` as fallback).
- Manual and on demand only: one **Crear/actualizar copia de seguridad** action
  in Settings, one file per user updated in place, no scheduling and no backup
  history.
- Restore always runs through the TICKET-053 pipeline: no second format and no
  silent overwrite.
- No backend and no service account: the file lives in the user's Drive and the
  app keeps no copy. Sign-out keeps the backup; disconnecting stops new ones.

## Alternatives considered

- **A second `unread` boolean instead of `seenAt`/`readAt`.** Rejected: it cannot
  express "presented but not opened", which is exactly what the banner and the
  **Vistas** segment need.
- **Keeping a single unread-first list** and grouping client-side only. Rejected:
  the more notifications a user has, the more the list is just an archive; the
  segments answer the two real questions ("what is new" and "what did I already
  see").
- **Banner with its own copy and its own data.** Rejected: the banner and the row
  must resolve the same copy and target from `type` + payload, or they drift.
- **Push inside V1.** Rejected: it forces the paid plan, native credentials and a
  device lab, and the inbox already covers the product need.
- **A separate CSV/JSON backup format for Drive.** Rejected: it would triple the
  validation surface and break the "restore through the import pipeline" rule.
- **A backend that stores exports or backups.** Rejected: it adds a data
  controller obligation, cost and a second copy of personal financial data.
- **Import that overwrites the account** ("restore" semantics). Rejected for this
  ticket: additive import with explicit conflict resolution is recoverable; a
  destructive replace is not, and it can wait for a dedicated design.

## Consequences

- TICKET-047 is larger and now owns the banner and the navigation contract; the
  inbox remains a single collection and a single state model.
- TICKET-013 becomes the definition of the portable format, so TICKET-053 and
  TICKET-054 are consumers rather than independent features.
- Three post-V1 tickets are parked in the roadmap's **Post-V1 backlog** section,
  explicitly outside V1.0 scope, so their order and dependencies stay visible.
- Firestore rules change only for `notifications` (allow `seenAt` next to
  `readAt`) when TICKET-047 is implemented; `deviceTokens` rules belong to
  TICKET-052.
- Current Focus is untouched: TICKET-046 stays 🚧 In progress.

## Open questions

- Does a settlement edit need a distinct banner emphasis, or is the same copy
  enough for `settlement-created`/`updated`/`deleted`?
- Where exactly does the snapshot contract live in `docs/project/` — a new
  reference page or a section inside TICKET-013?
- What file shape and conflict rules does the user's current expense-manager app
  export? That research defines the future source adapter and the idempotency
  strategy for TICKET-053.

## Related

- `docs/project/tickets/[DONE] TICKET-047-NOTIFICATION-INBOX.md`
- `docs/project/tickets/TICKET-013-FUTURE-DATA-EXPORT.md`
- `docs/project/tickets/TICKET-052-FUTURE-PUSH-NOTIFICATIONS.md`
- `docs/project/tickets/TICKET-053-FUTURE-DATA-IMPORT.md`
- `docs/project/tickets/TICKET-054-FUTURE-GOOGLE-DRIVE-BACKUP.md`
