import { describe, expect, it } from "@jest/globals";

import { buildNotification } from "../../repositories/__tests__/notifications.fixtures";
import {
  countUnreadNotifications,
  getNotificationSegments,
  sortNotificationsNewestFirst,
} from "../notifications.utils";

describe("sortNotificationsNewestFirst", () => {
  it("sorts by createdAt descending with the id ascending as tie-breaker", () => {
    const sorted = sortNotificationsNewestFirst([
      buildNotification({ id: "b", createdAt: "2026-11-10T10:00:00.000Z" }),
      buildNotification({ id: "a", createdAt: "2026-11-10T10:00:00.000Z" }),
      buildNotification({ id: "c", createdAt: "2026-11-16T10:00:00.000Z" }),
      buildNotification({ id: "a", createdAt: "2026-11-11T10:00:00.000Z" }),
    ]);

    expect(sorted.map((notification) => notification.createdAt)).toEqual([
      "2026-11-16T10:00:00.000Z",
      "2026-11-11T10:00:00.000Z",
      "2026-11-10T10:00:00.000Z",
      "2026-11-10T10:00:00.000Z",
    ]);
    expect(sorted[2].id).toBe("a");
    expect(sorted[3].id).toBe("b");
  });

  it("orders ids ascending when two records share the creation stamp", () => {
    const createdAt = "2026-11-10T10:00:00.000Z";
    const sorted = sortNotificationsNewestFirst([
      buildNotification({ id: "c", createdAt }),
      buildNotification({ id: "a", createdAt }),
      buildNotification({ id: "b", createdAt }),
    ]);

    expect(sorted.map((notification) => notification.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("keeps two records with the same id and date in place", () => {
    const createdAt = "2026-11-10T10:00:00.000Z";
    const sorted = sortNotificationsNewestFirst([
      buildNotification({ id: "same", createdAt }),
      buildNotification({ id: "same", createdAt }),
    ]);

    expect(sorted).toHaveLength(2);
    expect(sorted[0].id).toBe("same");
  });

  it("keeps the input untouched and handles an empty list", () => {
    const notifications = [
      buildNotification({ id: "b" }),
      buildNotification({ id: "a" }),
    ];

    sortNotificationsNewestFirst(notifications);

    expect(notifications.map((notification) => notification.id)).toEqual([
      "b",
      "a",
    ]);
    expect(sortNotificationsNewestFirst([])).toEqual([]);
  });
});

describe("getNotificationSegments", () => {
  it("splits by seenAt and sorts each segment newest first", () => {
    const segments = getNotificationSegments([
      buildNotification({
        id: "pending-old",
        createdAt: "2026-11-10T10:00:00.000Z",
      }),
      buildNotification({
        id: "viewed-unread",
        seenAt: "2026-11-16T10:30:00.000Z",
        createdAt: "2026-11-12T10:00:00.000Z",
      }),
      buildNotification({
        id: "pending-new",
        createdAt: "2026-11-16T10:00:00.000Z",
      }),
      buildNotification({
        id: "viewed-read",
        seenAt: "2026-11-16T10:30:00.000Z",
        readAt: "2026-11-16T11:00:00.000Z",
        createdAt: "2026-11-11T10:00:00.000Z",
      }),
    ]);

    expect(segments.pending.map((notification) => notification.id)).toEqual([
      "pending-new",
      "pending-old",
    ]);
    expect(segments.viewed.map((notification) => notification.id)).toEqual([
      "viewed-unread",
      "viewed-read",
    ]);
  });

  it("returns two empty segments for an empty list", () => {
    expect(getNotificationSegments([])).toEqual({ pending: [], viewed: [] });
  });
});

describe("countUnreadNotifications", () => {
  it("counts the unread marker inside both segments", () => {
    expect(
      countUnreadNotifications([
        buildNotification({ readAt: null }),
        buildNotification({ readAt: "" }),
        buildNotification({
          seenAt: "2026-11-16T10:30:00.000Z",
          readAt: null,
        }),
        buildNotification({ readAt: "2026-11-16T10:00:00.000Z" }),
      ]),
    ).toBe(3);
    expect(countUnreadNotifications([])).toBe(0);
  });
});
