import { FakeFriendsRepository } from "@/features/friends/services/__tests__/friends-service.fakes";

import { GroupsService } from "../groups.service";
import {
  FakeGroupNotificationPort,
  FakeGroupsRepository,
} from "./groups-service.fakes";

/** One service wired to fakes, with the three collaborators exposed. */
export function createGroupsHarness() {
  const repository = new FakeGroupsRepository();
  const friends = new FakeFriendsRepository();
  const notifications = new FakeGroupNotificationPort();
  const service = new GroupsService(repository, friends, notifications);

  return { repository, friends, notifications, service };
}

export function seedFriend(
  friends: FakeFriendsRepository,
  uid: string,
  name = "Bea",
): void {
  friends.seedProfile(uid, name, `${uid}@example.com`);
  friends.seedFriendship("user-a", uid);
}
