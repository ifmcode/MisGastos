import type { IFriendsRepository } from "@/features/friends/repositories/friends.repository";

import type { IGroupNotificationPort } from "../repositories/group-notification.port";
import type { IGroupsRepository } from "../repositories/groups.repository";
import type { IGroupBalancePort } from "./group-balance.port";

/** Collaborators of every group write; all of them are interfaces. */
export interface GroupWriteDeps {
  repository: IGroupsRepository;
  friendsRepository: IFriendsRepository;
  notifications: IGroupNotificationPort;
  /** Ledger read for the zero-balance membership guard (TICKET-068). */
  balances: IGroupBalancePort;
}

export interface GroupReadDeps {
  repository: IGroupsRepository;
  friendsRepository: IFriendsRepository;
}
