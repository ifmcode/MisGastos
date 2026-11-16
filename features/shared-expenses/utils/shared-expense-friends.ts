import type { Friend } from "@/features/friends/types/friend.types";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";

/**
 * Name of one participant. Removed or unknown friends fall back to the
 * caller-provided label so a stale expense never renders an empty row.
 */
export function getSharedExpenseParticipantName(
  friends: readonly Friend[],
  uid: string,
  fallback: string,
): string {
  const friend = friends.find((item) => item.uid === uid);

  return friend ? getFriendDisplayName(friend) : fallback;
}
