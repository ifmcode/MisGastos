import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupExpenseErrorCode } from "../services/group-expense.errors";
import type { GroupExpense } from "../types/group-expense.types";
import { filterActiveGroupExpenses } from "../utils/group-expense-ledger";
import { useGroupExpensesService } from "./use-group-expenses-service";

type LoadMode = "initial" | "refresh";

export interface UseGroupExpensesOptions {
  viewerUid: string | undefined;
  groupId: string;
}

export interface GroupExpensesController {
  /** Active expenses only, newest first: soft-deleted rows keep no UI presence. */
  expenses: GroupExpense[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  refresh: () => Promise<void>;
}

/** Loads the expenses of one group with initial, refresh and focus reloads. */
export function useGroupExpenses({
  viewerUid,
  groupId,
}: UseGroupExpensesOptions): GroupExpensesController {
  const service = useGroupExpensesService();
  const { tr } = useScopedTranslation("groupExpenses");
  const [stored, setStored] = useState<GroupExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid || !groupId) {
        setStored([]);
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
        const loaded = await service.getGroupExpenses(viewerUid, groupId);
        if (requestRef.current === request) setStored(loaded);
      } catch (loadError: unknown) {
        if (requestRef.current === request) {
          setError(
            tr(`errors.${getGroupExpenseErrorCode(loadError, "LOAD_FAILED")}`),
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

  // Creating or deleting an expense happens on the detail route; the group
  // detail refreshes its list when it comes back to the foreground.
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
  const expenses = useMemo(() => filterActiveGroupExpenses(stored), [stored]);

  return { expenses, loading, error, reload, refresh };
}
