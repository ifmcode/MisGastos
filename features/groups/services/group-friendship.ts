import type { IFriendsRepository } from "@/features/friends/repositories/friends.repository";
import type { PublicProfile } from "@/features/friends/types/friend.types";

import { getFriendUids } from "../utils/group-membership";
import { GroupOperationError } from "./group.errors";

/** Accepted friends of the viewer, resolved from the friendship pairs. */
export async function loadFriendUids(
  friendsRepository: IFriendsRepository,
  viewerUid: string,
): Promise<string[]> {
  const friendships = await friendsRepository.getFriendships(viewerUid);

  return getFriendUids(friendships, viewerUid);
}

/** Every invitee must already be an accepted friend of the inviter. */
export function assertInviteesAreFriends(
  inviteeIds: readonly string[],
  friendUids: readonly string[],
): void {
  for (const inviteeId of inviteeIds) {
    if (!friendUids.includes(inviteeId)) {
      throw new GroupOperationError("NOT_FRIEND");
    }
  }
}

/** Acceptance and re-invite still require a live friendship document. */
export async function assertFriendshipExists(
  friendsRepository: IFriendsRepository,
  pairId: string,
): Promise<void> {
  const id = typeof pairId === "string" ? pairId.trim() : "";
  const friendship = id.length > 0
    ? await friendsRepository.getFriendship(id)
    : null;

  if (!friendship) throw new GroupOperationError("NOT_FRIEND");
}

/** One read for the whole batch, keyed by uid; unknown uids are absent. */
export function toProfileMap(
  profiles: readonly PublicProfile[],
): Map<string, PublicProfile> {
  return new Map(profiles.map((profile) => [profile.uid, profile]));
}

export async function loadProfilesByUid(
  friendsRepository: IFriendsRepository,
  uids: readonly string[],
): Promise<Map<string, PublicProfile>> {
  const unique = [...new Set(uids.map((uid) => uid.trim()))].filter(
    (uid) => uid.length > 0,
  );

  if (unique.length === 0) return new Map();

  const profiles = await friendsRepository.getPublicProfiles(unique);

  return toProfileMap(profiles);
}
