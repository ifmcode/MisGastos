import type {
  AppNotification,
  NotificationWrite,
} from "../types/notification.types";
import {
  createNotificationOperation,
  getNotificationOperation,
  getNotificationsOperation,
  markNotificationReadOperation,
} from "./notifications.operations";
import type { INotificationsRepository } from "./notifications.repository";

export class FirebaseNotificationsRepository
  implements INotificationsRepository
{
  getNotifications(userId: string): Promise<AppNotification[]> {
    return getNotificationsOperation(userId);
  }

  getNotification(notificationId: string): Promise<AppNotification | null> {
    return getNotificationOperation(notificationId);
  }

  createNotification(
    input: NotificationWrite,
  ): Promise<AppNotification | null> {
    return createNotificationOperation(input);
  }

  markNotificationRead(
    notificationId: string,
    readAt: string,
  ): Promise<void> {
    return markNotificationReadOperation(notificationId, readAt);
  }
}
