import { describe, expect, it } from "@jest/globals";

import { buildNotification } from "../../repositories/__tests__/notifications.fixtures";
import {
  countUnreadNotifications,
  isNotificationType,
  resolveNotificationTarget,
  sortNotifications,
} from "../notifications.utils";

describe("isNotificationType", () => {
  it("accepts only the settlement events", () => {
    expect(isNotificationType("settlement-created")).toBe(true);
    expect(isNotificationType("settlement-updated")).toBe(true);
    expect(isNotificationType("settlement-deleted")).toBe(true);
    expect(isNotificationType("friend-request")).toBe(false);
    expect(isNotificationType(42)).toBe(false);
  });
});

describe("sortNotifications", () => {
  it("puts unread first, then newest, then id", () => {
    const sorted = sortNotifications([
      buildNotification({
        id: "b",
        readAt: null,
        createdAt: "2026-11-10T10:00:00.000Z",
      }),
      buildNotification({
        id: "a",
        readAt: null,
        createdAt: "2026-11-12T10:00:00.000Z",
      }),
      buildNotification({
        id: "c",
        readAt: "2026-11-16T10:00:00.000Z",
        createdAt: "2026-11-16T10:00:00.000Z",
      }),
      buildNotification({
        id: "d",
        readAt: "",
        createdAt: "2026-11-11T10:00:00.000Z",
      }),
    ]);

    expect(sorted.map((notification) => notification.id)).toEqual([
      "a",
      "d",
      "b",
      "c",
    ]);
  });

  it("keeps the input untouched", () => {
    const notifications = [buildNotification()];

    sortNotifications(notifications);

    expect(notifications[0].id).toBe("settlement-1:created:user-b");
  });
});

describe("countUnreadNotifications", () => {
  it("counts only notifications without readAt", () => {
    expect(
      countUnreadNotifications([
        buildNotification({ readAt: null }),
        buildNotification({ readAt: "" }),
        buildNotification({ readAt: "2026-11-16T10:00:00.000Z" }),
      ]),
    ).toBe(2);
    expect(countUnreadNotifications([])).toBe(0);
  });
});

describe("resolveNotificationTarget", () => {
  it("opens the settlement detail for a settlement event", () => {
    expect(resolveNotificationTarget(buildNotification())).toEqual({
      kind: "settlement",
      settlementId: "settlement-1",
    });
  });

  it("falls back to the friend when no settlement id is present", () => {
    expect(
      resolveNotificationTarget(
        buildNotification({ payload: { friendUid: "user-a" } }),
      ),
    ).toEqual({ kind: "friend", friendUid: "user-a" });
  });

  it("uses the friend fallback for an unknown type", () => {
    expect(
      resolveNotificationTarget(
        buildNotification({ type: "friend-request" as never }),
      ),
    ).toEqual({ kind: "friend", friendUid: "user-a" });
  });

  it("returns null without a usable target", () => {
    expect(resolveNotificationTarget(buildNotification({ payload: {} }))).toBeNull();
    expect(
      resolveNotificationTarget(
        buildNotification({ payload: { settlementId: "  " } }),
      ),
    ).toBeNull();
  });
});
