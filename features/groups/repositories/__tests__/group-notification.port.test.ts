import { describe, expect, it } from "@jest/globals";

import type { NotificationWrite } from "@/features/notifications/types/notification.types";
import type { INotificationsRepository } from "@/features/notifications/repositories/notifications.repository";

import {
  buildGroupInviteNotification,
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
