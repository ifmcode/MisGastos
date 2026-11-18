import { useFocusEffect } from "expo-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getNotificationErrorCode } from "../services/notification.errors";
import type { AppNotification } from "../types/notification.types";
import { useNotificationsService } from "./use-notifications-service";

type LoadMode = "initial" | "refresh";

export interface NotificationsStore {
  notifications: AppNotification[];
  setNotifications: Dispatch<SetStateAction<AppNotification[]>>;
  loading: boolean;
  error: string | null;
  reload: () => void;
  refresh: () => Promise<void>;
}

export interface UseNotificationsStoreOptions {
  viewerUid: string | undefined;
}

/** Snapshot of the viewer's inbox with initial, refresh and focus reloads. */
export function useNotificationsStore({
  viewerUid,
}: UseNotificationsStoreOptions): NotificationsStore {
  const service = useNotificationsService();
  const { tr } = useScopedTranslation("notifications");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid) {
        setNotifications([]);
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
        if (requestRef.current === request) setNotifications(loaded);
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

  return {
    notifications,
    setNotifications,
    loading,
    error,
    reload,
    refresh,
  };
}
