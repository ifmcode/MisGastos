# [DONE] TICKET-008 - Groups and Invitations

**Type:** Feature  
**Priority:** High  
**Status:** ✅ Done (20/11/2026)  
**Related:** PM-005; TICKET-007, TICKET-009, TICKET-010, TICKET-011, TICKET-061  
**Sprint:** Post-MVP / Phase 6

## Description
Create Splitwise-style groups to organise shared expenses between friends, with a name, a default currency, an optional description and invited members. The owner builds the group from accepted friends; each invited friend receives an in-app notification and joins only after accepting. The group has a detail screen with header, member management and a details sheet, and the Social tab lists every group the user belongs to.

> **Scope decision (20/11/2026):** the group **join code** and the **join requests** it enables are deferred to TICKET-061. This ticket ships invitations with accept/reject only. The group default currency is the default for new expenses; each group expense stores its own currency (see TICKET-009/010), so it is not a fixed ledger currency.

## Requirements
- [x] Create a group with name, default currency and optional description
- [x] Invite one or more accepted friends during creation; they join only after accepting
- [x] Show received group invitations to the invitee and allow accept or reject
- [x] Notify every invitee through the in-app notification inbox
- [x] List groups the current user belongs to under **Social → Tus grupos**
- [x] Show group name, default currency, member count and the current user's balance summary (**En paz** until group expenses exist)
- [x] Add a group detail screen: header with name, member count and balance; the name opens a details sheet with description, default currency and members
- [x] Allow the owner to edit the name, description and default currency from the group row and from the group detail
- [x] Allow the owner to invite more accepted friends and to cancel pending invitations
- [x] Allow the owner to remove a member other than themselves, with confirmation
- [x] Prevent inviting non-friends, duplicate invitees, existing members or friends with a pending invitation
- [x] Enforce a maximum of 20 members per group, owner included
- [x] Add empty, loading, error and missing states for the hub segment, group list, group detail and invitations
- [x] Add Firestore rules: members list and read the group, a pending invitee may `get` it to accept, the owner edits metadata and removes members, invitations are friend-only and invitee-responded, and membership only grows through an accepted invitation
- [x] Add tests for membership validation and group mapping

## Acceptance Criteria
- [x] A user can create a group and invite at least one accepted friend
- [x] Each invited friend receives an in-app notification and can accept or reject from the pending requests screen
- [x] An accepted invitation makes the group appear in that member's **Tus grupos** list
- [x] Non-members cannot list or modify the group; a pending invitee may read it to accept the invitation, and invitations are participant-only
- [x] The owner can edit the name, description and default currency and remove a member; the owner can never be removed
- [x] A group accepts at most 20 members, owner included
- [x] The group list shows the correct member count and the **En paz** summary while there are no group expenses
- [x] Each future group expense will store its own currency; the group default currency is only the default for new expenses (documented contract handed to TICKET-009/010)

> The acceptance criteria are covered by the automated suites, the rules dry-run and the code review; the device checks of the Validation Plan are still pending (see **Known limitations and trade-offs**).

## Implemented

### Data model
`groups/{groupId}` holds `ownerId`, owner-first `memberIds` (accepted members only, 20 including the owner), `name` (1..60), `description` (`null` or <= 200), `defaultCurrency` (EUR/USD/GBP/JPY/CHF), `createdAt` and `updatedAt`. The document id is owner-namespaced (`${ownerId}__${autoId}` through `createGroupDocumentId`), which is the rules security boundary described below.

`groupInvitations/{groupId}__{inviteeId}` holds `groupId`, `groupName`, `inviterId`, `inviteeId`, `pairId` (the sorted friend pair), `status` (`pending`/`accepted`/`rejected`/`cancelled`), `createdAt` and `updatedAt`. The id is deterministic, so one document exists per invitee and group and re-inviting reopens it. `groupName` is denormalized so the invitee list never reads the group.

Types, constants and helpers live in `features/groups/types/group.types.ts` (`GROUP_MAX_MEMBERS`, `GROUP_MAX_INVITEES`), `features/groups/utils/group-ids.ts`, `group-membership.ts`, `group-invite-eligibility.ts`, `group-list.ts` and `group-form.ts`, with the mapper in `features/groups/repositories/groups.mapper.ts` and the schema in `features/groups/schemas/group.schema.ts`.

