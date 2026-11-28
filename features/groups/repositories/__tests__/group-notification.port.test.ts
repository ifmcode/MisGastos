import { describe, expect, it } from "@jest/globals";

import type { NotificationWrite } from "@/features/notifications/types/notification.types";
import type { INotificationsRepository } from "@/features/notifications/repositories/notifications.repository";

import {
  buildGroupJoinOutcomeNotification,
  buildGroupSettlementNotification,
} from "../group-notification.port";
import { FirebaseGroupNotificationPort } from "../firebase-group-notification.port";

const notifiedAt = "2026-11-20T10:00:00.000Z";

/** Captures the writes a port delegates to the notifications repository. */
function captureWrites() {
  const writes: NotificationWrite[] = [];
  const createNotification = async (write: NotificationWrite) => {
    writes.push(write);
    return null;
  };
  const notifications = { createNotification } as unknown as INotificationsRepository;

  return { writes, notifications };
}

describe("buildGroupJoinOutcomeNotification", () => {
  const base = {
    requestId: "group-1__user-b",
    groupId: "group-1",
    groupName: "Viaje",
    requesterId: "user-b",
    ownerId: "user-a",
    notifiedAt,
  };

  it("writes the acceptance for the requester with the owner as actor", () => {
    expect(
      buildGroupJoinOutcomeNotification({ ...base, decision: "accepted" }),
    ).toMatchObject({
      userId: "user-b",
      type: "group-join-accepted",
      payload: { friendUid: "user-a" },
      dedupeKey: "group-join-accepted:group-1__user-b:2026-11-20T10:00:00.000Z",
    });
  });

  it("writes the rejection with its own type and dedupe key", () => {
    expect(
      buildGroupJoinOutcomeNotification({ ...base, decision: "rejected" }),
    ).toMatchObject({
      userId: "user-b",
      type: "group-join-rejected",
      dedupeKey: "group-join-rejected:group-1__user-b:2026-11-20T10:00:00.000Z",
    });
  });
});

describe("FirebaseGroupNotificationPort join outcome", () => {
  it("delegates the outcome to the notifications repository", async () => {
    const { writes, notifications } = captureWrites();

    await new FirebaseGroupNotificationPort(notifications).notifyJoinOutcome({
      requestId: "group-1__user-b",
      groupId: "group-1",
      groupName: "Viaje",
      requesterId: "user-b",
      ownerId: "user-a",
      decision: "rejected",
      notifiedAt,
    });

    expect(writes.map((write) => write.type)).toEqual(["group-join-rejected"]);
  });
});

describe("buildGroupSettlementNotification", () => {
  const settlementInput = {
    settlementId: "group-settlement-1",
    groupId: "group-1",
    groupName: "Viaje",
    recipientUid: "user-c",
    actorUid: "user-b",
    amountCents: 1500,
    currency: "EUR" as const,
    notifiedAt,
  };

  it("writes an idempotent group-settlement event for the counterpart", () => {
    expect(
      buildGroupSettlementNotification({
        ...settlementInput,
        event: "created",
      }),
    ).toEqual({
      userId: "user-c",
      type: "group-settlement",
      payload: {
        settlementId: "group-settlement-1",
        groupId: "group-1",
        groupName: "Viaje",
        friendUid: "user-b",
        amountCents: 1500,
        currency: "EUR",
      },
      dedupeKey:
        "group-settlement:group-settlement-1:created:2026-11-20T10:00:00.000Z",
      createdAt: notifiedAt,
    });
  });

  it("gives every event and stamp its own dedupe key", () => {
    const keys = (["created", "updated", "deleted"] as const).map(
      (event) =>
        buildGroupSettlementNotification({ ...settlementInput, event })
          .dedupeKey,
    );
    const reopened = buildGroupSettlementNotification({
      ...settlementInput,
      event: "updated",
      notifiedAt: "2026-11-21T10:00:00.000Z",
    });

    expect(new Set(keys).size).toBe(3);
    expect(reopened.dedupeKey).not.toBe(keys[1]);
  });
});

describe("FirebaseGroupNotificationPort settlement event", () => {
  it("delegates the group settlement to the notifications repository", async () => {
    const { writes, notifications } = captureWrites();

    await new FirebaseGroupNotificationPort(notifications).notifyGroupSettlement({
      settlementId: "group-settlement-1",
      groupId: "group-1",
      groupName: "Viaje",
      recipientUid: "user-c",
      actorUid: "user-b",
      event: "deleted",
      amountCents: 1500,
      currency: "EUR",
      notifiedAt,
    });

    expect(writes[0]).toMatchObject({ userId: "user-c", type: "group-settlement" });
  });
});
