# TICKET-052 - Push Notifications for Background and Closed App

**Type:** Feature  
**Priority:** Low  
**Status:** ⏳ Pending  
**Related:** TICKET-047, TICKET-046  
**Sprint:** Post-V1

## Description
Deliver OS-level push notifications for the events the in-app inbox already receives, so a user who is not looking at the app still learns about a settlement or a friend request. The app stays in-app-first: the inbox remains the source of truth, the push payload carries ids and numbers only, and a denied permission degrades to the current behaviour without breaking anything.

## Requirements
### Transport and infrastructure
- [ ] Choose the delivery path: `expo-notifications` + Expo Push Service, or FCM/APNs directly, and record the decision and its cost in a development note
- [ ] Accept the required Firebase plan change (Blaze) and document the Cloud Functions deployment, secrets and the rollback path
- [ ] Add a Cloud Function triggered by the `notifications` document create that resolves the recipient's active tokens and sends one push per token
- [ ] Send only to the counterpart's active tokens: never to the actor, never to a revoked token and never twice for the same `dedupeKey`

### Device tokens
- [ ] Add an owner-scoped `deviceTokens/{token}` collection with `platform`, `uid`, `createdAt`, `lastSeenAt` and `revokedAt`
- [ ] Add Firestore rules: the owner writes, updates `lastSeenAt` and revokes; reads are not granted to any client and are reserved for the sending function
- [ ] Register the token after sign-in and on app start, refresh it when the OS rotates it, and revoke it on logout so a shared device stops receiving the previous account's pushes
- [ ] Request the permission with an explained, dismissible prompt and offer a Settings entry that reports the current state and re-opens the system settings

### Payload and navigation
- [ ] Keep the payload to `type`, the referenced ids, `amountCents` and `currency`; no sentences, no names, no other PII
- [ ] Resolve every visible string on the client from `type` + payload through the `notifications` namespace, so copy changes need no app release
- [ ] Deep link to the same targets as TICKET-047 (`/social/settlements/[settlementId]`, shared-expense detail, `/social/requests`, `/social/friends/[friendUid]`), keeping the friend detail as the parent of any nested detail
- [ ] Reuse the existing `dedupeKey` so one event produces one push, and send nothing for events the recipient caused
- [ ] Match the foreground behaviour to the in-app banner (present the same copy, no double notification while the app is open)
- [ ] Configure the Android channel (importance, sound) and the iOS permission/foreground presentation so both platforms behave the same

### Quality and limits
- [ ] Handle denied and blocked permissions with a graceful fallback: the in-app inbox keeps working, no error dialog, and the Settings entry explains how to enable pushes
- [ ] Handle delivery failures and expired tokens by clearing or revoking the token without retrying forever
- [ ] Keep per-type preferences and quiet hours as an explicit follow-up, not part of this ticket
- [ ] Add tests for token mapping, payload mapping, target resolution and the dedupe/recipient rules with fakes; document that end-to-end delivery is verified on physical devices
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] With the app closed, the counterpart receives one push for a settlement create/edit/delete and tapping it opens the settlement detail, with back landing on the friend detail
- [ ] With the app in the foreground, the notification is presented once and never duplicates the in-app banner's copy
- [ ] A retried write produces no second push, and the actor never receives a push for their own event
- [ ] A token revoked on logout stops receiving pushes, and re-signing in registers a new active token
- [ ] Denying the permission leaves the in-app inbox fully functional and the Settings entry reports the blocked state
- [ ] The `deviceTokens` rules deny reads and non-owner writes to a client
- [ ] The function, its trigger and its deployment are documented and reproducible
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
- **Why post-V1:** the inbox (TICKET-047) already covers the product need, and push requires Cloud Functions plus a paid Firebase plan, a native credential setup and real-device validation. Those costs do not belong to V1.0 scope.
- **Payload stays dumb:** `type` + ids + amount + currency only. Push payloads are visible on the lock screen, so no concept text, no counterpart name and no note is included; the client resolves copy from the translation namespace, exactly as the inbox does.
- **Token lifecycle:** one document per token, not per user, because a user can have several devices; `lastSeenAt` is refreshed on app start, `revokedAt` on logout or an explicit disconnect, and the sending function filters on an active token.
- **Function trigger:** the function fires on the `notifications` create, which already carries `userId`, `type`, `payload` and `dedupeKey`. The client write stays the single event source, so no second event model is introduced.
- **Foreground parity:** `expo-notifications` foreground presentation and the in-app banner must be exclusive, otherwise one event shows twice. The banner stays owned by TICKET-047; push only handles the background/closed case.
- **Not in this ticket:** email, web push, marketing or promotional notifications, rich media, scheduled digests and per-type preferences/quiet hours (follow-up).
- **Decision record:** `docs/project/development-notes/session-notes/2026-11-17-account-portability-and-notifications.md`.

## Validation Plan
- Install a development build on a physical iOS and a physical Android device, sign in with two accounts and trigger a settlement from the other account with the app closed.
- Confirm one push per event with the resolved copy, the right amount and currency, and that tapping opens the settlement detail with the friend detail as its parent.
- Repeat the same event (retry) and confirm no second push; trigger an event the receiving user caused and confirm no self-push.
- Sign out on the device and confirm no further pushes arrive; sign in again and confirm a new token is registered and the old one is revoked.
- Deny the permission on a fresh install and confirm the inbox still works and Settings explains the state.
- Verify the Android channel, the iOS foreground presentation and the in-app banner do not duplicate.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-047 in-app notification inbox (state model, payload contract and navigation targets)
- TICKET-046 settlement events (the producer that triggers the first pushes)
- Firebase Blaze plan / Cloud Functions decision (blocks the implementation, not the ticket definition)
