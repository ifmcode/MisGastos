import type {
  FriendRequestItem,
  FriendsOverview,
} from "@/features/friends/types/friend.types";

/** Requests the viewer can still act on, split by direction. */
export interface PendingRequests {
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
  /** Single number shared by the pending row and its badge. */
  total: number;
}

type PendingRequestsSource = Pick<FriendsOverview, "incoming" | "outgoing">;

function onlyPending(
  items: readonly FriendRequestItem[],
): FriendRequestItem[] {
  return items.filter((item) => item.status === "pending");
}

/** Keeps order, drops accepted/rejected/cancelled and counts both directions. */
export function getPendingRequests(
  overview: PendingRequestsSource,
): PendingRequests {
  const incoming = onlyPending(overview.incoming);
  const outgoing = onlyPending(overview.outgoing);

  return { incoming, outgoing, total: incoming.length + outgoing.length };
}

export function countPendingRequests(
  overview: PendingRequestsSource,
): number {
  return getPendingRequests(overview).total;
}
