import { useCallback } from "react";

import type { Settlement } from "../types/settlement.types";
import { useSettlementsWrite } from "./use-settlements-write";

export interface SettlementDeletionController {
  /** True while a delete is in flight, so the header actions disable. */
  pending: boolean;
  error: string | null;
  /** Resolves true only when the settlement was deleted. */
  deleteSettlement: (settlement: Settlement | null) => Promise<boolean>;
}

/**
 * Single-flight soft delete of a settlement. The caller owns the confirmation,
 * so the route detail reuses the shared delete dialog and keeps its error
 * banner (for example `SETTLEMENT_HAS_RECEIVER_MOVEMENT`) on screen.
 */
export function useSettlementDeletion({
  viewerUid,
}: {
  viewerUid: string;
}): SettlementDeletionController {
  const write = useSettlementsWrite();

  const deleteSettlement = useCallback(
    async (settlement: Settlement | null) => {
      if (!settlement) return false;

      return write.remove(viewerUid, settlement.id);
    },
    [viewerUid, write.remove],
  );

  return {
    pending: write.submitting,
    error: write.actionError,
    deleteSettlement,
  };
}
