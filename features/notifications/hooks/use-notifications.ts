import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getNotificationErrorCode } from "../services/notification.errors";
import type { AppNotification } from "../types/notification.types";
import { useNotificationsService } from "./use-notifications-service";

type LoadMode = "initial" | "refresh";

export interface UseNotificationsOptions {
  viewerUid: string | undefined;
}

export interface NotificationsController {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  /** Failure of a mark-as-read, announced without breaking the list. */
  actionError: string | null;
  reload: () => void;
  refresh: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
}

/** Inbox of the viewer with initial, refresh and focus reloads. */
export function useNotifications({
  viewerUid,
}: UseNotificationsOptions): NotificationsController {
  const service = useNotificationsService();
  const { tr } = useScopedTranslation("notifications");
  const [stored, setStored] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid) {
        setStored([]);
        setError(null);
        setLoading(false);
        return;
      }

      requestRef.current += 1;
      const request = requestRef.current;

      if (mode === "initial") setLoading(true);
      setError(null);

      try {
        const loaded = await service.getNotifications(viewerUid);
        if (requestRef.current === request) setStored(loaded);
      } catch (loadError: unknown) {
        if (requestRef.current === request) {
          setError(
            tr(`errors.${getNotificationErrorCode(loadError, "LOAD_FAILED")}`),
          );
        }
      } finally {
        if (requestRef.current === request && mode === "initial") {
          setLoading(false);
        }
      }
    },
    [service, tr, viewerUid],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const hasFocusedOnce = useRef(false);
  const refresh = useCallback(() => load("refresh"), [load]);

  // Returning from the settlement detail must refresh the unread badge.
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      void refresh();
    }, [refresh]),
  );

  const reload = useCallback(() => {
    void load("initial");
  }, [load]);

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!viewerUid) return;

      const readAt = new Date().toISOString();
      setActionError(null);

      try {
        await service.markRead(viewerUid, notificationId, readAt);
        setStored((current) =>
          current.map((notification) =>
            notification.id === notificationId
              ? { ...notification, readAt }
              : notification,
          ),
        );
      } catch (readError: unknown) {
        setActionError(
          tr(`errors.${getNotificationErrorCode(readError, "SAVE_FAILED")}`),
        );
      }
    },
    [service, tr, viewerUid],
  );

  return {
    notifications: stored,
    unreadCount: service.countUnread(stored),
    loading,
    error,
    actionError,
    reload,
    refresh,
    markRead,
  };
}
