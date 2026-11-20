import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-groups.repository", () => ({
  FirebaseGroupsRepository: jest.fn(() => ({ kind: "groups-repository" })),
}));

const mockNotifications = { kind: "notifications-repository" };

jest.mock(
  "@/features/notifications/repositories/firebase-notifications.repository",
  () => ({
    FirebaseNotificationsRepository: jest.fn(() => mockNotifications),
  }),
);

jest.mock(
  "@/features/friends/repositories/firebase-friends.repository",
  () => ({
    FirebaseFriendsRepository: jest.fn(() => ({ kind: "friends-repository" })),
  }),
);

import { getGroupsService } from "../groups.factory";

describe("getGroupsService", () => {
  it("builds one service wired to the Firebase implementations", () => {
    const service = getGroupsService();

    expect(getGroupsService()).toBe(service);
    expect(service).toBeInstanceOf(Object);
  });
});
