import type { IFriendsRepository } from "@/features/friends/repositories/friends.repository";

import type { IGroupNotificationPort } from "../repositories/group-notification.port";
import type { IGroupsRepository } from "../repositories/groups.repository";

/** Collaborators of every group write; all of them are interfaces. */
export interface GroupWriteDeps {
  repository: IGroupsRepository;
  friendsRepository: IFriendsRepository;
  notifications: IGroupNotificationPort;
}

export interface GroupReadDeps {
  repository: IGroupsRepository;
  friendsRepository: IFriendsRepository;
}
