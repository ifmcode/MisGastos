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
}: UseAsyncCollectionOptions<T>): AsyncCollection<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        setItems(await load(ownerId));
      } catch (loadError: unknown) {
        setError(describeError(loadError));
      } finally {
        if (mode === "refresh") {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [ownerId, load, describeError],
  );

  useEffect(() => {
    void loadItems("initial");
  }, [loadItems]);

  const reload = useCallback(() => loadItems("initial"), [loadItems]);
  const refresh = useCallback(() => loadItems("refresh"), [loadItems]);

  return { items, setItems, loading, refreshing, error, reload, refresh };
}
