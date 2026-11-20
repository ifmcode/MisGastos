import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupErrorCode, type GroupErrorCode } from "../services/group.errors";
import type { GroupDetail } from "../types/group.types";
import { useGroupsService } from "./use-groups-service";

type LoadMode = "initial" | "refresh";

/** Errors that mean the group is not readable by this viewer. */
export const MISSING_GROUP_CODES: readonly GroupErrorCode[] = [
  "GROUP_NOT_FOUND",
  "NOT_GROUP_MEMBER",
  "PERMISSION_DENIED",
];

export interface UseGroupDetailOptions {
  viewerUid: string | undefined;
  groupId: string;
}

export interface GroupDetailController {
  detail: GroupDetail | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  missing: boolean;
  reload: () => void;
  refresh: () => Promise<void>;
}

/** Loads one group detail with missing-state detection and focus refresh. */
export function useGroupDetail({
  viewerUid,
  groupId,
}: UseGroupDetailOptions): GroupDetailController {
  const service = useGroupsService();
  const { tr } = useScopedTranslation("groups");
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid || !groupId) {
        setDetail(null);
        setMissing(true);
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
        const loaded = await service.getGroupDetail(viewerUid, groupId);
        if (requestRef.current === request) {
          setDetail(loaded);
          setMissing(false);
        }
      } catch (loadError: unknown) {
        if (requestRef.current !== request) return;

        const code = getGroupErrorCode(loadError, "LOAD_FAILED");
        if (MISSING_GROUP_CODES.includes(code)) {
          setDetail(null);
          setMissing(true);
        } else {
          setError(
            tr(code === "LOAD_FAILED" ? "detail.loadFailed" : `errors.${code}`),
          );
        }
      } finally {
        if (requestRef.current === request) {
          if (mode === "refresh") setRefreshing(false);
          else setLoading(false);
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

  const reload = useCallback(() => {
    void load("initial");
  }, [load]);

  const refresh = useCallback(() => load("refresh"), [load]);

  return { detail, loading, refreshing, error, missing, reload, refresh };
}
