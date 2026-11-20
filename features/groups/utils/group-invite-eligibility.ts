import type { Friend } from "@/features/friends/types/friend.types";

import {
  GROUP_MAX_MEMBERS,
  type GroupInvitationItem,
} from "../types/group.types";
import { isEligibleGroupInvitee } from "./group-membership";

export interface GroupInviteePoolOptions {
  viewerUid: string;
  memberIds: readonly string[];
  /** Pending invitations of the group; their invitees are already invited. */
  invitations: readonly GroupInvitationItem[];
}

/** Accepted friends outside the group and without a pending invitation. */
export function getGroupInviteePool(
  friends: readonly Friend[],
  { viewerUid, memberIds, invitations }: GroupInviteePoolOptions,
): Friend[] {
  const friendUids = friends.map((friend) => friend.uid);
  const pendingInviteeIds = invitations.map(
    (item) => item.invitation.inviteeId,
  );

  return friends.filter(
    (friend) =>
      isEligibleGroupInvitee(friend.uid, {
        viewerUid,
        memberIds,
        friendUids,
      }) && !pendingInviteeIds.includes(friend.uid),
  );
}

/**
 * Free seats of a group: 20 members including the owner, minus the invitations
 * already pending. A pending invitation holds a reserved seat, so the owner can
 * never queue more invitations than the group can honour.
 */
export function getGroupInviteCapacity(
  memberIds: readonly string[],
  pendingCount = 0,
): number {
  return Math.max(GROUP_MAX_MEMBERS - memberIds.length - pendingCount, 0);
}
