import type { INotificationsRepository } from "../repositories/notifications.repository";
import type {
  AppNotification,
  NotificationWrite,
} from "../types/notification.types";
import {
  countUnreadNotifications,
  sortNotifications,
} from "../utils/notifications.utils";
import { NotificationOperationError } from "./notification.errors";

function requireUserId(value: unknown): string {
  const uid = typeof value === "string" ? value.trim() : "";

  if (uid.length === 0) {
    throw new NotificationOperationError("SIGN_IN_REQUIRED");
  }

  return uid;
}

/**
 * Minimal inbox of TICKET-046: unread-first list, unread count and mark-as-read.
 * Every guard is owner-only and returns a stable code; the UI translates it.
 */
export class NotificationsService {
  constructor(private readonly repository: INotificationsRepository) {}

  async getNotifications(viewerUid: string): Promise<AppNotification[]> {
    const viewer = requireUserId(viewerUid);
    const notifications = await this.repository.getNotifications(viewer);

    return sortNotifications(notifications);
  }

  countUnread(notifications: readonly AppNotification[]): number {
    return countUnreadNotifications(notifications);
  }

  /** Idempotent: a notification that is already read is left untouched. */
  async markRead(
    viewerUid: string,
    notificationId: string,
    readAt: string,
  ): Promise<void> {
    const viewer = requireUserId(viewerUid);
    const id = notificationId.trim();

    if (id.length === 0) {
      throw new NotificationOperationError("NOTIFICATION_NOT_FOUND");
    }

    const notification = await this.repository.getNotification(id);

    if (!notification) {
      throw new NotificationOperationError("NOTIFICATION_NOT_FOUND");
    }

    if (notification.userId !== viewer) {
      throw new NotificationOperationError("NOT_OWNER");
    }

    if (notification.readAt !== null) return;

    await this.repository.markNotificationRead(id, readAt);
  }

  createNotification(
    input: NotificationWrite,
  ): Promise<AppNotification | null> {
    return this.repository.createNotification(input);
  }
}