### Invitation lifecycle
- **Create:** `createGroupWithFriends` validates that every invitee is an accepted friend (`NOT_FRIEND`), then `createGroupWithInvitationsOperation` writes the group (`memberIds: [ownerId]`) and every pending invitation in one `writeBatch` (max 19 invitees, one friendship read per invitation). `group-invite` notifications are sent afterwards, best-effort.
- **Accept:** `acceptGroupInvitationOperation` writes the `accepted` status and appends the caller to `memberIds` in one `runTransaction`, re-checking the group capacity.
- **Reject / cancel:** reject is the invitee's response and cancel is the owner's; both only update the status through `updateGroupInvitationStatusOperation`.
- **Re-invite:** reopens the same deterministic invitation document instead of creating a second one.
- **Remove member:** `removeGroupMemberOperation` performs the owner-driven removal (confirmation in the UI); the owner can never remove themselves.
- **Rename:** a metadata update also refreshes the denormalized `groupName` of the pending invitations.

### Capacity and reserved seats
`getGroupInviteCapacity(memberIds, pendingCount) = max(20 - members - pending, 0)`. The service and the UI reserve a seat per pending invitation, so the owner cannot queue more invitations than the group can honour; a late acceptance that would exceed the cap fails with `GROUP_FULL`.

### Rules and security
`firestore.rules` (TICKET-008 section):
- members `list`/`get` the group; a **pending invitee** may `get` it, which is what the accept transaction needs, while `list` stays member-only;
- create requires `ownerId == auth.uid`, an owner-namespaced id (`isOwnedGroupId`), `memberIds == [auth.uid]`, bounded text/description, one of the five currencies and an exact field allow-list;
- update keeps the identity and only allows an owner metadata edit, an owner member removal or an invitee joining through an **accepted** deterministic invitation verified with `getAfter`;
- `memberIds` is capped at 20; delete is denied;
- invitation create is friend-only (it reads `friendships/{pairId}`) and owner-namespaced; invitation read is participant-only and a missing id resolves to not-found so an idempotent invite can decide create vs reopen; invitee accept/reject, owner cancel/rename/reopen transitions are restricted; delete is denied;
- the `group-invite` notification adds the type, its payload/target validation and the actor `get`.

No composite index: the list queries filter only with a single `array-contains`/equality and sort client-side. `npx firebase deploy --only firestore:rules --dry-run` compiled the rules successfully.

### UI and routes
`features/groups/**` owns data and UI. The **Social → Tus grupos** segment (`app/(tabs)/social.tsx` → `features/social` `social-groups-segment.tsx`) lists the groups and mounts the create/edit page sheet. The Social FAB adds **Crear grupo**; **Unirse a grupo** belongs to TICKET-061. `/social/groups/[groupId]` (`app/social/groups/[groupId].tsx`) renders the detail with header, info sheet (description, default currency, members), member list, pending invitations and the owner edit/invite/remove actions. Received group invitations reuse the existing top **Peticiones pendientes** banner: its count adds the received group invitations to the friend requests and it opens `/social/requests`, which shows incoming friend requests, the **Invitaciones a grupos** section with accept/reject, and outgoing friend requests. The separate groups-segment invitations row and the dedicated `/social/groups/invitations` screen were removed. Empty, loading, error and missing states exist for the segment, the list, the detail and both request sources, and a failed segment load keeps cached groups with a banner. Copy lives in the `groups` i18n namespace with es/en parity.

### Notifications
`group-invite` is a new notification type with payload (invitation, group, group name, inviter) and target `/social/requests`; rows and the foreground banner resolve through the existing `resolveNotificationTarget`/`buildNotificationTargetHref` seam, and opening it deep-links to the unified pending requests screen.

### Business scope
Group expenses and balances are TICKET-009/010, so the only correct summary today is **En paz**: no group expense can exist yet. The group `defaultCurrency` is only the default for future group expenses; every future group expense stores its own currency and balances are grouped per currency, never converted. TICKET-009 and TICKET-010 were updated with that contract.

### Verification (20/11/2026)
- `npx tsc --noEmit`: pass.
- `npx expo lint`: exit 0.
- `npx jest` / `npm run test:coverage -- --silent`: 286 suites / 1711 tests.
- Coverage: 98.84 % statements, 94.20 % branches, 98.43 % functions, 99.42 % lines (above the 90 % gate).
- `npm run check:copy`: passed, 282 TSX files.
- `npx firebase deploy --only firestore:rules --dry-run`: rules compiled successfully (nothing deployed).

