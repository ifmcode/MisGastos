import {
  SETTLEMENT_NOTIFICATION_TYPES,
  type AppNotification,
  type NotificationType,
} from "../types/notification.types";

export function isNotificationType(
  value: unknown,
): value is NotificationType {
  return (
    typeof value === "string" &&
    SETTLEMENT_NOTIFICATION_TYPES.includes(
      value as (typeof SETTLEMENT_NOTIFICATION_TYPES)[number],
    )
  );
}

function isUnread(notification: AppNotification): boolean {
  return notification.readAt === null || notification.readAt.length === 0;
}

/** Unread first, then newest, then id: the inbox order never jumps around. */
export function sortNotifications(
  notifications: readonly AppNotification[],
): AppNotification[] {
  return [...notifications].sort((left, right) => {
    const leftUnread = isUnread(left);
    const rightUnread = isUnread(right);

    if (leftUnread !== rightUnread) return leftUnread ? -1 : 1;
    if (left.createdAt !== right.createdAt) {
      return left.createdAt < right.createdAt ? 1 : -1;
    }

    return left.id < right.id ? -1 : 1;
  });
}

export function countUnreadNotifications(
  notifications: readonly AppNotification[],
): number {
  return notifications.filter(isUnread).length;
}

export type NotificationTarget =
  | { kind: "settlement"; settlementId: string }
  | { kind: "friend"; friendUid: string };

function readPayloadId(
  notification: AppNotification,
  key: string,
): string | null {
  const value = notification.payload[key];

  if (typeof value !== "string") return null;

  const id = value.trim();
  return id.length > 0 ? id : null;
}

/**
 * Where a notification opens. Settlement events resolve to the settlement
 * detail; anything else falls back to the friend, so a new TICKET-047 type does
 * not break navigation before its screen exists.
 */
export function resolveNotificationTarget(
  notification: AppNotification,
): NotificationTarget | null {
  if (isNotificationType(notification.type)) {
    const settlementId = readPayloadId(notification, "settlementId");
    if (settlementId) return { kind: "settlement", settlementId };
  }

  const friendUid = readPayloadId(notification, "friendUid");

  return friendUid ? { kind: "friend", friendUid } : null;
}
