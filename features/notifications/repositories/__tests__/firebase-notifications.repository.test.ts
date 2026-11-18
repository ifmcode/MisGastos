import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/notifications.operations", () => ({
  NOTIFICATIONS_COLLECTION: "notifications",
  getNotificationOperation: jest.fn(async () => "read-one"),
  getNotificationsOperation: jest.fn(async () => ["read-many"]),
  createNotificationOperation: jest.fn(async () => "created"),
  markNotificationSeenOperation: jest.fn(async () => undefined),
  markNotificationReadOperation: jest.fn(async () => undefined),
  listenNotificationsOperation: jest.fn(() => "unsubscribe"),
}));

import {
  createNotificationOperation,
  getNotificationOperation,
  getNotificationsOperation,
  listenNotificationsOperation,
  markNotificationReadOperation,
  markNotificationSeenOperation,
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
  const onChange = jest.fn();
  const onError = jest.fn();

  it("delegates every call to the Firestore operations", async () => {
    await expect(repository.getNotifications("user-b")).resolves.toEqual([
      "read-many",
    ]);
    await expect(repository.getNotification("id")).resolves.toBe("read-one");
    await expect(repository.createNotification(input)).resolves.toBe("created");
    await repository.markNotificationSeen("id", "seen");
    await repository.markNotificationRead("id", "now", "seen");

    expect(repository.listenNotifications("user-b", onChange, onError)).toBe(
      "unsubscribe",
    );

    expect(getNotificationsOperation).toHaveBeenCalledWith("user-b");
    expect(getNotificationOperation).toHaveBeenCalledWith("id");
    expect(createNotificationOperation).toHaveBeenCalledWith(input);
    expect(markNotificationSeenOperation).toHaveBeenCalledWith("id", "seen");
    expect(markNotificationReadOperation).toHaveBeenCalledWith(
      "id",
      "now",
      "seen",
    );
    expect(listenNotificationsOperation).toHaveBeenCalledWith(
      "user-b",
      onChange,
      onError,
    );
  });

  it("forwards a listener without an error handler", () => {
    repository.listenNotifications("user-b", onChange);

    expect(listenNotificationsOperation).toHaveBeenCalledWith(
      "user-b",
      onChange,
      undefined,
    );
  });
});
