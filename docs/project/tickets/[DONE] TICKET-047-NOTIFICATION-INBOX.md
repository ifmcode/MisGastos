# [DONE] TICKET-047 - In-App Notification Inbox

**Type:** Feature  
**Priority:** Medium  
**Status:** ✅ Done (18/11/2026)  
**Related:** TICKET-007, TICKET-046, TICKET-052  
**Sprint:** Post-MVP / Phase 5.2

## Description
TICKET-046 ships the settlement event writer and a minimal inbox: the `notifications` document, a bell with an unread badge in the dashboard header, `/notifications`, an unread-first list and mark-as-read. This ticket closes the remaining inbox scope: the reserved friend-request/group types, a two-segment inbox (**Pendientes** / **Vistas**) driven by a presented stamp plus an opened stamp, a floating in-app banner for notifications that arrive while the app is in the foreground, mark-all-read, a richer row model, the navigation contract with the friend detail as the parent of every nested target, preferences/pagination policy and the polish that a shared inbox needs once more producers exist. In-app only; push and email stay out of V1.

## Requirements
- [x] Keep the root `notifications/{notificationId}` contract from TICKET-046: `userId`, `type`, `payload`, `createdAt`, `readAt` (null = unread) and a deterministic `dedupeKey`
- [x] Add a `seenAt` timestamp (null = not yet presented to the owner) next to `readAt`, and document the state model: `seenAt == null` means **Pendiente**, `seenAt != null` means **Vista**; a viewed notification keeps an unread marker while `readAt == null`
- [x] Write both `seenAt` and `readAt` when the owner opens a notification, and only `seenAt` when the banner is dismissed or its 4-second timer elapses, so the row moves to **Vistas** still marked unread
- [x] Support the settlement types `settlement-created`, `settlement-updated` and `settlement-deleted` already emitted by TICKET-046, and reserve `friend-request`, `friend-request-accepted`, `group-expense` and `group-settlement` without changing the stored shape
- [x] Keep the payload free of sentences: ids, amount, currency, `friendUid`, booleans only, with the UI resolving copy from `type` + payload through the `notifications` namespace
- [x] Keep `dedupeKey` as `${settlementId}:${event}:${userId}` and include the settlement `updatedAt` for updates so a retry cannot duplicate while a real edit still notifies
- [x] Extend the repository/service with the producer-agnostic `createNotification` helper plus a `createSettlementNotification` wrapper, and expose a documented event contract for future group producers
- [x] Finish the bell: unread count from a pure helper, hidden at 0, refreshed on focus and after returning from `/notifications`, with correct a11y roles/labels/hints for the bell and the badge
- [x] Finish `/notifications` (`app/notifications.tsx`) as a **two-segment inbox**: a segmented control (**Pendientes** / **Vistas**) showing the count of each segment, defaulting to **Pendientes**, with its own empty state per segment; inside each segment rows sort newest first with the id as tie-breaker
- [x] Render each row with type icon, actor name resolved from the payload/public profile, amount and currency for settlement types, localized relative date, and an unread indicator driven by `readAt == null` in both segments
- [x] Row and banner navigation contract: settlement → `/social/settlements/[settlementId]`; group or shared expense → the shared-expense detail; friend request → `/social/requests`; accepted request → the friend detail (`/social/friends/[friendUid]`); when a nested detail is opened, carry a `from=notification` (or equivalent) param so its back action lands on the friend detail instead of the inbox, and keep the existing friend-detail fallback when the target no longer exists
- [x] Add the floating in-app banner at the top of the screen while the app is in the foreground and a new notification for the viewer arrives, driven by a foreground listener on the owner-scoped notifications query: visible for 4 seconds, one at a time with a small queue presented in arrival order, tappable, dismissible, and suppressed while `/notifications` is focused so its rows stay in **Pendientes**. No counter or "N more" indicator is shown
- [x] Give the banner the correct accessibility contract: `accessibilityLiveRegion`/announcement so a screen reader reads it once, an action role and label for opening it, and a labelled close/dismiss control
- [x] Mark a notification as read when it is opened and add an optional **Marcar todo como leído** action that applies only to **Pendientes**, with its own service method and tests
- [x] Keep loading, error with retry, empty and pull-to-refresh states and add pagination when the per-user volume justifies it; no composite index until then
- [x] Keep `notifications` rules: owner-only list and read plus a single `get` for the settlement actor (the idempotent writer), owner-only update limited to `readAt` and `seenAt` with no other field change, delete denied, and creation only by a participant of the referenced settlement for the other participant (cross-document `getAfter`, no self-notifications); a missing id resolves to not-found
- [x] Extract pure helpers with colocated tests for the pending/viewed split, the unread marker inside **Vistas**, the unread count, the row mapper (icon, relative date and target), the banner copy/queue, the navigation target and the notification copy resolver
- [x] Keep a11y roles, labels and hints for every row, the banner and every action, es/en copy and dark mode, and pass `npm run check:copy`
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] A settlement created, edited or deleted produces exactly one notification for the right user, and a retried write produces none
- [x] The home bell shows an unread badge whose count equals the unread notifications and hides at 0
- [x] `/notifications` opens on **Pendientes** and the counts of **Pendientes** and **Vistas** match the stored `seenAt` values
- [x] Opening a notification writes `seenAt` and `readAt`, moves the row to **Vistas**, drops the badge count by one and opens the settlement detail
- [x] Mark-all-read stamps every **Pendiente** row once and never rewrites an existing read stamp
- [x] A banner appears in the foreground when a notification for the viewer arrives, tapping it opens the target and marks it read, and its time-out or manual dismiss moves the row to **Vistas** still unread
- [x] The banner never appears while `/notifications` is open, and a queued second notification is presented after the first is dismissed
- [x] Back from a notification target lands on the friend detail, not on the notification inbox
- [x] A notification whose settlement no longer exists falls back to the friend detail instead of a broken target
- [x] The inbox shows loading, error with retry, empty and pull-to-refresh per segment in light/dark mode and Spanish/English
- [x] A non-owner cannot read or update another user's notifications, cannot create one outside a settlement they participate in and cannot notify themselves
- [x] Signed-out and unverified users cannot reach `/notifications`
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Implemented

