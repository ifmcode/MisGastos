import { describe, expect, it } from "@jest/globals";

import type { AppNotification } from "../../types/notification.types";
import {
  getNotificationIcon,
  resolveNotificationCopy,
} from "../notification-copy";

function buildNotification(
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: "notification-1",
    userId: "user-b",
    type: "settlement-created",
    payload: {
      settlementId: "settlement-1",
      pairId: "user-a__user-b",
      friendUid: "user-a",
      amountCents: 1000,
      currency: "EUR",
      isFull: true,
      canLinkWallet: false,
    },
    createdAt: "2026-11-17T10:00:00.000Z",
    seenAt: null,
    readAt: null,
    dedupeKey: "settlement-1:created:user-b",
    ...overrides,
  };
}

const context = {
  actorName: "Ana",
  amount: "10,00 €",
  groupName: "Viaje a Roma",
  t: (key: string, options?: Record<string, unknown>) =>
    options ? `${key}:${JSON.stringify(options)}` : key,
};

describe("resolveNotificationCopy", () => {
  it("uses the full variant when the settlement clears the debt", () => {
    const copy = resolveNotificationCopy(buildNotification(), context);

    expect(copy.title).toContain("types.settlement-created.full");
    expect(copy.title).toContain("Ana");
    expect(copy.title).toContain("10,00 €");
    expect(copy.icon).toBe("checkmark-circle-outline");
  });

  it("uses the partial variant for anything that is not a full settlement", () => {
    const copy = resolveNotificationCopy(
      buildNotification({ payload: { isFull: false } }),
      context,
    );

    expect(copy.title).toContain("types.settlement-created.partial");
  });

  it("resolves a reserved type with one flat sentence and the actor name", () => {
    const copy = resolveNotificationCopy(
      buildNotification({ type: "group-expense" }),
      context,
    );

    expect(copy.title).toBe('types.group-expense:{"name":"Ana"}');
    expect(copy.title).not.toContain("10,00 €");
    expect(copy.icon).toBe("people-outline");
  });

  it("names the actor and the group of a group invite", () => {
    const copy = resolveNotificationCopy(
      buildNotification({
        type: "group-invite",
        payload: {
          invitationId: "group-1__user-b",
          groupId: "group-1",
          groupName: "Viaje a Roma",
          friendUid: "user-a",
        },
      }),
      context,
    );

    expect(copy.title).toBe(
      'types.group-invite:{"name":"Ana","group":"Viaje a Roma"}',
    );
    expect(copy.title).not.toContain("10,00 €");
    expect(copy.icon).toBe("mail-unread-outline");
  });

  it("keeps an icon for every reserved and settlement type", () => {
    expect(getNotificationIcon("settlement-updated")).toBe("create-outline");
    expect(getNotificationIcon("settlement-deleted")).toBe("trash-outline");
    expect(getNotificationIcon("friend-request")).toBe("person-add-outline");
    expect(getNotificationIcon("friend-request-accepted")).toBe(
      "person-circle-outline",
    );
    expect(getNotificationIcon("group-settlement")).toBe(
      "swap-horizontal-outline",
    );
    expect(getNotificationIcon("group-invite")).toBe("mail-unread-outline");
  });

  it("falls back to the neutral bell for a legacy or unknown type", () => {
    expect(getNotificationIcon("legacy-event")).toBe("notifications-outline");
  });
});
