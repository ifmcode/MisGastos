# [DONE] TICKET-061 - Group Join Code and Join Requests

**Type:** Feature  
**Priority:** Medium  
**Status:** ✅ Done (20/11/2026)  
**Related:** TICKET-008, TICKET-047, TICKET-010  
**Sprint:** Post-MVP / Phase 6

## Description
Give every group a shareable join code so someone who was not invited can ask to join. Entering a valid code creates a join request for the group owner, who accepts or rejects it from the group detail. Accepting adds the requester to the group through the same membership rules used by TICKET-008 invitations.

## Requirements
- [x] Generate a non-guessable join code when a group is created and keep it stable
- [x] Show the join code to group members so they can share it
- [x] Add **Unirse a grupo** to the Social FAB and a screen to enter a code
- [x] Resolve a code to its group without exposing groups to non-members
- [x] Create a pending join request for the owner when the code is valid
- [x] Reject duplicate requests and requests from existing members
- [x] Let the owner accept or reject join requests from the group detail
- [x] Notify the owner of new requests and the requester of the outcome
- [x] Enforce the 20-member limit on acceptance
- [x] Add empty, loading and error states
- [x] Add Firestore rules for the code lookup, requests and owner-only acceptance
- [x] Add tests for code resolution, request transitions and membership updates

## Acceptance Criteria
- [x] A valid code sends a join request to the owner
- [x] An invalid or unknown code shows a clear error and writes nothing
- [x] Only the owner can accept or reject a join request
- [x] Accepting makes the group appear for the requester and respects the member limit
- [x] A rejected request cannot be accepted later
- [x] Non-members still cannot read the group or its members
- [x] The owner receives an in-app notification for every new request

## Technical Notes
- Suggested collection: `groupJoinRequests/{groupId}__{requesterId}` with `groupId`, `requesterId`, `status` (`pending`/`accepted`/`rejected`/`cancelled`), `createdAt` and `updatedAt`.
- The code lookup must not expose group documents: use a `groupCodes/{code}` projection with `{ groupId }`, readable by signed-in users, or an equivalent server-side/callable design.
- Reuse TICKET-008 membership, rules, detail and notification infrastructure. Acceptance must append the member through the same `memberIds` invariant, never bypass it.
- Notifications use the TICKET-047 inbox with new types (for example `group-join-request`, `group-join-accepted`, `group-join-rejected`) and targets to the group detail or the requests screen.
- Keep the code stable; rotating it is out of scope.
- No group expenses or balances are touched by this ticket.

## Implemented (20/11/2026)

