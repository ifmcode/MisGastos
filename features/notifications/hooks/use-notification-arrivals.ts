import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import type { AppNotification } from "../types/notification.types";
import {
  isSuppressedNotificationRoute,
  selectNotificationArrivals,
  shouldPresentArrivals,
} from "../utils/notification-banner";
import { useNotificationsService } from "./use-notifications-service";

export interface UseNotificationArrivalsOptions {
  viewerUid: string | undefined;
  /** Receives the new, still pending notifications in arrival order. */
  onArrived: (notifications: readonly AppNotification[]) => void;
}

/**
 * Foreground listener behind the banner. The arrival decision lives in the pure
 * helpers: the first snapshot only primes the known ids, later ones report the
 * new pending rows — and only while the app is active and the inbox, sign-in
 * and verification routes are out of focus.
 */
export function useNotificationArrivals({
  viewerUid,
  onArrived,
}: UseNotificationArrivalsOptions): void {
  const pathname = usePathname();
  const service = useNotificationsService();
  const suppressedRef = useRef(false);

  useEffect(() => {
    suppressedRef.current = isSuppressedNotificationRoute(pathname);
  }, [pathname]);

  useEffect(() => {
    let knownIds: ReadonlySet<string> = new Set<string>();
    let primed = false;

    const unsubscribe = service.subscribe(viewerUid ?? "", (list) => {
      const selection = selectNotificationArrivals(knownIds, primed, list);

      primed = true;
      knownIds = new Set(selection.knownIds);

      const present = shouldPresentArrivals({
        suppressed: suppressedRef.current,
        foreground: AppState.currentState === "active",
        arrivals: selection.arrivals,
      });

      if (present) onArrived(selection.arrivals);
    });

    return unsubscribe;
  }, [onArrived, service, viewerUid]);
}
