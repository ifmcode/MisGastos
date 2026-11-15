import type { FriendRelation } from "../types/friend.types";

export interface FriendDisplaySource {
  uid: string;
  displayName: string | null;
  email: string;
}

/**
 * Name shown for a friend, a request peer or a search hit. Public profiles store
 * the normalized email, so it is the reliable fallback when the account has no
 * display name yet; the uid keeps the row identifiable when a public profile is
 * missing entirely.
 */
export function getFriendDisplayName(source: FriendDisplaySource): string {
  const displayName = source.displayName?.trim();
  if (displayName) return displayName;

  const email = source.email.trim();
  if (email) return email;

  return source.uid;
}

/** Copy key describing how the viewer is related to a search hit. */
export type FriendRelationNoteKey =
  | "search.relationOutgoing"
  | "search.relationIncoming"
  | "search.relationFriend"
  | "search.relationSelf";

/** Only relations without an action use a note; `none` renders the button. */
export function getFriendRelationNoteKey(
  relation: Exclude<FriendRelation, "none">,
): FriendRelationNoteKey {
  switch (relation) {
    case "outgoing":
      return "search.relationOutgoing";
    case "incoming":
      return "search.relationIncoming";
    case "friend":
      return "search.relationFriend";
    case "self":
      return "search.relationSelf";
  }
}
