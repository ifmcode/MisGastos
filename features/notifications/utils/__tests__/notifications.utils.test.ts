import { describe, expect, it } from "@jest/globals";

import { buildNotification } from "../../repositories/__tests__/notifications.fixtures";
import {
  isGroupJoinNotificationType,
  isGroupNotificationType,
  isNotificationType,
  isPendingNotification,
  isReservedNotificationType,
  isSettlementNotificationType,
  isUnreadNotification,
  isViewedNotification,
} from "../notifications.utils";

describe("isNotificationType", () => {
  it("accepts settlements, the group invite and the reserved types", () => {
    expect(isNotificationType("settlement-created")).toBe(true);
    expect(isNotificationType("settlement-updated")).toBe(true);
    expect(isNotificationType("settlement-deleted")).toBe(true);
    expect(isNotificationType("friend-request")).toBe(true);
    expect(isNotificationType("friend-request-accepted")).toBe(true);
    expect(isNotificationType("group-expense")).toBe(true);
    expect(isNotificationType("group-settlement")).toBe(true);
    expect(isNotificationType("group-invite")).toBe(true);
    expect(isNotificationType("group-join-request")).toBe(true);
    expect(isNotificationType("group-join-accepted")).toBe(true);
    expect(isNotificationType("group-join-rejected")).toBe(true);
    expect(isNotificationType("other")).toBe(false);
    expect(isNotificationType(42)).toBe(false);
  });
});

describe("isSettlementNotificationType", () => {
  it("accepts only the settlement events", () => {
    expect(isSettlementNotificationType("settlement-created")).toBe(true);
    expect(isSettlementNotificationType("friend-request")).toBe(false);
    expect(isSettlementNotificationType(undefined)).toBe(false);
  });
});

describe("isReservedNotificationType", () => {
  it("accepts only the reserved types", () => {
    expect(isReservedNotificationType("group-expense")).toBe(true);
    expect(isReservedNotificationType("group-settlement")).toBe(false);
    expect(isReservedNotificationType("settlement-created")).toBe(false);
    expect(isReservedNotificationType(42)).toBe(false);
  });
});

describe("isGroupNotificationType", () => {
  it("accepts only the active group events", () => {
    expect(isGroupNotificationType("group-invite")).toBe(true);
    expect(isGroupNotificationType("group-join-request")).toBe(true);
    expect(isGroupNotificationType("group-settlement")).toBe(true);
    expect(isGroupNotificationType("group-expense")).toBe(false);
    expect(isGroupNotificationType(undefined)).toBe(false);
  });
});

describe("isGroupJoinNotificationType", () => {
  it("accepts only the join-code events", () => {
    expect(isGroupJoinNotificationType("group-join-request")).toBe(true);
    expect(isGroupJoinNotificationType("group-join-accepted")).toBe(true);
    expect(isGroupJoinNotificationType("group-join-rejected")).toBe(true);
    expect(isGroupJoinNotificationType("group-invite")).toBe(false);
    expect(isGroupJoinNotificationType(42)).toBe(false);
  });
});

describe("the two stamps", () => {
  it("treats a missing seenAt as Pendiente and marks unread from readAt", () => {
    const pending = buildNotification({ seenAt: null, readAt: null });
    const viewed = buildNotification({ seenAt: "2026-11-16T10:30:00.000Z" });

    expect(isPendingNotification(pending)).toBe(true);
    expect(isPendingNotification(buildNotification({ seenAt: "" }))).toBe(true);
    expect(isViewedNotification(pending)).toBe(false);
    expect(isViewedNotification(viewed)).toBe(true);

    expect(isUnreadNotification(pending)).toBe(true);
    expect(isUnreadNotification(buildNotification({ readAt: "" }))).toBe(true);
    expect(isUnreadNotification(viewed)).toBe(true);
    expect(
      isUnreadNotification(
        buildNotification({ readAt: "2026-11-16T11:00:00.000Z" }),
      ),
    ).toBe(false);
  });
});