### Data
The root `notifications/{dedupeKey}` collection keeps the TICKET-046 shape (`userId`, `type`, `payload`, `createdAt`, `readAt`, `dedupeKey`) and gains `seenAt`. `AppNotification.seenAt` is `string | null`, creation always stores both stamps as `null` (`repositories/notifications.data.ts`), and `repositories/notifications.mapper.ts` maps a legacy document without `seenAt` to `null`, so no migration is needed. `types/notification.types.ts` keeps the three settlement types, adds the reserved `friend-request`, `friend-request-accepted`, `group-expense` and `group-settlement` (readable with the same shape, not writable), and documents the producer contract `NotificationEventInput`. The service gained the producer-agnostic `createNotification` plus the `createSettlementNotification` wrapper, `markSeen`, the two-stamp `markRead`, `markAllRead` and the owner-scoped `subscribe`. `buildSettlementDedupeKey` still returns `${settlementId}:${event}:${userId}` and appends `updatedAt` for updates.

### Rules
`firestore.rules` keeps owner-only `list`/`read` plus the single deterministic `get` that the settlement actor needs to stay idempotent, and a missing id resolves to not-found. `create` is restricted to a participant of the referenced settlement writing for the other participant (`getAfter`, no self-notification) with an amount/currency payload that matches the settlement. `update` is owner-only, limited to `readAt`/`seenAt` and monotonic (null → string, never erased or rewritten); `get(key, null)` treats a TICKET-046 document without `seenAt` as null and `create` still accepts a missing `seenAt` during a rolling deploy. `delete` is denied. **The rules are pending deployment** (`npm run firebase-deploy:rules`).

### Entry points
The dashboard header keeps `NotificationsBell` (badge from `countUnreadNotifications`, hidden at 0, labelled for screen readers) fed by `useDashboardNotifications`. `app/notifications.tsx` renders `NotificationsScreen` and is registered in `features/auth/components/auth-navigator.tsx` inside the private segments, so signed-out and unverified accounts cannot reach it. `NotificationBannerHost` — `features/notifications/components/notification-banner-host.tsx` — is mounted in `app/_layout.tsx` as a sibling of the navigator, so the banner survives route changes.

### UI
`NotificationsScreen` composes a header, `NotificationsSegmentControl` (**Pendientes** / **Vistas** with the count of each, **Pendientes** by default), `NotificationsList` (per-segment empty state, pull-to-refresh, action error banner, **Marcar todo como leído** only in **Pendientes** when at least one unread row exists) and `NotificationRow`. Rows sort newest first with the id as tie-breaker, show the type icon, the actor name from the friends overview, amount and currency for settlement types, the relative date through `formatRelativeTime`/`formatRelative`, and the unread marker from `readAt == null` in both segments. Loading and error with retry live in the screen; copy is resolved only from `type` + payload in the `notifications` namespace (settlements use the `.full`/`.partial` variants, reserved types a flat sentence).

### Navigation
`resolveNotificationTarget` + `buildNotificationTargetHref` (`utils/notification-targets.ts`, re-exported by `utils/notifications.utils.ts`) are the single source for row and banner: settlement → `/social/settlements/[id]`, group/shared expense → `/social/expenses/[id]`, friend request → `/social/requests`, accepted request → `/social/friends/[uid]`. Nested targets carry `from=notification` and `friendUid`, and `shared/hooks/use-detail-close-navigation.ts` replaces the target with the friend detail (or the Social hub without a friend) instead of popping back to the inbox, so the inbox is never the parent of a detail and a missing target still lands on a valid route.

