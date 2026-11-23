# [DONE] TICKET-070 - Group Join Requests in Social

**Type:** UX / Refactor  
**Priority:** Medium  
**Status:** ✅ Done (23/11/2026)  
**Related:** TICKET-041, TICKET-047, TICKET-061  
**Sprint:** Post-MVP / Phase 6

## Description
Move the owner's **Solicitudes para unirse** queue out of the group detail and
into Social, next to the other pending requests, so the group detail stays
focused on membership, expenses and balances. Keep accept/reject and the
existing notifications; the owner manages every pending join request from one
place instead of opening each group.

## Requirements
- [x] `/social/requests` shows an owner-only **Solicitudes para unirse** section with every pending join request across the owner's groups
- [x] Each row shows the group name, the requester name/email (safe fallback), the request date, **Aceptar**/**Rechazar** and a per-row busy state
- [x] The Social pending counter includes pending join requests owned by the viewer
- [x] Remove the section from the group detail (`GroupJoinRequestsSection`, its hook and its copy)
- [x] The `group-join-request` notification opens `/social/requests` instead of the group detail
- [x] Accept/reject keeps the TICKET-061 transaction: revalidate owner, `pending`, non-membership and the 20-member cap; show the error inline
- [x] Keep loading, error with retry, empty state and pull-to-refresh independent from the friend-request and group-invitation sections
- [x] Non-owners never see the section or the counter contribution
- [x] Add tests for the cross-group aggregation, the pending counter and the screen hook

## Acceptance Criteria
- [x] The owner sees every pending join request of every owned group in Social with the correct group and requester
- [x] Accepting adds the requester to that group and removes the row from the queue; rejecting removes it without adding the member
- [x] The group detail no longer shows a join-request section
- [x] The notification for a join request opens Social, where the request can be answered
- [x] A non-owner never sees the owner queue
- [x] A full group or a request resolved elsewhere shows a clear inline error instead of a silent failure

## Implemented

### Data and service
- `OwnerJoinRequestItem { groupId, groupName, item: GroupJoinRequestItem }` and the
  pure `buildOwnerJoinRequests(groups, itemsByGroup)` (oldest first, ties by
  group, then request id). It skips groups without entries and never mutates the
  inputs.
- `GroupsService.getOwnerJoinRequests(viewerUid)` replaces the unused per-group
  `getJoinRequests`: it reads the viewer's groups, keeps the owned ones, fans out
  the existing pending + non-member + profile loader over them (max 20,
  accepted V1 read budget, no denormalized `ownerId` and no composite index) and
  returns the aggregated queue. A non-owner gets `[]`.
- `GroupDetail` no longer exposes `joinRequests`; `loadGroupDetail` stopped
  loading the queue. The response and edit transaction (`respondToJoinRequest`)
  is unchanged.

### UI
- `features/social` renders the new `OwnerJoinRequestsSection` first in
  `/social/requests`, with an inline loader for the first load, an inline error
  with retry, a background/action `ErrorBanner`, the group name, requester
  name/email, request date and **Aceptar**/**Rechazar**. The section renders
  nothing when the owner has no pending request, so no empty "0 solicitudes"
  block exists.
- `useOwnerJoinRequests` + `useOwnerJoinRequestActions` own the fan-out state,
  focus refresh and single-flight decision (the answered row disappears and the
  groups overview refreshes). The group-detail section, row, hook, copy and
  queue-only styles were deleted; `GroupJoinActionButton` is reused.
- `countPendingRequests`/`getPendingRequests` accept the owner queue as an
  optional third source (finite, truncated, non-negative) and stay the single
  source for the Social badge; `useSocialScreen` and `useRequestsScreen` count
  friend requests + received invitations + owned pending join requests.
- The `group-join-request` notification target moved to `/social/requests`;
  `group-join-accepted` still opens the group detail.

### Verification
- `npx tsc --noEmit` and `npx expo lint` clean.
- `npm run check:copy` passed (315 TSX files).
- `npx jest --coverage`: **346 suites / 2171 tests**, coverage **98.97 %
  statements / 94.76 % branches / 98.61 % functions / 99.52 % lines**.
- New tests cover the pure aggregation (empty map, flattening, ordering, ties,
  no mutation), the service (two owned groups, foreign group excluded,
  non-owner, filtering, profiles, `SIGN_IN_REQUIRED`, `GroupDetail` without
  `joinRequests`), the counter third source and the notification target.
- Manual device validation (owner with and without requests, several groups,
  invitation mixed in, light/dark, screen reader) is pending.

## Technical Notes
- **No composite index (V1):** `groupJoinRequests` has no denormalized
  `ownerId` on purpose (TICKET-061). Fan out `GroupsService.getJoinRequests`
  over the owner's groups from `useGroups` (at most 20) and aggregate the
  pending, non-member rows client-side with a pure
  `collectOwnerJoinRequests(groups, requestsByGroup)`. The rules cache the
  single distinct group read per query. Document the read budget as an accepted
  V1 trade-off; an owner-scoped projection is the future replacement.
- **Profiles:** reuse the TICKET-061 resolver (`loadProfilesByUid` /
  `publicProfiles`) so a requester who is not a friend still has a safe name and
  email. Keep the existing `GroupJoinRequestItem` shape.
- **Counter:** `getPendingRequests`/`countPendingRequests` in
  `features/social/utils/pending-requests.ts` is the single source for the
  Social row badge. Add the owner queue as a third source and keep the pure
  helper testable; do not compute the count in two places.
- **Notification target:** change the `group-join-request` target from the group
  detail to `/social/requests` in `resolveNotificationTarget` /
  `buildNotificationTargetHref` and its tests. The other group-join events keep
  their current targets.
- **Screen and copy:** the section belongs to `features/social`; move the copy
  to the `social` namespace (or keep the `groups` keys but consume them from the
  Social screen) and delete the group-detail keys. The group detail keeps the
  join code card and the member management.
- **Service reuse:** do not duplicate `respondToJoinRequest`; the Social row
  calls the same use case. After a successful response, refresh the shared
  groups overview so the group list and the queue agree.
- **Out of scope:** requester-side cancellation, notification actions inside the
  banner, a per-request screen and changing the `groupJoinRequests` schema.

## Dependencies
- TICKET-061 Group join code and join requests (service, rules, queue UI)
- TICKET-041 Social tab and pending requests (`/social/requests`)
- TICKET-047 In-app notification inbox (targets and copy)
