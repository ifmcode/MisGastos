import type {
  AppNotification,
  NotificationType,
} from "../types/notification.types";
import { isUnreadNotification } from "./notification-stamps";

/**
 * Types represented as actionable cards of the Pendientes tab, never as rows:
 * the requests queue already carries them.
 */
const INBOX_ACTION_NOTIFICATION_TYPES: readonly NotificationType[] = [
  "group-invite",
  "group-join-request",
  "friend-request",
];

export function isInboxActionNotificationType(type: string): boolean {
  return INBOX_ACTION_NOTIFICATION_TYPES.includes(type as NotificationType);
}

/** Counts from another source never add a negative or fractional request. */
function normalizeBadgeCount(count: number): number {
  if (!Number.isFinite(count)) return 0;

  return Math.max(0, Math.trunc(count));
}

/** Unread notifications of the inbox, action types included. */
export function countUnreadNotifications(
  notifications: readonly AppNotification[],
): number {
  return notifications.filter(isUnreadNotification).length;
}

/**
 * Single bell badge: unread informative notifications plus the pending
 * requests of the queue. Action notifications never add a second time.
 */
export function countInboxBadge(
  notifications: readonly AppNotification[],
  requestsTotal: number,
): number {
  const unread = notifications.filter(
    (notification) =>
      isUnreadNotification(notification) &&
      !isInboxActionNotificationType(notification.type),
  ).length;

  return unread + normalizeBadgeCount(requestsTotal);
}
