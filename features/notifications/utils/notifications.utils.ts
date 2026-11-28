import {
  GROUP_NOTIFICATION_TYPES,
  NOTIFICATION_TYPES,
  RESERVED_NOTIFICATION_TYPES,
  SETTLEMENT_NOTIFICATION_TYPES,
  type AppNotification,
  type GroupNotificationType,
  type NotificationType,
  type ReservedNotificationType,
  type SettlementNotificationType,
} from "../types/notification.types";
import { isPendingNotification } from "./notification-stamps";

/** The TICKET-061 join-code events; the invite keeps its own copy. */
export type GroupJoinNotificationType = Exclude<
  GroupNotificationType,
  "group-invite"
>;

const GROUP_JOIN_NOTIFICATION_TYPES: readonly GroupJoinNotificationType[] = [
  "group-join-request",
  "group-join-accepted",
  "group-join-rejected",
];

/**
 * Pure inbox helpers: type guards, the two stamps, the Pendientes/Vistas split
 * and the sort. Targets, stamps and the badge live in sibling modules and are
 * re-exported here so consumers keep one entry point.
 */
export {
  buildNotificationTargetHref,
  resolveNotificationTarget,
  type NotificationTarget,
} from "./notification-targets";

export {
  countInboxBadge,
  countUnreadNotifications,
  isInboxActionNotificationType,
} from "./inbox-badge";

export {
  isPendingNotification,
  isUnreadNotification,
  isViewedNotification,
} from "./notification-stamps";

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

/** Active group events; `group-invite` is the TICKET-008 producer. */
export function isGroupNotificationType(
  value: unknown,
): value is GroupNotificationType {
  return (
    typeof value === "string" &&
    GROUP_NOTIFICATION_TYPES.includes(value as GroupNotificationType)
  );
}

/** Only the three TICKET-061 join-code events. */
export function isGroupJoinNotificationType(
  value: unknown,
): value is GroupJoinNotificationType {
  return (
    typeof value === "string" &&
    GROUP_JOIN_NOTIFICATION_TYPES.includes(value as GroupJoinNotificationType)
  );
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