### Data model
- `groups/{groupId}` gains `joinCode: string | null` (`features/groups/types/group.types.ts`): `null` only for groups created before the ticket. The code is 8 characters over `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (32 symbols, no `0`/`O`/`1`/`I`, 40 bits) and never changes once written; `formatGroupJoinCode` renders it as `ABCD-2345`.
- Creation generates the code and writes `groups/{groupId}` plus `groupCodes/{code}` `{ groupId, ownerId, groupName }` in the same existing batch (`repositories/group-create.operation.ts`). A legacy group gets its code lazily and idempotently from its owner through `ensureJoinCode`.
- `groupJoinRequests/{groupId}__{requesterId}` (`types/group-join.types.ts`, `repositories/group-join.mapper.ts`) stores `groupId`, `requesterId`, `joinCode`, `status` (`pending`/`accepted`/`rejected`/`cancelled`), `createdAt` and `updatedAt`; no `ownerId` is denormalized, so the owner is proven with a group read. The deterministic id allows one request per group and requester, and `accepted`/`rejected` are terminal. `cancelled` is reserved by the schema with no producer in this release.
- Pure helpers: `utils/group-join-code.ts` (`generateGroupJoinCode` with rejection sampling and an injectable `random`, `normalizeGroupJoinCode`, `formatGroupJoinCode`, `createGroupJoinRequestId`), `utils/group-join-input.ts`, `utils/group-join-request.ts`, `utils/group-join-view.ts`, and the existing `utils/group-membership.ts` (`appendGroupMember`, `isGroupFull`).

### Service
- `services/groups-join.usecases.ts` adds `lookupJoinCode` (`services/group-join-lookup.ts`), `requestToJoin` (`services/group-join-request.ts`), `getJoinRequests`, `respondToJoinRequest` (`services/group-join-response.ts`) and `ensureJoinCode`, exposed through `GroupsService`/`services/groups.factory.ts` and the `useGroupsService` hook.
- `lookupJoinCode` reads only the `groupCodes` projection, reports `INVALID_JOIN_CODE` for an invalid or unknown code and writes nothing. `requestToJoin` rejects a member with `ALREADY_MEMBER`, a pending request with `JOIN_REQUEST_ALREADY_PENDING` and a resolved one with `JOIN_REQUEST_RESOLVED` (terminal, never reopened).
- `respondToJoinRequest` is owner-only and accepts/rejects one request. Acceptance is a `runTransaction` that revalidates the owner, the `pending` status, non-membership and `isGroupFull`, then appends the requester through `appendGroupMember` (owner-first, max 20) and flips the request to `accepted`; reject only writes `rejected` with `updatedAt`.

### Firestore rules (`firestore.rules`)
- `groupCodes/{code}`: `get` allowed to any signed-in user, `list` denied; `create`/`update` only by the group owner, verified against the live group (`joinCode == code`) with `getAfter` on the projection.
- `groupJoinRequests`: `get`/`list` for the participants; `create` requires the requester to be the writer, a current join code matching the group projection, a coherent projection (`groupId`/`joinCode`/`status: pending`) and a non-member; `update` only by the owner and only `pending` → `accepted`/`rejected`, and acceptance must prove with `getAfter` that the requester entered `memberIds`.
- Group update gained a join-by-request branch: `next.memberIds.removeAll(previous.memberIds)` plus an `accepted` request verified with `getAfter`; the `joinCode` backfill is allowed only when the field did not exist (never a rotation).
- Notification rules accept the three new types and tie `dedupeKey` to `requestId` plus the event stamp, so no extra rows can be fabricated. No composite indexes were added.

### Notifications
- `group-join-request` to the owner (written with the requester's client) and `group-join-accepted`/`group-join-rejected` to the requester, produced by `services/group-notify.ts` (`notifyGroupJoinRequest`, `notifyGroupJoinOutcome`). Payload: `{ requestId, groupId, groupName, friendUid }` (`types/notification.types.ts`).
- Delivery is best-effort: a notification failure never breaks the request or the acceptance. The copy never names the actor because the requester may not be a friend, and the rejected notification targets `/social/requests`, since there is no per-request screen.

### UI
- Group details sheet (`components/group-details-modal.tsx`, opened from the group header): `components/group-join-code-card.tsx` shows the formatted code to every member with **Compartir código** (native share sheet) and **Generar código** for the owner of a legacy group, plus a notice when the viewer is not the owner and the code is missing. `hooks/use-group-join-code.ts` owns the share/generate state; the group route body keeps only the owner request queue and the expenses placeholder.
- Owner queue: `components/group-join-requests-section.tsx` + `group-join-request-row.tsx` under **Solicitudes para unirse**, with counter, empty state, accept/reject and a per-row busy state (`hooks/use-group-join-requests.ts`).
- New group: **Unirse a grupo** added to the Social FAB (`features/social/components/social-fab.tsx`, `social-screen.tsx`) opening `/social/groups/join` (`app/social/groups/join.tsx` → `components/group-join-screen.tsx`). The screen validates the code locally, looks it up, and renders the `found`/`member`/`pending`/`rejected`/`sent` states (`components/group-join-result.tsx`, `utils/group-join-view.ts`) plus translated errors; `hooks/use-group-join-screen.ts` and `hooks/use-group-join-request.ts` carry the state.
- Both routes are registered in `features/auth/components/auth-navigator.tsx`; copy lives in the `groups` i18n namespace (es/en) and styles in `features/groups/styles/group-join.styles.ts`.

### Tests and verification
- Colocated tests: `repositories/__tests__/firebase-groups.join-code.test.ts`, `firebase-groups.join-create.test.ts`, `firebase-groups.join-reads.test.ts`, `firebase-groups.join-respond.test.ts`, `group-join.mapper.test.ts`, `services/__tests__/groups.service.join.test.ts`, `groups.service.respond-join.test.ts`, `groups.service.create.test.ts`, and `utils/__tests__/group-join-code.test.ts`, `group-join-input.test.ts`, `group-join-request.test.ts`, `group-join-view.test.ts`.
- `npx tsc --noEmit`, `npx expo lint`, `npx jest --runInBand` (297 suites / 1798 tests), `npm run test:coverage` (98.82 % statements, 94.22 % branches, 98.52 % functions, 99.45 % lines) and `npm run check:copy` (290 TSX) pass. `npx firebase deploy --only firestore:rules --dry-run` compiles.
- Review: the `reviewer` agent requested changes; the major finding (phantom row for an already accepted member, now filtered by `memberIds` with a test) and the minor ones (dedupe tie, re-lookup after `PERMISSION_DENIED` in the double-submit race, backfill retry, useless Social refresh, `cancelled` comment, formatting and palette) were fixed before closing.

### Trade-offs and limitations
- The code reveals `groupId`, `ownerId` and the group name to whoever holds it — never members or expenses — which is what the `groupCodes` projection is for.
- Client-side `Math.random` with 40 bits is accepted for V1 because joining still requires owner approval; `expo-crypto` is the future hardening step. A create-time code collision is possible (~1e-12) and undocumented at runtime; the backfill retries up to 3 times.
- A pending request from someone who joined through an invitation is hidden from the owner queue, so the pending row would be stale (the document stays as an audit record). The owner reads the request history and the client filters to pending + non-members, which needs no composite index; the rules cache the single distinct group document read for the queue.
- No code rotation, no cancellation by the requester and no notification retry. Manual validation on a device is still pending.

### Pending deployment
- The new `groupCodes`/`groupJoinRequests` rules, the `groups`/notification changes and the three new event types are **not deployed**; run `npm run firebase-deploy:rules`.

### Note
- Session note: [`session-notes/2026-11-20-group-join-code.md`](../development-notes/session-notes/2026-11-20-group-join-code.md)

## Dependencies
- TICKET-008 Groups and invitations (membership model and rules)
- TICKET-047 In-app notification inbox
- TICKET-010 Group balances (only for the accepted-member detail after TICKET-009)