### Review
The first review found a forged-invitation read blocker and two majors; all were fixed: the owner-namespaced group id plus the `split('__')` prefix rule in the invitation create rule, the reserved-seat capacity in service and UI, and an error state for the groups segment. The second focused review returned `approve with nits`; the remaining nits are the documented trade-offs below. A post-close UX refinement unified received group invitations into the existing **Peticiones pendientes** banner and `/social/requests` screen, removed the separate invitations row/screen and changed the notification target to `/social/requests`; tsc, lint, jest and `check:copy` were re-run.

### Session note
`docs/project/development-notes/session-notes/2026-11-20-groups-and-invitations.md`

## Known limitations and trade-offs
1. The `groups`, `groupInvitations` and `group-invite` notification rules are **pending deployment**, and manual device validation is pending: light/dark, es/en, page sheets, screen reader, a two-account invite/accept round and the notification deep link.
2. Group expenses and group balances are TICKET-009/010, so **En paz** is the correct summary today; the join code and join requests are TICKET-061.
3. Rules cap `memberIds` at 20 but do **not** count pending invitations. The service and the UI reserve a seat per pending invitation; a hand-crafted write outside the app could queue extra pending rows, and the late acceptance would fail with `GROUP_FULL`.
4. The invitation create rule deliberately does not read the group, which keeps a 19-invite batch at 19 friendship reads inside the document-read budget. An invitation for a non-existent group under the caller's own namespace is therefore possible, but it cannot read a real group, cannot notify (the notification rule reads the group) and cannot be accepted.
5. Two full `groupInvitations` list reads per invite round (pending count + existing invitations) is accepted optimization debt.
6. Answering an invitation from `/social/requests` does not auto-mark its inbox notification as read; opening the notification does. A group invitation answered after the group fills fails with `GROUP_FULL`.
7. `useGroupFormValues` captures the profile preferred currency when the form opens; a profile that arrives later keeps the EUR fallback for that open form.
8. Legacy pre-namespace group test documents are dropped by the mapper (the feature is unreleased and the rules are not deployed). There is no rules emulator suite yet.

## Technical Notes
- Collections: `groups/{groupId}` with `ownerId`, `memberIds` (owner first, accepted members only), `name`, `defaultCurrency`, `description`, `createdAt` and `updatedAt`; `groupInvitations/{groupId}__{inviteeId}` with `groupId`, `groupName`, `inviterId`, `inviteeId`, `pairId`, `status` (`pending`/`accepted`/`rejected`/`cancelled`), `createdAt` and `updatedAt`.
- Invitations are friend-only: the `pairId` references an existing `friendships/{pairId}` document and both uids must be its members. The deterministic invitation id prevents duplicates; re-inviting reopens the same document instead of creating a second one.
- Membership only grows through acceptance: the group document starts with `memberIds: [ownerId]`, and the invitee's accept writes the invitation status and the appended member in one transaction. The rules verify the invitation on the group update.
- Group default currency is the default for new group expenses only. Every group expense stores its own currency and balances are grouped per currency, never converted, mirroring the 1:1 shared-expense model.
- Group expenses and their balance summary remain TICKET-009/010. This ticket shows **En paz** because no group expense can exist yet.
- Keep group money separate from personal wallets. Transfers between personal wallets and groups are out of scope.
- `features/groups/` ships with `components/`, `hooks/`, `locales/`, `repositories/`, `schemas/`, `services/`, `styles/`, `types/` and `utils/`.
- **Placement:** groups live under **Social → Tus grupos**, the segment reserved by TICKET-041. The Social FAB adds **Crear grupo**; **Unirse a grupo** belongs to TICKET-061.
- **Expense entry:** group expenses will be created from the movements FAB menu (TICKET-045), which reserves the disabled **Gasto de grupo** action until TICKET-009. Group members and membership must reuse the existing shared-expense split and balance model instead of a second money implementation.
- **Notifications:** the `group-invite` notification type (payload with invitation, group, group name and inviter), its copy/target and the rules entry are implemented; the notification opens `/social/requests`.

## Dependencies
- TICKET-007 Friends and Requests
- TICKET-041 Social tab shell (groups segment and FAB actions)
- TICKET-045 Movements create menu (group expense entry)
- TICKET-047 In-app notification inbox (`group-invite` producer)
- TICKET-061 Group join code and join requests (deferred)
