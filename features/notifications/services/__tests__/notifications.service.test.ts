import { beforeEach, describe, expect, it } from "@jest/globals";

import { buildNotification } from "../../repositories/__tests__/notifications.fixtures";
import { NotificationsService } from "../notifications.service";
import { FakeNotificationsRepository } from "./notifications.fakes";

let repository: FakeNotificationsRepository;
let service: NotificationsService;

const seen = "2026-11-16T10:30:00.000Z";
const opened = "2026-11-16T11:00:00.000Z";

beforeEach(() => {
  repository = new FakeNotificationsRepository();
  service = new NotificationsService(repository);
});

describe("getNotifications", () => {
  it("returns the owner list newest first", async () => {
    repository.notifications = [
      buildNotification({
        id: "older-unread",
        createdAt: "2026-11-10T10:00:00.000Z",
      }),
      buildNotification({
        id: "newer-read",
        readAt: opened,
        createdAt: "2026-11-16T12:00:00.000Z",
      }),
      buildNotification({ id: "foreign", userId: "user-c" }),
    ];

    const notifications = await service.getNotifications("user-b");

    expect(notifications.map((notification) => notification.id)).toEqual([
      "newer-read",
      "older-unread",
    ]);
  });

  it("rejects a blank viewer", async () => {
    await expect(service.getNotifications("  ")).rejects.toMatchObject({
      code: "SIGN_IN_REQUIRED",
    });
  });
});

describe("countUnread", () => {
  it("counts the unread notifications", () => {
    expect(
      service.countUnread([
        buildNotification({ readAt: null }),
        buildNotification({ readAt: opened }),
      ]),
    ).toBe(1);
  });
});

describe("markRead", () => {
  it("writes both stamps in one call", async () => {
    repository.notifications = [buildNotification()];

    await service.markRead("user-b", "settlement-1:created:user-b", opened);

    expect(repository.marked).toEqual([
      { id: "settlement-1:created:user-b", readAt: opened, seenAt: opened },
    ]);
  });

  it("keeps an existing seenAt when the row was only presented", async () => {
    repository.notifications = [buildNotification({ seenAt: seen })];

    await service.markRead("user-b", "settlement-1:created:user-b", opened);

    expect(repository.marked).toEqual([
      { id: "settlement-1:created:user-b", readAt: opened, seenAt: seen },
    ]);
  });

  it("keeps an existing readAt when only seenAt is missing", async () => {
    repository.notifications = [buildNotification({ readAt: opened })];

    await service.markRead("user-b", "settlement-1:created:user-b", opened);

    expect(repository.marked).toEqual([
      { id: "settlement-1:created:user-b", readAt: opened, seenAt: opened },
    ]);
  });

  it("is a no-op when both stamps are already set", async () => {
    repository.notifications = [
      buildNotification({ seenAt: seen, readAt: opened }),
    ];

    await service.markRead("user-b", "settlement-1:created:user-b", opened);

    expect(repository.marked).toEqual([]);
  });

  it("rejects a blank viewer, a blank id, a missing record and a foreign one", async () => {
    await expect(
      service.markRead("", "id", opened),
    ).rejects.toMatchObject({ code: "SIGN_IN_REQUIRED" });
    await expect(
      service.markRead("user-b", "   ", opened),
    ).rejects.toMatchObject({ code: "NOTIFICATION_NOT_FOUND" });
    await expect(
      service.markRead("user-b", "missing", opened),
    ).rejects.toMatchObject({ code: "NOTIFICATION_NOT_FOUND" });

    repository.notifications = [buildNotification({ userId: "user-c" })];

    await expect(
      service.markRead("user-b", "settlement-1:created:user-b", opened),
    ).rejects.toMatchObject({ code: "NOT_OWNER" });
  });
});
