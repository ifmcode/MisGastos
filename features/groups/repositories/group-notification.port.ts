import type {
  GroupInviteNotificationPayload,
  NotificationWrite,
} from "@/features/notifications/types/notification.types";

import type { GroupInvitation } from "../types/group.types";

/** Everything a `group-invite` notification needs; ids and names only. */
export interface GroupInviteNotificationInput {
  invitationId: string;
  groupId: string;
  groupName: string;
  inviteeId: string;
  /** The group owner at invite time; the notification's actor. */
  inviterId: string;
  /** `updatedAt` of the invitation write, so a re-invite notifies again. */
  notifiedAt: string;
}

/**
 * Notification seam of the groups feature. Creation is best-effort: the
 * invitations screen is the fallback, so a notification failure never rolls
 * back or fails the invitation itself.
 */
export interface IGroupNotificationPort {
  notifyGroupInvite(input: GroupInviteNotificationInput): Promise<void>;
}

export function toGroupInviteNotificationInput(
  invitation: GroupInvitation,
): GroupInviteNotificationInput {
  return {
    invitationId: invitation.id,
    groupId: invitation.groupId,
    groupName: invitation.groupName,
    inviteeId: invitation.inviteeId,
    inviterId: invitation.inviterId,
    notifiedAt: invitation.updatedAt,
  };
}

/**
 * Idempotent write DTO: the deterministic dedupe key makes a retried event a
 * no-op, while a reopened invitation (new `updatedAt`) notifies once more.
 */
export function buildGroupInviteNotification(
  input: GroupInviteNotificationInput,
): NotificationWrite {
  const payload: GroupInviteNotificationPayload = {
    invitationId: input.invitationId,
    groupId: input.groupId,
    groupName: input.groupName,
    friendUid: input.inviterId,
  };

  return {
    userId: input.inviteeId,
    type: "group-invite",
    payload: { ...payload },
    dedupeKey: `group-invite:${input.invitationId}:${input.notifiedAt}`,
    createdAt: input.notifiedAt,
  };
}
