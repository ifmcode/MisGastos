import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupExpenseErrorCode } from "../services/group-expense.errors";
import type {
  GroupBalanceSummary,
  ViewerGroupBalance,
} from "../types/group-balance.types";
import { useGroupExpensesService } from "./use-group-expenses-service";

type LoadMode = "initial" | "refresh";

export interface UseGroupBalanceSummariesOptions {
  viewerUid: string | undefined;
}

export interface GroupBalanceSummariesController {
  /** Viewer nets by group id; an empty map is a valid "nothing owed" state. */
  summaries: Map<string, ViewerGroupBalance[]>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => void;
  refresh: () => Promise<void>;
}

function toSummaryMap(
  summaries: readonly GroupBalanceSummary[],
): Map<string, ViewerGroupBalance[]> {
  return new Map(summaries.map((summary) => [summary.groupId, summary.balances]));
}

/**
 * The viewer's net per group for the Social list. The map starts empty and the
 * list renders without it, so the groups never wait for these reads.
 */
export function useGroupBalanceSummaries({
  viewerUid,
}: UseGroupBalanceSummariesOptions): GroupBalanceSummariesController {
  const service = useGroupExpensesService();
  const { tr } = useScopedTranslation("groups");
  const [summaries, setSummaries] = useState<Map<string, ViewerGroupBalance[]>>(
    () => new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid) {
        setSummaries(new Map());
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
        const loaded = await service.getGroupBalanceSummaries(viewerUid);
        if (requestRef.current === request) setSummaries(toSummaryMap(loaded));
      } catch (loadError: unknown) {
        if (requestRef.current === request) {
          const code = getGroupExpenseErrorCode(loadError, "LOAD_FAILED");
          setError(
            tr(code === "LOAD_FAILED" ? "summariesLoadFailed" : `errors.${code}`),
          );
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

  return useMemo(
    () => ({ summaries, loading, refreshing, error, reload, refresh }),
    [error, loading, refresh, refreshing, reload, summaries],
  );
}
