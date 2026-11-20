import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupErrorCode } from "../services/group.errors";
import type { Group } from "../types/group.types";
import { useGroupsService } from "./use-groups-service";

type LoadMode = "initial" | "refresh";

export interface UseGroupsOptions {
  viewerUid: string | undefined;
}

export interface GroupsController {
  groups: Group[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

/** Groups the viewer belongs to, with initial loading and pull-to-refresh. */
export function useGroups({ viewerUid }: UseGroupsOptions): GroupsController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid) {
        setGroups([]);
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
        const loaded = await service.getGroups(viewerUid);
        if (requestRef.current === request) setGroups(loaded);
      } catch (loadError: unknown) {
        if (requestRef.current === request) {
          setError(tr(`errors.${getGroupErrorCode(loadError, "LOAD_FAILED")}`));
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
    [service, tr, viewerUid],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const hasFocusedOnce = useRef(false);

  // An accepted invitation adds a group from another device or screen.
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

  return { groups, loading, refreshing, error, reload, refresh };
}
