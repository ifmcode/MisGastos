import { beforeEach, describe, expect, it } from "@jest/globals";

import { buildNotification } from "../../repositories/__tests__/notifications.fixtures";
import { NotificationsService } from "../notifications.service";
import { getNotificationErrorCode } from "../notification.errors";
import { FakeNotificationsRepository } from "./notifications.fakes";

let repository: FakeNotificationsRepository;
let service: NotificationsService;

beforeEach(() => {
  repository = new FakeNotificationsRepository();
  service = new NotificationsService(repository);
});

describe("getNotifications", () => {
  it("returns the owner list unread-first", async () => {
    repository.notifications = [
      buildNotification({
        id: "read",
        readAt: "2026-11-16T11:00:00.000Z",
        createdAt: "2026-11-16T12:00:00.000Z",
      }),
      buildNotification({ id: "unread", createdAt: "2026-11-10T10:00:00.000Z" }),
      buildNotification({ id: "foreign", userId: "user-c" }),
    ];

    const notifications = await service.getNotifications("user-b");

    expect(notifications.map((notification) => notification.id)).toEqual([
      "unread",
      "read",
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
        buildNotification({ readAt: "2026-11-16T11:00:00.000Z" }),
      ]),
    ).toBe(1);
  });
});

describe("markRead", () => {
  it("marks an unread own notification", async () => {
    repository.notifications = [buildNotification()];

    await service.markRead(
      "user-b",
      "settlement-1:created:user-b",
      "2026-11-16T11:00:00.000Z",
    );

    expect(repository.marked).toEqual([
      { id: "settlement-1:created:user-b", readAt: "2026-11-16T11:00:00.000Z" },
    ]);
  });

  it("is idempotent for an already read notification", async () => {
    repository.notifications = [
      buildNotification({ readAt: "2026-11-16T11:00:00.000Z" }),
    ];

    await service.markRead(
      "user-b",
      "settlement-1:created:user-b",
      "2026-11-16T12:00:00.000Z",
    );

    expect(repository.marked).toEqual([]);
  });

  it("rejects a blank viewer, a blank id and a missing notification", async () => {
    await expect(
      service.markRead("", "id", "2026-11-16T11:00:00.000Z"),
    ).rejects.toMatchObject({ code: "SIGN_IN_REQUIRED" });
    await expect(
      service.markRead("user-b", "   ", "2026-11-16T11:00:00.000Z"),
    ).rejects.toMatchObject({ code: "NOTIFICATION_NOT_FOUND" });
    await expect(
      service.markRead("user-b", "missing", "2026-11-16T11:00:00.000Z"),
    ).rejects.toMatchObject({ code: "NOTIFICATION_NOT_FOUND" });
  });

  it("rejects another owner's notification", async () => {
    repository.notifications = [buildNotification({ userId: "user-c" })];

    await expect(
      service.markRead(
        "user-b",
        "settlement-1:created:user-b",
        "2026-11-16T11:00:00.000Z",
      ),
    ).rejects.toMatchObject({ code: "NOT_OWNER" });
  });
});

describe("createNotification", () => {
  it("delegates to the repository", async () => {
    const input = {
      userId: "user-b",
      type: "settlement-created" as const,
      payload: { settlementId: "settlement-1" },
      dedupeKey: "settlement-1:created:user-b",
      createdAt: "2026-11-16T10:00:00.000Z",
    };

    await service.createNotification(input);

    expect(repository.created).toEqual([input]);
  });
});

describe("getNotificationErrorCode", () => {
  it("maps domain codes, Firebase codes and the fallback", () => {
    expect(
      getNotificationErrorCode(
        Object.assign(new Error(""), { code: "NOT_OWNER" }),
      ),
    ).toBe("LOAD_FAILED");

    const domainError = { name: "NotificationOperationError", code: "NOT_OWNER" };
    expect(getNotificationErrorCode(domainError, "SAVE_FAILED")).toBe(
      "SAVE_FAILED",
    );
    expect(
      getNotificationErrorCode(
        Object.assign(new Error("x"), { code: "permission-denied" }),
      ),
    ).toBe("PERMISSION_DENIED");
    expect(
      getNotificationErrorCode(
        Object.assign(new Error("x"), { code: "unavailable" }),
      ),
    ).toBe("NETWORK");
    expect(getNotificationErrorCode(new Error("boom"), "SAVE_FAILED")).toBe(
      "SAVE_FAILED",
    );
  });

  it("maps a NotificationOperationError by its code", async () => {
    try {
      await service.getNotifications("");
    } catch (error) {
      expect(getNotificationErrorCode(error)).toBe("SIGN_IN_REQUIRED");
    }
  });
});
