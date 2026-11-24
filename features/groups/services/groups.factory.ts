import { FirebaseFriendsRepository } from "@/features/friends/repositories/firebase-friends.repository";
import { FirebaseGroupBalancePort } from "@/features/group-expenses/repositories/firebase-group-balance.port";
import { FirebaseGroupExpensesRepository } from "@/features/group-expenses/repositories/firebase-group-expenses.repository";
import { FirebaseGroupSettlementsRepository } from "@/features/group-expenses/repositories/firebase-group-settlements.repository";
import { FirebaseNotificationsRepository } from "@/features/notifications/repositories/firebase-notifications.repository";

import { FirebaseGroupNotificationPort } from "../repositories/firebase-group-notification.port";
import { FirebaseGroupsRepository } from "../repositories/firebase-groups.repository";
import { GroupsService } from "./groups.service";

let groupsServiceInstance: GroupsService | null = null;

/**
 * Wire the Firebase implementations once; hooks share the instance.
 *
 * The balance port lives in group-expenses (it owns the ledger) while the
 * groups service depends only on its interface, so the two features stay
 * acyclic: `groups` never imports group-expenses at module level, only this
 * composition root does.
 */
export function getGroupsService(): GroupsService {
  if (!groupsServiceInstance) {
    groupsServiceInstance = new GroupsService(
      new FirebaseGroupsRepository(),
      new FirebaseFriendsRepository(),
      new FirebaseGroupNotificationPort(new FirebaseNotificationsRepository()),
      new FirebaseGroupBalancePort(
        new FirebaseGroupExpensesRepository(),
        new FirebaseGroupSettlementsRepository(),
      ),
    );
  }

  return groupsServiceInstance;
}
