import { describe, expect, it } from "@jest/globals";

import type { NotificationWrite } from "@/features/notifications/types/notification.types";
import type { INotificationsRepository } from "@/features/notifications/repositories/notifications.repository";

import {
  buildGroupInviteNotification,
  buildGroupJoinOutcomeNotification,
  buildGroupJoinRequestNotification,
  buildGroupSettlementNotification,
  toGroupInviteNotificationInput,
} from "../group-notification.port";
import { FirebaseGroupNotificationPort } from "../firebase-group-notification.port";

const input = {
  invitationId: "group-1__user-b",
  groupId: "group-1",
  groupName: "Viaje",
  inviteeId: "user-b",
  inviterId: "user-a",
  notifiedAt: "2026-11-20T10:00:00.000Z",
};

describe("buildGroupInviteNotification", () => {
  it("writes an idempotent group-invite event for the invitee", () => {
    expect(buildGroupInviteNotification(input)).toEqual({
      userId: "user-b",
      type: "group-invite",
      payload: {
        invitationId: "group-1__user-b",
        groupId: "group-1",
        groupName: "Viaje",
        friendUid: "user-a",
      },
      dedupeKey: "group-invite:group-1__user-b:2026-11-20T10:00:00.000Z",
      createdAt: "2026-11-20T10:00:00.000Z",
    });
  });

  it("derives the input from a stored invitation", () => {
    expect(
      toGroupInviteNotificationInput({
        ...input,
        pairId: "user-a__user-b",
        status: "pending",
        createdAt: "2026-11-19T10:00:00.000Z",
        updatedAt: input.notifiedAt,
        id: "group-1__user-b",
      }),
    ).toEqual(input);
  });
});

describe("FirebaseGroupNotificationPort", () => {
  it("delegates to the notifications repository", async () => {
    const writes: NotificationWrite[] = [];
    const notifications = {
      createNotification: async (write: NotificationWrite) => {
        writes.push(write);
        return null;
      },
    } as unknown as INotificationsRepository;

    await new FirebaseGroupNotificationPort(notifications).notifyGroupInvite(
      input,
    );

    expect(writes).toHaveLength(1);
    expect(writes[0].type).toBe("group-invite");
  });
});

describe("buildGroupJoinRequestNotification", () => {
  it("writes a request event for the owner with the requester as actor", () => {
    expect(
      buildGroupJoinRequestNotification({
        requestId: "group-1__user-b",
        groupId: "group-1",
        groupName: "Viaje",
        requesterId: "user-b",
        ownerId: "user-a",
        notifiedAt: input.notifiedAt,
      }),
    ).toEqual({
      userId: "user-a",
      type: "group-join-request",
      payload: {
        requestId: "group-1__user-b",
        groupId: "group-1",
        groupName: "Viaje",
        friendUid: "user-b",
      },
      dedupeKey:
        "group-join-request:group-1__user-b:2026-11-20T10:00:00.000Z",
      createdAt: input.notifiedAt,
    });
  });
});

describe("buildGroupJoinOutcomeNotification", () => {
  const base = {
    requestId: "group-1__user-b",
    groupId: "group-1",
    groupName: "Viaje",
    requesterId: "user-b",
    ownerId: "user-a",
    notifiedAt: input.notifiedAt,
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

describe("FirebaseGroupNotificationPort join events", () => {
  it("delegates the request and the outcome to the notifications repository", async () => {
    const writes: NotificationWrite[] = [];
    const notifications = {
      createNotification: async (write: NotificationWrite) => {
        writes.push(write);
        return null;
      },
    } as unknown as INotificationsRepository;
    const port = new FirebaseGroupNotificationPort(notifications);
    const joinInput = {
      requestId: "group-1__user-b",
      groupId: "group-1",
      groupName: "Viaje",
      requesterId: "user-b",
      ownerId: "user-a",
      notifiedAt: input.notifiedAt,
    };

    await port.notifyJoinRequest(joinInput);
    await port.notifyJoinOutcome({ ...joinInput, decision: "rejected" });

    expect(writes.map((write) => write.type)).toEqual([
      "group-join-request",
      "group-join-rejected",
    ]);
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
    notifiedAt: input.notifiedAt,
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
      createdAt: input.notifiedAt,
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
    const writes: NotificationWrite[] = [];
    const notifications = {
      createNotification: async (write: NotificationWrite) => {
        writes.push(write);
        return null;
      },
    } as unknown as INotificationsRepository;

    await new FirebaseGroupNotificationPort(notifications).notifyGroupSettlement({
      settlementId: "group-settlement-1",
      groupId: "group-1",
      groupName: "Viaje",
      recipientUid: "user-c",
      actorUid: "user-b",
      event: "deleted",
      amountCents: 1500,
      currency: "EUR",
      notifiedAt: input.notifiedAt,
    });

    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      userId: "user-c",
      type: "group-settlement",
    });
  });
});
