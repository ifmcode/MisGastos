import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getSharedExpenseErrorCode } from "../services/shared-expense.errors";
import type { SharedExpense } from "../types/shared-expense.types";
import { filterActiveExpenses } from "../utils/expense-ledger";
import { useSharedExpensesService } from "./use-shared-expenses-service";

type LoadMode = "initial" | "refresh";

export interface UseSharedExpenseListOptions {
  viewerUid: string | undefined;
}

export interface SharedExpenseListController {
  /** Active expenses only: soft-deleted rows keep no UI presence. */
  expenses: SharedExpense[];
  loading: boolean;
  error: string | null;
  actionError: string | null;
  reload: () => void;
  refresh: () => Promise<void>;
  setActionError: (message: string | null) => void;
}

/** Loads the viewer's expenses with initial, refresh and focus reloads. */
export function useSharedExpenseList({
  viewerUid,
}: UseSharedExpenseListOptions): SharedExpenseListController {
  const service = useSharedExpensesService();
  const { tr } = useScopedTranslation("sharedExpenses");
  const [stored, setStored] = useState<SharedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid) {
        setStored([]);
        setError(null);
        setLoading(false);
        return;
      }

      requestRef.current += 1;
      const request = requestRef.current;

      if (mode === "initial") setLoading(true);
      setError(null);

      try {
        const loaded = await service.getExpenses(viewerUid);
        if (requestRef.current === request) setStored(loaded);
      } catch (loadError: unknown) {
        if (requestRef.current === request) {
          setError(
            tr(`errors.${getSharedExpenseErrorCode(loadError, "LOAD_FAILED")}`),
          );
        }
      } finally {
        if (requestRef.current === request && mode === "initial") {
          setLoading(false);
        }
      }
    },
    [viewerUid, service, tr],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const hasFocusedOnce = useRef(false);
  const refresh = useCallback(() => load("refresh"), [load]);

  // Another device can add an expense while this tab is already open.
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      void refresh();
    }, [refresh]),
  );

  const reload = useCallback(() => {
    void load("initial");
  }, [load]);

  const expenses = useMemo(() => filterActiveExpenses(stored), [stored]);

  return {
    expenses,
    loading,
    error,
    actionError,
    reload,
    refresh,
    setActionError,
  };
}
