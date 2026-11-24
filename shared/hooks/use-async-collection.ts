import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

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
}: UseAsyncCollectionOptions<T>): AsyncCollection<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return { items, setItems, loading, refreshing, error, reload, refresh };
}
