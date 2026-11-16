# TICKET-047 - In-App Notification Inbox

**Type:** Feature  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** TICKET-007, TICKET-046  
**Sprint:** Post-MVP / Phase 5.2

## Description
Give the settlement events of TICKET-046 a place to land inside the app: a bell in the home header with an unread badge opens `/notifications`, a list of the viewer's notifications resolved from `type` + `payload`. In-app only; push and email stay out of V1.

## Requirements
- [ ] Add the root `notifications/{notificationId}` document with `userId`, `type`, `payload`, `createdAt`, `readAt` (null = unread) and a deterministic `dedupeKey`
- [ ] Support the types `settlement-pending`, `settlement-accepted`, `settlement-rejected` and `settlement-cancelled`, reserving `friend-request` and future group types
- [ ] Keep the payload free of sentences: ids, amount, currency and `friendUid` only, with the UI resolving copy from `type` + payload through a `notifications` namespace
- [ ] Build the `dedupeKey` as `${settlementId}:${event}:${userId}` so a retried write cannot duplicate a notification
- [ ] Add a repository and service that create notifications idempotently against `dedupeKey`, and expose the single helper TICKET-046 calls on create, accept, reject and cancel
- [ ] Add a bell icon with an unread badge to the home header, hidden at 0, opening `/notifications`
- [ ] Add `notifications` to `PRIVATE_SEGMENTS` in `features/auth/utils/auth-redirect.ts` so only signed-in, verified users reach the inbox
- [ ] Build `/notifications` (`app/notifications.tsx`) ordered unread first, then newest first, with type icon, friend name from the payload/public profile, amount and currency for settlement types, relative date and unread indicator
- [ ] Row action: a `pending` settlement row offers accept/reject or opens `/social/settlements/[settlementId]` (TICKET-046); `accepted`, `rejected` and `cancelled` rows are informational and open the friend detail
- [ ] Mark a notification read when it is opened, and offer an optional mark-all-read action
- [ ] Add loading, error with retry, empty and pull-to-refresh states
- [ ] Add `notifications` rules: owner-only read, owner-only `readAt` update with no other field change, delete denied, and creation only when the caller is a participant of the referenced settlement (cross-document `get`)
- [ ] Extract a pure unread-count helper plus a pure mapper for icon, relative date and row target, each with colocated tests
- [ ] Keep a11y roles, labels and hints for the bell, the badge and every row action, keep es/en copy and dark mode, and pass `npm run check:copy`
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] A settlement created, rejected or cancelled produces exactly one notification for the right user, and a retried write produces none
- [ ] The home bell shows an unread badge whose count equals the unread notifications and hides at 0
- [ ] Opening a notification marks it read and the badge count drops by one
- [ ] A `pending` settlement notification leads to the acceptance flow; the rest open the friend detail
- [ ] The inbox lists unread notifications first and, inside each group, newest first
- [ ] The inbox shows loading, error with retry, empty and pull-to-refresh in light/dark mode and Spanish/English
- [ ] A non-owner cannot read or update another user's notifications and cannot create one outside a settlement they participate in
- [ ] Signed-out and unverified users cannot reach `/notifications`
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- **No composite index:** the repository filters by `userId` only and sorts client-side (unread first, then `createdAt` descending with the id as tie-breaker), mirroring `getSharedExpensesOperation`; the volume per user does not justify an index yet.
- **Why the client writes them:** Cloud Functions are out of V1, so the settlement operation writes the notification in the write that changes the status. The cross-document check in the rules keeps a user from spamming notifications for settlements they do not participate in.
- **Idempotency:** a lookup by `dedupeKey` before the create, or the deterministic key inside the same `runTransaction`, resolves a retry to the existing record instead of failing the settlement.
- **Copy:** every sentence is resolved from `type` + payload in the `notifications` namespace; the payload and the rules never store user-facing text, so a copy change needs no migration.
- **Scope:** TICKET-046 owns the events and payload contract; the bell mounts in the existing dashboard header. The root collection is the extension point for friend requests and group notifications.
- **Out of scope:** push and email notifications (future extension once Cloud Functions exist), notification preferences, blocking, pagination and offline outbox.

## Validation Plan
- Create, accept, reject and cancel a settlement between two test accounts and confirm the counterpart sees exactly one notification with the right copy and amount.
- Open each notification and confirm `readAt` is written, the badge count drops and the target route is correct.
- Retry the same event and confirm no duplicate appears for the same `dedupeKey`.
- Sign in as a third user and try to read, update and create a notification for the pair; confirm the rules deny all three.
- Check the empty, error and pull-to-refresh states in light/dark mode and Spanish/English, including screen-reader labels.

## Dependencies
- TICKET-046 settlement flow (event producer and payload contract)
- TICKET-007 friends and `publicProfiles` (friend name resolution)
