import { Transfer } from "../types/transfer.types";

export interface TransferDetailState {
  selectedId: string | null;
}

export type TransferDetailAction =
  | { type: "open"; transferId: string }
  | { type: "close" };

export const INITIAL_TRANSFER_DETAIL_STATE: TransferDetailState = {
  selectedId: null,
};

/** Owns which transfer is shown in the read-only detail view. */
export function transferDetailReducer(
  state: TransferDetailState,
  action: TransferDetailAction,
): TransferDetailState {
  switch (action.type) {
    case "open":
      return { selectedId: action.transferId };
    case "close":
      return INITIAL_TRANSFER_DETAIL_STATE;
    default:
      return state;
  }
}

/** Resolves the selected transfer from the live collection, or null if it is gone. */
export function findTransferForDetail(
  transfers: readonly Transfer[],
  selectedId: string | null,
): Transfer | null {
  if (!selectedId) return null;

  return transfers.find((transfer) => transfer.id === selectedId) ?? null;
}
