import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupExpenseErrorCode } from "../services/group-expense.errors";
import type { GroupBalances } from "../types/group-balance.types";
import { useGroupExpensesService } from "./use-group-expenses-service";

type LoadMode = "initial" | "refresh";

export interface UseGroupBalancesOptions {
  viewerUid: string | undefined;
  groupId: string;
}

export interface GroupBalancesController {
  balances: GroupBalances | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  refresh: () => Promise<void>;
}

/** Raw nets and the transfer view of one group, refreshed when it regains focus. */
export function useGroupBalances({
  viewerUid,
  groupId,
}: UseGroupBalancesOptions): GroupBalancesController {
  const service = useGroupExpensesService();
  const { tr } = useScopedTranslation("groups");
  const [balances, setBalances] = useState<GroupBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid || !groupId) {
        setBalances(null);
        setError(null);
        setLoading(false);
        return;
      }

      requestRef.current += 1;
      const request = requestRef.current;
      const isInitialLoad = mode === "initial";

      if (isInitialLoad) setLoading(true);
      setError(null);

      try {
        const loaded = await service.getGroupBalances(viewerUid, groupId);
        if (requestRef.current === request) setBalances(loaded);
      } catch (loadError: unknown) {
        if (requestRef.current === request) {
          const code = getGroupExpenseErrorCode(loadError, "LOAD_FAILED");
          setError(
            tr(code === "LOAD_FAILED" ? "balancesLoadFailed" : `errors.${code}`),
          );
        }
      } finally {
        if (requestRef.current === request) {
          setLoading(false);
        }
      }
    },
    [groupId, service, tr, viewerUid],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const hasFocusedOnce = useRef(false);

  // Editing an expense happens on another route, so the section refreshes when
  // the group detail comes back to the foreground.
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

  return {
    balances,
    loading,
    error,
    reload,
    refresh,
  };
}
