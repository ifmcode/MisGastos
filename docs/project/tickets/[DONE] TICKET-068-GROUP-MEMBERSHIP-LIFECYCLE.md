# [DONE] TICKET-068 - Group Membership Lifecycle: Leave, Balance-Safe Removal and Ownership Transfer

**Type:** Feature  
**Priority:** High  
**Status:** ✅ Done (23/11/2026)  
**Related:** TICKET-008, TICKET-010, TICKET-011, TICKET-047  
**Sprint:** Post-MVP / Phase 6  

Implemented in the same session as TICKET-011 (circular dependency: membership events feed the group history).

## Description
Let a member leave a group and let the owner remove a member safely, without orphaning debts. A member can only leave or be removed when their net balance is zero in every currency; otherwise they must settle first through TICKET-010. The owner can transfer ownership to another active member; the old owner becomes a regular member and can then leave once settled. The group always keeps exactly one owner.

## Requirements
- [x] A non-owner member can leave the group from the group detail, with confirmation
- [x] The owner can remove a member (already possible since TICKET-008) only when that member's net balance is zero in every currency
- [x] Block leave and removal with a clear message and a **Liquidar** shortcut when any currency has a non-zero balance; show the outstanding amount and direction
- [x] The owner can transfer ownership to another active member; the new owner becomes `ownerId` and the first entry of `memberIds`; the old owner stays as a regular member
- [x] The owner cannot leave without transferring ownership first; the group always has exactly one owner
- [x] Only the owner can transfer; the target must be an active member and cannot be the owner
- [x] Record `member-left`, `member-removed` and `owner-transferred` in the group history (TICKET-011)
- [x] Revoke the former member's access on leave/removal; past expenses stay in the ledger and their zero net keeps the remaining balances unchanged
- [x] Add Firestore rules: a member can remove themselves, the owner can remove another member, and the owner can transfer ownership and reorder `memberIds` with the same member set
- [x] Add tests for the zero-balance guard, leave, owner removal, transfer, invitation creation after a transfer and the rules compilation

## Acceptance Criteria
- [x] A member with a zero balance can leave and immediately loses access to the group, its expenses and its history
- [x] A member with a non-zero balance cannot leave or be removed until they settle
- [x] The owner can transfer ownership; the new owner can edit the group, invite and remove members, and the old owner can leave after settling
- [x] The group always has exactly one owner, and the owner cannot leave without transferring
- [x] Non-members cannot read or modify the group, its expenses, balances or history
- [x] The history records every leave, removal and transfer with actor, date and affected member

## Implemented

### Creator vs current owner
- `groups` carries an immutable `createdBy` (creator uid) next to `ownerId`:
  create writes `createdBy = ownerId = creator`, the metadata allow-list keeps
  it immutable, and the mapper validates the id prefix against `createdBy` with
  an `ownerId` fallback for groups created before the ticket
  (`features/groups/repositories/groups.mapper.ts`). A transferred group keeps
  loading because the prefix stays tied to the creator.

### Zero-balance guard
- `IGroupBalancePort` (`features/groups/services/group-balance.port.ts`) returns
  the member's non-zero nets per currency; it is implemented in
  `features/group-expenses/repositories/firebase-group-balance.port.ts` over
  `calculateGroupNetBalances` + `getMemberNetBalances`, so the guard and the
  balances screen read the same engine.
- `assertGroupMemberSettled` (`group-balance.guard.ts`) rejects leave and
  removal with `BALANCE_NOT_SETTLED` before any write. The ledger read happens
  outside the write transaction: an accepted race of the same class as the
  settlement bound, which can only let a stale-but-zero member through, never
  orphan a stored debt silently.

### Leave, removal and transfer
- Leave: a non-owner leaves from the group detail with confirmation; the owner
  gets `CANNOT_REMOVE_OWNER` and the UI hint to transfer first.
- Balance-safe removal: the existing owner removal action reuses the same guard.
- Ownership transfer: owner-only, target must be an active non-owner
  (`INVALID_OWNERSHIP_TARGET`); `ownerId` moves, `memberIds` is reordered
  owner-first with the same set, the old owner stays a member and the group keeps
  exactly one owner (`group-owner-transfer.operation.ts`,
  `group-member-leave.operation.ts`, `group-member-remove.operation.ts`).
- Activity events `member-left`, `member-removed` and `owner-transferred` are
  written in the same transaction, with the display-name snapshot where the
  member leaves (TICKET-011).

### Join code and invitations after a transfer
- The `groupCodes` projection follows the new owner inside the transfer commit,
  so the promoted owner can rename the group and receive join requests.
