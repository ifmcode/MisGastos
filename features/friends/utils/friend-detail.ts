import type { CurrencyCode } from "@/shared/constants/currencies";

import type { Friend } from "../types/friend.types";
import { centsToAmount, getFriendBalanceDirection } from "./friend-balance";
import { getFriendDisplayName } from "./friend-display";

/** One debt line of the friend header: never added to another currency. */
export interface FriendDetailBalanceLine {
  currency: CurrencyCode;
  /** Positive decimal amount; the direction carries the sign. */
  amount: number;
  direction: "friend-owes-viewer" | "viewer-owes-friend";
}

/** Everything the friend detail header renders, derived from the overview. */
export interface FriendDetailHeader {
  uid: string;
  name: string;
  /** Normalized email; may be empty when the public profile has none. */
  email: string;
  /** Friendship creation date; empty when the document has no stamp. */
  since: string;
  /** One line per settled debt, in `Friend.balances[]` order (EUR first). */
  balances: FriendDetailBalanceLine[];
}

/**
 * Resolves the friend of a route uid against the loaded overview. The uid is
 * only an application id: it never builds a Firestore path.
 */
export function findFriendByUid(
  friends: readonly Friend[],
  uid: string,
): Friend | null {
  const target = uid.trim();
  if (target.length === 0) return null;

  return friends.find((friend) => friend.uid === target) ?? null;
}

/**
 * Summarizes the friend header. Balances reuse the stored per-currency nets:
 * they are neither converted nor aggregated and zero nets are dropped, so a EUR
 * debt and a USD debt stay two independent lines.
 */
export function getFriendDetailHeader(friend: Friend): FriendDetailHeader {
  const balances = friend.balances
    .filter((balance) => balance.netBalanceCents !== 0)
    .map<FriendDetailBalanceLine>((balance) => {
      const direction = getFriendBalanceDirection(balance.netBalanceCents);

      return {
        currency: balance.currency,
        amount: Math.abs(centsToAmount(balance.netBalanceCents)),
        direction:
          direction === "friend-owes-viewer"
            ? "friend-owes-viewer"
            : "viewer-owes-friend",
      };
    });

  return {
    uid: friend.uid,
    name: getFriendDisplayName(friend),
    email: friend.email.trim(),
    since: friend.since,
    balances,
  };
}
