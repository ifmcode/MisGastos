import type { IFriendLedgerRepository } from "../repositories/friend-ledger.repository";
import type { IFriendsRepository } from "../repositories/friends.repository";
import type { FriendsOverview } from "../types/friend.types";
import { buildFriendsOverview, collectOverviewProfileIds } from "./friend-overview";

/** Loads every source of the friends screen and folds them into one view. */
export async function loadFriendsOverview(
  repository: IFriendsRepository,
  ledgerRepository: IFriendLedgerRepository,
  viewerUid: string,
): Promise<FriendsOverview> {
  const [friendships, requests, ledgerEntries] = await Promise.all([
    repository.getFriendships(viewerUid),
    repository.getFriendRequests(viewerUid),
    ledgerRepository.getEntries(viewerUid),
  ]);
  const profileIds = collectOverviewProfileIds(
    viewerUid,
    friendships,
    requests,
  );
  const profiles =
    profileIds.length > 0
      ? await repository.getPublicProfiles(profileIds)
      : [];

  return buildFriendsOverview({
    viewerUid,
    friendships,
    requests,
    profiles,
    ledgerEntries,
  });
}
