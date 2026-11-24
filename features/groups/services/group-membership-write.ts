import type { Group } from "../types/group.types";
import { isGroupMember } from "../utils/group-membership";
import { assertGroupMemberSettled } from "./group-balance.guard";
import type { GroupWriteDeps } from "./group-deps";
import { GroupOperationError } from "./group.errors";
import { loadProfilesByUid } from "./group-friendship";
import {
  assertGroupMember,
  assertGroupOwner,
  requireGroup,
} from "./group-guards";

/** One read for the snapshot the history event keeps after the member leaves. */
async function loadMemberName(
  deps: GroupWriteDeps,
  uid: string,
): Promise<string | null> {
  const profiles = await loadProfilesByUid(deps.friendsRepository, [uid]);

  return profiles.get(uid)?.displayName ?? null;
}

/**
 * Owner removal is balance-safe since TICKET-068: the target's net must be zero
 * in every currency, otherwise the removal is blocked with `BALANCE_NOT_SETTLED`
 * and nothing is written. The guard runs before the transaction (rules cannot
 * sum the ledger).
 */
export async function removeGroupMemberRecord(
  deps: GroupWriteDeps,
  viewerUid: string,
  groupId: string,
  memberId: string,
): Promise<Group> {
  const group = await requireGroup(deps.repository, groupId);
  assertGroupOwner(group, viewerUid);
  const target = typeof memberId === "string" ? memberId.trim() : "";
  if (target.length === 0) throw new GroupOperationError("MEMBER_NOT_FOUND");
  // A non-member has no ledger row: fail before the balance read.
  if (!isGroupMember(group.memberIds, target)) {
    throw new GroupOperationError("MEMBER_NOT_FOUND");
  }

  await assertGroupMemberSettled(deps.balances, group.id, target);

  return deps.repository.removeMember({
    groupId: group.id,
    actorId: viewerUid,
    memberId: target,
    targetName: await loadMemberName(deps, target),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * A non-owner leaves by themselves. The owner must transfer ownership first,
 * which reuses `CANNOT_REMOVE_OWNER`: its copy already explains that the owner
 * cannot leave. A non-zero net in any currency blocks the leave.
 */
export async function leaveGroupRecord(
  deps: GroupWriteDeps,
  viewerUid: string,
  groupId: string,
): Promise<Group> {
  const group = await requireGroup(deps.repository, groupId);
  assertGroupMember(group, viewerUid);
  if (group.ownerId === viewerUid) {
    throw new GroupOperationError("CANNOT_REMOVE_OWNER");
  }

  await assertGroupMemberSettled(deps.balances, group.id, viewerUid);

  return deps.repository.leaveGroup({
    groupId: group.id,
    memberId: viewerUid,
    targetName: await loadMemberName(deps, viewerUid),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Owner promotes one active member. Only the owner may transfer, the target
 * must belong to the group and cannot already be the owner; the old owner
 * stays as a regular member, so the group keeps exactly one owner.
 */
export async function transferGroupOwnershipRecord(
  deps: GroupWriteDeps,
  viewerUid: string,
  groupId: string,
  newOwnerId: string,
): Promise<Group> {
  const group = await requireGroup(deps.repository, groupId);
  assertGroupOwner(group, viewerUid);
  const target = typeof newOwnerId === "string" ? newOwnerId.trim() : "";

  if (
    target.length === 0 ||
    target === group.ownerId ||
    !isGroupMember(group.memberIds, target)
  ) {
    throw new GroupOperationError("INVALID_OWNERSHIP_TARGET");
  }

  return deps.repository.transferOwnership({
    groupId: group.id,
    actorId: viewerUid,
    newOwnerId: target,
    updatedAt: new Date().toISOString(),
  });
}
