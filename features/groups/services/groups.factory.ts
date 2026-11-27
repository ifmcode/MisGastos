import { CachedFriendsRepository } from "@/features/friends/repositories/cached-friends.repository";
import { FirebaseFriendsRepository } from "@/features/friends/repositories/firebase-friends.repository";
import { FirebaseGroupBalancePort } from "@/features/group-expenses/repositories/firebase-group-balance.port";
import { CachedGroupExpensesRepository } from "@/features/group-expenses/repositories/cached-group-expenses.repository";
import { CachedGroupSettlementsRepository } from "@/features/group-expenses/repositories/cached-group-settlements.repository";
import { FirebaseGroupExpensesRepository } from "@/features/group-expenses/repositories/firebase-group-expenses.repository";
import { FirebaseGroupSettlementsRepository } from "@/features/group-expenses/repositories/firebase-group-settlements.repository";
import { OfflineGroupExpensesRepository } from "@/features/group-expenses/repositories/offline-group-expenses.repository";
import { OfflineGroupSettlementsRepository } from "@/features/group-expenses/repositories/offline-group-settlements.repository";
import { FirebaseNotificationsRepository } from "@/features/notifications/repositories/firebase-notifications.repository";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { FirebaseGroupNotificationPort } from "../repositories/firebase-group-notification.port";
import { CachedGroupsRepository } from "../repositories/cached-groups.repository";
import { FirebaseGroupsRepository } from "../repositories/firebase-groups.repository";
import { GroupsService } from "./groups.service";

let groupsServiceInstance: GroupsService | null = null;

/**
 * Wire the implementations once; hooks share the instance.
 *
 * The balance port lives in group-expenses (it owns the ledger) while the
 * groups service depends only on its interface, so the two features stay
 * acyclic: `groups` never imports group-expenses at module level, only this
 * composition root does. With offline-first on, the balance fold reads the
 * cached movements (pending local ones included).
 */
export function getGroupsService(): GroupsService {
  if (!groupsServiceInstance) {
    const offline = isOfflineFirstEnabled();
    const groupsRepository = offline
      ? new CachedGroupsRepository(new FirebaseGroupsRepository())
      : new FirebaseGroupsRepository();
    const friendsRepository = offline
      ? new CachedFriendsRepository(new FirebaseFriendsRepository())
      : new FirebaseFriendsRepository();
    const remoteExpenses = new FirebaseGroupExpensesRepository();
    const expensesRepository = offline
      ? new OfflineGroupExpensesRepository(
          new CachedGroupExpensesRepository(remoteExpenses),
        )
      : remoteExpenses;
    const remoteSettlements = new FirebaseGroupSettlementsRepository();
    const settlementsRepository = offline
      ? new OfflineGroupSettlementsRepository(
          new CachedGroupSettlementsRepository(remoteSettlements),
        )
      : remoteSettlements;

    groupsServiceInstance = new GroupsService(
      groupsRepository,
      friendsRepository,
      new FirebaseGroupNotificationPort(new FirebaseNotificationsRepository()),
      new FirebaseGroupBalancePort(expensesRepository, settlementsRepository),
    );
  }

  return groupsServiceInstance;
}
