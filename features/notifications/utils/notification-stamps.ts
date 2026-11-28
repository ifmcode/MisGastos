import type { AppNotification } from "../types/notification.types";

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
