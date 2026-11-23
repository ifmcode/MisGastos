import type {
  GroupInviteNotificationPayload,
  GroupJoinNotificationPayload,
  NotificationWrite,
} from "@/features/notifications/types/notification.types";

import type { GroupInvitation } from "../types/group.types";
import type { GroupSettlementNotificationInput } from "./group-settlement-notification";

export {
  buildGroupSettlementNotification,
  type GroupSettlementNotificationEvent,
  type GroupSettlementNotificationInput,
} from "./group-settlement-notification";

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

/** The owner is notified that someone requested to join through the code. */
export interface GroupJoinRequestNotificationInput {
  requestId: string;
  groupId: string;
  groupName: string;
  requesterId: string;
  ownerId: string;
  /** Request `createdAt`, so a retried create stays idempotent. */
  notifiedAt: string;
}

/** The requester is notified of the owner's decision. */
export interface GroupJoinOutcomeNotificationInput {
  requestId: string;
  groupId: string;
  groupName: string;
  requesterId: string;
  ownerId: string;
  decision: "accepted" | "rejected";
  /** Decision `updatedAt`: a second decision on the same request notifies once. */
  notifiedAt: string;
}

/**
 * Notification seam of the groups feature. Creation is best-effort: the
 * invitations and join-request screens are the fallback, so a notification
 * failure never rolls back or fails the business write.
 */
export interface IGroupNotificationPort {
  notifyGroupInvite(input: GroupInviteNotificationInput): Promise<void>;
  notifyJoinRequest(input: GroupJoinRequestNotificationInput): Promise<void>;
  notifyJoinOutcome(input: GroupJoinOutcomeNotificationInput): Promise<void>;
  notifyGroupSettlement(input: GroupSettlementNotificationInput): Promise<void>;
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

/** One write per pending request, deduped by request and creation stamp. */
export function buildGroupJoinRequestNotification(
  input: GroupJoinRequestNotificationInput,
): NotificationWrite {
  const payload: GroupJoinNotificationPayload = {
    requestId: input.requestId,
    groupId: input.groupId,
    groupName: input.groupName,
    friendUid: input.requesterId,
  };

  return {
    userId: input.ownerId,
    type: "group-join-request",
    payload: { ...payload },
    dedupeKey: `group-join-request:${input.requestId}:${input.notifiedAt}`,
    createdAt: input.notifiedAt,
  };
}

/** Outcome event for the requester; `friendUid` is the owner (the actor). */
export function buildGroupJoinOutcomeNotification(
  input: GroupJoinOutcomeNotificationInput,
): NotificationWrite {
  const type =
    input.decision === "accepted"
      ? "group-join-accepted"
      : "group-join-rejected";
  const payload: GroupJoinNotificationPayload = {
    requestId: input.requestId,
    groupId: input.groupId,
    groupName: input.groupName,
    friendUid: input.ownerId,
  };

  return {
    userId: input.requesterId,
    type,
    payload: { ...payload },
    dedupeKey: `${type}:${input.requestId}:${input.notifiedAt}`,
    createdAt: input.notifiedAt,
  };
}
