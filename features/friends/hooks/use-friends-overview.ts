import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getFriendErrorCode } from "../services/friend.errors";
import type { FriendsOverview } from "../types/friend.types";
import { useFriendsService } from "./use-friends-service";

type LoadMode = "initial" | "refresh";

const EMPTY_OVERVIEW: FriendsOverview = {
  friends: [],
  incoming: [],
  outgoing: [],
};

export interface UseFriendsOverviewOptions {
  viewerUid: string | undefined;
}

export interface FriendsOverviewController {
  overview: FriendsOverview;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

/** Loads friends, incoming and outgoing requests with pull-to-refresh. */
export function useFriendsOverview({
  viewerUid,
}: UseFriendsOverviewOptions): FriendsOverviewController {
  const service = useFriendsService();
  const { tr } = useScopedTranslation("friends");
  const [overview, setOverview] = useState<FriendsOverview>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid) {
        setOverview(EMPTY_OVERVIEW);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      requestRef.current += 1;
      const request = requestRef.current;

      if (mode === "refresh") {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const loaded = await service.getOverview(viewerUid);
        if (requestRef.current === request) setOverview(loaded);
      } catch (loadError: unknown) {
        if (requestRef.current === request) {
          setError(tr(`errors.${getFriendErrorCode(loadError, "LOAD_FAILED")}`));
        }
      } finally {
        if (requestRef.current === request) {
          if (mode === "refresh") {
            setRefreshing(false);
          } else {
            setLoading(false);
          }
        }
      }
    },
    [viewerUid, service, tr],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const hasFocusedOnce = useRef(false);

  // Requests can arrive from another device while this tab is open.
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      void load("refresh");
    }, [load]),
  );

  const reload = useCallback(() => load("initial"), [load]);
  const refresh = useCallback(() => load("refresh"), [load]);

  return { overview, loading, refreshing, error, reload, refresh };
}
