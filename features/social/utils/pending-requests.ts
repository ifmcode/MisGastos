import type {
  FriendRequestItem,
  FriendsOverview,
} from "@/features/friends/types/friend.types";

/** Requests the viewer can still act on, split by direction. */
export interface PendingRequests {
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
  /** Single number shared by the requests route and the inbox queue. */
  total: number;
}

type PendingRequestsSource = Pick<FriendsOverview, "incoming" | "outgoing">;

function onlyPending(
  items: readonly FriendRequestItem[],
): FriendRequestItem[] {
  return items.filter((item) => item.status === "pending");
}

/** Counts from another source never add a negative or fractional request. */
function normalizeCount(count: number): number {
  if (!Number.isFinite(count)) return 0;

  return Math.max(0, Math.trunc(count));
}

/**
 * Keeps order, drops accepted/rejected/cancelled and counts both directions
 * plus the owner join-request queue of the inbox.
 */
export function getPendingRequests(
  overview: PendingRequestsSource,
  ownerJoinRequestCount = 0,
): PendingRequests {
  const incoming = onlyPending(overview.incoming);
  const outgoing = onlyPending(overview.outgoing);

  return {
    incoming,
    outgoing,
    total:
      incoming.length +
      outgoing.length +
      normalizeCount(ownerJoinRequestCount),
  };
}
