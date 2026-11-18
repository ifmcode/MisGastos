import type {
  INotificationsRepository,
  NotificationsListener,
  NotificationsListenerError,
  NotificationsUnsubscribe,
} from "../../repositories/notifications.repository";
import type {
  AppNotification,
  NotificationWrite,
} from "../../types/notification.types";

/** In-memory repository; the service is tested without Firestore. */
export class FakeNotificationsRepository implements INotificationsRepository {
  notifications: AppNotification[] = [];
  created: NotificationWrite[] = [];
  marked: Array<{ id: string; readAt: string; seenAt: string }> = [];
  seen: Array<{ id: string; seenAt: string }> = [];
  listeners: Array<{
    userId: string;
    onChange: NotificationsListener;
    onError?: NotificationsListenerError;
  }> = [];
  unsubscribed = 0;

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

  async markNotificationSeen(
    notificationId: string,
    seenAt: string,
  ): Promise<void> {
    this.seen.push({ id: notificationId, seenAt });
  }

  async markNotificationRead(
    notificationId: string,
    readAt: string,
    seenAt: string,
  ): Promise<void> {
    this.marked.push({ id: notificationId, readAt, seenAt });
  }

  listenNotifications(
    userId: string,
    onChange: NotificationsListener,
    onError?: NotificationsListenerError,
  ): NotificationsUnsubscribe {
    this.listeners.push({ userId, onChange, onError });

    return () => {
      this.unsubscribed += 1;
    };
  }

  /** Test helper: delivers a snapshot to every active listener. */
  emit(notifications: AppNotification[]): void {
    for (const listener of this.listeners) listener.onChange(notifications);
  }
}
