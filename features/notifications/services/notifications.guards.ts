import type { INotificationsRepository } from "../repositories/notifications.repository";
import type { AppNotification } from "../types/notification.types";
import { NotificationOperationError } from "./notification.errors";

/** Normalizes the viewer or throws `SIGN_IN_REQUIRED`. */
export function requireUserId(value: unknown): string {
  const uid = typeof value === "string" ? value.trim() : "";

  if (uid.length === 0) {
    throw new NotificationOperationError("SIGN_IN_REQUIRED");
  }

  return uid;
}

/** Normalizes the notification id or throws `NOTIFICATION_NOT_FOUND`. */
export function requireNotificationId(value: unknown): string {
  const id = typeof value === "string" ? value.trim() : "";

  if (id.length === 0) {
    throw new NotificationOperationError("NOTIFICATION_NOT_FOUND");
  }

  return id;
}

/**
 * Reads one notification and enforces the owner-only guard before any write.
 * A missing document and a foreign one are different stable codes on purpose:
 * the UI shows "no longer available" versus "not yours".
 */
export async function requireOwnedNotification(
  repository: INotificationsRepository,
  viewerUid: string,
  notificationId: string,
): Promise<{ id: string; notification: AppNotification }> {
  const viewer = requireUserId(viewerUid);
  const id = requireNotificationId(notificationId);
  const notification = await repository.getNotification(id);

  if (!notification) {
    throw new NotificationOperationError("NOTIFICATION_NOT_FOUND");
  }

  if (notification.userId !== viewer) {
    throw new NotificationOperationError("NOT_OWNER");
  }

  return { id, notification };
}
