import { useEffect } from "react";
import { AppState } from "react-native";

import { subscribeSyncTrigger } from "@/shared/services/sync/sync-trigger";

export const SYNC_WRITE_DEBOUNCE_MS = 1_500;
export const SYNC_PENDING_INTERVAL_MS = 300_000;

export type SyncTriggerInput = {
  enabled: boolean;
  ownerId: string | null;
  isOffline: boolean;
  pendingCount: number;
  run: () => void;
};

/**
 * ADR §5.1 triggers: login, reconnect, app foreground, a debounced local write,
 * a five-minute timer while changes are pending, and the manual retry (owned by
 * the caller). Each effect is a no-op while the feature or the session is off.
 */
export function useSyncTriggers({
  enabled,
  ownerId,
  isOffline,
  pendingCount,
  run,
}: SyncTriggerInput): void {
  useEffect(() => {
    if (!enabled || !ownerId) return undefined;

    run();
    return undefined;
  }, [enabled, ownerId, run]);

  useEffect(() => {
    if (!enabled || !ownerId || isOffline) return undefined;

    run();
    return undefined;
  }, [enabled, ownerId, isOffline, run]);

  useEffect(() => {
    if (!enabled || !ownerId) return undefined;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") run();
    });

    return () => subscription.remove();
  }, [enabled, ownerId, run]);

  useEffect(() => {
    if (!enabled || !ownerId) return undefined;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeSyncTrigger(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        run();
      }, SYNC_WRITE_DEBOUNCE_MS);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [enabled, ownerId, run]);

  useEffect(() => {
    if (!enabled || !ownerId || pendingCount === 0) return undefined;

    const interval = setInterval(run, SYNC_PENDING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [enabled, ownerId, run, pendingCount]);
}
