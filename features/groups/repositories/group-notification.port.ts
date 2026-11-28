import type {
  GroupJoinNotificationPayload,
  NotificationWrite,
} from "@/features/notifications/types/notification.types";

import type { GroupSettlementNotificationInput } from "./group-settlement-notification";

export {
  buildGroupSettlementNotification,
  type GroupSettlementNotificationEvent,
  type GroupSettlementNotificationInput,
} from "./group-settlement-notification";

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
 * Notification seam of the groups feature. Only outcomes are written: a pending
 * invitation or join request is an actionable card of its own screen, so a
 * notification for it would duplicate the badge. Creation is best-effort, so a
 * notification failure never rolls back or fails the business write.
 */
export interface IGroupNotificationPort {
  notifyJoinOutcome(input: GroupJoinOutcomeNotificationInput): Promise<void>;
  notifyGroupSettlement(input: GroupSettlementNotificationInput): Promise<void>;
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
