import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo } from "react";

import type { GroupExpense } from "@/features/group-expenses/types/group-expense.types";
import type { GroupSettlement } from "@/features/group-expenses/types/group-settlement.types";

export interface GroupDetailNavigation {
  openExpense: (expense: GroupExpense) => void;
  /** Opens the settle route without a pair; the route shows the debt step. */
  openSettle: () => void;
  openSettlement: (settlement: GroupSettlement) => void;
}

/** Destinations of the group detail, kept out of the screen component. */
export function useGroupDetailNavigation({
  groupId,
}: {
  groupId: string;
}): GroupDetailNavigation {
  const router = useRouter();

  const openExpense = useCallback(
    (expense: GroupExpense) => {
      const group = encodeURIComponent(expense.groupId);
      router.push(
        `/social/group-expenses/${expense.id}?groupId=${group}` as Href,
      );
    },
    [router],
  );

  const openSettle = useCallback(() => {
    if (!groupId) return;

    router.push(
      `/social/groups/${encodeURIComponent(groupId)}/settle` as Href,
    );
  }, [groupId, router]);

  const openSettlement = useCallback(
    (settlement: GroupSettlement) => {
      router.push(
        `/social/group-settlements/${encodeURIComponent(settlement.id)}` as Href,
      );
    },
    [router],
  );

  return useMemo(
    () => ({ openExpense, openSettle, openSettlement }),
    [openExpense, openSettle, openSettlement],
  );
}
