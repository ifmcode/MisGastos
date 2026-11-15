import type { IFriendsRepository } from "../repositories/friends.repository";
import { validateFriendEmail } from "../schemas/friend.schema";
import type { FriendSearchResult } from "../types/friend.types";
import { requireViewerId } from "./friend-guards";
import { FriendValidationError } from "./friend.errors";
import { resolveFriendRelation } from "./friend-relation";

/**
 * Exact-email search with the relation already resolved, so the UI can show
 * "add", "pending" or "already friends" without a second query. Returned
 * emails are the stored normalized value.
 */
export async function searchFriendByEmail(
  repository: IFriendsRepository,
  viewerUid: string,
  email: string,
): Promise<FriendSearchResult | null> {
  const viewer = requireViewerId(viewerUid);
  const validation = validateFriendEmail(email);
  if (!validation.ok) throw new FriendValidationError(validation.error);

  const profile = await repository.findPublicProfileByEmail(validation.value);
  if (!profile) return null;

  if (profile.uid === viewer) {
    return { profile, relation: "self", requestId: null };
  }

  const [friendships, requests] = await Promise.all([
    repository.getFriendships(viewer),
    repository.getFriendRequests(viewer),
  ]);
  const match = resolveFriendRelation(viewer, profile.uid, {
    friendships,
    requests,
  });

  return { profile, relation: match.relation, requestId: match.requestId };
}
