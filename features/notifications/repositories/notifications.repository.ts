import type {
  AppNotification,
  NotificationWrite,
} from "../types/notification.types";

export interface INotificationsRepository {
  /** Every notification of one user; rules keep the list owner-only. */
  getNotifications(userId: string): Promise<AppNotification[]>;

  /** Single read used by the mark-as-read owner guard. */
  getNotification(notificationId: string): Promise<AppNotification | null>;

  /** Idempotent by `dedupeKey`; `null` means it already existed. */
  createNotification(input: NotificationWrite): Promise<AppNotification | null>;

  markNotificationRead(notificationId: string, readAt: string): Promise<void>;
}
