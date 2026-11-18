import { useCallback, useState } from "react";

import type { AppNotification } from "../types/notification.types";

export interface NotificationQueue {
  /** Head of the queue: the only notification presented at a time. */
  current: AppNotification | null;
  enqueue: (notifications: readonly AppNotification[]) => void;
  remove: (notificationId: string) => void;
  clear: () => void;
}

/**
 * Silent banner queue: arrival order, one at a time, no counter. Duplicates are
 * dropped by id so a listener re-emission cannot present the same row twice.
 */
export function useNotificationQueue(): NotificationQueue {
  const [queue, setQueue] = useState<AppNotification[]>([]);

  const enqueue = useCallback((notifications: readonly AppNotification[]) => {
    if (notifications.length === 0) return;

    setQueue((current) => {
      const queued = new Set(current.map((notification) => notification.id));
      const additions = notifications.filter(
        (notification) => !queued.has(notification.id),
      );

      return additions.length === 0 ? current : [...current, ...additions];
    });
  }, []);

  const remove = useCallback((notificationId: string) => {
    setQueue((current) =>
      current.some((notification) => notification.id === notificationId)
        ? current.filter((notification) => notification.id !== notificationId)
        : current,
    );
  }, []);

  const clear = useCallback(() => setQueue([]), []);

  return { current: queue[0] ?? null, enqueue, remove, clear };
}
