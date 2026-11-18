import {
  buildSettlementNotificationInput,
  type SettlementNotificationInput,
} from "@/features/settlements/utils/settlement-notification";

import type {
  INotificationsRepository,
  NotificationsListener,
  NotificationsListenerError,
  NotificationsUnsubscribe,
} from "../repositories/notifications.repository";
import type {
  AppNotification,
  NotificationWrite,
} from "../types/notification.types";
import {
  countUnreadNotifications,
  isPendingNotification,
  sortNotificationsNewestFirst,
} from "../utils/notifications.utils";
import { requireOwnedNotification, requireUserId } from "./notifications.guards";

const NOOP_UNSUBSCRIBE: NotificationsUnsubscribe = () => {};

/**
 * Inbox use cases of TICKET-047: newest-first list, the two stamps (seen vs
 * read), mark-all-read over Pendientes and the foreground subscription. Every
 * guard is owner-only and returns a stable code; the UI translates it, the
 * service never returns a sentence.
 */
export class NotificationsService {
  constructor(private readonly repository: INotificationsRepository) {}

  async getNotifications(viewerUid: string): Promise<AppNotification[]> {
    const viewer = requireUserId(viewerUid);
    const notifications = await this.repository.getNotifications(viewer);

    return sortNotificationsNewestFirst(notifications);
  }

  countUnread(notifications: readonly AppNotification[]): number {
    return countUnreadNotifications(notifications);
  }

  /** Banner dismissed or timed out: only `seenAt`, the row stays unread. */
  async markSeen(
    viewerUid: string,
    notificationId: string,
    seenAt: string,
  ): Promise<void> {
    const { id, notification } = await requireOwnedNotification(
      this.repository,
      viewerUid,
      notificationId,
    );

    if (notification.seenAt !== null) return;

    await this.repository.markNotificationSeen(id, seenAt);
  }

  /**
   * Opened: one write with both stamps. An existing stamp is preserved, so an
   * already presented row keeps its `seenAt` and an already read row is a no-op.
   */
  async markRead(
    viewerUid: string,
    notificationId: string,
    at: string,
  ): Promise<void> {
    const { id, notification } = await requireOwnedNotification(
      this.repository,
      viewerUid,
      notificationId,
    );

    if (notification.readAt !== null && notification.seenAt !== null) return;

    await this.repository.markNotificationRead(
      id,
      notification.readAt ?? at,
      notification.seenAt ?? at,
    );
  }

  /**
   * Stamps every Pendiente (`seenAt == null`) once, preserving an existing
   * `readAt`. Returns how many rows were touched.
   */
  async markAllRead(viewerUid: string, at: string): Promise<number> {
    const viewer = requireUserId(viewerUid);
    const notifications = await this.repository.getNotifications(viewer);
    const pending = notifications.filter(isPendingNotification);

    for (const notification of pending) {
      await this.repository.markNotificationRead(
        notification.id,
        notification.readAt ?? at,
        at,
      );
    }

    return pending.length;
  }

  /**
   * Foreground listener behind the banner. A blank viewer returns a no-op
   * unsubscribe so a hook can subscribe before auth resolves.
   */
  subscribe(
    viewerUid: string,
    onChange: NotificationsListener,
    onError?: NotificationsListenerError,
  ): NotificationsUnsubscribe {
    const viewer = typeof viewerUid === "string" ? viewerUid.trim() : "";
    if (viewer.length === 0) return NOOP_UNSUBSCRIBE;

    return this.repository.listenNotifications(viewer, onChange, onError);
  }

  /** Producer-agnostic helper; the settlement operations write in-transaction. */
  createNotification(
    input: NotificationWrite,
  ): Promise<AppNotification | null> {
    return this.repository.createNotification(input);
  }

  /**
   * Non-transactional settlement producer: builds the same write DTO the
   * settlement operations store inside their transaction, then delegates. The
   * operations do not use it — they must keep the notification in their own
   * transaction — so this wrapper serves future producers (groups, retries).
   */
  createSettlementNotification(
    input: SettlementNotificationInput,
  ): Promise<AppNotification | null> {
    return this.createNotification(buildSettlementNotificationInput(input));
  }
}