### Closed decisions
- **Mark-all-read** applies only to **Pendientes** and writes `seenAt` + `readAt` in one update per row, preserving an existing `readAt`.
- **Back from a target** replaces the target with the friend detail, so the stack is tabs → `/notifications` → `/social/friends/[uid]`.

### Deliberately deferred
No pagination and no composite index: the per-user volume does not justify either, so the repository filters by `userId` only and the client splits and sorts. Push, email, notification preferences, quiet hours, blocking, an offline outbox, marketing notifications and cross-platform deep links stay out of scope (push is TICKET-052, post-V1).

### Verification
- `npx tsc --noEmit`: OK
- `npx expo lint`: OK
- `npx jest`: 252 suites / 1471 tests
- `npm run test:coverage`: 98.70 % statements, 94.12 % branches, 98.13 % functions, 99.13 % lines (gate 90 %)
- `npm run check:copy`: 250 TSX files

Pending manual items: deploy the rules, validate create/edit/delete between two accounts (one notification each, none on retry), the banner/dismiss/queue on a device, the third-user denial in the rules emulator (needs JDK ≥ 21) and the light/dark + es/en visual check.

### Session note
`docs/project/development-notes/session-notes/2026-11-18-notification-inbox.md`.

## Technical Notes
- **Delivered by TICKET-046:** the collection, its rules, the event writer with `dedupeKey`, the minimal inbox route, the bell and mark-as-read. This ticket must extend that code instead of creating a second inbox or a second notification model.
- **Two timestamps, two questions:** `seenAt` answers "was this presented to me?" and drives the segment; `readAt` answers "did I open it?" and drives the unread marker. Keeping them separate is what lets a dismissed banner move the row to **Vistas** without claiming the user read it. A missing/legacy `seenAt` is treated as `null` (Pendiente); the stamp is written the first time the notification is presented, so no data migration is needed.
- **No composite index:** the repository filters by `userId` only and sorts client-side (segment, then `createdAt` descending with the id as tie-breaker), mirroring `getSharedExpensesOperation`; the volume per user does not justify an index yet.
- **Banner is foreground-only and ephemeral:** it lives in the app overlay driven by a repository listener, has no OS-level scheduling, no background delivery and no persistent state beyond the queue. The inbox stays the source of truth; the banner only reflects what the listener already received. The queue is silent: one banner at a time in arrival order, with no "N more" counter, so a burst of events cannot stack overlays.
- **Why the client writes them:** Cloud Functions are out of V1, so the settlement operation writes the notification in the write that changes the settlement. The cross-document check in the rules keeps a user from spamming notifications for settlements they do not participate in.
- **Idempotency:** the deterministic `dedupeKey` doubles as the document id or is resolved before the create, so a retry returns the existing record instead of failing the settlement.
- **Navigation contract:** targets are derived from `type` + payload by a pure helper, so the row and the banner cannot drift. Nested targets receive a `from=notification` param and resolve their back action to `/social/friends/[friendUid]`; the inbox itself is never the parent of a detail.
- **Copy:** every sentence is resolved from `type` + payload in the `notifications` namespace; the payload and the rules never store user-facing text, so a copy change needs no migration.
- **Scope:** TICKET-046 owns the settlement events and payload contract; the bell mounts in the existing dashboard header. The root collection is the extension point for friend requests and groups.
- **Decision record:** `docs/project/development-notes/session-notes/2026-11-17-account-portability-and-notifications.md`.
- **Out of scope:** push and background notifications (TICKET-052), email notifications, notification preferences and quiet hours, blocking, offline outbox, marketing notifications and cross-platform deep links.

## Validation Plan
- Create, edit and delete a settlement between two test accounts and confirm the counterpart sees exactly one notification per event with the right copy and amount.
- Open each notification and confirm `seenAt` and `readAt` are written, the badge count drops, the row moves to **Vistas** and the settlement detail opens; press back and confirm it lands on the friend detail.
- Dismiss a banner and let another time out; confirm both rows land in **Vistas** with the unread marker still visible and no read stamp written.
- Open `/notifications` while a settlement event is written and confirm no banner appears and the row stays in **Pendientes**.
- Retry the same event and confirm no duplicate appears for the same `dedupeKey`.
- Mark all as read and confirm every **Pendiente** row gets one stamp and the badge hides.
- Compare the **Pendientes** and **Vistas** counts with the stored `seenAt` values for a user with mixed read/unread history.
- Sign in as a third user and try to read, update and create a notification for the pair; confirm the rules deny all three.
- Check both segments' empty, error and pull-to-refresh states in light/dark mode and Spanish/English, including screen-reader labels and the banner announcement.

## Dependencies
- TICKET-046 settlement flow (event producer, payload contract and minimal inbox)
- TICKET-007 friends and `publicProfiles` (actor name resolution)
- TICKET-052 push notifications (post-V1 delivery of the same events; it reuses the payload and targets defined here)
