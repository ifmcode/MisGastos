import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/notifications.operations", () => ({
  NOTIFICATIONS_COLLECTION: "notifications",
  getNotificationOperation: jest.fn(async () => "read-one"),
  getNotificationsOperation: jest.fn(async () => ["read-many"]),
  createNotificationOperation: jest.fn(async () => "created"),
  markNotificationReadOperation: jest.fn(async () => undefined),
}));

import {
  createNotificationOperation,
  getNotificationOperation,
  getNotificationsOperation,
  markNotificationReadOperation,
} from "../../repositories/notifications.operations";
import { FirebaseNotificationsRepository } from "../../repositories/firebase-notifications.repository";

const input = {
  userId: "user-b",
  type: "settlement-created" as const,
  payload: { settlementId: "settlement-1" },
  dedupeKey: "settlement-1:created:user-b",
  createdAt: "2026-11-16T10:00:00.000Z",
};

describe("FirebaseNotificationsRepository", () => {
  const repository = new FirebaseNotificationsRepository();

  it("delegates every call to the Firestore operations", async () => {
    await expect(repository.getNotifications("user-b")).resolves.toEqual([
      "read-many",
    ]);
    await expect(repository.getNotification("id")).resolves.toBe("read-one");
    await expect(repository.createNotification(input)).resolves.toBe("created");
    await repository.markNotificationRead("id", "now");

    expect(getNotificationsOperation).toHaveBeenCalledWith("user-b");
    expect(getNotificationOperation).toHaveBeenCalledWith("id");
    expect(createNotificationOperation).toHaveBeenCalledWith(input);
    expect(markNotificationReadOperation).toHaveBeenCalledWith("id", "now");
  });
});
