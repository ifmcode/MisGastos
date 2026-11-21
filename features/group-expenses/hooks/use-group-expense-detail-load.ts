import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import type { GroupDetail } from "@/features/groups/types/group.types";
import { useGroupsService } from "@/features/groups/hooks/use-groups-service";
import { useAuth } from "@/hooks/use-auth";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import {
  getGroupExpenseErrorCode,
  type GroupExpenseErrorCode,
} from "../services/group-expense.errors";
import type { GroupExpense } from "../types/group-expense.types";
import { useGroupExpensesService } from "./use-group-expenses-service";

type LoadMode = "initial" | "refresh";

/** Codes that mean the viewer cannot read the expense any more. */
export const MISSING_GROUP_EXPENSE_CODES: readonly GroupExpenseErrorCode[] = [
  "EXPENSE_NOT_FOUND",
  "GROUP_NOT_FOUND",
  "NOT_GROUP_MEMBER",
  "PERMISSION_DENIED",
];

export interface UseGroupExpenseDetailLoadOptions {
  expenseId: string;
}

export interface GroupExpenseDetailLoadState {
  expense: GroupExpense | null;
  /** Group and members of the expense, needed for names and permissions. */
  detail: GroupDetail | null;
  loading: boolean;
  error: string | null;
  missing: boolean;
  reload: () => void;
}

/**
 * Loads one group expense and its group. The service checks membership, so an
 * unknown, deleted or foreign id resolves to the safe missing state; the group
 * read is what supplies the member names and the edit permission.
 */
export function useGroupExpenseDetailLoad({
  expenseId,
}: UseGroupExpenseDetailLoadOptions): GroupExpenseDetailLoadState {
  const service = useGroupExpensesService();
  const groupsService = useGroupsService();
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const { tr } = useScopedTranslation("groupExpenses");
  const [expense, setExpense] = useState<GroupExpense | null>(null);
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!viewerUid || !expenseId) {
        setExpense(null);
        setDetail(null);
        setMissing(true);
        setError(null);
        setLoading(false);
        return;
      }

      requestRef.current += 1;
      const request = requestRef.current;
      if (mode === "initial") setLoading(true);
      setError(null);

      try {
        const loaded = await service.getGroupExpense(viewerUid, expenseId);
        const groupDetail = await groupsService.getGroupDetail(
          viewerUid,
          loaded.groupId,
        );
        if (requestRef.current !== request) return;

        if (loaded.deletedAt !== null) {
          setExpense(null);
          setDetail(null);
          setMissing(true);
          return;
        }

        setExpense(loaded);
        setDetail(groupDetail);
        setMissing(false);
      } catch (loadError: unknown) {
        if (requestRef.current !== request) return;

        const code = getGroupExpenseErrorCode(loadError, "LOAD_FAILED");
        if (MISSING_GROUP_EXPENSE_CODES.includes(code)) {
          setExpense(null);
          setDetail(null);
          setMissing(true);
        } else {
          setError(tr(`errors.${code}`));
        }
      } finally {
        if (requestRef.current === request && mode === "initial") {
          setLoading(false);
        }
      }
    },
    [expenseId, groupsService, service, tr, viewerUid],
  );

  const reload = useCallback(() => {
    void load("initial");
  }, [load]);

  const hasFocusedOnce = useRef(false);

  // An edit saved from the form or another device must be visible on return.
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      void load("refresh");
    }, [load]),
  );

  return { expense, detail, loading, error, missing, reload };
}
