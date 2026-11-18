import { useCallback, useMemo, useState } from "react";

import type { Friend } from "@/features/friends/types/friend.types";
import { useSettlementsList } from "@/features/settlements/hooks/use-settlements-list";
import type { Settlement } from "@/features/settlements/types/settlement.types";
import { isPairFullySettled } from "@/features/settlements/utils/settlement-debt";
import { filterActiveSettlements } from "@/features/settlements/utils/settlement-ledger";
import {
  getLatestSettlement,
  getPairSettlements,
} from "@/features/settlements/utils/settlement-latest";

export interface UseFriendDetailSettlementsOptions {
  viewerUid: string | undefined;
  friend: Friend | null;
}

export interface FriendDetailSettlementsController {
  /** Latest active settlement, shown above the pair expenses. */
  latest: Settlement | null;
  settlements: Settlement[];
  activeCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reload: () => void;
  /** True when the pair owes nothing in any currency and a settlement exists. */
  canCollapseExpenses: boolean;
  /** False only in the collapsible full-settlement state. */
  showExpenses: boolean;
  toggleExpenses: () => void;
}

/**
 * Settlements of the friend detail: the latest message, the full-settlement
 * collapse state and the shared list refresh. The pair is filtered in memory
 * from the viewer's participant-scoped list, so no extra query is added.
 */
export function useFriendDetailSettlements({
  viewerUid,
  friend,
}: UseFriendDetailSettlementsOptions): FriendDetailSettlementsController {
  const list = useSettlementsList({ viewerUid });
  const [expensesVisible, setExpensesVisible] = useState(false);

  const settlements = useMemo(
    () =>
      getPairSettlements(list.settlements, viewerUid ?? "", friend?.uid ?? ""),
    [friend?.uid, list.settlements, viewerUid],
  );
  const activeCount = useMemo(
    () => filterActiveSettlements(settlements).length,
    [settlements],
  );
  const latest = useMemo(() => getLatestSettlement(settlements), [settlements]);
  const canCollapseExpenses =
    friend !== null && isPairFullySettled(friend.balances) && activeCount > 0;

  const toggleExpenses = useCallback(() => {
    if (!canCollapseExpenses) return;

    setExpensesVisible((current) => !current);
  }, [canCollapseExpenses]);

  return {
    latest,
    settlements,
    activeCount,
    loading: list.loading,
    error: list.error,
    refresh: list.refresh,
    reload: list.reload,
    canCollapseExpenses,
    showExpenses: !canCollapseExpenses || expensesVisible,
    toggleExpenses,
  };
}
