import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import { useAuth } from "@/hooks/use-auth";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type {
  NotificationSegment,
  NotificationSegmentCounts,
} from "../types/notification-segment.types";
import {
  buildNotificationRows,
  type NotificationRowModel,
} from "../utils/notification-rows";
import {
  buildNotificationTargetHref,
  getNotificationSegments,
  isInboxActionNotificationType,
  isUnreadNotification,
  resolveNotificationTarget,
} from "../utils/notifications.utils";
import {
  hasInboxRequestsContent,
  useInboxRequests,
  type InboxRequestsController,
} from "./use-inbox-requests";
import { useNotifications } from "./use-notifications";

export type NotificationsScreenStatus = "loading" | "error" | "ready";

export interface NotificationsScreenController {
  status: NotificationsScreenStatus;
  segment: NotificationSegment;
  segmentCounts: NotificationSegmentCounts;
  /** Rows of the active segment only; action types are never rows. */
  rows: NotificationRowModel[];
  /** Actionable queue of Pendientes (friend, group and join requests). */
  requests: InboxRequestsController;
  hasRequests: boolean;
  error: string | null;
  actionError: string | null;
  /** Mark-all-read lives in Pendientes and needs at least one unread row. */
  canMarkAllRead: boolean;
  changeSegment: (segment: NotificationSegment) => void;
  reload: () => void;
  markAllRead: () => Promise<void>;
  /** Marks the row read and opens the target derived from `type` + payload. */
  openRow: (notificationId: string) => void;
}

/**
 * Inbox composition: the two segments, the rows of the active one, the action
 * queue of Pendientes, the actor names of the friend overview and the target
 * navigation. Action notifications never become rows, so the queue is their
 * only representation.
 */
export function useNotificationsScreen(): NotificationsScreenController {
  const router = useRouter();
  const { user } = useAuth();
  const locale = useAppLocale();
  const { tr } = useScopedTranslation("notifications");
  const inbox = useNotifications({ viewerUid: user?.uid });
  const requests = useInboxRequests();
  const overview = useFriendsOverview({ viewerUid: user?.uid });
  const [segment, setSegment] = useState<NotificationSegment>("pending");

  const informational = useMemo(
    () =>
      inbox.notifications.filter(
        (notification) => !isInboxActionNotificationType(notification.type),
      ),
    [inbox.notifications],
  );

  const segments = useMemo(
    () => getNotificationSegments(informational),
    [informational],
  );

  const rows = useMemo(
    () =>
      buildNotificationRows(
        segment === "pending" ? segments.pending : segments.viewed,
        {
          friends: overview.overview.friends,
          formatCurrency: locale.formatCurrency,
          formatRelativeDate: locale.formatRelative,
          t: tr,
        },
      ),
    [locale, overview.overview.friends, segment, segments, tr],
  );

  const openRow = useCallback(
    (notificationId: string) => {
      const notification = inbox.notifications.find(
        (item) => item.id === notificationId,
      );
      if (!notification) return;

      void inbox.markRead(notification.id);

      const target = resolveNotificationTarget(notification);
      if (target) router.push(buildNotificationTargetHref(target) as Href);
    },
    [inbox.notifications, inbox.markRead, router],
  );

  const markAllRead = useCallback(async () => {
    await inbox.markAllRead();
  }, [inbox.markAllRead]);

  const reload = useCallback(() => {
    inbox.reload();
    requests.reload();
    void overview.reload();
  }, [inbox.reload, overview.reload, requests.reload]);

  const status: NotificationsScreenStatus = inbox.loading
    ? "loading"
    : inbox.error
      ? "error"
      : "ready";

  return {
    status,
    segment,
    segmentCounts: {
      pending: segments.pending.length + requests.total,
      viewed: segments.viewed.length,
    },
    rows,
    requests,
    hasRequests: hasInboxRequestsContent(requests),
    error: inbox.error,
    actionError: inbox.actionError,
    canMarkAllRead:
      segment === "pending" && segments.pending.some(isUnreadNotification),
    changeSegment: setSegment,
    reload,
    markAllRead,
    openRow,
  };
}
