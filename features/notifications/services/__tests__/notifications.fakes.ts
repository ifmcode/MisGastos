import type { INotificationsRepository } from "../../repositories/notifications.repository";
import type {
  AppNotification,
  NotificationWrite,
} from "../../types/notification.types";

/** In-memory repository; the service is tested without Firestore. */
export class FakeNotificationsRepository implements INotificationsRepository {
  notifications: AppNotification[] = [];
  created: NotificationWrite[] = [];
  marked: Array<{ id: string; readAt: string }> = [];

  async getNotifications(userId: string): Promise<AppNotification[]> {
    return this.notifications.filter(
      (notification) => notification.userId === userId,
    );
  }

  async getNotification(
    notificationId: string,
  ): Promise<AppNotification | null> {
    return (
      this.notifications.find(
        (notification) => notification.id === notificationId,
      ) ?? null
    );
  }

  async createNotification(
    input: NotificationWrite,
  ): Promise<AppNotification | null> {
    this.created.push(input);

    return null;
  }

  async markNotificationRead(
    notificationId: string,
    readAt: string,
  ): Promise<void> {
    this.marked.push({ id: notificationId, readAt });
  }
}
