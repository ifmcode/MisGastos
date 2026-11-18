import type {
  AppNotification,
  NotificationWrite,
} from "../types/notification.types";
import {
  createNotificationOperation,
  getNotificationOperation,
  getNotificationsOperation,
  listenNotificationsOperation,
  markNotificationReadOperation,
  markNotificationSeenOperation,
} from "./notifications.operations";
import type {
  INotificationsRepository,
  NotificationsListener,
  NotificationsListenerError,
  NotificationsUnsubscribe,
} from "./notifications.repository";

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

  markNotificationSeen(
    notificationId: string,
    seenAt: string,
  ): Promise<void> {
    return markNotificationSeenOperation(notificationId, seenAt);
  }

  markNotificationRead(
    notificationId: string,
    readAt: string,
    seenAt: string,
  ): Promise<void> {
    return markNotificationReadOperation(notificationId, readAt, seenAt);
  }

  listenNotifications(
    userId: string,
    onChange: NotificationsListener,
    onError?: NotificationsListenerError,
  ): NotificationsUnsubscribe {
    return listenNotificationsOperation(userId, onChange, onError);
  }
}
