import { beforeEach, describe, expect, it } from "@jest/globals";

import { buildNotification } from "../../repositories/__tests__/notifications.fixtures";
import { NotificationsService } from "../notifications.service";
import { FakeNotificationsRepository } from "./notifications.fakes";

let repository: FakeNotificationsRepository;
let service: NotificationsService;

const seen = "2026-11-16T10:30:00.000Z";
const opened = "2026-11-16T11:00:00.000Z";
const id = "settlement-1:created:user-b";

beforeEach(() => {
  repository = new FakeNotificationsRepository();
  service = new NotificationsService(repository);
});

describe("markSeen", () => {
  it("writes only seenAt, leaving the row unread", async () => {
    repository.notifications = [buildNotification()];

    await service.markSeen("user-b", id, seen);

    expect(repository.seen).toEqual([{ id, seenAt: seen }]);
    expect(repository.marked).toEqual([]);
  });

  it("is a no-op for an already presented notification", async () => {
    repository.notifications = [buildNotification({ seenAt: seen })];

    await service.markSeen("user-b", id, opened);

    expect(repository.seen).toEqual([]);
  });

  it("rejects a blank viewer, a blank id and a missing notification", async () => {
    await expect(service.markSeen("", id, seen)).rejects.toMatchObject({
      code: "SIGN_IN_REQUIRED",
    });
    await expect(service.markSeen("user-b", "   ", seen)).rejects.toMatchObject({
      code: "NOTIFICATION_NOT_FOUND",
    });
    await expect(
      service.markSeen("user-b", null as never, seen),
    ).rejects.toMatchObject({ code: "NOTIFICATION_NOT_FOUND" });
    await expect(
      service.markSeen("user-b", "missing", seen),
    ).rejects.toMatchObject({ code: "NOTIFICATION_NOT_FOUND" });
  });

  it("rejects another owner's notification", async () => {
    repository.notifications = [buildNotification({ userId: "user-c" })];

    await expect(service.markSeen("user-b", id, seen)).rejects.toMatchObject({
      code: "NOT_OWNER",
    });
    expect(repository.seen).toEqual([]);
  });
});

describe("markAllRead", () => {
  it("stamps only Pendientes, preserves readAt and returns the count", async () => {
    repository.notifications = [
      buildNotification({ id: "pending" }),
      buildNotification({ id: "pending-read", readAt: opened }),
      buildNotification({ id: "viewed", seenAt: seen }),
      buildNotification({ id: "foreign", userId: "user-c" }),
    ];

    await expect(service.markAllRead("user-b", opened)).resolves.toBe(2);

    expect(repository.marked).toEqual([
      { id: "pending", readAt: opened, seenAt: opened },
      { id: "pending-read", readAt: opened, seenAt: opened },
    ]);
  });

  it("returns zero without writes when nothing is Pendiente", async () => {
    repository.notifications = [buildNotification({ seenAt: seen })];

    await expect(service.markAllRead("user-b", opened)).resolves.toBe(0);
    expect(repository.marked).toEqual([]);
  });

  it("rejects a blank or non-string viewer", async () => {
    await expect(service.markAllRead("", opened)).rejects.toMatchObject({
      code: "SIGN_IN_REQUIRED",
    });
    await expect(
      service.markAllRead(null as never, opened),
    ).rejects.toMatchObject({ code: "SIGN_IN_REQUIRED" });
  });
});
