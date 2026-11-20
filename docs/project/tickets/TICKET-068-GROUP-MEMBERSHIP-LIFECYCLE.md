# TICKET-068 - Group Membership Lifecycle: Leave, Balance-Safe Removal and Ownership Transfer

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** TICKET-008, TICKET-010, TICKET-011, TICKET-047  
**Sprint:** Post-MVP / Phase 6

## Description
Let a member leave a group and let the owner remove a member safely, without orphaning debts. A member can only leave or be removed when their net balance is zero in every currency; otherwise they must settle first through TICKET-010. The owner can transfer ownership to another active member; the old owner becomes a regular member and can then leave once settled. The group always keeps exactly one owner.

## Requirements
- [ ] A non-owner member can leave the group from the group detail, with confirmation
- [ ] The owner can remove a member (already possible since TICKET-008) only when that member's net balance is zero in every currency
- [ ] Block leave and removal with a clear message and a **Liquidar** shortcut when any currency has a non-zero balance; show the outstanding amount and direction
- [ ] The owner can transfer ownership to another active member; the new owner becomes `ownerId` and the first entry of `memberIds`; the old owner stays as a regular member
- [ ] The owner cannot leave without transferring ownership first; the group always has exactly one owner
- [ ] Only the owner can transfer; the target must be an active member and cannot be the owner
- [ ] Record `member-left`, `member-removed` and `owner-transferred` in the group history (TICKET-011)
- [ ] Revoke the former member's access on leave/removal; past expenses stay in the ledger and their zero net keeps the remaining balances unchanged
- [ ] Add Firestore rules: a member can remove themselves, the owner can remove another member, and the owner can transfer ownership and reorder `memberIds` with the same member set
- [ ] Add tests for the zero-balance guard, leave, owner removal, transfer, invitation creation after a transfer and the rules compilation

## Acceptance Criteria
- [ ] A member with a zero balance can leave and immediately loses access to the group, its expenses and its history
- [ ] A member with a non-zero balance cannot leave or be removed until they settle
- [ ] The owner can transfer ownership; the new owner can edit the group, invite and remove members, and the old owner can leave after settling
- [ ] The group always has exactly one owner, and the owner cannot leave without transferring
- [ ] Non-members cannot read or modify the group, its expenses, balances or history
- [ ] The history records every leave, removal and transfer with actor, date and affected member

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
