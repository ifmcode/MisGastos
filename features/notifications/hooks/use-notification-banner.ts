import { usePathname, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useFriendsService } from "@/features/friends/hooks/use-friends-service";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { useAuth } from "@/hooks/use-auth";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { AppNotification } from "../types/notification.types";
import {
  buildNotificationBanner,
  isSuppressedNotificationRoute,
  type NotificationBannerModel,
} from "../utils/notification-banner";
import {
  buildNotificationTargetHref,
  resolveNotificationTarget,
} from "../utils/notifications.utils";
import { useNotificationArrivals } from "./use-notification-arrivals";
import { useNotificationQueue } from "./use-notification-queue";
import { useNotificationsService } from "./use-notifications-service";

const AUTO_DISMISS_MS = 4000;

export interface NotificationBannerController {
  banner: NotificationBannerModel | null;
  onOpen: () => void;
  onDismiss: () => void;
}

function readActorUid(notification: AppNotification | null): string | null {
  const value = notification?.payload.friendUid;

  if (typeof value !== "string") return null;

  const uid = value.trim();
  return uid.length > 0 ? uid : null;
}

/**
 * Foreground banner of TICKET-047: one notification at a time, 4 seconds,
 * tappable and dismissible. Dismiss and time-out write only `seenAt`; opening
 * writes both stamps and navigates with the same target helpers as the inbox.
 */
export function useNotificationBanner(): NotificationBannerController {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const service = useNotificationsService();
  const friendsService = useFriendsService();
  const locale = useAppLocale();
  const { tr } = useScopedTranslation("notifications");
  const queue = useNotificationQueue();
  const { clear, enqueue, remove } = queue;
  const current = queue.current;
  const viewerUid = user?.uid;
  const suppressed = isSuppressedNotificationRoute(pathname);
  const [actorName, setActorName] = useState<string | null>(null);

  useNotificationArrivals({ viewerUid, onArrived: enqueue });

  // A new viewer must not inherit the previous account's queue.
  useEffect(() => {
    clear();
  }, [clear, viewerUid]);

  // Reaching the inbox drops visible and queued banners without stamping, so
  // their rows stay Pendientes; arrivals are already dropped by the listener.
  useEffect(() => {
    if (suppressed) clear();
  }, [clear, suppressed]);

  const actorUid = readActorUid(current);

  useEffect(() => {
    setActorName(null);
    if (!actorUid) return;

    let active = true;

    void friendsService
      .getPublicProfile(actorUid)
      .then((profile) => {
        if (active && profile) setActorName(getFriendDisplayName(profile));
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [actorUid, friendsService]);

  const banner = useMemo(
    () =>
      current
        ? buildNotificationBanner(current, {
            friends: [],
            actorName,
            formatCurrency: locale.formatCurrency,
            formatRelativeDate: locale.formatRelative,
            t: tr,
          })
        : null,
    [actorName, current, locale, tr],
  );

  const dismiss = useCallback(
    (notificationId: string) => {
      remove(notificationId);
      if (!viewerUid) return;

      void service
        .markSeen(viewerUid, notificationId, new Date().toISOString())
        .catch(() => undefined);
    },
    [remove, service, viewerUid],
  );

  const onDismiss = useCallback(() => {
    if (current) dismiss(current.id);
  }, [current, dismiss]);

  const onOpen = useCallback(() => {
    if (!current) return;

    const target = resolveNotificationTarget(current);
    remove(current.id);

    if (viewerUid) {
      void service
        .markRead(viewerUid, current.id, new Date().toISOString())
        .catch(() => undefined);
    }

    if (target) router.push(buildNotificationTargetHref(target) as Href);
  }, [current, remove, router, service, viewerUid]);

  useEffect(() => {
    if (!current || suppressed) return;

    const notificationId = current.id;
    const timer = setTimeout(() => dismiss(notificationId), AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [current, dismiss, suppressed]);

  return { banner: suppressed ? null : banner, onOpen, onDismiss };
}
