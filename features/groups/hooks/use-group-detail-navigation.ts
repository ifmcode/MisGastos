import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo } from "react";

export interface GroupDetailNavigation {
  /** Opens one expense of this group; the row carries only its id. */
  openExpense: (expenseId: string) => void;
  /** Opens the settle route without a pair; the route shows the debt step. */
  openSettle: () => void;
  openSettlement: (settlementId: string) => void;
}

/** Destinations of the group detail, kept out of the screen component. */
export function useGroupDetailNavigation({
  groupId,
}: {
  groupId: string;
}): GroupDetailNavigation {
  const router = useRouter();

  const openExpense = useCallback(
    (expenseId: string) => {
      if (!groupId) return;

      const expense = encodeURIComponent(expenseId);
      const group = encodeURIComponent(groupId);
      router.push(`/social/group-expenses/${expense}?groupId=${group}` as Href);
    },
    [groupId, router],
  );

  const openSettle = useCallback(() => {
    if (!groupId) return;

    router.push(
      `/social/groups/${encodeURIComponent(groupId)}/settle` as Href,
    );
  }, [groupId, router]);

  const openSettlement = useCallback(
    (settlementId: string) => {
      router.push(
        `/social/group-settlements/${encodeURIComponent(settlementId)}` as Href,
      );
    },
    [router],
  );

  return useMemo(
    () => ({ openExpense, openSettle, openSettlement }),
    [openExpense, openSettle, openSettlement],
  );
}
