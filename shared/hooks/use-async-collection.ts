import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useNetworkStatus } from "@/shared/hooks/use-network-status";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

type LoadMode = "initial" | "refresh";

export interface UseAsyncCollectionOptions<T> {
  /** Owner id; when missing the collection is cleared without loading. */
  ownerId: string | undefined;
  load: (ownerId: string) => Promise<T[]>;
  describeError: (error: unknown) => string;
  /**
   * Local read cache. When it returns a list, the initial load shows it first
   * and then replaces it with the remote result; a cold cache (null) keeps the
   * usual loading/error behaviour. Pull-to-refresh stays remote-only.
   */
  readCached?: (ownerId: string) => Promise<T[] | null>;
  /**
   * Reloads the collection when the connection comes back, so the screen does
   * not keep serving cached data after the network returns. Only wired while the
   * offline read cache is enabled.
   */
  refreshOnReconnect?: boolean;
}

export interface AsyncCollection<T> {
  items: T[];
  setItems: Dispatch<SetStateAction<T[]>>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

/** Loads an owner-scoped collection with initial loading and pull-to-refresh. */
export function useAsyncCollection<T>({
  ownerId,
  load,
  describeError,
  readCached,
  refreshOnReconnect = false,
}: UseAsyncCollectionOptions<T>): AsyncCollection<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reconnectRefreshEnabled =
    refreshOnReconnect && isOfflineFirstEnabled();
  const { isOffline } = useNetworkStatus(reconnectRefreshEnabled);
  const wasOffline = useRef(false);

  const readCachedSafely = useCallback(
    async (currentOwnerId: string): Promise<T[] | null> => {
      if (!readCached) return null;

      try {
        return await readCached(currentOwnerId);
      } catch {
        // A cache miss or failure must never break the remote load.
        return null;
      }
    },
    [readCached],
  );

  const loadItems = useCallback(
    async (mode: LoadMode) => {
      if (!ownerId) {
        setItems([]);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (mode === "refresh") {
        setRefreshing(true);
        setError(null);

        try {
          setItems(await load(ownerId));
        } catch (loadError: unknown) {
          setError(describeError(loadError));
        } finally {
          setRefreshing(false);
        }

        return;
      }

      setLoading(true);
      setError(null);

      const cached = await readCachedSafely(ownerId);
      if (cached !== null) {
        setItems(cached);
        setLoading(false);
      }

      try {
        setItems(await load(ownerId));
      } catch (loadError: unknown) {
        // With a cached list the screen stays useful on a network failure.
        if (cached === null) setError(describeError(loadError));
      } finally {
        setLoading(false);
      }
    },
    [ownerId, load, describeError, readCachedSafely],
  );

  useEffect(() => {
    void loadItems("initial");
  }, [loadItems]);

  const reload = useCallback(() => loadItems("initial"), [loadItems]);
  const refresh = useCallback(() => loadItems("refresh"), [loadItems]);

  // Reload once when connectivity returns, so the screen stops showing cached
  // data as soon as the remote is reachable again. Phase 5 replaces this with
  // the sync engine's pull.
  useEffect(() => {
    if (!reconnectRefreshEnabled) return;

    const cameBackOnline = wasOffline.current && !isOffline;
    wasOffline.current = isOffline;

    if (cameBackOnline) void refresh();
  }, [isOffline, reconnectRefreshEnabled, refresh]);

  return { items, setItems, loading, refreshing, error, reload, refresh };
}
