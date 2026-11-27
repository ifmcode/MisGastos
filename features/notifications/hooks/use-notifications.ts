import { useCallback, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getNotificationErrorCode } from "../services/notification.errors";
import type { AppNotification } from "../types/notification.types";
import { useNotificationsStore } from "./use-notifications-store";
import { useNotificationsService } from "./use-notifications-service";

export interface UseNotificationsOptions {
  viewerUid: string | undefined;
}

export interface NotificationsController {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  /** Failure of a stamp, announced without breaking the list. */
  actionError: string | null;
  reload: () => void;
  /** Banner dismissed or timed out: only `seenAt`, the row stays unread. */
  markSeen: (notificationId: string) => Promise<void>;
  /** Opened: both stamps in one service write. */
  markRead: (notificationId: string) => Promise<void>;
  /** Stamps every Pendiente; returns how many rows the service touched. */
  markAllRead: () => Promise<number>;
}

function stampSeen(
  notifications: readonly AppNotification[],
  notificationId: string,
  seenAt: string,
): AppNotification[] {
  return notifications.map((notification) =>
    notification.id === notificationId && notification.seenAt === null
      ? { ...notification, seenAt }
      : notification,
  );
}

function stampAllSeen(
  notifications: readonly AppNotification[],
  at: string,
): AppNotification[] {
  return notifications.map((notification) =>
    notification.seenAt === null
      ? { ...notification, seenAt: at, readAt: notification.readAt ?? at }
      : notification,
  );
}

/** Inbox of the viewer: the snapshot plus the three stamps, optimistically. */
export function useNotifications({
  viewerUid,
}: UseNotificationsOptions): NotificationsController {
  const service = useNotificationsService();
  const { tr } = useScopedTranslation("notifications");
  const store = useNotificationsStore({ viewerUid });
  const { refresh, setNotifications } = store;
  const [actionError, setActionError] = useState<string | null>(null);

  const fail = useCallback(
    (error: unknown) => {
      setActionError(
        tr(`errors.${getNotificationErrorCode(error, "SAVE_FAILED")}`),
      );
      void refresh();
    },
    [refresh, tr],
  );

  const markSeen = useCallback(
    async (notificationId: string) => {
      if (!viewerUid) return;

      const seenAt = new Date().toISOString();
      setActionError(null);
      setNotifications((current) =>
        stampSeen(current, notificationId, seenAt),
      );

      try {
        await service.markSeen(viewerUid, notificationId, seenAt);
      } catch (error: unknown) {
        fail(error);
      }
    },
    [fail, service, setNotifications, viewerUid],
  );

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!viewerUid) return;

      const at = new Date().toISOString();
      setActionError(null);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                readAt: notification.readAt ?? at,
                seenAt: notification.seenAt ?? at,
              }
            : notification,
        ),
      );

      try {
        await service.markRead(viewerUid, notificationId, at);
      } catch (error: unknown) {
        fail(error);
      }
    },
    [fail, service, setNotifications, viewerUid],
  );

  const markAllRead = useCallback(async () => {
    if (!viewerUid) return 0;

    const at = new Date().toISOString();
    setActionError(null);
    setNotifications((current) => stampAllSeen(current, at));

    try {
      return await service.markAllRead(viewerUid, at);
    } catch (error: unknown) {
      fail(error);
      return 0;
    }
  }, [fail, service, setNotifications, viewerUid]);

  return {
    notifications: store.notifications,
    unreadCount: service.countUnread(store.notifications),
    loading: store.loading,
    error: store.error,
    actionError,
    reload: store.reload,
    markSeen,
    markRead,
    markAllRead,
  };
}
