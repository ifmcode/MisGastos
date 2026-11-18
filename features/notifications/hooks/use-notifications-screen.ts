import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import { useAuth } from "@/hooks/use-auth";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useNotifications } from "./use-notifications";
import { resolveNotificationTarget } from "../utils/notifications.utils";
import {
  buildNotificationRows,
  type NotificationRowModel,
} from "../utils/notification-rows";

export type NotificationsScreenStatus = "loading" | "error" | "ready";

export interface NotificationsScreenController {
  status: NotificationsScreenStatus;
  rows: NotificationRowModel[];
  refreshing: boolean;
  error: string | null;
  actionError: string | null;
  reload: () => void;
  refresh: () => void;
  /** Marks an unread row as read and opens its target detail. */
  openRow: (notificationId: string) => void;
}

/**
 * Inbox composition: the notification list, the actor names of the friend
 * overview and the target navigation. The list is not blocked by the overview,
 * because a missing friend has its own fallback copy.
 */
export function useNotificationsScreen(): NotificationsScreenController {
  const router = useRouter();
  const { user } = useAuth();
  const locale = useAppLocale();
  const { tr } = useScopedTranslation("notifications");
  const inbox = useNotifications({ viewerUid: user?.uid });
  const overview = useFriendsOverview({ viewerUid: user?.uid });
  const [refreshing, setRefreshing] = useState(false);

  const rows = useMemo(
    () =>
      buildNotificationRows(inbox.notifications, {
        friends: overview.overview.friends,
        formatCurrency: locale.formatCurrency,
        formatDateTime: locale.formatDateTime,
        t: tr,
      }),
    [inbox.notifications, locale, overview.overview.friends, tr],
  );

  const openRow = useCallback(
    (notificationId: string) => {
      const notification = inbox.notifications.find(
        (item) => item.id === notificationId,
      );
      if (!notification) return;

      if (notification.readAt === null) void inbox.markRead(notification.id);

      const target = resolveNotificationTarget(notification);
      if (!target) return;

      if (target.kind === "settlement") {
        router.push(`/social/settlements/${target.settlementId}` as Href);
        return;
      }

      router.push(`/social/friends/${target.friendUid}` as Href);
    },
    [inbox.markRead, inbox.notifications, router],
  );

  const reload = useCallback(() => {
    inbox.reload();
    void overview.reload();
  }, [inbox.reload, overview.reload]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all([inbox.refresh(), overview.refresh()]).finally(() => {
      setRefreshing(false);
    });
  }, [inbox.refresh, overview.refresh]);

  const status: NotificationsScreenStatus = inbox.loading
    ? "loading"
    : inbox.error
      ? "error"
      : "ready";

  return {
    status,
    rows,
    refreshing,
    error: inbox.error,
    actionError: inbox.actionError,
    reload,
    refresh,
    openRow,
  };
}
