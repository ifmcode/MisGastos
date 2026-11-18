import {
  NOTIFICATION_TYPES,
  RESERVED_NOTIFICATION_TYPES,
  SETTLEMENT_NOTIFICATION_TYPES,
  type AppNotification,
  type NotificationType,
  type ReservedNotificationType,
  type SettlementNotificationType,
} from "../types/notification.types";

/**
 * Pure inbox helpers: type guards, the two stamps, the Pendientes/Vistas split
 * and the sort. Targets and hrefs live in `notification-targets.ts` and are
 * re-exported here so consumers keep one entry point.
 */
export {
  buildNotificationTargetHref,
  resolveNotificationTarget,
  type NotificationTarget,
} from "./notification-targets";

/** Readable types: settlements plus the TICKET-047 reserved ones. */
export function isNotificationType(
  value: unknown,
): value is NotificationType {
  return (
    typeof value === "string" &&
    NOTIFICATION_TYPES.includes(value as NotificationType)
  );
}

/** Settlement events only; the rules still allow creation only for these. */
export function isSettlementNotificationType(
  value: unknown,
): value is SettlementNotificationType {
  return (
    typeof value === "string" &&
    SETTLEMENT_NOTIFICATION_TYPES.includes(value as SettlementNotificationType)
  );
}

/** Reserved for future producers; read-compatible, not writable yet. */
export function isReservedNotificationType(
  value: unknown,
): value is ReservedNotificationType {
  return (
    typeof value === "string" &&
    RESERVED_NOTIFICATION_TYPES.includes(value as ReservedNotificationType)
  );
}

function hasStamp(value: string | null): boolean {
  return value !== null && value.length > 0;
}

/** `readAt == null` (opened?): drives the unread marker in both segments. */
export function isUnreadNotification(notification: AppNotification): boolean {
  return !hasStamp(notification.readAt);
}

/** `seenAt == null` (presented?): Pendiente. */
export function isPendingNotification(notification: AppNotification): boolean {
  return !hasStamp(notification.seenAt);
}

/** Presented at least once: Vista, with or without an unread marker. */
export function isViewedNotification(notification: AppNotification): boolean {
  return !isPendingNotification(notification);
}

/** Newest first, then id ascending: the order never jumps around. */
export function sortNotificationsNewestFirst(
  notifications: readonly AppNotification[],
): AppNotification[] {
  return [...notifications].sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt < right.createdAt ? 1 : -1;
    }

    if (left.id === right.id) return 0;
    return left.id < right.id ? -1 : 1;
  });
}

export interface NotificationSegments {
  /** `seenAt == null`, newest first. */
  pending: AppNotification[];
  /** `seenAt != null`, newest first; may still carry an unread marker. */
  viewed: AppNotification[];
}

/** Pendientes / Vistas split of TICKET-047. */
export function getNotificationSegments(
  notifications: readonly AppNotification[],
): NotificationSegments {
  const pending: AppNotification[] = [];
  const viewed: AppNotification[] = [];

  for (const notification of notifications) {
    if (isPendingNotification(notification)) pending.push(notification);
    else viewed.push(notification);
  }

  return {
    pending: sortNotificationsNewestFirst(pending),
    viewed: sortNotificationsNewestFirst(viewed),
  };
}

export function countUnreadNotifications(
  notifications: readonly AppNotification[],
): number {
  return notifications.filter(isUnreadNotification).length;
}
