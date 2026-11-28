import { describe, expect, it } from "@jest/globals";

import { buildNotification } from "../../repositories/__tests__/notifications.fixtures";
import {
  countInboxBadge,
  isInboxActionNotificationType,
} from "../inbox-badge";

describe("isInboxActionNotificationType", () => {
  it("accepts only the types represented as actionable cards", () => {
    expect(isInboxActionNotificationType("group-invite")).toBe(true);
    expect(isInboxActionNotificationType("group-join-request")).toBe(true);
    expect(isInboxActionNotificationType("friend-request")).toBe(true);
    expect(isInboxActionNotificationType("settlement-created")).toBe(false);
    expect(isInboxActionNotificationType("friend-request-accepted")).toBe(
      false,
    );
    expect(isInboxActionNotificationType("group-join-accepted")).toBe(false);
    expect(isInboxActionNotificationType("group-settlement")).toBe(false);
  });
});

describe("countInboxBadge", () => {
  it("counts only unread informative notifications plus the queue", () => {
    const notifications = [
      buildNotification({ id: "a", type: "settlement-created" }),
      buildNotification({
        id: "b",
        type: "settlement-updated",
        readAt: "2026-11-16T11:00:00.000Z",
      }),
      buildNotification({ id: "c", type: "friend-request" }),
      buildNotification({ id: "d", type: "group-invite" }),
    ];

    expect(countInboxBadge(notifications, 2)).toBe(3);
  });

  it("returns the queue count when there are no notifications", () => {
    expect(countInboxBadge([], 4)).toBe(4);
    expect(countInboxBadge([], 0)).toBe(0);
  });

  it("never adds a negative, fractional or NaN queue count", () => {
    expect(countInboxBadge([], -3)).toBe(0);
    expect(countInboxBadge([], 2.7)).toBe(2);
    expect(countInboxBadge([], Number.NaN)).toBe(0);
    expect(countInboxBadge([], Number.POSITIVE_INFINITY)).toBe(0);
  });
});
