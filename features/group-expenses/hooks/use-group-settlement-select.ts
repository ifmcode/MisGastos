import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";

import type { GroupDebt } from "../types/group-balance.types";

export interface UseGroupSettlementSelectOptions {
  /** Group of the route; the debt step always belongs to one group. */
  groupId: string;
}

/**
 * Row action of the debt step: pushes the same settle route with the chosen
 * pair, so the back action returns to the list instead of the group detail.
 */
export function useGroupSettlementSelect({
  groupId,
}: UseGroupSettlementSelectOptions): (debt: GroupDebt) => void {
  const router = useRouter();

  return useCallback(
    (debt: GroupDebt) => {
      if (!groupId) return;

      const query = [
        `currency=${encodeURIComponent(debt.currency)}`,
        `from=${encodeURIComponent(debt.fromUserId)}`,
        `to=${encodeURIComponent(debt.toUserId)}`,
      ].join("&");
      router.push(
        `/social/groups/${encodeURIComponent(groupId)}/settle?${query}` as Href,
      );
    },
    [groupId, router],
  );
}
