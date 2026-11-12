import { Transfer } from "../types/transfer.types";
import { sortTransfersByDate } from "./transfer-sort";

export interface TransferHistoryEmptyCopy {
  titleKey: string;
  messageKey: string;
}

/**
 * Returns every visible transfer exactly once, newest first. The repository
 * already hides soft-deleted records, but the history view keeps the guarantee
 * even if a caller passes a mixed or duplicated collection.
 */
export function getTransferHistoryItems(
  transfers: readonly Transfer[],
): Transfer[] {
  const seen = new Set<string>();
  const visible: Transfer[] = [];

  for (const transfer of transfers) {
    if (transfer.deletedAt || seen.has(transfer.id)) continue;

    seen.add(transfer.id);
    visible.push(transfer);
  }

  return sortTransfersByDate(visible);
}

export function getTransferHistoryEmptyCopy(): TransferHistoryEmptyCopy {
  return {
    titleKey: "emptyTitle",
    messageKey: "emptyMessage",
  };
}
