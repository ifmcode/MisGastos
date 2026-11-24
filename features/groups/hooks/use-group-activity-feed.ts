import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type {
  GroupActivity,
  GroupActivityCursor,
} from "../types/group-activity.types";
import { getGroupActivityErrorCopy } from "../utils/group-activity-copy";
import type {
  GroupActivityFeedController,
  UseGroupActivityFeedOptions,
} from "./use-group-activity-feed.types";
import { useGroupsService } from "./use-groups-service";

export type {
  GroupActivityFeedController,
  UseGroupActivityFeedOptions,
} from "./use-group-activity-feed.types";

type LoadMode = "initial" | "refresh";

/**
 * Cursor-paginated feed of one group: first page on mount, a silent reload on
 * focus, and **Cargar más** appending with the page's `nextCursor` (last raw
 * row), so a dropped malformed event never stalls pagination. The request id
 * drops stale responses and the guard avoids concurrent appends.
 */
export function useGroupActivityFeed({
  viewerUid,
  groupId,
}: UseGroupActivityFeedOptions): GroupActivityFeedController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const [items, setItems] = useState<GroupActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] =
    useState<GroupActivityCursor | null>(null);
  const loadingMoreRef = useRef(false);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      requestRef.current += 1;
      const request = requestRef.current;

      if (!viewerUid || !groupId) {
        setItems([]);
        setNextCursor(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      setError(null);
      // The previous page's cursor never survives a reload of the first page.
      setNextCursor(null);

      try {
        const page = await service.getGroupActivity(viewerUid, groupId, {});
        if (requestRef.current !== request) return;

        setItems(page.items);
        setNextCursor(page.nextCursor);
      } catch (loadError: unknown) {
        if (requestRef.current !== request) return;

        setError(getGroupActivityErrorCopy(loadError, tr));
      } finally {
        if (requestRef.current === request) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [groupId, service, tr, viewerUid],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const hasFocusedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      void load("refresh");
    }, [load]),
  );

  const loadMore = useCallback(async () => {
    if (!viewerUid || !groupId || !nextCursor || loadingMoreRef.current) return;

    const request = requestRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError(null);

    try {
      const page = await service.getGroupActivity(viewerUid, groupId, {
        after: nextCursor,
      });
      if (requestRef.current !== request) return;

      setItems((current) => {
        const known = new Set(current.map((item) => item.id));

        return [...current, ...page.items.filter((item) => !known.has(item.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (loadError: unknown) {
      if (requestRef.current !== request) return;

      setError(getGroupActivityErrorCopy(loadError, tr));
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [groupId, nextCursor, service, tr, viewerUid]);

  const reload = useCallback(() => {
    void load("initial");
  }, [load]);

  const refresh = useCallback(() => load("refresh"), [load]);

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore: nextCursor !== null,
    reload,
    refresh,
    loadMore,
  };
}