- The invitation-create rule accepts the current owner as a fallback to the id
  prefix (`isOwnedGroupId(...)` OR the live `groups` document's `ownerId`), so a
  promoted owner invites without the prefix; the creator keeps the batched fast
  path.
- Post-transfer invitation lifecycle: the invitation mapper no longer requires
  the id prefix to match `inviterId`, `getGroupInvitations` queries by `groupId`,
  and the current owner can list, cancel, rename-propagate and reopen the group's
  invitations. The accept rule no longer requires the stored inviter to be the
  current owner. Reopening after a transfer rewrites `inviterId`/`pairId` and
  re-checks the new friendship (`group-invitation.operations.ts`).
- Rule branches added: `isGroupOwner`, participant-or-owner invitation reads,
  owner-only cancel/rename/reopen, self-removal and ownership-transfer group
  updates.

### UI
- Non-owner **Salir del grupo** with a confirmation dialog; the owner sees the
  hint that ownership must be transferred first.
- Owner-only key action on each member row to transfer ownership, next to the
  existing removal action (`group-member-actions.tsx`).
- Blocked-balance dialog listing the outstanding amount and direction per
  currency, with a **Liquidar** confirm that opens the group settle route; the
  existing removal reuses the same guard.
- After leaving, the sheet closes and the app returns to Social.

### Accepted limitation
- A former owner who later leaves keeps read access to the invitation rows they
  created, because invitation reads check the stored inviter as a participant.
  Pre-existing and narrow; the history and the group itself stay member-only.
- No notifications for membership events: the history is the audit trail.

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

## Technical Notes
- **Balance guard:** the service computes the member's net balance per currency with TICKET-010's `calculateNetBalances` (active expenses + settlements). Any non-zero currency blocks the action with `BALANCE_NOT_SETTLED`; the UI shows the amount and direction and opens the group settlement flow. Rules cannot sum a ledger, so the guard stays in the service; the rules only enforce who may change `memberIds`. A hand-crafted client could bypass the service guard because the rules cannot sum the ledger; this is an accepted V1 trade-off, and a future membership-request/owner-approval flow could close it.
- **Leave vs removal:** the group update rule currently allows only the owner to remove a member. Add a self-removal branch: `request.auth.uid` is the removed uid, the diff is `memberIds`/`updatedAt`, size is old − 1, the old list contains the new one, the owner remains and `hasGroupMembers` still passes. The owner removal branch stays. The service checks the zero balance before either write.
- **Ownership transfer:** add an owner-only update branch: `resource.data.ownerId == request.auth.uid`, the new `ownerId` is in the old `memberIds`, the new `memberIds` has the same set reordered with the new owner first, size unchanged, `updatedAt` is a string, and `createdAt` is immutable. The old owner remains in `memberIds`. The UI asks for confirmation and explains that the new owner will be able to edit, invite and remove.
- **Creator vs current owner:** the group id is owner-namespaced at creation (`${creatorId}__${autoId}`). After a transfer the current `ownerId` is no longer the id prefix. Add an immutable `createdBy` field to `groups` (creator uid), keep the id prefix tied to `createdBy`, and make the mapper validate the prefix against `createdBy` (fallback to `ownerId` only for unreleased groups before the field exists). The group create writes `createdBy = ownerId = creator`; the update rules keep `createdBy` immutable.
- **Invitations after transfer:** the invitation create rule currently proves ownership through the id prefix. Add a fallback for the current owner: `isOwnedGroupId(groupId, request.auth.uid)` OR `get(group).data.ownerId == request.auth.uid`. The original creator keeps the 19-invite batch (prefix short-circuit, one friendship read per invitation); a transferred owner performs one group read plus one friendship read per invitation, so the service creates those invitations sequentially (single-document writes) instead of a 19-invite batch. The notification create rule already reads the group and checks `ownerId`, so it works for the new owner.
- **Rules language:** keep the function bodies as single expressions, use `get`/`getAfter` as above and validate with `npx firebase deploy --only firestore:rules --dry-run`. The group rules' field allow-list gains `createdBy`; the transfer branch must not allow changing `createdAt`, `createdBy` or the group id.
- **History:** append `member-left`, `member-removed` and `owner-transferred` events (actor, target, timestamp). The history stays member-only, so a member who leaves loses access; the remaining members keep the record.
- **Notifications:** out of scope for this ticket; the history is the audit trail. A future ticket can notify the removed member or the promoted owner through the existing inbox.
- **No group deletion:** deleting a group is out of scope. The owner must transfer ownership or keep the group; an empty group can stay with its owner.
- **No migration:** groups are unreleased and the rules are not deployed. Add `createdBy` and `simplifyDebts` (TICKET-010) now; the mapper fallbacks cover any local test data.
- Decision record: `session-notes/2026-11-20-group-expenses-and-membership-decisions.md`.

## Dependencies
- TICKET-008 Groups (membership, rules, group document)
- TICKET-010 Group balances and settlements (zero-balance guard and the settlement flow)
- TICKET-011 Group history (membership events)
