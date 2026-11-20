import { FirebaseFriendsRepository } from "@/features/friends/repositories/firebase-friends.repository";
import { FirebaseNotificationsRepository } from "@/features/notifications/repositories/firebase-notifications.repository";

import { FirebaseGroupNotificationPort } from "../repositories/firebase-group-notification.port";
import { FirebaseGroupsRepository } from "../repositories/firebase-groups.repository";
import { GroupsService } from "./groups.service";

let groupsServiceInstance: GroupsService | null = null;

/** Wire the Firebase implementations once; hooks share the instance. */
export function getGroupsService(): GroupsService {
  if (!groupsServiceInstance) {
    groupsServiceInstance = new GroupsService(
      new FirebaseGroupsRepository(),
      new FirebaseFriendsRepository(),
      new FirebaseGroupNotificationPort(new FirebaseNotificationsRepository()),
    );
  }

  return groupsServiceInstance;
}
