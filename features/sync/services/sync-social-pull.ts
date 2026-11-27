import { FirebaseFriendsRepository } from "@/features/friends/repositories/firebase-friends.repository";
import {
  cacheFriendRequests,
  cacheFriendships,
  cachePublicProfiles,
} from "@/features/friends/repositories/local-friends.cache";
import { FirebaseGroupsRepository } from "@/features/groups/repositories/firebase-groups.repository";
import { cacheGroups } from "@/features/groups/repositories/local-groups.cache";
import { FirebaseGroupExpensesRepository } from "@/features/group-expenses/repositories/firebase-group-expenses.repository";
import { FirebaseGroupSettlementsRepository } from "@/features/group-expenses/repositories/firebase-group-settlements.repository";
import { cacheGroupExpenses } from "@/features/group-expenses/repositories/local-group-expense.cache";
import { cacheGroupSettlements } from "@/features/group-expenses/repositories/local-group-settlement.cache";
import { FirebaseSharedExpensesRepository } from "@/features/shared-expenses/repositories/firebase-shared-expenses.repository";
import { cacheSharedExpenses } from "@/features/shared-expenses/repositories/local-shared-expense.cache";
import { FirebaseSettlementsRepository } from "@/features/settlements/repositories/firebase-settlements.repository";
import { cacheSettlements } from "@/features/settlements/repositories/local-settlement.cache";

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

/**
 * Owner-scoped pull of the social lookups and movements (ADR §5.4). Friendships,
 * requests, profiles, groups and the four movement collections are mirrored so
 * the group and friend screens open offline. Group invitations and activity stay
 * online-managed and are cached on demand.
 */
export async function pullSocialData(ownerId: string): Promise<void> {
  const now = new Date().toISOString();
  const friends = new FirebaseFriendsRepository();
  const groupsRepository = new FirebaseGroupsRepository();

  const [friendships, requests, groups] = await Promise.all([
    friends.getFriendships(ownerId),
    friends.getFriendRequests(ownerId),
    groupsRepository.getGroups(ownerId),
  ]);

  await cacheFriendships(ownerId, friendships, now);
  await cacheFriendRequests(ownerId, requests, now);
  await cacheGroups(ownerId, groups, now);

  const sharedExpenses = new FirebaseSharedExpensesRepository();
  const settlements = new FirebaseSettlementsRepository();

  const [expenses, settlementRows] = await Promise.all([
    sharedExpenses.getExpenses(ownerId),
    settlements.getSettlements(ownerId),
  ]);

  await cacheSharedExpenses(ownerId, expenses, now);
  await cacheSettlements(ownerId, settlementRows, now);

  const profileIds = unique([
    ...friendships.flatMap((friendship) => friendship.memberIds),
    ...requests.flatMap((request) => request.participantIds),
    ...groups.flatMap((group) => group.memberIds),
  ]);
  const profiles = profileIds.length
    ? await friends.getPublicProfiles(profileIds)
    : [];
  await cachePublicProfiles(ownerId, profiles, now);

  await pullGroupMovements(ownerId, groups.map((group) => group.id), now);
}

async function pullGroupMovements(
  ownerId: string,
  groupIds: readonly string[],
  now: string,
): Promise<void> {
  const expensesRepository = new FirebaseGroupExpensesRepository();
  const settlementsRepository = new FirebaseGroupSettlementsRepository();

  const results = await Promise.allSettled(
    groupIds.map(async (groupId) => {
      const [expenses, settlements] = await Promise.all([
        expensesRepository.getGroupExpenses(groupId),
        settlementsRepository.getGroupSettlements(groupId),
      ]);

      await cacheGroupExpenses(ownerId, groupId, expenses, now);
      await cacheGroupSettlements(ownerId, groupId, settlements, now);
    }),
  );

  // A group that cannot be read must not prevent the other groups from being
  // cached, but the cycle still reports the failure.
  const failed = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failed) throw failed.reason;
}
