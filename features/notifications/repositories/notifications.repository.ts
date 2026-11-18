import type {
  AppNotification,
  NotificationWrite,
} from "../types/notification.types";

/** Called with every owner-scoped snapshot, already mapped and filtered. */
export type NotificationsListener = (notifications: AppNotification[]) => void;

/** Forwards a listener failure; the hook translates the stable code. */
export type NotificationsListenerError = (error: unknown) => void;

/** Detaches the foreground listener. */
export type NotificationsUnsubscribe = () => void;

export interface INotificationsRepository {
  /** Every notification of one user; rules keep the list owner-only. */
  getNotifications(userId: string): Promise<AppNotification[]>;

  /** Single read used by the mark-as-seen/read owner guard. */
  getNotification(notificationId: string): Promise<AppNotification | null>;

  /** Idempotent by `dedupeKey`; `null` means it already existed. */
  createNotification(input: NotificationWrite): Promise<AppNotification | null>;

  /** Presented (banner dismissed/timeout): writes only `seenAt`. */
  markNotificationSeen(notificationId: string, seenAt: string): Promise<void>;

  /** Opened: writes `readAt` and `seenAt` together in one update. */
  markNotificationRead(
    notificationId: string,
    readAt: string,
    seenAt: string,
  ): Promise<void>;

  /** Foreground listener over the owner-scoped query; returns unsubscribe. */
  listenNotifications(
    userId: string,
    onChange: NotificationsListener,
    onError?: NotificationsListenerError,
  ): NotificationsUnsubscribe;
}
