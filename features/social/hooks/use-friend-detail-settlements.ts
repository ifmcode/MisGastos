import { useMemo } from "react";

import type { Friend } from "@/features/friends/types/friend.types";
import { useSettlementsList } from "@/features/settlements/hooks/use-settlements-list";
import type { Settlement } from "@/features/settlements/types/settlement.types";
import { getPairSettlements } from "@/features/settlements/utils/settlement-latest";

export interface UseFriendDetailSettlementsOptions {
  viewerUid: string | undefined;
  friend: Friend | null;
}

export interface FriendDetailSettlementsController {
  settlements: Settlement[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Settlements of the friend detail: the pair list and the shared list refresh.
 * The pair is filtered in memory from the viewer's participant-scoped list, so
 * no extra query is added.
 */
export function useFriendDetailSettlements({
  viewerUid,
  friend,
}: UseFriendDetailSettlementsOptions): FriendDetailSettlementsController {
  const list = useSettlementsList({ viewerUid });

  const settlements = useMemo(
    () =>
      getPairSettlements(list.settlements, viewerUid ?? "", friend?.uid ?? ""),
    [friend?.uid, list.settlements, viewerUid],
  );

  return {
    settlements,
    loading: list.loading,
    error: list.error,
    reload: list.reload,
  };
}
